from __future__ import annotations

import json
import os
import tempfile
import time
import uuid
from pathlib import Path
from typing import Any

import cv2
import numpy as np
import redis
import requests
import sponsor_detector
from insightface.app import FaceAnalysis
from PIL import Image, ImageDraw

APP_NAME = 'PhotOS Face AI Worker'
APP_VERSION = '4.0.0'
# Cosine distance threshold (0=identical, 1=opposite). buffalo_l: ~0.45 is a solid default.
DEFAULT_TOLERANCE = float(os.getenv('FACE_AI_TOLERANCE', '0.45'))
REDIS_URL = os.getenv('FACE_AI_REDIS_URL', 'redis://127.0.0.1:6379/0')
IDENTITY_TASK_QUEUE = os.getenv('FACE_AI_IDENTITY_TASK_QUEUE', 'face-ai:tasks:identity')
RECOGNIZE_TASK_QUEUE = os.getenv('FACE_AI_RECOGNIZE_TASK_QUEUE', 'face-ai:tasks:recognize')
RESULT_QUEUE = os.getenv('FACE_AI_RESULT_QUEUE', 'face-ai:results')
POLL_TIMEOUT = max(1, int(os.getenv('FACE_AI_POLL_TIMEOUT', '5')))
HTTP_TIMEOUT = int(os.getenv('FACE_AI_HTTP_TIMEOUT', '60'))

QUADRANT_IDS = ['IMG-A', 'IMG-B', 'IMG-C', 'IMG-D']

INSIGHTFACE_ROOT = os.getenv('INSIGHTFACE_ROOT', os.path.join(os.path.dirname(__file__), '.insightface'))

_face_app: FaceAnalysis | None = None


def get_face_app() -> FaceAnalysis:
    global _face_app
    if _face_app is None:
        _face_app = FaceAnalysis(
            name='buffalo_l',
            root=INSIGHTFACE_ROOT,
            providers=['CUDAExecutionProvider', 'CPUExecutionProvider'],
        )
        # ctx_id=0 uses first GPU; -1 forces CPU
        _face_app.prepare(ctx_id=-1, det_size=(640, 640))
    return _face_app


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


def load_image_cv2(path: Path) -> np.ndarray:
    img = cv2.imread(str(path))
    if img is None:
        # Fallback for formats cv2 may struggle with (e.g. WebP on some builds)
        pil_img = Image.open(str(path)).convert('RGB')
        img = cv2.cvtColor(np.array(pil_img), cv2.COLOR_RGB2BGR)
    return img


def cosine_distance(a: np.ndarray, b: np.ndarray) -> float:
    norm_a = float(np.linalg.norm(a))
    norm_b = float(np.linalg.norm(b))
    if norm_a == 0.0 or norm_b == 0.0:
        return 1.0
    return float(1.0 - np.dot(a, b) / (norm_a * norm_b))


def parse_database(database: list[dict[str, Any]]) -> list[dict[str, Any]]:
    parsed: list[dict[str, Any]] = []

    for item in database:
        identity_id = item.get('id')
        if identity_id is None:
            continue

        # New multi-vector format: vectors=[{vector_id, embedding}, ...]
        vectors_raw = item.get('vectors')
        # Legacy single-vector format: vector=[...]
        legacy_vector = item.get('vector')

        if vectors_raw and isinstance(vectors_raw, list):
            vectors = [
                np.array(v['embedding'], dtype=np.float32)
                for v in vectors_raw
                if isinstance(v, dict) and isinstance(v.get('embedding'), list) and len(v['embedding']) > 0
            ]
        elif isinstance(legacy_vector, list) and len(legacy_vector) > 0:
            vectors = [np.array(legacy_vector, dtype=np.float32)]
        else:
            continue

        if not vectors:
            continue

        parsed.append({
            'id': identity_id,
            'name': item.get('name'),
            'vectors': vectors,
        })

    return parsed


def best_distance_for_identity(face_embedding: np.ndarray, person: dict[str, Any]) -> float:
    return min(cosine_distance(face_embedding, v) for v in person['vectors'])


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


def process_extract_identity(task: dict[str, Any]) -> dict[str, Any]:
    image_path: Path | None = None

    try:
        image_path = download_image_to_temp(task['image_url'])
        img = load_image_cv2(image_path)
        app = get_face_app()
        faces = app.get(img)

        if len(faces) == 0:
            raise ValueError('No se detecto ningun rostro.')

        if len(faces) > 1:
            raise ValueError('La imagen de referencia debe contener un solo rostro.')

        return {
            'task_type': 'extract_identity',
            'tenant_id': task.get('tenant_id'),
            'project_id': task.get('project_id'),
            'face_identity_id': task.get('face_identity_id'),
            'vector': faces[0].embedding.tolist(),
            'faces_detected': 1,
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
        cleanup_temp_files([image_path])


def process_recognize_photo(task: dict[str, Any]) -> dict[str, Any]:
    image_path: Path | None = None

    try:
        known_people = parse_database(task.get('database', []))
        if not known_people:
            raise ValueError('No hay vectores validos en la base de datos enviada.')

        image_path = download_image_to_temp(task['image_url'])
        result = analyze_photo_locally(task, image_path, known_people)
        return result
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
        cleanup_temp_files([image_path])


def process_recognize_batch(task: dict[str, Any]) -> dict[str, Any]:
    known_people = parse_database(task.get('database', []))
    if not known_people:
        return {
            'task_type': 'recognize_batch',
            'tenant_id': task.get('tenant_id'),
            'project_id': task.get('project_id'),
            'status': 'error',
            'error': 'No hay vectores validos en la base de datos enviada.',
            'results': [],
        }

    temp_files: list[Path | None] = []
    ai_variants: dict[int, Path] = {}
    local_results: list[dict[str, Any]] = []
    sponsor_keywords = [str(item).strip() for item in task.get('sponsor_keywords', []) if str(item).strip()]
    supports_sponsors = bool(task.get('supports_sponsors')) and bool(sponsor_keywords) and sponsor_detector.is_enabled()

    try:
        for photo_payload in task.get('photos', []):
            image_path = download_image_to_temp(photo_payload['image_url'])
            temp_files.append(image_path)
            local_result = analyze_photo_locally({
                **task,
                'photo_id': photo_payload.get('photo_id'),
                'filename': photo_payload.get('filename'),
            }, image_path, known_people)
            local_results.append(local_result)

            if supports_sponsors and image_path.exists():
                ai_variants[photo_payload['photo_id']] = create_ai_variant(image_path)
                temp_files.append(ai_variants[photo_payload['photo_id']])

        if supports_sponsors:
            apply_gemini_pipeline(local_results, ai_variants, sponsor_keywords)

        return {
            'task_type': 'recognize_batch',
            'tenant_id': task.get('tenant_id'),
            'project_id': task.get('project_id'),
            'status': 'success',
            'results': local_results,
        }
    except Exception as exc:
        return {
            'task_type': 'recognize_batch',
            'tenant_id': task.get('tenant_id'),
            'project_id': task.get('project_id'),
            'status': 'error',
            'error': str(exc),
            'results': local_results,
        }
    finally:
        cleanup_temp_files(temp_files)


def analyze_photo_locally(
    task: dict[str, Any],
    image_path: Path,
    known_people: list[dict[str, Any]],
) -> dict[str, Any]:
    img = load_image_cv2(image_path)
    app = get_face_app()
    faces = app.get(img)
    tolerance = float(task.get('tolerance', DEFAULT_TOLERANCE))
    img_h, img_w = img.shape[:2]

    if len(faces) == 0:
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
            'brands': [],
            'jersey_numbers': [],
            'sponsors': [],
            'context_tags': [],
            'action_tags': [],
            'gemini_tokens': 0,
            'gemini_batch_size': 1,
            'matches': [],
            'unknown_faces': [],
            'tolerance': tolerance,
        }

    found_ids: set[Any] = set()
    matches: list[dict[str, Any]] = []
    unknown_faces: list[dict[str, Any]] = []

    for face_index, face in enumerate(faces):
        face_embedding: np.ndarray = face.embedding
        bbox = face.bbox.tolist()  # [x1, y1, x2, y2] pixels
        bbox_pct = [
            round(max(0.0, bbox[0] / img_w), 4),
            round(max(0.0, bbox[1] / img_h), 4),
            round(min(1.0, bbox[2] / img_w), 4),
            round(min(1.0, bbox[3] / img_h), 4),
        ]

        best_person: dict[str, Any] | None = None
        best_distance = 1.0

        for person in known_people:
            dist = best_distance_for_identity(face_embedding, person)
            if dist < best_distance:
                best_distance = dist
                best_person = person

        if best_person is not None and best_distance <= tolerance:
            found_ids.add(best_person['id'])
            matches.append({
                'face_index': face_index,
                'id': best_person['id'],
                'name': best_person.get('name'),
                'distance': round(best_distance, 6),
            })
        else:
            # Unmatched — store embedding + closest candidate for manual review
            unknown_entry: dict[str, Any] = {
                'face_index': face_index,
                'embedding': face_embedding.tolist(),
                'bbox': bbox_pct,
                'best_match_identity_id': best_person['id'] if best_person else None,
                'best_confidence': round(1.0 - best_distance, 4) if best_person else 0.0,
            }
            unknown_faces.append(unknown_entry)

    return {
        'task_type': 'recognize_photo',
        'tenant_id': task.get('tenant_id'),
        'project_id': task.get('project_id'),
        'photo_id': task.get('photo_id'),
        'status': 'success',
        'faces_detected': len(faces),
        'people_count_label': people_count_label(len(faces)),
        'found_ids': list(found_ids),
        'brands': [],
        'jersey_numbers': [],
        'sponsors': [],
        'context_tags': [],
        'action_tags': [],
        'gemini_tokens': 0,
        'gemini_batch_size': 1,
        'matches': matches,
        'unknown_faces': unknown_faces,
        'tolerance': tolerance,
    }


def apply_gemini_pipeline(
    local_results: list[dict[str, Any]],
    ai_variants: dict[int, Path],
    sponsor_keywords: list[str],
) -> None:
    eligible: list[tuple[str, dict[str, Any], Path, int]] = []

    for index, result in enumerate(local_results):
        photo_id = result.get('photo_id')
        ai_path = ai_variants.get(photo_id)
        if not ai_path:
            continue

        triage = sponsor_detector.triage_image(ai_path)
        result['gemini_tokens'] = int(triage.get('tokens', 0))
        result['gemini_request_id'] = f"triage-{uuid.uuid4()}"
        result['gemini_batch_size'] = 1

        if triage.get('should_process'):
            eligible.append((QUADRANT_IDS[index], result, ai_path, int(triage.get('tokens', 0))))

    if not eligible:
        return

    mosaic_path = create_mosaic([(quadrant_id, path) for quadrant_id, _, path, _ in eligible])
    try:
        mosaic = sponsor_detector.analyze_mosaic(
            mosaic_path,
            [quadrant_id for quadrant_id, _, _, _ in eligible],
            sponsor_keywords,
        )
    finally:
        cleanup_temp_files([mosaic_path])

    mosaic_tokens = int(mosaic.get('tokens', 0))
    request_id = f"mosaic-{uuid.uuid4()}"
    quadrant_results = mosaic.get('quadrants', {})
    per_photo_tokens = distribute_tokens(mosaic_tokens, len(eligible))

    for offset, (quadrant_id, result, _, triage_tokens) in enumerate(eligible):
        quadrant_payload = quadrant_results.get(quadrant_id, {}) if isinstance(quadrant_results, dict) else {}
        result['sponsors'] = quadrant_payload.get('sponsors', []) if isinstance(quadrant_payload, dict) else []
        result['faces_detected'] = max(
            int(quadrant_payload.get('faces', 0)) if isinstance(quadrant_payload, dict) else 0,
            int(result.get('faces_detected', 0)),
        )
        result['gemini_tokens'] = triage_tokens + per_photo_tokens[offset]
        result['gemini_request_id'] = request_id
        result['gemini_batch_size'] = len(eligible)


def create_ai_variant(image_path: Path, max_side: int = 800) -> Path:
    image = Image.open(image_path).convert('RGB')
    image.thumbnail((max_side, max_side))
    handle = tempfile.NamedTemporaryFile(delete=False, suffix='.jpg')
    output = Path(handle.name)
    handle.close()
    image.save(output, format='JPEG', quality=88)
    return output


def create_mosaic(items: list[tuple[str, Path]]) -> Path:
    prepared: list[tuple[str, Image.Image]] = []
    for quadrant_id, path in items:
        image = Image.open(path).convert('RGB')
        image.thumbnail((800, 800))
        prepared.append((quadrant_id, image))

    tile_width = max(image.width for _, image in prepared)
    tile_height = max(image.height for _, image in prepared)
    mosaic = Image.new('RGB', (tile_width * 2, tile_height * 2), color=(18, 18, 18))

    for index, (quadrant_id, image) in enumerate(prepared):
        x = (index % 2) * tile_width
        y = (index // 2) * tile_height
        mosaic.paste(image, (x, y))

        draw = ImageDraw.Draw(mosaic)
        draw.rectangle((x + 18, y + 18, x + 180, y + 72), fill=(190, 25, 25))
        draw.text((x + 28, y + 30), quadrant_id, fill=(255, 255, 255))

    handle = tempfile.NamedTemporaryFile(delete=False, suffix='.jpg')
    output = Path(handle.name)
    handle.close()
    mosaic.save(output, format='JPEG', quality=90)
    return output


def distribute_tokens(total_tokens: int, count: int) -> list[int]:
    if count <= 0:
        return []

    base = total_tokens // count
    remainder = total_tokens % count
    return [base + (1 if index < remainder else 0) for index in range(count)]


def cleanup_temp_files(paths: list[Path | None]) -> None:
    for path in paths:
        if path and path.exists():
            path.unlink(missing_ok=True)


def process_task(task: dict[str, Any]) -> dict[str, Any]:
    task_type = task.get('task_type')
    if task_type == 'extract_identity':
        return process_extract_identity(task)
    if task_type == 'recognize_photo':
        return process_recognize_photo(task)
    if task_type == 'recognize_batch':
        return process_recognize_batch(task)

    return {
        'task_type': task_type,
        'tenant_id': task.get('tenant_id'),
        'status': 'error',
        'error': f'Tipo de tarea no soportado: {task_type}',
    }


def main() -> None:
    client = redis_client()
    # Warm up model on start so first request is not slow
    get_face_app()
    task_queues = [IDENTITY_TASK_QUEUE, RECOGNIZE_TASK_QUEUE]
    print(f'[{APP_NAME} v{APP_VERSION}] escuchando {task_queues} y publicando en {RESULT_QUEUE}')

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
