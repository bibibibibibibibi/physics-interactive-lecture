"""Windows-only transport contract for the actual BAT / PowerShell 5.1 launcher.

Uses only Python's standard library. Fixtures and logs stay in ignored work/;
only this test's process tree and reserved sockets are stopped. Non-Windows
hosts explicitly skip these tests and do not count as Windows verification.
This checks HTTP transport, not human classroom or media playback approval.
"""

from concurrent.futures import ThreadPoolExecutor
import http.client
import os
from pathlib import Path
import shutil
import socket
import subprocess
import sys
import time
import unittest
from urllib.parse import quote
import uuid

REPO = Path(__file__).resolve().parents[2]
SOURCE = REPO / "lecture_factory/assets/launcher"
DIST = REPO / "interactive-lecture/dist"
BAT_NAME = "启动交互课堂-win.bat"


@unittest.skipUnless(os.name == "nt", "Requires real Windows PowerShell 5.1; not verified on this host")
class WindowsLauncherContract(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.powershell = shutil.which("powershell.exe")
        if not cls.powershell:
            raise AssertionError("Windows PowerShell 5.1 is required; absence is a failure, not a skip")
        cls.fixture = REPO / "work/project-sync/windows-launcher-tests" / str(uuid.uuid4())
        cls.directory = cls.fixture / "课堂 中文 带空格"
        cls.directory.mkdir(parents=True)
        cls.payload = bytes(range(256)) * 4096
        (cls.directory / "index.html").write_text("<meta charset='utf-8'>大学物理课堂", encoding="utf-8")
        (cls.directory / "说明 中文.txt").write_text("中文路径与空格", encoding="utf-8")
        (cls.directory / "data.json").write_text('{"课程":"物理"}', encoding="utf-8")
        (cls.directory / "captions.vtt").write_text("WEBVTT\n", encoding="utf-8")
        (cls.directory / "media.mp4").write_bytes(cls.payload)
        (cls.directory / "voice.mp3").write_bytes(cls.payload)
        (cls.directory / "empty.mp4").write_bytes(b"")
        (cls.fixture / "private.txt").write_text("outside release root", encoding="utf-8")
        for name in ("serve-win.ps1", BAT_NAME):
            shutil.copy2(SOURCE / name, cls.directory / name)

        environment = dict(os.environ, LECTURE_TEST_SCRIPT=str(cls.directory / "serve-win.ps1"))
        parse = subprocess.run(
            [cls.powershell, "-NoProfile", "-Command",
             "$tokens=$null; $errors=$null; "
             "[System.Management.Automation.Language.Parser]::ParseFile($env:LECTURE_TEST_SCRIPT,[ref]$tokens,[ref]$errors) | Out-Null; "
             "if ($errors.Count) { $errors | Format-List; exit 1 }"],
            env=environment, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, timeout=30,
        )
        (cls.fixture / "parse.log").write_bytes(parse.stdout)
        if parse.returncode:
            raise AssertionError("PowerShell syntax failed; see " + str(cls.fixture / "parse.log"))

        # Reserve a random first port; find a free adjacent fallback without touching production ports.
        for _ in range(100):
            reserved = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            reserved.bind(("127.0.0.1", 0))
            first = reserved.getsockname()[1]
            if first == 65535:
                reserved.close()
                continue
            try:
                with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as adjacent:
                    adjacent.bind(("127.0.0.1", first + 1))
            except OSError:
                reserved.close()
                continue
            reserved.listen(1)
            cls.reserved = reserved
            cls.first_port, cls.port = first, first + 1
            break
        else:
            raise AssertionError("Cannot reserve a free adjacent test-port pair")

        cls.log_path = cls.fixture / "launcher.log"
        cls.log = cls.log_path.open("wb")
        # Invoke the real BAT in a Chinese path containing spaces. The BAT must forward test flags.
        cls.process = subprocess.Popen(
            ["cmd.exe", "/d", "/c", BAT_NAME, "-Port", str(cls.first_port),
             "-LastPort", str(cls.port), "-NoBrowser"],
            cwd=cls.directory, stdout=cls.log, stderr=subprocess.STDOUT,
            creationflags=subprocess.CREATE_NEW_PROCESS_GROUP,
        )
        try:
            deadline = time.monotonic() + 40
            while time.monotonic() < deadline:
                if cls.process.poll() is not None:
                    raise AssertionError("BAT/PowerShell exited before listening; see " + str(cls.log_path))
                try:
                    status, _, body = cls.request("GET", "/")
                    if status == 200 and "大学物理课堂" in body.decode("utf-8"):
                        return
                except (OSError, http.client.HTTPException):
                    pass
                time.sleep(0.1)
            raise AssertionError("Launcher did not bind its fallback port; see " + str(cls.log_path))
        except BaseException:
            cls.stop_process()
            raise

    @classmethod
    def stop_process(cls):
        try:
            if cls.process.poll() is None:
                stopped = subprocess.run(
                    ["taskkill.exe", "/PID", str(cls.process.pid), "/T", "/F"],
                    stdout=subprocess.PIPE, stderr=subprocess.STDOUT, timeout=15,
                )
                (cls.fixture / "stop.log").write_bytes(stopped.stdout)
                if stopped.returncode:
                    raise AssertionError("Could not stop this test's launcher process tree")
            cls.process.wait(timeout=15)
        finally:
            cls.reserved.close()
            cls.log.close()

    @classmethod
    def tearDownClass(cls):
        cls.stop_process()
        deadline = time.monotonic() + 5
        while time.monotonic() < deadline:
            with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as check:
                check.settimeout(0.2)
                if check.connect_ex(("127.0.0.1", cls.port)) != 0:
                    print("Windows launcher test fixtures retained at:", cls.fixture)
                    return
            time.sleep(0.1)
        raise AssertionError("Test server still listens after its process tree was stopped")

    @classmethod
    def request(cls, method, path, headers=None):
        connection = http.client.HTTPConnection("127.0.0.1", cls.port, timeout=3)
        try:
            connection.request(method, path, headers=headers or {})
            response = connection.getresponse()
            return response.status, dict(response.getheaders()), response.read()
        finally:
            connection.close()

    def test_source_and_dist_use_the_same_launcher(self):
        for name in ("serve-win.ps1", BAT_NAME):
            self.assertEqual((SOURCE / name).read_bytes(), (DIST / name).read_bytes())
        (SOURCE / BAT_NAME).read_bytes().decode("ascii")
        self.assertTrue((SOURCE / "serve-win.ps1").read_bytes().startswith(b"\xef\xbb\xbf"))

    def test_exhausted_range_stops_with_nonzero_exit(self):
        result = subprocess.run(
            [self.powershell, "-NoLogo", "-NoProfile", "-ExecutionPolicy", "Bypass",
             "-File", str(self.directory / "serve-win.ps1"), "-Port", str(self.first_port),
             "-LastPort", str(self.first_port), "-NoBrowser"],
            stdout=subprocess.PIPE, stderr=subprocess.STDOUT, timeout=30,
        )
        (self.fixture / "exhausted-ports.log").write_bytes(result.stdout)
        self.assertNotEqual(result.returncode, 0)
        self.assertIn(b"already in use", result.stdout)
        self.assertNotIn(b"Local classroom ready", result.stdout)

    def test_busy_first_port_falls_back_and_returns_fresh_unicode_content(self):
        self.assertEqual(self.port, self.first_port + 1)
        status, headers, body = self.request("GET", "/" + quote("说明 中文.txt"))
        self.assertEqual(status, 200)
        self.assertEqual(body.decode("utf-8"), "中文路径与空格")
        self.assertIn("no-store", headers["Cache-Control"])
        self.assertIn("charset=utf-8", headers["Content-Type"])
        target = self.directory / "说明 中文.txt"
        target.write_text("更新后的中文内容", encoding="utf-8")
        self.assertEqual(self.request("GET", "/" + quote(target.name))[2].decode("utf-8"), "更新后的中文内容")

    def test_get_head_and_mime(self):
        status, headers, body = self.request("HEAD", "/media.mp4", {"Range": "bytes=10-20"})
        self.assertEqual((status, body), (200, b""))
        self.assertEqual(int(headers["Content-Length"]), len(self.payload))
        self.assertEqual(headers["Content-Type"], "video/mp4")
        self.assertEqual(headers["Accept-Ranges"], "bytes")
        self.assertEqual(self.request("GET", "/voice.mp3", {"Range": "bytes=0-0"})[1]["Content-Type"], "audio/mpeg")
        self.assertEqual(self.request("GET", "/data.json")[1]["Content-Type"], "application/json; charset=utf-8")
        self.assertEqual(self.request("GET", "/captions.vtt")[1]["Content-Type"], "text/vtt; charset=utf-8")

    def test_forward_suffix_open_and_clamped_ranges(self):
        cases = [("bytes=100-199", 100, 199), ("bytes=-64", len(self.payload)-64, len(self.payload)-1),
                 ("bytes=1048500-", 1048500, len(self.payload)-1),
                 ("bytes=1048500-9999999", 1048500, len(self.payload)-1)]
        for value, start, end in cases:
            with self.subTest(range=value):
                status, headers, body = self.request("GET", "/media.mp4", {"Range": value})
                self.assertEqual(status, 206)
                self.assertEqual(headers["Content-Range"], f"bytes {start}-{end}/{len(self.payload)}")
                self.assertEqual(int(headers["Content-Length"]), end-start+1)
                self.assertEqual(body, self.payload[start:end+1])

    def test_invalid_and_unsatisfiable_ranges_return_416(self):
        for value in ("bytes=1048576-", "bytes=20-10", "bytes=-0", "bytes=-", "bytes=0-1,3-4", "bytes=999999999999999999999999-"):
            with self.subTest(range=value):
                status, headers, body = self.request("GET", "/media.mp4", {"Range": value})
                self.assertEqual((status, body), (416, b""))
                self.assertEqual(headers["Content-Range"], f"bytes */{len(self.payload)}")
        self.assertEqual(self.request("GET", "/empty.mp4", {"Range": "bytes=0-"})[0], 416)
        self.assertEqual(self.request("GET", "/empty.mp4")[2], b"")

    def test_path_escape_and_alternate_stream_are_rejected(self):
        for target in ("/../private.txt", "/%2e%2e/private.txt", "/%2e%2e%5cprivate.txt",
                       "/media.mp4%3A%3A%24DATA", "/%00", "http://example.invalid/private.txt"):
            with self.subTest(target=target):
                status, _, body = self.request("GET", target)
                self.assertIn(status, (400, 403))
                self.assertNotIn(b"outside release root", body)

    def test_non_get_method_is_not_served_and_missing_file_is_404(self):
        status, headers, body = self.request("POST", "/media.mp4")
        self.assertEqual((status, body), (405, b""))
        self.assertEqual(headers["Allow"], "GET, HEAD")
        self.assertEqual(self.request("GET", "/not-there.mp4")[0], 404)

    def test_concurrent_and_backward_media_ranges_and_abort_recovery(self):
        paths = ["/media.mp4", "/voice.mp3"] * 8
        with ThreadPoolExecutor(max_workers=8) as pool:
            replies = list(pool.map(lambda path: self.request("GET", path, {"Range": "bytes=65530-131090"}), paths))
        for status, _, body in replies:
            self.assertEqual(status, 206)
            self.assertEqual(body, self.payload[65530:131091])
        for start in (800000, 1000, 600000, 0):
            status, _, body = self.request("GET", "/media.mp4", {"Range": f"bytes={start}-{start+511}"})
            self.assertEqual(status, 206)
            self.assertEqual(body, self.payload[start:start+512])
        with socket.create_connection(("127.0.0.1", self.port), timeout=3) as client:
            client.sendall(b"GET /media.mp4 HTTP/1.1\r\nHost: localhost\r\n\r\n")
            client.recv(100)
        self.assertEqual(self.request("GET", "/")[0], 200)


if __name__ == "__main__":
    for output in (sys.stdout, sys.stderr):
        if hasattr(output, "reconfigure"):
            output.reconfigure(encoding="utf-8", errors="backslashreplace")
    unittest.main(verbosity=2)
