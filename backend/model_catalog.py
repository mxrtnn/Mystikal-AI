"""Explicit, pinned model catalog. Inference never downloads weights."""
import json
from pathlib import Path

ROOT=Path(__file__).resolve().parent
BASE=ROOT/'models'/'animagine-xl-4.0'
MODELS={
    'animagine': {'label':'Animagine XL 4.0','model_id':'cagliostrolab/animagine-xl-4.0','license':'CreativeML Open RAIL++-M','source':'https://huggingface.co/cagliostrolab/animagine-xl-4.0','guidance':7},
    'wai': {'label':'WAI Illustrious SDXL v17','model_id':'WAI0731/wai-illustrious-sdxl-v17','license':'WAI release terms (Civitai)','source':'https://civitai.com/models/827184?modelVersionId=2883731','guidance':5,'filename':'wai-illustrious-v17.safetensors','size':6938040682,'sha256':'f116b0c78ff441467b0cdc8f1936e1ed18ea31e9997c7b132b1b8db533f0bd04','url':'https://civitai.com/api/download/models/2883731?fileId=2763986'},
}
def weight_path(spec): return ROOT/'models'/'checkpoints'/spec['filename']
def verified(spec):
    path=weight_path(spec)
    try:
        marker=json.loads(path.with_suffix('.verified.json').read_text())
        return path.stat().st_size==spec['size'] and marker['sha256']==spec['sha256'] and marker['mtime_ns']==path.stat().st_mtime_ns
    except (OSError,ValueError,KeyError):return False

def installed(engine):
    base_ready=(BASE/'model_index.json').exists()
    return base_ready and (engine=='animagine' or verified(MODELS[engine]))

def public_catalog():
    return [{key:spec[key] for key in ('label','model_id','source','license','guidance')}|{'id':engine,'installed':installed(engine),'local':True} for engine,spec in MODELS.items()]

