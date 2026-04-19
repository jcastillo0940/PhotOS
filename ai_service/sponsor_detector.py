from __future__ import annotations

import base64
import json
import logging
import os
import re
from pathlib import Path

import requests as http

logger = logging.getLogger(__name__)

GEMINI_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/models'
GEMINI_MODEL = os.getenv('GEMINI_MODEL', 'gemini-2.0-flash')
HTTP_TIMEOUT = int(os.getenv('FACE_AI_HTTP_TIMEOUT', '60'))


def is_enabled() -> bool:
    return bool(os.getenv('GEMINI_API_KEY', '').strip())


def triage_image(image_path: Path) -> dict:
    prompt = 'Responde estrictamente SI o NO. ¿Hay alguna cara humana clara, texto legible o logotipos visibles en esta imagen?'
    response = _call_gemini(prompt, image_path, max_output_tokens=8)
    text = (response.get('text') or '').upper()
    should_process = 'SI' in text and 'NO' not in text[:4]

    return {
        'should_process': should_process,
        'answer': 'SI' if should_process else 'NO',
        'tokens': response.get('tokens', 0),
    }


def analyze_mosaic(image_path: Path, quadrant_ids: list[str], sponsor_keywords: list[str] | None = None) -> dict:
    sponsor_keywords = [str(item).strip() for item in (sponsor_keywords or []) if str(item).strip()]
    quadrants = ', '.join(quadrant_ids)
    sponsor_csv = ', '.join(sponsor_keywords[:80]) if sponsor_keywords else ''

    prompt = (
        'Analiza este mosaico 2x2. Cada cuadrante tiene un ID rojo visible. '
        f'Los IDs esperados son: {quadrants}. '\
        'Responde SOLO con JSON valido sin markdown.\n\n'
        'Para cada cuadrante devuelve:\n'
        '- faces: numero de caras humanas claras visibles\n'
        '- sponsors: arreglo de patrocinadores visibles SOLO de esta lista\n'
        f'{sponsor_csv if sponsor_csv else "(lista vacia)"}\n\n'
        'Formato exacto:\n'
        '{"quadrants":{"IMG-A":{"faces":0,"sponsors":[]},"IMG-B":{"faces":0,"sponsors":[]}}}'
    )

    response = _call_gemini(prompt, image_path)
    parsed = _parse_json(response.get('text', '{}')) or {}
    results = parsed.get('quadrants', {}) if isinstance(parsed, dict) else {}

    normalized: dict[str, dict] = {}
    for quadrant_id in quadrant_ids:
        payload = results.get(quadrant_id, {}) if isinstance(results, dict) else {}
        sponsors = payload.get('sponsors', []) if isinstance(payload, dict) else []
        normalized[quadrant_id] = {
            'faces': int(payload.get('faces', 0)) if isinstance(payload, dict) else 0,
            'sponsors': _match_catalog(_to_str_list(sponsors), sponsor_keywords),
        }

    return {
        'quadrants': normalized,
        'tokens': response.get('tokens', 0),
    }


def analyze_mosaic_full(image_path: Path, quadrant_ids: list[str], sponsor_keywords: list[str] | None = None) -> dict:
    sponsor_keywords = [str(item).strip() for item in (sponsor_keywords or []) if str(item).strip()]
    quadrants = ', '.join(quadrant_ids)
    sponsor_csv = ', '.join(sponsor_keywords[:80]) if sponsor_keywords else '(ninguno)'

    prompt = (
        'Analiza este mosaico 2x2. Cada cuadrante tiene un ID rojo visible. '
        f'Los IDs esperados son: {quadrants}. '
        'Responde SOLO con JSON valido sin markdown.\n\n'
        'Para cada cuadrante devuelve:\n'
        '- faces: numero de caras humanas claras visibles\n'
        f'- sponsors: arreglo de patrocinadores SOLO de esta lista: {sponsor_csv}\n'
        '- brand: nombre de la marca de la camiseta (Nike, Adidas, etc.) o null si no hay\n'
        '- dorsal: numero del dorsal como string o null si no hay\n'
        '- action: UNA de [Gol, Falta, Penal, Tiro_libre, Disputa, Celebracion, Atajada, Otro] o null\n\n'
        'Formato exacto (incluye todos los IDs dados):\n'
        '{"quadrants":{"IMG-A":{"faces":0,"sponsors":[],"brand":null,"dorsal":null,"action":null}}}'
    )

    response = _call_gemini(prompt, image_path)
    parsed = _parse_json(response.get('text', '{}')) or {}
    results = parsed.get('quadrants', {}) if isinstance(parsed, dict) else {}

    normalized: dict[str, dict] = {}
    for quadrant_id in quadrant_ids:
        payload = results.get(quadrant_id, {}) if isinstance(results, dict) else {}
        sponsors = payload.get('sponsors', []) if isinstance(payload, dict) else []
        brand_raw = payload.get('brand') if isinstance(payload, dict) else None
        dorsal_raw = payload.get('dorsal') if isinstance(payload, dict) else None
        action_raw = payload.get('action') if isinstance(payload, dict) else None
        normalized[quadrant_id] = {
            'faces': int(payload.get('faces', 0)) if isinstance(payload, dict) else 0,
            'sponsors': _match_catalog(_to_str_list(sponsors), sponsor_keywords),
            'brand': str(brand_raw).strip() if brand_raw and str(brand_raw).strip().lower() not in ('null', 'n/a', '') else None,
            'dorsal': _clean_dorsal(dorsal_raw),
            'action': _clean_action(action_raw),
        }

    return {
        'quadrants': normalized,
        'tokens': response.get('tokens', 0),
    }


_ACTION_MAP: dict[str, str] = {
    'gol': 'Gol', 'falta': 'Falta', 'penal': 'Penal',
    'tiro_libre': 'Tiro libre', 'tiro libre': 'Tiro libre',
    'disputa': 'Disputa', 'celebracion': 'Celebración', 'celebración': 'Celebración',
    'atajada': 'Atajada', 'otro': 'Otro',
}


def _clean_dorsal(value: object) -> str | None:
    if not value:
        return None
    digits = re.sub(r'\D+', '', str(value))
    return digits if digits else None


def _clean_action(value: object) -> str | None:
    if not value:
        return None
    return _ACTION_MAP.get(str(value).strip().lower())


def _call_gemini(prompt: str, image_path: Path, *, max_output_tokens: int = 512) -> dict:
    if not is_enabled():
        return {'text': '', 'tokens': 0}

    api_key = os.getenv('GEMINI_API_KEY', '').strip()
    image_b64 = base64.b64encode(image_path.read_bytes()).decode('ascii')
    mime_type = _mime_for(image_path)
    payload = {
        'contents': [{
            'parts': [
                {'text': prompt},
                {'inline_data': {'mime_type': mime_type, 'data': image_b64}},
            ],
        }],
        'generationConfig': {
            'temperature': 0.1,
            'maxOutputTokens': max_output_tokens,
            'responseMimeType': 'application/json' if max_output_tokens > 8 else 'text/plain',
        },
    }

    url = f'{GEMINI_BASE_URL}/{GEMINI_MODEL}:generateContent'
    response = http.post(url, params={'key': api_key}, json=payload, timeout=HTTP_TIMEOUT)
    response.raise_for_status()
    body = response.json()
    parts = body.get('candidates', [{}])[0].get('content', {}).get('parts', [])
    raw_text = ''.join(part.get('text', '') for part in parts) if parts else ''
    usage = body.get('usageMetadata', {})
    tokens = int(usage.get('promptTokenCount', 0)) + int(usage.get('candidatesTokenCount', 0))

    return {'text': raw_text.strip(), 'tokens': tokens}


def _parse_json(text: str) -> dict | None:
    clean = text.strip()
    if clean.startswith('```'):
        clean = re.sub(r'^```[a-zA-Z]*\n?', '', clean)
        clean = re.sub(r'\n?```$', '', clean)

    try:
        parsed = json.loads(clean)
        return parsed if isinstance(parsed, dict) else None
    except Exception:
        return None


def _to_str_list(value: object) -> list[str]:
    if not isinstance(value, list):
        return []

    return [str(item).strip() for item in value if str(item).strip()]


def _match_catalog(detected: list[str], catalog: list[str]) -> list[str]:
    index = {c.lower(): c for c in catalog}
    matched: list[str] = []

    for name in detected:
        key = name.lower().strip()
        if key in index:
            if index[key] not in matched:
                matched.append(index[key])
            continue

        for cat_key, original in index.items():
            if cat_key in key or key in cat_key:
                if original not in matched:
                    matched.append(original)
                break

    return matched


def _mime_for(path: Path) -> str:
    return {
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.png': 'image/png',
        '.webp': 'image/webp',
    }.get(path.suffix.lower(), 'image/jpeg')
