"""Provider adapters. FLUX calls are made only after explicit request consent."""
import io
import os
import time
from pathlib import Path
from urllib.parse import urlparse
import requests

class Cancelled(Exception): pass

STYLE_PROMPTS={
 'original':'', 'anime':'anime illustration, expressive lineart',
 'retro':'1990s anime aesthetic, retro colors, film grain',
 'realistic':'photorealistic, natural lighting, realistic materials',
 '3d':'3d render, physically based materials, studio lighting',
 '2d':'2d illustration, clean lineart, flat colors'
}

def effective_prompt(request):
    return ', '.join(part for part in [request.artist.strip(),STYLE_PROMPTS[request.style],request.prompt.strip()]+[character.description.strip() for character in request.characters] if part)

def replicate_token():
    token=os.environ.get('REPLICATE_API_TOKEN','').strip()
    if token: return token
    path=Path(__file__).resolve().parent/'.env'
    # Read only this existing server-side key; never include it in a response or log.
    if path.exists():
        for line in path.read_text(encoding='utf-8-sig').splitlines():
            key,separator,value=line.partition('=')
            if separator and key.strip()=='REPLICATE_API_TOKEN': return value.strip().strip('"').strip("'")
    return ''

def flux_image(request,seed,cancelled,report):
    if cancelled.is_set(): raise Cancelled()
    token=replicate_token()
    if not token: raise RuntimeError('Falta REPLICATE_API_TOKEN en el backend.')
    headers={'Authorization':f'Bearer {token}','Content-Type':'application/json'}
    endpoint='https://api.replicate.com/v1/models/black-forest-labs/flux-1.1-pro/predictions'
    payload={'input':{'prompt':effective_prompt(request),'seed':seed,'aspect_ratio':'custom','width':request.width,'height':request.height,'output_format':'png','prompt_upsampling':False,'safety_tolerance':2}}
    report('remote_running')
    started=time.perf_counter()
    with requests.Session() as session:
        response=session.post(endpoint,headers=headers,json=payload,timeout=40)
        if response.status_code not in (200,201,202):
            raise RuntimeError(f'Replicate rechazó la solicitud (HTTP {response.status_code}). Revisa clave, saldo y parámetros.')
        prediction=response.json()
        prediction_id=str(prediction.get('id',''))
        if not prediction_id or not prediction_id.replace('-','').isalnum(): raise RuntimeError('Replicate no devolvió una predicción válida.')
        status_url='https://api.replicate.com/v1/predictions/'+prediction_id
        while True:
            if cancelled.is_set():
                session.post(status_url+'/cancel',headers=headers,timeout=20)
                raise Cancelled()
            state=prediction.get('status')
            if state=='succeeded': break
            if state in ('failed','canceled'):
                raise RuntimeError('La predicción no terminó correctamente. Revisa su estado en Replicate.')
            if time.perf_counter()-started>600:
                session.post(status_url+'/cancel',headers=headers,timeout=20)
                raise RuntimeError('Replicate superó el tiempo máximo de espera.')
            if cancelled.wait(1): continue
            response=session.get(status_url,headers=headers,timeout=30)
            response.raise_for_status()
            prediction=response.json()
        output=prediction.get('output')
        url=output[0] if isinstance(output,list) and output else output
        parsed=urlparse(url if isinstance(url,str) else '')
        host=parsed.hostname or ''
        if parsed.scheme!='https' or not (host=='replicate.delivery' or host.endswith('.replicate.delivery')):
            raise RuntimeError('El proveedor devolvió una URL de imagen inesperada.')
        # No API authorization header is sent to the image CDN.
        with requests.get(url,stream=True,timeout=40,allow_redirects=False) as download:
            download.raise_for_status()
            if download.status_code!=200: raise RuntimeError('La imagen no se pudo descargar.')
            content=bytearray()
            for chunk in download.iter_content(65536):
                if cancelled.is_set(): raise Cancelled()
                content.extend(chunk)
                if len(content)>20*1024*1024: raise RuntimeError('La imagen supera el tamaño máximo permitido.')
    from PIL import Image
    image=Image.open(io.BytesIO(content))
    if image.width*image.height>2_000_000: raise RuntimeError('El proveedor devolvió una resolución inesperada.')
    image=image.convert('RGB')
    return image,{'model':'black-forest-labs/flux-1.1-pro','replicate_prediction_id':prediction_id,'peak_vram_mib':0,'inference_seconds':round(time.perf_counter()-started,2),'applied_settings':{'negative_prompt':None,'steps':None,'guidance':None,'sampler':None,'seed':seed,'safety_tolerance':2}}
