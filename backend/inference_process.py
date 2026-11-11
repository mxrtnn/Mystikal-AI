"""One bounded inference process per batch; the API never loads CUDA models."""
import json
import os
from pathlib import Path
import queue
import shutil
import subprocess
import sys
import threading
import time
import psutil
from generation_backends import Cancelled
from process_budget import ProcessBudget,process_tree,private_memory

GIB=1024**3
ROOT=Path(__file__).resolve().parent

def pagefile_bytes():
    try:return Path(os.environ.get('SystemDrive','C:')+'/', 'pagefile.sys').stat().st_size
    except OSError:return 0

def system_resources():
    return {'free_disk_gib':round(shutil.disk_usage(ROOT).free/GIB,2),
            'available_ram_gib':round(psutil.virtual_memory().available/GIB,2),
            'pagefile_gib':round(pagefile_bytes()/GIB,2)}

def guard_reason(free_disk,available_ram,private_bytes,pagefile_growth,total_ram):
    if free_disk<8*GIB:return 'Generación detenida para proteger el disco: quedan menos de 8 GiB libres.'
    if available_ram<3*GIB:return 'Generación detenida: quedan menos de 3 GiB de RAM disponible.'
    if private_bytes>min(16*GIB,total_ram*.5):return 'Generación detenida: el proceso superó el presupuesto de memoria de Mystikal.'
    if pagefile_growth>4*GIB:return 'Generación detenida: la memoria virtual de Windows creció más de 4 GiB durante la solicitud.'
    return None

def run_isolated(payload,cancelled,on_event):
    baseline=pagefile_bytes()
    if shutil.disk_usage(ROOT).free<12*GIB:raise RuntimeError('Se requieren 12 GiB libres antes de iniciar. No se borrarán imágenes ni modelos automáticamente.')
    env=os.environ.copy();env['PYTHONUTF8']='1';env['PYTHONUNBUFFERED']='1'
    process=subprocess.Popen([sys.executable,'-u',str(ROOT/'inference_worker.py')],stdin=subprocess.PIPE,stdout=subprocess.PIPE,stderr=subprocess.PIPE,text=True,encoding='utf-8',errors='replace',env=env,cwd=str(ROOT),creationflags=getattr(subprocess,'CREATE_NO_WINDOW',0))
    events=queue.Queue();failures=[]
    def read_output():
        try:
            for line in process.stdout:
                try:events.put(json.loads(line))
                except (ValueError,TypeError):pass
        finally:events.put(None)
    def drain_errors():
        # Drain to avoid a full pipe; diagnostics stay in the user's terminal.
        for line in process.stderr:print(line,end='',file=sys.stderr)
    readers=[threading.Thread(target=read_output,daemon=True),threading.Thread(target=drain_errors,daemon=True)]
    for reader in readers:reader.start()
    child=psutil.Process(process.pid);budget=None
    try:
        budget=ProcessBudget(process.pid,min(16*GIB,psutil.virtual_memory().total*.5))
        process.stdin.write(json.dumps(payload,ensure_ascii=False)+'\n');process.stdin.close()
        last_check=0;output_closed=False
        while not (output_closed and process.poll() is not None):
            if cancelled.is_set():raise Cancelled()
            if process.poll() is None and time.monotonic()-last_check>.5:
                last_check=time.monotonic()
                try:
                    private=private_memory(process_tree(child))
                    memory=psutil.virtual_memory();free=shutil.disk_usage(ROOT).free
                    reason=guard_reason(free,memory.available,private,max(0,pagefile_bytes()-baseline),memory.total)
                    if reason:raise RuntimeError(reason)
                    on_event({'event':'memory','private_gib':round(private/GIB,2)})
                except psutil.NoSuchProcess:pass
            try:event=events.get(timeout=.2)
            except queue.Empty:continue
            if event is None:output_closed=True;continue
            if event.get('event')=='error':failures.append(event.get('message','No se pudo generar.'))
            else:on_event(event)
        if failures:raise RuntimeError(failures[-1])
        if process.wait()!=0:raise RuntimeError('El proceso de generación se cerró inesperadamente. Las imágenes ya terminadas se conservan.')
    finally:
        remaining=process_tree(child)
        if budget:budget.close()
        for descendant in reversed(remaining):
            try:descendant.terminate()
            except psutil.NoSuchProcess:pass
        _,alive=psutil.wait_procs(remaining,timeout=5)
        for descendant in alive:
            try:descendant.kill()
            except psutil.NoSuchProcess:pass
        process.wait(timeout=5)
        for stream in (process.stdin,process.stdout,process.stderr):
            if stream and not stream.closed:stream.close()
        for reader in readers:reader.join(timeout=1)
