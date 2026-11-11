"""Share one GPU between the personal API and the public connector."""
from contextlib import contextmanager
import os
from pathlib import Path

LOCK=Path(__file__).resolve().parent/'data'/'gpu.lock'
class GpuBusy(RuntimeError):pass

@contextmanager
def gpu_gate():
    LOCK.parent.mkdir(parents=True,exist_ok=True)
    with LOCK.open('a+b') as handle:
        if handle.seek(0,2)==0:handle.write(b'0');handle.flush()
        handle.seek(0)
        try:
            if os.name=='nt':
                import msvcrt
                msvcrt.locking(handle.fileno(),msvcrt.LK_NBLCK,1)
            else:
                import fcntl
                fcntl.flock(handle.fileno(),fcntl.LOCK_EX|fcntl.LOCK_NB)
        except OSError:raise GpuBusy('La GPU está atendiendo otra solicitud. Espera a que termine.')
        try:yield
        finally:
            handle.seek(0)
            if os.name=='nt':msvcrt.locking(handle.fileno(),msvcrt.LK_UNLCK,1)
            else:fcntl.flock(handle.fileno(),fcntl.LOCK_UN)
