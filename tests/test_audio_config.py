"""TTS 配置与缓存回归测试；不访问网络，不调用真实配音工具。"""
import contextlib
import importlib
import io
import json
import os
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest
from unittest.mock import Mock, patch


FACTORY = Path(__file__).resolve().parents[1] / "lecture_factory"
sys.path.insert(0, str(FACTORY))

# 配置测试只需标准库；FFmpeg 本身由实际构建/校验验证。
with patch.dict(sys.modules, {"imageio_ffmpeg": Mock(get_ffmpeg_exe=lambda: "ffmpeg")}):
    gen_audio = importlib.import_module("gen_audio")
    build_web = importlib.import_module("build_web")


class AudioConfigTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory(prefix="配音 测试 ")
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        self.tool = self.root / "audio_generation_tool.py"
        self.tool.write_text("# mocked TTS tool\n", encoding="utf-8")
        self.env = patch.dict(os.environ, {}, clear=True)
        self.env.start()
        self.addCleanup(self.env.stop)

    def test_explicit_tool_preserves_spaces_and_unicode(self):
        os.environ["KIMI_AUDIO_TOOL"] = str(self.tool)
        self.assertEqual(gen_audio.audio_tool_command(), [sys.executable, str(self.tool.resolve())])

    def test_windows_appdata_layout_remains_supported(self):
        os.environ["APPDATA"] = str(self.root)
        tool = self.root.joinpath("kimi-desktop", "daimon-share", "daimon", "runtime",
                                  "kimi-code", "home", "plugins", "managed", "audio_generation",
                                  "scripts", "audio_generation_tool.py")
        tool.parent.mkdir(parents=True)
        tool.write_text("# mocked TTS tool\n", encoding="utf-8")
        self.assertEqual(gen_audio.audio_tool_command()[1], str(tool.resolve()))

    def test_missing_tool_explains_configuration(self):
        with self.assertRaisesRegex(SystemExit, "KIMI_AUDIO_TOOL"):
            gen_audio.audio_tool_command()

    def test_invalid_explicit_tool_does_not_fall_back(self):
        os.environ["KIMI_AUDIO_TOOL"] = str(self.root / "missing.py")
        with self.assertRaisesRegex(SystemExit, "KIMI_AUDIO_TOOL"):
            gen_audio.audio_tool_command()

    def test_interpreter_can_be_configured(self):
        os.environ["KIMI_AUDIO_TOOL"] = str(self.tool)
        os.environ["KIMI_AUDIO_PYTHON"] = sys.executable
        self.assertEqual(gen_audio.audio_tool_command()[0], sys.executable)

    def test_invalid_interpreter_has_clear_error(self):
        os.environ["KIMI_AUDIO_TOOL"] = str(self.tool)
        os.environ["KIMI_AUDIO_PYTHON"] = str(self.root / "missing-python")
        with self.assertRaisesRegex(SystemExit, "KIMI_AUDIO_PYTHON"):
            gen_audio.audio_tool_command()

    def test_cached_sentence_needs_no_tts_configuration(self):
        output = self.root / "cached.mp3"
        output.write_bytes(b"cached audio")
        with patch.object(gen_audio.subprocess, "run") as run:
            gen_audio.tts("这是一句讲稿。", "voice", str(output))
        run.assert_not_called()
        self.assertEqual(output.read_bytes(), b"cached audio")

    def test_speech_arguments_are_unchanged(self):
        os.environ["KIMI_AUDIO_TOOL"] = str(self.tool)
        output = self.root / "new audio.mp3"

        def mock_run(command, **kwargs):
            output.write_bytes(b"mock audio")
            return subprocess.CompletedProcess(command, 0, stdout="", stderr="")

        with patch.object(gen_audio.subprocess, "run", side_effect=mock_run) as run:
            gen_audio.tts("带空格 的讲稿。", "voice-id", str(output))
        self.assertEqual(run.call_args.args[0], [sys.executable, str(self.tool.resolve()), "speech",
                         "--text", "带空格 的讲稿。", "--voice-id", "voice-id", "--output", str(output)])
        self.assertNotIn("shell", run.call_args.kwargs)

    def test_tool_failure_reports_stderr(self):
        os.environ["KIMI_AUDIO_TOOL"] = str(self.tool)
        result = subprocess.CompletedProcess([], 1, stdout="", stderr="missing Kimi dependency")
        with patch.object(gen_audio.subprocess, "run", return_value=result):
            with self.assertRaisesRegex(SystemExit, "missing Kimi dependency"):
                gen_audio.tts("讲稿。", "voice", str(self.root / "failed.mp3"))

    def test_missing_configuration_preserves_sentence_cache_before_rebuild(self):
        audio = self.root / "audio"
        audio.mkdir()
        sentence = audio / "p1_00.mp3"
        sentence.write_bytes(b"keep existing cache")
        (self.root / "slides.json").write_text(json.dumps({"pages": [{"id": 1}]}), encoding="utf-8")
        with patch.object(sys, "argv", ["build_web.py", str(self.root)]), \
                patch.object(gen_audio, "silence") as silence, contextlib.redirect_stdout(io.StringIO()):
            with self.assertRaisesRegex(SystemExit, "KIMI_AUDIO_TOOL"):
                build_web.main()
        silence.assert_not_called()
        self.assertEqual(sentence.read_bytes(), b"keep existing cache")


if __name__ == "__main__":
    unittest.main()
