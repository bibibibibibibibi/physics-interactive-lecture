# -*- coding: utf-8 -*-
"""validate_weblec.py —— weblec.json 规范校验器（0 token）。

把文档里的创作约定变成程序约束：结构完整性、步进时刻、红线规则、
热点/问答、激光时刻、字幕覆盖、媒体存在。build_web.py 构建后自动调用，
也可独立使用：
  python validate_weblec.py shm                  # 按课名（public/weblec/shm/）
  python validate_weblec.py <weblec.json 路径>
退出码：有 ERROR 为 1，仅 WARN 为 0。
"""
import json
import os
import sys

FACTORY = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, FACTORY)
WEBLEC = os.path.normpath(os.path.join(FACTORY, "..", "interactive-lecture", "public", "weblec"))
VIDEO_W, VIDEO_H = 1920, 1080
TIME_TOL = 0.6        # 时刻相对页面区间的容忍（秒）
STEP_MIN_GAP = 0.8    # 相邻步进最小间隔，更小疑似同句多标记
MAX_IMPORTANT = 3     # 每页 important 要点上限（引擎每页最多画 3 条红线）


class Rep:
    def __init__(self):
        self.errors, self.warns = [], []

    def e(self, msg):
        self.errors.append(msg)

    def w(self, msg):
        self.warns.append(msg)

    @property
    def ok(self):
        return not self.errors


def validate(path):
    rep = Rep()
    base = os.path.dirname(os.path.abspath(path))
    try:
        d = json.load(open(path, encoding="utf-8"))
    except Exception as ex:
        rep.e(f"JSON 解析失败：{ex}")
        return rep

    for k in ("title", "nav", "footer", "duration", "slides", "subtitles"):
        if k not in d:
            rep.e(f"缺顶层字段 {k}")
    slides = d.get("slides", [])
    subs = d.get("subtitles", [])
    dur = d.get("duration", 0)

    ids = [p.get("id") for p in slides]
    if ids != list(range(1, len(slides) + 1)):
        rep.w(f"页 id 不连续：{ids}")

    for p in slides:
        tag = f"p{p.get('id', '?')}「{p.get('heading', '')}」"
        els = p.get("elements", [])
        bls = p.get("bullets", [])
        st = p.get("stepTimes", {})
        ts, te = p.get("t_start"), p.get("t_end")

        if ts is None or te is None or te <= ts:
            rep.e(f"{tag} t_start/t_end 缺失或倒置")
            continue
        if te - ts < 2:
            rep.w(f"{tag} 页面时长 {te - ts:.1f}s 过短")

        # 步进时刻：键集 == 元素 step 集（去掉恒显的基底 step 0）
        want = {e.get("step", 0) for e in els} - {0}
        got = {int(k) for k in st.keys()}
        if want != got:
            rep.e(f"{tag} stepTimes 键 {sorted(got)} ≠ 元素 step 集 {sorted(want)}")
        times = sorted(float(v) for v in st.values())
        for v in times:
            if not (ts - TIME_TOL <= v <= te + TIME_TOL):
                rep.e(f"{tag} 步进时刻 {v} 越出页面区间 [{ts:.1f}, {te:.1f}]")
        for a, b in zip(times, times[1:]):
            if b - a < STEP_MIN_GAP:
                rep.w(f"{tag} 相邻步进间隔 {b - a:.2f}s 过近（疑似同句多 [[n]] 标记）")

        # 元素几何与图片
        for e in els:
            if not (0 <= e.get("x", 0) <= VIDEO_W and 0 <= e.get("y", 0) <= VIDEO_H):
                rep.w(f"{tag} 元素越界：{e.get('type')} @({e.get('x')},{e.get('y')})")
            if e.get("w", 0) <= 0:
                rep.e(f"{tag} 元素宽度非法：{e.get('type')}")
            if e.get("type") == "img":
                src = e.get("src", "")
                if not src.startswith("data:") and not os.path.exists(os.path.join(base, src)):
                    rep.e(f"{tag} 图片缺失：{src}")

        # 要点：红线规则 / elIdx / 热点问答
        imp = [b for b in bls if b.get("important")]
        if len(imp) > MAX_IMPORTANT:
            rep.w(f"{tag} important 要点 {len(imp)} 个 > {MAX_IMPORTANT}（引擎每页最多画 {MAX_IMPORTANT} 条红线）")
        for bi, b in enumerate(bls):
            name = b.get("text", "")[:12]
            ei = b.get("elIdx")
            if ei is None or not (0 <= ei < len(els)):
                rep.e(f"{tag} 要点#{bi}「{name}」elIdx={ei} 无效")
            if b.get("hotspot") and not b.get("qa"):
                rep.w(f"{tag} 热点要点#{bi}「{name}」缺预设问答 qa")
            if not (0 <= b.get("x", 0) <= VIDEO_W and 0 <= b.get("y", 0) <= VIDEO_H):
                rep.w(f"{tag} 要点#{bi} 坐标越界 ({b.get('x')},{b.get('y')})")

        # 激光时刻
        for m in p.get("laser", []):
            bi = m.get("bullet")
            if bi is None or not (0 <= bi < len(bls)):
                rep.e(f"{tag} 激光指向不存在的要点 #{bi}")
            if not (ts - TIME_TOL <= m.get("start", 0) <= m.get("end", 0) <= te + TIME_TOL):
                rep.e(f"{tag} 激光时刻 [{m.get('start')}, {m.get('end')}] 越界或倒置")

    # 字幕
    for n, s in enumerate(subs, 1):
        if s.get("slide") not in ids:
            rep.e(f"字幕#{n} 引用不存在的页 id={s.get('slide')}")
        if not (0 <= s.get("start", 0) < s.get("end", 0)):
            rep.e(f"字幕#{n} 时刻非法 [{s.get('start')}, {s.get('end')}]")
        if not s.get("text", "").strip():
            rep.w(f"字幕#{n} 文本为空")
    if subs:
        if subs[0].get("start", 1) > 1.5:
            rep.w(f"首条字幕 start={subs[0].get('start')}（课程开头无字幕）")
        if abs(subs[-1].get("end", 0) - dur) > 2:
            rep.w(f"末条字幕 end={subs[-1].get('end')} 与整课时长 {dur} 相差 >2s")
    else:
        rep.w("无字幕")

    # 媒体文件
    if not os.path.exists(os.path.join(base, "logo.png")):
        rep.w("缺 logo.png（页面左上角图标）")
    ap = os.path.join(base, "audio.mp3")
    if not os.path.exists(ap):
        rep.e("缺 audio.mp3")
    else:
        try:
            import gen_audio
            real = gen_audio.probe(ap)
            if abs(real - dur) > 2:
                rep.e(f"audio.mp3 实测 {real:.1f}s ≠ duration {dur}s")
        except Exception:
            pass  # 无法探测时跳过时长比对

    return rep


def run(path):
    """打印报告，返回是否通过（供 build_web.py 调用）。"""
    rep = validate(path)
    name = os.path.basename(os.path.dirname(path)) + "/" + os.path.basename(path)
    for m in rep.errors:
        print("  [ERROR]", m)
    for m in rep.warns:
        print("  [WARN] ", m)
    print(f"校验{'通过' if rep.ok else '未通过'}：{len(rep.errors)} 错误 / {len(rep.warns)} 警告（{name}）")
    return rep.ok


def main():
    if len(sys.argv) < 2:
        print(__doc__)
        return 2
    a = sys.argv[1]
    path = a if a.lower().endswith(".json") else os.path.join(WEBLEC, a, "weblec.json")
    if not os.path.exists(path):
        print("× 未找到", path)
        return 2
    return 0 if run(path) else 1


if __name__ == "__main__":
    sys.exit(main())
