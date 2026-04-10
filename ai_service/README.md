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

## Notas

- Para `face_recognition` necesitas `dlib` y dependencias nativas.
- En Windows normalmente hace falta instalar Visual Studio Build Tools.
- En Ubuntu suelen hacer falta `cmake`, `libopenblas-dev`, `liblapack-dev` y `libx11-dev`.
- Ya no hay endpoint HTTP publico ni CORS porque el motor opera como worker interno.
