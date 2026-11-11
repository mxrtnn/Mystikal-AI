import hashlib
import json
import tempfile
import unittest
from pathlib import Path
from unittest.mock import Mock,patch
from types import SimpleNamespace
import model_catalog as catalog
import main
from generation_backends import effective_prompt


class ModelTests(unittest.TestCase):
    def test_text_models_are_released_before_denoising(self):
        pipeline=SimpleNamespace(text_encoder=object(),text_encoder_2=object(),remove_all_hooks=Mock(),enable_sequential_cpu_offload=Mock())
        pipeline.register_modules=lambda **values:pipeline.__dict__.update(values)
        with patch('torch.cuda.empty_cache'):
            main.release_text_encoders(pipeline);main.release_text_encoders(pipeline)
        self.assertIsNone(pipeline.text_encoder);self.assertIsNone(pipeline.text_encoder_2)
        pipeline.remove_all_hooks.assert_called_once();pipeline.enable_sequential_cpu_offload.assert_called_once()
    def test_catalog_requires_verified_file_and_invalidates_changed_file(self):
        with tempfile.TemporaryDirectory() as temporary,patch.object(catalog,'ROOT',Path(temporary)):
            spec={'filename':'test.safetensors','size':3,'sha256':hashlib.sha256(b'abc').hexdigest()}
            path=catalog.weight_path(spec);path.parent.mkdir(parents=True);path.write_bytes(b'abc')
            self.assertFalse(catalog.verified(spec))
            marker={'sha256':spec['sha256'],'mtime_ns':path.stat().st_mtime_ns}
            path.with_suffix('.verified.json').write_text(json.dumps(marker))
            self.assertTrue(catalog.verified(spec))
            path.write_bytes(b'changed');self.assertFalse(catalog.verified(spec))
    def test_only_retained_models_are_accepted(self):
        for engine in ['animagine','wai']:
            self.assertEqual(main.Generation(prompt='landscape',engine=engine).engine,engine)
        for engine in ['pony','flux','../../other']:
            with self.assertRaises(ValueError):main.Generation(prompt='landscape',engine=engine)
        self.assertEqual(set(catalog.MODELS),{'animagine','wai'})
    def test_switch_releases_old_pipeline_and_loads_offline(self):
        old,old_key=main.pipe,main.pipe_key
        first=Mock();second=Mock()
        try:
            main.pipe=first;main.pipe_key='animagine';main.prompt_cache['old']='old'
            with patch.object(main,'installed',return_value=True),patch('torch.cuda.is_available',return_value=True),patch('torch.cuda.empty_cache'),patch('diffusers.StableDiffusionXLPipeline.from_single_file',return_value=second) as load:
                self.assertIs(main.load_pipeline('wai'),second)
                first.remove_all_hooks.assert_called_once();self.assertEqual(main.prompt_cache,{})
                self.assertTrue(load.call_args.kwargs['local_files_only'])
                self.assertIs(main.load_pipeline('wai'),second);load.assert_called_once()
        finally:main.pipe=old;main.pipe_key=old_key;main.prompt_cache.clear()
