from __future__ import annotations

import json
import os
import tempfile
import time
from pathlib import Path
from typing import Any
from urllib.parse import urlparse

import face_recognition
import numpy as np
import redis
import requests
import sponsor_detector

APP_NAME = 'PhotOS Face AI Worker'
APP_VERSION = '2.0.0'
DEFAULT_TOLERANCE = float(os.getenv('FACE_AI_TOLERANCE', '0.6'))
REDIS_URL = os.getenv('FACE_AI_REDIS_URL', 'redis://127.0.0.1:6379/0')
IDENTITY_TASK_QUEUE = os.getenv('FACE_AI_IDENTITY_TASK_QUEUE', 'face-ai:tasks:identity')
RECOGNIZE_TASK_QUEUE = os.getenv('FACE_AI_RECOGNIZE_TASK_QUEUE', 'face-ai:tasks:recognize')
RESULT_QUEUE = os.getenv('FACE_AI_RESULT_QUEUE', 'face-ai:results')
POLL_TIMEOUT = max(1, int(os.getenv('FACE_AI_POLL_TIMEOUT', '5')))
HTTP_TIMEOUT = int(os.getenv('FACE_AI_HTTP_TIMEOUT', '60'))
BRAND_API_URL = os.getenv('FACE_AI_BRAND_API_URL', '').strip()
BRAND_DETECTOR_MODE = os.getenv('FACE_AI_BRAND_DETECTOR', 'disabled').strip().lower()
SPORTS_VISION_API_URL = os.getenv('FACE_AI_SPORTS_VISION_API_URL', '').strip()
BRAND_KEYWORDS = [
    keyword.strip()
    for keyword in os.getenv('FACE_AI_BRAND_KEYWORDS', 'nike,adidas,puma,reebok,under armour,new balance,converse,vans').split(',')
    if keyword.strip()
]
CONTEXT_KEYWORDS = [
    keyword.strip()
    for keyword in os.getenv('FACE_AI_CONTEXT_KEYWORDS', 'ball,goal,goalpost,net,card,referee,celebration').split(',')
    if keyword.strip()
]


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


def detect_brands(task: dict[str, Any], image_path: Path) -> list[str]:
    if BRAND_API_URL:
        return detect_brands_via_api(image_path)

    if BRAND_DETECTOR_MODE == 'heuristic':
        return detect_brands_from_task_context(task)

    return []


def detect_brands_via_api(image_path: Path) -> list[str]:
    with image_path.open('rb') as handle:
        response = requests.post(
            BRAND_API_URL,
            files={'image': (image_path.name, handle, 'application/octet-stream')},
            timeout=HTTP_TIMEOUT,
        )

    response.raise_for_status()
    payload = response.json()
    brands = payload.get('brands', [])

    if not isinstance(brands, list):
        return []

    return normalize_brands(brands)


def detect_brands_from_task_context(task: dict[str, Any]) -> list[str]:
    tokens: list[str] = []

    for value in [task.get('filename'), task.get('image_url')]:
        if not isinstance(value, str):
            continue

        parsed = urlparse(value)
        tokens.append(parsed.path.lower())
        tokens.append(value.lower())

    haystack = ' '.join(tokens)

    # Merge env-level keywords with catalog keywords sent in the task payload
    task_brand_keywords = [str(k).lower() for k in task.get('brand_keywords', []) if k]
    all_keywords = list({*BRAND_KEYWORDS, *task_brand_keywords})
    matches = [brand for brand in all_keywords if brand.lower() in haystack]

    return normalize_brands(matches)


def normalize_brands(brands: list[Any]) -> list[str]:
    normalized: list[str] = []

    for brand in brands:
        label = str(brand).strip()
        if not label:
            continue

        titled = ' '.join(part.capitalize() for part in label.split())
        if titled not in normalized:
            normalized.append(titled)

    return normalized


def people_count_label(count: int) -> str:
    if count <= 0:
        return '0 personas'
    if count == 1:
        return '1 persona'
    if count == 2:
        return '2 personas'
    if count == 3:
        return '3 personas'
    return '4 o mas personas'


def detect_sports_metadata(task: dict[str, Any], image_path: Path) -> dict[str, list[str]]:
    if SPORTS_VISION_API_URL:
        return detect_sports_metadata_via_api(image_path)

    return detect_sports_metadata_from_task_context(task)


def detect_sports_metadata_via_api(image_path: Path) -> dict[str, list[str]]:
    with image_path.open('rb') as handle:
        response = requests.post(
            SPORTS_VISION_API_URL,
            files={'image': (image_path.name, handle, 'application/octet-stream')},
            timeout=HTTP_TIMEOUT,
        )

    response.raise_for_status()
    payload = response.json()

    return {
        'jersey_numbers': normalize_jersey_numbers(payload.get('jersey_numbers', [])),
        'sponsors': normalize_brands(payload.get('sponsors', [])),
        'context_tags': normalize_context_tags(payload.get('context_tags', [])),
        'brands': normalize_brands(payload.get('brands', [])),
    }


def detect_sports_metadata_from_task_context(task: dict[str, Any]) -> dict[str, list[str]]:
    haystack = ' '.join([
        str(task.get('filename', '')).lower(),
        str(task.get('image_url', '')).lower(),
    ])

    jersey_numbers = normalize_jersey_numbers([
        token for token in haystack.replace('-', ' ').replace('_', ' ').split()
        if token.isdigit() and 1 <= len(token) <= 2
    ])

    # Merge env-level keywords with catalog keywords from task payload
    task_sponsor_keywords = [str(k).lower() for k in task.get('sponsor_keywords', []) if k]
    task_brand_keywords = [str(k).lower() for k in task.get('brand_keywords', []) if k]
    task_context_keywords = [str(k).lower() for k in task.get('context_keywords', []) if k]

    all_brand_keywords = list({*BRAND_KEYWORDS, *task_brand_keywords, *task_sponsor_keywords})
    all_context_keywords = list({*CONTEXT_KEYWORDS, *task_context_keywords})

    sponsors = normalize_brands([kw for kw in task_sponsor_keywords if kw in haystack])
    brands = normalize_brands([kw for kw in all_brand_keywords if kw in haystack])
    context_tags = normalize_context_tags([kw for kw in all_context_keywords if kw in haystack])

    return {
        'jersey_numbers': jersey_numbers,
        'sponsors': sponsors,
        'context_tags': context_tags,
        'brands': brands,
    }


def normalize_jersey_numbers(values: list[Any]) -> list[str]:
    normalized: list[str] = []

    for value in values:
        digits = ''.join(character for character in str(value) if character.isdigit())
        if not digits or len(digits) > 2:
            continue

        cleaned = str(int(digits))
        if cleaned not in normalized:
            normalized.append(cleaned)

    return normalized


def normalize_context_tags(values: list[Any]) -> list[str]:
    normalized: list[str] = []

    aliases = {
        'goalpost': 'porteria',
        'goal': 'porteria',
        'net': 'porteria',
        'ball': 'balon',
        'card': 'tarjeta',
        'referee': 'arbitro',
        'celebration': 'festejo',
    }

    for value in values:
        label = aliases.get(str(value).strip().lower(), str(value).strip().lower())
        if not label:
            continue

        titled = label.replace('_', ' ')
        if titled not in normalized:
            normalized.append(titled)

    return normalized


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
        sports_metadata = detect_sports_metadata(task, image_path)
        brands = normalize_brands(detect_brands(task, image_path) + sports_metadata.get('brands', []))

        # --- Gemini Flash visual analysis (additive, does not affect faces) ---
        gemini = sponsor_detector.analyze_image(
            image_path,
            sponsor_keywords=task.get('sponsor_keywords') or [],
            brand_keywords=task.get('brand_keywords') or [],
            jersey_catalog=task.get('jersey_keywords') or [],
        )
        # Merge sponsors: heuristic + Gemini, deduplicating
        all_sponsors = list(dict.fromkeys(
            sports_metadata.get('sponsors', []) + normalize_brands(gemini['sponsors'])
        ))
        # Merge brands: heuristic + Gemini
        all_brands = normalize_brands(
            brands + [b for b in gemini['brands'] if b not in brands]
        )
        # Merge jersey numbers: heuristic + Gemini
        all_jersey_numbers = list(dict.fromkeys(
            sports_metadata.get('jersey_numbers', []) + gemini['jersey_numbers']
        ))
        # Actions come exclusively from Gemini (visual detection)
        action_tags = gemini['actions']
        gemini_tokens = int(gemini.get('tokens', 0))
        # -----------------------------------------------------------------------

        if len(unknown_encodings) == 0:
            return {
                'task_type': 'recognize_photo',
                'tenant_id': task.get('tenant_id'),
                'project_id': task.get('project_id'),
                'photo_id': task.get('photo_id'),
                'status': 'error',
                'error': 'No se detecto ningun rostro en la foto a comparar.',
                'faces_detected': 0,
                'people_count_label': '0 personas',
                'found_ids': [],
                'brands': all_brands,
                'jersey_numbers': all_jersey_numbers,
                'sponsors': all_sponsors,
                'context_tags': sports_metadata.get('context_tags', []),
                'action_tags': action_tags,
                'gemini_tokens': gemini_tokens,
                'matches': [],
                'tolerance': float(task.get('tolerance', DEFAULT_TOLERANCE)),
            }

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
            'people_count_label': people_count_label(len(unknown_encodings)),
            'found_ids': list(found_ids),
            'brands': all_brands,
            'jersey_numbers': all_jersey_numbers,
            'sponsors': all_sponsors,
            'context_tags': sports_metadata.get('context_tags', []),
            'action_tags': action_tags,
            'gemini_tokens': gemini_tokens,
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
    task_queues = [IDENTITY_TASK_QUEUE, RECOGNIZE_TASK_QUEUE]
    print(f'[{APP_NAME}] escuchando {task_queues} y publicando en {RESULT_QUEUE}')

    while True:
        try:
            payload = client.blpop(task_queues, timeout=POLL_TIMEOUT)
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
