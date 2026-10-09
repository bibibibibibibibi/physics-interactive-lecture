#!/usr/bin/env python3
"""Build/check a deployment ZIP locally; never upload or alter published dist.

Default: package the existing dist after source/runtime checks.
--build: type-check and build a new isolated dist under work/releases/.
--no-git-check: explicitly mark the ZIP as a local development candidate.
--include-export: add only an explicitly selected standalone HTML export.
--authoring-inputs: additionally archive local, ignored page audio/source inputs.
"""

import argparse
from datetime import datetime
import hashlib
import json
from pathlib import Path
import runpy
import shutil
import subprocess
import sys
import zipfile


REPO = Path(__file__).resolve().parents[2]
APP = REPO / "interactive-lecture"
STORED = {".mp3", ".mp4", ".glb", ".png", ".jpg", ".jpeg", ".gif", ".pptx"}


def distribution_files(inputs, dist, exports):
    """Include the checked runtime graph, never all files in an old build."""
    selected = {}
    for path in inputs:
        if path.is_relative_to(dist):
            selected[path] = "dist/" + path.relative_to(dist).as_posix()
        elif path.is_relative_to(exports):
            selected[path] = "slides-export/" + path.relative_to(exports).as_posix()
    return selected


def write_archive(destination, files, metadata):
    if destination.exists():
        raise ValueError("Archive already exists; choose a new output instead of overwriting it")
    manifest = []
    with zipfile.ZipFile(destination, "x", allowZip64=True, compresslevel=3) as archive:
        for source, name in sorted(files.items(), key=lambda row: row[1]):
            data = source.read_bytes()
            info = zipfile.ZipInfo.from_file(source, arcname=name)
            info.compress_type = zipfile.ZIP_STORED if source.suffix.lower() in STORED else zipfile.ZIP_DEFLATED
            archive.writestr(info, data)
            manifest.append({"path": name, "bytes": len(data), "sha256": hashlib.sha256(data).hexdigest()})
        archive.writestr("release-manifest.json", json.dumps({**metadata, "files": manifest}, ensure_ascii=False, indent=2))
    return manifest


def build_deployment(output):
    node = shutil.which("node")
    if not node or not (APP / "node_modules/vite/bin/vite.js").is_file():
        raise ValueError("Install Node.js and run npm ci in interactive-lecture first")
    for config in ("tsconfig.app.json", "tsconfig.node.json"):
        subprocess.run([node, str(APP / "node_modules/typescript/bin/tsc"), "--noEmit", "-p", config], cwd=APP, check=True)
    subprocess.run([node, str(APP / "node_modules/vite/bin/vite.js"), "build", "--outDir", str(output), "--emptyOutDir", "false"], cwd=APP, check=True)
    subprocess.run([node, str(APP / "scripts/copy-launchers.mjs"), str(output)], cwd=APP, check=True)


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--build", action="store_true")
    parser.add_argument("--no-git-check", action="store_true")
    parser.add_argument("--authoring-inputs", action="store_true")
    parser.add_argument("--include-export", type=Path, action="append", default=[],
                        help="HTML inside interactive-lecture/slides-export; repeat to select more")
    parser.add_argument("--output-dir", type=Path, default=REPO / "work/releases")
    args = parser.parse_args(argv)
    exports = []
    for item in args.include_export:
        path = item.resolve()
        if not path.is_relative_to(APP / "slides-export") or path.suffix.lower() != ".html" or not path.is_file():
            parser.error("--include-export must name an existing HTML inside interactive-lecture/slides-export/")
        exports.append(path)
    destination = args.output_dir.resolve()
    if not destination.is_relative_to(REPO / "work"):
        parser.error("--output-dir must be inside work/; release archives are not Git source files")
    destination.mkdir(parents=True, exist_ok=True)
    stamp = datetime.now().strftime("%Y-%m-%d-%H%M%S")
    dist = APP / "dist"
    if args.build:
        stage = destination / ("build-" + stamp)
        stage.mkdir(exist_ok=False)
        dist = stage / "dist"
        build_deployment(dist)
    checker = runpy.run_path(str(APP / "scripts/check-release.py"), run_name="release_packaging")
    check = checker["ReleaseCheck"](dist, exports=exports)
    check.run()
    if not args.no_git_check:
        check.git_check(True)
    check.seal_inputs()
    if check.errors:
        raise ValueError("Release check failed:\n" + "\n".join(sorted(set(check.errors))[:15]))
    files = distribution_files(check.inputs, dist, APP / "slides-export")
    kind = "development" if args.no_git_check else "release"
    metadata = {
        "kind": kind,
        "commit": subprocess.check_output(["git", "rev-parse", "HEAD"], cwd=REPO, text=True).strip(),
        "source_checked": not args.no_git_check,
        "scope": "file completeness and static dependencies; no full listening/teaching/browser approval or upload",
        "checker_sha256": hashlib.sha256((APP / "scripts/check-release.py").read_bytes()).hexdigest(),
    }
    output = destination / ("physics-interactive-lecture-" + stamp + "-" + kind + ".zip")
    records = write_archive(output, files, metadata)
    check.seal_inputs()
    if check.errors:
        raise ValueError("Inputs changed while packaging; retained ZIP is an unapproved candidate: " + str(output))
    print("Deployment archive:", output)
    print("Checked runtime files:", len(records), "; archive MiB:", round(output.stat().st_size / 1048576, 2))
    if args.authoring_inputs:
        materials = {}
        for course in (REPO / "lecture_factory/courses_web").iterdir():
            if not course.is_dir():
                continue
            for path in list((course / "audio").glob("*.mp3")) + list((course / "source").rglob("*")):
                if path.is_file():
                    materials[path] = path.relative_to(REPO).as_posix()
        material_zip = destination / ("physics-authoring-inputs-" + stamp + ".zip")
        write_archive(material_zip, materials, {"kind": "local-authoring-inputs", "commit": metadata["commit"]})
        print("Local authoring input archive:", material_zip)
    return 0


if __name__ == "__main__":
    try:
        sys.exit(main())
    except (ValueError, OSError, subprocess.CalledProcessError) as error:
        print(error, file=sys.stderr)
        sys.exit(1)
