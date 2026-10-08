#!/usr/bin/env python3
"""Build sp4 only into its isolated candidate, using verified existing speech.

No TTS is invoked. The shared builder's cache/list writes are confined to a
mirrored source below work/special-series/sp4; published and course audio are
never modified. Run --check to inspect the complete narration cache only.
"""
from __future__ import annotations

import argparse
import hashlib
import importlib.util
import json
import math
import re
import shutil
import subprocess
import sys
import time
from pathlib import Path

sys.dont_write_bytecode = True
COURSE = Path(__file__).resolve().parent
ROOT = COURSE.parents[2]
WORK = ROOT / "work/special-series/sp4"
WEB_PUBLIC = WORK / "public/weblec"
TIMELINE_ADAPTER = WORK / "lecture_state_adapter.js"
sys.path.insert(0, str(ROOT / "lecture_factory"))
import build_web


def digest(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def derive_source(source: bytes) -> tuple[bytes, list[dict]]:
    """Opt into the shared protocol only in mirrored rendering metadata."""
    derived_doc = json.loads(source)
    metadata_changes = []
    for page in derived_doc["pages"]:
        for index, element in enumerate(page["elements"]):
            if element["type"] != "html":
                continue
            if element.get("src", "").split("?", 1)[0] != "sim_standing.html":
                raise ValueError("Unrecognized sp4 iframe; a protocol adapter must be explicitly reviewed")
            if element.get("timelineSync") is not True:
                metadata_changes.append({"page": page["id"], "element": index,
                                         "src": element["src"], "field": "timelineSync",
                                         "before": element.get("timelineSync"), "after": True})
            element["timelineSync"] = True
    original_doc = json.loads(source)
    if [p["narration"] for p in original_doc["pages"]] != [p["narration"] for p in derived_doc["pages"]]:
        raise ValueError("Derived metadata unexpectedly changed narration")
    return (json.dumps(derived_doc, ensure_ascii=False, indent=1) + "\n").encode("utf-8"), metadata_changes


def verify_cache(cache_root: Path = COURSE) -> tuple[bytes, list[dict]]:
    cache_root = cache_root.expanduser().resolve()
    if cache_root != COURSE and WORK.resolve() not in cache_root.parents:
        raise ValueError("Audio cache root must be the sp4 course or its own work directory")
    source = (COURSE / "slides.json").read_bytes()
    doc = json.loads(source)
    if doc.get("theme") != "special" or not doc.get("pages"):
        raise ValueError("sp4 requires nonempty pages and theme=special")
    seen = set()
    evidence = []
    for page in doc["pages"]:
        number = page["id"]
        if not isinstance(number, int) or number in seen:
            raise ValueError(f"Invalid or duplicated page id: {number}")
        seen.add(number)
        mp3 = cache_root / "audio" / f"page{number}.mp3"
        sidecar = cache_root / f"page{number}.times.json"
        neural = cache_root / f"page{number}.neural.json"
        if not mp3.is_file() or not sidecar.is_file() or not neural.is_file():
            raise ValueError(f"Page {number}: complete real audio cache missing; generate speech first")
        expected, _ = build_web.split_sentences(page["narration"])
        times = json.loads(sidecar.read_text(encoding="utf-8"))
        if not expected or not isinstance(times, list) or len(times) != len(expected):
            raise ValueError(f"Page {number}: sentence count does not match narration")
        try:
            duration = build_web.gen_audio.probe(str(mp3))
        except (AttributeError, ValueError) as exc:
            raise ValueError(f"Page {number}: unreadable MP3 duration") from exc
        previous_end = 0.0
        for i, (sentence, segment) in enumerate(zip(expected, times)):
            if segment.get("text") != sentence:
                raise ValueError(f"Page {number}, sentence {i}: stale or mismatched sidecar text")
            if re.search(r"\[\[|\\[A-Za-z]+", sentence):
                raise ValueError(f"Page {number}, sentence {i}: speech text contains a marker or LaTeX command")
            start, end = segment.get("start"), segment.get("end")
            if not all(isinstance(x, (int, float)) and math.isfinite(x) for x in (start, end)):
                raise ValueError(f"Page {number}, sentence {i}: invalid measured times")
            if start < previous_end - 0.002 or end <= start or end > duration + 0.05:
                raise ValueError(f"Page {number}, sentence {i}: time interval outside real audio")
            previous_end = end
        # Decode the actual page audio and reject corrupt or all-silent placeholders.
        probe = subprocess.run(
            [build_web.FF, "-hide_banner", "-i", str(mp3), "-map", "0:a:0", "-vn",
             "-af", "volumedetect", "-f", "null", "-"],
            capture_output=True, text=True, encoding="utf-8", errors="replace", check=True,
        )
        peak = re.search(r"max_volume:\s*(-?[\d.]+) dB", probe.stderr)
        mean = re.search(r"mean_volume:\s*(-?[\d.]+) dB", probe.stderr)
        if not peak or not mean or float(peak[1]) < -40 or float(mean[1]) < -55:
            raise ValueError(f"Page {number}: speech-presence check failed")
        metadata = json.loads(neural.read_text(encoding="utf-8"))
        if metadata.get("sentences") != expected:
            raise ValueError(f"Page {number}: neural cache metadata is stale")
        payload = {key: value for key, value in metadata.items() if key != "sha256"}
        signature = hashlib.sha256(json.dumps(payload, ensure_ascii=False, sort_keys=True,
                                             separators=(",", ":")).encode("utf-8")).hexdigest()
        if metadata.get("sha256") != signature:
            raise ValueError(f"Page {number}: neural input signature is invalid")
        evidence.append({
            "page": number, "duration_seconds": duration, "sentences": len(times),
            "mp3": str(mp3), "mp3_sha256": digest(mp3),
            "sidecar": str(sidecar), "sidecar_sha256": digest(sidecar),
            "neural": str(neural), "neural_sha256": digest(neural),
            "neural_input_signature": signature,
            "engine": metadata.get("engine"), "voice": metadata.get("voice"),
            "peak_db": float(peak[1]), "mean_db": float(mean[1]),
        })
    return source, evidence


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--check", action="store_true", help="Verify cache without writing or building")
    parser.add_argument("--audio-source", type=Path, default=COURSE,
                        help="Cache root with audio/ and pageN sidecars; supports own work neural-stage before promotion")
    args = parser.parse_args()
    source, evidence = verify_cache(args.audio_source)
    if args.check:
        print(json.dumps({"pages": len(evidence), "audio_seconds": sum(x["duration_seconds"] for x in evidence),
                          "check": "exact sentence text, measured intervals, decoded nonsilent MP3"}, ensure_ascii=False))
        return
    if not TIMELINE_ADAPTER.is_file():
        raise ValueError(f"Shared-protocol adapter is not ready: {TIMELINE_ADAPTER}")
    # Derived rendering metadata changes no original author page, sentence, or
    # approved speech payload. build_web passes elements through unchanged.
    derived_source, metadata_changes = derive_source(source)
    stamp = str(time.time_ns())
    stage = WORK / "build-source" / stamp / "sp4"
    stage.mkdir(parents=True)
    (stage / "audio").mkdir()
    (stage / "slides.json").write_bytes(derived_source)
    for item in evidence:
        number = item["page"]
        audio = stage / "audio" / f"page{number}.mp3"
        sidecar = stage / f"page{number}.times.json"
        neural = stage / f"page{number}.neural.json"
        shutil.copy2(item["mp3"], audio)
        shutil.copy2(item["sidecar"], sidecar)
        shutil.copy2(item["neural"], neural)
        if (digest(audio) != item["mp3_sha256"] or digest(sidecar) != item["sidecar_sha256"]
                or digest(neural) != item["neural_sha256"]):
            raise ValueError(f"Page {number}: input changed during snapshot; no build performed")
    target = WEB_PUBLIC / "sp4"
    target.mkdir(parents=True, exist_ok=True)
    previous = [target / name for name in ("weblec.json", "audio.mp3") if (target / name).exists()]
    if previous:
        backup = WORK / "candidate-history" / stamp
        backup.mkdir(parents=True)
        for path in previous:
            shutil.copy2(path, backup / path.name)
    # Asset copying does not delete unmatched old assets. Stale candidates are retained.
    shutil.copytree(COURSE / "assets", target, dirs_exist_ok=True)
    # Candidate-local bridge loads only after the unchanged original simulation
    # exposes standingLab. The original course asset is never edited.
    copied_sim = target / "sim_standing.html"
    sim_source = copied_sim.read_text(encoding="utf-8")
    if sim_source.count("</body>") != 1:
        raise ValueError("Simulation body anchor changed; candidate adapter was not injected")
    adapter_tag = '<script src="./lecture_state_adapter.js" data-sp4-timeline-adapter="1"></script>'
    copied_sim.write_text(sim_source.replace("</body>", adapter_tag + "\n</body>", 1), encoding="utf-8")
    shutil.copy2(TIMELINE_ADAPTER, target / TIMELINE_ADAPTER.name)
    adapter_hash = digest(TIMELINE_ADAPTER)
    if digest(target / TIMELINE_ADAPTER.name) != adapter_hash:
        raise ValueError("Shared-protocol adapter changed while copying")
    original_web_public = build_web.WEB_PUBLIC
    build_web.WEB_PUBLIC = str(WEB_PUBLIC)
    # Disable TTS even if shared-builder behavior changes after preflight. It must
    # never reach the cache replacement branch (which permanently removes files).
    def no_tts(*_args, **_kwargs):
        raise RuntimeError("Candidate construction requires complete verified speech; TTS is disabled")
    original_audio_tool = build_web.gen_audio.audio_tool_command
    original_tts = build_web.gen_audio.tts
    original_argv = sys.argv
    original_remove = build_web.os.remove
    def no_removal(*_args, **_kwargs):
        raise RuntimeError("Permanent cache deletion is disabled in candidate construction")
    try:
        build_web.gen_audio.audio_tool_command = no_tts
        build_web.gen_audio.tts = no_tts
        build_web.os.remove = no_removal
        sys.argv = ["build_web.py", str(stage)]
        build_web.main()
    finally:
        build_web.WEB_PUBLIC = original_web_public
        build_web.gen_audio.audio_tool_command = original_audio_tool
        build_web.gen_audio.tts = original_tts
        build_web.os.remove = original_remove
        sys.argv = original_argv
    # Rebase all global offsets to actual decoded PCM sample counts, then encode
    # the full lesson once. Page audio is real authorized speech; no TTS occurs.
    pcm_path = WORK / "finalize_audio_timeline.py"
    pcm_spec = importlib.util.spec_from_file_location("sp4_candidate_pcm_timeline", pcm_path)
    if pcm_spec is None or pcm_spec.loader is None:
        raise ValueError("Course-local real PCM timeline finalizer is unavailable")
    pcm_module = importlib.util.module_from_spec(pcm_spec)
    pcm_spec.loader.exec_module(pcm_module)
    pcm_evidence = pcm_module.finalize(cache_root=stage)
    # Real sentence-end timing repair is course-local and preserves the authored
    # at step for the static teacher presentation. No audio or source is altered.
    repair_path = WORK / "repair_quiz_timing.py"
    spec = importlib.util.spec_from_file_location("sp4_candidate_quiz_timing", repair_path)
    if spec is None or spec.loader is None:
        raise ValueError("Course-local real quiz timing repair is unavailable")
    repair_module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(repair_module)
    quiz_timing = repair_module.repair(cache_root=stage)
    if quiz_timing["candidate_audio_sha256"] != digest(target / "audio.mp3"):
        raise ValueError("Quiz repair changed the real audio")
    record = {"course": "sp4", "source_slides_sha256": hashlib.sha256(source).hexdigest(),
              "derived_slides_sha256": hashlib.sha256(derived_source).hexdigest(),
              "derived_metadata_changes": metadata_changes, "original_narration_unchanged": True,
              "mirrored_source": str(stage), "candidate": str(target), "audio": evidence,
              "candidate_weblec_sha256": digest(target / "weblec.json"),
              "candidate_audio_sha256": digest(target / "audio.mp3"),
              "protocol_adapter": {"source": str(TIMELINE_ADAPTER), "sha256": adapter_hash,
                                   "candidate": str(target / TIMELINE_ADAPTER.name),
                                   "original_sim_sha256": digest(COURSE / "assets/sim_standing.html"),
                                   "copied_sim_sha256": digest(copied_sim)},
              "audio_timeline_finalization": {"evidence": str(WORK / "audio-merge-evidence.json"),
                                              "sha256": digest(WORK / "audio-merge-evidence.json"),
                                              "actual_duration_seconds": pcm_evidence["actual_duration_seconds"],
                                              "full_mp3_sha256": pcm_evidence["full_mp3_sha256"]},
              "quiz_timing_repair": {"evidence": str(WORK / "quiz-timing-evidence.json"),
                                     "sha256": digest(WORK / "quiz-timing-evidence.json"),
                                     "quizzes": len(quiz_timing["quizzes"]),
                                     "spoken_markers": len(quiz_timing["all_spoken_marker_times"]),
                                     "audio_resynthesized": False},
              "checks": ["actual PCM sample-count global timeline", "all spoken markers retained", "real question-end quiz timing", "complete cache", "sentence equality", "monotonic real intervals", "decoded speech presence"],
              "limitations": ["Speech-presence analysis does not constitute human listening approval."]}
    (WORK / "build-evidence.json").write_text(json.dumps(record, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"Candidate only: {target / 'weblec.json'}")


if __name__ == "__main__":
    try:
        main()
    except (ValueError, RuntimeError, OSError, subprocess.CalledProcessError) as exc:
        raise SystemExit(f"Candidate build stopped: {exc}")
