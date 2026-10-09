# -*- coding: utf-8 -*-
"""网页版课件构建：slides.json → 逐句配音 + 合并音频 + weblec.json（含步进时间轴）。

用法: python build_web.py "courses_web/shm"
产物（同步到 ../interactive-lecture/public/weblec/<课名>/，课名=课程目录名）：
  audio.mp3    全部页面合并的配音（句间停顿 + 页间 0.8s）
  weblec.json  页面元素、步进揭示时间、句级字幕、问答、激光/红线标记
"""
import json, math, os, re, subprocess, sys, time
from pathlib import Path

FACTORY = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, FACTORY)
import gen_audio  # 复用 tts/probe/silence

FF = gen_audio.FF
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


def sentence_gap_policy(page, sentences):
    """Explicit minimum gaps survive canonical rebuilds and cache reuse."""
    overrides = page.get('sentence_gap_overrides', [])
    if not isinstance(overrides, list):
        raise ValueError('sentence_gap_overrides 必须为列表')
    gaps = {}
    for entry in overrides:
        if not isinstance(entry, dict):
            raise ValueError('句间留白规则必须为对象')
        after, gap = entry.get('after_sentence'), entry.get('gap_seconds')
        matches = [i for i, text in enumerate(sentences) if text == after]
        if not isinstance(after, str) or len(matches) != 1:
            raise ValueError('留白锚点必须唯一匹配完整句')
        si = matches[0]
        if si + 1 >= len(sentences) or si in gaps:
            raise ValueError('留白规则必须有后续句且不能重复')
        if type(gap) not in (int, float) or not math.isfinite(gap) or gap <= 0:
            raise ValueError('gap_seconds 必须为有限正数')
        gaps[si] = gap
    return gaps


def interaction_time(it, step_at, sentences, times, duration):
    """Explicit sentence-end pauses leave reveal steps independent of quizzes."""
    after = it.get('after_sentence')
    if after is None:
        hit = step_at.get(it.get('at'))
        if hit is None:
            raise ValueError(f"互动题锚点 at={it.get('at')} 在讲稿里找不到")
        si, frac = hit
        seg = times[si]
        return seg['start'] + frac * (seg['end'] - seg['start'])
    matches = [i for i, sentence in enumerate(sentences) if sentence == after]
    if len(matches) != 1:
        raise ValueError('after_sentence 必须唯一匹配本页完整配音句')
    offset = it.get('pause_offset', 0.1)
    if type(offset) not in (int, float) or not math.isfinite(offset) or offset <= 0:
        raise ValueError('pause_offset 必须为有限正数')
    si = matches[0]
    if times[si].get('text') != after:
        raise ValueError('after_sentence 对应的句缓存文字不匹配')
    trigger = times[si]['end'] + offset
    limit = min(duration, times[si + 1]['start']) if si + 1 < len(times) else duration
    if round(trigger, 3) >= round(limit, 3):
        raise ValueError('句末暂停会截断下一句或超出本页')
    margin = it.get('pause_margin')
    if margin is not None:
        if type(margin) not in (int, float) or not math.isfinite(margin) or margin <= 0:
            raise ValueError('pause_margin 必须为有限正数')
        if round(limit - trigger, 3) < round(margin, 3):
            raise ValueError('缓存题卡暂停余量不足，保留旧稿并重建本地PCM')
    return trigger


def check_cached_transcripts(course, doc):
    """Check all reusable pages before creating silence, audio or output files."""
    for pg in doc['pages']:
        n = pg['id']
        sentences, step_at = split_sentences(pg['narration'])
        gaps = sentence_gap_policy(pg, sentences)
        mp3 = Path(course) / 'audio' / f'page{n}.mp3'
        sidecar = Path(course) / f'page{n}.times.json'
        if mp3.exists() != sidecar.exists():
            raise ValueError(f'page {n}: 音频和times必须成对；请用本课配音工具补齐')
        if not sidecar.exists():
            continue
        times = json.loads(sidecar.read_text(encoding='utf-8'))
        if not sentences or [seg.get('text') for seg in times] != sentences:
            raise ValueError(f'page {n}: 缓存文字与当前讲稿不一致；保留旧版并明确重配')
        previous_end = 0.0
        for seg in times:
            start, end = seg.get('start'), seg.get('end')
            if (any(type(value) not in (int, float) or not math.isfinite(value) for value in [start, end])
                    or start < previous_end or end <= start):
                raise ValueError(f'page {n}: times包含无效或重叠时钟')
            previous_end = end
        for si, gap in gaps.items():
            if times[si + 1]['start'] - times[si]['end'] < gap - 0.001:
                raise ValueError(f'page {n}: 缓存句间留白不足，保留旧稿并重建本地PCM')
        for interaction in pg.get('interactions', []):
            after = interaction.get('after_sentence')
            if after is not None:
                # The page tail is outside the sidecar; its actual limit is checked
                # again during construction. Anchor and offset still fail here.
                limit = math.inf if after == sentences[-1] else times[-1]['end']
                interaction_time(interaction, step_at, sentences, times, limit)


def main():
    course = os.path.abspath(sys.argv[1])
    with open(os.path.join(course, "slides.json"), encoding="utf-8") as source:
        doc = json.load(source)
    check_cached_transcripts(course, doc)
    char = doc.get("character") or STYLE.get("character", "aqiang")
    voice = STYLE.get("voices", {}).get(char, STYLE["voice_id"])
    print("character:", char, "voice:", voice)

    adir = os.path.join(course, "audio")
    # 需要重配时先检查工具配置，避免配置缺失时先删除已有句音频。
    for pg in doc["pages"]:
        n = pg["id"]
        if not (os.path.exists(os.path.join(adir, f"page{n}.mp3"))
                and os.path.exists(os.path.join(course, f"page{n}.times.json"))):
            gen_audio.audio_tool_command()
            break
    os.makedirs(adir, exist_ok=True)
    build_work = Path(FACTORY).parent / "work" / "audio-build" / Path(course).name / str(time.time_ns())
    build_work.mkdir(parents=True, exist_ok=False)
    sil_n = str(build_work / "_sil_n.mp3")
    sil_e = str(build_work / "_sil_e.mp3")
    sil_p = str(build_work / "_sil_p.mp3")
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
        gap_overrides = sentence_gap_policy(pg, sents)
        page_mp3 = os.path.join(adir, f"page{n}.mp3")
        sidecar = os.path.join(course, f"page{n}.times.json")
        if os.path.exists(page_mp3) and os.path.exists(sidecar):
            times = json.load(open(sidecar, encoding="utf-8"))
            dur = gen_audio.probe(page_mp3)
        else:
            # Fresh work paths prevent filename-only reuse and preserve every old sentence cache.
            sentence_dir = Path(FACTORY).parent / 'work' / 'audio-cache' / os.path.basename(course) / str(time.time_ns())
            sentence_dir.mkdir(parents=True, exist_ok=False)
            inputs, times = [], []
            cur = 0.0
            for i, s in enumerate(sents):
                f = str(sentence_dir / f"p{n}_{i:02d}.mp3")
                gen_audio.tts(s, voice, f)
                d = gen_audio.probe(f)
                times.append({"start": round(cur, 3), "end": round(cur + d, 3), "text": s})
                inputs.append(f)
                emot = s.endswith(("？", "！", "?", "!"))
                sil = sil_e if emot else sil_n
                gap = gen_audio.GAP_EMOT if emot else gen_audio.GAP_NORMAL
                if i in gap_overrides:
                    gap = gap_overrides[i]
                    sil = str(sentence_dir / f'p{n}_gap_{i:02d}.mp3')
                    gen_audio.silence(sil, gap)
                inputs.append(sil)
                cur += d + gap
            lst = str(build_work / f"_list{n}.txt")
            with open(lst, "w", encoding="utf-8") as fp:
                fp.write("\n".join("file '" + p.replace("\\", "/").replace("'", "'\\''") + "'" for p in inputs))
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
        for el in pg['elements']:
            if el.get('type') != 'html' or el.get('timelineSync') is not True:
                continue
            for key in (el.get('msgs') or {}):
                if not str(key).isdecimal() or int(key) <= 0:
                    raise ValueError(f'page {n}: html时间轴消息步进非法：{key}')
                cue = int(key)
                if cue in steps:
                    continue
                if cue not in step_at:
                    raise ValueError(f'page {n}: html时间轴cue [[{cue}]] 缺讲稿锚点')
                si, frac = step_at[cue]
                seg = times[si]
                steps[cue] = seg['start'] + frac * (seg['end'] - seg['start'])
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

        # at remains compatible; after_sentence opts into the complete question's real end.
        interactions = []
        for it in pg.get("interactions", []):
            try:
                trigger = interaction_time(it, step_at, sents, times, dur)
            except ValueError as exc:
                print(f"× page {n}: {exc}")
                sys.exit(1)
            out = {"t": round(trigger + t_abs, 3),
                   "q": it["q"], "answer": it.get("answer")}
            for opt in ("options", "explain", "type", "task", "observe",
                        "plannedSeconds", "feedbackPerOption"):
                if it.get(opt) is not None:
                    out[opt] = it[opt]
            interactions.append(out)

        page_out = {
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
        }
        if interactions:
            page_out["interactions"] = interactions
        pages_out.append(page_out)
        for st in times:
            subtitles.append({"slide": n, "start": round(st["start"] + t_abs, 3),
                              "end": round(st["end"] + t_abs, 3), "text": st["text"]})
        t_abs += dur + PAGE_GAP
        print(f"page {n}: {len(sents)} 句, {dur:.1f}s")

    # ---------- 合并整课音频 ----------
    out_dir = web_public(course)
    os.makedirs(out_dir, exist_ok=True)
    full = os.path.join(out_dir, "audio.mp3")
    lst = str(build_work / "_list_all.txt")
    with open(lst, "w", encoding="utf-8") as fp:
        for p in concat_parts:
            fp.write("file '" + p.replace("\\", "/").replace("'", "'\\''") + "'\n")
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
    for opt in ("logoScale", "theme", "sections", "showTeacher", "projectedSubtitles"):  # 可选版式参数透传
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
