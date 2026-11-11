import io
from pathlib import Path
import tempfile
import unittest
from unittest.mock import Mock,patch
import uuid
from PIL import Image
import requests
import serve_public as connector
from gpu_gate import gpu_gate,GpuBusy
import gpu_gate as gate_module

class PublicWorkerTests(unittest.TestCase):
    def test_upload_uses_only_the_new_temporary_image_without_metadata(self):
        session=Mock(cookies=requests.cookies.RequestsCookieJar())
        session.post.return_value=Mock(ok=True)
        job={'id':str(uuid.uuid4()),'lease':'a'*64,'request':{'engine':'wai','count':1,'nsfw':False,'steps':20}}
        def render(payload,cancelled,event):
            path=Path(payload['output_dir'])/(job['id']+'.png')
            image=Image.new('RGB',(8,8));image.info['private']='not shared';image.save(path)
            event({'event':'result','metadata':{'id':job['id']}})
        with tempfile.TemporaryDirectory() as folder,patch.object(connector,'TEMP_ROOT',Path(folder)),patch.object(connector,'json_call',return_value={'ok':True}),patch.object(connector,'run_isolated',side_effect=render):
            connector.render_job(session,'https://example.invalid',job)
            self.assertEqual(list(Path(folder).iterdir()),[])
        self.assertEqual(session.post.call_count,1)
        self.assertEqual(session.post.call_args.kwargs['headers']['X-Worker-Lease'],job['lease'])
        with Image.open(io.BytesIO(session.post.call_args.kwargs['data'])) as image:self.assertNotIn('private',image.info)
    def test_remote_job_cannot_name_a_local_file_or_unsupported_model(self):
        session=Mock(cookies=requests.cookies.RequestsCookieJar())
        for identifier,engine in [('../../private/image','wai'),(str(uuid.uuid4()),'flux')]:
            with patch.object(connector,'json_call',return_value={'ok':True}),patch.object(connector,'run_isolated') as render:
                connector.render_job(session,'https://example.invalid',{'id':identifier,'lease':'b'*64,'request':{'engine':engine,'count':1,'nsfw':False}})
                render.assert_not_called()
        session.post.assert_not_called()
    def test_public_and_personal_studios_share_one_gpu_lock(self):
        with tempfile.TemporaryDirectory() as folder,patch.object(gate_module,'LOCK',Path(folder)/'gpu.lock'):
            with gpu_gate():
                with self.assertRaises(GpuBusy):
                    with gpu_gate():pass
            with gpu_gate():pass
