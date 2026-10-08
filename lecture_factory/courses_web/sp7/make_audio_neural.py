#!/usr/bin/env python3
"""Stage (but do not publish) Yunxi Neural narration for sp7.

Example:
  .venv/bin/python lecture_factory/courses_web/sp7/make_audio_neural.py --pages 1,2
  .venv/bin/python -B lecture_factory/courses_web/sp7/make_audio_neural.py --pages 3,6,14,21 --tempo 0.9 --offline-cache-only

The output mirrors the course's audio/pageN.mp3 and pageN.times.json layout,
but lives in the repo's work/special-series/sp7/neural-stage by default. Existing course audio is never
changed. Sentence audio is cached by voice, volume, format, and exact text.
Offline mode requires every locked raw sentence cache before any output writes.
Quiz after_sentence silence is local PCM, signed in the page's gaps recipe.
"""

import sys
sys.dont_write_bytecode = True
import argparse
import hashlib
import json
import math
import os
import re
import shutil
import subprocess
import sys
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
DEFAULT_STAGE = COURSE.parents[2] / "work" / "special-series" / "sp7" / "neural-stage"
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

# Measured sentence timing is recomputed after every pace change.
# Inquiry, difficult reasoning and the closing invitation use a calmer pace.
PAGE_TEMPO = {}

ROOT = COURSE.parents[2]
REQUEST = ROOT / 'work/special-series/integration/speech-request.json'
EXPECTED_PAYLOAD_SHA256 = '95cf3ea4fa2dd55d6e57db6c8a0a33931a0a3b9360c8effbe9e28e37fdc25ffd'
SETTINGS_KEYS = ('engine', 'voice', 'volume', 'format', 'sample_rate', 'gaps', 'tempo', 'sentences')


def file_digest(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()


def verify_authorized_text():
    """Validate exact sp7 sentences without exporting any other document data."""
    request = json.loads(REQUEST.read_text(encoding='utf-8'))
    if request.get('receiver') != 'speech.platform.bing.com' or not request.get('direct_human_authorization_received'):
        raise RuntimeError('sp7 narration export requires the existing specific human authorization')
    entry = next(x for x in request['courses'] if x['course'] == 'sp7')
    payload_path = Path(entry['speech_text_path'])
    if entry['speech_text_sha256'] != EXPECTED_PAYLOAD_SHA256 or file_digest(payload_path) != EXPECTED_PAYLOAD_SHA256:
        raise RuntimeError('Locked sp7 speech payload changed; do not silently expand the approved text')
    doc = json.loads((COURSE / 'slides.json').read_text(encoding='utf-8'))
    actual = [{'page': p['id'], 'heading': p['heading'], 'sentences': split_sentences(p['narration'])[0]}
              for p in doc['pages']]
    if actual != json.loads(payload_path.read_text(encoding='utf-8')):
        raise RuntimeError('Current narration differs from the exact authorized sp7 payload')
    return doc


def verify_page_cache(audio_path, times_path, manifest_path, settings, ffmpeg, upgrade_legacy=False):
    manifest = json.loads(manifest_path.read_text(encoding='utf-8'))
    if manifest.get('sha256') != digest(settings) or {k: manifest.get(k) for k in SETTINGS_KEYS} != settings:
        raise RuntimeError('Page cache settings or narration signature mismatch')
    times = json.loads(times_path.read_text(encoding='utf-8'))
    if [s.get('text') for s in times] != settings['sentences']:
        raise RuntimeError('Page cache sentence order mismatch')
    previous_end = 0.0
    for segment in times:
        start, end = segment['start'], segment['end']
        if not all(isinstance(v, (int, float)) and math.isfinite(v) for v in (start, end)):
            raise RuntimeError('Nonfinite sentence time')
        if start < previous_end - .002 or end <= start:
            raise RuntimeError('Overlapping, negative or reversed sentence timing')
        previous_end = end
    actual = decoded_duration(ffmpeg, audio_path)
    if not times or previous_end > actual + .08:
        raise RuntimeError('Page cache duration does not cover all sentences')
    integrity = {'audio_sha256': file_digest(audio_path), 'times_sha256': file_digest(times_path),
                 'decoded_duration_seconds': actual}
    if 'audio_sha256' not in manifest or 'times_sha256' not in manifest:
        if not upgrade_legacy:
            raise RuntimeError('Page cache lacks file integrity hashes')
        saved = manifest_path.parent / 'replaced' / ('integrity-upgrade-' + str(time.time_ns()))
        saved.mkdir(parents=True, exist_ok=False)
        shutil.copy2(manifest_path, saved / manifest_path.name)
        manifest.update(integrity)
        manifest_path.write_text(json.dumps(manifest, ensure_ascii=False, indent=1) + '\n', encoding='utf-8')
    elif any(manifest.get(k) != v for k, v in integrity.items() if k.endswith('_sha256')):
        raise RuntimeError('Page cache audio or timing file checksum mismatch')
    elif abs(manifest.get('decoded_duration_seconds', -1) - actual) > .08:
        raise RuntimeError('Page cache decoded duration mismatch')
    return actual



def digest(value):
    payload = json.dumps(value, ensure_ascii=False, sort_keys=True,
                         separators=(",", ":")).encode("utf-8")
    return hashlib.sha256(payload).hexdigest()


def sentence_cache_path(cache_dir, sentence, volume):
    key = digest({"engine": "node-edge-tts", "voice": VOICE,
                  "volume": volume, "format": FORMAT, "text": sentence})
    return Path(cache_dir) / f"{key}.mp3"


def page_gaps(page):
    """Sign local quiz silence separately from unchanged cached speech bytes."""
    sentences, _ = split_sentences(page["narration"])
    overrides = {}
    for interaction in page.get("interactions", []):
        after = interaction.get("after_sentence")
        if after is None:
            continue
        if not isinstance(after, str) or sentences.count(after) != 1:
            raise ValueError(f"page {page['id']}: after_sentence must uniquely match a complete sentence")
        if after in overrides:
            raise ValueError(f"page {page['id']}: duplicate quiz sentence boundary")
        offset = interaction.get("pause_offset", 0.1)
        if (type(offset) not in (int, float) or not math.isfinite(offset)
                or offset <= 0 or 1.5 - offset < 1.2):
            raise ValueError(f"page {page['id']}: quiz pause must leave at least 1.2s before next speech")
        overrides[after] = 1.5
    if not overrides:
        return [GAP_NORMAL, GAP_EMOT]
    return {"normal": GAP_NORMAL, "emot": GAP_EMOT, "after_sentence": overrides}


def sentence_gap(sentence, gaps):
    if isinstance(gaps, dict):
        return gaps["after_sentence"].get(
            sentence, gaps["emot"] if sentence.endswith(("？", "！", "?", "!")) else gaps["normal"])
    return gaps[1] if sentence.endswith(("？", "！", "?", "!")) else gaps[0]


def require_offline_cache(pages, cache_dir, volume):
    """Fail before any output write if even one locked raw sentence is absent."""
    expected = {}
    for page in pages:
        page_gaps(page)
        for sentence in split_sentences(page["narration"])[0]:
            path = sentence_cache_path(cache_dir, sentence, volume)
            expected[path] = sentence
    missing = [str(path) for path in expected if not path.is_file() or path.stat().st_size < 1000]
    if missing:
        raise RuntimeError(f"Offline cache-only mode: {len(missing)} missing/invalid raw sentence cache(s); no TTS permitted: {missing[0]}")
    return len(expected)


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


def synth_sentence(node, cli, ffmpeg, text, cache_path, volume):
    verify_authorized_text()
    if cache_path.is_file():
        return
    cache_path.parent.mkdir(parents=True, exist_ok=True)
    last_error = None
    for attempt in range(3):
        with kept_workdir(prefix="tts-", dir=cache_path.parent) as tmp:
            candidate = Path(tmp) / "sentence.mp3"
            wav = Path(tmp) / "check.wav"
            try:
                verify_authorized_text()
                run([node, str(cli), "--text", text, "--filepath", str(candidate),
                     "--voice", VOICE, "--lang", "zh-CN", "--outputFormat", FORMAT,
                     "--volume", volume, "--timeout", "60000"],
                    "在线语音合成", timeout=90)
                if not candidate.is_file() or candidate.stat().st_size < 1000:
                    raise RuntimeError("语音服务没有生成有效 MP3")
                decode_to_wav(ffmpeg, candidate, wav)
                shutil.copy2(candidate, cache_path)
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
    owned_work = (ROOT / 'work/special-series/sp7').resolve()
    if path != owned_work and owned_work not in path.parents:
        raise ValueError(f'配音暂存只能写入本课私有work目录：{path}')
    protected = [COURSE, COURSE / "audio",
                 COURSE.parents[2] / "interactive-lecture" / "public",
                 COURSE.parents[2] / "interactive-lecture" / "dist"]
    for root in protected:
        root = root.resolve()
        if path == root or (root != COURSE and root in path.parents):
            raise ValueError(f"输出目录不能覆盖当前课程配音或发布产物：{path}")
    return path


def make_page(page, output_dir, cache_dir, node, cli, ffmpeg, volume, tempo, offline_cache_only=False):
    number = page["id"]
    sentences, _ = split_sentences(page["narration"])
    if not sentences:
        raise ValueError(f"page {number}: 讲稿为空")
    manifest = {"engine": "node-edge-tts", "voice": VOICE, "volume": volume,
                "format": FORMAT, "sample_rate": SAMPLE_RATE,
                "gaps": page_gaps(page), "tempo": tempo, "sentences": sentences}
    signature = digest(manifest)
    audio_path = output_dir / "audio" / f"page{number}.mp3"
    times_path = output_dir / f"page{number}.times.json"
    manifest_path = output_dir / f"page{number}.neural.json"
    if audio_path.is_file() and times_path.is_file() and manifest_path.is_file():
        existing = json.loads(manifest_path.read_text(encoding="utf-8"))
        if existing.get("sha256") == signature:
            actual = verify_page_cache(audio_path, times_path, manifest_path, manifest, ffmpeg)
            print(f"page {number}: 分页缓存命中且文件/解码/时间轴校验通过，{actual:.1f} 秒", flush=True)
            return

    if any(p.exists() for p in (audio_path, times_path, manifest_path)):
        saved = output_dir / "replaced" / (str(number) + "-" + str(time.time_ns()))
        saved.mkdir(parents=True, exist_ok=False)
        for p in (audio_path, times_path, manifest_path):
            if p.exists(): shutil.copy2(p, saved / p.name)

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
                cache_path = sentence_cache_path(cache_dir, sentence, volume)
                if offline_cache_only:
                    if not cache_path.is_file() or cache_path.stat().st_size < 1000:
                        raise RuntimeError(f"Offline cache disappeared: {cache_path}; no TTS permitted")
                else:
                    synth_sentence(node, cli, ffmpeg, sentence, cache_path, volume)
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
                gap = sentence_gap(sentence, manifest["gaps"])
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
        pending_manifest.write_text(json.dumps({"sha256": signature, "recipe_sha256": signature, **manifest,
                                               "audio_sha256": file_digest(pending_audio),
                                               "times_sha256": file_digest(pending_times),
                                               "decoded_duration_seconds": actual},
                                               ensure_ascii=False, indent=1) + "\n",
                                    encoding="utf-8")
        audio_path.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(pending_audio, audio_path)
        shutil.copy2(pending_times, times_path)
        shutil.copy2(pending_manifest, manifest_path)
        verify_page_cache(audio_path, times_path, manifest_path, manifest, ffmpeg)
        print(f"page {number}: {len(sentences)} 句，{actual:.1f} 秒 → {audio_path}", flush=True)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--pages", help="只生成指定页，例如 1,3-5；默认全部")
    parser.add_argument("--output-dir", type=Path, default=DEFAULT_STAGE,
                        help="试听暂存目录；默认 work/special-series/sp7/neural-stage")
    parser.add_argument("--volume", default="+30%",
                        help="Edge TTS 音量，默认 +30%%（如 +20%%、default）")
    parser.add_argument("--tempo", type=float, default=None, help="覆盖分段语速；默认1.0，按最终实际时长校准；时间轴按最终PCM实测")
    parser.add_argument('--preflight-only', action='store_true', help='Check exact authorized payload and local requirements; never call TTS')
    parser.add_argument('--offline-cache-only', '--offline', dest='offline_cache_only', action='store_true',
                        help='Require all locked raw sentence caches before writes; never invoke TTS or network')
    args = parser.parse_args()
    if args.tempo is not None and not 0.9 <= args.tempo <= 1.12:
        parser.error("--tempo 仅接受0.9至1.12，防止课堂语速过快")
    if not re.fullmatch(r"(?:default|[+-]?\d{1,3}%)", args.volume):
        parser.error("--volume 必须是 default 或百分比，例如 +30%")
    try:
        output_dir = safe_stage(args.output_dir)
        document = verify_authorized_text()
        pages = {page["id"]: page for page in document["pages"]}
        selected = parse_pages(args.pages, list(pages))
        cache_dir = output_dir / "sentence-cache"
        cached_count = require_offline_cache(pages.values(), cache_dir, args.volume) if args.offline_cache_only else None
        if args.preflight_only:
            print(f'sp7 authorized payload verified: {len(pages)} pages, {sum(len(split_sentences(p["narration"])[0]) for p in pages.values())} sentences; offline cached={cached_count}; no TTS call')
            return
        node = None if args.offline_cache_only else shutil.which("node")
        cli = COURSE.parents[2] / "interactive-lecture" / "node_modules" / "node-edge-tts" / "bin.js"
        if not args.offline_cache_only and (not node or not cli.is_file()):
            raise RuntimeError("需要 Node.js 和 interactive-lecture/node_modules/node-edge-tts；先在 interactive-lecture 运行 npm install。")
        ffmpeg = ffmpeg_exe()
        output_dir.mkdir(parents=True, exist_ok=True)
        for number in selected:
            tempo = args.tempo if args.tempo is not None else PAGE_TEMPO.get(number, 1.0)
            make_page(pages[number], output_dir, cache_dir, node, cli, ffmpeg, args.volume, tempo,
                      offline_cache_only=args.offline_cache_only)
        print(f"试听文件暂存于 {output_dir}；未修改课程原配音或发布目录。")
    except (ValueError, RuntimeError, OSError) as exc:
        parser.exit(1, f"错误：{exc}\n")


if __name__ == "__main__":
    main()
