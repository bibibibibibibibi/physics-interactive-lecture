"""Packaging keeps only checked runtime files and never overwrites archives."""

import json
from pathlib import Path
import runpy
import unittest
import zipfile
from work_directory import make_test_directory


REPO = Path(__file__).resolve().parents[1]
pack = runpy.run_path(str(REPO / "interactive-lecture/scripts/package-release.py"), run_name="package_test")
checker = runpy.run_path(str(REPO / "interactive-lecture/scripts/check-release.py"), run_name="checker_test")


class ReleasePackagingTest(unittest.TestCase):
    def test_explicit_export_selection_skips_local_history(self):
        root = make_test_directory("release-exports-")
        stale = root / "slides-export" / "old.html"
        current = root / "slides-export" / "current.html"
        stale.parent.mkdir(parents=True)
        for path in (stale, current):
            path.write_text("<html></html>")
        check = checker["ReleaseCheck"](root / "dist", exports=[current])
        check.menus = lambda: None
        check.run()
        self.assertIn(current, check.inputs)
        self.assertNotIn(stale, check.inputs)

    def test_only_checked_distribution_files_are_selected(self):
        root = make_test_directory("release-selection-")
        dist, exports, public = root / "dist", root / "slides-export", root / "public"
        used, source, exported = dist / "index.html", public / "audio.mp3", exports / "slides.html"
        for p in (used, source, exported, dist / "unused-old.mp4"):
            p.parent.mkdir(parents=True, exist_ok=True)
            p.write_bytes(b"test")
        selected = pack["distribution_files"]({used: {}, source: {}, exported: {}}, dist, exports)
        self.assertEqual(set(selected.values()), {"dist/index.html", "slides-export/slides.html"})
        self.assertNotIn(dist / "unused-old.mp4", selected)
        self.assertNotIn(source, selected)

    def test_zip_has_hash_manifest_and_retains_source_bytes(self):
        root = make_test_directory("release-zip-")
        source, output = root / "audio.mp3", root / "release.zip"
        source.write_bytes(b"preserved source bytes")
        pack["write_archive"](output, {source: "dist/audio.mp3"}, {"kind": "development"})
        with zipfile.ZipFile(output) as z:
            self.assertEqual(z.read("dist/audio.mp3"), source.read_bytes())
            manifest = json.loads(z.read("release-manifest.json"))
            self.assertEqual(manifest["kind"], "development")
            self.assertEqual(manifest["files"][0]["bytes"], len(source.read_bytes()))
            self.assertEqual(len(manifest["files"][0]["sha256"]), 64)

    def test_existing_archive_is_preserved(self):
        root = make_test_directory("release-retention-")
        output = root / "release.zip"
        output.write_bytes(b"previous archive")
        with self.assertRaisesRegex(ValueError, "already exists"):
            pack["write_archive"](output, {}, {})
        self.assertEqual(output.read_bytes(), b"previous archive")


if __name__ == "__main__":
    unittest.main()
