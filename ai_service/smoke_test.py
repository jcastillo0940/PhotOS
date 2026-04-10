from __future__ import annotations

import argparse
import importlib
import os
import sys
from pathlib import Path

import redis


def main() -> int:
    parser = argparse.ArgumentParser(description="Smoke test for PhotOS Face AI Worker")
    parser.add_argument("--redis-url", default=os.getenv("FACE_AI_REDIS_URL", "redis://127.0.0.1:6379/0"), help="Redis URL")
    parser.add_argument("--task-queue", default=os.getenv("FACE_AI_TASK_QUEUE", "face-ai:tasks"), help="Task queue name")
    parser.add_argument("--result-queue", default=os.getenv("FACE_AI_RESULT_QUEUE", "face-ai:results"), help="Result queue name")
    parser.add_argument("--worker-file", default=str(Path(__file__).with_name("main.py")), help="Path to worker entrypoint")
    args = parser.parse_args()

    print("== Python ==")
    print(sys.executable)
    print(sys.version)

    print("\n== Required modules ==")
    for module_name in ("face_recognition", "numpy", "redis", "requests"):
        module = importlib.import_module(module_name)
        module_path = getattr(module, "__file__", "built-in")
        print(f"{module_name}: ok ({module_path})")

    worker_file = Path(args.worker_file)
    print("\n== Worker file ==")
    print(worker_file)
    if not worker_file.exists():
        print("worker entrypoint not found")
        return 1

    print("\n== Redis ==")
    client = redis.Redis.from_url(args.redis_url, decode_responses=True)
    print("PING", client.ping())
    print("task queue:", args.task_queue)
    print("result queue:", args.result_queue)
    print("task queue length:", client.llen(args.task_queue))
    print("result queue length:", client.llen(args.result_queue))

    print("\nSmoke test passed.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
