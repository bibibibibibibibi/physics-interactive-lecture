"""Targeted launcher tests; no server ports or browser windows are opened."""

import errno
import importlib.util
from pathlib import Path
import unittest
from unittest.mock import patch

LAUNCHER = Path(__file__).resolve().parents[2] / "lecture_factory/assets/launcher/serve-mac.py"
SPEC = importlib.util.spec_from_file_location("lecture_launcher", LAUNCHER)
launcher = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(launcher)


class LauncherTests(unittest.TestCase):
    def test_busy_port_falls_back_on_loopback_only(self):
        ready_server = object()
        directory = Path("课堂 带空格目录")
        with patch.object(launcher, "ThreadingHTTPServer", side_effect=[OSError(errno.EADDRINUSE, "busy"), ready_server]) as factory:
            self.assertIs(launcher.create_server(directory, 8080, 8081), ready_server)
        self.assertEqual([call.args[0] for call in factory.call_args_list], [("127.0.0.1", 8080), ("127.0.0.1", 8081)])
        self.assertEqual(factory.call_args.args[1].keywords["directory"], str(directory))

    def test_reports_exhausted_range(self):
        with patch.object(launcher, "ThreadingHTTPServer", side_effect=OSError(errno.EADDRINUSE, "busy")) as factory:
            with self.assertRaisesRegex(OSError, "8080–8081"):
                launcher.create_server(Path.cwd(), 8080, 8081)
        self.assertEqual(factory.call_count, 2)

    def test_permission_failure_does_not_misreport_busy_ports(self):
        with patch.object(launcher, "ThreadingHTTPServer", side_effect=PermissionError(errno.EACCES, "denied")) as factory:
            with self.assertRaises(PermissionError):
                launcher.create_server(Path.cwd())
        factory.assert_called_once()


if __name__ == "__main__":
    unittest.main()
