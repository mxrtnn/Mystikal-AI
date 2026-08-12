from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import torch

app = FastAPI(title="Mystikal AI - Generador de Imágenes")

# Permite que el frontend en React se comunique con este backend en Python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class PromptRequest(BaseModel):
    prompt: str
    width: int = 512
    height: int = 512

@app.get("/")
def estado_del_servidor():
    gpu_disponible = torch.cuda.is_available()
    nombre_gpu = torch.cuda.get_device_name(0) if gpu_disponible else "Ninguna (usando CPU)"
    
    return {
        "estado": "Online",
        "gpu_disponible": gpu_disponible,
        "gpu_modelo": nombre_gpu,
        "proyecto": "Mystikal"
    }

@app.post("/generar")
def generar_imagen(request: PromptRequest):
    print(f"🎨 Mystikal recibió un prompt: '{request.prompt}'")
    
    return {
        "estado": "Exito",
        "mensaje": "Petición recibida",
        "datos": {
            "prompt": request.prompt,
            "tamaño": f"{request.width}x{request.height}"
        },
        "url_imagen_temporal": "https://placehold.co/512x512/png?text=Imagen+Mystikal"
    }