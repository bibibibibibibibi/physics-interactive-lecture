#!/usr/bin/env python3
"""Prepare one MiniMax Speech 2.8 HD sample; use --generate to make a paid request.

This tool writes only a standalone sample, never course audio or its timeline.
It uses the Python standard library and never retries a synthesis request.
"""

import argparse
from datetime import datetime, timezone
import hashlib
import json
import os
from pathlib import Path
import re
import sys
import tempfile
import urllib.error
import urllib.request


ROOT = Path(__file__).resolve().parent.parent
DEFAULT_REQUEST = ROOT / "lecture_factory" / "samples" / "minimax_pre_vector_p11.json"
DEFAULT_OUTPUT = ROOT / ".local-backups" / "pre-vector-minimax-stage" / "audio" / "page11.mp3"
API_URL = "https://api.minimax.cn/v1/t2a_v2"
MODEL = "speech-2.8-hd"
MAX_CHARACTERS = 600
MAX_RESPONSE_BYTES = 12_000_000


class SampleError(Exception):
    """An actionable error safe to show without a traceback."""


def request_digest(payload):
    encoded = json.dumps(payload, ensure_ascii=False, sort_keys=True,
                         separators=(",", ":")).encode("utf-8")
    return hashlib.sha256(encoded).hexdigest()


def load_request(path):
    try:
        payload = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, UnicodeError, json.JSONDecodeError) as exc:
        raise SampleError(f"无法读取请求 JSON：{path}（{type(exc).__name__}）") from exc
    if not isinstance(payload, dict):
        raise SampleError("请求 JSON 必须是一个对象。")
    if payload.get("model") != MODEL:
        raise SampleError(f"此样片工具只支持 {MODEL}。")
    text = payload.get("text")
    if not isinstance(text, str) or not text.strip():
        raise SampleError("请求 text 必须是非空讲稿。")
    if len(text) > MAX_CHARACTERS:
        raise SampleError(f"单页样片最多 {MAX_CHARACTERS} 字符，当前 {len(text)}；请先截取一页。")
    if re.search(r"\[\[\d+\]\]", text):
        raise SampleError("请先从讲稿移除 [[n]] 课堂步进标记。")
    if payload.get("stream", False) is not False:
        raise SampleError("单页样片要求 stream=false。")
    if payload.get("output_format") != "hex":
        raise SampleError("单页样片要求 output_format=hex。")
    voice = payload.get("voice_setting")
    if not isinstance(voice, dict) or not isinstance(voice.get("voice_id"), str) or not voice["voice_id"].strip():
        raise SampleError("请在 voice_setting.voice_id 设置音色。")
    audio = payload.get("audio_setting")
    if not isinstance(audio, dict) or audio.get("format") != "mp3":
        raise SampleError("样片输出只支持 audio_setting.format=mp3。")
    forbidden = {"api_key", "apikey", "authorization", "access_token", "secret_key"}

    def has_credential(value):
        if isinstance(value, dict):
            return any(str(key).lower() in forbidden or has_credential(item)
                       for key, item in value.items())
        if isinstance(value, list):
            return any(has_credential(item) for item in value)
        return False

    if has_credential(payload):
        raise SampleError("请求 JSON 中不能保存密钥；请使用 MINIMAX_API_KEY 或 .env.minimax.local。")
    return payload


def safe_output(path, request_path):
    output = path.expanduser().resolve()
    protected = [ROOT / "lecture_factory" / "courses_web",
                 ROOT / "lecture_factory" / "courses",
                 ROOT / "interactive-lecture" / "public",
                 ROOT / "interactive-lecture" / "dist",
                 ROOT / ".git"]
    if any(output == base.resolve() or base.resolve() in output.parents for base in protected):
        raise SampleError("样片不能覆盖课程、public、dist 或 Git 文件；请使用 .local-backups 暂存目录。")
    if output == request_path.resolve() or output.suffix.lower() != ".mp3":
        raise SampleError("--output 必须是独立的 .mp3 文件。")
    return output


def load_api_key():
    key = os.environ.get("MINIMAX_API_KEY", "").strip()
    if not key:
        config = ROOT / ".env.minimax.local"
        try:
            lines = config.read_text(encoding="utf-8").splitlines()
        except FileNotFoundError:
            lines = []
        except (OSError, UnicodeError) as exc:
            raise SampleError("无法读取 .env.minimax.local；可改用 MINIMAX_API_KEY 环境变量。") from exc
        for line in lines:
            match = re.fullmatch(r"\s*(?:export\s+)?MINIMAX_API_KEY\s*=\s*(.*?)\s*", line)
            if match:
                key = match.group(1)
                if len(key) >= 2 and key[0] == key[-1] and key[0] in "\"'":
                    key = key[1:-1].strip()
                else:
                    key = key.split("#", 1)[0].strip()
                break
    placeholder = key.casefold().replace("-", "_").replace(" ", "_")
    if (not key or placeholder in {"your_api_key", "your_minimax_api_key", "api_key",
                                  "replace_me", "changeme", "todo", "placeholder"}
            or "填写" in key or "填入" in key or "替换" in key
            or key.startswith(("<", "${")) or "\n" in key or "\r" in key):
        raise SampleError("尚未配置有效的 MINIMAX_API_KEY。请在项目根目录 .env.minimax.local 的 "
                          "MINIMAX_API_KEY= 后填写密钥，或设置同名环境变量；不要把密钥发到聊天中。")
    return key


def safe_detail(value, key):
    detail = str(value).replace(key, "[已隐藏]") if key else str(value)
    detail = re.sub(r"(?i)Bearer\s+\S+", "Bearer [已隐藏]", detail)
    return " ".join(detail.split())[:200]


def fetch_response(payload, key):
    body = json.dumps(payload, ensure_ascii=False).encode("utf-8")
    request = urllib.request.Request(API_URL, data=body, method="POST", headers={
        "Content-Type": "application/json", "Authorization": f"Bearer {key}"})
    try:
        with urllib.request.urlopen(request, timeout=180) as response:
            raw = response.read(MAX_RESPONSE_BYTES + 1)
    except urllib.error.HTTPError as exc:
        try:
            error_payload = json.loads(exc.read(4096).decode("utf-8"))
            status = error_payload.get("base_resp", {}) if isinstance(error_payload, dict) else {}
            detail = safe_detail(status.get("status_msg", ""), key) if isinstance(status, dict) else ""
        except (ValueError, UnicodeError, OSError):
            detail = ""
        hint = "请检查密钥和中国区 API 账户权限。" if exc.code in (401, 403) else "请检查账户余额和请求参数。"
        raise SampleError(f"MiniMax HTTP {exc.code}。{detail} {hint}未自动重试。") from exc
    except (urllib.error.URLError, OSError, TimeoutError) as exc:
        detail = safe_detail(getattr(exc, "reason", exc), key)
        raise SampleError(f"MiniMax 网络请求失败：{detail}。未自动重试；确认账户记录后再运行。") from exc
    if len(raw) > MAX_RESPONSE_BYTES:
        raise SampleError("MiniMax 响应超过单页样片大小限制，未保存文件。")
    try:
        result = json.loads(raw.decode("utf-8"))
    except (UnicodeError, json.JSONDecodeError) as exc:
        raise SampleError("MiniMax 未返回有效 JSON，未保存文件；未自动重试。") from exc
    if not isinstance(result, dict):
        raise SampleError("MiniMax 响应格式不正确，未保存文件。")
    return result


def valid_audio(result, key):
    base = result.get("base_resp")
    if not isinstance(base, dict) or type(base.get("status_code")) is not int or base["status_code"] != 0:
        code = base.get("status_code", "缺失") if isinstance(base, dict) else "缺失"
        message = safe_detail(base.get("status_msg", ""), key) if isinstance(base, dict) else ""
        raise SampleError(f"MiniMax 合成失败（状态 {safe_detail(code, key)}）：{message}。未保存文件，未自动重试。")
    data = result.get("data")
    if not isinstance(data, dict) or type(data.get("status")) is not int or data["status"] != 2:
        raise SampleError("MiniMax 合成未完成（需要 data.status=2），未保存文件。")
    encoded = data.get("audio")
    if not isinstance(encoded, str) or not encoded or len(encoded) % 2 or not re.fullmatch(r"[0-9a-fA-F]+", encoded):
        raise SampleError("MiniMax 未返回非空、有效的 hex 音频，未保存文件。")
    return bytes.fromhex(encoded)


def manifest_path(output):
    return output.with_suffix(".minimax.json")


def cached_sample(payload, output):
    try:
        manifest = json.loads(manifest_path(output).read_text(encoding="utf-8"))
        if not isinstance(manifest, dict) or manifest.get("request_sha256") != request_digest(payload):
            return False
        audio = output.read_bytes()
        return bool(audio) and manifest.get("audio_sha256") == hashlib.sha256(audio).hexdigest()
    except (OSError, UnicodeError, json.JSONDecodeError):
        return False


def atomic_write(path, content):
    temporary = None
    try:
        with tempfile.NamedTemporaryFile(prefix=f".{path.name}.", suffix=".tmp",
                                         dir=path.parent, delete=False) as target:
            temporary = Path(target.name)
            target.write(content)
            target.flush()
            os.fsync(target.fileno())
        os.replace(temporary, path)
    finally:
        if temporary is not None and temporary.exists():
            temporary.unlink()


def generate_sample(payload, output):
    if cached_sample(payload, output):
        return False
    key = load_api_key()
    result = fetch_response(payload, key)
    audio = valid_audio(result, key)
    extra = result.get("extra_info")
    # Store diagnostics, not the response's large audio hex or any environment.
    safe_extra = json.loads(json.dumps(extra if isinstance(extra, dict) else {}, ensure_ascii=False)
                           .replace(key, "[已隐藏]"))
    manifest = {"request_sha256": request_digest(payload),
                "audio_sha256": hashlib.sha256(audio).hexdigest(),
                "created_at": datetime.now(timezone.utc).isoformat(),
                "request": payload, "extra_info": safe_extra}
    output.parent.mkdir(parents=True, exist_ok=True)
    atomic_write(output, audio)
    atomic_write(manifest_path(output),
                 (json.dumps(manifest, ensure_ascii=False, indent=2) + "\n").encode("utf-8"))
    return True


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--request", type=Path, default=DEFAULT_REQUEST, help="MiniMax API 请求 JSON")
    parser.add_argument("--output", type=Path, default=DEFAULT_OUTPUT, help="独立样片 MP3 的暂存位置")
    parser.add_argument("--generate", action="store_true", help="执行一次可能计费的合成请求；默认仅预览")
    args = parser.parse_args(argv)
    try:
        source = args.request.expanduser().resolve()
        payload = load_request(source)
        output = safe_output(args.output, source)
        print(f"模型：{payload['model']}")
        print(f"音色：{payload['voice_setting']['voice_id']}")
        print(f"字符数：{len(payload['text'])}（含停顿标记，上限 {MAX_CHARACTERS}）")
        print("试听讲稿：" + re.sub(r"<#([\d.]+)#>", r"〔停顿 \1 秒〕", payload["text"]))
        print(f"请求文件：{source}")
        print(f"样片文件：{output}")
        if not args.generate:
            print("已准备；没有联网或计费。添加 --generate 才会合成，音频请求不会自动重试。")
            return 0
        generated = generate_sample(payload, output)
        print("样片已保存。" if generated else "请求与已存样片一致，已复用缓存；没有调用付费 API。")
        print(f"参数记录：{manifest_path(output)}")
        return 0
    except (SampleError, OSError) as exc:
        print(f"错误：{exc}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    sys.exit(main())
