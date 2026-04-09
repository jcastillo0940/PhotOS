from __future__ import annotations

import argparse
import json
from pathlib import Path

import requests


def main() -> int:
    parser = argparse.ArgumentParser(description="Smoke test for PhotOS Face AI Service")
    parser.add_argument("--base-url", default="http://127.0.0.1:5000", help="FastAPI base URL")
    parser.add_argument("--reference", type=Path, help="Path to a single-face reference image")
    parser.add_argument("--group", type=Path, help="Path to a photo to compare against the database")
    parser.add_argument("--tolerance", type=float, default=0.6, help="Comparison tolerance")
    args = parser.parse_args()

    base_url = args.base_url.rstrip("/")

    print("== Health check ==")
    health = requests.get(f"{base_url}/health", timeout=30)
    print(health.status_code, health.text)

    if not health.ok:
        return 1

    if not args.reference:
        print("\nNo reference image provided. Health check only.")
        return 0

    print("\n== Extract face ==")
    with args.reference.open("rb") as fh:
        extract = requests.post(
            f"{base_url}/extract-face",
            files={"file": (args.reference.name, fh, "image/jpeg")},
            timeout=120,
        )

    print(extract.status_code, extract.text)

    if not extract.ok:
        return 1

    vector = extract.json().get("vector")

    if not isinstance(vector, list) or not vector:
        print("No valid embedding returned.")
        return 1

    if not args.group:
        print("\nNo group image provided. Extract test completed.")
        return 0

    print("\n== Compare faces ==")
    database = json.dumps([{"id": 1, "vector": vector}])
    with args.group.open("rb") as fh:
        compare = requests.post(
            f"{base_url}/compare-faces",
            files={"file": (args.group.name, fh, "image/jpeg")},
            data={"database": database, "tolerance": str(args.tolerance)},
            timeout=120,
        )

    print(compare.status_code, compare.text)
    return 0 if compare.ok else 1


if __name__ == "__main__":
    raise SystemExit(main())
