# Despliegue Ubuntu / GCP

## 1. Dependencias del sistema

```bash
sudo apt update
sudo apt install -y python3 python3-venv python3-pip build-essential cmake libopenblas-dev liblapack-dev libx11-dev redis-server
```

## 2. Preparar el worker

```bash
cd /var/www/photos/ai_service
python3 -m venv .venv
source .venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt
```

## 3. Variables de entorno del worker

```bash
sudo nano /etc/photos-face-ai.env
```

Contenido base:

```env
FACE_AI_REDIS_URL=redis://127.0.0.1:6379/0
FACE_AI_TASK_QUEUE=face-ai:tasks
FACE_AI_RESULT_QUEUE=face-ai:results
FACE_AI_TOLERANCE=0.6
FACE_AI_POLL_TIMEOUT=5
```

## 4. Ejecutar el worker

```bash
cd /var/www/photos/ai_service
source .venv/bin/activate
python3 main.py
```

## 5. Laravel

En el `.env` de Laravel:

```env
FACE_AI_REDIS_CONNECTION=default
FACE_AI_TASK_QUEUE=face-ai:tasks
FACE_AI_RESULT_QUEUE=face-ai:results
QUEUE_CONNECTION=database
REDIS_HOST=127.0.0.1
REDIS_PORT=6379
```

Levanta tambien:

```bash
cd /var/www/photos
php artisan queue:work
php artisan face-ai:consume-results
```

## 6. systemd sugerido

Necesitas tres procesos persistentes:

- worker Python `python3 main.py`
- Laravel queue worker `php artisan queue:work`
- consumidor de resultados `php artisan face-ai:consume-results`

## 7. Actualizar despues de deploy

```bash
cd /var/www/photos/ai_service
source .venv/bin/activate
pip install -r requirements.txt
```

Y luego reinicia tus servicios de systemd o supervisor.