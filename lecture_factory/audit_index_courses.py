# -*- coding: utf-8 -*-
"""核对 IndexTTS 暂存课程的内容、逐句时钟、整轨时长和基础信号。"""
import argparse
import hashlib
import json
from pathlib import Path
import re
import subprocess
import sys

ROOT = Path(__file__).resolve().parents[1]
FACTORY = ROOT / "lecture_factory"
sys.path.insert(0, str(FACTORY))
import gen_audio
from build_index_courses import COURSES
from build_web import STEP_MARK, split_sentences
from validate_weblec import validate


def audit_course(stage, course):
    errors = []
    source_dir = stage / "courses_web" / course
    public_dir = stage / "public" / "weblec" / course
    source_path = source_dir / "slides.json"
    public_path = public_dir / "weblec.json"
    audio_path = public_dir / "audio.mp3"
    for path in (source_path, public_path, audio_path):
        if not path.is_file():
            return {"course": course, "errors": [f"缺少文件：{path}"]}
    source = json.loads(source_path.read_text(encoding="utf-8"))
    public = json.loads(public_path.read_text(encoding="utf-8"))
    if source.get("engine") != "index-tts":
        errors.append("暂存源稿未固定使用 index-tts")
    errors.extend(validate(str(public_path)).errors)
    if len(source["pages"]) != len(public["slides"]):
        errors.append("源稿与正式页数不一致")
    subtitles = {}
    for item in public["subtitles"]:
        subtitles.setdefault(item["slide"], []).append(item)
        if STEP_MARK.search(item["text"]):
            errors.append(f"字幕含技术锚点：第 {item['slide']} 页")
    expected_subtitles = 0
    page_results = []
    for page in source["pages"]:
        number = page["id"]
        built = next((item for item in public["slides"] if item["id"] == number), None)
        if built is None:
            errors.append(f"第 {number} 页缺少构建结果")
            continue
        sentences, _ = split_sentences(page["narration"])
        expected_subtitles += len(sentences)
        narration = STEP_MARK.sub("", page["narration"])
        if built["narration"] != narration:
            errors.append(f"第 {number} 页讲稿不一致")
        if built["elements"] != page["elements"]:
            errors.append(f"第 {number} 页画面元素不一致")
        times_path = source_dir / f"page{number}.times.json"
        page_audio = source_dir / "audio" / f"page{number}.mp3"
        if not times_path.is_file() or not page_audio.is_file():
            errors.append(f"第 {number} 页缺音频或时间轴")
            continue
        times = json.loads(times_path.read_text(encoding="utf-8"))
        if [item["text"] for item in times] != sentences:
            errors.append(f"第 {number} 页逐句缓存文字不一致")
        if [item["text"] for item in subtitles.get(number, [])] != sentences:
            errors.append(f"第 {number} 页字幕与讲稿句不一致")
        duration = gen_audio.probe(str(page_audio))
        if abs(duration - built["duration"]) > 0.15:
            errors.append(f"第 {number} 页音频时长不一致：{duration} vs {built['duration']}")
        if times and abs(times[0]["start"]) > 0.001:
            errors.append(f"第 {number} 页首句不从零点开始")
        page_results.append({"page": number, "sentences": len(sentences), "duration": round(duration, 3)})
    if len(public["subtitles"]) != expected_subtitles:
        errors.append("整课字幕句数不一致")
    total = gen_audio.probe(str(audio_path))
    if abs(total - public["duration"]) > 0.15:
        errors.append(f"整轨时长不一致：{total} vs {public['duration']}")
    import audioop
    sample_rate = 22050
    pcm = subprocess.run(
        [gen_audio.FF, "-v", "error", "-i", str(audio_path), "-ac", "1", "-ar", str(sample_rate),
         "-f", "s16le", "pipe:1"],
        capture_output=True, check=True,
    ).stdout
    subtitle_rms = []
    for subtitle in public["subtitles"]:
        start = max(0, int(subtitle["start"] * sample_rate))
        end = min(len(pcm) // 2, int(subtitle["end"] * sample_rate))
        rms = audioop.rms(pcm[start * 2:end * 2], 2) if end > start else 0
        subtitle_rms.append(rms)
        if rms < 40:
            errors.append(f"第 {subtitle['slide']} 页字幕区间语音信号异常弱：{subtitle['start']:.3f}s")
    signal = subprocess.run(
        [gen_audio.FF, "-hide_banner", "-nostats", "-i", str(audio_path), "-af", "volumedetect", "-f", "null", "-"],
        capture_output=True, text=True, encoding="utf-8", errors="replace", check=True,
    ).stderr
    mean = re.search(r"mean_volume: (-?[\d.]+) dB", signal)
    maximum = re.search(r"max_volume: (-?[\d.]+) dB", signal)
    if not maximum or float(maximum.group(1)) < -20:
        errors.append("整轨信号为空或音量异常低")
    return {
        "course": course,
        "pages": len(page_results),
        "sentences": expected_subtitles,
        "duration": round(total, 3),
        "mean_volume_db": float(mean.group(1)) if mean else None,
        "max_volume_db": float(maximum.group(1)) if maximum else None,
        "min_subtitle_rms": min(subtitle_rms, default=0),
        "audio_sha256": hashlib.sha256(audio_path.read_bytes()).hexdigest(),
        "page_details": page_results,
        "errors": errors,
    }


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--stage", type=Path, default=ROOT / "work" / "local-tts" / "index-stage")
    parser.add_argument("--courses", nargs="+", choices=COURSES, default=COURSES)
    args = parser.parse_args()
    stage = args.stage.resolve()
    results = [audit_course(stage, course) for course in args.courses]
    report = {"result": "passed" if all(not item["errors"] for item in results) else "failed", "courses": results}
    output = stage / f"audit-{'-'.join(args.courses) if len(args.courses) == 1 else 'all'}.json"
    output.write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    for item in results:
        print(item["course"], "页", item.get("pages", 0), "句", item.get("sentences", 0),
              "秒", item.get("duration"), "错误", len(item["errors"]))
        for error in item["errors"]:
            print("  ", error)
    print("报告：", output)
    return 0 if report["result"] == "passed" else 1


if __name__ == "__main__":
    sys.exit(main())
