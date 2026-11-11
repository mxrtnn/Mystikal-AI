"""Owner-operated outgoing GPU connector; no inbound ports or local galleries."""
import argparse
import getpass
import io
import json
import uuid
from pathlib import Path
import tempfile
import threading
import time
from urllib.parse import urlparse
import requests
from PIL import Image
from inference_process import run_isolated
from gpu_gate import GpuBusy
from model_catalog import installed

DEFAULT_SERVER='https://mystikal-ai.onrender.com'
TEMP_ROOT=Path(__file__).resolve().parent/'data'/'public-worker-temp'

def json_call(session,server,path,body=None):
    response=session.request('POST' if body is not None else 'GET',server+'/api/studio/'+path,json=body,timeout=(15,45))
    if response.status_code==401:raise PermissionError('La sesión del conector caducó. Reinícialo e inicia sesión de nuevo.')
    if not response.ok:raise RuntimeError(f'El servicio respondió HTTP {response.status_code}.')
    return response.json()

def render_job(session,server,job):
    stop=threading.Event();finished=threading.Event();progress={'value':0}
    heartbeat=requests.Session();heartbeat.cookies.update(session.cookies)
    def keep_alive():
        failures=0
        while not finished.is_set():
            try:
                json_call(heartbeat,server,f'worker/{job["id"]}/heartbeat',{'lease':job['lease'],'progress':progress['value']});failures=0
            except (requests.RequestException,RuntimeError,PermissionError):
                failures+=1
                if failures>=3:stop.set();return
            finished.wait(15)
    thread=threading.Thread(target=keep_alive,daemon=True);thread.start()
    try:
        # Validate the broker's fixed capability envelope; it cannot request a
        # local file, arbitrary adapter/model, NSFW flag, or a batch.
        if str(uuid.UUID(job['id']))!=job['id'] or len(job['lease'])!=64 or any(c not in '0123456789abcdef' for c in job['lease']):raise RuntimeError('Asignación no válida.')
        request=job['request']
        if request.get('engine')!='wai' or request.get('count')!=1 or request.get('nsfw') is not False:raise RuntimeError('Solicitud pública no admitida.')
        completed=[]
        def event(value):
            if value.get('event')=='progress':progress['value']=min(99,round(100*value['completed_steps']/request['steps']))
            if value.get('event')=='result':completed.append(value['metadata'])
        directory=TEMP_ROOT;directory.mkdir(parents=True,exist_ok=True)
        with tempfile.TemporaryDirectory(dir=directory) as temporary:
            payload={'request':request,'output_dir':temporary,'image_ids':[job['id']],'base_seed':int.from_bytes(__import__('secrets').token_bytes(4),'big')}
            deadline=time.monotonic()+15*60
            while True:
                try:run_isolated(payload,stop,event);break
                except GpuBusy:
                    if time.monotonic()>deadline or stop.wait(2):raise RuntimeError('La GPU no quedó disponible a tiempo.')
            if len(completed)!=1:raise RuntimeError('La imagen no se completó.')
            clean=io.BytesIO()
            with Image.open(Path(temporary)/(job['id']+'.png')) as image:
                image.info.clear();image.save(clean,format='PNG')
            response=session.post(server+f'/api/studio/worker/{job["id"]}/complete',data=clean.getvalue(),headers={'Content-Type':'image/png','X-Worker-Lease':job['lease']},timeout=(15,60))
            if not response.ok:raise RuntimeError(f'No se pudo confirmar la imagen: HTTP {response.status_code}.')
    except Exception as error:
        print('Solicitud no completada:',type(error).__name__,flush=True)
        try:json_call(session,server,f'worker/{job["id"]}/fail',{'lease':job['lease'],'code':'prompt_too_long' if 'tokens' in str(error) else 'generation_failed'})
        except (requests.RequestException,RuntimeError,PermissionError):pass
    finally:finished.set();thread.join(timeout=50);heartbeat.close()

def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--server',default=DEFAULT_SERVER)
    parser.add_argument('--email',default='martinjara580@gmail.com')
    args=parser.parse_args();server=args.server.rstrip('/');url=urlparse(server)
    if url.scheme!='https' and not (url.scheme=='http' and url.hostname in ('127.0.0.1','localhost')):raise SystemExit('El servidor debe usar HTTPS.')
    if not installed('wai'):raise SystemExit('Instala WAI antes de conectar la GPU pública.')
    password=getpass.getpass('Contraseña de tu cuenta Mystikal (no se guarda): ')
    with requests.Session() as session:
        response=session.post(server+'/api/login',json={'email':args.email,'password':password},timeout=60);password=''
        if not response.ok:raise SystemExit('No se pudo iniciar sesión. Revisa tus credenciales.')
        access=json_call(session,server,'access')
        if not access.get('owner'):raise SystemExit('Esta cuenta no es la propietaria autorizada del conector.')
        print('GPU pública conectada. Ctrl+C para desconectar. No se comparte tu galería local.',flush=True)
        while True:
            try:
                job=json_call(session,server,'worker/claim',{}).get('job')
                if job:render_job(session,server,job)
                else:time.sleep(4)
            except PermissionError as error:raise SystemExit(str(error))
            except (requests.RequestException,RuntimeError):
                print('Esperando conexión con el servidor…',flush=True);time.sleep(8)

if __name__=='__main__':
    try:main()
    except KeyboardInterrupt:print('\nConector desconectado. Las tareas sin confirmar recuperan su prueba al caducar la asignación.')
