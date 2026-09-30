# -*- coding: utf-8 -*-
"""逐句配音 + 句间停顿 + 句级时间轴。

把每页讲稿按句拆分，逐句 TTS（同一音色），句间插入静音：
  普通句号 0.4s，问号/感叹号 0.65s（反问和强调后多停一下）。
同时输出 vo<n>.json 旁车文件，记录每句的真实起止时间，
供 build.py 的 emit_lecture_json 生成与语音精确对齐的字幕。
用法: python gen_audio.py <课程目录>
"""
import json
import os
import re
import shutil
import subprocess
import sys
from pathlib import Path

import imageio_ffmpeg

FACTORY = os.path.dirname(os.path.abspath(__file__))
STYLE = json.load(open(os.path.join(FACTORY, "style.json"), encoding="utf-8"))
FF = imageio_ffmpeg.get_ffmpeg_exe()

GAP_NORMAL = 0.4    # 句号后的停顿
GAP_EMOT = 0.65     # ？！后的停顿


def audio_tool_command():
    """按需解析 Kimi 配音工具；复用音频缓存时不要求安装或配置 TTS。"""
    configured = os.environ.get("KIMI_AUDIO_TOOL", "").strip()
    if configured:
        tool = Path(os.path.expandvars(configured)).expanduser()
    else:
        # 沿用 Windows Kimi 插件布局，但不绑定某台机器的用户名。
        appdata = os.environ.get("APPDATA")
        tool = (Path(appdata) / "kimi-desktop" / "daimon-share" / "daimon"
                / "runtime" / "kimi-code" / "home" / "plugins" / "managed"
                / "audio_generation" / "scripts" / "audio_generation_tool.py"
                if appdata else None)
    if tool is None or not tool.is_file():
        raise SystemExit(
            "未找到 Kimi 配音工具。请将 KIMI_AUDIO_TOOL 设置为已安装的 "
            "audio_generation_tool.py 完整路径（Mac/Windows 均支持）。"
            "已有页面音频缓存无需配置；生成新配音仍需可用的 Kimi TTS 环境。"
        )
    configured_python = os.environ.get("KIMI_AUDIO_PYTHON", "").strip()
    if configured_python:
        interpreter = shutil.which(os.path.expanduser(os.path.expandvars(configured_python)))
        if not interpreter:
            raise SystemExit("KIMI_AUDIO_PYTHON 未指向可用的 Python 解释器。请设置完整路径或 PATH 中的命令名。")
    else:
        interpreter = sys.executable
    return [interpreter, str(tool.resolve())]


def tts(text, voice, out):
    if os.path.exists(out):
        return
    r = subprocess.run(audio_tool_command() + ["speech",
                        "--text", text, "--voice-id", voice, "--output", out],
                       capture_output=True, text=True, encoding="utf-8",
                       errors="replace", timeout=280)
    if r.returncode != 0 or not os.path.exists(out):
        detail = (r.stderr or r.stdout or "配音工具未生成输出文件").strip()
        raise SystemExit(f"TTS failed: {text[:30]}...\n{detail[-600:]}")


def probe(path):
    r = subprocess.run([FF, "-i", path], capture_output=True, text=True,
                       encoding="utf-8", errors="replace")
    m = re.search(r"Duration: (\d+):(\d+):([\d.]+)", r.stderr)
    h, mnt, s = int(m.group(1)), int(m.group(2)), float(m.group(3))
    return h * 3600 + mnt * 60 + s


def silence(path, dur):
    if os.path.exists(path):
        return
    subprocess.run([FF, "-y", "-f", "lavfi", "-i", "anullsrc=r=24000:cl=mono",
                    "-t", str(dur), "-c:a", "libmp3lame", path],
                   capture_output=True, check=True)


def main():
    course = os.path.abspath(sys.argv[1])
    data = json.load(open(os.path.join(course, "script.json"), encoding="utf-8"))
    char = data.get("character") or STYLE.get("character", "aqiang")
    voice = STYLE.get("voices", {}).get(char, STYLE["voice_id"])
    print("character:", char, "voice:", voice)

    out = os.path.join(course, "audio")
    os.makedirs(out, exist_ok=True)
    sil_n = os.path.join(out, "_sil_n.mp3")
    sil_e = os.path.join(out, "_sil_e.mp3")
    silence(sil_n, GAP_NORMAL)
    silence(sil_e, GAP_EMOT)

    for sl in data["slides"]:
        n = sl["id"]
        vo = os.path.join(out, f"vo{n}.mp3")
        sidecar = os.path.join(out, f"vo{n}.json")
        if os.path.exists(vo) and os.path.exists(sidecar):
            print("audio", n, "exists, skip")
            continue
        sents = [s.strip() for s in re.split(r"(?<=[。！？!?])", sl["narration"]) if s.strip()]
        inputs, times = [], []
        cur = 0.0
        for i, s in enumerate(sents):
            f = os.path.join(out, f"_s{n}_{i}.mp3")
            tts(s, voice, f)
            d = probe(f)
            inputs.append(f)
            times.append({"text": s, "start": round(cur, 2), "end": round(cur + d, 2)})
            cur += d
            if i < len(sents) - 1:
                gap = GAP_EMOT if s.endswith(("！", "？", "!", "?")) else GAP_NORMAL
                inputs.append(sil_e if gap == GAP_EMOT else sil_n)
                cur += gap
        # 单条 ffmpeg 命令完成拼接（filter concat，对参数差异更稳健）
        cmd = [FF, "-y"]
        for f in inputs:
            cmd += ["-i", f]
        refs = "".join(f"[{i}:a]" for i in range(len(inputs)))
        cmd += ["-filter_complex", f"{refs}concat=n={len(inputs)}:v=0:a=1[a]",
                "-map", "[a]", "-c:a", "libmp3lame", "-b:a", "96k", vo]
        r = subprocess.run(cmd, capture_output=True, text=True,
                           encoding="utf-8", errors="replace")
        if r.returncode != 0:
            raise SystemExit(f"concat slide {n} failed:\n{r.stderr[-800:]}")
        json.dump(times, open(sidecar, "w", encoding="utf-8"), ensure_ascii=False, indent=2)
        print("audio", n, "ok", f"({cur:.1f}s, {len(sents)} 句)")


if __name__ == "__main__":
    main()
