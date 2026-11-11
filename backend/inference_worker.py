"""Private stdin/stdout worker. Exiting releases Python allocators and CUDA."""
import contextlib
import json
from pathlib import Path
import sys
import threading
import time

def emit(event):
    sys.__stdout__.write(json.dumps(event,ensure_ascii=False)+'\n');sys.__stdout__.flush()

def main():
    payload=json.loads(sys.stdin.readline())
    with contextlib.redirect_stdout(sys.stderr):
        import main as studio
        from generation_backends import effective_prompt
        from model_catalog import MODELS
        from PIL.PngImagePlugin import PngInfo
        request=studio.Generation(**payload['request'])
        output=Path(payload['output_dir']);output.mkdir(parents=True,exist_ok=True)
        try:
            for index,image_id in enumerate(payload['image_ids']):
                seed=(payload['base_seed']+index)%4294967296;started=time.perf_counter()
                image,metrics=studio.animagine_image(request,seed,threading.Event(),lambda status:emit({'event':'status','status':status,'seed':seed}),lambda step:emit({'event':'progress','completed_steps':index*request.steps+step}))
                metadata=request.model_dump(exclude={'adult_confirmed'})
                metadata.update(id=image_id,seed=seed,effective_prompt=effective_prompt(request),created_at=time.time(),seconds=round(time.perf_counter()-started,2),batch_id=payload['image_ids'][0],batch_index=index+1,character_mode='shared_prompt_characters_first',**metrics)
                if request.engine=='wai':metadata['checkpoint_sha256']=MODELS['wai']['sha256']
                else:metadata['model_revision']=(studio.MODEL/'REVISION.txt').read_text().strip() if (studio.MODEL/'REVISION.txt').exists() else 'unknown'
                info=PngInfo();info.add_text('mystikal',json.dumps(metadata,ensure_ascii=False))
                image.save(output/(image_id+'.png'),pnginfo=info);image.close()
                temporary=output/(image_id+'.json.tmp');temporary.write_text(json.dumps(metadata,ensure_ascii=False,indent=2),encoding='utf-8');temporary.replace(output/(image_id+'.json'))
                emit({'event':'result','metadata':metadata})
        finally:studio.release_pipeline()

if __name__=='__main__':
    try:main()
    except Exception as error:
        emit({'event':'error','message':str(error)[:1500]});sys.exit(1)
