#!/usr/bin/env python3
"""Stage (but do not publish) Yunxi Neural narration for sp4.

Example:
  .venv/bin/python lecture_factory/courses_web/sp4/make_audio_neural.py --pages 1,2

The output mirrors the course's audio/pageN.mp3 and pageN.times.json layout,
but lives in the repo's work/special-series/sp4/neural-stage by default. Existing course audio is never
changed. Sentence audio is cached by voice, volume, format, and exact text.
"""

import argparse
import hashlib
import json
import os
import re
import shutil
import subprocess
import sys
sys.dont_write_bytecode = True
from contextlib import contextmanager
import uuid
import time
import wave
from pathlib import Path

try:
    import imageio_ffmpeg
except ImportError:
    imageio_ffmpeg = None


COURSE = Path(__file__).resolve().parent
FACTORY = COURSE.parents[1]
DEFAULT_STAGE = COURSE.parents[2] / "work" / "special-series" / "sp4" / "neural-stage"
sys.dont_write_bytecode = True
sys.path.insert(0, str(FACTORY))
from build_web import split_sentences  # noqa: E402

@contextmanager
def kept_workdir(prefix, dir):
    path = Path(dir) / (prefix + uuid.uuid4().hex[:10])
    path.mkdir(parents=True, exist_ok=False)
    yield str(path)  # retain all intermediate files; no permanent deletion

VOICE = "zh-CN-YunxiNeural"
FORMAT = "audio-24khz-96kbitrate-mono-mp3"
SAMPLE_RATE = 24000
BITRATE = "96k"
GAP_NORMAL = 0.4
GAP_EMOT = 0.65
GAP_QUIZ = 1.40

# Measured sentence timing is recomputed after every pace change.
# Inquiry, difficult reasoning and the closing invitation use a calmer pace.
PAGE_TEMPO = {8:1.0,9:1.0,11:1.0,13:1.0,14:1.0,16:1.0,20:1.0,22:1.0}
PAGE_TEMPO.update({number:0.92 for number in range(17,22)})


def digest(value):
    payload = json.dumps(value, ensure_ascii=False, sort_keys=True,
                         separators=(",", ":")).encode("utf-8")
    return hashlib.sha256(payload).hexdigest()


def run(command, description, timeout=120):
    try:
        result = subprocess.run(command, capture_output=True, text=True,
                                encoding="utf-8", errors="replace", timeout=timeout)
    except subprocess.TimeoutExpired as exc:
        raise RuntimeError(f"{description}超时（{timeout} 秒）") from exc
    if result.returncode:
        detail = (result.stderr or result.stdout).strip()[-900:]
        raise RuntimeError(f"{description}失败：{detail}")
    return result


def ffmpeg_exe():
    if imageio_ffmpeg is not None:
        return imageio_ffmpeg.get_ffmpeg_exe()
    executable = shutil.which("ffmpeg")
    if not executable:
        raise RuntimeError("未找到 ffmpeg。请使用项目 .venv，或安装 ffmpeg。")
    return executable


def decode_to_wav(ffmpeg, source, target):
    run([ffmpeg, "-hide_banner", "-loglevel", "error", "-y", "-i",
         str(source), "-map", "0:a:0", "-ac", "1", "-ar", str(SAMPLE_RATE),
         "-c:a", "pcm_s16le", str(target)], f"解码 {source.name}")
    with wave.open(str(target), "rb") as audio:
        if (audio.getnchannels(), audio.getsampwidth(), audio.getframerate()) != (1, 2, SAMPLE_RATE):
            raise RuntimeError(f"句音频格式不正确：{source}")
        frames = audio.getnframes()
    if frames <= 0:
        raise RuntimeError(f"句音频为空：{source}")
    return frames


def decoded_duration(ffmpeg, source):
    result = run([ffmpeg, "-hide_banner", "-loglevel", "error", "-nostats",
                  "-i", str(source), "-map", "0:a:0", "-f", "null",
                  "-progress", "pipe:1", "-"], f"校验 {source.name}")
    matches = re.findall(r"^out_time_us=(\d+)$", result.stdout, flags=re.MULTILINE)
    if not matches or "progress=end" not in result.stdout:
        raise RuntimeError(f"无法读取解码后的时长：{source}")
    seconds = int(matches[-1]) / 1_000_000
    if seconds <= 0:
        raise RuntimeError(f"音频时长为零：{source}")
    return seconds


def synth_sentence(node, cli, ffmpeg, text, cache_path, volume, allow_network=True):
    if cache_path.is_file():
        return
    if not allow_network:
        raise RuntimeError(f"仅本地缓存模式：缺少句音频 {text[:30]}；未调用在线服务")
    cache_path.parent.mkdir(parents=True, exist_ok=True)
    last_error = None
    for attempt in range(3):
        with kept_workdir(prefix="tts-", dir=cache_path.parent) as tmp:
            candidate = Path(tmp) / "sentence.mp3"
            wav = Path(tmp) / "check.wav"
            try:
                run([node, str(cli), "--text", text, "--filepath", str(candidate),
                     "--voice", VOICE, "--lang", "zh-CN", "--outputFormat", FORMAT,
                     "--volume", volume, "--timeout", "60000"],
                    "在线语音合成", timeout=90)
                if not candidate.is_file() or candidate.stat().st_size < 1000:
                    raise RuntimeError("语音服务没有生成有效 MP3")
                decode_to_wav(ffmpeg, candidate, wav)
                candidate.replace(cache_path)
                return
            except RuntimeError as exc:
                last_error = exc
        if attempt < 2:
            time.sleep(5 * (attempt + 1))
    raise RuntimeError(f"同一句合成重试 3 次仍失败：{text[:30]}…\n{last_error}")


def parse_pages(value, available):
    if not value:
        return available
    chosen = set()
    for part in value.split(","):
        part = part.strip()
        match = re.fullmatch(r"(\d+)(?:-(\d+))?", part)
        if not match:
            raise ValueError(f"无效的页码：{part!r}；示例：1,3-5")
        start = int(match.group(1))
        end = int(match.group(2) or start)
        if end < start:
            raise ValueError(f"页码范围倒序：{part}")
        chosen.update(range(start, end + 1))
    unknown = chosen - set(available)
    if unknown:
        raise ValueError(f"课程没有这些页：{sorted(unknown)}")
    return [number for number in available if number in chosen]


def safe_stage(path):
    path = path.expanduser().resolve()
    owned_work = DEFAULT_STAGE.parent.resolve()
    if path == owned_work or owned_work not in path.parents:
        raise ValueError(f"配音暂存目录必须位于本课 work/special-series/sp4 内：{path}")
    return path


def make_page(page, output_dir, cache_dir, node, cli, ffmpeg, volume, tempo, allow_network=True):
    number = page["id"]
    sentences, _ = split_sentences(page["narration"])
    if not sentences:
        raise ValueError(f"page {number}: 讲稿为空")
    manifest = {"engine": "node-edge-tts", "voice": VOICE, "volume": volume,
                "format": FORMAT, "sample_rate": SAMPLE_RATE,
                "gaps": [GAP_NORMAL, GAP_EMOT], "tempo": tempo, "sentences": sentences}
    quiz_gaps = {}
    for quiz in page.get('interactions', []):
        question = quiz['after_sentence']
        if sentences.count(question) != 1:
            raise ValueError(f'page {number}: quiz sentence is not an exact unique match')
        index = sentences.index(question)
        if index + 1 >= len(sentences):
            raise ValueError(f'page {number}: quiz needs a subsequent spoken cue')
        quiz_gaps[index] = GAP_QUIZ
    if quiz_gaps:
        # Only these five page recipes change; all 185 sentence caches remain
        # keyed by the identical authorized text and voice settings.
        manifest['quiz_gaps'] = {str(index): gap for index, gap in quiz_gaps.items()}
    signature = digest(manifest)
    audio_path = output_dir / "audio" / f"page{number}.mp3"
    times_path = output_dir / f"page{number}.times.json"
    manifest_path = output_dir / f"page{number}.neural.json"
    if audio_path.is_file() and times_path.is_file() and manifest_path.is_file():
        existing = json.loads(manifest_path.read_text(encoding="utf-8"))
        if existing.get("sha256") == signature:
            print(f"page {number}: 分页缓存命中")
            return

    with kept_workdir(prefix=f"page{number}-", dir=output_dir) as tmp:
        temp = Path(tmp)
        wav_path = temp / "page.wav"
        times = []
        cursor = 0
        with wave.open(str(wav_path), "wb") as joined:
            joined.setnchannels(1)
            joined.setsampwidth(2)
            joined.setframerate(SAMPLE_RATE)
            for index, sentence in enumerate(sentences):
                key = digest({"engine": "node-edge-tts", "voice": VOICE,
                              "volume": volume, "format": FORMAT, "text": sentence})
                cache_path = cache_dir / f"{key}.mp3"
                synth_sentence(node, cli, ffmpeg, sentence, cache_path, volume, allow_network)
                sentence_wav = temp / f"sentence-{index:02d}.wav"
                frames = decode_to_wav(ffmpeg, cache_path, sentence_wav)
                if tempo != 1.0:
                    faster = temp / f"sentence-{index:02d}-tempo.wav"
                    run([ffmpeg, "-hide_banner", "-loglevel", "error", "-i", str(sentence_wav), "-af", f"atempo={tempo}", str(faster)], "语速微调")
                    sentence_wav = faster
                    with wave.open(str(sentence_wav), "rb") as adjusted:
                        frames = adjusted.getnframes()
                with wave.open(str(sentence_wav), "rb") as source:
                    while True:
                        chunk = source.readframes(8192)
                        if not chunk:
                            break
                        joined.writeframesraw(chunk)
                times.append({"start": round(cursor / SAMPLE_RATE, 3),
                              "end": round((cursor + frames) / SAMPLE_RATE, 3),
                              "text": sentence})
                cursor += frames
                gap = GAP_EMOT if sentence.endswith(("？", "！", "?", "!")) else GAP_NORMAL
                gap = quiz_gaps.get(index, gap)
                silence_frames = round(gap * SAMPLE_RATE)
                joined.writeframesraw(b"\x00\x00" * silence_frames)
                cursor += silence_frames

        pending_audio = temp / "page.mp3"
        run([ffmpeg, "-hide_banner", "-loglevel", "error", "-y", "-i",
             str(wav_path), "-ac", "1", "-ar", str(SAMPLE_RATE),
             "-c:a", "libmp3lame", "-b:a", BITRATE, str(pending_audio)],
            f"page {number} 编码", timeout=120)
        actual = decoded_duration(ffmpeg, pending_audio)
        expected = cursor / SAMPLE_RATE
        if abs(actual - expected) > 0.08:
            raise RuntimeError(f"page {number}: 编码后时长 {actual:.3f}s 与时间轴 {expected:.3f}s 不符")
        pending_times = temp / "times.json"
        pending_times.write_text(json.dumps(times, ensure_ascii=False, indent=1) + "\n",
                                 encoding="utf-8")
        pending_manifest = temp / "manifest.json"
        pending_manifest.write_text(json.dumps({"sha256": signature, **manifest},
                                               ensure_ascii=False, indent=1) + "\n",
                                    encoding="utf-8")
        audio_path.parent.mkdir(parents=True, exist_ok=True)
        os.replace(pending_audio, audio_path)
        os.replace(pending_times, times_path)
        os.replace(pending_manifest, manifest_path)
        print(f"page {number}: {len(sentences)} 句，{actual:.1f} 秒 → {audio_path}")


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--pages", help="只生成指定页，例如 1,3-5；默认全部")
    parser.add_argument("--cache-only", action="store_true", help="只使用已有句音频，缺失立即失败，禁止访问在线语音服务")
    parser.add_argument("--output-dir", type=Path, default=DEFAULT_STAGE,
                        help="试听暂存目录；默认 work/special-series/sp4/neural-stage")
    parser.add_argument("--volume", default="+30%",
                        help="Edge TTS 音量，默认 +30%%（如 +20%%、default）")
    parser.add_argument("--tempo", type=float, default=None, help="覆盖分段语速；普通讲解1.04、公式推导与概念边界1.00、测量与工程应用0.92；时间轴按最终PCM实测")
    args = parser.parse_args()
    if args.tempo is not None and not 0.9 <= args.tempo <= 1.12:
        parser.error("--tempo 仅接受0.9至1.12，防止课堂语速过快")
    if not re.fullmatch(r"(?:default|[+-]?\d{1,3}%)", args.volume):
        parser.error("--volume 必须是 default 或百分比，例如 +30%")
    try:
        output_dir = safe_stage(args.output_dir)
        document = json.loads((COURSE / "slides.json").read_text(encoding="utf-8"))
        pages = {page["id"]: page for page in document["pages"]}
        selected = parse_pages(args.pages, list(pages))
        node = shutil.which("node")
        cli = COURSE.parents[2] / "interactive-lecture" / "node_modules" / "node-edge-tts" / "bin.js"
        if not node or not cli.is_file():
            raise RuntimeError("需要 Node.js 和 interactive-lecture/node_modules/node-edge-tts；先在 interactive-lecture 运行 npm install。")
        ffmpeg = ffmpeg_exe()
        output_dir.mkdir(parents=True, exist_ok=True)
        cache_dir = output_dir / "sentence-cache"
        for number in selected:
            tempo = args.tempo if args.tempo is not None else PAGE_TEMPO.get(number, 1.04)
            make_page(pages[number], output_dir, cache_dir, node, cli, ffmpeg, args.volume, tempo, not args.cache_only)
        print(f"试听文件暂存于 {output_dir}；未修改课程原配音或发布目录。")
    except (ValueError, RuntimeError, OSError) as exc:
        parser.exit(1, f"错误：{exc}\n")


if __name__ == "__main__":
    main()
