export interface Chapter {
  id: number
  t_start: number
  heading: string
}

interface Props {
  chapters: Chapter[]
  currentId?: number
  onSeek: (time: number) => void
  /** 每行列数，默认 6 */
  cols?: number
}

/** 章节导航：固定一行（或按 cols 折行），放不下时省略号 */
export default function ChapterNav({ chapters, currentId, onSeek, cols = 6 }: Props) {
  return (
    <div className="mt-4 grid gap-2 lg:pr-14" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
      {chapters.map(c => (
        <button
          key={c.id}
          onClick={() => onSeek(c.t_start + 0.01)}
          title={c.heading}
          className={`chrome-btn min-w-0 rounded-lg px-1.5 py-1.5 text-xs truncate ${
            currentId === c.id ? 'chrome-btn-active font-semibold' : ''
          }`}
        >
          {c.id}. {c.heading}
        </button>
      ))}
    </div>
  )
}
