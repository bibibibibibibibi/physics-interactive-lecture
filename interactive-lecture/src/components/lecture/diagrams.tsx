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

/** 旋转矢量公共件：逆时针 ω 弯箭头 */
function OmegaArrow({ cx, cy, r, a0 = -0.5, a1 = -1.5, size = 40 }: {
  cx: number; cy: number; r: number; a0?: number; a1?: number; size?: number
}) {
  const x0 = cx + r * Math.cos(a0), y0 = cy + r * Math.sin(a0)
  const x1 = cx + r * Math.cos(a1), y1 = cy + r * Math.sin(a1)
  const tan = a1 - Math.PI / 2  // 逆时针方向切线角
  const hs = size * 0.45
  const p1 = `${x1},${y1}`
  const p2 = `${x1 - hs * Math.cos(tan - 0.5)},${y1 - hs * Math.sin(tan - 0.5)}`
  const p3 = `${x1 - hs * Math.cos(tan + 0.5)},${y1 - hs * Math.sin(tan + 0.5)}`
  return (
    <g>
      <path d={`M ${x0} ${y0} A ${r} ${r} 0 0 0 ${x1} ${y1}`} fill="none" stroke="#E8862E" strokeWidth="6" />
      <polygon points={`${p1} ${p2} ${p3}`} fill="#E8862E" />
      <text x={cx + (r + 30) * Math.cos((a0 + a1) / 2)} y={cy + (r + 30) * Math.sin((a0 + a1) / 2) + 12}
        textAnchor="middle" fontSize={size} fontStyle="italic" fill="#111" fontFamily={SERIF}>ω</text>
    </g>
  )
}

/** 旋转矢量公共件：从 O 出发、角度 ang（数学角，逆时针为正）、长度 len 的红色矢量 */
function RotArrow({ O, ang, len, label, labelR = 34, color = '#E00' }: {
  O: [number, number]; ang: number; len: number; label?: string; labelR?: number; color?: string
}) {
  const x = O[0] + len * Math.cos(ang), y = O[1] - len * Math.sin(ang)
  const perp = ang + Math.PI / 2
  return (
    <g>
      <line x1={O[0]} y1={O[1]} x2={x} y2={y} stroke={color} strokeWidth="7" />
      <polygon
        points={`${x},${y} ${x - 22 * Math.cos(ang) + 11 * Math.cos(perp)},${y + 22 * Math.sin(ang) - 11 * Math.sin(perp)} ${x - 22 * Math.cos(ang) - 11 * Math.cos(perp)},${y + 22 * Math.sin(ang) + 11 * Math.sin(perp)}`}
        fill={color} />
      {label && (
        <Vec ch={label} x={O[0] + (len + labelR) * Math.cos(ang)} y={O[1] - (len + labelR) * Math.sin(ang)}
          size={46} fill={color} anchor="middle" />
      )}
    </g>
  )
}

/** 角度弧线（从 a0 逆时针扫到 a1 + 可选标签），自动处理跨半圆/整圈的大弧标志 */
function AngleArc({ O, r, a0, a1, label, color = '#0A0', lsize = 38 }: {
  O: [number, number]; r: number; a0: number; a1: number; label?: string; color?: string; lsize?: number
}) {
  const TAU = Math.PI * 2
  const delta = ((a1 - a0) % TAU + TAU) % TAU  // 归一化到 [0, 2π)
  const end = a0 + delta
  const x0 = O[0] + r * Math.cos(a0), y0 = O[1] - r * Math.sin(a0)
  const x1 = O[0] + r * Math.cos(end), y1 = O[1] - r * Math.sin(end)
  const mid = a0 + delta / 2
  const large = delta > Math.PI ? 1 : 0
  return (
    <g>
      <path d={`M ${x0} ${y0} A ${r} ${r} 0 ${large} 0 ${x1} ${y1}`} fill="none" stroke={color} strokeWidth="5" />
      {label && (
        <text x={O[0] + (r + 30) * Math.cos(mid)} y={O[1] - (r + 30) * Math.sin(mid) + 12}
          textAnchor="middle" fontSize={lsize} fontStyle="italic" fill={color} fontFamily={SERIF}>{label}</text>
      )}
    </g>
  )
}

/** 9-2 第 1 页：t=0 的旋转矢量（静态） */
export function RotvecT0() {
  const O: [number, number] = [400, 520], Rr = 330, phi = 0.7
  const tipX = O[0] + Rr * Math.cos(phi), tipY = O[1] - Rr * Math.sin(phi)
  return (
    <svg viewBox="0 0 900 900" width="100%" height="100%">
      <rect x="6" y="6" width="888" height="888" fill="#fff" stroke="#4a7c8c" strokeWidth="3" />
      <circle cx={O[0]} cy={O[1]} r={Rr} fill="none" stroke="#33F" strokeWidth="5" strokeDasharray="18 12" />
      {/* x 轴 */}
      <line x1="40" y1={O[1]} x2="860" y2={O[1]} stroke="#7030A0" strokeWidth="5" />
      <polygon points="860,520 834,510 834,530" fill="#7030A0" />
      <text x="872" y="540" fontSize="44" fontStyle="italic" fontFamily={SERIF}>x</text>
      <text x={O[0] - 24} y={O[1] + 66} fontSize="52" fontStyle="italic" fontFamily={SERIF}>O</text>
      <text x="200" y="330" fontSize="48" fontStyle="italic" fontFamily={SERIF}>t = 0</text>
      {/* 矢量与投影 */}
      <RotArrow O={O} ang={phi} len={Rr} label="A" />
      <line x1={tipX} y1={tipY} x2={tipX} y2={O[1]} stroke="#E00" strokeWidth="4" strokeDasharray="12 9" />
      <circle cx={tipX} cy={O[1]} r="16" fill="#E00" />
      <text x={tipX - 10} y={O[1] + 58} textAnchor="middle" fontSize="40" fontStyle="italic" fontFamily={SERIF}>x₀</text>
      <AngleArc O={O} r={110} a0={0} a1={phi} label="φ" color="#C000C0" />
      <OmegaArrow cx={O[0]} cy={O[1]} r={Rr + 60} a0={-0.6} a1={-1.5} />
    </svg>
  )
}

/** 9-2 第 2 页：t=t 的旋转矢量（静态，初相 φ 与 ωt+φ 双弧） */
export function RotvecT() {
  const O: [number, number] = [430, 560], Rr = 320, phi = 0.42, ang = 1.15
  const tipX = O[0] + Rr * Math.cos(ang), tipY = O[1] - Rr * Math.sin(ang)
  return (
    <svg viewBox="0 0 940 940" width="100%" height="100%">
      <rect x="6" y="6" width="928" height="928" fill="#fff" stroke="#4a7c8c" strokeWidth="3" />
      <circle cx={O[0]} cy={O[1]} r={Rr} fill="none" stroke="#33F" strokeWidth="5" strokeDasharray="18 12" />
      <line x1="40" y1={O[1]} x2="900" y2={O[1]} stroke="#7030A0" strokeWidth="5" />
      <polygon points="900,560 874,550 874,570" fill="#7030A0" />
      <text x="860" y="620" fontSize="44" fontStyle="italic" fontFamily={SERIF}>x</text>
      <text x={O[0] - 26} y={O[1] + 72} fontSize="54" fontStyle="italic" fontFamily={SERIF}>O</text>
      <text x="180" y="360" fontSize="48" fontStyle="italic" fontFamily={SERIF}>t = t</text>
      {/* 初始矢量（细）与当前矢量 */}
      <line x1={O[0]} y1={O[1]} x2={O[0] + Rr * Math.cos(phi)} y2={O[1] - Rr * Math.sin(phi)}
        stroke="#E00" strokeWidth="4" opacity="0.55" />
      <RotArrow O={O} ang={ang} len={Rr} label="A" />
      <line x1={tipX} y1={tipY} x2={tipX} y2={O[1]} stroke="#E00" strokeWidth="4" strokeDasharray="12 9" />
      <circle cx={tipX} cy={O[1]} r="16" fill="#E00" />
      <AngleArc O={O} r={100} a0={0} a1={phi} label="φ" color="#C000C0" />
      <AngleArc O={O} r={165} a0={phi} a1={ang} label="ωt" color="#C000C0" />
      <OmegaArrow cx={O[0]} cy={O[1]} r={Rr + 60} a0={-0.6} a1={-1.5} />
      <rect x={O[0] - 260} y={O[1] + 120} width="520" height="95" fill="#CCFFCC" stroke="#2E8B57" strokeWidth="3" />
      <text x={O[0]} y={O[1] + 184} textAnchor="middle" fontSize="46" fontStyle="italic" fontFamily={SERIF}>x = A cos( ωt + φ )</text>
    </svg>
  )
}

/** 9-2 第 3 页：旋转矢量动画（矢量转、投影球往复） */
export function RotvecAnim({ t = 0 }: { t?: number }) {
  const ph = t * (2 * Math.PI / 6) + 0.7  // 6s 一圈
  const O: [number, number] = [430, 470], Rr = 300
  const tipX = O[0] + Rr * Math.cos(ph), tipY = O[1] - Rr * Math.sin(ph)
  return (
    <svg viewBox="0 0 900 940" width="100%" height="100%">
      <rect x="6" y="6" width="888" height="928" fill="#fff" stroke="#4a7c8c" strokeWidth="3" />
      <circle cx={O[0]} cy={O[1]} r={Rr} fill="none" stroke="#33F" strokeWidth="5" strokeDasharray="18 12" />
      <line x1="60" y1={O[1]} x2="850" y2={O[1]} stroke="#7030A0" strokeWidth="5" />
      <polygon points="850,470 824,460 824,480" fill="#7030A0" />
      <text x="800" y="530" fontSize="44" fontStyle="italic" fontFamily={SERIF}>x</text>
      <text x={O[0] - 26} y={O[1] + 70} fontSize="54" fontStyle="italic" fontFamily={SERIF}>O</text>
      <text x={O[0] - Rr - 20} y={O[1] + 56} textAnchor="middle" fontSize="40" fontStyle="italic" fill="#00C" fontFamily={SERIF}>−A</text>
      <text x={O[0] + Rr} y={O[1] + 56} textAnchor="middle" fontSize="40" fontStyle="italic" fill="#E00" fontFamily={SERIF}>A</text>
      <RotArrow O={O} ang={ph} len={Rr} label="A" />
      <line x1={tipX} y1={tipY} x2={tipX} y2={O[1]} stroke="#E00" strokeWidth="4" strokeDasharray="12 9" />
      <circle cx={tipX} cy={O[1]} r="20" fill="#0A0" stroke="#054" strokeWidth="3" />
      <OmegaArrow cx={O[0]} cy={O[1]} r={Rr + 55} a0={-0.6} a1={-1.5} />
      <rect x={O[0] - 260} y={O[1] + Rr + 60} width="520" height="95" fill="#fff" stroke="#C000C0" strokeWidth="3" />
      <text x={O[0]} y={O[1] + Rr + 124} textAnchor="middle" fontSize="46" fontStyle="italic" fontFamily={SERIF}>x = A cos( ωt + φ )</text>
    </svg>
  )
}

/** 9-2 第 4 页：由旋转矢量读 v 与 a（动画） */
export function RotvecVA({ t = 0 }: { t?: number }) {
  const ph = t * (2 * Math.PI / 7) + 0.9
  const O: [number, number] = [430, 490], Rr = 290
  const tipX = O[0] + Rr * Math.cos(ph), tipY = O[1] - Rr * Math.sin(ph)
  const vLen = 150, aLen = 110
  const vAng = ph + Math.PI / 2
  const vx = tipX + vLen * Math.cos(vAng), vy = tipY - vLen * Math.sin(vAng)
  const ax = tipX - aLen * Math.cos(ph), ay = tipY + aLen * Math.sin(ph)
  return (
    <svg viewBox="0 0 920 960" width="100%" height="100%">
      <rect x="6" y="6" width="908" height="948" fill="#fff" stroke="#2E8B57" strokeWidth="3" />
      <circle cx={O[0]} cy={O[1]} r={Rr} fill="none" stroke="#33F" strokeWidth="5" strokeDasharray="18 12" />
      {/* x、y 轴 */}
      <line x1="40" y1={O[1]} x2="880" y2={O[1]} stroke="#111" strokeWidth="4" />
      <polygon points="880,490 856,481 856,499" fill="#111" />
      <text x="850" y="548" fontSize="40" fontStyle="italic" fontFamily={SERIF}>x</text>
      <line x1={O[0]} y1={O[1] + Rr + 130} x2={O[0]} y2="80" stroke="#111" strokeWidth="4" />
      <polygon points={`${O[0]},80 ${O[0] - 9},106 ${O[0] + 9},106`} fill="#111" />
      <text x={O[0] + 16} y="70" fontSize="40" fontStyle="italic" fontFamily={SERIF}>y</text>
      <text x={O[0] - 30} y={O[1] + 64} fontSize="50" fontStyle="italic" fontFamily={SERIF}>O</text>
      {/* 主矢量与投影 */}
      <RotArrow O={O} ang={ph} len={Rr} label="A" />
      <line x1={tipX} y1={tipY} x2={tipX} y2={O[1]} stroke="#E00" strokeWidth="3.5" strokeDasharray="10 8" />
      <circle cx={tipX} cy={O[1]} r="15" fill="#E60" />
      {/* 速度（切向，蓝） */}
      <line x1={tipX} y1={tipY} x2={vx} y2={vy} stroke="#00C" strokeWidth="6" />
      <polygon
        points={`${vx},${vy} ${vx - 20 * Math.cos(vAng) + 10 * Math.cos(ph)},${vy + 20 * Math.sin(vAng) - 10 * Math.sin(ph)} ${vx - 20 * Math.cos(vAng) - 10 * Math.cos(ph)},${vy + 20 * Math.sin(vAng) + 10 * Math.sin(ph)}`}
        fill="#00C" />
      <Vec ch="v" x={vx + 30 * Math.cos(vAng)} y={vy - 30 * Math.sin(vAng)} size={42} fill="#00C" anchor="middle" />
      <text x={vx + 70 * Math.cos(vAng)} y={vy - 70 * Math.sin(vAng) + 10} textAnchor="middle" fontSize="34" fontStyle="italic" fill="#00C" fontFamily={SERIF}>m</text>
      {/* 向心加速度（绿） */}
      <line x1={tipX} y1={tipY} x2={ax} y2={ay} stroke="#0A0" strokeWidth="6" />
      <polygon
        points={`${ax},${ay} ${ax + 20 * Math.cos(ph) + 10 * Math.cos(vAng)},${ay - 20 * Math.sin(ph) - 10 * Math.sin(vAng)} ${ax + 20 * Math.cos(ph) - 10 * Math.cos(vAng)},${ay - 20 * Math.sin(ph) + 10 * Math.sin(vAng)}`}
        fill="#0A0" />
      <Vec ch="a" x={ax - 40 * Math.cos(ph)} y={ay + 40 * Math.sin(ph)} size={42} fill="#0A0" anchor="middle" />
      <text x={ax - 62 * Math.cos(ph)} y={ay + 62 * Math.sin(ph) + 8} textAnchor="middle" fontSize="32" fontStyle="italic" fill="#0A0" fontFamily={SERIF}>n</text>
      <AngleArc O={O} r={95} a0={0} a1={ph} label="ωt+φ" color="#C000C0" lsize={30} />
      <OmegaArrow cx={O[0]} cy={O[1]} r={Rr + 55} a0={-0.5} a1={-1.4} />
      <rect x={O[0] - 250} y={O[1] + Rr + 55} width="500" height="90" fill="#fff" stroke="#C000C0" strokeWidth="3" />
      <text x={O[0]} y={O[1] + Rr + 114} textAnchor="middle" fontSize="42" fontStyle="italic" fontFamily={SERIF}>x = A cos( ωt + φ )</text>
    </svg>
  )
}

/** 9-2 第 5 页：用旋转矢量画 x-t 图（动画）。
    左图是旋转矢量整体逆时针转过 90°：x 轴竖直向上，矢量从 +x 方向起逆时针转动；
    末端到水平轴的距离即为位移 x，随时间逐点描到右侧 x-t 坐标系。 */
export function RotvecXt({ t = 0 }: { t?: number }) {
  const ph = (t * (2 * Math.PI / 8)) % (2 * Math.PI)  // 8s 一圈，φ=0
  const O: [number, number] = [300, 470], Rr = 210
  // 矢量末端：从竖直方向起逆时针 → 水平偏移 -R sinφ，高度 -R cosφ
  const tipX = O[0] - Rr * Math.sin(ph), tipY = O[1] - Rr * Math.cos(ph)
  const ux = -Math.sin(ph), uy = -Math.cos(ph)  // 矢量方向单位向量
  const pxv = Math.cos(ph), pyv = -Math.sin(ph) // 垂直方向
  // x-t 图：横轴 gx0..gx0+gT 对应 0..T，位移与圆共用同一高度
  const gx0 = 640, gT = 620, gy = 470, gA = 210
  const curX = gx0 + (ph / (2 * Math.PI)) * gT
  // 只生成已转过部分的曲线点（代替 clip，兼容所有渲染路径）
  const N = Math.max(2, Math.ceil((ph / (2 * Math.PI)) * 160))
  const pts: string[] = []
  for (let i = 0; i <= N; i++) {
    const u = (i / N) * ph
    pts.push(`${gx0 + (u / (2 * Math.PI)) * gT},${gy - gA * Math.cos(u)}`)
  }
  const ticks: Array<[number, string]> = [[0.25, 'T/4'], [0.5, 'T/2'], [0.75, '3T/4'], [1, 'T']]
  return (
    <svg viewBox="0 0 1350 940" width="100%" height="100%">
      <rect x="6" y="6" width="1338" height="928" fill="#fff" stroke="#4a7c8c" strokeWidth="3" />
      <text x="520" y="90" textAnchor="middle" fontSize="52" fontStyle="italic" fontFamily={SERIF}>x = A cos( ωt + φ )　　φ = 0</text>
      {/* 左：参考圆（x 轴竖直） */}
      <circle cx={O[0]} cy={O[1]} r={Rr} fill="none" stroke="#111" strokeWidth="4" />
      <line x1={O[0] - Rr - 60} y1={O[1]} x2={O[0] + Rr + 60} y2={O[1]} stroke="#666" strokeWidth="3" strokeDasharray="12 9" />
      <line x1={O[0]} y1={O[1] - Rr - 60} x2={O[0]} y2={O[1] + Rr + 60} stroke="#111" strokeWidth="4" />
      <polygon points={`${O[0]},${O[1] - Rr - 60} ${O[0] - 9},${O[1] - Rr - 34} ${O[0] + 9},${O[1] - Rr - 34}`} fill="#111" />
      <text x={O[0] + 16} y={O[1] - Rr - 70} fontSize="38" fontStyle="italic" fontFamily={SERIF}>x</text>
      <text x={O[0] - 26} y={O[1] + 56} fontSize="44" fontStyle="italic" fontFamily={SERIF}>O</text>
      {/* 矢量 */}
      <line x1={O[0]} y1={O[1]} x2={tipX} y2={tipY} stroke="#E00" strokeWidth="7" />
      <polygon
        points={`${tipX},${tipY} ${tipX - 22 * ux + 11 * pxv},${tipY - 22 * uy + 11 * pyv} ${tipX - 22 * ux - 11 * pxv},${tipY - 22 * uy - 11 * pyv}`}
        fill="#E00" />
      <text x={tipX + 34 * ux} y={tipY + 34 * uy + 12} textAnchor="middle" fontSize="44" fontStyle="italic" fill="#E00" fontFamily={SERIF}>A</text>
      <OmegaArrow cx={O[0]} cy={O[1]} r={Rr + 45} a0={Math.PI - 0.7} a1={Math.PI - 1.6} size={38} />
      {/* 右：x-t 坐标系 */}
      <line x1={gx0} y1="200" x2={gx0} y2="800" stroke="#111" strokeWidth="4" />
      <polygon points={`${gx0},200 ${gx0 - 9},226 ${gx0 + 9},226`} fill="#111" />
      <text x={gx0 + 14} y="190" fontSize="38" fontStyle="italic" fontFamily={SERIF}>x</text>
      <line x1={gx0} y1={gy} x2={gx0 + gT + 60} y2={gy} stroke="#111" strokeWidth="4" />
      <polygon points={`${gx0 + gT + 60},${gy} ${gx0 + gT + 34},${gy - 9} ${gx0 + gT + 34},${gy + 9}`} fill="#111" />
      <text x={gx0 + gT + 40} y={gy - 20} fontSize="38" fontStyle="italic" fontFamily={SERIF}>t</text>
      <text x={gx0 - 50} y={gy - gA + 14} fontSize="40" fontStyle="italic" fill="#E00" fontFamily={SERIF}>A</text>
      <text x={gx0 - 60} y={gy + gA + 14} fontSize="40" fontStyle="italic" fill="#E00" fontFamily={SERIF}>−A</text>
      <text x={gx0 - 46} y={gy + 14} fontSize="38" fontStyle="italic" fontFamily={SERIF}>O</text>
      {ticks.map(([f, lab]) => (
        <text key={lab} x={gx0 + f * gT} y={gy + 60} textAnchor="middle" fontSize="34" fontStyle="italic" fontFamily={SERIF}>{lab}</text>
      ))}
      <line x1={gx0} y1={gy - gA} x2={gx0 + gT} y2={gy - gA} stroke="#999" strokeWidth="2.5" strokeDasharray="10 8" />
      <line x1={gx0} y1={gy + gA} x2={gx0 + gT} y2={gy + gA} stroke="#999" strokeWidth="2.5" strokeDasharray="10 8" />
      {/* 已描出的曲线（随相位增长） */}
      <polyline points={pts.join(' ')} fill="none" stroke="#E00" strokeWidth="6" />
      {/* 投影连线：矢量末端 → 曲线当前点（同一高度） */}
      <line x1={tipX} y1={tipY} x2={curX} y2={tipY} stroke="#C000C0" strokeWidth="3.5" strokeDasharray="12 9" />
      <circle cx={tipX} cy={tipY} r="12" fill="#E00" />
      <circle cx={curX} cy={tipY} r="12" fill="#E00" />
    </svg>
  )
}

/** 9-2 第 7 页：a→b 状态与相位差（静态双图） */
export function PhaseAB() {
  // 左：x-t 曲线，a 在 A，b 在 A/2 下行处
  const gx0 = 200, gy = 380, gA = 200, gT = 560
  const pts: string[] = []
  for (let i = 0; i <= 200; i++) {
    const u = (i / 200) * 2.4 * Math.PI
    pts.push(`${gx0 + (u / (2.4 * Math.PI)) * gT * 1.2},${gy - gA * Math.cos(u)}`)
  }
  const bx = gx0 + (1 / 6) * gT  // 相位 π/3 对应 t=T/6
  // 右：参考圆双矢量
  const O: [number, number] = [1170, 380], Rr = 240
  const angB = Math.PI / 3
  return (
    <svg viewBox="0 0 1640 760" width="100%" height="100%">
      <rect x="6" y="6" width="1628" height="748" fill="#fff" stroke="#4a7c8c" strokeWidth="3" />
      {/* 左图坐标 */}
      <line x1={gx0} y1="80" x2={gx0} y2="660" stroke="#111" strokeWidth="4" />
      <polygon points={`${gx0},80 ${gx0 - 9},106 ${gx0 + 9},106`} fill="#111" />
      <text x={gx0 - 50} y="110" fontSize="44" fontStyle="italic" fontFamily={SERIF}>x</text>
      <line x1={gx0} y1={gy} x2={gx0 + gT + 160} y2={gy} stroke="#111" strokeWidth="4" />
      <polygon points={`${gx0 + gT + 160},${gy} ${gx0 + gT + 134},${gy - 9} ${gx0 + gT + 134},${gy + 9}`} fill="#111" />
      <text x={gx0 + gT + 130} y={gy - 24} fontSize="44" fontStyle="italic" fontFamily={SERIF}>t</text>
      <text x={gx0 - 60} y={gy - gA + 16} fontSize="42" fontStyle="italic" fontFamily={SERIF}>A</text>
      <text x={gx0 - 80} y={gy - gA / 2 + 14} fontSize="38" fontStyle="italic" fontFamily={SERIF}>A/2</text>
      <text x={gx0 - 56} y={gy + 16} fontSize="42" fontStyle="italic" fontFamily={SERIF}>O</text>
      <text x={gx0 - 70} y={gy + gA + 16} fontSize="42" fontStyle="italic" fontFamily={SERIF}>−A</text>
      <line x1={gx0} y1={gy - gA} x2={gx0 + gT + 100} y2={gy - gA} stroke="#99F" strokeWidth="3" strokeDasharray="10 8" />
      <line x1={gx0} y1={gy - gA / 2} x2={gx0 + gT + 100} y2={gy - gA / 2} stroke="#99F" strokeWidth="3" strokeDasharray="10 8" />
      <line x1={gx0} y1={gy + gA} x2={gx0 + gT + 100} y2={gy + gA} stroke="#99F" strokeWidth="3" strokeDasharray="10 8" />
      <polyline points={pts.join(' ')} fill="none" stroke="#E00" strokeWidth="6" />
      {/* a、b 点 */}
      <circle cx={gx0} cy={gy - gA} r="12" fill="#111" />
      <text x={gx0 - 8} y={gy - gA - 26} fontSize="44" fontStyle="italic" fontFamily={SERIF}>a</text>
      <circle cx={bx} cy={gy - gA / 2} r="12" fill="#111" />
      <text x={bx + 20} y={gy - gA / 2 - 20} fontSize="44" fontStyle="italic" fontFamily={SERIF}>b</text>
      {/* b 点速度箭头（向下） */}
      <line x1={bx + 60} y1={gy - gA / 2} x2={bx + 60} y2={gy + 60} stroke="#C000C0" strokeWidth="7" />
      <polygon points={`${bx + 60},${gy + 60} ${bx + 48},${gy + 32} ${bx + 72},${gy + 32}`} fill="#C000C0" />
      <Vec ch="v" x={bx + 66} y={gy + 130} size={44} fill="#C000C0" anchor="middle" />
      {/* 右图：参考圆 */}
      <circle cx={O[0]} cy={O[1]} r={Rr} fill="none" stroke="#33F" strokeWidth="5" strokeDasharray="18 12" />
      <line x1={O[0] - Rr - 120} y1={O[1]} x2={O[0] + Rr + 120} y2={O[1]} stroke="#111" strokeWidth="4" />
      <polygon points={`${O[0] + Rr + 120},${O[1]} ${O[0] + Rr + 94},${O[1] - 9} ${O[0] + Rr + 94},${O[1] + 9}`} fill="#111" />
      <text x={O[0] + Rr + 100} y={O[1] + 56} fontSize="44" fontStyle="italic" fontFamily={SERIF}>x</text>
      <text x={O[0] + Rr + 16} y={O[1] + 60} fontSize="42" fontStyle="italic" fill="#E00" fontFamily={SERIF}>A</text>
      <text x={O[0] - Rr - 70} y={O[1] + 60} fontSize="42" fontStyle="italic" fill="#E00" fontFamily={SERIF}>−A</text>
      <text x={O[0] - 90} y={O[1] + 60} fontSize="48" fontStyle="italic" fontFamily={SERIF}>O</text>
      <RotArrow O={O} ang={0} len={Rr} label="" />
      <text x={O[0] + Rr - 60} y={O[1] + 60} fontSize="42" fontStyle="italic" fill="#E60" fontFamily={SERIF}>tᴀ</text>
      <RotArrow O={O} ang={angB} len={Rr} label="" color="#C000C0" />
      <text x={O[0] + (Rr + 50) * Math.cos(angB)} y={O[1] - (Rr + 50) * Math.sin(angB) + 12} fontSize="42" fontStyle="italic" fill="#C000C0" fontFamily={SERIF}>t_b</text>
      <line x1={O[0] + Rr * Math.cos(angB)} y1={O[1] - Rr * Math.sin(angB)} x2={O[0] + Rr * Math.cos(angB)} y2={O[1]}
        stroke="#C000C0" strokeWidth="3.5" strokeDasharray="10 8" />
      <text x={O[0] + Rr * Math.cos(angB)} y={O[1] + 60} textAnchor="middle" fontSize="38" fontStyle="italic" fill="#C000C0" fontFamily={SERIF}>A/2</text>
      <AngleArc O={O} r={120} a0={0} a1={angB} label="Δφ" color="#0A0" lsize={44} />
      <OmegaArrow cx={O[0]} cy={O[1]} r={Rr + 55} a0={-0.4} a1={-1.3} />
    </svg>
  )
}

/** 9-2 第 9 页：三条相位关系波形（同步/反相/一般，静态） */
export function PhaseWaves() {
  const panel = (x0: number, dphi: number) => {
    const w = 460, gy = 380, gA = 150
    const mk = (off: number, color: string) => {
      const pts: string[] = []
      for (let i = 0; i <= 120; i++) {
        const u = (i / 120) * 2.2 * Math.PI
        pts.push(`${x0 + 50 + (u / (2.2 * Math.PI)) * (w - 90)},${gy - gA * Math.sin(u + off)}`)
      }
      return <polyline points={pts.join(' ')} fill="none" stroke={color} strokeWidth="6" />
    }
    return (
      <g>
        <rect x={x0} y="20" width={w} height="700" fill="#fff" stroke="#2E8B57" strokeWidth="3" />
        <line x1={x0 + 50} y1="130" x2={x0 + 50} y2="640" stroke="#111" strokeWidth="3.5" />
        <polygon points={`${x0 + 50},130 ${x0 + 41},156 ${x0 + 59},156`} fill="#111" />
        <text x={x0 + 60} y="120" fontSize="38" fontStyle="italic" fontFamily={SERIF}>x</text>
        <line x1={x0 + 50} y1={gy} x2={x0 + w - 40} y2={gy} stroke="#111" strokeWidth="3.5" />
        <polygon points={`${x0 + w - 40},${gy} ${x0 + w - 66},${gy - 9} ${x0 + w - 66},${gy + 9}`} fill="#111" />
        <text x={x0 + w - 66} y={gy - 22} fontSize="38" fontStyle="italic" fontFamily={SERIF}>t</text>
        <text x={x0 + 6} y={gy + 14} fontSize="38" fontStyle="italic" fontFamily={SERIF}>O</text>
        {mk(0, '#E00')}
        {mk(dphi, '#00C')}
      </g>
    )
  }
  return (
    <svg viewBox="0 0 1560 740" width="100%" height="100%">
      {panel(10, 0)}
      {panel(550, Math.PI)}
      {panel(1090, Math.PI * 0.6)}
    </svg>
  )
}

/** 9-2 例题公共：x 轴刻度与小球（静态） */
export function ExampleAxis({ ballX = 0.04, showV = true }: { ballX?: number; showV?: boolean; t?: number }) {
  // 数值 -0.08..0.08 映射到像素 260..1380
  const px = (v: number) => 820 + (v / 0.08) * 560
  return (
    <svg viewBox="0 0 1640 420" width="100%" height="100%">
      <rect x="6" y="6" width="1628" height="408" fill="#fff" stroke="#4a7c8c" strokeWidth="3" />
      {showV && (
        <g>
          <line x1={px(ballX) + 30} y1="120" x2={px(ballX) - 260} y2="120" stroke="#E00" strokeWidth="7" />
          <polygon points={`${px(ballX) - 260},120 ${px(ballX) - 226},106 ${px(ballX) - 226},134`} fill="#E00" />
          <text x={px(ballX) - 300} y="112" fontSize="52" fontStyle="italic" fill="#E00" fontFamily={SERIF}>v</text>
        </g>
      )}
      <line x1="180" y1="250" x2="1500" y2="250" stroke="#111" strokeWidth="4" />
      <polygon points="1500,250 1470,240 1470,260" fill="#111" />
      <text x="1520" y="242" fontSize="44" fontStyle="italic" fontFamily={SERIF}>x / m</text>
      {[-0.08, -0.04, 0, 0.04, 0.08].map(v => (
        <g key={v}>
          <line x1={px(v)} y1="222" x2={px(v)} y2="250" stroke="#111" strokeWidth="4" />
          <text x={px(v)} y="330" textAnchor="middle" fontSize="44" fontStyle="italic" fontFamily={SERIF}>
            {v === 0 ? 'O' : (v < 0 ? '− ' : '') + Math.abs(v).toFixed(2)}
          </text>
        </g>
      ))}
      <circle cx={px(ballX)} cy="250" r="34" fill="url(#ballg)" />
    </svg>
  )
}

/** 9-2 第 11 页：定初相 φ=π/3（静态） */
export function RotvecPhi() {
  const px = (v: number) => 500 + (v / 0.08) * 460
  const O: [number, number] = [px(0), 620], len = 380, ang = Math.PI / 3
  return (
    <svg viewBox="0 0 1100 760" width="100%" height="100%">
      <rect x="6" y="6" width="1088" height="748" fill="#fff" stroke="#4a7c8c" strokeWidth="3" />
      <line x1="60" y1={O[1]} x2="1040" y2={O[1]} stroke="#111" strokeWidth="4" />
      <polygon points={`1040,${O[1]} 1010,${O[1] - 10} 1010,${O[1] + 10}`} fill="#111" />
      <text x="1010" y={O[1] - 30} fontSize="42" fontStyle="italic" fontFamily={SERIF}>x / m</text>
      {[-0.08, -0.04, 0, 0.04, 0.08].map(v => (
        <g key={v}>
          <line x1={px(v)} y1={O[1] - 26} x2={px(v)} y2={O[1]} stroke="#111" strokeWidth="4" />
          <text x={px(v)} y={O[1] + 70} textAnchor="middle" fontSize="42" fontStyle="italic" fontFamily={SERIF}>
            {v === 0 ? 'O' : (v < 0 ? '− ' : '') + Math.abs(v).toFixed(2)}
          </text>
        </g>
      ))}
      <RotArrow O={O} ang={ang} len={len} label="A" />
      <line x1={O[0] + len * Math.cos(ang)} y1={O[1] - len * Math.sin(ang)} x2={O[0] + len * Math.cos(ang)} y2={O[1]}
        stroke="#E00" strokeWidth="4" strokeDasharray="12 9" />
      <AngleArc O={O} r={110} a0={0} a1={ang} label="π/3" color="#0A0" lsize={42} />
      <OmegaArrow cx={O[0]} cy={O[1]} r={len + 45} a0={-0.9} a1={-1.8} size={44} />
    </svg>
  )
}

/** 9-2 第 15 页：法二 双矢量（静态） */
export function RotvecTwo() {
  const px = (v: number) => 640 + (v / 0.08) * 420
  const O: [number, number] = [px(0), 640], len = 400
  const a1 = Math.PI / 3, a2 = 2 * Math.PI / 3
  return (
    <svg viewBox="0 0 1280 820" width="100%" height="100%">
      <rect x="6" y="6" width="1268" height="808" fill="#fff" stroke="#4a7c8c" strokeWidth="3" />
      <line x1="60" y1={O[1]} x2="1220" y2={O[1]} stroke="#111" strokeWidth="4" />
      <polygon points={`1220,${O[1]} 1190,${O[1] - 10} 1190,${O[1] + 10}`} fill="#111" />
      <text x="1150" y={O[1] - 30} fontSize="42" fontStyle="italic" fontFamily={SERIF}>x / m</text>
      {[-0.08, -0.04, 0, 0.04, 0.08].map(v => (
        <g key={v}>
          <line x1={px(v)} y1={O[1] - 26} x2={px(v)} y2={O[1]} stroke="#111" strokeWidth="4" />
          <text x={px(v)} y={O[1] + 70} textAnchor="middle" fontSize="42" fontStyle="italic" fontFamily={SERIF}>
            {v === 0 ? 'O' : (v < 0 ? '− ' : '') + Math.abs(v).toFixed(2)}
          </text>
        </g>
      ))}
      {/* 起始矢量（+π/3）与 t 时刻矢量（+2π/3） */}
      <RotArrow O={O} ang={a1} len={len} label="" />
      <RotArrow O={O} ang={a2} len={len} label="" />
      {[a1, a2].map(a => (
        <line key={a} x1={O[0] + len * Math.cos(a)} y1={O[1] - len * Math.sin(a)}
          x2={O[0] + len * Math.cos(a)} y2={O[1]} stroke="#E00" strokeWidth="3.5" strokeDasharray="10 8" />
      ))}
      <AngleArc O={O} r={100} a0={0} a1={a1} label="π/3" color="#0A0" lsize={38} />
      <AngleArc O={O} r={100} a0={a2} a1={Math.PI} label="π/3" color="#0A0" lsize={38} />
      <AngleArc O={O} r={len + 60} a0={a1} a1={a2} label="ωt" color="#00C" lsize={44} />
      <OmegaArrow cx={O[0]} cy={O[1]} r={len + 110} a0={-0.5} a1={-1.3} size={42} />
      {/* 标注牌 */}
      <rect x={px(0.04) + 60} y="60" width="280" height="80" fill="#CCFFCC" stroke="#2E8B57" strokeWidth="3" />
      <text x={px(0.04) + 200} y="114" textAnchor="middle" fontSize="40" fontFamily={HEI}>起始时刻</text>
      <line x1={px(0.04) + 130} y1="140" x2={O[0] + len * Math.cos(a1) + 10} y2={O[1] - len * Math.sin(a1) - 10}
        stroke="#2E8B57" strokeWidth="3" />
      <rect x={px(-0.04) - 340} y="60" width="240" height="80" fill="#CCFFCC" stroke="#2E8B57" strokeWidth="3" />
      <text x={px(-0.04) - 220} y="114" textAnchor="middle" fontSize="40" fontFamily={HEI}>t 时刻</text>
      <line x1={px(-0.04) - 160} y1="140" x2={O[0] + len * Math.cos(a2) - 10} y2={O[1] - len * Math.sin(a2) - 10}
        stroke="#2E8B57" strokeWidth="3" />
    </svg>
  )
}

/* ================= 9-3 单摆和复摆 ================= */

/** 物理箭头通用件：带三角箭头的直线（屏幕坐标，y 向下） */
function Arrow({ x1, y1, x2, y2, color = '#E00', w = 7 }: {
  x1: number; y1: number; x2: number; y2: number; color?: string; w?: number
}) {
  const a = Math.atan2(y2 - y1, x2 - x1)
  const p = a + Math.PI / 2
  const xb = x2 - 26 * Math.cos(a), yb = y2 - 26 * Math.sin(a)
  return (
    <g>
      <line x1={x1} y1={y1} x2={xb} y2={yb} stroke={color} strokeWidth={w} />
      <polygon
        points={`${x2},${y2} ${xb + 12 * Math.cos(p)},${yb + 12 * Math.sin(p)} ${xb - 12 * Math.cos(p)},${yb - 12 * Math.sin(p)}`}
        fill={color} />
    </g>
  )
}

/** 采样圆弧折线（屏幕坐标：0=正右，π/2=正下）——避开 SVG arc 的 sweep 标志坑 */
function ArcLine({ cx, cy, r, a0, a1, color = '#0A0', w = 5, dash }: {
  cx: number; cy: number; r: number; a0: number; a1: number; color?: string; w?: number; dash?: string
}) {
  const n = 18
  const pts: string[] = []
  for (let i = 0; i <= n; i++) {
    const a = a0 + ((a1 - a0) * i) / n
    pts.push(`${cx + r * Math.cos(a)},${cy + r * Math.sin(a)}`)
  }
  return <polyline points={pts.join(' ')} fill="none" stroke={color} strokeWidth={w} strokeDasharray={dash} />
}

/** 采样圆弧 + 末端箭头（转动方向指示） */
function ArcArrow({ cx, cy, r, a0, a1, color = '#C00', w = 6 }: {
  cx: number; cy: number; r: number; a0: number; a1: number; color?: string; w?: number
}) {
  const n = 18
  const pts: [number, number][] = []
  for (let i = 0; i <= n; i++) {
    const a = a0 + ((a1 - a0) * i) / n
    pts.push([cx + r * Math.cos(a), cy + r * Math.sin(a)])
  }
  const [hx, hy] = pts[n]
  const da = Math.atan2(hy - pts[n - 1][1], hx - pts[n - 1][0])
  const p = da + Math.PI / 2
  const xb = hx - 24 * Math.cos(da), yb = hy - 24 * Math.sin(da)
  return (
    <g>
      <polyline points={pts.map(q => q.join(',')).join(' ')} fill="none" stroke={color} strokeWidth={w} />
      <polygon
        points={`${hx},${hy} ${xb + 12 * Math.cos(p)},${yb + 12 * Math.sin(p)} ${xb - 12 * Math.cos(p)},${yb - 12 * Math.sin(p)}`}
        fill={color} />
    </g>
  )
}

/** 9-3 第 1、2 页：单摆（摆球随主时钟小角摆动；悬点 A、平衡位置 O、θ、l、F_T、P、J=ml²） */
export function PendulumAnim({ t = 0 }: { t?: number }) {
  const A: [number, number] = [470, 110]
  const L = 520
  const th = 0.5 * Math.cos((2 * Math.PI / 4.5) * t)  // 4.5s 一个周期
  const bx = A[0] + L * Math.sin(th)
  const by = A[1] + L * Math.cos(th)
  const eqY = A[1] + L
  const ux = (A[0] - bx) / L, uy = (A[1] - by) / L  // 摆球 → 悬点方向
  return (
    <svg viewBox="0 0 940 880" width="100%" height="100%">
      <rect x="6" y="6" width="928" height="868" fill="#fff" stroke="#4a7c8c" strokeWidth="3" />
      <Hatch id="pd-h" />
      {/* 天花板与悬点 A */}
      <rect x={A[0] - 150} y="58" width="300" height="40" fill="url(#pd-h)" stroke="#555" strokeWidth="2" />
      <circle cx={A[0]} cy={A[1]} r="10" fill="#111" />
      <text x={A[0] - 78} y={A[1] + 64} fontSize="52" fontStyle="italic" fontFamily={SERIF}>A</text>
      {/* 转动正向 */}
      <ArcArrow cx={A[0] + 200} cy={180} r={70} a0={-0.5} a1={-1.9} />
      <text x={A[0] + 285} y="160" fontSize="42" fontFamily={HEI}>转动正向</text>
      {/* 平衡位置：竖直虚线 + 小球 O */}
      <line x1={A[0]} y1={A[1]} x2={A[0]} y2={eqY + 8} stroke="#111" strokeWidth="5" strokeDasharray="16 12" />
      <ellipse cx={A[0]} cy={eqY} rx="30" ry="26" fill="#F4A7A7" stroke="#C00" strokeWidth="2" />
      <text x={A[0]} y={eqY + 92} textAnchor="middle" fontSize="54" fontStyle="italic" fontFamily={SERIF}>O</text>
      {/* 摆动轨迹（虚线弧） */}
      <ArcLine cx={A[0]} cy={A[1]} r={L} a0={Math.PI / 2 - 0.62} a1={Math.PI / 2 + 0.62} color="#33F" w={4} dash="18 12" />
      {/* 摆绳与摆长标注 l */}
      <line x1={A[0]} y1={A[1]} x2={bx} y2={by} stroke="#22C" strokeWidth="6" />
      <text x={(A[0] + bx) / 2 + 52} y={(A[1] + by) / 2 - 8} fontSize="52" fontStyle="italic" fill="#22C" fontFamily={SERIF}>l</text>
      {/* θ 角弧（竖直虚线与摆绳之间） */}
      <ArcLine cx={A[0]} cy={A[1]} r={130} a0={Math.PI / 2 - th} a1={Math.PI / 2} color="#0A0" w={5} />
      <text x={A[0] + 172 * Math.sin(th / 2)} y={A[1] + 172 * Math.cos(th / 2) + 16}
        textAnchor="middle" fontSize="48" fontStyle="italic" fill="#0A0" fontFamily={SERIF}>θ</text>
      {/* 摆球（红）+ m */}
      <radialGradient id="pd-ball" cx="0.35" cy="0.35" r="0.9">
        <stop offset="0%" stopColor="#ff8a8a" />
        <stop offset="60%" stopColor="#cc0000" />
        <stop offset="100%" stopColor="#6b0000" />
      </radialGradient>
      <ellipse cx={bx} cy={by} rx="34" ry="30" fill="url(#pd-ball)" />
      <text x={bx + 64} y={by + 8} fontSize="52" fontStyle="italic" fontFamily={SERIF}>m</text>
      {/* F_T（沿绳指向悬点，标签在绳内侧）与 P（竖直向下） */}
      <Arrow x1={bx + ux * 32} y1={by + uy * 32} x2={bx + ux * 200} y2={by + uy * 200} color="#E00" w={6} />
      <Vec ch="F" x={bx + ux * 235 + uy * 48} y={by + uy * 235 - ux * 48 + 14} size={46} fill="#E00" anchor="middle" />
      <text x={bx + ux * 235 + uy * 48 + 24} y={by + uy * 235 - ux * 48 + 30} fontSize="28" fontStyle="italic" fill="#E00" fontFamily={SERIF}>T</text>
      <Arrow x1={bx} y1={by + 34} x2={bx} y2={by + 220} color="#C000C0" w={6} />
      <Vec ch="P" x={bx + 46} y={by + 246} size={50} fill="#C000C0" />
      {/* J = ml² */}
      <text x="110" y="820" fontSize="50" fontStyle="italic" fontFamily={SERIF}>J = ml²</text>
    </svg>
  )
}

/** 9-3 第 3、4 页：复摆（任意刚体绕 O 轴摆动，C 为质心，OC = l，θ、P） */
export function CompoundPendulum() {
  const O: [number, number] = [400, 330]
  const C: [number, number] = [600, 520]
  const ocA = Math.atan2(C[1] - O[1], C[0] - O[0])
  const midA = (Math.PI / 2 + ocA) / 2
  return (
    <svg viewBox="0 0 940 880" width="100%" height="100%">
      <rect x="6" y="6" width="928" height="868" fill="#fff" stroke="#4a7c8c" strokeWidth="3" />
      {/* 转动正向 */}
      <ArcArrow cx={O[0] - 10} cy={O[1] - 50} r={105} a0={-2.7} a1={-1.5} />
      <text x={O[0] + 120} y={O[1] - 160} fontSize="44" fontFamily={HEI}>转动正向</text>
      {/* 刚体（不规则形状） */}
      <path d="M 400 240 C 330 240 285 300 285 370 C 285 450 340 520 420 570
               C 500 620 610 640 690 600 C 760 565 795 490 785 410
               C 775 330 700 270 610 250 C 530 232 460 240 400 240 Z"
        fill="#DCEAF5" stroke="#2F7D5B" strokeWidth="5" />
      {/* O 悬点与竖直虚线 */}
      <circle cx={O[0]} cy={O[1]} r="12" fill="#111" />
      <text x={O[0] - 68} y={O[1] + 12} fontSize="56" fontWeight="bold" fontStyle="italic" fontFamily={SERIF}>O</text>
      <line x1={O[0]} y1={O[1]} x2={O[0]} y2="810" stroke="#111" strokeWidth="5" strokeDasharray="16 12" />
      {/* OC 连线与 l、θ */}
      <line x1={O[0]} y1={O[1]} x2={C[0]} y2={C[1]} stroke="#0A0" strokeWidth="6" />
      <text x={(O[0] + C[0]) / 2 + 48} y={(O[1] + C[1]) / 2 - 28} fontSize="52" fontStyle="italic" fill="#0A0" fontFamily={SERIF}>l</text>
      <ArcLine cx={O[0]} cy={O[1]} r={110} a0={ocA} a1={Math.PI / 2} color="#C000C0" w={5} />
      <text x={O[0] + 152 * Math.cos(midA)} y={O[1] + 152 * Math.sin(midA) + 16}
        textAnchor="middle" fontSize="48" fontStyle="italic" fill="#C000C0" fontFamily={SERIF}>θ</text>
      {/* 质心 C 与重力 P */}
      <circle cx={C[0]} cy={C[1]} r="10" fill="#111" />
      <text x={C[0] + 36} y={C[1] - 18} fontSize="56" fontWeight="bold" fontStyle="italic" fontFamily={SERIF}>C</text>
      <Arrow x1={C[0]} y1={C[1] + 10} x2={C[0]} y2={C[1] + 200} color="#E00" w={7} />
      <Vec ch="P" x={C[0] + 44} y={C[1] + 230} size={50} fill="#E00" />
      <text x="470" y="850" textAnchor="middle" fontSize="44" fontFamily={HEI}>（ C 点为质心 ）</text>
    </svg>
  )
}

/** 9-3 第 5–7 页例题：匀质球沿固定球壳内表面纯滚动（O 壳心、C 球心、R、r、θ、F_N、F、mg） */
export function RollingBall() {
  const O: [number, number] = [470, 150]
  const R = 560, rb = 70
  const th = 0.56
  const d = R - rb
  const ux = Math.sin(th), uy = Math.cos(th)  // O → C 方向
  const C: [number, number] = [O[0] + d * ux, O[1] + d * uy]
  const ct: [number, number] = [O[0] + R * ux, O[1] + R * uy]  // 接触点
  const tx = -uy, ty = ux  // 切线方向（沿表面指向平衡位置一侧）
  return (
    <svg viewBox="0 0 940 900" width="100%" height="100%">
      <rect x="6" y="6" width="928" height="888" fill="#FDFBFF" stroke="#7030A0" strokeWidth="3" />
      {/* 球壳内表面（大圆弧） */}
      <ArcLine cx={O[0]} cy={O[1]} r={R} a0={Math.PI / 2 - 1.05} a1={Math.PI / 2 + 1.05} color="#22C" w={6} />
      {/* O 与竖直虚线 */}
      <circle cx={O[0]} cy={O[1]} r="12" fill="#111" />
      <text x={O[0] + 28} y={O[1] - 22} fontSize="54" fontStyle="italic" fontFamily={SERIF}>O</text>
      <line x1={O[0]} y1={O[1]} x2={O[0]} y2={O[1] + R + 30} stroke="#111" strokeWidth="5" strokeDasharray="16 12" />
      {/* R（O → 接触点连线） */}
      <line x1={O[0]} y1={O[1]} x2={ct[0]} y2={ct[1]} stroke="#111" strokeWidth="4" />
      <text x={O[0] + R * 0.55 * ux - 100} y={O[1] + R * 0.55 * uy + 10} fontSize="52" fontStyle="italic" fontFamily={SERIF}>R</text>
      {/* θ 角弧 */}
      <ArcLine cx={O[0]} cy={O[1]} r={130} a0={Math.PI / 2 - th} a1={Math.PI / 2} color="#0A0" w={5} />
      <text x={O[0] + 162 * Math.sin(th / 2) - 24} y={O[1] + 162 * Math.cos(th / 2) + 14}
        textAnchor="middle" fontSize="48" fontStyle="italic" fill="#0A0" fontFamily={SERIF}>θ</text>
      {/* 支持力 F_N（C → O 方向，沿半径线外移 25px 避免与 R 线重叠） */}
      <Arrow x1={C[0] - ux * (rb + 6) + uy * 25} y1={C[1] - uy * (rb + 6) - ux * 25}
        x2={C[0] - ux * (rb + 180) + uy * 25} y2={C[1] - uy * (rb + 180) - ux * 25} color="#E00" w={6} />
      <Vec ch="F" x={C[0] - ux * (rb + 222) + uy * 55} y={C[1] - uy * (rb + 222) - ux * 55 + 12} size={46} fill="#E00" anchor="middle" />
      <text x={C[0] - ux * (rb + 222) + uy * 55 + 24} y={C[1] - uy * (rb + 222) - ux * 55 + 30} fontSize="28" fontStyle="italic" fill="#E00" fontFamily={SERIF}>N</text>
      {/* 小球（匀质球，半径 r） */}
      <radialGradient id="rb-g" cx="0.35" cy="0.35" r="0.95">
        <stop offset="0%" stopColor="#dceaff" />
        <stop offset="60%" stopColor="#7fb2f0" />
        <stop offset="100%" stopColor="#3a6fb5" />
      </radialGradient>
      <circle cx={C[0]} cy={C[1]} r={rb} fill="url(#rb-g)" stroke="#335" strokeWidth="2" />
      <line x1={C[0]} y1={C[1]} x2={C[0] + rb * 0.86} y2={C[1] - rb * 0.5} stroke="#111" strokeWidth="4" />
      <text x={C[0] + rb * 0.9} y={C[1] - rb * 0.6} fontSize="46" fontStyle="italic" fontFamily={SERIF}>r</text>
      <text x={C[0] - 90} y={C[1] + 60} fontSize="50" fontStyle="italic" fontFamily={SERIF}>C</text>
      {/* 摩擦力 F（接触点沿切线，略短并起于表面内侧） */}
      <Arrow x1={ct[0] - ux * 8} y1={ct[1] - uy * 8} x2={ct[0] + tx * 140} y2={ct[1] + ty * 140} color="#7030A0" w={6} />
      <Vec ch="F" x={ct[0] + tx * 178} y={ct[1] + ty * 178 + 14} size={46} fill="#7030A0" anchor="middle" />
      {/* 重力 mg（C 竖直向下） */}
      <Arrow x1={C[0]} y1={C[1] + rb} x2={C[0]} y2={C[1] + rb + 180} color="#C000C0" w={6} />
      <Vec ch="mg" x={C[0] + 60} y={C[1] + rb + 206} size={46} fill="#C000C0" />
    </svg>
  )
}

/** 9-4 能量-时间图：上 x-t（红 cos）/ v-t（蓝 −sin），下 Ek（蓝 sin²）/ Ep（红 cos²）/ E（绿线），φ=0 */
export function EnergyT() {
  const W = 640, X0 = 150, per = W / 1.25  // 1.25 个周期
  const xOf = (u: number) => X0 + u * per
  const cos = (u: number) => Math.cos(u * 2 * Math.PI)
  const sin = (u: number) => Math.sin(u * 2 * Math.PI)
  const path = (fn: (u: number) => number, y0: number, amp: number) => {
    const pts: string[] = []
    for (let i = 0; i <= 200; i++) { const u = i / 200 * 1.25; pts.push(`${xOf(u)},${y0 - amp * fn(u)}`) }
    return `M${pts.join(' L')}`
  }
  const Y1 = 265  // 上图零线
  const YE0 = 800, YET = 560  // 下图零线与 E 线高度
  return (
    <svg viewBox="0 0 860 900" width="100%" height="100%">
      <rect x="6" y="6" width="848" height="888" fill="#fff" stroke="#2E8B57" strokeWidth="3" />
      <text x="430" y="70" textAnchor="middle" fontSize="48" fontWeight="bold" fontFamily={HEI}>简谐振动能量图</text>
      {/* 上图：x、v */}
      <text x="60" y="150" fontSize="42" fontStyle="italic" fontFamily={SERIF}>x, v</text>
      <line x1={X0} y1="110" x2={X0} y2="430" stroke="#111" strokeWidth="3.5" />
      <polygon points={`${X0},110 ${X0 - 10},138 ${X0 + 10},138`} fill="#111" />
      <line x1={X0} y1={Y1} x2="830" y2={Y1} stroke="#111" strokeWidth="3.5" />
      <polygon points="830,265 802,255 802,275" fill="#111" />
      <text x="806" y="245" fontSize="40" fontStyle="italic" fontFamily={SERIF}>t</text>
      <text x="70" y="280" fontSize="44" fontStyle="italic" fontFamily={SERIF}>O</text>
      <path d={path(cos, Y1, 95)} fill="none" stroke="#E00" strokeWidth="6" />
      <path d={path((u) => -sin(u), Y1, 95)} fill="none" stroke="#00C" strokeWidth="6" />
      <rect x="560" y="120" width="130" height="52" fill="#FFE0E0" stroke="#E00" strokeWidth="3" />
      <text x="625" y="158" textAnchor="middle" fontSize="36" fontStyle="italic" fontFamily={SERIF}>x − t</text>
      <rect x="700" y="120" width="130" height="52" fill="#E0E8FF" stroke="#00C" strokeWidth="3" />
      <text x="765" y="158" textAnchor="middle" fontSize="36" fontStyle="italic" fontFamily={SERIF}>v − t</text>
      {/* 下图：能量 */}
      <text x="36" y="560" fontSize="44" fontWeight="bold" fontFamily={HEI}>能量</text>
      <line x1={X0} y1="500" x2={X0} y2="850" stroke="#111" strokeWidth="3.5" />
      <polygon points={`${X0},500 ${X0 - 10},528 ${X0 + 10},528`} fill="#111" />
      <line x1={X0} y1={YE0} x2="830" y2={YE0} stroke="#111" strokeWidth="3.5" />
      <polygon points={`830,${YE0} 802,${YE0 - 10} 802,${YE0 + 10}`} fill="#111" />
      <text x="806" y="780" fontSize="40" fontStyle="italic" fontFamily={SERIF}>t</text>
      <text x="86" y="812" fontSize="44" fontStyle="italic" fontFamily={SERIF}>O</text>
      {/* E 绿线（总能量守恒） */}
      <line x1={X0} y1={YET} x2="830" y2={YET} stroke="#0A0" strokeWidth="7" />
      <text x="170" y="546" fontSize="42" fontStyle="italic" fill="#0A0" fontFamily={SERIF}>E</text>
      <path d={path((u) => cos(u) * cos(u), YE0, YE0 - YET)} fill="none" stroke="#E00" strokeWidth="6" />
      <path d={path((u) => sin(u) * sin(u), YE0, YE0 - YET)} fill="none" stroke="#00C" strokeWidth="6" />
      <text x="592" y="620" fontSize="38" fontStyle="italic" fill="#E00" fontFamily={SERIF}>E</text>
      <text x="616" y="652" fontSize="28" fontStyle="italic" fill="#E00" fontFamily={SERIF}>p</text>
      <text x="648" y="756" fontSize="38" fontStyle="italic" fill="#00C" fontFamily={SERIF}>E</text>
      <text x="672" y="788" fontSize="28" fontStyle="italic" fill="#00C" fontFamily={SERIF}>k</text>
      {/* 周期刻度虚线 T/4, T/2, 3T/4, T */}
      {[0.25, 0.5, 0.75, 1].map(u => (
        <g key={u}>
          <line x1={xOf(u)} y1="120" x2={xOf(u)} y2={YE0} stroke="#111" strokeWidth="2.5" strokeDasharray="10 8" />
          <text x={xOf(u)} y="878" textAnchor="middle" fontSize="34" fontStyle="italic" fontFamily={SERIF}>
            {u === 0.25 ? 'T/4' : u === 0.5 ? 'T/2' : u === 0.75 ? '3T/4' : 'T'}
          </text>
        </g>
      ))}
    </svg>
  )
}

/** 9-4 势能曲线：Ep=½kx² 抛物线 + E 绿线 + Ek/Ep 箭头（−A…O…+A，端点 B/C） */
export function EpX() {
  const X0 = 450, Y0 = 640, Apx = 300, kE = 460  // E 线对应高度（Ep(A)）
  const ep = (x: number) => Y0 - kE * (x * x) / (Apx * Apx)
  const pts: string[] = []
  for (let i = 0; i <= 120; i++) { const x = -Apx + i / 120 * 2 * Apx; pts.push(`${X0 + x},${ep(x)}`) }
  const xq = 165  // 取点 x≈0.55A 画 Ek/Ep 箭头
  return (
    <svg viewBox="0 0 900 760" width="100%" height="100%">
      <rect x="6" y="6" width="888" height="748" fill="#fff" stroke="#2E8B57" strokeWidth="3" />
      <text x="450" y="70" textAnchor="middle" fontSize="46" fontWeight="bold" fontFamily={HEI}>简谐运动势能曲线</text>
      {/* 坐标轴 */}
      <line x1={X0} y1="110" x2={X0} y2={Y0} stroke="#111" strokeWidth="3.5" />
      <polygon points={`${X0},110 ${X0 - 10},138 ${X0 + 10},138`} fill="#111" />
      <text x={X0 - 66} y="150" fontSize="42" fontStyle="italic" fontFamily={SERIF}>
        E<tspan dy="14" fontSize="28">p</tspan>
      </text>
      <line x1="100" y1={Y0} x2="840" y2={Y0} stroke="#111" strokeWidth="3.5" />
      <polygon points={`840,${Y0} 812,${Y0 - 10} 812,${Y0 + 10}`} fill="#111" />
      <text x="816" y={Y0 + 52} fontSize="42" fontStyle="italic" fontFamily={SERIF}>x</text>
      {/* E 绿线与端点 B、C */}
      <line x1={X0 - Apx} y1={Y0 - kE} x2={X0 + Apx} y2={Y0 - kE} stroke="#0A0" strokeWidth="7" />
      <circle cx={X0 - Apx} cy={Y0 - kE} r="12" fill="#E00" stroke="#111" strokeWidth="3" />
      <circle cx={X0 + Apx} cy={Y0 - kE} r="12" fill="#E00" stroke="#111" strokeWidth="3" />
      <text x={X0 - Apx - 56} y={Y0 - kE + 14} fontSize="44" fontStyle="italic" fontFamily={SERIF}>C</text>
      <text x={X0 + Apx + 30} y={Y0 - kE + 14} fontSize="44" fontStyle="italic" fontFamily={SERIF}>B</text>
      <text x={X0 + 56} y={Y0 - kE - 16} fontSize="44" fontStyle="italic" fill="#0A0" fontFamily={SERIF}>E</text>
      {/* 抛物线 */}
      <path d={`M${pts.join(' L')}`} fill="none" stroke="#E00" strokeWidth="7" />
      {/* ±A 虚线与刻度 */}
      {[-Apx, Apx].map(x => (
        <g key={x}>
          <line x1={X0 + x} y1={Y0 - kE} x2={X0 + x} y2={Y0} stroke="#00C" strokeWidth="3" strokeDasharray="10 8" />
          <text x={X0 + x} y={Y0 + 58} textAnchor="middle" fontSize="42" fontStyle="italic" fontFamily={SERIF}>
            {x < 0 ? '− A' : '+ A'}
          </text>
        </g>
      ))}
      <text x={X0} y={Y0 + 58} textAnchor="middle" fontSize="42" fontStyle="italic" fontFamily={SERIF}>O</text>
      {/* 取点：投影辅助线（竖直到 x 轴、水平到 Ep 轴）与横坐标 x 刻度 */}
      <line x1={X0 + xq} y1={ep(xq)} x2={X0 + xq} y2={Y0} stroke="#C0C" strokeWidth="3" strokeDasharray="10 8" />
      <line x1={X0} y1={ep(xq)} x2={X0 + xq} y2={ep(xq)} stroke="#C0C" strokeWidth="3" strokeDasharray="10 8" />
      <text x={X0 + xq} y={Y0 + 58} textAnchor="middle" fontSize="42" fontStyle="italic" fill="#C0C" fontFamily={SERIF}>x</text>
      <circle cx={X0 + xq} cy={ep(xq)} r="11" fill="#E00" stroke="#111" strokeWidth="2.5" />
      <Arrow x1={X0 + xq + 40} y1={Y0 - 12} x2={X0 + xq + 40} y2={ep(xq) + 12} color="#E00" w={5} />
      <text x={X0 + xq + 66} y={(Y0 + ep(xq)) / 2 + 14} fontSize="42" fontStyle="italic" fill="#E00" fontFamily={SERIF}>
        E<tspan dy="12" fontSize="28">p</tspan>
      </text>
      <Arrow x1={X0 + xq + 40} y1={ep(xq) - 12} x2={X0 + xq + 40} y2={Y0 - kE + 12} color="#E00" w={5} />
      <text x={X0 + xq + 14} y={(ep(xq) + Y0 - kE) / 2 + 14} textAnchor="end" fontSize="42" fontStyle="italic" fill="#E00" fontFamily={SERIF}>
        E<tspan dy="12" fontSize="28">k</tspan>
      </text>
    </svg>
  )
}

/** 9-4 例1：Ek − x 关系图（倒抛物线，±2 m 处为零，峰值约 32 J） */
export function EkX() {
  const X0 = 400, Y0 = 470, Apx = 260, H = 330
  const ek = (x: number) => Y0 - H * (1 - (x * x) / (Apx * Apx))
  const pts: string[] = []
  for (let i = 0; i <= 100; i++) { const x = -Apx + i / 100 * 2 * Apx; pts.push(`${X0 + x},${ek(x)}`) }
  return (
    <svg viewBox="0 0 800 560" width="100%" height="100%">
      <rect x="6" y="6" width="788" height="548" fill="#fff" stroke="#888" strokeWidth="3" />
      <line x1={X0} y1="60" x2={X0} y2={Y0} stroke="#111" strokeWidth="3.5" />
      <polygon points={`${X0},60 ${X0 - 10},88 ${X0 + 10},88`} fill="#111" />
      <text x={X0 - 130} y="80" fontSize="38" fontStyle="italic" fontFamily={SERIF}>E</text>
      <text x={X0 - 106} y="110" fontSize="28" fontStyle="italic" fontFamily={SERIF}>k</text>
      <text x={X0 - 72} y="80" fontSize="38" fontFamily={SERIF}>/J</text>
      <line x1="90" y1={Y0} x2="750" y2={Y0} stroke="#111" strokeWidth="3.5" />
      <polygon points={`750,${Y0} 722,${Y0 - 10} 722,${Y0 + 10}`} fill="#111" />
      <text x="700" y={Y0 + 52} fontSize="38" fontStyle="italic" fontFamily={SERIF}>x/m</text>
      {[10, 20, 30].map(v => (
        <g key={v}>
          <line x1={X0 - 14} y1={Y0 - v * 10} x2={X0} y2={Y0 - v * 10} stroke="#111" strokeWidth="3" />
          <text x={X0 - 30} y={Y0 - v * 10 + 12} textAnchor="end" fontSize="32" fontFamily={SERIF}>{v}</text>
        </g>
      ))}
      <path d={`M${pts.join(' L')}`} fill="none" stroke="#2E8B57" strokeWidth="6" />
      {[-Apx, Apx].map(x => (
        <text key={x} x={X0 + x} y={Y0 + 52} textAnchor="middle" fontSize="36" fontStyle="italic" fontFamily={SERIF}>
          {x < 0 ? '−2' : '2'}
        </text>
      ))}
      <text x={X0} y={Y0 + 52} textAnchor="middle" fontSize="36" fontStyle="italic" fontFamily={SERIF}>O</text>
    </svg>
  )
}

/** 9-4 例2：墙-弹簧-容器 m′ + O 点上方滴管（间距 l） */
export function Dropper() {
  return (
    <svg viewBox="0 0 900 500" width="100%" height="100%">
      <rect x="6" y="6" width="888" height="488" fill="#fff" stroke="#888" strokeWidth="3" />
      {/* 墙 */}
      <rect x="60" y="180" width="36" height="180" fill="#BBB" stroke="#666" strokeWidth="3" />
      {[0, 1, 2, 3].map(i => (
        <line key={i} x1="60" y1={190 + i * 42} x2="30" y2={218 + i * 42} stroke="#666" strokeWidth="4" />
      ))}
      {/* 弹簧 */}
      <path d={springPath(96, 380, 270, 9, 30)} fill="none" stroke="#111" strokeWidth="6" />
      <text x="200" y="200" textAnchor="middle" fontSize="42" fontStyle="italic" fontFamily={SERIF}>k</text>
      {/* 容器 m′（凹槽形） */}
      <path d="M380 250 L380 360 L520 360 L520 250" fill="#BFE3FF" stroke="#2E86C1" strokeWidth="6" />
      <text x="450" y="240" textAnchor="middle" fontSize="42" fontStyle="italic" fontFamily={SERIF}>m′</text>
      {/* x 轴 */}
      <line x1="80" y1="420" x2="860" y2="420" stroke="#111" strokeWidth="3.5" />
      <polygon points="860,420 832,410 832,430" fill="#111" />
      <text x="836" y="470" fontSize="40" fontStyle="italic" fontFamily={SERIF}>x</text>
      {/* O 点 */}
      <circle cx="700" cy="420" r="10" fill="#111" />
      <text x="700" y="480" textAnchor="middle" fontSize="44" fontStyle="italic" fontFamily={SERIF}>O</text>
      {/* l 双向箭头（容器 → O） */}
      <line x1="456" y1="386" x2="694" y2="386" stroke="#111" strokeWidth="3.5" />
      <polygon points="450,386 476,378 476,394" fill="#111" />
      <polygon points="700,386 674,378 674,394" fill="#111" />
      <text x="575" y="376" textAnchor="middle" fontSize="42" fontStyle="italic" fontFamily={SERIF}>l</text>
      {/* 滴管（O 正上方） */}
      <path d="M672 60 L728 60 L714 120 L714 150 L686 150 L686 120 Z" fill="#F5F5F5" stroke="#444" strokeWidth="5" />
      <rect x="666" y="44" width="68" height="20" rx="8" fill="#DDD" stroke="#444" strokeWidth="4" />
      {[0, 1, 2].map(i => (
        <circle key={i} cx={686 + i * 14} cy={86 + (i % 2) * 14} r="7" fill="#8a6d3b" />
      ))}
      <circle cx="700" cy="185" r="8" fill="#8a6d3b" />
      <circle cx="700" cy="230" r="8" fill="#8a6d3b" />
      <text x="700" y="330" textAnchor="middle" fontSize="38" fontStyle="italic" fill="#8a6d3b" fontFamily={SERIF}>m</text>
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
  rotvec_t0: RotvecT0,
  rotvec_t: RotvecT,
  rotvec_anim: RotvecAnim,
  rotvec_va: RotvecVA,
  rotvec_xt: RotvecXt,
  phase_ab: PhaseAB,
  phase_waves: PhaseWaves,
  example_axis: ExampleAxis,
  rotvec_phi: RotvecPhi,
  rotvec_two: RotvecTwo,
  pendulum_anim: PendulumAnim,
  compound_pendulum: CompoundPendulum,
  rolling_ball: RollingBall,
  energy_t: EnergyT,
  ep_x: EpX,
  ek_x: EkX,
  dropper: Dropper,
}

export default DIAGRAMS
