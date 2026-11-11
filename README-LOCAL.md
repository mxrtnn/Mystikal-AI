# Mystikal AI: uso local

## Estado actual

- Modelos disponibles: Animagine XL 4.0 y WAI Illustrious SDXL v17.
- Pony, su LoRA CSR y FLUX se retiraron por petición del usuario. Las imágenes antiguas se conservan; sus modelos ya no se pueden elegir ni ejecutar.
- La generación usa descarga secuencial de submódulos y decodificación VAE por mosaicos de 512 px. Los codificadores de texto se descartan cuando sus embeddings ya están calculados. Esta configuración prioriza memoria y puede ser más lenta.
- Cada solicitud de generación usa un proceso temporal aislado. Al terminar, cancelar o fallar, se cierra todo su árbol de procesos y se liberan sus asignaciones de RAM/VRAM. Un lote reutiliza el modelo únicamente entre las imágenes del mismo lote.
- En Windows se aplica un Job Object sin nombre con límite de memoria comprometida para ese árbol: el menor valor entre 16 GiB y la mitad de la RAM física. No cambia la configuración global de memoria virtual.
- El supervisor comprueba además RAM y disco cada 0.5 segundos. Requiere 12 GiB libres para comenzar; detiene la generación por debajo de 8 GiB libres, 3 GiB de RAM disponible o un crecimiento del pagefile superior a 4 GiB desde el inicio.
- Esos límites protegen la solicitud de Mystikal; no controlan el consumo de otras aplicaciones ni fuerzan que Windows reduzca inmediatamente su pagefile.

## Iniciar desde VS Code

Desde la raíz del proyecto, deja abiertas dos terminales:

```powershell
.\iniciar-local.ps1 backend
```

```powershell
.\iniciar-local.ps1 frontend
```

Abre http://127.0.0.1:5173. Usa un único backend en el puerto 8000 y un único Vite en el 5173. Para aplicar cambios del backend, detén la terminal con Ctrl+C y vuelve a ejecutar el comando. No se arranca ningún servidor automáticamente al instalar modelos ni al ejecutar las pruebas.

El modelo se vuelve a cargar en cada nueva solicitud. Es más lento que conservarlo indefinidamente, a cambio de liberar los allocators de Python/PyTorch y el contexto CUDA al finalizar. Cancelar conserva las imágenes que ya se registraron y limpia solamente los archivos incompletos de esa tarea.

## Instalación y modelos

La instalación existente usa backend/.venv-local, PyTorch cu128 y la GPU RTX 5060 Laptop de 8 GB. Las dependencias están fijadas en backend/requirements-local.txt. La configuración local no está diseñada para exponer el backend Python directamente a Internet.

```powershell
backend\.venv-local\Scripts\python.exe backend\download_model.py
backend\.venv-local\Scripts\python.exe backend\install_models.py wai
```

WAI usa el checkpoint local Safetensors verificado por SHA256 y las configuraciones/tokenizadores SDXL de Animagine; los pesos corresponden al checkpoint seleccionado. La inferencia no descarga archivos ni llama a un proveedor de pago. Fuentes y condiciones: MODELS.md.

Los modelos ocupan aproximadamente 12.9 GiB entre ambos. Las fotos y sus parámetros son archivos adicionales. Windows puede ampliar pagefile.sys cuando aumenta la demanda de memoria comprometida: ese archivo no es una caché de fotos ni debe borrarse como basura. Referencia: https://learn.microsoft.com/en-us/troubleshoot/windows-client/performance/introduction-to-the-page-file.

## Escena y personajes

- El campo de escena describe contexto, lugar, iluminación, acción general y cámara.
- Las tarjetas contienen identidad y apariencia. Su nombre solo organiza la interfaz; el texto enviado es la descripción no vacía.
- El backend construye el prompt efectivo en este orden: artista, estilo, descripciones de personajes, escena. El contador y la vista de prompt efectivo usan exactamente esa función.
- SDXL sigue recibiendo un texto compartido, no regiones o canales independientes para cada personaje. Puede mezclar atributos y no se garantiza fidelidad perfecta. Si introduces identidad en la escena también llegará al modelo; no se elimina texto automáticamente.
- El límite de 220 tokens de contenido se aplica al prompt efectivo combinado, incluyendo personajes/artista/estilo; el negativo tiene 220 independientes. El contador toma el mayor resultado de los dos tokenizadores CLIP.
- CLIP conserva ventanas de 77 posiciones (75 de contenido más BOS/EOS). Los prompts largos usan hasta tres bloques concatenados y un embedding global ponderado. Los cortos conservan la ruta nativa. No se trunca silenciosamente.
- Las etiquetas son texto aprendido por el modelo, no una API que descargue estilos ni un entrenamiento. El catálogo externo enlazado es https://tags.gallery/en/v4-5; su presencia no garantiza soporte en estos checkpoints.

Los metadatos guardan los campos originales, el prompt efectivo, el modo shared_prompt_characters_first, la seed y los parámetros realmente aplicados. Cambiar el orden respecto a versiones anteriores puede cambiar una imagen aunque se repita la seed.

## Cuenta, perfil y privacidad

El login local verifica credenciales en el servicio original HTTPS de Render (MYSTIKAL_AUTH_URL; por defecto https://mystikal-ai.onrender.com). Las contraseñas no se guardan en SQLite local. La sesión local usa una cookie HttpOnly/SameSite Strict con un token opaco cuyo hash se guarda en servidor. El registro permanece en el servicio original.

La cuenta original usa TiDB Cloud/MySQL. Sus variables DB_HOST, DB_PORT, DB_USER, DB_PASSWORD y DB_NAME pertenecen al backend Node en Render; no se copian al frontend ni al repositorio. Cambiar nombre/correo/icono requiere el endpoint de cuentas actualizado en Render y contraseña actual. La identidad remota estable conserva la propiedad de las fotos tras cambiar correo.

backend/data/privacy.sqlite3 mantiene propietarios, sesiones y preferencias. Las imágenes nuevas se guardan en backend/data/private/<propietario-servidor>/sfw o nsfw; ninguna carpeta privada está montada como recurso estático. La API comprueba propietario para metadatos, archivos privados, tareas y ediciones. El usuario de localStorage no es autorización.

Las fotos comienzan privadas. La clasificación SFW/NSFW es manual dentro de Ajustes avanzados y requiere declaración de mayoría de edad; no detecta contenido ni verifica edad. Favoritas y destacadas son categorías personales, no publicación. Compartir por enlace es explícito; la preferencia de compartir futuras imágenes también incluye las marcadas NSFW si el usuario la activa. El home exige imagen compartida, marcada SFW y revisada manualmente. La copia pública omite metadatos privados.

La galería permite título, notas, favoritas, destacadas y papelera recuperable. La capacidad por defecto es de 1000 fotos activas por propietario (MYSTIKAL_GALLERY_LIMIT). Mover a papelera revoca enlaces públicos; restaurar mantiene la foto privada. La papelera conserva archivos y no equivale a liberar espacio físico.

La sesión invitada es temporal: al salir o expirar no se recuperan sus fotos desde otra cuenta. Descarga lo que quieras conservar. La privacidad protege acceso desde la aplicación, no cifra el disco ni protege frente a quien pueda leer tu cuenta de Windows.

Los archivos antiguos de backend/outputs no se borran ni se asignan automáticamente. backend/import_legacy.py permite una importación local opcional sin enviar datos al chat. Conserva originales.

## Vercel y Render

Vercel publica el portfolio y la interfaz de prueba. /muestra-visual es pública y contiene solo ejemplos pregenerados, sin formulario de generación; /demo redirige allí. /generate web usa el servicio de cuentas/cola de Render y la GPU del PC mediante un conector saliente. Solo cuentas autenticadas pueden reservar una generación de prueba; los invitados pueden ver la muestra visual. La galería demo guarda ejemplos elegidos en el navegador, separados por cuenta/sesión; no simula historial de generaciones propias ni sincroniza archivos del PC.

Root Directory de Vercel: frontend. Los rewrites de login, registro y /api/account llegan al servicio original https://mystikal-ai.onrender.com. El dominio antiguo mystikal-ai-backend.onrender.com era incorrecto. El perfil web necesita publicar también backend/accounts.js y backend/index.js en Render; sus tablas de perfiles/sesiones se crean de forma aditiva. Los usuarios con la sesión antigua del navegador deben iniciar sesión nuevamente.

El endpoint de generación remota de Node responde 410: fue retirado y ya no llama a Replicate. La clave/saldo de la cuenta externa no se modifica ni se publica. Para aplicar esa retirada en Render es necesario desplegar el código actualizado; editarlo localmente no cambia un despliegue ya publicado.

La portada fija frontend/public/images/mystikal-home-v1.png es un recurso promocional SFW creado con image_gen, no evidencia de rendimiento de los modelos locales. La demo usa únicamente ejemplos registrados de Animagine. El footer mantiene el crédito mxrtnn_dev y sus iconos sin enlaces personales configurados.

## Verificación

```powershell
backend\.venv-local\Scripts\python.exe -m unittest discover -s backend -p 'test*.py' -v
node --test backend/accounts.test.cjs
cd frontend
node scripts/check-http.cjs
node scripts/check-session.cjs
node scripts/check-demo-render.mjs
npm run build
```

Las pruebas de API usan datos temporales y cuentas simuladas, nunca las imágenes o credenciales del usuario. Las pruebas de proceso comprueban cierre real al finalizar/cancelar, incluyendo el redirector de Python en Windows y sus descendientes, y bloqueo de una asignación que supera un presupuesto nativo de prueba. Las pruebas de prompts validan que la descripción de un personaje original no sexual aparece antes de la escena. Las pruebas de GPU y sus mediciones se guardan solo en el directorio de trabajo de Codex.


## Medición de la corrección de memoria

Se detectó que el Python de un entorno virtual en Windows inicia un redirector y un intérprete hijo. Medir o terminar solo el PID devuelto por Popen no cubría al intérprete real. El supervisor ahora suma el árbol de procesos, lo incorpora al presupuesto nativo de Windows y termina todos sus descendientes. El cierre del backend también cierra el Job Object y termina la inferencia asociada.

Pruebas reales SFW tras la corrección: un retrato de personaje original adulto vestido a 832×1216, 2 pasos, pico de memoria privada comprometida del árbol 10.78 GiB; un lote de 2 imágenes 512×512, 1 paso cada una, pico 11.02 GiB. El disco permaneció en 75.65 GiB libres y pagefile.sys en 15.16 GiB antes/después de ambas solicitudes. Es una validación técnica, no una evaluación de calidad ni una garantía sobre otras aplicaciones o cualquier carga futura. Las protecciones siguen activas en resoluciones y prompts mayores.

Los datos del usuario se conservaron. Se eliminaron físicamente 6.541 GiB de Pony y CSR, el archivo de instalación Node ya extraído y los módulos de la dependencia Replicate. Los modelos restantes ocupan unos 12.9 GiB. Las cachés grandes de pip ya estaban vacías; no se eliminaron entornos Python ni archivos de memoria virtual/hibernación de Windows.


## Prueba pública: una imagen por cuenta

La prueba web nueva utiliza WAI en el PC, no una API de pago ni la GPU de Vercel. Las cuentas normales reciben una imagen completada; después /api/studio/jobs rechaza nuevas solicitudes con Prueba terminada. Los intentos fallidos o asignaciones vencidas devuelven la reserva. Recargar, borrar localStorage o cambiar el correo no reinicia el contador: la cuota usa el ID de cuenta persistido en TiDB y transacciones con bloqueo de fila.

La cuenta existente martinjara580@gmail.com tiene acceso ampliado. El servidor fija su ID inmutable en studio_control al inicializar; el cliente no decide ese rol y cambiar otro correo no lo concede. STUDIO_OWNER_EMAIL permite configurar el correo de búsqueda inicial en Render, pero no reemplaza automáticamente un ID ya fijado. No se conceden privilegios por un campo owner/email del navegador.

Las tablas aditivas studio_control, studio_access y studio_jobs guardan la presencia de GPU, cuotas, reservas y resultados. El usuario de TiDB de Render necesita CREATE TABLE, SELECT, INSERT y UPDATE. Las imágenes de prueba se guardan como PNG en TiDB, se entregan solo a su cuenta y no entran al home. Se limita el PNG a 4 MiB y la cola a 8 trabajos. No se almacenan claves de Windows ni contraseñas del conector en archivos nuevos.

### Publicar y conectar el PC

1. Hacer push de los commits de main (lo hace el usuario). Vercel debe desplegar frontend con su vercel.json y Render el backend Node actualizado. Si Render no tiene despliegue automático, seleccionar Deploy latest commit. Ambos despliegues son necesarios.
2. En el PC con WAI instalado, abrir una terminal en la raíz y ejecutar:

```powershell
.\iniciar-local.ps1 publico
```

3. Introducir en esa terminal la contraseña de la cuenta propietaria de Mystikal. getpass la oculta; no se guarda ni se pide enviarla al chat. Mantener el conector y el PC funcionando. Ctrl+C desconecta la GPU. La web mostrará el estudio desconectado cuando venza su señal de presencia; no consumirá pruebas nuevas mientras esté desconectado.

Para el generador público no es necesario iniciar Vite ni el servidor FastAPI local: el conector ejecuta los workers aislados directamente. Para usar el estudio personal se mantienen los comandos backend y frontend anteriores. Ambos usos comparten un bloqueo de archivo de GPU: nunca cargan dos modelos simultáneamente. El conector espera si el estudio personal está ocupado.

El PC consulta por HTTPS la cola de Render. No se abre ningún puerto del PC ni se expone backend/data/private. Solo se procesa una solicitud nueva, validada como WAI, un PNG y sin modo adulto. Los IDs se validan como UUID, y los archivos temporales se crean en un directorio propio; no se aceptan rutas desde la cola. El resultado se recodifica sin metadatos embebidos, se sube con una asignación temporal autenticada y se borra la copia temporal al terminar. La selección general del prompt no es un detector de contenido.

La sesión del conector vive solo en memoria y puede caducar. Si caduca, reiniciar el comando e iniciar sesión nuevamente. Si la conexión se pierde durante un trabajo, el proceso se cancela y la reserva se devuelve al vencer la asignación (aproximadamente dos minutos). Un fallo después de confirmar una imagen no genera una segunda ni duplica el contador.

### Verificación específica de la prueba pública

```powershell
node --test backend/public_studio.test.cjs backend/accounts.test.cjs
backend\.venv-local\Scripts\python.exe -m unittest discover -s backend -p 'test*.py' -v
cd frontend
node scripts/check-public-render.mjs
npm run build
```

Las pruebas verifican invitado rechazado, GPU desconectada sin consumo de cuota, reserva concurrente única, bloqueo tras una imagen, acceso ampliado por ID, propiedad de imágenes, asignaciones, confirmación sin doble cobro de cuota, recuperación tras fallo y bloqueo compartido de GPU. La cuenta real del propietario no se utilizó para iniciar el conector durante la implementación; ese inicio requiere su contraseña local después de publicar Render. No se ha afirmado una prueba de extremo a extremo en producción antes de ese paso.

La publicación oficial de WAI (modelo 827184) se consultó el 2026-11-11: v17.0 (versión 2883731) seguía siendo la última listada. No se descargaron checkpoints nuevos.


## Animaciones de interfaz

La navegación usa una salida/entrada breve con AnimatePresence, conservando la ubicación de cada página durante la transición. Al entrar se reinicia el scroll o se respeta el ancla solicitada. El home presenta título, texto, botones y portada de forma escalonada; las secciones inferiores aparecen una vez al entrar en pantalla. Las animaciones de entrada y navegación se omiten cuando el sistema solicita reducir movimiento. No se añadieron dependencias ni se modificaron la generación, cuentas o galerías.
