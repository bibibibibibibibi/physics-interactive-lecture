"""IndexTTS 本地配音适配器测试；不加载模型、不访问网络。"""
import json
from pathlib import Path
import subprocess
import sys
import unittest
from unittest.mock import Mock, patch

from work_directory import make_test_directory

ROOT = Path(__file__).resolve().parents[1]
FACTORY = ROOT / "lecture_factory"
sys.path.insert(0, str(FACTORY))
import build_index_courses
import local_index_tts


class LocalIndexTTSTests(unittest.TestCase):
    def setUp(self):
        self.root = make_test_directory("index-tts-")
        self.prompt = self.root / "voice.wav"
        self.prompt.write_bytes(b"reference")

    def test_rejects_technical_step_markers(self):
        with self.assertRaisesRegex(ValueError, "技术锚点"):
            local_index_tts.tts("[[1]]不能读出的标记。", str(self.prompt), str(self.root / "out.mp3"))

    def test_generates_compatible_mp3_and_reuses_sentence_file(self):
        engine = Mock()
        engine.infer.side_effect = lambda **kwargs: Path(kwargs["output_path"]).write_bytes(b"wav")
        output = self.root / "sentence.mp3"

        def convert(command, **kwargs):
            Path(command[-1]).write_bytes(b"mp3")
            return subprocess.CompletedProcess(command, 0)

        with patch.object(local_index_tts, "get_engine", return_value=engine) as get_engine, \
                patch.object(local_index_tts, "audio_rms", return_value=4000), \
                patch.object(local_index_tts.subprocess, "run", side_effect=convert):
            local_index_tts.tts("磁场的方向由右手定则判断。", str(self.prompt), str(output))
            local_index_tts.tts("磁场的方向由右手定则判断。", str(self.prompt), str(output))
        self.assertEqual(output.read_bytes(), b"mp3")
        get_engine.assert_called_once_with()
        engine.infer.assert_called_once()
        options = engine.infer.call_args.kwargs
        self.assertEqual(options["duration_factor"], 1.2)
        self.assertEqual(options["lang"], "ZH")
        self.assertEqual(options["emo_alpha"], 0.6)
        self.assertFalse(options["verbose"])

    def test_silent_sentence_is_retried_before_acceptance(self):
        engine = Mock()
        engine.infer.side_effect = lambda **kwargs: Path(kwargs["output_path"]).write_bytes(b"wav")
        output = self.root / "retry.mp3"

        def convert(command, **kwargs):
            Path(command[-1]).write_bytes(b"mp3")
            return subprocess.CompletedProcess(command, 0)

        with patch.object(local_index_tts, "get_engine", return_value=engine), \
                patch.object(local_index_tts, "audio_rms", side_effect=[0, 4200]), \
                patch.object(local_index_tts.subprocess, "run", side_effect=convert):
            local_index_tts.tts("小结。", str(self.prompt), str(output))
        self.assertEqual(engine.infer.call_count, 2)
        self.assertEqual(output.read_bytes(), b"mp3")

    def test_stage_selects_local_engine_without_touching_source(self):
        source = FACTORY / "courses_web" / "kin6-1" / "slides.json"
        original = source.read_bytes()
        stage = self.root / "stage"
        build_index_courses.prepare(stage, ["kin6-1"])
        staged_path = stage / "courses_web" / "kin6-1" / "slides.json"
        staged = json.loads(staged_path.read_text(encoding="utf-8"))
        self.assertEqual(staged["engine"], "index-tts")
        self.assertEqual(staged["voice"], "voice_03.wav")
        self.assertEqual(source.read_bytes(), original)
        self.assertFalse((stage / "courses_web" / "kin6-1" / "audio").exists())
        self.assertFalse((stage / "public").exists())


if __name__ == "__main__":
    unittest.main()
