"""MiniMax sample safety and caching checks; no network or paid synthesis."""
import contextlib
import importlib
import io
import json
import os
from pathlib import Path
import sys
import unittest
from unittest.mock import patch
from work_directory import make_test_directory


sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "lecture_factory"))
sample = importlib.import_module("try_minimax")


class MiniMaxSampleTests(unittest.TestCase):
    def setUp(self):
        self.root = make_test_directory("minimax-sample-")
        self.output = self.root / "audio" / "page11.mp3"
        self.payload = {"model": "speech-2.8-hd", "text": "两非零矢量垂直时，标积为零。",
                        "stream": False, "output_format": "hex",
                        "voice_setting": {"voice_id": "test-voice"},
                        "audio_setting": {"format": "mp3"}}
        self.request = self.root / "request.json"
        self.request.write_text(json.dumps(self.payload, ensure_ascii=False), encoding="utf-8")
        self.response = {"base_resp": {"status_code": 0, "status_msg": "success"},
                         "data": {"status": 2, "audio": b"ID3sample-audio".hex()},
                         "extra_info": {"audio_length": 1000}}
        env = patch.dict(os.environ, {}, clear=True)
        env.start()
        self.addCleanup(env.stop)
        root = patch.object(sample, "ROOT", self.root)
        root.start()
        self.addCleanup(root.stop)

    def test_prepare_never_requests_or_needs_key(self):
        with patch.object(sample.urllib.request, "urlopen") as network, \
                contextlib.redirect_stdout(io.StringIO()) as output:
            code = sample.main(["--request", str(self.request), "--output", str(self.output)])
        self.assertEqual(code, 0)
        network.assert_not_called()
        self.assertIn("没有联网或计费", output.getvalue())
        self.assertFalse(self.output.exists())

    def test_empty_key_does_not_request(self):
        (self.root / ".env.minimax.local").write_text("MINIMAX_API_KEY=\n", encoding="utf-8")
        with patch.object(sample.urllib.request, "urlopen") as network:
            with self.assertRaisesRegex(sample.SampleError, "MINIMAX_API_KEY"):
                sample.generate_sample(self.payload, self.output)
        network.assert_not_called()
        self.assertFalse(self.output.exists())

    def test_error_status_does_not_create_output_or_echo_key(self):
        os.environ["MINIMAX_API_KEY"] = "test-secret-value"
        self.response["base_resp"] = {"status_code": 1004, "status_msg": "bad key test-secret-value"}
        with patch.object(sample, "fetch_response", return_value=self.response):
            with self.assertRaises(sample.SampleError) as caught:
                sample.generate_sample(self.payload, self.output)
        self.assertNotIn("test-secret-value", str(caught.exception))
        self.assertFalse(self.output.exists())
        self.assertFalse(sample.manifest_path(self.output).exists())

    def test_valid_hex_is_saved_with_small_manifest(self):
        os.environ["MINIMAX_API_KEY"] = "test-secret-value"
        with patch.object(sample, "fetch_response", return_value=self.response) as fetch:
            self.assertTrue(sample.generate_sample(self.payload, self.output))
        fetch.assert_called_once()
        self.assertEqual(self.output.read_bytes(), b"ID3sample-audio")
        manifest_text = sample.manifest_path(self.output).read_text(encoding="utf-8")
        manifest = json.loads(manifest_text)
        self.assertEqual(manifest["request"], self.payload)
        self.assertEqual(manifest["extra_info"], {"audio_length": 1000})
        self.assertNotIn("test-secret-value", manifest_text)
        self.assertNotIn(self.response["data"]["audio"], manifest_text)

    def test_cache_hit_needs_no_key_and_makes_no_request(self):
        os.environ["MINIMAX_API_KEY"] = "test-secret-value"
        with patch.object(sample, "fetch_response", return_value=self.response):
            sample.generate_sample(self.payload, self.output)
        os.environ.pop("MINIMAX_API_KEY")
        with patch.object(sample.urllib.request, "urlopen") as network:
            self.assertFalse(sample.generate_sample(self.payload, self.output))
        network.assert_not_called()

    def test_changed_request_cannot_reuse_old_audio(self):
        os.environ["MINIMAX_API_KEY"] = "test-secret-value"
        with patch.object(sample, "fetch_response", return_value=self.response):
            sample.generate_sample(self.payload, self.output)
        changed = {**self.payload, "text": "两个非零矢量平行时，叉积是零矢量。"}
        self.response["data"]["audio"] = b"ID3replacement".hex()
        with patch.object(sample, "fetch_response", return_value=self.response) as fetch:
            self.assertTrue(sample.generate_sample(changed, self.output))
        fetch.assert_called_once()
        self.assertEqual(self.output.read_bytes(), b"ID3replacement")
        self.assertTrue(sample.cached_sample(changed, self.output))
        self.assertFalse(sample.cached_sample(self.payload, self.output))

    def test_unfinished_or_malformed_audio_is_rejected(self):
        os.environ["MINIMAX_API_KEY"] = "test-secret-value"
        for data in ({"status": 1, "audio": "494433"},
                     {"status": 2, "audio": ""},
                     {"status": 2, "audio": "xyz"},
                     {"status": 2, "audio": "ab cd"}):
            with self.subTest(data=data), \
                    patch.object(sample, "fetch_response", return_value={**self.response, "data": data}):
                with self.assertRaises(sample.SampleError):
                    sample.generate_sample(self.payload, self.output)
                self.assertFalse(self.output.exists())

    def test_course_and_publish_outputs_are_protected(self):
        for folder in ("lecture_factory/courses_web/pre_vector/audio", "interactive-lecture/public/weblec/pre_vector",
                       "interactive-lecture/dist/weblec/pre_vector"):
            with self.subTest(folder=folder), self.assertRaises(sample.SampleError):
                sample.safe_output(self.root / folder / "page11.mp3", self.request)


if __name__ == "__main__":
    unittest.main()
