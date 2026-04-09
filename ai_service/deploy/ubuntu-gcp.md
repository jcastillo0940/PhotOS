# Despliegue Ubuntu / GCP

## 1. Dependencias del sistema

```bash
sudo apt update
sudo apt install -y python3 python3-venv python3-pip build-essential cmake libopenblas-dev liblapack-dev libx11-dev
```

## 2. Preparar el microservicio

```bash
cd /var/home/photo/ai_service
python3 -m venv .venv
source .venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt
```

## 3. Crear archivo de entorno

```bash
sudo cp /var/home/photo/ai_service/deploy/face-ai.env.example /etc/photos-face-ai.env
sudo nano /etc/photos-face-ai.env
```

Contenido base:

```env
FACE_AI_PORT=5000
FACE_AI_TOLERANCE=0.6
FACE_AI_MAX_UPLOAD_MB=15
FACE_AI_CORS_ORIGINS=*
```

## 4. Registrar el servicio en systemd

```bash
sudo cp /var/home/photo/ai_service/deploy/photos-face-ai.service /etc/systemd/system/photos-face-ai.service
sudo systemctl daemon-reload
sudo systemctl enable photos-face-ai
sudo systemctl start photos-face-ai
```

## 5. Verificar estado

```bash
sudo systemctl status photos-face-ai
journalctl -u photos-face-ai -f
curl http://127.0.0.1:5000/health
```

## 6. Laravel

En el `.env` de Laravel:

```env
FACE_AI_SERVICE_URL=http://127.0.0.1:5000
```

Si Laravel y FastAPI corren en servidores distintos dentro de la misma red privada:

```env
FACE_AI_SERVICE_URL=http://10.128.0.5:5000
```

## 7. Firewall en GCP

Abre el puerto `5000` solo si realmente lo necesitas entre instancias.
Si Laravel y FastAPI viven en la misma VM, no hace falta exponerlo publicamente.

## 8. Actualizar despues de deploy

```bash
cd /var/home/photo/ai_service
source .venv/bin/activate
pip install -r requirements.txt
sudo systemctl restart photos-face-ai
```

