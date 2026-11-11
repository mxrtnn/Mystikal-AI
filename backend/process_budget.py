"""Windows Job Object budget, including the venv redirector's real child."""
import ctypes
import os
import psutil

class ProcessBudget:
    def __init__(self,pid,limit_bytes):
        self.handle=None
        if os.name!='nt':return
        from ctypes import wintypes
        class Basic(ctypes.Structure):
            _fields_=[('ProcessTime',ctypes.c_longlong),('JobTime',ctypes.c_longlong),('LimitFlags',wintypes.DWORD),('MinWorkingSet',ctypes.c_size_t),('MaxWorkingSet',ctypes.c_size_t),('ActiveProcessLimit',wintypes.DWORD),('Affinity',ctypes.c_size_t),('PriorityClass',wintypes.DWORD),('SchedulingClass',wintypes.DWORD)]
        class IO(ctypes.Structure):
            _fields_=[(name,ctypes.c_ulonglong) for name in ('ReadOps','WriteOps','OtherOps','ReadBytes','WriteBytes','OtherBytes')]
        class Extended(ctypes.Structure):
            _fields_=[('Basic',Basic),('IO',IO),('ProcessMemoryLimit',ctypes.c_size_t),('JobMemoryLimit',ctypes.c_size_t),('PeakProcessMemoryUsed',ctypes.c_size_t),('PeakJobMemoryUsed',ctypes.c_size_t)]
        api=ctypes.WinDLL('kernel32',use_last_error=True);self.api=api
        api.CreateJobObjectW.argtypes=[ctypes.c_void_p,wintypes.LPCWSTR];api.CreateJobObjectW.restype=wintypes.HANDLE
        api.SetInformationJobObject.argtypes=[wintypes.HANDLE,ctypes.c_int,ctypes.c_void_p,wintypes.DWORD];api.SetInformationJobObject.restype=wintypes.BOOL
        api.OpenProcess.argtypes=[wintypes.DWORD,wintypes.BOOL,wintypes.DWORD];api.OpenProcess.restype=wintypes.HANDLE
        api.AssignProcessToJobObject.argtypes=[wintypes.HANDLE,wintypes.HANDLE];api.AssignProcessToJobObject.restype=wintypes.BOOL
        api.CloseHandle.argtypes=[wintypes.HANDLE];api.CloseHandle.restype=wintypes.BOOL
        handle=api.CreateJobObjectW(None,None)
        if not handle:raise ctypes.WinError(ctypes.get_last_error())
        self.handle=handle
        limits=Extended();limits.Basic.LimitFlags=0x200|0x2000;limits.JobMemoryLimit=int(limit_bytes)
        try:
            if not api.SetInformationJobObject(handle,9,ctypes.byref(limits),ctypes.sizeof(limits)):raise ctypes.WinError(ctypes.get_last_error())
            root=psutil.Process(pid)
            for process in [root,*root.children(recursive=True)]:
                process_handle=api.OpenProcess(0x100|0x1,False,process.pid)
                if not process_handle:
                    if not process.is_running():continue
                    raise ctypes.WinError(ctypes.get_last_error())
                try:
                    if not api.AssignProcessToJobObject(handle,process_handle):raise ctypes.WinError(ctypes.get_last_error())
                finally:api.CloseHandle(process_handle)
        except Exception:self.close();raise
    def close(self):
        if self.handle:self.api.CloseHandle(self.handle);self.handle=None

def process_tree(root):
    try:return [root,*root.children(recursive=True)]
    except psutil.NoSuchProcess:return []

def private_memory(processes):
    total=0
    for process in processes:
        try:
            info=process.memory_info();total+=getattr(info,'private',info.rss)
        except psutil.NoSuchProcess:pass
    return total
