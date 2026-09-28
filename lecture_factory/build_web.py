# -*- coding: utf-8 -*-
"""网页版课件构建：slides.json → 逐句配音 + 合并音频 + weblec.json（含步进时间轴）。

用法: python build_web.py "courses_web/shm"
产物（同步到 ../interactive-lecture/public/weblec/<课名>/，课名=课程目录名）：
  audio.mp3    全部页面合并的配音（句间停顿 + 页间 0.8s）
  weblec.json  页面元素、步进揭示时间、句级字幕、问答、激光/红线标记
"""
import json, os, re, subprocess, sys, time

FACTORY = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, FACTORY)
import gen_audio  # 复用 tts/probe/silence
import imageio_ffmpeg

FF = imageio_ffmpeg.get_ffmpeg_exe()
STYLE = json.load(open(os.path.join(FACTORY, "style.json"), encoding="utf-8"))
WEB_PUBLIC = os.path.normpath(os.path.join(FACTORY, "..", "interactive-lecture", "public", "weblec"))
PAGE_GAP = 0.8


def web_public(course_dir):
    """某门课的产物目录：public/weblec/<课名>/（课名=课程目录名）"""
    return os.path.join(WEB_PUBLIC, os.path.basename(course_dir))

STEP_MARK = re.compile(r"\[\[(\d+)\]\]")


def split_sentences(narration):
    """拆句并提取 [[n]] 步进标记。返回 (sentences, step_at)：
    sentences=[str...], step_at={step: (句子下标, 句内字符比例)}。
    句内比例用于把步进时刻定位到标记在句中的真实位置（匀速朗读近似）。"""
    raw = [s.strip() for s in re.split(r"(?<=[。！？!?])", narration) if s.strip()]
    sentences, step_at = [], {}
    for s in raw:
        clean = STEP_MARK.sub("", s).strip()
        for m in STEP_MARK.finditer(s):
            pos = len(STEP_MARK.sub("", s[:m.start()]))
            step_at[int(m.group(1))] = (len(sentences), pos / max(len(clean), 1))
        if clean:
            sentences.append(clean)
    return sentences, step_at


def main():
    course = os.path.abspath(sys.argv[1])
    doc = json.load(open(os.path.join(course, "slides.json"), encoding="utf-8"))
    char = doc.get("character") or STYLE.get("character", "aqiang")
    voice = STYLE.get("voices", {}).get(char, STYLE["voice_id"])
    print("character:", char, "voice:", voice)

    adir = os.path.join(course, "audio")
    os.makedirs(adir, exist_ok=True)
    sil_n = os.path.join(adir, "_sil_n.mp3")
    sil_e = os.path.join(adir, "_sil_e.mp3")
    sil_p = os.path.join(adir, "_sil_p.mp3")
    gen_audio.silence(sil_n, gen_audio.GAP_NORMAL)
    gen_audio.silence(sil_e, gen_audio.GAP_EMOT)
    gen_audio.silence(sil_p, PAGE_GAP)

    # ---------- 逐页逐句配音 ----------
    pages_out, subtitles = [], []
    concat_parts = []
    t_abs = 0.0
    for pg in doc["pages"]:
        n = pg["id"]
        sents, step_at = split_sentences(pg["narration"])
        page_mp3 = os.path.join(adir, f"page{n}.mp3")
        sidecar = os.path.join(course, f"page{n}.times.json")
        if os.path.exists(page_mp3) and os.path.exists(sidecar):
            times = json.load(open(sidecar, encoding="utf-8"))
            dur = gen_audio.probe(page_mp3)
        else:
            # 句缓存按文件名复用，断句变化后下标会错位 → 重配前清掉本页旧句音频
            for old in os.listdir(adir):
                if old.startswith(f"p{n}_") and old.endswith(".mp3"):
                    os.remove(os.path.join(adir, old))
            inputs, times = [], []
            cur = 0.0
            for i, s in enumerate(sents):
                f = os.path.join(adir, f"p{n}_{i:02d}.mp3")
                gen_audio.tts(s, voice, f)
                d = gen_audio.probe(f)
                times.append({"start": round(cur, 3), "end": round(cur + d, 3), "text": s})
                inputs.append(f)
                emot = s.endswith(("？", "！", "?", "!"))
                sil = sil_e if emot else sil_n
                inputs.append(sil)
                cur += d + (gen_audio.GAP_EMOT if emot else gen_audio.GAP_NORMAL)
            lst = os.path.join(adir, f"_list{n}.txt")
            with open(lst, "w", encoding="utf-8") as fp:
                fp.write("\n".join(f"file '{os.path.basename(p)}'" for p in inputs))
            subprocess.run([FF, "-y", "-f", "concat", "-safe", "0", "-i", lst,
                            "-c", "copy", page_mp3], cwd=adir,
                           capture_output=True, check=True)
            json.dump(times, open(sidecar, "w", encoding="utf-8"), ensure_ascii=False)
            dur = gen_audio.probe(page_mp3)
        concat_parts.append(page_mp3)
        concat_parts.append(sil_p)

        # 步进时间（页内相对 → 绝对；句内按标记位置比例插值）
        steps = {}
        for el in pg["elements"]:
            s = el.get("step", 0)
            if s and s not in steps:
                hit = step_at.get(s)
                if hit is None:
                    steps[s] = None
                else:
                    si, frac = hit
                    seg = times[si]
                    steps[s] = seg["start"] + frac * (seg["end"] - seg["start"])
        # 无标记的步退化为上一步时间
        last = 0.0
        for s in sorted(steps):
            if steps[s] is None:
                steps[s] = last
            last = steps[s]

        bullets = []
        for i, el in enumerate(pg["elements"]):
            if el.get("hotspot") or el.get("important") or el.get("qa"):
                bullets.append({
                    "text": el.get("label") or el.get("tex") or
                            "".join(r["t"] for p in (el.get("paras") or []) for r in p)[:40],
                    "x": round(el["x"] + el["w"] / 2), "y": round(el["y"] + el.get("h", 90) + 12),
                    "qa": el.get("qa", []),
                    "hotspot": bool(el.get("hotspot")),
                    "important": bool(el.get("important")),
                    "elIdx": i,
                })
        laser = []
        for s, st in steps.items():
            for i, el in enumerate(pg["elements"]):
                if el.get("step") == s and (el.get("hotspot") or el.get("important")):
                    bi = next(j for j, b in enumerate(bullets) if b["elIdx"] == i)
                    laser.append({"bullet": bi, "start": round(st, 2),
                                  "end": round(min(st + 5, dur), 2)})
        pages_out.append({
            "id": n, "kind": "page",
            "heading": pg.get("heading") or f"第 {n} 页",
            "narration": re.sub(STEP_MARK, "", pg["narration"]),
            "elements": pg["elements"],
            "bullets": bullets,
            "stepTimes": {str(k): round(v + t_abs, 3) for k, v in steps.items()},
            "t_start": round(t_abs, 3),
            "t_end": round(t_abs + dur, 3),
            "duration": round(dur, 3),
            "laser": [{"bullet": l["bullet"],
                       "start": round(l["start"] + t_abs, 2),
                       "end": round(l["end"] + t_abs, 2)} for l in laser],
        })
        for st in times:
            subtitles.append({"slide": n, "start": round(st["start"] + t_abs, 3),
                              "end": round(st["end"] + t_abs, 3), "text": st["text"]})
        t_abs += dur + PAGE_GAP
        print(f"page {n}: {len(sents)} 句, {dur:.1f}s")

    # ---------- 合并整课音频 ----------
    out_dir = web_public(course)
    os.makedirs(out_dir, exist_ok=True)
    full = os.path.join(out_dir, "audio.mp3")
    lst = os.path.join(adir, "_list_all.txt")
    with open(lst, "w", encoding="utf-8") as fp:
        for p in concat_parts:
            fp.write(f"file '{p.replace(os.sep, '/')}'\n")
    subprocess.run([FF, "-y", "-f", "concat", "-safe", "0", "-i", lst,
                    "-c", "copy", full], capture_output=True, check=True)
    total = gen_audio.probe(full)

    characters = json.load(open(os.path.join(FACTORY, "assets", "characters", "characters.json"),
                                encoding="utf-8"))
    if isinstance(characters, dict):  # {id: 显示名} → [{id, name}]
        characters = [{"id": k, "name": v} for k, v in characters.items()]
    weblec = {
        "title": doc["title"], "nav": doc["nav"], "footer": doc["footer"],
        "character": char, "characters": characters,
        "duration": round(total, 3),
        "slides": pages_out,
        "subtitles": subtitles,
        "build_ts": int(time.time()),  # 构建时间戳：前端给音频/图片做缓存戳，防旧缓存
    }
    for opt in ("logoScale",):  # 可选版式参数透传
        if opt in doc:
            weblec[opt] = doc[opt]
    with open(os.path.join(out_dir, "weblec.json"), "w", encoding="utf-8") as f:
        json.dump(weblec, f, ensure_ascii=False, indent=1)
    print(f"total {total:.1f}s -> {out_dir}")

    # ---------- 规范校验（0 token；有 ERROR 时非零退出，产物已写出可调试） ----------
    import validate_weblec
    if not validate_weblec.run(os.path.join(out_dir, "weblec.json")):
        sys.exit(1)


if __name__ == "__main__":
    main()
