import json
from pathlib import Path
import threading
import unittest
from unittest.mock import patch
from PIL import Image
import main
from generation_backends import Cancelled,effective_prompt
import test_privacy

class BatchTests(unittest.TestCase):
    setUp=test_privacy.PrivacyTests.setUp
    tearDown=test_privacy.PrivacyTests.tearDown
    def fake_worker(self,payload,cancelled,report):
        request=main.Generation(**payload['request'])
        for index,image_id in enumerate(payload['image_ids']):
            metadata=request.model_dump()|{'id':image_id,'seed':payload['base_seed']+index,'effective_prompt':effective_prompt(request),'model':'test-double','created_at':1,'seconds':0,'peak_vram_mib':0}
            Image.new('RGB',(8,8)).save(Path(payload['output_dir'])/(image_id+'.png'))
            report({'event':'result','metadata':metadata})
    def test_batch_seeds_partial_results_and_process_failure_cleanup(self):
        request=main.Generation(prompt='mountain landscape',count=3,seed=42)
        event=threading.Event();main.jobs['batch']={'_owner':self.owners[0]};main.lock.acquire()
        with patch.object(main,'run_isolated',side_effect=self.fake_worker):main.run('batch',request,event)
        self.assertEqual(main.jobs['batch']['status'],'done')
        self.assertEqual([image['seed'] for image in main.jobs['batch']['results']],[42,43,44])
        self.assertEqual(len(self.a.get('/api/gallery').json()),3);self.assertFalse(main.lock.locked())
        def interrupted(payload,cancelled,report):
            self.fake_worker({**payload,'image_ids':payload['image_ids'][:1]},cancelled,report)
            (Path(payload['output_dir'])/(payload['image_ids'][1]+'.png')).write_bytes(b'partial')
            raise Cancelled()
        main.jobs['partial']={'_owner':self.owners[0]};main.lock.acquire()
        with patch.object(main,'run_isolated',side_effect=interrupted):main.run('partial',request,event)
        self.assertEqual(main.jobs['partial']['status'],'cancelled');self.assertEqual(len(main.jobs['partial']['results']),1)
        self.assertEqual(main.jobs['partial']['worker_private_gib'],0);self.assertFalse(main.lock.locked())
        self.assertEqual(len(list(Path(self.temp.name).rglob('*.png'))),4)
    def test_character_descriptions_are_sent_before_scene(self):
        request=main.Generation(prompt='sunlit garden, medium shot, soft light',characters=[{'name':'Tarjeta','description':'adult woman, red coat, short black hair'}])
        combined=effective_prompt(request)
        self.assertLess(combined.index('red coat'),combined.index('sunlit garden'))
        self.assertIn('short black hair',combined);self.assertNotIn('Tarjeta',combined)
