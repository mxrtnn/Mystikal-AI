import tempfile
import os
import subprocess
import sys
import threading
from pathlib import Path
import unittest
from unittest.mock import patch
import psutil
import inference_process as worker
from generation_backends import Cancelled
from process_budget import ProcessBudget

class WorkerTests(unittest.TestCase):
    @unittest.skipUnless(os.name=='nt','Windows Job Object')
    def test_native_budget_blocks_excess_commit(self):
        code="import sys;sys.stdin.readline();\ntry:\n data=bytearray(256*1024**2);print('UNBOUNDED',flush=True)\nexcept MemoryError:print('BOUNDED',flush=True)"
        child=subprocess.Popen([sys.executable,'-u','-c',code],stdin=subprocess.PIPE,stdout=subprocess.PIPE,text=True)
        budget=None
        try:
            budget=ProcessBudget(child.pid,96*1024**2)
            output,_=child.communicate('\n',timeout=10)
            self.assertIn('BOUNDED',output)
        finally:
            if budget:budget.close()
            if child.poll() is None:child.kill();child.wait()
    def test_resource_guards(self):
        G=worker.GIB
        self.assertIsNone(worker.guard_reason(75*G,20*G,8*G,0,32*G))
        self.assertIn('disco',worker.guard_reason(7*G,20*G,8*G,0,32*G))
        self.assertIn('RAM',worker.guard_reason(75*G,2*G,8*G,0,32*G))
        self.assertIn('presupuesto',worker.guard_reason(75*G,20*G,17*G,0,32*G))
        self.assertIn('virtual',worker.guard_reason(75*G,20*G,8*G,5*G,32*G))
    def test_finished_and_cancelled_workers_really_exit(self):
        with tempfile.TemporaryDirectory() as directory,patch.object(worker,'ROOT',Path(directory)):
            script=Path(directory)/'inference_worker.py'
            script.write_text("import json,os,sys,time\npayload=json.loads(sys.stdin.readline())\nprint(json.dumps({'event':'ready','pid':os.getpid()}),flush=True)\nif payload.get('wait'):time.sleep(20)\n",encoding='utf-8')
            events=[];worker.run_isolated({},threading.Event(),events.append)
            self.assertFalse(psutil.pid_exists(next(event['pid'] for event in events if event['event']=='ready')))
            cancel=threading.Event();events=[]
            def ready(event):
                events.append(event)
                if event.get('event')=='ready':cancel.set()
            with self.assertRaises(Cancelled):worker.run_isolated({'wait':True},cancel,ready)
            self.assertFalse(psutil.pid_exists(next(event['pid'] for event in events if event['event']=='ready')))
