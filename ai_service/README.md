# PhotOS Face AI Service

Microservicio FastAPI para reconocimiento facial de galerias.

## Endpoints

- `GET /health`
- `POST /extract-face`
- `POST /compare-faces`

## Variables de entorno

- `FACE_AI_TOLERANCE=0.6`
- `FACE_AI_MAX_UPLOAD_MB=15`
- `FACE_AI_CORS_ORIGINS=*`

## Pruebas rapidas

### Opcion 1: archivo HTTP

Usa `ai_service/test.http` desde VS Code o una extension compatible.

Coloca tus imagenes en:

- `ai_service/samples/reference.jpg`
- `ai_service/samples/group.jpg`

### Opcion 2: smoke test en Python

```bash
cd ai_service
python smoke_test.py --reference samples/reference.jpg --group samples/group.jpg
```

Si solo quieres validar que el servicio arranco:

```bash
cd ai_service
python smoke_test.py
```

## Local (Windows / WAMP)

```bash
cd ai_service
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --host 127.0.0.1 --port 5000 --reload
```

Laravel:

```env
FACE_AI_SERVICE_URL=http://127.0.0.1:5000
```

## Produccion (Ubuntu / GCP)

```bash
cd ai_service
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
gunicorn -w 4 -k uvicorn.workers.UvicornWorker main:app --bind 0.0.0.0:5000
```

Laravel:

```env
FACE_AI_SERVICE_URL=http://10.128.0.5:5000
```

## Notas

- Para `face_recognition` necesitas `dlib` y dependencias nativas.
- En Windows normalmente hace falta instalar Visual Studio Build Tools.
- En Ubuntu suelen hacer falta `cmake`, `libopenblas-dev`, `liblapack-dev` y `libx11-dev`.


Si quieres dejarlo persistente con systemd, usa:

- i_service/deploy/photos-face-ai.service`n- i_service/deploy/face-ai.env.example`n- i_service/deploy/ubuntu-gcp.md`n
