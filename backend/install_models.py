"""Run explicitly to download pinned weights; no paid API or remote Python code."""
import argparse
import hashlib
import json
import shutil
import time
import requests
from model_catalog import MODELS,weight_path,verified,BASE

def install(name,spec):
    if verified(spec):print(name+': ya instalado y verificado.',flush=True);return
    path=weight_path(spec);path.parent.mkdir(parents=True,exist_ok=True)
    partial=path.with_suffix('.part')
    offset=partial.stat().st_size if partial.exists() else 0
    if shutil.disk_usage(path.parent).free<spec['size']-offset+2*1024**3:raise RuntimeError('Espacio insuficiente para '+name)
    print(f'{name}: descarga {spec["size"]/1024**3:.2f} GiB. Fuente: {spec["source"]}',flush=True)
    for attempt in range(4):
        offset=partial.stat().st_size if partial.exists() else 0
        if offset==spec['size']:break
        try:
            with requests.get(spec['url'],headers={'Range':f'bytes={offset}-'} if offset else {},stream=True,timeout=(30,90)) as response:
                response.raise_for_status()
                if offset and (response.status_code!=206 or not response.headers.get('Content-Range','').startswith(f'bytes {offset}-')):
                    if response.status_code==200:offset=0
                    else:raise RuntimeError('El servidor no pudo reanudar la descarga.')
                done=offset;last=0
                with partial.open('ab' if offset else 'wb') as target:
                    for chunk in response.iter_content(4*1024**2):
                        done+=len(chunk)
                        if done>spec['size']:raise RuntimeError('El servidor devolvió un archivo de tamaño inesperado.')
                        target.write(chunk)
                        if time.monotonic()-last>15:
                            print(f'{name}: {done/spec["size"]:.0%}',flush=True);last=time.monotonic()
            if done==spec['size']:break
        except requests.RequestException:
            if attempt==3:raise RuntimeError('Descarga no disponible. No se eluden cuentas, términos ni restricciones; puedes reintentar este comando.')
            print(name+': conexión interrumpida; reintentando.',flush=True)
    if not partial.exists() or partial.stat().st_size!=spec['size']:raise RuntimeError('Descarga incompleta; el .part permite reintentar.')
    digest=hashlib.sha256()
    with partial.open('rb') as source:
        for chunk in iter(lambda:source.read(8*1024**2),b''):digest.update(chunk)
    if digest.hexdigest()!=spec['sha256']:raise RuntimeError('SHA256 no coincide. No se instalará el archivo.')
    from safetensors import safe_open
    with safe_open(partial,framework='pt',device='cpu') as checkpoint:
        if not list(checkpoint.keys()):raise RuntimeError('Checkpoint vacío.')
    partial.replace(path)
    marker={key:spec[key] for key in ('model_id','source','license','sha256','size')}
    marker.update(mtime_ns=path.stat().st_mtime_ns,installed_at=time.time())
    path.with_suffix('.verified.json').write_text(json.dumps(marker,indent=2),encoding='utf-8')
    print(name+': instalado; SHA256 y formato verificados.',flush=True)

if __name__=='__main__':
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('models',nargs='+',choices=['wai'])
    args=parser.parse_args()
    if not (BASE/'model_index.json').exists():raise SystemExit('Instala primero Animagine: se reutilizan únicamente sus configuraciones SDXL y tokenizadores.')
    for name in dict.fromkeys(args.models):install(name,MODELS[name])
