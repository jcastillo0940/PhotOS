from __future__ import annotations

import io
import json
import os
from typing import Any

import face_recognition
import numpy as np
from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware


APP_NAME = "PhotOS Face AI Service"
APP_VERSION = "1.0.0"
DEFAULT_TOLERANCE = float(os.getenv("FACE_AI_TOLERANCE", "0.6"))
MAX_UPLOAD_MB = int(os.getenv("FACE_AI_MAX_UPLOAD_MB", "15"))
MAX_UPLOAD_BYTES = MAX_UPLOAD_MB * 1024 * 1024


app = FastAPI(
    title=APP_NAME,
    version=APP_VERSION,
    docs_url="/docs",
    redoc_url="/redoc",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=os.getenv("FACE_AI_CORS_ORIGINS", "*").split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def _validate_upload(file: UploadFile, payload: bytes) -> None:
    if not payload:
        raise HTTPException(status_code=422, detail="El archivo esta vacio.")

    if len(payload) > MAX_UPLOAD_BYTES:
        raise HTTPException(
            status_code=413,
            detail=f"El archivo supera el limite permitido de {MAX_UPLOAD_MB} MB.",
        )

    content_type = (file.content_type or "").lower()
    if content_type and not content_type.startswith("image/"):
        raise HTTPException(
            status_code=415,
            detail="Solo se permiten imagenes para reconocimiento facial.",
        )


def _load_image_from_upload(file: UploadFile, payload: bytes) -> np.ndarray[Any, Any]:
    try:
        return face_recognition.load_image_file(io.BytesIO(payload))
    except Exception as exc:  # pragma: no cover
        raise HTTPException(
            status_code=422,
            detail="No fue posible leer la imagen enviada.",
        ) from exc


async def _read_upload(file: UploadFile) -> tuple[np.ndarray[Any, Any], bytes]:
    payload = await file.read()
    _validate_upload(file, payload)
    image = _load_image_from_upload(file, payload)
    return image, payload


def _extract_encodings(image: np.ndarray[Any, Any]) -> list[np.ndarray[Any, Any]]:
    try:
        return face_recognition.face_encodings(image)
    except Exception as exc:  # pragma: no cover
        raise HTTPException(
            status_code=422,
            detail="No fue posible procesar rostros en la imagen.",
        ) from exc


def _parse_database(raw_database: str) -> list[dict[str, Any]]:
    try:
        database = json.loads(raw_database)
    except json.JSONDecodeError as exc:
        raise HTTPException(status_code=422, detail="La base de datos enviada no es JSON valido.") from exc

    if not isinstance(database, list):
        raise HTTPException(status_code=422, detail="La base de datos debe ser una lista de personas.")

    parsed: list[dict[str, Any]] = []

    for item in database:
        if not isinstance(item, dict):
            continue

        person_id = item.get("id")
        vector = item.get("vector")

        if person_id is None or not isinstance(vector, list) or len(vector) == 0:
            continue

        try:
            parsed.append(
                {
                    "id": person_id,
                    "vector": np.array(vector, dtype=np.float64),
                }
            )
        except Exception:
            continue

    return parsed


@app.get("/")
def root() -> dict[str, Any]:
    return {
        "service": APP_NAME,
        "version": APP_VERSION,
        "status": "ok",
    }


@app.get("/health")
def health() -> dict[str, Any]:
    return {
        "status": "ok",
        "version": APP_VERSION,
        "tolerance": DEFAULT_TOLERANCE,
        "max_upload_mb": MAX_UPLOAD_MB,
    }


@app.post("/extract-face")
async def extract_face(file: UploadFile = File(...)) -> dict[str, Any]:
    image, _ = await _read_upload(file)
    encodings = _extract_encodings(image)

    if len(encodings) == 0:
        raise HTTPException(status_code=422, detail="No se detecto ningun rostro.")

    if len(encodings) > 1:
        raise HTTPException(
            status_code=422,
            detail="La imagen de referencia debe contener un solo rostro.",
        )

    return {
        "vector": encodings[0].tolist(),
        "faces_detected": len(encodings),
    }


@app.post("/compare-faces")
async def compare_faces(
    file: UploadFile = File(...),
    database: str = Form(...),
    tolerance: float = Form(DEFAULT_TOLERANCE),
) -> dict[str, Any]:
    known_people = _parse_database(database)

    if len(known_people) == 0:
        raise HTTPException(status_code=422, detail="No hay vectores validos en la base de datos enviada.")

    image, _ = await _read_upload(file)
    unknown_encodings = _extract_encodings(image)

    if len(unknown_encodings) == 0:
        raise HTTPException(status_code=422, detail="No se detecto ningun rostro en la foto a comparar.")

    found_ids: set[Any] = set()
    matches: list[dict[str, Any]] = []

    for unknown_index, unknown_encoding in enumerate(unknown_encodings):
        for person in known_people:
            is_match = face_recognition.compare_faces(
                [person["vector"]],
                unknown_encoding,
                tolerance=tolerance,
            )[0]

            if not is_match:
                continue

            distance = float(
                face_recognition.face_distance([person["vector"]], unknown_encoding)[0]
            )

            found_ids.add(person["id"])
            matches.append(
                {
                    "face_index": unknown_index,
                    "id": person["id"],
                    "distance": round(distance, 6),
                }
            )

    return {
        "found_ids": list(found_ids),
        "faces_detected": len(unknown_encodings),
        "matches": matches,
        "tolerance": tolerance,
    }
