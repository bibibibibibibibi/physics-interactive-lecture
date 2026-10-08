"""Real cached-audio build in a Unicode path; never touches published courses."""

import importlib.util
import json
import os
from pathlib import Path
import shutil
import subprocess
import sys
import unittest
from work_directory import make_test_directory

REPO = Path(__file__).resolve().parents[1]


@unittest.skipUnless(importlib.util.find_spec("imageio_ffmpeg"), "Requires imageio-ffmpeg from requirements.txt")
class BuildIntermediatesTest(unittest.TestCase):
    def test_cached_page_build_preserves_cache_and_keeps_concat_in_work(self):
        root = make_test_directory("cached-build-")
        source = REPO / "lecture_factory/courses_web/pre_vector"
        course = root / "physics's 中文 课堂"
        (course / "audio").mkdir(parents=True)
        doc = json.loads((source / "slides.json").read_text(encoding="utf-8"))
        doc["pages"] = doc["pages"][:1]
        doc.pop("sections", None)
        (course / "slides.json").write_text(json.dumps(doc, ensure_ascii=False), encoding="utf-8")
        for relative in ("audio/page1.mp3", "page1.times.json"):
            shutil.copy2(source / relative, course / relative)
        cache = (course / "audio/page1.mp3").read_bytes()
        output = root / "public/weblec"
        assets = output / course.name
        assets.mkdir(parents=True)
        media = REPO / "interactive-lecture/public/weblec/pre_vector"
        for name in ("hero_vectors.svg", "logo.png"):
            shutil.copy2(media / name, assets / name)
        code = """
import sys
sys.path.insert(0, sys.argv[1])
import build_web
build_web.WEB_PUBLIC = sys.argv[3]
def reject_speech(*args, **kwargs):
    raise AssertionError('Cached build must never request speech')
build_web.gen_audio.tts = reject_speech
sys.argv = ['build_web.py', sys.argv[2]]
build_web.main()
"""
        env = {key: value for key, value in os.environ.items() if not key.startswith("KIMI_AUDIO_")}
        env.update(PYTHONUTF8="1", PYTHONDONTWRITEBYTECODE="1")
        result = subprocess.run([sys.executable, "-B", "-c", code, str(REPO / "lecture_factory"), str(course), str(output)],
                                env=env, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, timeout=60)
        (root / "build.log").write_bytes(result.stdout)
        self.assertEqual(result.returncode, 0, result.stdout.decode("utf-8", errors="replace"))
        self.assertEqual((course / "audio/page1.mp3").read_bytes(), cache)
        self.assertFalse(list((course / "audio").glob("_list*.txt")))
        self.assertFalse(list((course / "audio").glob("_sil*.mp3")))
        self.assertGreater((assets / "audio.mp3").stat().st_size, 0)
        merged = json.loads((assets / "weblec.json").read_text(encoding="utf-8"))
        self.assertEqual(len(merged["slides"]), 1)
        self.assertGreater(merged["duration"], 10)
        self.assertTrue(list((REPO / "work/audio-build" / course.name).glob("*/_list_all.txt")))


if __name__ == "__main__":
    unittest.main(verbosity=2)
