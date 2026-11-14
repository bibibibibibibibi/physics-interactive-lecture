import { useEffect, useState } from 'react'
import { ArrowUp, RotateCcw } from 'lucide-react'
import './aqiang-hero.css'

type PoseName = 'explain' | 'write' | 'question' | 'emphasis' | 'flip'
type PlayPhase = 'playing' | 'finished' | 'static'

const sequence: { at: number; pose: PoseName; label: string }[] = [
  { at: 1200, pose: 'write', label: '阿强正在板书' },
  { at: 2400, pose: 'question', label: '阿强请你来回答' },
  { at: 3600, pose: 'emphasis', label: '记住这个关键点' },
  { at: 4700, pose: 'flip', label: '阿强翻跟斗出画' },
]

const poses: PoseName[] = ['explain', 'write', 'question', 'emphasis', 'flip']

/** 专题首屏专属串场：自动播放一次，重播时完整清理上一组计时器。 */
export default function AqiangHero() {
  const [reducedMotion, setReducedMotion] = useState(
    () => window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  )
  const [runId, setRunId] = useState(0)
  const [pose, setPose] = useState<PoseName>('explain')
  const [phase, setPhase] = useState<PlayPhase>(reducedMotion ? 'static' : 'playing')
  const [status, setStatus] = useState(reducedMotion ? '静态展示 · 已减少动态效果' : '阿强正在讲解')

  useEffect(() => {
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)')
    const updatePreference = (event: MediaQueryListEvent) => {
      setReducedMotion(event.matches)
      setPose('explain')
      setPhase(event.matches ? 'static' : 'playing')
      setStatus(event.matches ? '静态展示 · 已减少动态效果' : '阿强正在讲解')
    }
    preference.addEventListener('change', updatePreference)
    return () => preference.removeEventListener('change', updatePreference)
  }, [])

  useEffect(() => {
    const timers: number[] = []
    if (!reducedMotion) {
      sequence.forEach(({ at, pose: nextPose, label }) => {
        timers.push(window.setTimeout(() => {
          setPose(nextPose)
          setStatus(label)
        }, at))
      })
      timers.push(window.setTimeout(() => {
        setPhase('finished')
        setStatus('串场完成 · 可以开始上课了')
      }, 6200))
    }
    return () => timers.forEach(window.clearTimeout)
  }, [runId, reducedMotion])

  function handleImageError(failedPose: PoseName) {
    if (failedPose !== 'explain' && pose === failedPose) {
      setPose('explain')
      setStatus('阿强正在讲解')
    }
  }

  function replay() {
    setPose('explain')
    setPhase('playing')
    setStatus('阿强正在讲解')
    setRunId(value => value + 1)
  }

  return (
    <div className={`aqiang-hero ${phase === 'finished' ? 'is-finished' : ''}`}
      data-current={phase === 'finished' ? 'none' : pose} data-state={phase}>
      <div className={`aqiang-scene ${pose === 'flip' && phase === 'playing' ? 'is-flipping' : ''}`} aria-hidden="true">
        <span className="aqiang-board-label">物理小课堂</span>
        <span className="aqiang-formula">F = ma</span>
        <span className="aqiang-chalk-line" />
        <div className="aqiang-pose-box">
          {poses.map(name => (
            <img key={name} className={`aqiang-pose aqiang-pose-${name} ${pose === name && phase !== 'finished' ? 'is-active' : ''}`}
              src={`/aqiang-hero/${name}.png`} alt="" draggable={false}
              fetchPriority={name === 'explain' ? 'high' : 'auto'}
              onError={() => handleImageError(name)} />
          ))}
        </div>
        <div className="aqiang-finish-mark">
          <ArrowUp size={40} strokeWidth={1.3} />
          <strong>开始今天的探究</strong>
          <span>让好奇心，带路。</span>
        </div>
      </div>
      <div className="aqiang-hero-footer">
        <span className="aqiang-play-state" role="status" aria-live="polite">{status}</span>
        <button type="button" className="aqiang-replay" onClick={replay}
          disabled={reducedMotion} title={reducedMotion ? '系统已开启减少动态效果' : undefined}>
          <RotateCcw size={15} aria-hidden="true" />重播动画
        </button>
      </div>
    </div>
  )
}
