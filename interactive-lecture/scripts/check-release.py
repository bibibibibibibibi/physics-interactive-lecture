#!/usr/bin/env python3
"""Check local release dependencies and Git coverage; never build or publish.

Run from any directory on Windows/macOS: python check-release.py [options].
This is a file/version check, not browser, teaching, listening or Windows QA.
"""

import argparse
import base64
from datetime import datetime, timezone
import hashlib
from html.parser import HTMLParser
import json
from pathlib import Path
import re
import subprocess
import sys
from urllib.parse import parse_qs, unquote, urlsplit


REPO = Path(__file__).resolve().parents[2]
APP = REPO / "interactive-lecture"
MENUS = {
    "courses.json": {"shm", "rotvec", "pendulum", "energy", "compose", "damping", "emosc", "nonlinear"},
    "courses_foundation.json": {"pre_vector"},
    "courses_special.json": {"sp%d" % n for n in range(1, 9)},
}
POSES = "wave point_up explain laser think emphasis nod shrug write laser_up laser_down laser_high laser_low laser_far laser_circle laser_lean".split()
ID = re.compile(r"^[a-z][a-z0-9_-]*$")
IMPORT = re.compile(r"(?:\b(?:import|export)\s*(?:[^;\n]*?\bfrom\s*)?|\bimport\s*\()\s*['\"]([^'\"]+)['\"]")
CSS_URL = re.compile(r"url\(\s*['\"]?([^)'\"\s]+)|@import\s+['\"]([^'\"]+)", re.I)
DOCUMENT_URL = re.compile(r"(?:\bfetch\s*\(|\.(?:src|href)\s*=\s*)['\"]([^'\"]+)['\"]")
MODULE_URL = re.compile(r"\bnew\s+URL\s*\(\s*['\"]([^'\"]+)['\"]\s*,\s*import\.meta\.url\s*\)")
MEDIA_SET = re.compile(r"\bnew\s+Set\s*\(\s*\[([^\]]*)\]", re.S)
VITE_DEPS = re.compile(r"\bm\.f\s*\|\|\s*\(\s*m\.f\s*=\s*\[([^\]]*)\]", re.S)
QUOTED = re.compile(r"['\"]([^'\"]+)['\"]")
RUNTIME_EXT = {".html", ".js", ".mjs", ".css", ".svg", ".png", ".jpg", ".jpeg", ".webp", ".gif", ".mp4", ".webm", ".mp3", ".wav", ".json", ".woff", ".woff2", ".ttf", ".otf"}


class PageReferences(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.references, self.scripts, self.styles = [], [], []
        self.kind, self.attrs, self.body = None, {}, []

    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        if tag in {"script", "style"}:
            self.kind, self.attrs, self.body = tag, a, []
        for key in ({"script": ["src"], "link": ["href"], "img": ["src"], "image": ["href", "xlink:href"], "use": ["href", "xlink:href"], "iframe": ["src"], "video": ["src", "poster"], "audio": ["src"], "source": ["src"], "a": ["href"]}.get(tag, [])):
            if a.get(key):
                self.references.append(a[key])
        if a.get("style"):
            self.styles.append(a["style"])

    def handle_data(self, data):
        if self.kind:
            self.body.append(data)

    def handle_endtag(self, tag):
        if tag == self.kind:
            target = self.scripts if tag == "script" else self.styles
            target.append((self.attrs, "".join(self.body)) if tag == "script" else "".join(self.body))
            self.kind, self.body = None, []


class ReleaseCheck:
    def __init__(self):
        self.errors, self.inputs, self.edges, self.external = [], {}, set(), set()
        self.service_routes = set()
        self.visited, self.course_titles = set(), {}
        self.counts = {"courses": 0, "menus": 0, "html": 0, "embedded_courses": 0}

    def label(self, path):
        return path.relative_to(REPO).as_posix()

    def fail(self, message):
        self.errors.append(message)

    def require(self, path, context):
        path = path.resolve()
        if not path.is_relative_to(REPO):
            self.fail("Dependency escapes repository: %s (%s)" % (path, context))
            return False
        if not path.is_file():
            self.fail("Missing file: %s (%s)" % (self.label(path), context))
            return False
        if path not in self.inputs:
            data = path.read_bytes()
            self.inputs[path] = {"path": self.label(path), "bytes": len(data), "sha256": hashlib.sha256(data).hexdigest()}
        return True

    def reference(self, value, owner, webroot, context, recurse=True, imports=None, document=None):
        if not isinstance(value, str) or not value.strip():
            self.fail("Empty runtime reference: %s (%s)" % (self.label(owner), context))
            return
        value = value.strip()
        try:
            parts = urlsplit(value)
        except ValueError:
            self.fail("Invalid runtime URL: %s (%s)" % (self.label(owner), context))
            return
        if parts.scheme or parts.netloc:
            if not value.startswith(("data:", "blob:", "javascript:", "mailto:", "tel:")):
                self.external.add(value)
            return
        if not parts.path or value.startswith("#"):
            return
        path = (webroot / unquote(parts.path).lstrip("/")) if parts.path.startswith("/") else (owner.parent / unquote(parts.path))
        if parts.path.endswith("/"):
            path /= "index.html"
        path = path.resolve()
        self.edges.add((self.label(owner), self.label(path) if path.is_relative_to(REPO) else str(path), context))
        if self.require(path, context) and recurse:
            self.walk(path, webroot, imports, document)
        # Native synchronized-video wrappers bind their video with ?file=.
        for item in parse_qs(parts.query).get("file", []):
            if Path(urlsplit(item).path).suffix.lower() in {".mp4", ".webm", ".mp3", ".wav"}:
                self.reference(item, path, webroot, "query file media", recurse=False)

    def course_assets(self, doc, owner, webroot, course, embedded_media=None):
        media = embedded_media or {}
        course_owner = webroot / "weblec" / course / "weblec.json"
        slides = doc.get("slides")
        if not isinstance(slides, list) or not slides:
            self.fail("No slides array: %s" % self.label(owner))
            return
        for slide in slides:
            if not isinstance(slide, dict) or not isinstance(slide.get("elements"), list):
                self.fail("Invalid elements: %s" % self.label(owner))
                continue
            for element in slide["elements"]:
                if not isinstance(element, dict):
                    self.fail("Invalid element: %s" % self.label(owner))
                    continue
                if element.get("type") in {"img", "image", "html", "video", "audio"}:
                    src = element.get("src")
                    if isinstance(src, str) and src in media and isinstance(media[src], str) and media[src].startswith("data:"):
                        continue
                    self.reference(src, course_owner, webroot, "course %s %s element" % (course, element.get("type")))
                if element.get("poster"):
                    self.reference(element["poster"], course_owner, webroot, "video poster", recurse=False)

    def javascript(self, text, owner, webroot, imports=None, document=None):
        # Specific runtime syntax only: arbitrary strings/metadata are not paths.
        imports, document = imports or {}, document or owner
        for value in IMPORT.findall(text):
            target, base = value, owner
            if not value.startswith(("./", "../", "/")) and not urlsplit(value).scheme:
                for prefix in sorted(imports, key=len, reverse=True):
                    if value == prefix or (prefix.endswith("/") and value.startswith(prefix)):
                        mapped, base = imports[prefix]
                        target = mapped + value[len(prefix):]
                        break
                else:
                    self.fail("Unresolved bare module import %s: %s" % (value, self.label(owner)))
                    continue
            self.reference(target, base, webroot, "JavaScript module import", imports=imports, document=document)
        for value in MODULE_URL.findall(text):
            self.reference(value, owner, webroot, "module-relative URL", imports=imports, document=document)
        for value in DOCUMENT_URL.findall(text):
            if Path(urlsplit(value).path).suffix.lower() in RUNTIME_EXT:
                self.reference(value, document, webroot, "document-relative runtime URL", imports=imports, document=document)
            elif value.startswith("/") and not value.startswith("//"):
                self.service_routes.add(value)
        for rx in (MEDIA_SET, VITE_DEPS):
            for group in rx.findall(text):
                for value in QUOTED.findall(group):
                    if Path(urlsplit(value).path).suffix.lower() in RUNTIME_EXT:
                        # Vite's preload map is relative to the deployment root.
                        base = webroot / "index.html" if rx is VITE_DEPS else owner
                        self.reference(value, base, webroot, "literal runtime allowlist", imports=imports, document=document)

    def css(self, text, owner, webroot):
        for match in CSS_URL.finditer(text):
            self.reference(match.group(1) or match.group(2), owner, webroot, "CSS dependency")

    def walk(self, path, webroot, imports=None, document=None):
        document = document or path
        key = (path, webroot, document)
        if key in self.visited:
            return
        self.visited.add(key)
        suffix = path.suffix.lower()
        if suffix not in {".html", ".js", ".mjs", ".css", ".svg"}:
            return
        try:
            text = path.read_text(encoding="utf-8-sig")
        except UnicodeError:
            self.fail("Non UTF-8 runtime text: %s" % self.label(path))
            return
        if suffix in {".js", ".mjs"}:
            self.javascript(text, path, webroot, imports, document)
        elif suffix == ".css":
            self.css(text, path, webroot)
        elif suffix in {".html", ".svg"}:
            self.counts["html"] += suffix == ".html"
            page = PageReferences()
            page.feed(text)
            mapping = dict(imports or {})
            for attrs, script in page.scripts:
                if attrs.get("type") == "importmap":
                    try:
                        value = json.loads(script)
                        for prefix, target in value.get("imports", {}).items():
                            if not isinstance(target, str):
                                raise ValueError("importmap target is not a string")
                            mapping[prefix] = (target, path)
                        # Scope-specific resolution is deliberately not guessed.
                        if value.get("scopes"):
                            self.fail("Scoped importmap requires explicit resolution support: %s" % self.label(path))
                    except (ValueError, AttributeError, TypeError):
                        self.fail("Invalid importmap: %s" % self.label(path))
            for value in page.references:
                if value.startswith(("data:text/javascript", "data:application/javascript")) and ";base64," in value:
                    try:
                        self.javascript(base64.b64decode(value.split(",", 1)[1]).decode("utf-8"), path, webroot, mapping, path)
                    except (ValueError, UnicodeError):
                        self.fail("Invalid embedded script: %s" % self.label(path))
                else:
                    self.reference(value, path, webroot, "HTML runtime reference", imports=mapping, document=path)
            for style in page.styles:
                self.css(style, path, webroot)
            for attrs, script in page.scripts:
                if attrs.get("type") == "importmap":
                    continue
                # HTTP single-file exports contain real course JSON and inline
                # image/font payloads. Read those objects, not provenance strings.
                data, media = None, {}
                for name in ("__WEBLEC__", "__WEBLEC_MEDIA__"):
                    match = re.search(r"window\." + name + r"\s*=\s*", script)
                    if match:
                        try:
                            value, length = json.JSONDecoder().raw_decode(script[match.end():])
                            data, media = (value, media) if name == "__WEBLEC__" else (data, value)
                            script = script[:match.start()] + script[match.end() + length:]
                        except ValueError:
                            self.fail("Invalid embedded %s: %s" % (name, self.label(path)))
                if data is not None:
                    match = re.search(r"searchParams\.set\(\s*['\"]course['\"]\s*,\s*['\"]([^'\"]+)['\"]", text[:2000])
                    course = match.group(1) if match else self.course_titles.get(data.get("title"))
                    if not course and "weblec" in path.parts:
                        course = path.parts[path.parts.index("weblec") + 1]
                    if not course or not ID.fullmatch(course):
                        self.fail("Cannot resolve embedded course runtime base: %s" % self.label(path))
                    else:
                        self.counts["embedded_courses"] += 1
                        self.course_assets(data, path, webroot, course, media)
                if attrs.get("type") not in {"application/json", "application/ld+json"}:
                    self.javascript(script, path, webroot, mapping, path)

    def menus(self):
        for name, expected in MENUS.items():
            copies = [APP / folder / "weblec" / name for folder in ("public", "dist")]
            docs = []
            for path in copies:
                if not self.require(path, "menu"):
                    continue
                try:
                    rows = json.loads(path.read_text(encoding="utf-8-sig"))
                except (ValueError, UnicodeError):
                    self.fail("Invalid menu JSON: %s" % self.label(path))
                    continue
                ids = [row.get("id") for row in rows if isinstance(row, dict)] if isinstance(rows, list) else []
                if len(ids) != len(expected) or any(not isinstance(i, str) or not ID.fullmatch(i) for i in ids) or set(ids) != expected:
                    self.fail("Menu IDs/count differ from expected %d: %s" % (len(expected), self.label(path)))
                    continue
                if name == "courses_special.json" and any(row.get("lectureAvailable") is not True for row in rows):
                    self.fail("All eight special lectures must have lectureAvailable=true: %s" % self.label(path))
                docs.append(rows)
                self.counts["menus"] += 1
            if len(docs) != 2:
                continue
            if copies[0].read_bytes() != copies[1].read_bytes():
                self.fail("public/dist menu bytes differ: %s" % name)
            for row in docs[0]:
                course = row["id"]
                self.counts["courses"] += 1
                for leaf in ("weblec.json", "audio.mp3"):
                    pair = [p.parent / course / leaf for p in copies]
                    okay = [self.require(p, "course " + course) for p in pair]
                    if all(okay):
                        if not pair[0].stat().st_size or pair[0].read_bytes() != pair[1].read_bytes():
                            self.fail("Empty or different public/dist %s: %s" % (leaf, course))
                for path in [p.parent / course / "weblec.json" for p in copies]:
                    if not path.is_file():
                        continue
                    try:
                        doc = json.loads(path.read_text(encoding="utf-8-sig"))
                        if not isinstance(doc, dict):
                            raise ValueError("not an object")
                    except (ValueError, UnicodeError):
                        self.fail("Invalid course JSON: %s" % self.label(path))
                        continue
                    self.course_titles[doc.get("title")] = course
                    webroot = path.parents[2]
                    self.course_assets(doc, path, webroot, course)
                    self.require(path.parent / "logo.png", "default course logo")
                    characters = {doc.get("character", "aqiang")} | {c.get("id") for c in doc.get("characters", []) if isinstance(c, dict)}
                    for character in characters:
                        if not isinstance(character, str) or not ID.fullmatch(character):
                            self.fail("Invalid teacher character: %s" % self.label(path))
                            continue
                        for pose in POSES:
                            self.require(webroot / "poses" / character / ("pose_" + pose + ".png"), "teacher pose")
                for webroot in (APP / "public", APP / "dist"):
                    if row.get("slidesUrl"):
                        self.reference(row["slidesUrl"], webroot / "index.html", webroot, "menu slidesUrl")

    def run(self):
        self.menus()
        webroot = APP / "dist"
        for leaf in ("index.html", "slides.html", "启动交互课堂-win.bat", "启动交互课堂-mac.command", "serve-win.ps1", "serve-mac.py"):
            path = webroot / leaf
            if self.require(path, "deployment entry"):
                self.walk(path, webroot)
        # Retained exports and compatibility routes are release entry points too.
        for folder, root in ((APP / "dist", webroot), (APP / "public" / "weblec", APP / "public"), (APP / "slides-export", webroot)):
            for path in sorted(folder.rglob("*.html")):
                if self.require(path, "retained HTML entry"):
                    self.walk(path, root)

    def git_check(self, check_index):
        try:
            raw = subprocess.check_output(["git", "ls-files", "--stage", "-z"], cwd=REPO)
        except (OSError, subprocess.CalledProcessError) as exc:
            self.fail("Git tracking cannot be verified: %s" % exc)
            return
        entries = {}
        for record in raw.split(b"\0"):
            if record:
                head, filename = record.split(b"\t", 1)
                _mode, oid, stage = head.decode("ascii").split()
                if stage != "0":
                    self.fail("Unmerged Git index: %s" % filename.decode("utf-8"))
                else:
                    entries[filename.decode("utf-8")] = oid
        paths = sorted(self.label(path) for path in self.inputs)
        for path in paths:
            if path not in entries:
                self.fail("Required release file is not in Git index: %s" % path)
        if check_index:
            # Git applies this repo's attributes/clean filters, including bat/ps1
            # LF normalization, without writing objects or changing the index.
            lines = "".join(json.dumps(path, ensure_ascii=False) + "\n" for path in paths)
            try:
                result = subprocess.run(["git", "hash-object", "--stdin-paths"], input=lines, text=True, encoding="utf-8", capture_output=True, cwd=REPO, check=True)
                oids = result.stdout.splitlines()
                if len(oids) != len(paths):
                    self.fail("Git hash-object returned an incomplete file list")
                for path, oid in zip(paths, oids):
                    if path in entries and oid != entries[path]:
                        self.fail("Required release file differs from staged bytes: %s" % path)
            except (OSError, subprocess.CalledProcessError) as exc:
                self.fail("Git staged-byte verification failed: %s" % exc)

    def seal_inputs(self):
        # A report must not mix inputs that changed while dependency traversal ran.
        for path, recorded in self.inputs.items():
            if not path.is_file() or hashlib.sha256(path.read_bytes()).hexdigest() != recorded["sha256"]:
                self.fail("Release input changed during check: %s" % recorded["path"])


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    mode = parser.add_mutually_exclusive_group()
    mode.add_argument("--no-git-check", action="store_true", help="Development check before staging; does not prove clone completeness")
    mode.add_argument("--check-index", action="store_true", help="Also require current inputs to match staged Git blobs")
    parser.add_argument("--report", type=Path, help="Write exact input SHA-256 and scope to a path inside work/")
    args = parser.parse_args()
    report_path = args.report.resolve() if args.report and args.report.is_absolute() else ((REPO / args.report).resolve() if args.report else None)
    if report_path and not report_path.is_relative_to(REPO / "work"):
        parser.error("--report must be inside the repository work/ directory")
    check = ReleaseCheck()
    check.run()
    if not args.no_git_check:
        check.git_check(args.check_index)
    check.seal_inputs()
    errors = sorted(set(check.errors))
    report = {
        "result": "failed" if errors else "passed",
        "checked_at_utc": datetime.now(timezone.utc).isoformat(),
        "scope": "local release file completeness, menu contract, public/dist data/audio equality and static runtime dependency graph",
        "not_verified": ["browser behavior", "Windows machine launch", "teaching accuracy", "full listening", "teacher approval", "remote link availability", "arbitrary computed JavaScript URLs"],
        "git_mode": "disabled_development_only" if args.no_git_check else ("tracked_and_staged_bytes" if args.check_index else "tracked_membership"),
        "checker_sha256": hashlib.sha256(Path(__file__).read_bytes()).hexdigest(),
        "counts": dict(check.counts, inputs=len(check.inputs), dependency_edges=len(check.edges)),
        "inputs": sorted(check.inputs.values(), key=lambda row: row["path"]),
        "dependency_edges": [{"from": a, "to": b, "reason": c} for a, b, c in sorted(check.edges)],
        "remote_runtime_references_not_fetched": sorted(check.external),
        "local_service_routes_not_checked": sorted(check.service_routes),
        "errors": errors,
    }
    if report_path:
        report_path.parent.mkdir(parents=True, exist_ok=True)
        report_path.write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print("Release file check %s: %d courses, %d menu copies, %d inputs, %d errors; Git=%s." % (report["result"], check.counts["courses"], check.counts["menus"], len(check.inputs), len(errors), report["git_mode"]))
    for error in errors[:12]:
        print("  " + error)
    if len(errors) > 12:
        print("  Remaining errors are included in --report (%d total)." % len(errors))
    if report_path:
        print("Report: " + report_path.relative_to(REPO).as_posix())
    return 1 if errors else 0


if __name__ == "__main__":
    sys.exit(main())
