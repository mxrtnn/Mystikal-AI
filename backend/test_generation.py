import io
import threading
import unittest
from unittest.mock import Mock,patch
from PIL import Image
import main
import privacy
import generation_backends as providers
import test_privacy

class BatchTests(unittest.TestCase):
    setUp=test_privacy.PrivacyTests.setUp
    tearDown=test_privacy.PrivacyTests.tearDown
    # Reuse the isolated database fixture without contacting accounts or providers.
    def test_sequential_batch_seeds_and_partial_cancellation(self):
        def fake(request,seed,cancelled,report,progress):
            progress(request.steps)
            return Image.new('RGB',(8,8)),{'model':'test-double','peak_vram_mib':0}
        request=main.Generation(prompt='test',count=3,seed=42)
        event=threading.Event();main.jobs['batch']={'_owner':self.owners[0]};main.lock.acquire()
        with patch.object(main,'animagine_image',side_effect=fake):main.run('batch',request,event)
        self.assertEqual(main.jobs['batch']['status'],'done')
        self.assertEqual([image['seed'] for image in main.jobs['batch']['results']],[42,43,44])
        self.assertEqual(len(self.a.get('/api/gallery').json()),3)
        self.assertFalse(main.lock.locked())
        calls=0
        def cancel_second(*args):
            nonlocal calls
            calls+=1
            if calls==2:raise providers.Cancelled()
            return fake(*args)
        main.jobs['partial']={'_owner':self.owners[0]};main.lock.acquire()
        with patch.object(main,'animagine_image',side_effect=cancel_second):main.run('partial',request,event)
        self.assertEqual(main.jobs['partial']['status'],'cancelled');self.assertEqual(len(main.jobs['partial']['results']),1)
        self.assertFalse(main.lock.locked())

class FluxTests(unittest.TestCase):
    def test_payload_download_and_unsupported_controls(self):
        data=io.BytesIO();Image.new('RGB',(8,8)).save(data,format='PNG')
        session=Mock();session.__enter__=Mock(return_value=session);session.__exit__=Mock(return_value=False)
        session.post.return_value=Mock(status_code=201,json=lambda:{'id':'test123','status':'succeeded','output':'https://replicate.delivery/image.png'})
        download=Mock(status_code=200);download.__enter__=Mock(return_value=download);download.__exit__=Mock(return_value=False);download.iter_content.return_value=[data.getvalue()]
        request=main.Generation(prompt='test',engine='flux',paid_confirmed=True,negative_prompt='must not send',style='3d')
        with patch.object(providers,'replicate_token',return_value='test-only'),patch.object(providers.requests,'Session',return_value=session),patch.object(providers.requests,'get',return_value=download) as fetch:
            image,metadata=providers.flux_image(request,123,threading.Event(),lambda _:None)
        payload=session.post.call_args.kwargs['json']['input']
        self.assertEqual(payload['seed'],123);self.assertEqual(payload['safety_tolerance'],2)
        self.assertNotIn('negative_prompt',payload);self.assertNotIn('num_inference_steps',payload)
        self.assertIn('3d render',payload['prompt']);self.assertNotIn('headers',fetch.call_args.kwargs)
        self.assertEqual(image.size,(8,8));self.assertIsNone(metadata['applied_settings']['steps'])
    def test_cancellation_calls_provider_cancel(self):
        session=Mock();session.__enter__=Mock(return_value=session);session.__exit__=Mock(return_value=False)
        event=threading.Event()
        def post(*args,**kwargs):
            event.set()
            return Mock(status_code=201,json=lambda:{'id':'test123','status':'processing'})
        session.post.side_effect=post
        with patch.object(providers,'replicate_token',return_value='test-only'),patch.object(providers.requests,'Session',return_value=session):
            with self.assertRaises(providers.Cancelled):providers.flux_image(main.Generation(prompt='test'),1,event,lambda _:None)
        self.assertTrue(session.post.call_args.args[0].endswith('/test123/cancel'))
