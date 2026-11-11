import unittest
from types import SimpleNamespace
from unittest.mock import Mock
import torch
from transformers import CLIPTextConfig, CLIPTextModel, CLIPTextModelWithProjection
from prompt_encoding import encode_long_prompt, prompt_counts


class Tokenizer:
    model_max_length=77
    bos_token_id=1
    eos_token_id=399
    pad_token_id=0
    def __call__(self,text,**kwargs):
        return SimpleNamespace(input_ids=[int(value) for value in text.split()])


class PromptEncodingTests(unittest.TestCase):
    def setUp(self):
        torch.manual_seed(3)
        first=CLIPTextModel(CLIPTextConfig(vocab_size=400,hidden_size=8,intermediate_size=16,num_hidden_layers=2,num_attention_heads=2,max_position_embeddings=77,bos_token_id=1,eos_token_id=399,pad_token_id=0)).eval()
        second=CLIPTextModelWithProjection(CLIPTextConfig(vocab_size=400,hidden_size=16,intermediate_size=32,num_hidden_layers=2,num_attention_heads=2,max_position_embeddings=77,projection_dim=12,bos_token_id=1,eos_token_id=399,pad_token_id=0)).eval()
        self.pipeline=SimpleNamespace(tokenizer=Tokenizer(),tokenizer_2=Tokenizer(),text_encoder=first,text_encoder_2=second,encode_prompt=Mock(return_value='short-path'))
    def encode(self,positive,negative=''):
        with torch.inference_mode(): return encode_long_prompt(self.pipeline,positive,negative,'cpu')
    def test_short_prompts_preserve_original_diffusers_path(self):
        self.assertEqual(self.encode(' '.join(['3']*75)),'short-path')
        self.pipeline.encode_prompt.assert_called_once()
    def test_long_positive_and_short_negative_have_matching_shapes(self):
        for length,blocks in [(76,2),(150,2),(151,3),(220,3)]:
            positive,negative,pooled,negative_pooled=self.encode(' '.join(['3']*length),'4')
            self.assertEqual(positive.shape,(1,blocks*77,24));self.assertEqual(negative.shape,positive.shape)
            self.assertEqual(pooled.shape,(1,12));self.assertEqual(negative_pooled.shape,pooled.shape)
            self.assertTrue(torch.isfinite(positive).all());self.assertTrue(torch.isfinite(negative_pooled).all())
    def test_last_token_is_encoded_and_changes_conditioning(self):
        first=self.encode(' '.join(['3']*220))
        changed=self.encode(' '.join(['3']*219+['4']))
        self.assertFalse(torch.equal(first[0],changed[0]))
        self.assertFalse(torch.equal(first[2],changed[2]))
        self.assertTrue(torch.equal(first[1],changed[1]))
    def test_long_negative_empty_positive_and_no_truncation(self):
        result=self.encode('',' '.join(['4']*220))
        self.assertEqual(result[0].shape,result[1].shape)
        self.assertTrue(torch.isfinite(result[2]).all())
        for positive,negative in [(' '.join(['3']*221),''),('', ' '.join(['4']*221))]:
            with self.assertRaisesRegex(ValueError,'221/220'):self.encode(positive,negative)
    def test_counter_uses_larger_encoder_count(self):
        second=Mock(return_value=SimpleNamespace(input_ids=[3]*8))
        result=prompt_counts([Tokenizer(),second],'3 4','5')
        self.assertEqual(result['positive'],8);self.assertEqual(result['positive_encoders'],[2,8])

