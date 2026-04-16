# PhotOS Face AI Worker

Worker Python para reconocimiento facial asincrono de galerias.

## Modelo operativo

- Laravel encola tareas en Redis.
- `ai_service/main.py` consume la cola `face-ai:tasks`.
- El worker descarga la imagen optimizada desde R2, procesa con un solo modelo compartido y devuelve el resultado en `face-ai:results`.
- Laravel consume los resultados con `php artisan face-ai:consume-results`.

## Variables de entorno

- `FACE_AI_REDIS_URL=redis://127.0.0.1:6379/0`
- `FACE_AI_TASK_QUEUE=face-ai:tasks`
- `FACE_AI_RESULT_QUEUE=face-ai:results`
- `FACE_AI_TOLERANCE=0.6`
- `FACE_AI_POLL_TIMEOUT=5`
- `FACE_AI_HTTP_TIMEOUT=60`
- `FACE_AI_BRAND_DETECTOR=disabled|heuristic`
- `FACE_AI_BRAND_KEYWORDS=nike,adidas,puma,...`
- `FACE_AI_BRAND_API_URL=https://tu-endpoint/logo-detector` (opcional)
- `FACE_AI_SPORTS_VISION_API_URL=https://tu-endpoint/sports-vision` (opcional, fallback externo)
- `FACE_AI_CONTEXT_KEYWORDS=ball,goal,goalpost,net,card,referee,celebration`
- `GEMINI_API_KEY=...`
- `GEMINI_MODEL=gemini-2.0-flash`

## Local (Windows / WAMP)

```bash
cd ai_service
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
python main.py
```

Laravel:

```env
FACE_AI_REDIS_CONNECTION=default
FACE_AI_TASK_QUEUE=face-ai:tasks
FACE_AI_RESULT_QUEUE=face-ai:results
```

En otra terminal de Laravel:

```bash
php artisan queue:work
php artisan face-ai:consume-results
```

## Produccion (Ubuntu / GCP)

```bash
sudo bash ai_service/deploy/install-face-ai-stack.sh
```

Laravel:

```env
FACE_AI_REDIS_CONNECTION=default
FACE_AI_TASK_QUEUE=face-ai:tasks
FACE_AI_RESULT_QUEUE=face-ai:results
```

## Servicios persistentes en produccion

El instalador crea y habilita:

- `photos-face-ai.service`
- `photos-face-ai-results.service`
- `photos-laravel-queue.service`

Tambien se incluyen ejemplos alternativos en:

- `ai_service/deploy/supervisor-photos-face-ai.conf`
- `ai_service/deploy/ecosystem.config.cjs`

## Upgrade funcional

El worker ahora combina dos capas:

- `face_recognition` para rostros y cantidad de personas
- Gemini Flash para sponsors, marcas, dorsales y acciones visuales

El worker ahora devuelve:

- `people_tags`: coincidencias faciales conocidas
- `brand_tags`: marcas detectadas
- `jersey_numbers`: dorsales detectados por OCR/vision
- `sponsor_tags`: patrocinadores visibles
- `context_tags`: contexto de juego como `balon`, `porteria`, `tarjeta`, `arbitro`, `festejo`
- `action_tags`: acciones detectadas por Gemini como `gol`, `remate`, `celebracion`, etc.
- `people_count` / `people_count_label`: conteo agrupado en `1 persona`, `2 personas`, `3 personas` o `4 o mas personas`

Notas sobre marcas:

- Si defines `FACE_AI_BRAND_API_URL`, el worker delega la deteccion de logos a ese endpoint.
- Si no hay endpoint, puedes activar `FACE_AI_BRAND_DETECTOR=heuristic` como fallback basico por nombre de archivo/URL.
- El modo por defecto es `disabled` para no prometer deteccion de logos sin un modelo real.

Notas Gemini:

- `GEMINI_API_KEY` activa el analisis visual real dentro del worker.
- Si no esta configurada, el pipeline facial sigue funcionando y Gemini devuelve listas vacias sin romper nada.
- Los catalogos de marcas y sponsors se envian desde Laravel segun el tenant activo, asi que cada tenant analiza solo sus referencias.
- Los dorsales no necesitan catalogo: Gemini puede leer numeros visibles directamente en camiseta o pantaloneta.

Notas deportivas opcionales:

- `FACE_AI_SPORTS_VISION_API_URL` puede seguir usandose como apoyo externo si quieres enriquecer OCR/contexto por otro servicio.
- Sin ese endpoint, el worker mantiene heuristicas basicas para no bloquear el flujo.

## Notas

- Para `face_recognition` necesitas `dlib` y dependencias nativas.
- En Windows normalmente hace falta instalar Visual Studio Build Tools.
- En Ubuntu suelen hacer falta `cmake`, `libopenblas-dev`, `liblapack-dev` y `libx11-dev`.
- Ya no hay endpoint HTTP publico ni CORS porque el motor opera como worker interno.

