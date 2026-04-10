#!/usr/bin/env bash
set -Eeuo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
AI_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
APP_DIR="$(cd "${AI_DIR}/.." && pwd)"

APP_USER="${APP_USER:-www-data}"
APP_GROUP="${APP_GROUP:-www-data}"
ENV_FILE="${ENV_FILE:-/etc/photos-face-ai.env}"
REDIS_URL="${REDIS_URL:-redis://127.0.0.1:6379/0}"
TASK_QUEUE="${TASK_QUEUE:-face-ai:tasks}"
RESULT_QUEUE="${RESULT_QUEUE:-face-ai:results}"
TOLERANCE="${TOLERANCE:-0.6}"
POLL_TIMEOUT="${POLL_TIMEOUT:-5}"
PHP_BIN="${PHP_BIN:-/usr/bin/php}"
PYTHON_BIN="${PYTHON_BIN:-}"
VENV_DIR="${VENV_DIR:-${AI_DIR}/.venv}"

FACE_SERVICE_NAME="photos-face-ai.service"
RESULTS_SERVICE_NAME="photos-face-ai-results.service"
QUEUE_SERVICE_NAME="photos-laravel-queue.service"

usage() {
  cat <<EOF
Uso:
  sudo bash ai_service/deploy/install-face-ai-stack.sh [opciones]

Opciones:
  --app-dir RUTA          Ruta del proyecto Laravel. Default: autodetectada
  --app-user USUARIO      Usuario del sistema para correr servicios. Default: ${APP_USER}
  --app-group GRUPO       Grupo del sistema. Default: ${APP_GROUP}
  --env-file RUTA         Archivo de entorno del worker. Default: ${ENV_FILE}
  --php-bin RUTA          Binario PHP. Default: ${PHP_BIN}
  --python-bin RUTA       Binario Python a usar. Default: autodetectado
  --redis-url URL         URL Redis. Default: ${REDIS_URL}
  --task-queue NOMBRE     Cola de tareas. Default: ${TASK_QUEUE}
  --result-queue NOMBRE   Cola de resultados. Default: ${RESULT_QUEUE}
  --tolerance VALOR       Tolerancia facial. Default: ${TOLERANCE}
  --poll-timeout SEG      Poll timeout. Default: ${POLL_TIMEOUT}
  --help                  Muestra esta ayuda
EOF
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --app-dir)
      APP_DIR="$2"
      AI_DIR="${APP_DIR}/ai_service"
      VENV_DIR="${AI_DIR}/.venv"
      shift 2
      ;;
    --app-user)
      APP_USER="$2"
      shift 2
      ;;
    --app-group)
      APP_GROUP="$2"
      shift 2
      ;;
    --env-file)
      ENV_FILE="$2"
      shift 2
      ;;
    --php-bin)
      PHP_BIN="$2"
      shift 2
      ;;
    --python-bin)
      PYTHON_BIN="$2"
      shift 2
      ;;
    --redis-url)
      REDIS_URL="$2"
      shift 2
      ;;
    --task-queue)
      TASK_QUEUE="$2"
      shift 2
      ;;
    --result-queue)
      RESULT_QUEUE="$2"
      shift 2
      ;;
    --tolerance)
      TOLERANCE="$2"
      shift 2
      ;;
    --poll-timeout)
      POLL_TIMEOUT="$2"
      shift 2
      ;;
    --help|-h)
      usage
      exit 0
      ;;
    *)
      echo "Opcion no soportada: $1" >&2
      usage
      exit 1
      ;;
  esac
done

log() {
  printf '\n[%s] %s\n' "$(date '+%Y-%m-%d %H:%M:%S')" "$1"
}

fail() {
  echo "ERROR: $1" >&2
  exit 1
}

require_root() {
  if [[ "${EUID}" -ne 0 ]]; then
    fail "Ejecuta este script con sudo o como root."
  fi
}

detect_package_manager() {
  if command -v apt-get >/dev/null 2>&1; then
    PACKAGE_MANAGER="apt"
  elif command -v dnf >/dev/null 2>&1; then
    PACKAGE_MANAGER="dnf"
  elif command -v yum >/dev/null 2>&1; then
    PACKAGE_MANAGER="yum"
  else
    fail "No encontre apt, dnf ni yum en este servidor."
  fi
}

install_system_packages() {
  log "Verificando e instalando paquetes del sistema"

  case "${PACKAGE_MANAGER}" in
    apt)
      export DEBIAN_FRONTEND=noninteractive
      apt-get update
      apt-get install -y \
        python3 python3-venv python3-pip \
        build-essential cmake libopenblas-dev liblapack-dev libx11-dev \
        redis-server curl
      REDIS_SERVICE_CANDIDATES=("redis-server")
      ;;
    dnf)
      dnf install -y \
        python3 python3-pip python3-devel gcc gcc-c++ make cmake \
        openblas-devel lapack-devel libX11-devel redis curl
      REDIS_SERVICE_CANDIDATES=("redis" "redis-server")
      ;;
    yum)
      yum install -y epel-release || true
      yum install -y \
        python3 python3-pip python3-devel gcc gcc-c++ make cmake \
        openblas-devel lapack-devel libX11-devel redis curl
      REDIS_SERVICE_CANDIDATES=("redis" "redis-server")
      ;;
  esac
}

detect_python() {
  if [[ -n "${PYTHON_BIN}" && -x "${PYTHON_BIN}" ]]; then
    return
  fi

  if command -v python3 >/dev/null 2>&1; then
    PYTHON_BIN="$(command -v python3)"
    return
  fi

  if command -v python >/dev/null 2>&1; then
    PYTHON_BIN="$(command -v python)"
    return
  fi

  fail "Python no quedo disponible despues de la instalacion."
}

ensure_paths() {
  [[ -f "${AI_DIR}/main.py" ]] || fail "No encontre ${AI_DIR}/main.py"
  [[ -f "${AI_DIR}/requirements.txt" ]] || fail "No encontre ${AI_DIR}/requirements.txt"
  [[ -f "${APP_DIR}/artisan" ]] || fail "No encontre ${APP_DIR}/artisan"
  [[ -x "${PHP_BIN}" ]] || fail "No encontre PHP ejecutable en ${PHP_BIN}"
}

ensure_user_group() {
  getent group "${APP_GROUP}" >/dev/null 2>&1 || fail "El grupo ${APP_GROUP} no existe."
  id "${APP_USER}" >/dev/null 2>&1 || fail "El usuario ${APP_USER} no existe."
}

configure_env_file() {
  log "Creando archivo de entorno del worker en ${ENV_FILE}"

  cat > "${ENV_FILE}" <<EOF
FACE_AI_REDIS_URL=${REDIS_URL}
FACE_AI_TASK_QUEUE=${TASK_QUEUE}
FACE_AI_RESULT_QUEUE=${RESULT_QUEUE}
FACE_AI_TOLERANCE=${TOLERANCE}
FACE_AI_POLL_TIMEOUT=${POLL_TIMEOUT}
FACE_AI_HTTP_TIMEOUT=60
EOF

  chmod 640 "${ENV_FILE}"
}

upsert_laravel_env() {
  local env_path="${APP_DIR}/.env"
  local backup_path="${APP_DIR}/.env.face-ai.bak.$(date +%Y%m%d%H%M%S)"

  [[ -f "${env_path}" ]] || fail "No encontre ${env_path}"

  cp "${env_path}" "${backup_path}"
  log "Actualizando variables FACE_AI_* en ${env_path} (backup: ${backup_path})"

  python3 - "${env_path}" "${REDIS_URL}" "${TASK_QUEUE}" "${RESULT_QUEUE}" "${TOLERANCE}" <<'PY'
from pathlib import Path
import sys

env_path = Path(sys.argv[1])
redis_url, task_queue, result_queue, tolerance = sys.argv[2:6]

updates = {
    "FACE_AI_REDIS_URL": redis_url,
    "FACE_AI_REDIS_CONNECTION": "default",
    "FACE_AI_TASK_QUEUE": task_queue,
    "FACE_AI_RESULT_QUEUE": result_queue,
    "FACE_AI_TOLERANCE": tolerance,
}

lines = env_path.read_text(encoding="utf-8").splitlines()
seen = set()
new_lines = []

for line in lines:
    if not line or line.lstrip().startswith("#") or "=" not in line:
        new_lines.append(line)
        continue

    key = line.split("=", 1)[0]
    if key in updates:
        new_lines.append(f"{key}={updates[key]}")
        seen.add(key)
    else:
        new_lines.append(line)

for key, value in updates.items():
    if key not in seen:
        new_lines.append(f"{key}={value}")

env_path.write_text("\n".join(new_lines) + "\n", encoding="utf-8")
PY
}

prepare_virtualenv() {
  log "Preparando entorno virtual en ${VENV_DIR}"

  "${PYTHON_BIN}" --version

  if [[ ! -d "${VENV_DIR}" ]]; then
    "${PYTHON_BIN}" -m venv "${VENV_DIR}"
  fi

  "${VENV_DIR}/bin/python" -m pip install --upgrade pip setuptools wheel
  "${VENV_DIR}/bin/pip" install -r "${AI_DIR}/requirements.txt"
  "${VENV_DIR}/bin/python" -m py_compile "${AI_DIR}/main.py"

  chown -R "${APP_USER}:${APP_GROUP}" "${VENV_DIR}"
}

render_service_file() {
  local target_path="$1"
  local template_name="$2"

  sed \
    -e "s|/var/www/photos/ai_service|${AI_DIR}|g" \
    -e "s|/var/www/photos|${APP_DIR}|g" \
    -e "s|User=www-data|User=${APP_USER}|g" \
    -e "s|Group=www-data|Group=${APP_GROUP}|g" \
    "${SCRIPT_DIR}/${template_name}" > "${target_path}"
}

install_systemd_units() {
  log "Instalando unidades systemd"

  render_service_file "/etc/systemd/system/${FACE_SERVICE_NAME}" "photos-face-ai.service"
  render_service_file "/etc/systemd/system/${RESULTS_SERVICE_NAME}" "photos-face-ai-results.service"
  render_service_file "/etc/systemd/system/${QUEUE_SERVICE_NAME}" "photos-laravel-queue.service"

  chmod 644 "/etc/systemd/system/${FACE_SERVICE_NAME}"
  chmod 644 "/etc/systemd/system/${RESULTS_SERVICE_NAME}"
  chmod 644 "/etc/systemd/system/${QUEUE_SERVICE_NAME}"

  systemctl daemon-reload
}

enable_redis() {
  for service_name in "${REDIS_SERVICE_CANDIDATES[@]}"; do
    if systemctl list-unit-files "${service_name}.service" >/dev/null 2>&1; then
      log "Habilitando ${service_name}.service"
      systemctl enable --now "${service_name}.service"
      return
    fi
  done

  log "No encontre unidad systemd de Redis para habilitar automaticamente"
}

restart_application_services() {
  log "Limpiando cache de configuracion Laravel"
  sudo -u "${APP_USER}" "${PHP_BIN}" "${APP_DIR}/artisan" config:clear
  sudo -u "${APP_USER}" "${PHP_BIN}" "${APP_DIR}/artisan" cache:clear || true

  log "Habilitando y reiniciando servicios"
  systemctl enable --now "${FACE_SERVICE_NAME}"
  systemctl enable --now "${RESULTS_SERVICE_NAME}"
  systemctl enable --now "${QUEUE_SERVICE_NAME}"
}

verify_runtime() {
  log "Verificando Redis"
  if command -v redis-cli >/dev/null 2>&1; then
    redis-cli -u "${REDIS_URL}" PING || fail "Redis no respondio al PING."
  else
    log "redis-cli no esta disponible; omitiendo PING directo"
  fi

  log "Verificando importacion de dependencias Python"
  sudo -u "${APP_USER}" "${VENV_DIR}/bin/python" - <<'PY'
import face_recognition
import redis
import requests
print("python_worker_ok")
PY

  log "Estado de servicios"
  systemctl --no-pager --full status "${FACE_SERVICE_NAME}" || fail "Fallo ${FACE_SERVICE_NAME}"
  systemctl --no-pager --full status "${RESULTS_SERVICE_NAME}" || fail "Fallo ${RESULTS_SERVICE_NAME}"
  systemctl --no-pager --full status "${QUEUE_SERVICE_NAME}" || fail "Fallo ${QUEUE_SERVICE_NAME}"
}

print_summary() {
  cat <<EOF

Instalacion completada.

Servicios habilitados:
  - ${FACE_SERVICE_NAME}
  - ${RESULTS_SERVICE_NAME}
  - ${QUEUE_SERVICE_NAME}

Comandos utiles:
  sudo systemctl status ${FACE_SERVICE_NAME}
  sudo systemctl status ${RESULTS_SERVICE_NAME}
  sudo systemctl status ${QUEUE_SERVICE_NAME}
  sudo journalctl -u ${FACE_SERVICE_NAME} -n 100 --no-pager
  sudo journalctl -u ${RESULTS_SERVICE_NAME} -n 100 --no-pager
  sudo journalctl -u ${QUEUE_SERVICE_NAME} -n 100 --no-pager

Si tu codigo esta en otra ruta o no usas www-data, ejecuta:
  sudo bash ai_service/deploy/install-face-ai-stack.sh --app-dir ${APP_DIR} --app-user ${APP_USER} --app-group ${APP_GROUP}
EOF
}

main() {
  require_root
  detect_package_manager
  install_system_packages
  detect_python
  ensure_paths
  ensure_user_group
  configure_env_file
  upsert_laravel_env
  prepare_virtualenv
  install_systemd_units
  enable_redis
  restart_application_services
  verify_runtime
  print_summary
}

main "$@"
