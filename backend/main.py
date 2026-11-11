"""Local-only SDXL API. Start with one uvicorn worker."""
import gc
import json
import os
import secrets
import threading
import time
import uuid
from pathlib import Path
from typing import Literal

os.environ.setdefault('HF_HUB_OFFLINE', '1')
os.environ.setdefault('TRANSFORMERS_OFFLINE', '1')
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import privacy
from pydantic import BaseModel, Field, model_validator

ROOT = Path(__file__).resolve().parent
MODEL = ROOT / 'models' / 'animagine-xl-4.0'
OUTPUT = ROOT / 'outputs'
OUTPUT.mkdir(exist_ok=True)
MODEL_ID = 'cagliostrolab/animagine-xl-4.0'
app = FastAPI(title='Mystikal AI local')
app.add_middleware(CORSMiddleware, allow_origins=['http://127.0.0.1:5173', 'http://localhost:5173'], allow_methods=['GET', 'POST'], allow_headers=['Content-Type'], allow_credentials=True)
app.include_router(privacy.router)

@app.middleware('http')
async def local_api_boundary(request, call_next):
    if request.method not in ('GET','HEAD','OPTIONS'):
        origin=request.headers.get('origin')
        if origin and origin not in ('http://127.0.0.1:5173','http://localhost:5173','http://127.0.0.1:8000','http://localhost:8000'):
            return JSONResponse({'detail':'Origen no permitido.'},status_code=403)
    response=await call_next(request)
    if request.url.path.startswith('/api/'):
        response.headers['Cache-Control']='no-store'
    return response
lock = threading.Lock()
state_lock = threading.Lock()
jobs = {}
active = None
pipe = None
prompt_cache = {}

class Character(BaseModel):
    name: str = Field(default='', max_length=100)
    description: str = Field(max_length=1500)

class Generation(BaseModel):
    prompt: str = Field(min_length=1, max_length=6000)
    negative_prompt: str = Field(default='', max_length=6000)
    characters: list[Character] = Field(default_factory=list, max_length=6)
    width: int = Field(default=1024, ge=512, le=1216)
    height: int = Field(default=1024, ge=512, le=1216)
    steps: int = Field(default=28, ge=1, le=50)
    guidance: float = Field(default=5, ge=1.1, le=10)
    seed: int = Field(default=-1, ge=-1, le=4294967295)
    sampler: Literal['euler_a', 'euler'] = 'euler_a'
    nsfw: bool = False
    artist: str = Field(default='', max_length=200)

    @model_validator(mode='after')
    def valid_size(self):
        if not self.prompt.strip():
            raise ValueError('El Base prompt es obligatorio.')
        if self.width % 64 or self.height % 64 or self.width * self.height > 1048576:
            raise ValueError('Usa múltiplos de 64 y como máximo 1.048.576 píxeles.')
        return self

class Cancelled(Exception):
    pass

def update(job_id, **values):
    with state_lock:
        jobs[job_id].update(values)

def load_pipeline():
    global pipe
    if pipe is not None:
        return pipe
    import torch
    from diffusers import StableDiffusionXLPipeline
    if not torch.cuda.is_available():
        raise RuntimeError('CUDA no está disponible. Instala PyTorch cu128 y verifica el controlador NVIDIA.')
    if not (MODEL / 'model_index.json').exists():
        raise RuntimeError('Modelo no instalado. Ejecuta backend/download_model.py con conexión.')
    loaded = StableDiffusionXLPipeline.from_pretrained(str(MODEL), torch_dtype=torch.float16, use_safetensors=True, local_files_only=True, add_watermarker=False)
    # Model offload keeps only the active component on GPU. VAE tiling reduces decode peaks.
    loaded.enable_model_cpu_offload()
    loaded.enable_vae_tiling()
    loaded.enable_vae_slicing()
    pipe = loaded
    return pipe

def run(job_id, request, cancelled):
    global active, pipe
    started = time.perf_counter()
    model_warm = pipe is not None
    try:
        import torch
        from diffusers import EulerAncestralDiscreteScheduler, EulerDiscreteScheduler
        update(job_id, status='loading')
        pipeline = load_pipeline()
        load_seconds = time.perf_counter() - started
        if cancelled.is_set():
            raise Cancelled()
        full_prompt = ', '.join(([request.artist.strip()] if request.artist.strip() else []) + [request.prompt.strip()] + [c.description.strip() for c in request.characters if c.description.strip()])
        # Reject truncation instead of silently discarding character or negative attributes.
        for tokenizer in (pipeline.tokenizer, pipeline.tokenizer_2):
            for text in (full_prompt, request.negative_prompt):
                count = len(tokenizer(text, truncation=False).input_ids)
                if count > tokenizer.model_max_length:
                    raise RuntimeError(f'Prompt demasiado largo ({count} tokens; máximo {tokenizer.model_max_length}). Acorta el texto y las tarjetas. No se ha truncado.')
        scheduler = EulerAncestralDiscreteScheduler if request.sampler == 'euler_a' else EulerDiscreteScheduler
        pipeline.scheduler = scheduler.from_config(pipeline.scheduler.config)
        seed = secrets.randbelow(4294967296) if request.seed == -1 else request.seed
        update(job_id, status='encoding', seed=seed)
        encoding_started = time.perf_counter()
        cache_key = (full_prompt, request.negative_prompt)
        cache_hit = cache_key in prompt_cache
        with torch.inference_mode():
            if cache_hit:
                embeddings = tuple(value.to(pipeline._execution_device) for value in prompt_cache[cache_key])
            else:
                embeddings = pipeline.encode_prompt(prompt=full_prompt, negative_prompt=request.negative_prompt, device=pipeline._execution_device, do_classifier_free_guidance=True)
                if len(prompt_cache) >= 4:
                    del prompt_cache[next(iter(prompt_cache))]
                prompt_cache[cache_key] = tuple(value.detach().cpu() for value in embeddings)
        torch.cuda.synchronize()
        encoding_seconds = time.perf_counter() - encoding_started
        update(job_id, status='running')
        inference_started = time.perf_counter()
        last_step_at = inference_started
        torch.cuda.reset_peak_memory_stats()
        def callback(_pipeline, step, _timestep, kwargs):
            nonlocal last_step_at
            if cancelled.is_set():
                raise Cancelled()
            torch.cuda.synchronize()
            last_step_at = time.perf_counter()
            update(job_id, completed_steps=step + 1, status='decoding' if step + 1 == request.steps else 'running')
            return kwargs
        with torch.inference_mode():
            image = pipeline(prompt_embeds=embeddings[0], negative_prompt_embeds=embeddings[1], pooled_prompt_embeds=embeddings[2], negative_pooled_prompt_embeds=embeddings[3], width=request.width, height=request.height, num_inference_steps=request.steps, guidance_scale=request.guidance, generator=torch.Generator('cpu').manual_seed(seed), num_images_per_prompt=1, callback_on_step_end=callback).images[0]
        torch.cuda.synchronize()
        if cancelled.is_set():
            raise Cancelled()
        inference_seconds = time.perf_counter() - inference_started
        metadata = request.model_dump()
        metadata.update(id=job_id, seed=seed, model=MODEL_ID, effective_prompt=full_prompt, created_at=time.time(), seconds=round(time.perf_counter()-started, 2), peak_vram_mib=round(torch.cuda.max_memory_allocated()/1048576), torch_version=torch.__version__, cuda_version=torch.version.cuda, character_mode='shared_prompt', model_warm=model_warm, prompt_cache_hit=cache_hit, load_seconds=round(load_seconds, 2), encoding_seconds=round(encoding_seconds, 2), inference_seconds=round(inference_seconds, 2), denoise_seconds=round(last_step_at-inference_started, 2), decode_seconds=round(time.perf_counter()-last_step_at, 2))
        revision_file = MODEL / 'REVISION.txt'
        metadata['model_revision'] = revision_file.read_text().strip() if revision_file.exists() else 'unknown'
        from PIL.PngImagePlugin import PngInfo
        info = PngInfo()
        info.add_text('mystikal', json.dumps(metadata, ensure_ascii=False))
        owner = jobs[job_id]['_owner']
        image_path = privacy.output_path(owner, request.nsfw, job_id, '.png')
        image.save(image_path, pnginfo=info)
        temporary = privacy.output_path(owner, request.nsfw, job_id, '.json.tmp')
        temporary.write_text(json.dumps(metadata, ensure_ascii=False, indent=2), encoding='utf-8')
        temporary.replace(privacy.output_path(owner, request.nsfw, job_id, '.json'))
        privacy.register_image(metadata, owner)
        update(job_id, status='done', result=privacy.present(privacy.image_row(job_id)))
    except Cancelled:
        update(job_id, status='cancelled')
        pipe = None
        prompt_cache.clear()
    except Exception as error:
        message = str(error)
        if 'out of memory' in message.lower():
            message = 'VRAM insuficiente. Cierra otras aplicaciones GPU o usa 768 × 768. Reinicia el backend si persiste.'
        update(job_id, status='error', error=message)
        pipe = None
        prompt_cache.clear()
    finally:
        gc.collect()
        try:
            import torch
            if torch.cuda.is_available():
                torch.cuda.empty_cache()
        finally:
            with state_lock:
                active = None
            lock.release()

@app.get('/api/status')
def status(http_request: Request):
    user = privacy.session_user(http_request, required=False)
    visible_job = active if user and active and jobs.get(active, {}).get('_owner') == user['id'] else None
    return {'model': MODEL_ID, 'model_installed': (MODEL / 'model_index.json').exists(), 'active_job': visible_job, 'offline': True, 'character_mode': 'shared_prompt'}

@app.post('/api/generate', status_code=202)
def generate(request: Generation, http_request: Request):
    global active
    user = privacy.session_user(http_request)
    if not lock.acquire(blocking=False):
        raise HTTPException(409, 'Hay una generación activa. Espera o cancélala.')
    job_id = str(uuid.uuid4())
    event = threading.Event()
    with state_lock:
        # Keep a bounded in-memory history; results are durable on disk.
        if len(jobs) >= 100:
            del jobs[next(iter(jobs))]
        jobs[job_id] = {'id': job_id, 'status': 'queued', 'completed_steps': 0, 'steps': request.steps, '_started_at': time.perf_counter(), '_owner': user['id'], '_cancel': event}
        active = job_id
    threading.Thread(target=run, args=(job_id, request, event), daemon=True).start()
    return {'id': job_id}

@app.get('/api/jobs/{job_id}')
def job(job_id: str, http_request: Request):
    user = privacy.session_user(http_request)
    with state_lock:
        if job_id not in jobs or jobs[job_id].get('_owner') != user['id']:
            raise HTTPException(404, 'Tarea no encontrada; el backend pudo reiniciarse.')
        result = {k: v for k, v in jobs[job_id].items() if not k.startswith('_')}
        result['elapsed_seconds'] = round(time.perf_counter() - jobs[job_id]['_started_at'], 1)
        return result

@app.post('/api/jobs/{job_id}/cancel')
def cancel(job_id: str, http_request: Request):
    user = privacy.session_user(http_request)
    with state_lock:
        if job_id not in jobs or jobs[job_id].get('_owner') != user['id']:
            raise HTTPException(404, 'Tarea no encontrada.')
        jobs[job_id]['_cancel'].set()
    return {'message': 'Cancelación solicitada; se aplica al finalizar el paso o la carga actual.'}
