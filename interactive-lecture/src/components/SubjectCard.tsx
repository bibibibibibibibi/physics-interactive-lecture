import { useState } from 'react'
import {
  Atom, Axis3d, BookOpenText, ChevronDown, Clock3, Compass, FlaskConical, Magnet,
  Orbit, Pause, Play, Presentation, Thermometer, Triangle, Waves,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import OrbitPlate from './OrbitPlate'
import './subject-card.css'

const subjectIcons: Record<string, LucideIcon> = {
  '力学': Orbit,
  '电磁学': Magnet,
  '振动与波': Waves,
  '光学': Triangle,
  '热学': Thermometer,
  '相对论': Clock3,
  '量子与粒子物理': Atom,
  '数学基础（预备）': Axis3d,
  '拉格朗日力学': Compass,
  '示范课节段': FlaskConical,
}

export interface CourseEntry {
  id: string
  title: string
  desc?: string
  lectureAvailable?: boolean
  slidesUrl?: string
  /** 对应课本小节阅读页（build-textbook.mjs 生成的映射） */
  textbookUrl?: string
}

export interface RenderedChapter {
  index: number
  title?: string
  note?: string
  /** 配套交互实验链接（可选） */
  labs?: { href: string; label: string }[]
  courses: CourseEntry[]
}

interface SubjectCardProps {
  index: number
  name: string
  chapters: RenderedChapter[]
  open: boolean
  onToggle: () => void
  isChapterOpen: (ci: number) => boolean
  onToggleChapter: (ci: number) => void
}

function PendulumDemo() {
  const [mode, setMode] = useState<'closed' | 'playing' | 'paused'>('closed')
  const open = mode !== 'closed'

  return (
    <div className="course-demo">
      <button type="button" aria-expanded={open} onClick={() => setMode(open ? 'closed' : 'playing')}>
        单摆演示 <ChevronDown size={13} aria-hidden="true" />
      </button>
      {open && <div className="course-demo-figure">
        <OrbitPlate playing={mode === 'playing'} />
        <button type="button" onClick={() => setMode(mode === 'playing' ? 'paused' : 'playing')}>
          {mode === 'playing' ? <Pause size={13} /> : <Play size={13} />}
          {mode === 'playing' ? '暂停摆动' : '继续摆动'}
        </button>
      </div>}
    </div>
  )
}

export default function SubjectCard({
  index, name, chapters, open, onToggle, isChapterOpen, onToggleChapter,
}: SubjectCardProps) {
  const Icon = subjectIcons[name] ?? Orbit

  return (
    <section className="subject-card" data-subject={index + 1}>
      <h3 className="subject-heading">
        <button type="button" className="subject-toggle" onClick={onToggle} aria-expanded={open}>
          <span className="subject-icon" aria-hidden="true"><Icon size={27} strokeWidth={1.5} /></span>
          <span className="subject-name">{name || '课程目录'}</span>
          <span className="subject-index" aria-hidden="true">{String(index + 1).padStart(2, '0')}</span>
          <ChevronDown className="subject-chevron" size={16} aria-hidden="true" />
        </button>
      </h3>
      {open && (
        <div className="subject-body">
          {chapters.map(ch => {
            const empty = ch.courses.length === 0
            const expanded = !ch.title || isChapterOpen(ch.index)
            const prefix = ch.title?.match(/^(第\S+?章)\s*/)?.[0] ?? ''
            return (
              <div key={ch.index} className="chapter-row">
                {ch.title && (
                  <button type="button" className="chapter-toggle" disabled={empty}
                    aria-expanded={empty ? undefined : expanded} onClick={() => onToggleChapter(ch.index)}>
                    {prefix && <span className="chapter-number">{prefix.trim()}</span>}
                    <span className="chapter-name">{ch.title.slice(prefix.length)}</span>
                    <span className="chapter-count">{empty ? '未制作' : `${ch.courses.length} 节`}</span>
                    {!empty && <ChevronDown className="chapter-chevron" size={15} aria-hidden="true" />}
                  </button>
                )}
                {empty && <p className="chapter-note">{ch.note ?? '课节尚未制作'}</p>}
                {!!ch.labs?.length && (
                  <div className="chapter-labs">
                    {ch.labs.map(l => <a key={l.href} href={l.href}><FlaskConical size={13} aria-hidden="true" />{l.label}</a>)}
                  </div>
                )}
                {!empty && expanded && (
                  <ul className="course-list">
                    {ch.courses.map(c => (
                      <li key={c.id} className="course-row">
                        <div className="course-copy">
                          <h4 className="course-title">{c.title}</h4>
                          {c.desc && <p className="course-desc">{c.desc}</p>}
                        </div>
                        <div className="course-links">
                          {c.lectureAvailable !== false && (
                            <a href={`/?course=${c.id}`} className="course-lecture" aria-label={`${c.title} · 交互课堂`}>
                              <Play size={13} aria-hidden="true" />交互课堂
                            </a>
                          )}
                          <a href={c.slidesUrl ?? `/slides.html?course=${c.id}`} className="course-slides"
                            aria-label={`${c.title} · 静态幻灯片`}>
                            <Presentation size={14} aria-hidden="true" />静态幻灯片
                          </a>
                          {c.textbookUrl && (
                            <a href={c.textbookUrl} className="course-textbook" aria-label={`${c.title} · 课本内容`}>
                              <BookOpenText size={13} aria-hidden="true" />课本内容
                            </a>
                          )}
                        </div>
                        {c.id === 'pendulum' && <PendulumDemo />}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )
          })}
        </div>
      )}
    </section>
  )
}
