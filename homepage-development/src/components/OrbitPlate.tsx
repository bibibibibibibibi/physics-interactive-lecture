import { useEffect, useId, useRef, useState } from 'react'

const pivot = { x: 278, y: 52 }
const length = 155
const releaseAngle = 59
const exposures = [-59, -38, -13, 13, 38]

function point(radius: number, degrees: number) {
  const radians = degrees * Math.PI / 180
  return [pivot.x + radius * Math.sin(radians), pivot.y + radius * Math.cos(radians)]
}

function arc(radius: number, from: number, to: number) {
  return `M ${point(radius, from)} A ${radius} ${radius} 0 0 ${to >= from ? 0 : 1} ${point(radius, to)}`
}

function Pendulum({ playing, brass, stipple }: { playing: boolean; brass: string; stipple: string }) {
  const [angle, setAngle] = useState(releaseAngle)
  const motion = useRef({ theta: releaseAngle * Math.PI / 180, omega: 0 })

  useEffect(() => {
    if (!playing) return

    let previous: number | undefined
    let frame: number
    const tick = (now: number) => {
      if (previous !== undefined) {
        // ℓ = 1 m, g = 9.81 m/s². Velocity Verlet integrates the full sin θ restoring force.
        // Limit the elapsed step after a background tab resumes.
        const elapsed = Math.min((now - previous) / 1000, 0.05)
        const steps = Math.max(1, Math.ceil(elapsed * 240))
        const dt = elapsed / steps
        const state = motion.current
        for (let i = 0; i < steps; i++) {
          state.omega -= 0.5 * dt * 9.81 * Math.sin(state.theta)
          state.theta += dt * state.omega
          state.omega -= 0.5 * dt * 9.81 * Math.sin(state.theta)
        }
        setAngle(state.theta * 180 / Math.PI)
      }
      previous = now
      frame = requestAnimationFrame(tick)
    }

    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [playing])

  const [bobX, bobY] = point(length, angle)
  const [thetaX, thetaY] = point(67, angle / 2)
  const [lengthX, lengthY] = point(120, angle)
  return (
    <>
      <g fill="none" stroke="#655442">
        <path d={arc(54, 0, angle)} strokeWidth="1.1" />
        <path d={`M ${point(50, angle)} L ${point(58, angle)}`} />
        <g transform={`translate(${pivot.x} ${pivot.y}) rotate(${-angle})`}>
          <path d={`M0 1V${length - 23}`} strokeWidth="1.8" />
          <path d={`M-3 ${length - 18}v-5a3 3 0 0 1 6 0v5`} strokeWidth="1.4" />
        </g>
      </g>
      <g transform={`translate(${bobX} ${bobY})`}>
        <circle r="19.5" fill={`url(#${brass})`} stroke="#745533" strokeWidth="1" />
        <circle r="19" fill={`url(#${stipple})`} />
        <path d="M-15 -7Q-11 -15 -2 -16" fill="none" stroke="#fff7c9" strokeWidth="1.2" />
        <path d="M3 16Q10 15 14 8" fill="none" stroke="#edd392" strokeWidth=".9" opacity=".75" />
      </g>
      <path d={`M${bobX + 23} ${bobY} l16 -16 h19`} stroke="#68746e" fill="none" opacity=".7" />
      <g fill="#533e29" fontFamily="Georgia, serif" fontStyle="italic" fontSize="16">
        {Math.abs(angle) > 12 && <text x={thetaX - 7} y={thetaY + 4}>θ</text>}
        <text x={lengthX + 2} y={lengthY - 10}>ℓ</text>
        <text x={bobX + 63} y={bobY - 12} fontSize="14">m</text>
      </g>
    </>
  )
}

/** 多重曝光示意。各位置均绕同一支点转动，支点至球心的距离相等。 */
export default function OrbitPlate({ className, playing = false }: { className?: string; playing?: boolean }) {
  const uid = useId()
  const column = `${uid}-column`
  const bronze = `${uid}-bronze`
  const wood = `${uid}-wood`
  const wash = `${uid}-wash`
  const groundShadow = `${uid}-ground`
  const brass = `${uid}-brass`
  const stipple = `${uid}-stipple`
  const title = `${uid}-title`

  return (
    <svg className={className} width="100%" viewBox="20 5 505 280" role="img" aria-labelledby={title}>
      <title id={title}>黄铜单摆实验装置，摆球的多个位置沿圆弧排列</title>
      <defs>
        <radialGradient id={brass} cx="31%" cy="23%" r="84%">
          <stop stopColor="#fff9cf" />
          <stop offset=".13" stopColor="#f4dfa3" />
          <stop offset=".36" stopColor="#d5ac65" />
          <stop offset=".63" stopColor="#96703d" />
          <stop offset=".84" stopColor="#513d27" />
          <stop offset="1" stopColor="#b78f56" />
        </radialGradient>
        <linearGradient id={column}>
          <stop stopColor="#635844" /><stop offset=".13" stopColor="#a28760" />
          <stop offset=".38" stopColor="#dfca99" /><stop offset=".51" stopColor="#f5e4b9" />
          <stop offset=".72" stopColor="#bd9f6c" /><stop offset=".9" stopColor="#8f744e" />
          <stop offset="1" stopColor="#695a48" />
        </linearGradient>
        <linearGradient id={bronze} x2="0" y2="1">
          <stop stopColor="#b09466" /><stop offset=".25" stopColor="#e8d4a5" />
          <stop offset=".54" stopColor="#c0a276" /><stop offset="1" stopColor="#78664c" />
        </linearGradient>
        <linearGradient id={wood} x1="0" y1="0" x2=".85" y2=".83">
          <stop stopColor="#bda384" /><stop offset=".55" stopColor="#dfcaab" />
          <stop offset="1" stopColor="#b39874" />
        </linearGradient>
        <radialGradient id={wash}>
          <stop stopColor="#a4bcb8" stopOpacity=".5" />
          <stop offset=".69" stopColor="#c8d6cb" stopOpacity=".43" />
          <stop offset="1" stopColor="#e4e9dd" stopOpacity="0" />
        </radialGradient>
        <radialGradient id={groundShadow}>
          <stop stopColor="#716751" stopOpacity=".36" />
          <stop offset="1" stopColor="#bcb19a" stopOpacity="0" />
        </radialGradient>
        <pattern id={stipple} width="3.2" height="3.2" patternUnits="userSpaceOnUse">
          <path d="M-.4 1.4l1.8-1.8M1.1 3.2l2.1-2.1" stroke="#483829" strokeWidth=".55" opacity=".42" />
        </pattern>
      </defs>

      <ellipse cx="267" cy="160" rx="231" ry="111" fill={`url(#${wash})`} />
      <ellipse cx="263" cy="254" rx="204" ry="18" fill={`url(#${groundShadow})`} />

      {/* Instrument stand. The upright is behind the plane of oscillation. */}
      <g stroke="#736651" strokeWidth="1" strokeLinejoin="round">
        <path d="M80 240l50-17 283 3-44 19z" fill={`url(#${wood})`} />
        <path d="M80 240l289 5v11l-289-7z" fill="#a38b70" />
        <path d="M369 245l44-19v10l-44 20z" fill="#8b765b" />
        <path d="M91 249v4q4 5 12 1v-5m241 7v4q7 3 14-1v-4m40-15v5l9-4v-5" fill="#716a5d" />
        <path d="M82 245l286 6m-276-9l262 4m-212-18l122 2m-134 0l64 1m75 5l103 1"
          stroke="#78654d" strokeWidth=".65" opacity=".57" />
        <path d="M104 231q-1-4 20-8 20-4 35 1l4 5q-22 11-53 6z" fill={`url(#${bronze})`} />
        <path d="M119 228l6-14 20-1 7 13q-18 6-33 2z" fill={`url(#${column})`} />
        <path d="M125 39q4-6 17-2v177q-8 5-17 1z" fill={`url(#${column})`} />
        <path d="M124 201q8 4 20-1l1 9q-9 5-22 1zM123 41q9 3 21-1v8q-10 5-21 1z" fill={`url(#${bronze})`} />
        <path d="M128 36v-9q7-6 12 0v9z" fill={`url(#${column})`} />
        <path d="M129 25q5-3 10 0m-11 3q7-3 12 0" fill="none" strokeWidth=".75" />
        <path d="M140 80q20-8 36-42h8q-13 39-44 51z" fill="#b49d75" />
        <path d="M142 81q23-13 37-43" stroke="#e3d4b5" fill="none" />
        <path d="M118 34l10-4 154 3-5 4z" fill="#e0cfaa" />
        <path d="M118 34l159 3v7l-159-3z" fill={`url(#${bronze})`} />
        <path d="M277 37l5-4v7l-5 4z" fill="#8d7854" />
        <path d="M271 44h10l1 7-4 4-4-2z" fill={`url(#${bronze})`} />
      </g>
      <g stroke="#596f70" fill="none">
        <path d={arc(length, -65, 65)} strokeDasharray="2 4" opacity=".52" />
        <path d={arc(178, -64, 64)} opacity=".46" />
        <path d={`M ${pivot.x} ${pivot.y} v177`} strokeDasharray="4 4" opacity=".48" />
        {Array.from({ length: 33 }, (_, i) => (i - 16) * 4).map(degrees => (
          <path key={degrees} d={`M ${point(178, degrees)} L ${point(degrees % 16 === 0 ? 184 : 181, degrees)}`}
            opacity={degrees % 16 === 0 ? '.65' : '.35'} />
        ))}
      </g>
      {exposures.map((degrees, index) => (
        <g key={degrees} transform={`translate(${pivot.x} ${pivot.y}) rotate(${-degrees})`}
          stroke={index < 3 ? '#607b82' : '#a18d71'} opacity=".47">
          <path d={`M0 0V${length - 18}`} strokeWidth=".85" />
          <g transform={`translate(0 ${length})`}>
            <circle r="16" fill={index < 3 ? '#d1ddda' : '#dfd3bb'} strokeWidth="1.2" />
            <path d="M-14 5Q-2 15 12 7M-12 9Q0 17 10 10M-12 -6q4-7 11-7" fill="none" strokeWidth="1" />
          </g>
        </g>
      ))}
      <Pendulum playing={playing} brass={brass} stipple={stipple} />

      <g stroke="#645745">
        <circle cx={pivot.x} cy={pivot.y} r="4" fill="#bca77d" />
        <circle cx={pivot.x} cy={pivot.y} r="1.5" fill="#584939" stroke="none" />
      </g>
    </svg>
  )
}
