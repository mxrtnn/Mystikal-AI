# Mystikal AI local

Se conserva React/Vite y se integra Diffusers en el backend Python, evitando un servicio adicional ComfyUI y controlando directamente progreso y cancelación. El backend Node/Replicate y las pantallas anteriores se conservan como código histórico, pero el estudio local no los importa ni necesita cuenta, saldo o APIs comerciales.

## Iniciar en este equipo

Desde la raíz del proyecto, en dos terminales PowerShell:

```powershell
.\iniciar-local.ps1 backend
# Segunda terminal:
.\iniciar-local.ps1 frontend
```

Abre http://127.0.0.1:5173. Ctrl+C en ambas terminales detiene los servicios. Ambos escuchan en localhost; no uses múltiples workers porque duplican el modelo en memoria. El Node portátil de .tools evita cambiar la configuración global de nvm.

Alternativa si PowerShell bloquea scripts:

```powershell
backend\.venv-local\Scripts\python.exe -m uvicorn main:app --app-dir backend --host 127.0.0.1 --port 8000 --workers 1
# En otra terminal, desde frontend:
..\.tools\node-v22.16.0-win-x64\node.exe node_modules\vite\bin\vite.js --host 127.0.0.1
```

## Reinstalar

Windows, Python 3.13, Node >=22.12 y controlador NVIDIA compatible con CUDA 12.8. No hace falta CUDA Toolkit. Reserva 15 GB libres para modelo/dependencias, además de imágenes.

```powershell
python -m venv backend\.venv-local
backend\.venv-local\Scripts\python.exe -m pip install -r backend\requirements-local.txt
backend\.venv-local\Scripts\python.exe backend\download_model.py
cd frontend
npm ci
```

El modelo se descarga explícitamente; la inferencia usa exclusivamente archivos locales con HF_HUB_OFFLINE y TRANSFORMERS_OFFLINE. Tras instalar puedes desconectar Internet y generar mediante localhost. Vite dirige /api y /outputs a Python.

## Modelo y límites

Modelo único: [Animagine XL 4.0 de Cagliostro Research Lab](https://huggingface.co/cagliostrolab/animagine-xl-4.0), SDXL, safetensors FP16. La descarga selecciona componentes Diffusers sin duplicar el checkpoint. La revisión queda en backend/models/animagine-xl-4.0/REVISION.txt y en los resultados.

Licencia [CreativeML Open RAIL++-M](https://huggingface.co/stabilityai/stable-diffusion-xl-base-1.0/blob/main/LICENSE.md), que permite uso personal sujeto a sus condiciones y restricciones. No es dominio público ni un modelo NovelAI.

Inicio: 1024x1024, Euler Ancestral, guidance 5, 28 pasos. Retrato 832x1216 o paisaje 1216x832; 768x768 reduce memoria y puede reducir calidad respecto a la resolución nativa. FP16, model CPU offload, VAE tiling y slicing; los componentes inactivos pasan a RAM. Una imagen por tarea y una tarea a la vez. Una solicitud simultánea devuelve 409.

Las tarjetas organizan texto: sus descripciones se concatenan al Base prompt; el nombre de tarjeta es solo una etiqueta. No hay asignación regional ni garantía de atributos independientes; pueden mezclarse. ComfyUI permitiría explorar conditioning regional mediante workflows adicionales, pero requeriría integración y validación propia. Para esta versión conviene usar un solo personaje cuando importe la identidad.

La pipeline estándar limita a 77 tokens CLIP: se rechaza el texto que exceda el límite en vez de truncarlo. No implementa sintaxis de pesos NovelAI ni ejecuta código remoto para prompts largos. El negative prompt llega al condicionamiento negativo real y guidance siempre es mayor que 1.

## Resultados

PNG en backend/outputs con metadatos embebidos bajo la clave mystikal y JSON junto a cada imagen. La galería se reconstruye desde disco. Selecciona una imagen y Reutilizar ajustes para recuperar prompt, negative, personajes, resolución, seed, pasos, guidance y sampler. Seed -1 es aleatoria; se guarda la efectiva. Una seed fija ayuda a repetir, aunque versiones distintas de software/hardware pueden cambiar resultados.

El progreso cuenta pasos reales de denoising. Carga y decodificación muestran su estado sin porcentaje inventado. Cancelar espera al siguiente callback; durante carga o decodificación puede tardar. Reiniciar pierde tareas activas, pero conserva imágenes.

## Solución de problemas

- CUDA no disponible/no kernel image: comprueba nvidia-smi y PyTorch 2.7.1+cu128. Verifica una operación CUDA real, no solo is_available.
- Falta VRAM: cierra aplicaciones GPU, prueba 768x768 y reinicia el backend. No se garantiza que cualquier tamaño quepa en 8 GB.
- Modelo pendiente/incompleto: repite download_model.py con conexión para reanudar.
- Prompt largo: acorta Base, Undesired y tarjetas; se mide el texto combinado.
- Puerto ocupado: detén la instancia previa en 8000 o 5173.
- Backend desconectado: revisa la terminal Python.

Fuentes: [PyTorch Blackwell/CUDA 12.8](https://pytorch.org/blog/pytorch-2-7/), [memoria Diffusers](https://huggingface.co/docs/diffusers/optimization/memory), [API SDXL](https://huggingface.co/docs/diffusers/api/pipelines/stable_diffusion/stable_diffusion_xl).

## Home y experiencia del estudio

La portada `/` muestra banners con imágenes reales de la galería, tarjetas de funciones y una explicación del stack. `/generate` abre el estudio. No se envían imágenes a servicios externos para construir el home.

Durante una tarea aparece un spinner con tiempo transcurrido y fases: carga, interpretación del prompt, denoising y decodificación. Borrador usa 768x768 y 20 pasos; Detalle mantiene 1024x1024 y 28 pasos. Borrador reduce cómputo a cambio de detalle; no es una aceleración equivalente de la misma imagen.

El backend conserva hasta cuatro pares de embeddings de prompt/negative en RAM para reutilizarlos al repetir exactamente el texto. Cambiar texto obliga a codificar de nuevo. Los errores o cancelaciones limpian esa caché. El modelo sigue cargado entre generaciones exitosas; al reiniciar vuelve a cargarse.

Los nuevos JSON incluyen load_seconds, encoding_seconds, denoise_seconds, decode_seconds, inference_seconds, model_warm y prompt_cache_hit. Esto permite distinguir la primera carga del trabajo por imagen. El total histórico de 283.15 s a 1024x1024 y 28 pasos no tenía ese desglose; no permite atribuir por sí solo el retraso a una fase concreta. Tras modificar Python hay que reiniciar el backend; Vite actualiza la interfaz en desarrollo automáticamente.

### Validación del rediseño

- TypeScript, build Vite, lint de los componentes nuevos y compilación Python: correctos.
- Navegador: portada, entrada al estudio, preset Borrador y visualización de un resultado guardado comprobados.
- GPU real, dos generaciones técnicas 512x512 / 2 pasos / seed 42: 40.98 s en frío y 2.26 s con modelo y texto reutilizados. El procesamiento de texto fue 17.73 s frente a 0.02 s; los píxeles de ambas salidas fueron idénticos. Estas pruebas verifican la caché, no calidad ni tiempos esperados a 1024 / 28 pasos.
- Se inició una prueba 1024x1024 / 28 pasos y se detuvo tras 9 pasos; se observaron pasos de aproximadamente 6–19 s, incluidos los iniciales. No se completó una medición comparable de imagen a 28 pasos; no se atribuye una aceleración total a la caché.
- Los archivos técnicos de prueba se guardaron fuera de la galería del usuario. No se descargaron nuevos modelos ni se modificaron imágenes existentes.

## Acceso con cuenta e invitado

Las rutas /login y /register conservan las pantallas originales y su API de autenticación existente. El generador y la galería requieren una sesión del frontend, que puede ser de cuenta o de invitado. Continuar como invitado no crea una cuenta ni envía credenciales: guarda una marca en sessionStorage para esa pestaña y funciona sin Internet. Al iniciar sesión con una cuenta se elimina esa marca; Salir limpia la sesión de acceso, sin borrar imágenes ni parámetros.

El login mantiene su estética original y añade el botón de invitado y un fondo decorativo animado local. Las ilustraciones se animan con CSS y respetan la preferencia de movimiento reducido. Registro y autenticación con credenciales mantienen su conexión anterior; no se migró su base de datos al backend de inferencia.

Verificado en navegador: redirección del generador al login sin sesión, acceso como invitado, salida de invitado y navegación entre login/registro. TypeScript, lint y build correctos. No se enviaron credenciales ni se creó una cuenta para las pruebas.

## Privacidad actual: sustituye el almacenamiento compartido anterior

IMPORTANTE: reinicia Python para activar estos cambios. Hasta detener el backend anterior, ese proceso sigue ejecutando sus rutas antiguas. La interfaz nueva deja de usar la galería antigua para el home inmediatamente.

- Selector manual SFW/NSFW ANTES de generar. No hay detector ni inferencia automática de categoría. La marca no cambia el prompt ni la generación.
- Nuevos archivos en backend/data/private/<propietario-servidor>/sfw o nsfw. No hay montaje estático de esa carpeta ni de backend/outputs.
- SQLite guarda propietarios, preferencias y sesiones. Tokens aleatorios de 256 bits en cookie HttpOnly/SameSite Strict; solo su hash se almacena en disco. La API comprueba sesión y propietario en galería, archivos privados, metadatos, tareas y cambios de publicación. No usa el email de localStorage como prueba de identidad.
- El login local verifica las credenciales en el servicio de cuentas HTTPS preexistente. No guarda contraseñas. MYSTIKAL_AUTH_URL permite configurar ese origen; por defecto conserva el Render usado por el formulario original. El registro sigue en el servicio previo. Una nueva sesión de cuenta necesita Internet; una sesión válida y la generación ya instalada pueden seguir usándose sin conexión. Invitado es local y temporal (12 horas); al salir se revoca el acceso a sus imágenes. Descarga lo que quieras conservar antes de salir.
- Todo comienza privado. Solo una cuenta verificada puede compartir. En /profile puedes cambiar cada imagen o activar la publicación automática de FUTURAS generaciones, incluidas NSFW. Compartir significa que quien tenga el enlace puede verla; las copias públicas omiten metadatos embebidos. Volver a privada revoca nuevas descargas, pero no borra copias que otros ya descargaron.
- El home usa /api/public/gallery: requiere compartida + SFW + confirmación manual de revisión SFW. Las imágenes NSFW nunca entran en ese endpoint. La etiqueta manual puede ser incorrecta: el programa no detecta el contenido real.
- El servidor de desarrollo Vite solo permite servir archivos de frontend. No sirve archivos del backend por /@fs/.
- Es privacidad de acceso en esta aplicación local, no cifrado ni protección frente a administradores o personas que puedan leer tu sesión/carpeta de Windows. Mantén los servicios enlazados a localhost; esta configuración no está diseñada para exponerla públicamente en Internet.

Las imágenes anteriores siguen intactas en backend/outputs, sin publicación ni dueño supuesto. Opcionalmente puedes recuperarlas SIN enviar datos al chat: inicia sesión con tu cuenta en la app actualizada y ejecuta:

```powershell
backend\.venv-local\Scripts\python.exe backend\import_legacy.py
```

El script pide el correo en tu propia terminal, lo usa solo localmente y copia las imágenes a esa cuenta, siempre privadas y clasificadas conservadoramente como NSFW/sin revisar. No borra originales, no sube imágenes y no activa la preferencia de compartir para esas copias.

## Artistas / TAGs

Fuente: https://tags.gallery/en/v4-5. Es un catálogo externo de etiquetas y ejemplos generados, no una API oficial de NovelAI que entrene modelos. No se encontró una API pública documentada y el acceso programático al sitio respondió 403; no se eludió el bloqueo ni se copió el catálogo completo.

El generador incluye un campo de artista y autocompletado inicial de seis nombres mediante /api/artists?q=. Puedes escribir cualquier etiqueta copiada manualmente del catálogo. Se antepone al prompt efectivo y cuenta para el límite CLIP; se guarda y recupera con la imagen. El soporte en Animagine XL 4.0 no está validado por pertenecer al catálogo, y la sintaxis de pesos NovelAI no es compatible. No se descargaron imágenes ni modelos de artistas.

Pruebas de privacidad reproducibles (no usan credenciales reales ni generan imágenes):

```powershell
backend\.venv-local\Scripts\python.exe -m pip install -r backend\requirements-dev.txt
backend\.venv-local\Scripts\python.exe -m unittest discover -s backend -p test_privacy.py -v
```

Validación adicional: generación REAL en GPU de prueba técnica 512x512, 1 paso, con nsfw=true y artista freng; 48.47 s en frío, 5103 MiB de pico asignado por PyTorch. Se comprobaron carpeta NSFW del propietario, conservación de artista/marca, descarga autorizada, denegación sin sesión y exclusión del home. El prompt de prueba no era explícito: valida el enrutamiento de la marca manual, no un detector. Se ejecutó en almacenamiento temporal aislado, sin publicar ni incorporar la imagen a la galería del usuario. Diez pruebas de autorización y publicación, TypeScript, lint y build pasaron. No se probó un login real porque no se solicitaron credenciales; la validación del proveedor se probó con respuestas controladas.

## Portada fija y diseño del home

La portada usa frontend/public/images/mystikal-home-v1.png: una ilustración promocional SFW creada con la herramienta integrada image_gen. Es un recurso de diseño independiente de la galería, no una muestra de rendimiento de Animagine ni una imagen generada por la GPU local. La galería pública sigue limitada a contenido compartido, SFW y revisado. Se mantienen el título con iluminación al mouse y el flujo de login; se ajustaron tamaños de letra, espaciado, navegación, tarjetas y secciones técnicas.
