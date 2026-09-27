import type { JSX } from 'react'

/** 网页版课件的 SVG 图示库。内部坐标系与幻灯片 1920×1080 设计坐标一致，
    通过 viewBox + width/height 100% 缩放，文字不失真。 */

const SERIF = '"Times New Roman", SimSun, serif'
const HEI = 'SimHei, SimSun, serif'

function Hatch({ id }: { id: string }) {
  return (
    <pattern id={id} width="10" height="10" patternTransform="rotate(45)" patternUnits="userSpaceOnUse">
      <rect width="10" height="10" fill="#e8e8e8" />
      <line x1="0" y1="0" x2="0" y2="10" stroke="#999" strokeWidth="2" />
    </pattern>
  )
}

/** 弹簧锯齿路径：从 (x0,y) 到 (x1,y)，coils 个三角波 */
function springPath(x0: number, x1: number, y: number, coils: number, amp: number) {
  const n = coils * 2
  const pts: string[] = [`M ${x0} ${y}`]
  const lead = 26
  pts.push(`L ${x0 + lead} ${y}`)
  const sx = x0 + lead, ex = x1 - 14
  for (let i = 0; i <= n; i++) {
    pts.push(`L ${sx + ((ex - sx) * (i + 0.5)) / (n + 1)} ${i % 2 === 0 ? y - amp : y + amp}`)
  }
  pts.push(`L ${ex} ${y}`, `L ${x1} ${y}`)
  return pts.join(' ')
}

function Ball({ cx, cy, rx = 100, ry = 80 }: { cx: number; cy: number; rx?: number; ry?: number }) {
  return (
    <g>
      <radialGradient id="ballg" cx="0.35" cy="0.35" r="0.9">
        <stop offset="0%" stopColor="#ff6b6b" />
        <stop offset="55%" stopColor="#cc0000" />
        <stop offset="100%" stopColor="#5f0000" />
      </radialGradient>
      <ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill="url(#ballg)" />
      <text x={cx} y={cy + 14} textAnchor="middle" fontSize="44" fontStyle="italic"
        fill="#ffe97a" fontFamily={SERIF} fontWeight="bold">m</text>
    </g>
  )
}

/** 矢量符号：字母 + 手绘上方小箭头（字体缺 ⃗ 组合符会显示方框，故手画） */
function Vec({ ch, x, y, size = 44, fill = '#E00', anchor = 'start' }: {
  ch: string; x: number; y: number; size?: number; fill?: string; anchor?: 'start' | 'middle' | 'end'
}) {
  const w = size * 0.6
  const left = anchor === 'middle' ? x - w / 2 : anchor === 'end' ? x - w : x
  const ay = y - size * 0.88
  return (
    <g>
      <text x={x} y={y} textAnchor={anchor} fontSize={size} fontStyle="italic" fill={fill}
        fontFamily={SERIF}>{ch}</text>
      <line x1={left} y1={ay} x2={left + w} y2={ay} stroke={fill} strokeWidth={Math.max(2.5, size * 0.055)} />
      <polygon
        points={`${left + w},${ay} ${left + w - size * 0.2},${ay - size * 0.1} ${left + w - size * 0.2},${ay + size * 0.1}`}
        fill={fill} />
    </g>
  )
}

/** 第 2 页：简谐振动 ⇄ 复杂振动 合成/分解（对照原 PPT：粗双箭头、标签紧贴箭头） */
export function ComposeDiagram() {
  return (
    <svg viewBox="0 0 1250 260" width="100%" height="100%">
      <rect x="10" y="70" width="420" height="120" fill="#CCFFCC" stroke="#333" strokeWidth="3" />
      <text x="220" y="152" textAnchor="middle" fontSize="58" fontFamily={HEI}>简谐振动</text>
      <rect x="820" y="70" width="420" height="120" fill="#fff" stroke="#C000C0" strokeWidth="3" />
      <text x="1030" y="152" textAnchor="middle" fontSize="58" fontFamily={HEI}>复杂振动</text>
      <line x1="480" y1="130" x2="770" y2="130" stroke="#E00" strokeWidth="20" />
      <polygon points="438,130 502,100 502,160" fill="#E00" />
      <polygon points="812,130 748,100 748,160" fill="#E00" />
      <text x="625" y="112" textAnchor="middle" fontSize="50" fill="#E00" fontFamily={HEI}>合成</text>
      <text x="625" y="196" textAnchor="middle" fontSize="50" fill="#00C" fontFamily={HEI}>分解</text>
    </svg>
  )
}

/** 第 3 页：弹簧振子模型（l0、k、-A、O、A） */
export function springO() {
  const O = 1100, A = 1450, nA = 700
  return (
    <svg viewBox="0 0 1580 620" width="100%" height="100%">
      <Hatch id="h3" />
      <rect x="8" y="8" width="1564" height="540" fill="none" stroke="#4a7c8c" strokeWidth="3" />
      <rect x="70" y="130" width="55" height="330" fill="url(#h3)" stroke="#555" strokeWidth="2" />
      <rect x="70" y="460" width="1440" height="65" fill="url(#h3)" stroke="#555" strokeWidth="2" />
      <line x1="125" y1="460" x2="1520" y2="460" stroke="#E00" strokeWidth="4" />
      <polygon points="1520,460 1496,450 1496,470" fill="#E00" />
      <text x="1540" y="475" fontSize="44" fontStyle="italic" fontFamily={SERIF}>x</text>
      {/* 原长标注 */}
      <line x1="135" y1="170" x2="1060" y2="170" stroke="#E8862E" strokeWidth="4" strokeDasharray="16 10" />
      <polygon points="135,170 162,160 162,180" fill="#E8862E" />
      <polygon points="1060,170 1034,160 1034,180" fill="#E8862E" />
      <text x="580" y="150" fontSize="44" fontStyle="italic" fontFamily={SERIF}>l₀</text>
      <text x="740" y="150" fontSize="44" fontStyle="italic" fontFamily={SERIF}>k</text>
      {/* 弹簧与小球（原长状态） */}
      <path d={springPath(125, 1010, 340, 9, 42)} fill="none" stroke="#111" strokeWidth="7" />
      <Ball cx={1100} cy={340} />
      {/* 三条虚线 */}
      {[nA, O, A].map((x, i) => (
        <g key={x}>
          <line x1={x} y1="120" x2={x} y2="545" stroke="#00F" strokeWidth="4" strokeDasharray="14 10" />
          <text x={x} y="600" textAnchor="middle" fontSize="44" fontStyle="italic" fontFamily={SERIF}>
            {['−A', 'O', 'A'][i]}
          </text>
        </g>
      ))}
      <text x="1052" y="600" textAnchor="end" fontSize="40" fontStyle="italic" fontFamily={SERIF}>x = 0　F = 0</text>
    </svg>
  )
}

/** 第 5 页：受力分析（小球在 x 处，F 指向平衡位置） */
export function SpringF() {
  return (
    <svg viewBox="0 0 1600 280" width="100%" height="100%">
      <Hatch id="h5" />
      <rect x="6" y="6" width="1588" height="268" fill="none" stroke="#4a7c8c" strokeWidth="3" />
      <rect x="60" y="30" width="45" height="200" fill="url(#h5)" stroke="#555" strokeWidth="2" />
      <rect x="60" y="230" width="1500" height="40" fill="url(#h5)" stroke="#555" strokeWidth="2" />
      <line x1="105" y1="230" x2="1540" y2="230" stroke="#33F" strokeWidth="4" />
      <polygon points="1540,230 1516,220 1516,240" fill="#33F" />
      <text x="1560" y="222" fontSize="40" fontStyle="italic" fontFamily={SERIF}>x</text>
      <path d={springPath(105, 1210, 130, 10, 36)} fill="none" stroke="#111" strokeWidth="6" />
      {/* 回复力箭头 */}
      <line x1="1330" y1="130" x2="1030" y2="130" stroke="#E00" strokeWidth="6" />
      <polygon points="1030,130 1064,116 1064,144" fill="#E00" />
      <Vec ch="F" x={1130} y={80} size={46} />
      <Ball cx={1330} cy={130} rx={110} ry={85} />
      <circle cx="1050" cy="230" r="8" fill="#111" />
      <text x="1050" y="272" textAnchor="middle" fontSize="40" fontStyle="italic" fontFamily={SERIF}>O</text>
      <text x="1385" y="272" textAnchor="middle" fontSize="40" fontStyle="italic" fontFamily={SERIF}>x</text>
      <line x1="1390" y1="60" x2="1390" y2="230" stroke="#999" strokeWidth="3" strokeDasharray="10 8" />
    </svg>
  )
}

/** 第 4 页：弹簧振子动画（小球随主音频时钟往复运动，F 箭头跟随）。
    相位由播放时钟 t 推导，隐藏标签页、倍速、拖动进度都能正确走位。 */
export function SpringAnim({ t = 0 }: { t?: number }) {
  const ph = t * (2 * Math.PI / 4.5) + 0.6  // 4.5s 一个周期，加初始相位让小球起手不在平衡位置
  const O = 640, Apx = 300
  const x = Apx * Math.cos(ph)
  const cx = O + x
  const fLen = Math.abs(x) * 0.9
  const fDir = x > 0 ? -1 : 1
  return (
    <svg viewBox="0 0 1150 480" width="100%" height="100%">
      <rect x="6" y="6" width="1138" height="468" fill="#fff" stroke="#2E7D32" strokeWidth="3" />
      <text x="330" y="80" textAnchor="middle" fontSize="52" fill="#C2185B" fontFamily={HEI} fontWeight="bold">弹簧振子</text>
      <text x="880" y="80" fontSize="48" fontStyle="italic" fontFamily={SERIF}>F = - kx</text>
      <rect x="60" y="150" width="40" height="180" fill="#3F51B5" />
      <rect x="60" y="330" width="1020" height="55" fill="#3F51B5" />
      <line x1="100" y1="330" x2="1100" y2="330" stroke="#E00" strokeWidth="4" />
      <polygon points="1100,330 1076,320 1076,340" fill="#E00" />
      <text x="1110" y="380" fontSize="40" fontStyle="italic" fill="#3F51B5" fontFamily={SERIF}>x</text>
      <path d={springPath(100, cx - 95, 240, 10, 34)} fill="none" stroke="#111" strokeWidth="6" />
      {fLen > 24 && (
        <g>
          <line x1={cx} y1={240} x2={cx + fDir * fLen} y2={240} stroke="#E00" strokeWidth="5" />
          <polygon
            points={`${cx + fDir * fLen},240 ${cx + fDir * fLen - fDir * 28},228 ${cx + fDir * fLen - fDir * 28},252`}
            fill="#E00" />
          <Vec ch="F" x={cx + fDir * (fLen + 30)} y={225} size={40}
            anchor={fDir > 0 ? 'start' : 'end'} />
        </g>
      )}
      <Ball cx={cx} cy={240} rx={95} ry={75} />
      {[O - Apx, O, O + Apx].map((px, i) => (
        <text key={px} x={px} y="440" textAnchor="middle" fontSize="38" fontStyle="italic"
          fill={i === 1 ? '#3F51B5' : '#E00'} fontFamily={SERIF}>{['−A', 'O', '+A'][i]}</text>
      ))}
    </svg>
  )
}

/** x-t 曲线（从 O 点下行，即 x=-A·sin ωt，对应 φ=π/2） */
export function XtGraph() {
  const pts: string[] = []
  for (let i = 0; i <= 200; i++) {
    const u = i / 200 * 1.32  // 1.32 个周期
    pts.push(`${100 + u * 500},${265 + 140 * Math.sin(u * 2 * Math.PI)}`)
  }
  return (
    <svg viewBox="0 0 820 520" width="100%" height="100%">
      <rect x="4" y="4" width="812" height="512" fill="#fff" stroke="#4a7c8c" strokeWidth="3" />
      <rect x="310" y="25" width="190" height="60" fill="#CCFFCC" stroke="#2E8B57" strokeWidth="3" />
      <text x="405" y="68" textAnchor="middle" fontSize="38" fontStyle="italic" fontFamily={SERIF}>x − t 图</text>
      {/* 虚线参考 */}
      <line x1="100" y1="125" x2="790" y2="125" stroke="#666" strokeWidth="2.5" strokeDasharray="12 8" />
      <line x1="100" y1="405" x2="790" y2="405" stroke="#666" strokeWidth="2.5" strokeDasharray="12 8" />
      {[225, 350, 475, 600].map(x => (
        <line key={x} x1={x} y1="100" x2={x} y2="440" stroke="#66F" strokeWidth="2.5" strokeDasharray="10 8" />
      ))}
      {/* 坐标轴 */}
      <line x1="100" y1="60" x2="100" y2="470" stroke="#111" strokeWidth="3.5" />
      <polygon points="100,60 90,88 110,88" fill="#111" />
      <text x="118" y="80" fontSize="38" fontStyle="italic" fontFamily={SERIF}>x</text>
      <line x1="100" y1="265" x2="800" y2="265" stroke="#111" strokeWidth="3.5" />
      <polygon points="800,265 772,255 772,275" fill="#111" />
      <text x="770" y="250" fontSize="38" fontStyle="italic" fontFamily={SERIF}>t</text>
      <text x="55" y="140" fontSize="38" fontStyle="italic" fontFamily={SERIF}>A</text>
      <text x="30" y="420" fontSize="38" fontStyle="italic" fontFamily={SERIF}>−A</text>
      <text x="55" y="280" fontSize="38" fontStyle="italic" fontFamily={SERIF}>O</text>
      <text x="330" y="330" fontSize="34" fontStyle="italic" fontFamily={SERIF}>T/2</text>
      <text x="585" y="300" fontSize="34" fontStyle="italic" fontFamily={SERIF}>T</text>
      <polyline points={pts.join(' ')} fill="none" stroke="#E00" strokeWidth="5" />
    </svg>
  )
}

/** 第 8 页：x、v、a 三条曲线 */
export function XvaGraphs() {
  const mk = (fn: (u: number) => number) => {
    const pts: string[] = []
    for (let i = 0; i <= 160; i++) {
      const u = i / 160 * 1.25
      pts.push(`${120 + u * 480},${fn(u)}`)
    }
    return pts.join(' ')
  }
  const rows = [
    { y0: 30, label: 'x', amp: 'A', namp: '−A', color: '#00F', fn: (u: number) => 205 - 62 * Math.cos(u * 2 * Math.PI), title: 'x − t 图', tfill: '#CCFFCC', tline: '#2E8B57' },
    { y0: 280, label: 'v', amp: 'Aω', namp: '−Aω', color: '#0A0', fn: (u: number) => 455 + 62 * Math.sin(u * 2 * Math.PI), title: 'v − t 图', tfill: '#CCFFCC', tline: '#2E8B57' },
    { y0: 530, label: 'a', amp: 'Aω²', namp: '−Aω²', color: '#C0C', fn: (u: number) => 705 + 62 * Math.cos(u * 2 * Math.PI), title: 'a − t 图', tfill: '#F8E1F8', tline: '#C000C0' },
  ]
  return (
    <svg viewBox="0 0 830 800" width="100%" height="100%">
      <rect x="4" y="4" width="822" height="792" fill="#fff" stroke="#4a7c8c" strokeWidth="3" />
      {rows.map(r => (
        <g key={r.label}>
          <rect x="320" y={r.y0} width="180" height="52" fill={r.tfill} stroke={r.tline} strokeWidth="2.5" />
          <text x="410" y={r.y0 + 40} textAnchor="middle" fontSize="32" fontStyle="italic" fontFamily={SERIF}>{r.title}</text>
          <line x1="120" y1={r.y0 + 50} x2="120" y2={r.y0 + 220} stroke="#111" strokeWidth="3" />
          <polygon points={`120,${r.y0 + 50} 112,${r.y0 + 74} 128,${r.y0 + 74}`} fill="#111" />
          <text x="132" y={r.y0 + 66} fontSize="32" fontStyle="italic" fontFamily={SERIF}>{r.label}</text>
          <line x1="120" y1={r.y0 + 175} x2="740" y2={r.y0 + 175} stroke="#111" strokeWidth="3" />
          <polygon points={`740,${r.y0 + 175} 714,${r.y0 + 167} 714,${r.y0 + 183}`} fill="#111" />
          <text x="712" y={r.y0 + 163} fontSize="32" fontStyle="italic" fontFamily={SERIF}>t</text>
          <text x="30" y={r.y0 + 123} fontSize="30" fontStyle="italic" fontFamily={SERIF}>{r.amp}</text>
          <text x="20" y={r.y0 + 247} fontSize="30" fontStyle="italic" fontFamily={SERIF}>{r.namp}</text>
          <text x="40" y={r.y0 + 185} fontSize="30" fontStyle="italic" fontFamily={SERIF}>O</text>
          <text x="492" y={r.y0 + 215} fontSize="28" fontStyle="italic" fontFamily={SERIF}>T</text>
          <line x1="120" y1={r.y0 + 113} x2="730" y2={r.y0 + 113} stroke="#666" strokeWidth="2" strokeDasharray="10 7" />
          <line x1="120" y1={r.y0 + 237} x2="730" y2={r.y0 + 237} stroke="#666" strokeWidth="2" strokeDasharray="10 7" />
          <polyline points={mk(r.fn)} fill="none" stroke={r.color} strokeWidth="4.5" />
        </g>
      ))}
      {/* 对齐虚线 */}
      {[216, 312, 408, 504].map(x => (
        <line key={x} x1={x} y1="60" x2={x} y2="760" stroke="#444" strokeWidth="2" strokeDasharray="10 8" />
      ))}
    </svg>
  )
}

/** 第 10 页：红色星爆「注意」 */
export function Burst() {
  const cx = 200, cy = 115, pts: string[] = []
  for (let i = 0; i < 24; i++) {
    const r = i % 2 === 0 ? 190 : 100
    const a = (i / 24) * Math.PI * 2
    pts.push(`${cx + r * Math.cos(a)},${cy + r * 0.55 * Math.sin(a)}`)
  }
  return (
    <svg viewBox="0 0 400 230" width="100%" height="100%">
      <polygon points={pts.join(' ')} fill="#FFE0E0" stroke="#E00" strokeWidth="5" />
      <text x={cx} y={cy + 16} textAnchor="middle" fontSize="48" fontWeight="bold" fontFamily={HEI}>注意</text>
    </svg>
  )
}

/** 第 16 页：小球在 O 点向左运动 */
export function SpringV() {
  return (
    <svg viewBox="0 0 800 280" width="100%" height="100%">
      <Hatch id="h16" />
      <rect x="6" y="6" width="788" height="268" fill="none" stroke="#4a7c8c" strokeWidth="3" />
      <rect x="50" y="60" width="40" height="140" fill="url(#h16)" stroke="#555" strokeWidth="2" />
      <rect x="50" y="200" width="700" height="35" fill="url(#h16)" stroke="#555" strokeWidth="2" />
      <line x1="90" y1="200" x2="720" y2="200" stroke="#33F" strokeWidth="3.5" />
      <polygon points="720,200 698,192 698,208" fill="#33F" />
      <text x="735" y="195" fontSize="34" fontStyle="italic" fontFamily={SERIF}>x</text>
      <path d={springPath(90, 430, 130, 9, 26)} fill="none" stroke="#111" strokeWidth="5" />
      <line x1="600" y1="60" x2="420" y2="60" stroke="#E00" strokeWidth="6" />
      <polygon points="420,60 450,48 450,72" fill="#E00" />
      <Vec ch="v" x={510} y={40} size={36} anchor="middle" />
      <Ball cx={520} cy={130} rx={90} ry={70} />
      <line x1="520" y1="70" x2="520" y2="235" stroke="#0A0" strokeWidth="3.5" strokeDasharray="10 8" />
      <text x="520" y="268" textAnchor="middle" fontSize="36" fontStyle="italic" fontFamily={SERIF}>O</text>
    </svg>
  )
}

const DIAGRAMS: Record<string, (props: { t?: number }) => JSX.Element> = {
  compose: ComposeDiagram,
  spring_o: springO,
  spring_f: SpringF,
  spring_anim: SpringAnim,
  xt: XtGraph,
  xva: XvaGraphs,
  burst: Burst,
  spring_v: SpringV,
}

export default DIAGRAMS
