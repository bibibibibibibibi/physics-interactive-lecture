# -*- coding: utf-8 -*-
"""IndexTTS-2.5 本地逐句配音；模型只加载一次，输出与 Edge 缓存兼容的 MP3。"""
import os
from pathlib import Path
import re
import subprocess
import sys

import gen_audio

ROOT = Path(__file__).resolve().parents[1]
DURATION_FACTOR = float(os.environ.get("INDEX_TTS_DURATION", "1.2"))
INTERVAL_SILENCE = int(os.environ.get("INDEX_TTS_INTERVAL_SILENCE", "300"))
MAX_SEG_TOKENS = int(os.environ.get("INDEX_TTS_MAX_SEG_TOKENS", "60"))
EMO_TEXT = os.environ.get("INDEX_TTS_EMO_TEXT", "平静、耐心、从容地讲解")
_ENGINE = None


def index_root():
    configured = os.environ.get("INDEX_TTS_ROOT", "").strip()
    return Path(configured).resolve() if configured else ROOT / "tools" / "index-tts"


def prompt_path(voice):
    prompt = Path(voice or "voice_03.wav")
    if not prompt.is_absolute():
        prompt = index_root() / "examples" / prompt
    prompt = prompt.resolve()
    if not prompt.is_file():
        raise RuntimeError(f"IndexTTS 参考音频不存在：{prompt}")
    return prompt


def get_engine():
    global _ENGINE
    if _ENGINE is not None:
        return _ENGINE
    if not 0.5 <= DURATION_FACTOR <= 2.0:
        raise RuntimeError("INDEX_TTS_DURATION 必须在 0.5 到 2.0 之间")
    if INTERVAL_SILENCE < 0 or MAX_SEG_TOKENS < 1:
        raise RuntimeError("IndexTTS 分段停顿不能为负，分段 Token 必须为正数")
    root = index_root()
    required = [root / "checkpoints" / name for name in ("config.yaml", "gpt.pth", "codec.pth", "s2mel.pth")]
    missing = [str(path) for path in required if not path.is_file()]
    if missing:
        raise RuntimeError(f"IndexTTS 模型文件不完整：{missing}")
    os.environ.setdefault("USE_MODELSCOPE", "true")
    os.environ.setdefault("HF_HUB_OFFLINE", "1")
    os.environ.setdefault("TRANSFORMERS_OFFLINE", "1")
    sys.path.insert(0, str(root))
    from indextts.infer_v2_5 import IndexTTS2

    _ENGINE = IndexTTS2(
        cfg_path=str(root / "checkpoints" / "config.yaml"),
        model_dir=str(root / "checkpoints"),
        use_bf16=True,
        use_qwen_emo=bool(EMO_TEXT),
    )
    return _ENGINE


def audio_rms(path):
    """Decode before acceptance; a nonzero WAV duration does not prove audible speech."""
    import audioop
    pcm = subprocess.run(
        [gen_audio.FF, "-v", "error", "-i", str(path), "-ac", "1", "-ar", "22050",
         "-f", "s16le", "pipe:1"],
        capture_output=True, check=True,
    ).stdout
    return audioop.rms(pcm, 2) if pcm else 0


def tts(text, voice, out):
    output = Path(out)
    if output.exists():
        return
    if not text.strip() or re.search(r"\[\[\d+\]\]", text):
        raise ValueError("IndexTTS 输入必须为非空且已去除技术锚点的完整讲稿句")
    output.parent.mkdir(parents=True, exist_ok=True)
    prompt = prompt_path(voice)
    wav = output.with_name(output.stem + f".{os.getpid()}.wav")
    partial = output.with_name(output.stem + f".{os.getpid()}.partial.mp3")
    options = {}
    if EMO_TEXT:
        options = {"use_emo_text": True, "emo_text": EMO_TEXT, "emo_alpha": 0.6}
    try:
        for attempt in range(1, 4):
            try:
                get_engine().infer(
                    spk_audio_prompt=str(prompt),
                    text=text,
                    lang="ZH",
                    output_path=str(wav),
                    duration_factor=DURATION_FACTOR,
                    interval_silence=INTERVAL_SILENCE,
                    max_text_tokens_per_segment=MAX_SEG_TOKENS,
                    verbose=False,
                    **options,
                )
                if not wav.is_file() or wav.stat().st_size == 0:
                    raise RuntimeError("IndexTTS 未生成有效 WAV")
                subprocess.run(
                    [gen_audio.FF, "-v", "error", "-y", "-i", str(wav), "-ar", "24000", "-ac", "1",
                     "-c:a", "libmp3lame", "-b:a", "96k", str(partial)],
                    check=True,
                )
                if not partial.is_file() or partial.stat().st_size == 0:
                    raise RuntimeError("IndexTTS MP3 转码失败")
                rms = audio_rms(partial)
                if rms < 40:
                    raise RuntimeError(f"IndexTTS 返回静音或异常弱语音（RMS={rms}）")
                os.replace(partial, output)
                print(f"[IndexTTS] {len(text)} 字，RMS={rms} -> {output.name}", flush=True)
                return
            except Exception as error:
                wav.unlink(missing_ok=True)
                partial.unlink(missing_ok=True)
                if attempt == 3:
                    raise RuntimeError(f"IndexTTS 三次生成均未通过：{text[:60]}") from error
                print(f"[IndexTTS] 第 {attempt} 次未通过，重试：{error}", flush=True)
    finally:
        wav.unlink(missing_ok=True)
        partial.unlink(missing_ok=True)
