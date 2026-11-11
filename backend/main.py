"""Local generator and authenticated gallery. Start with one uvicorn worker."""
import gc
import json
import os
import secrets
import threading
import time
import uuid
from pathlib import Path
from typing import Literal
os.environ.setdefault('HF_HUB_OFFLINE','1')
os.environ.setdefault('TRANSFORMERS_OFFLINE','1')
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field, model_validator
import privacy
from generation_backends import Cancelled, effective_prompt
from prompt_encoding import encode_long_prompt, prompt_counts, validate_tokens, tokenize_prompts, ENCODING_VERSION
from functools import lru_cache
from model_catalog import MODELS,installed,weight_path,public_catalog
from inference_process import run_isolated,system_resources
ROOT=Path(__file__).resolve().parent
MODEL=ROOT/'models'/'animagine-xl-4.0'
MODEL_ID='cagliostrolab/animagine-xl-4.0'
app=FastAPI(title='Mystikal AI local')
app.add_middleware(CORSMiddleware,allow_origins=['http://127.0.0.1:5173','http://localhost:5173'],allow_methods=['GET','POST'],allow_headers=['Content-Type'],allow_credentials=True)
app.include_router(privacy.router)
@app.middleware('http')
async def local_api_boundary(request,call_next):
    if request.method not in ('GET','HEAD','OPTIONS'):
        origin=request.headers.get('origin')
        if origin and origin not in ('http://127.0.0.1:5173','http://localhost:5173','http://127.0.0.1:8000','http://localhost:8000'):
            return JSONResponse({'detail':'Origen no permitido.'},status_code=403)
    response=await call_next(request)
    if request.url.path.startswith('/api/'): response.headers['Cache-Control']='no-store'
    return response
lock=threading.Lock();state_lock=threading.Lock();jobs={};active=None;pipe=None;pipe_key=None;prompt_cache={}
class Character(BaseModel):
    name:str=Field(default='',max_length=100)
    description:str=Field(max_length=1500)
class Generation(BaseModel):
    prompt:str=Field(min_length=1,max_length=6000)
    negative_prompt:str=Field(default='',max_length=6000)
    characters:list[Character]=Field(default_factory=list,max_length=6)
    width:int=Field(default=1024,ge=512,le=1216)
    height:int=Field(default=1024,ge=512,le=1216)
    steps:int=Field(default=28,ge=1,le=50)
    guidance:float=Field(default=5,ge=1.1,le=10)
    seed:int=Field(default=-1,ge=-1,le=4294967295)
    sampler:Literal['euler_a','euler']='euler_a'
    nsfw:bool=False
    artist:str=Field(default='',max_length=200)
    engine:Literal['animagine','wai']='animagine'
    style:Literal['original','anime','retro','realistic','3d','2d']='original'
    count:int=Field(default=1,ge=1,le=4)
    adult_confirmed:bool=False
    @model_validator(mode='after')
    def validate_request(self):
        if not self.prompt.strip(): raise ValueError('El Base prompt es obligatorio.')
        if self.width%64 or self.height%64 or self.width*self.height>1048576: raise ValueError('Usa múltiplos de 64 y como máximo 1.048.576 píxeles.')
        if self.nsfw and not self.adult_confirmed: raise ValueError('Debes declarar que tienes 18 años o más para activar contenido adulto.')
        return self

def update(job_id,**values):
    with state_lock: jobs[job_id].update(values)

def release_pipeline():
    global pipe,pipe_key
    if pipe is not None: pipe.remove_all_hooks()
    pipe=None;pipe_key=None;prompt_cache.clear();gc.collect()
    import torch
    if torch.cuda.is_available():torch.cuda.empty_cache()

def load_pipeline(engine='animagine'):
    global pipe,pipe_key
    key=engine
    if pipe is not None and pipe_key==key:return pipe
    import torch
    from diffusers import StableDiffusionXLPipeline
    if not torch.cuda.is_available():raise RuntimeError('CUDA no disponible.')
    if not installed(engine):raise RuntimeError('Modelo no instalado o no verificado. Ejecuta '+('backend/download_model.py' if engine=='animagine' else 'backend/install_models.py '+engine))
    release_pipeline()
    if engine=='animagine':
        loaded=StableDiffusionXLPipeline.from_pretrained(str(MODEL),torch_dtype=torch.float16,use_safetensors=True,local_files_only=True,add_watermarker=False)
    else:
        loaded=StableDiffusionXLPipeline.from_single_file(str(weight_path(MODELS[engine])),config=str(MODEL),torch_dtype=torch.float16,local_files_only=True,add_watermarker=False)
    loaded.enable_model_cpu_offload();loaded.enable_vae_tiling();loaded.enable_vae_slicing()
    # Bound decode tiles rather than letting a 1024px VAE tile dominate memory.
    loaded.vae.tile_sample_min_size=512
    loaded.vae.tile_latent_min_size=64
    pipe=loaded;pipe_key=key
    return pipe

@lru_cache(maxsize=1)
def load_tokenizers():
    from transformers import CLIPTokenizer
    return tuple(CLIPTokenizer.from_pretrained(str(MODEL/name),local_files_only=True) for name in ('tokenizer','tokenizer_2'))

class TokenRequest(BaseModel):
    prompt:str=Field(default='',max_length=6000)
    negative_prompt:str=Field(default='',max_length=6000)
    artist:str=Field(default='',max_length=200)
    style:Literal['original','anime','retro','realistic','3d','2d']='original'
    characters:list[Character]=Field(default_factory=list,max_length=6)
    engine:Literal['animagine','wai']='animagine'

@app.post('/api/prompt/tokens')
def count_prompt_tokens(body:TokenRequest,http_request:Request):
    privacy.session_user(http_request)
    if not (MODEL/'tokenizer').exists(): raise HTTPException(503,'Instala el modelo para contar tokens.')
    return prompt_counts(load_tokenizers(),effective_prompt(body),body.negative_prompt)|{'effective_prompt':effective_prompt(body),'character_count':sum(bool(character.description.strip()) for character in body.characters)}

def release_text_encoders(pipeline):
    # A worker only renders one fixed prompt per batch. Once its embeddings
    # exist, SDXL can denoise using them without retaining either CLIP model.
    if pipeline.text_encoder is None and pipeline.text_encoder_2 is None:return
    pipeline.remove_all_hooks()
    pipeline.register_modules(text_encoder=None,text_encoder_2=None)
    gc.collect()
    import torch
    torch.cuda.empty_cache()
    # Keeping the CPU weights and transferring submodules avoids the large
    # whole-UNet GPU->CPU allocation spike before VAE decoding on Windows.
    pipeline.enable_sequential_cpu_offload()

def animagine_image(request,seed,cancelled,report,progress):
    import torch
    from diffusers import EulerAncestralDiscreteScheduler,EulerDiscreteScheduler
    key=request.engine
    started=time.perf_counter();warm=pipe is not None and pipe_key==key;report('loading')
    pipeline=load_pipeline(request.engine);load_seconds=time.perf_counter()-started
    if cancelled.is_set(): raise Cancelled()
    prompt=effective_prompt(request)
    counts=prompt_counts([pipeline.tokenizer,pipeline.tokenizer_2],prompt,request.negative_prompt)
    scheduler=EulerAncestralDiscreteScheduler if request.sampler=='euler_a' else EulerDiscreteScheduler
    pipeline.scheduler=scheduler.from_config(pipeline.scheduler.config)
    report('encoding');encoding_started=time.perf_counter();cache_key=(key,ENCODING_VERSION,prompt,request.negative_prompt);cached=cache_key in prompt_cache
    with torch.inference_mode():
        if cached: embeddings=tuple(value.to(pipeline._execution_device) for value in prompt_cache[cache_key])
        else:
            if pipeline.text_encoder_2 is None:raise RuntimeError('Inicia otra solicitud para usar un prompt distinto.')
            embeddings=encode_long_prompt(pipeline,prompt,request.negative_prompt,pipeline._execution_device)
            if len(prompt_cache)>=4: del prompt_cache[next(iter(prompt_cache))]
            prompt_cache[cache_key]=tuple(value.detach().cpu() for value in embeddings)
    torch.cuda.synchronize();encoding_seconds=time.perf_counter()-encoding_started
    release_text_encoders(pipeline)
    if cancelled.is_set(): raise Cancelled()
    report('running');inference_started=time.perf_counter();last_step_at=inference_started;torch.cuda.reset_peak_memory_stats()
    def callback(_pipeline,step,_timestep,kwargs):
        nonlocal last_step_at
        if cancelled.is_set(): raise Cancelled()
        torch.cuda.synchronize();last_step_at=time.perf_counter();progress(step+1)
        if step+1==request.steps: report('decoding')
        return kwargs
    with torch.inference_mode():
        image=pipeline(prompt_embeds=embeddings[0],negative_prompt_embeds=embeddings[1],pooled_prompt_embeds=embeddings[2],negative_pooled_prompt_embeds=embeddings[3],width=request.width,height=request.height,num_inference_steps=request.steps,guidance_scale=request.guidance,generator=torch.Generator('cpu').manual_seed(seed),num_images_per_prompt=1,callback_on_step_end=callback).images[0]
    torch.cuda.synchronize()
    return image,{'model':MODELS[request.engine]['model_id'],'model_warm':warm,'prompt_cache_hit':cached,'prompt_tokens':counts,'prompt_encoding':ENCODING_VERSION,'load_seconds':round(load_seconds,2),'encoding_seconds':round(encoding_seconds,2),'inference_seconds':round(time.perf_counter()-inference_started,2),'denoise_seconds':round(last_step_at-inference_started,2),'decode_seconds':round(time.perf_counter()-last_step_at,2),'peak_vram_mib':round(torch.cuda.max_memory_allocated()/1048576),'torch_version':torch.__version__,'cuda_version':torch.version.cuda,'applied_settings':{'clip_hidden_layer':-2,'negative_prompt':request.negative_prompt,'steps':request.steps,'guidance':request.guidance,'sampler':request.sampler,'seed':seed}}

def run(job_id,request,cancelled):
    global active
    results=[];saved_ids=set();image_ids=[job_id]+[str(uuid.uuid4()) for _ in range(request.count-1)]
    owner=jobs[job_id]['_owner'];directory=privacy.output_path(owner,request.nsfw,job_id,'.png').parent
    try:
        def handle(event):
            kind=event.get('event')
            if kind=='status':update(job_id,status=event['status'],seed=event['seed'])
            elif kind=='progress':update(job_id,completed_steps=event['completed_steps'])
            elif kind=='memory':update(job_id,worker_private_gib=event['private_gib'],peak_worker_private_gib=max(jobs[job_id].get('peak_worker_private_gib',0),event['private_gib']))
            elif kind=='result':
                metadata=event['metadata']
                if metadata.get('id') not in image_ids or metadata['id'] in saved_ids:raise RuntimeError('Resultado de generación no válido.')
                privacy.register_image(metadata,owner);saved_ids.add(metadata['id'])
                saved=privacy.present(privacy.image_row(metadata['id']));results.append(saved)
                update(job_id,completed_images=len(results),result=saved,results=results.copy())
        seed=secrets.randbelow(4294967296) if request.seed==-1 else request.seed
        run_isolated({'request':request.model_dump(),'output_dir':str(directory),'image_ids':image_ids,'base_seed':seed},cancelled,handle)
        if len(results)!=request.count:raise RuntimeError('El proceso terminó sin completar todas las imágenes.')
        update(job_id,status='done')
    except Cancelled:update(job_id,status='cancelled')
    except Exception as error:
        message=str(error)
        if 'out of memory' in message.lower():message='Memoria insuficiente. Usa 768 × 768. Las imágenes terminadas siguen guardadas.'
        update(job_id,status='error',error=message)
    finally:
        # Only unfinished files created by this job are disposable; never delete
        # registered images or traverse arbitrary directories.
        for image_id in image_ids:
            if image_id in saved_ids:continue
            for suffix in ('.png','.json','.json.tmp'):
                path=directory/(image_id+suffix)
                if path.is_file() and not path.is_symlink():
                    try:path.unlink(missing_ok=True)
                    except OSError:pass
        update(job_id,worker_private_gib=0)
        with state_lock:active=None
        lock.release()

@app.get('/api/status')
def status(http_request:Request):
    user=privacy.session_user(http_request,required=False)
    visible_job=active if user and active and jobs.get(active,{}).get('_owner')==user['id'] else None
    return {'model':MODEL_ID,'model_installed':(MODEL/'model_index.json').exists(),'models':public_catalog(),'memory_policy':'isolated_batch_worker','resources':system_resources(),'active_job':visible_job,'offline':True,'character_mode':'shared_prompt_characters_first'}
@app.post('/api/generate',status_code=202)
def generate(request:Generation,http_request:Request):
    global active
    user=privacy.session_user(http_request)
    privacy.gallery_capacity(user['id'],request.count)
    if (MODEL/'tokenizer').exists():
        try: validate_tokens(*tokenize_prompts(load_tokenizers(),effective_prompt(request),request.negative_prompt))
        except ValueError as error: raise HTTPException(422,str(error))
    if not installed(request.engine):raise HTTPException(503,'Instala primero el modelo: backend/install_models.py '+request.engine)
    resources=system_resources()
    if resources['free_disk_gib']<12 or resources['available_ram_gib']<3:raise HTTPException(503,'Falta espacio libre o RAM para iniciar de forma segura. Se requieren 12 GiB de disco y 3 GiB de RAM disponibles.')
    if not lock.acquire(blocking=False): raise HTTPException(409,'Hay una generación activa. Espera o cancélala.')
    job_id=str(uuid.uuid4());event=threading.Event()
    with state_lock:
        if len(jobs)>=100: del jobs[next(iter(jobs))]
        jobs[job_id]={'id':job_id,'status':'queued','completed_steps':0,'steps':request.steps*request.count,'completed_images':0,'total_images':request.count,'_started_at':time.perf_counter(),'_owner':user['id'],'_cancel':event};active=job_id
    threading.Thread(target=run,args=(job_id,request,event),daemon=True).start()
    return {'id':job_id}
@app.get('/api/jobs/{job_id}')
def job(job_id:str,http_request:Request):
    user=privacy.session_user(http_request)
    with state_lock:
        if job_id not in jobs or jobs[job_id].get('_owner')!=user['id']: raise HTTPException(404,'Tarea no encontrada.')
        result={key:value for key,value in jobs[job_id].items() if not key.startswith('_')};result['elapsed_seconds']=round(time.perf_counter()-jobs[job_id]['_started_at'],1);return result
@app.post('/api/jobs/{job_id}/cancel')
def cancel(job_id:str,http_request:Request):
    user=privacy.session_user(http_request)
    with state_lock:
        if job_id not in jobs or jobs[job_id].get('_owner')!=user['id']: raise HTTPException(404,'Tarea no encontrada.')
        jobs[job_id]['_cancel'].set()
    return {'message':'Cancelación solicitada. El proceso de generación se cerrará y las imágenes terminadas se conservarán.'}
