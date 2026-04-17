"""
Gemini Flash visual analysis for PhotOS Face AI Worker.

Handles in a SINGLE API call per photo:
  - Sponsor logos   -> only if sponsor catalog is non-empty
  - Brand logos     -> only if brand catalog is non-empty
  - Jersey numbers  -> always by visual pattern (catalog optional)
  - Actions         -> always (predefined list, no catalog needed)

Set GEMINI_API_KEY to enable. Without it every function returns empty
results silently so the rest of the pipeline is unaffected.
"""
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

# Default action labels used when no custom list is supplied.
# Each label is the exact string that will be stored in the DB.
DEFAULT_ACTIONS: list[str] = [
    'gol',
    'celebracion',
    'disputa de balon',
    'portero atajando',
    'remate',
    'falta',
    'entrada',
    'cabezazo',
    'corner',
    'penalti',
    'tarjeta',
    'fuera de juego',
    'lesionado',
    'saque de banda',
    'saque de porteria',
    'calentamiento',
]


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

def is_enabled() -> bool:
    return bool(os.getenv('GEMINI_API_KEY', '').strip())


def analyze_image(
    image_path: Path,
    *,
    sponsor_keywords: list[str] | None = None,
    brand_keywords: list[str] | None = None,
    jersey_catalog: list[str] | None = None,
    action_labels: list[str] | None = None,
) -> dict[str, list[str]]:
    """
    Send *image_path* to Gemini Flash and return a dict with four keys:

        {
            'sponsors':       [...],   # from catalog -> empty list if catalog empty
            'brands':         [...],   # from catalog -> empty list if catalog empty
            'jersey_numbers': [...],   # visible jersey/short numbers, catalog optional
            'actions':        [...],   # always detected (predefined labels)
        }

    Rules:
      - sponsor_keywords is None or []  -> skip sponsor detection entirely
      - brand_keywords is None or []    -> skip brand detection entirely
      - jersey_catalog is None or []    -> detect visible one/two-digit numbers freely
      - action_labels defaults to DEFAULT_ACTIONS; pass [] to disable
      - If GEMINI_API_KEY is absent -> returns all-empty dict immediately
    """
    empty: dict = {
        'sponsors': [], 'brands': [], 'jersey_numbers': [], 'actions': [],
        'tokens': 0, 'faces_detected': 0,
    }

    api_key = os.getenv('GEMINI_API_KEY', '').strip()
    if not api_key:
        return empty

    sponsors = list(sponsor_keywords or [])
    brands = list(brand_keywords or [])
    jerseys = list(jersey_catalog or [])
    actions = action_labels if action_labels is not None else DEFAULT_ACTIONS

    # Nothing to detect -> skip API call
    if not sponsors and not brands and not actions:
        return empty

    try:
        image_b64 = base64.b64encode(image_path.read_bytes()).decode('ascii')
        mime_type = _mime_for(image_path)
        prompt = _build_prompt(sponsors, brands, jerseys, actions)

        payload = {
            'contents': [{
                'parts': [
                    {'text': prompt},
                    {'inline_data': {'mime_type': mime_type, 'data': image_b64}},
                ],
            }],
            'generationConfig': {
                'temperature': 0.1,
                'maxOutputTokens': 1024,
                'responseMimeType': 'application/json',
            },
        }

        url = f'{GEMINI_BASE_URL}/{GEMINI_MODEL}:generateContent'
        response = http.post(
            url,
            params={'key': api_key},
            json=payload,
            timeout=HTTP_TIMEOUT,
        )
        response.raise_for_status()

        body = response.json()
        parts = (
            body
            .get('candidates', [{}])[0]
            .get('content', {})
            .get('parts', [])
        )
        raw_text = ''.join(p.get('text', '') for p in parts) if parts else '{}'
        usage = body.get('usageMetadata', {})
        prompt_tokens = int(usage.get('promptTokenCount', 0))
        output_tokens = int(usage.get('candidatesTokenCount', 0))
        tokens = prompt_tokens + output_tokens

        result = _parse_result(raw_text)
        result['tokens'] = tokens
        result.setdefault('faces_detected', 0)

        if sponsors:
            result['sponsors'] = _match_catalog(result.get('sponsors', []), sponsors)
        else:
            result['sponsors'] = []

        if brands:
            result['brands'] = _match_catalog(result.get('brands', []), brands)
        else:
            result['brands'] = []

        if jerseys:
            result['jersey_numbers'] = _match_catalog(
                result.get('jersey_numbers', []), jerseys
            )
        else:
            result['jersey_numbers'] = _normalize_detected_jerseys(
                result.get('jersey_numbers', [])
            )

        if actions:
            result['actions'] = _match_catalog(result.get('actions', []), actions)
        else:
            result['actions'] = []

        return result

    except http.exceptions.HTTPError as exc:
        code = exc.response.status_code if exc.response is not None else '?'
        logger.warning('Gemini API HTTP %s: %s', code, exc)
    except Exception as exc:
        logger.warning('analyze_image fallo (%s): %s', type(exc).__name__, exc)

    return empty


# ---------------------------------------------------------------------------
# Prompt builder
# ---------------------------------------------------------------------------

def _build_prompt(
    sponsors: list[str],
    brands: list[str],
    jerseys: list[str],
    actions: list[str],  # kept for API compatibility
) -> str:
    sponsors_csv = ','.join(sponsors[:30]) if sponsors else ''
    brands_csv = ','.join(brands[:20]) if brands else ''
    jerseys_csv = ','.join(jerseys[:20]) if jerseys else ''

    detect_lines = ['1. Faces: count visible human faces']

    if sponsors_csv:
        detect_lines.append(f'2. Sponsors: logos/text matching: {sponsors_csv}')
    else:
        detect_lines.append('2. Sponsors: return []')

    if brands_csv:
        detect_lines.append(f'3. Brands: visible brands from: {brands_csv}')
    else:
        detect_lines.append('3. Brands: return []')

    if jerseys_csv:
        detect_lines.append(f'4. Jerseys: team jerseys from: {jerseys_csv}')
    else:
        detect_lines.append('4. Jerseys: any one or two digit number visible on player uniforms')

    detect_section = '\n'.join(detect_lines)

    return (
        'Analyze image. Respond ONLY valid JSON, no markdown.\n\n'
        f'DETECT:\n{detect_section}\n\n'
        'OUTPUT FORMAT:\n'
        '{"faces":N,"sponsors":["name",...],"brands":["name",...],"jerseys":["name",...]}\n\n'
        'RULES:\n'
        '- Only include items actually visible, not guessed\n'
        '- Empty array [] if nothing found\n'
        '- No explanations, no extra fields'
    )


# ---------------------------------------------------------------------------
# Response parsing
# ---------------------------------------------------------------------------

def _parse_result(text: str) -> dict[str, list[str]]:
    """Parse Gemini's JSON response, tolerating markdown fences and truncated JSON."""
    clean = text.strip()
    if clean.startswith('```'):
        clean = re.sub(r'^```[a-z]*\n?', '', clean)
        clean = re.sub(r'\n?```$', '', clean.rstrip())

    parsed = _try_json_loads(clean)

    if parsed is None:
        logger.warning('No se pudo parsear respuesta Gemini: %s', text[:200])
        return {'sponsors': [], 'brands': [], 'jersey_numbers': [], 'actions': [], 'faces_detected': 0}

    faces = parsed.get('faces', 0)
    return {
        'sponsors': _to_str_list(parsed.get('sponsors')),
        'brands': _to_str_list(parsed.get('brands')),
        'jersey_numbers': _to_str_list(parsed.get('jerseys') or parsed.get('jersey_numbers')),
        'actions': _to_str_list(parsed.get('actions')),
        'faces_detected': int(faces) if isinstance(faces, (int, float)) else 0,
    }


def _try_json_loads(text: str) -> dict | None:
    """Try to parse JSON, repairing truncated responses if needed."""
    try:
        parsed = json.loads(text)
        if isinstance(parsed, dict):
            return parsed
    except (json.JSONDecodeError, ValueError):
        pass

    # Attempt repair: find the last complete key-value pair and close the object
    last_brace = text.rfind('"')
    if last_brace == -1:
        return None

    # Truncate at the last comma before the incomplete field and close the object
    last_comma = text.rfind(',')
    candidate = (text[:last_comma] if last_comma > 0 else text).rstrip() + '}'
    try:
        parsed = json.loads(candidate)
        if isinstance(parsed, dict):
            logger.warning('JSON truncado reparado (eliminado ultimo campo incompleto)')
            return parsed
    except (json.JSONDecodeError, ValueError):
        pass

    return None


def _to_str_list(value: object) -> list[str]:
    if not isinstance(value, list):
        return []
    return [str(item).strip() for item in value if str(item).strip()]


def _normalize_detected_jerseys(values: list[str]) -> list[str]:
    normalized: list[str] = []

    for value in values:
        digits = ''.join(character for character in str(value) if character.isdigit())
        if not digits or len(digits) > 2:
            continue

        cleaned = str(int(digits))
        if cleaned not in normalized:
            normalized.append(cleaned)

    return normalized


def _match_catalog(detected: list[str], catalog: list[str]) -> list[str]:
    """
    Return items from *detected* that match *catalog* entries
    (case-insensitive, substring in either direction).
    Always returns the original catalog spelling.
    """
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


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _mime_for(path: Path) -> str:
    return {
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.png': 'image/png',
        '.webp': 'image/webp',
        '.gif': 'image/gif',
    }.get(path.suffix.lower(), 'image/jpeg')
