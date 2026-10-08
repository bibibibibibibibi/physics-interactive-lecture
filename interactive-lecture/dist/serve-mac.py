#!/usr/bin/env python3
"""Mac launcher backend: a local static server, using only the Python standard library."""

import argparse
import errno
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
import threading
import webbrowser


class RangeRequestHandler(SimpleHTTPRequestHandler):
    """Serve one byte range so browsers can seek MP3 and MP4 files."""
    def end_headers(self):
        self.send_header("Accept-Ranges", "bytes")
        super().end_headers()

    def send_head(self):
        self.byte_range = None
        header = self.headers.get("Range")
        filename = Path(self.translate_path(self.path))
        if not header or not filename.is_file():
            return super().send_head()
        import re
        match = re.fullmatch(r"bytes=(\d*)-(\d*)", header.strip())
        stream = filename.open("rb")
        import os
        size = os.fstat(stream.fileno()).st_size
        try:
            if not match or not any(match.groups()) or size == 0:
                raise ValueError()
            left, right = match.groups()
            if left:
                start = int(left)
                end = min(int(right), size - 1) if right else size - 1
            else:
                suffix = int(right)
                if suffix <= 0:
                    raise ValueError()
                start, end = max(0, size - suffix), size - 1
            if start >= size or start > end:
                raise ValueError()
        except ValueError:
            stream.close()
            self.send_response(416)
            self.send_header("Content-Range", f"bytes */{size}")
            self.send_header("Content-Length", "0")
            self.end_headers()
            return None
        stream.seek(start)
        self.byte_range = (start, end)
        self.send_response(206)
        self.send_header("Content-Type", self.guess_type(str(filename)))
        self.send_header("Content-Range", f"bytes {start}-{end}/{size}")
        self.send_header("Content-Length", str(end - start + 1))
        self.end_headers()
        return stream

    def copyfile(self, source, outputfile):
        if self.byte_range is None:
            return super().copyfile(source, outputfile)
        remaining = self.byte_range[1] - self.byte_range[0] + 1
        while remaining > 0:
            data = source.read(min(65536, remaining))
            if not data:
                break
            outputfile.write(data)
            remaining -= len(data)


def create_server(directory, first_port=8080, last_port=8090):
    handler = partial(RangeRequestHandler, directory=str(directory))
    for port in range(first_port, last_port + 1):
        try:
            return ThreadingHTTPServer(("127.0.0.1", port), handler)
        except OSError as error:
            if error.errno != errno.EADDRINUSE:
                raise
    raise OSError(errno.EADDRINUSE, "端口 {}–{} 均被占用，请关闭占用程序后重试".format(first_port, last_port))


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--directory", type=Path, default=Path(__file__).resolve().parent)
    parser.add_argument("--port", type=int, default=8080)
    parser.add_argument("--last-port", type=int)
    parser.add_argument("--no-browser", action="store_true")
    args = parser.parse_args()
    last_port = args.last_port if args.last_port is not None else min(args.port + 10, 65535)
    if not 0 <= args.port <= last_port <= 65535:
        parser.error("端口范围必须满足 0 <= port <= last-port <= 65535")
    directory = args.directory.resolve()
    if not (directory / "index.html").is_file():
        print("未找到 index.html，请从完整的 dist 发布目录运行启动器。", flush=True)
        return 1
    try:
        server = create_server(directory, args.port, last_port)
    except OSError as error:
        print("无法启动本地服务：{}".format(error), flush=True)
        return 1

    with server:
        url = "http://127.0.0.1:{}/".format(server.server_port)
        print("服务已启动：{}".format(url), flush=True)
        print("关闭本窗口或按 Ctrl+C 停止服务。", flush=True)
        # Only open the browser once the listening socket has bound successfully.
        if not args.no_browser:
            threading.Thread(target=webbrowser.open, args=(url,), daemon=True).start()
        try:
            server.serve_forever()
        except KeyboardInterrupt:
            print("\n服务已停止。", flush=True)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
