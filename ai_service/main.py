from __future__ import annotations

import json
import os
import tempfile
import time
from pathlib import Path
from typing import Any

import face_recognition
import numpy as np
import redis
import requests

APP_NAME = 'PhotOS Face AI Worker'
APP_VERSION = '2.0.0'
DEFAULT_TOLERANCE = float(os.getenv('FACE_AI_TOLERANCE', '0.6'))
REDIS_URL = os.getenv('FACE_AI_REDIS_URL', 'redis://127.0.0.1:6379/0')
TASK_QUEUE = os.getenv('FACE_AI_TASK_QUEUE', 'face-ai:tasks')
RESULT_QUEUE = os.getenv('FACE_AI_RESULT_QUEUE', 'face-ai:results')
POLL_TIMEOUT = max(1, int(os.getenv('FACE_AI_POLL_TIMEOUT', '5')))
HTTP_TIMEOUT = int(os.getenv('FACE_AI_HTTP_TIMEOUT', '60'))


def redis_client() -> redis.Redis:
    return redis.Redis.from_url(REDIS_URL, decode_responses=True)


def download_image_to_temp(url: str) -> Path:
    response = requests.get(url, timeout=HTTP_TIMEOUT)
    response.raise_for_status()

    suffix = Path(url.split('?', 1)[0]).suffix or '.img'
    handle = tempfile.NamedTemporaryFile(delete=False, suffix=suffix)
    try:
        handle.write(response.content)
        handle.flush()
    finally:
        handle.close()

    return Path(handle.name)


def load_image(path: Path) -> np.ndarray[Any, Any]:
    return face_recognition.load_image_file(str(path))


def extract_encodings(image: np.ndarray[Any, Any]) -> list[np.ndarray[Any, Any]]:
    return face_recognition.face_encodings(image)


def parse_database(database: list[dict[str, Any]]) -> list[dict[str, Any]]:
    parsed: list[dict[str, Any]] = []

    for item in database:
        person_id = item.get('id')
        name = item.get('name')
        vector = item.get('vector')

        if person_id is None or not isinstance(vector, list) or len(vector) == 0:
            continue

        parsed.append({
            'id': person_id,
            'name': name,
            'vector': np.array(vector, dtype=np.float64),
        })

    return parsed


def process_extract_identity(task: dict[str, Any]) -> dict[str, Any]:
    image_path: Path | None = None

    try:
        image_path = download_image_to_temp(task['image_url'])
        image = load_image(image_path)
        encodings = extract_encodings(image)

        if len(encodings) == 0:
            raise ValueError('No se detecto ningun rostro.')

        if len(encodings) > 1:
            raise ValueError('La imagen de referencia debe contener un solo rostro.')

        return {
            'task_type': 'extract_identity',
            'tenant_id': task.get('tenant_id'),
            'project_id': task.get('project_id'),
            'face_identity_id': task.get('face_identity_id'),
            'vector': encodings[0].tolist(),
            'faces_detected': len(encodings),
            'status': 'success',
        }
    except Exception as exc:
        return {
            'task_type': 'extract_identity',
            'tenant_id': task.get('tenant_id'),
            'project_id': task.get('project_id'),
            'face_identity_id': task.get('face_identity_id'),
            'status': 'error',
            'error': str(exc),
        }
    finally:
        if image_path and image_path.exists():
            image_path.unlink(missing_ok=True)


def process_recognize_photo(task: dict[str, Any]) -> dict[str, Any]:
    image_path: Path | None = None

    try:
        known_people = parse_database(task.get('database', []))
        if not known_people:
            raise ValueError('No hay vectores validos en la base de datos enviada.')

        image_path = download_image_to_temp(task['image_url'])
        image = load_image(image_path)
        unknown_encodings = extract_encodings(image)

        if len(unknown_encodings) == 0:
            raise ValueError('No se detecto ningun rostro en la foto a comparar.')

        found_ids: set[Any] = set()
        matches: list[dict[str, Any]] = []
        tolerance = float(task.get('tolerance', DEFAULT_TOLERANCE))

        for unknown_index, unknown_encoding in enumerate(unknown_encodings):
            for person in known_people:
                is_match = face_recognition.compare_faces([person['vector']], unknown_encoding, tolerance=tolerance)[0]
                if not is_match:
                    continue

                distance = float(face_recognition.face_distance([person['vector']], unknown_encoding)[0])
                found_ids.add(person['id'])
                matches.append({
                    'face_index': unknown_index,
                    'id': person['id'],
                    'name': person.get('name'),
                    'distance': round(distance, 6),
                })

        return {
            'task_type': 'recognize_photo',
            'tenant_id': task.get('tenant_id'),
            'project_id': task.get('project_id'),
            'photo_id': task.get('photo_id'),
            'status': 'success',
            'faces_detected': len(unknown_encodings),
            'found_ids': list(found_ids),
            'matches': matches,
            'tolerance': tolerance,
        }
    except Exception as exc:
        return {
            'task_type': 'recognize_photo',
            'tenant_id': task.get('tenant_id'),
            'project_id': task.get('project_id'),
            'photo_id': task.get('photo_id'),
            'status': 'error',
            'error': str(exc),
        }
    finally:
        if image_path and image_path.exists():
            image_path.unlink(missing_ok=True)


def process_task(task: dict[str, Any]) -> dict[str, Any]:
    task_type = task.get('task_type')
    if task_type == 'extract_identity':
        return process_extract_identity(task)
    if task_type == 'recognize_photo':
        return process_recognize_photo(task)

    return {
        'task_type': task_type,
        'tenant_id': task.get('tenant_id'),
        'status': 'error',
        'error': f'Tipo de tarea no soportado: {task_type}',
    }


def main() -> None:
    client = redis_client()
    print(f'[{APP_NAME}] escuchando {TASK_QUEUE} y publicando en {RESULT_QUEUE}')

    while True:
        try:
            payload = client.blpop(TASK_QUEUE, timeout=POLL_TIMEOUT)
            if not payload:
                continue

            _, message = payload
            task = json.loads(message)
            result = process_task(task)
            client.rpush(RESULT_QUEUE, json.dumps(result, ensure_ascii=False))
        except KeyboardInterrupt:
            raise
        except Exception as exc:
            client.rpush(RESULT_QUEUE, json.dumps({
                'task_type': 'worker',
                'status': 'error',
                'error': str(exc),
            }, ensure_ascii=False))
            time.sleep(1)


if __name__ == '__main__':
    main()
