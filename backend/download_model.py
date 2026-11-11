"""Explicit online installation; normal inference never downloads files."""
import os
os.environ['HF_HUB_OFFLINE'] = '0'
import shutil
from pathlib import Path
from huggingface_hub import HfApi, snapshot_download
root = Path(__file__).resolve().parent / 'models' / 'animagine-xl-4.0'
root.mkdir(parents=True, exist_ok=True)
if shutil.disk_usage(root).free < 15 * 1024**3:
    raise SystemExit('Se requieren al menos 15 GB libres para descargar el modelo.')
repo = 'cagliostrolab/animagine-xl-4.0'
revision = HfApi().model_info(repo).sha
print('Descarga oficial FP16, aproximadamente 7 GB; revisión:', revision, flush=True)
snapshot_download(repo, revision=revision, local_dir=root, allow_patterns=['model_index.json', 'scheduler/*', 'tokenizer/*', 'tokenizer_2/*', 'text_encoder/*', 'text_encoder_2/*', 'unet/*', 'vae/*', 'README.md', 'LICENSE*'], ignore_patterns=['*.bin', '*.onnx', '*.msgpack', '*.h5'])
(root / 'REVISION.txt').write_text(revision)
print('Modelo instalado:', root)
