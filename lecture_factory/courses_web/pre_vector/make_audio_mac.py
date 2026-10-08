#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""为本课生成可被 build_web.py 直接复用的 macOS 离线配音缓存。

用法：python make_audio_mac.py [课程目录]
默认读取本脚本所在目录的 slides.json。完整缓存（pageN.mp3 与
pageN.times.json 都存在）会原样保留。先运行本脚本，再运行 build_web.py。
"""

import json
import re
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

import imageio_ffmpeg


FACTORY = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(FACTORY))
from build_web import split_sentences  # noqa: E402: 与网页构建器使用同一断句规则


VOICE = "Tingting"
SAMPLE_RATE = 24000
BITRATE = "64k"
GAP_NORMAL = 0.4
GAP_EMOT = 0.65
FF = imageio_ffmpeg.get_ffmpeg_exe()


def run(command, description, cwd=None):
    result = subprocess.run(command, cwd=cwd, capture_output=True, text=True,
                            encoding="utf-8", errors="replace")
    if result.returncode:
        detail = (result.stderr or result.stdout).strip()[-900:]
        raise RuntimeError(f"{description}失败：{detail}")


def duration(path):
    result = subprocess.run([FF, "-hide_banner", "-i", str(path)],
                            capture_output=True, text=True, encoding="utf-8",
                            errors="replace")
    match = re.search(r"Duration: (\d+):(\d+):([\d.]+)", result.stderr)
    if not match:
        raise RuntimeError(f"无法读取音频时长：{path}\n{result.stderr[-600:]}")
    hours, minutes, seconds = match.groups()
    value = int(hours) * 3600 + int(minutes) * 60 + float(seconds)
    if value <= 0:
        raise RuntimeError(f"音频时长为零：{path}")
    return value


def encode(source, target):
    run([FF, "-hide_banner", "-loglevel", "error", "-y", "-i", str(source),
         "-vn", "-ac", "1", "-ar", str(SAMPLE_RATE), "-c:a", "libmp3lame",
         "-b:a", BITRATE, str(target)], "MP3 编码")


def make_silence(path, seconds):
    run([FF, "-hide_banner", "-loglevel", "error", "-y", "-f", "lavfi",
         "-i", f"anullsrc=r={SAMPLE_RATE}:cl=mono", "-t", str(seconds),
         "-c:a", "libmp3lame", "-b:a", BITRATE, str(path)], "生成句间静音")


def make_page(course, page, say):
    number = page["id"]
    audio_dir = course / "audio"
    output = audio_dir / f"page{number}.mp3"
    sidecar = course / f"page{number}.times.json"
    if output.is_file() and sidecar.is_file():
        print(f"page {number}: 已有配音和时间轴，跳过")
        return

    sentences, _ = split_sentences(page["narration"])
    if not sentences:
        raise ValueError(f"page {number}: 讲稿为空，无法配音")

    audio_dir.mkdir(parents=True, exist_ok=True)
    with tempfile.TemporaryDirectory(prefix=f"page{number}-", dir=audio_dir) as work:
        work = Path(work)
        pauses = {GAP_NORMAL: work / "pause-normal.mp3",
                  GAP_EMOT: work / "pause-emot.mp3"}
        for seconds, path in pauses.items():
            make_silence(path, seconds)
        pause_durations = {seconds: duration(path) for seconds, path in pauses.items()}

        parts, times = [], []
        cursor = 0.0
        for index, sentence in enumerate(sentences):
            source_text = work / f"sentence-{index:02d}.txt"
            aiff = work / f"sentence-{index:02d}.aiff"
            mp3 = work / f"sentence-{index:02d}.mp3"
            source_text.write_text(sentence, encoding="utf-8")
            run([say, "-v", VOICE, "-f", str(source_text), "-o", str(aiff)],
                f"page {number} 第 {index + 1} 句语音合成")
            duration(aiff)  # say 在受限环境中可能成功退出但只写出空音频头。
            encode(aiff, mp3)
            spoken = duration(mp3)
            times.append({"start": round(cursor, 3),
                          "end": round(cursor + spoken, 3),
                          "text": sentence})
            parts.append(mp3)
            gap = GAP_EMOT if sentence.endswith(("？", "！", "?", "!")) else GAP_NORMAL
            parts.append(pauses[gap])
            cursor += spoken + pause_durations[gap]

        # 用相对于 work 的文件名，避开中文或空格路径在 concat 列表中的转义问题。
        listing = work / "concat.txt"
        listing.write_text("\n".join(f"file '{part.name}'" for part in parts) + "\n",
                           encoding="utf-8")
        pending_audio = work / "page.mp3"
        run([FF, "-hide_banner", "-loglevel", "error", "-y", "-f", "concat",
             "-safe", "0", "-i", str(listing), "-c", "copy", str(pending_audio)],
            f"page {number} 句音频拼接", cwd=work)
        run([FF, "-hide_banner", "-loglevel", "error", "-i", str(pending_audio),
             "-f", "null", "-"], f"page {number} MP3 解码校验")
        if duration(pending_audio) < times[-1]["end"]:
            raise RuntimeError(f"page {number}: 配音短于最后一句字幕")

        pending_times = work / "times.json"
        pending_times.write_text(json.dumps(times, ensure_ascii=False, indent=1) + "\n",
                                 encoding="utf-8")
        # 临时文件全部成功后才公开缓存；已有完整缓存始终不覆盖。
        if output.is_file() and sidecar.is_file():
            print(f"page {number}: 其他进程已完成配音，跳过")
            return
        pending_audio.replace(output)
        pending_times.replace(sidecar)
        print(f"page {number}: {len(sentences)} 句，{duration(output):.1f} 秒")


def main():
    if sys.platform != "darwin":
        raise SystemExit("此脚本使用 macOS 的 say 命令，请在 Mac 上运行。")
    course = Path(sys.argv[1]).resolve() if len(sys.argv) > 1 else Path(__file__).resolve().parent
    if len(sys.argv) > 2:
        raise SystemExit("用法：python make_audio_mac.py [课程目录]")
    document = json.loads((course / "slides.json").read_text(encoding="utf-8"))
    needs_voice = any(not ((course / "audio" / f"page{page['id']}.mp3").is_file()
                           and (course / f"page{page['id']}.times.json").is_file())
                      for page in document["pages"])
    say = None
    if needs_voice:
        say = shutil.which("say")
        if not say:
            raise SystemExit("未找到 macOS say 命令。")
        voices = subprocess.run([say, "-v", "?"], capture_output=True, text=True,
                                encoding="utf-8", errors="replace", check=True).stdout
        if not any(line.split()[0] == VOICE for line in voices.splitlines() if line.strip()):
            raise SystemExit("macOS 未安装中文语音 Tingting；请先在系统设置中下载此语音。")
    for page in document["pages"]:
        make_page(course, page, say)


if __name__ == "__main__":
    main()
