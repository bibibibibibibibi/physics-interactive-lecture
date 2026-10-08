#!/usr/bin/env python3
"""Export sp4's verified candidate as HTTP-enabled static slides, never globally."""
from __future__ import annotations

import argparse
import hashlib
import json
import shutil
import subprocess
import sys
import time
from pathlib import Path

sys.dont_write_bytecode = True
COURSE = Path(__file__).resolve().parent
ROOT = COURSE.parents[2]
WORK = ROOT / "work/special-series/sp4"
STAGE = WORK / "slides-stage"
WEBLEC = WORK / "public/weblec"
OUT_DIR = WORK / "slides-export"


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--no-vite-build", action="store_true", help="Use an already-built isolated slides-stage")
    args = parser.parse_args()
    candidate = WEBLEC / "sp4/weblec.json"
    if not candidate.is_file():
        raise ValueError(f"Candidate missing: {candidate}; shared data is never used as fallback")
    proof_path = WORK / "build-evidence.json"
    audio = WEBLEC / "sp4/audio.mp3"
    if not proof_path.is_file() or not audio.is_file():
        raise ValueError("Real-audio build evidence or audio missing; layout drafts cannot be exported as formal products")
    proof = json.loads(proof_path.read_text(encoding="utf-8"))
    sha = lambda path: hashlib.sha256(path.read_bytes()).hexdigest()
    if (proof.get("course") != "sp4" or proof.get("candidate") != str(candidate.parent)
            or proof.get("source_slides_sha256") != sha(COURSE / "slides.json")
            or proof.get("candidate_weblec_sha256") != sha(candidate)
            or proof.get("candidate_audio_sha256") != sha(audio)):
        raise ValueError("Candidate provenance is stale or mismatched; rebuild from complete real speech")
    if candidate.parent.resolve() != candidate.parent:
        raise ValueError("Candidate course directory cannot redirect to shared public")
    if not args.no_vite_build:
        subprocess.run(["node", str(WORK / "candidate_vite.mjs"), "slides"], cwd=ROOT, check=True)
    renderer_path = WORK / "renderer-build-slides.json"
    if not renderer_path.is_file():
        raise ValueError("Actual isolated slides renderer build evidence is missing")
    renderer = json.loads(renderer_path.read_text(encoding="utf-8"))
    if (renderer.get("course") != "sp4" or renderer.get("mode") != "slides"
            or not renderer.get("actual_vite_module_input_capture")
            or renderer.get("source_slides_sha256") != proof["source_slides_sha256"]
            or renderer.get("weblec_sha256") != sha(candidate)
            or renderer.get("audio_sha256") != sha(audio)
            or renderer.get("candidate_transform_sha256") != sha(WORK / "clock_transform.mjs")):
        raise ValueError("Isolated slides renderer evidence is stale; build it from current real candidate first")
    sys.path.insert(0, str(ROOT / "lecture_factory"))
    import export_slides
    export_slides.DIST = STAGE
    export_slides.WEBLEC = WEBLEC
    export_slides.OUT_DIR = OUT_DIR
    name = "大学物理-驻波-幻灯片-HTTP.html"
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    out = OUT_DIR / name
    if out.exists():
        backup = WORK / "export-history" / str(time.time_ns())
        backup.mkdir(parents=True)
        shutil.copy2(out, backup / name)
    # Never pass shared export_slides --build: that runs the global npm build.
    original_argv = sys.argv
    try:
        sys.argv = ["export_slides.py", "--course", "sp4", "--out", name]
        result = export_slides.main()
    finally:
        sys.argv = original_argv
    if result:
        return result
    html = out.read_text(encoding="utf-8")
    boot = '''<script>if(location.protocol!=="file:"){const u=new URL(location.href);u.searchParams.set("course","sp4");history.replaceState(null,"",u)}else{addEventListener("DOMContentLoaded",()=>{const n=document.createElement("div");n.textContent="驻波模拟须通过本地 HTTP 服务放映：slides.html?course=sp4";n.style.cssText="position:fixed;top:0;left:0;right:0;z-index:100;background:#fff0c7;color:#16283f;padding:10px;text-align:center;font:16px sans-serif";document.body.append(n)})}</script>'''
    html = html.replace("<head>", "<head>" + boot, 1)
    out.write_text(html, encoding="utf-8")
    shutil.copy2(out, STAGE / "sp4-slides.html")
    app_stage = WORK / "app-stage"
    if app_stage.is_dir():
        shutil.copy2(out, app_stage / "sp4-slides.html")
    (WORK / "export-evidence.json").write_text(json.dumps({
        "course": "sp4", "export": str(out), "export_sha256": sha(out),
        "source_slides_sha256": proof["source_slides_sha256"],
        "candidate_weblec_sha256": sha(candidate), "candidate_audio_sha256": sha(audio),
        "renderer_build_evidence": str(WORK / "renderer-build-slides.json"),
        "renderer_build_evidence_sha256": sha(WORK / "renderer-build-slides.json"),
        "http_entry": "sp4-slides.html?course=sp4",
        "dist": str(STAGE), "weblec": str(WEBLEC), "out_dir": str(OUT_DIR),
        "limitations": ["Images, formula fonts, scripts and styles are inlined; iframe/vendor/video dependencies remain HTTP assets under /weblec/sp4/.",
                        "This is not a complete file:// offline single-file simulation package."],
    }, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"HTTP candidate export: {out}; candidate /weblec/sp4/ must be served with it.")
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except (ValueError, OSError, subprocess.CalledProcessError) as exc:
        raise SystemExit(f"Candidate export stopped: {exc}")
