# -*- coding: utf-8 -*-
"""在隔离暂存区用 IndexTTS 整课重配；不覆盖源课程缓存或正式发布目录。"""
import argparse
import json
import os
from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parents[1]
FACTORY = ROOT / "lecture_factory"
sys.path.insert(0, str(FACTORY))
import build_web

COURSES = [
    *(f"kin6-{index}" for index in range(1, 8)),
    *(f"kin7-{index}" for index in range(1, 10)),
    *(f"kin8-{index}" for index in range(1, 6)),
    *(f"kin10-{index}" for index in range(1, 7)),
]


def prepare(stage, courses):
    for course in courses:
        source = FACTORY / "courses_web" / course / "slides.json"
        target_dir = stage / "courses_web" / course
        target_dir.mkdir(parents=True, exist_ok=True)
        doc = json.loads(source.read_text(encoding="utf-8"))
        doc["engine"] = "index-tts"
        doc["voice"] = "voice_03.wav"
        (target_dir / "slides.json").write_text(
            json.dumps(doc, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
        )


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--stage", type=Path, default=ROOT / "work" / "local-tts" / "index-stage")
    parser.add_argument("--courses", nargs="+", choices=COURSES, default=COURSES)
    parser.add_argument("--prepare-only", action="store_true")
    args = parser.parse_args()
    stage = args.stage.resolve()
    if ROOT not in stage.parents:
        parser.error("暂存目录必须位于当前工作区内")
    prepare(stage, args.courses)
    print(f"暂存区：{stage}", flush=True)
    if args.prepare_only:
        return
    os.environ.setdefault("HF_HUB_OFFLINE", "1")
    os.environ.setdefault("TRANSFORMERS_OFFLINE", "1")
    build_web.WEB_PUBLIC = str(stage / "public" / "weblec")
    for index, course in enumerate(args.courses, 1):
        print(f"\n===== [{index}/{len(args.courses)}] {course} =====", flush=True)
        sys.argv = ["build_web.py", str(stage / "courses_web" / course)]
        build_web.main()
        print(f"===== {course} 完成 =====", flush=True)


if __name__ == "__main__":
    main()
