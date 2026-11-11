# Modelos disponibles

| Modelo | Ejecución | Fuente |
| --- | --- | --- |
| Animagine XL 4.0 | GPU local | https://huggingface.co/cagliostrolab/animagine-xl-4.0 |
| WAI Illustrious SDXL v17 | GPU local | https://civitai.com/models/827184?modelVersionId=2883731 |

Pony, el LoRA CSR y FLUX se retiraron a petición del usuario. El checkpoint de Pony y su adaptador se eliminaron físicamente. FLUX utilizaba una API y no tenía pesos locales: se retiraron su selector, adaptador Python y la llamada remota del backend Node. Las imágenes ya generadas se conservan y muestran el nombre histórico de su modelo.

WAI se descargó de la publicación de WAI0731, modelo 827184, versión 2883731, archivo 2763986. Tamaño: 6,938,040,682 bytes. SHA256 verificado: f116b0c78ff441467b0cdc8f1936e1ed18ea31e9997c7b132b1b8db533f0bd04. Su fuente anuncia usos Image y RentCivit; la integración actual es local, no un servicio comercial de inferencia. Fuente de permisos: https://civitai.com/api/v1/models/827184. Animagine conserva sus condiciones CreativeML Open RAIL++-M.

ILLUST identifica en los ejemplos citados la familia Illustrious/SDXL. No es NovelAI V5/V4.5, que forman parte del servicio de suscripción de NovelAI: https://docs.novelai.net/en/image/models/. No se añadieron pesos ni accesos gratuitos no oficiales de esos modelos.

Los checkpoints se guardan en backend/models, ignorados por Git. El instalador solo ofrece WAI y verifica hash/formato antes de marcarlo instalado. from_single_file usa las configuraciones SDXL locales y el checkpoint elegido, con local_files_only=True. Referencia técnica: https://huggingface.co/docs/diffusers/v0.33.1/api/loaders/single_file.

Cada lote ahora vive en un proceso temporal con un presupuesto de memoria. Salir de ese proceso libera el modelo, la caché de texto y sus asignaciones de PyTorch, en vez de conservarlos indefinidamente. El rendimiento y memoria de una imagen grande no se deducen de una prueba de 512×512: se supervisan los recursos durante la ejecución. Los límites y su alcance se documentan en README-LOCAL.md.
