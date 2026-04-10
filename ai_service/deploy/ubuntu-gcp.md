# Despliegue Ubuntu / GCP

## Instalacion automatica recomendada

Desde la raiz del proyecto:

```bash
sudo bash ai_service/deploy/install-face-ai-stack.sh
```

El instalador hace todo esto:

- verifica e instala `python3`, `venv`, `pip`, Redis y dependencias nativas
- crea `ai_service/.venv`
- instala `requirements.txt`
- genera `/etc/photos-face-ai.env`
- actualiza `FACE_AI_*` en el `.env` de Laravel
- instala y habilita tres servicios `systemd`
- verifica que todo haya quedado activo

## Servicios que deben quedar corriendo

- `photos-face-ai.service`
- `photos-face-ai-results.service`
- `photos-laravel-queue.service`

## Comandos utiles

```bash
sudo systemctl status photos-face-ai.service
sudo systemctl status photos-face-ai-results.service
sudo systemctl status photos-laravel-queue.service
sudo journalctl -u photos-face-ai.service -n 100 --no-pager
```

## Personalizar ruta o usuario

Si tu proyecto no esta en `/var/www/photos` o no usas `www-data`:

```bash
sudo bash ai_service/deploy/install-face-ai-stack.sh \
  --app-dir /ruta/a/photos \
  --app-user tu_usuario \
  --app-group tu_grupo
```

## Nota importante

El microservicio ya no funciona como API HTTP publica. Ahora es un worker interno basado en Redis, asi que la verificacion correcta es por `systemd`, Redis y procesamiento de colas, no por un endpoint `/health`.
