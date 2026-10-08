import { useEffect, useState } from 'react'

interface CourseEntry {
  id: string
  title: string
  desc?: string
  /** 静态候选尚未配音时不显示交互课堂入口；旧清单默认可播放。 */
  lectureAvailable?: boolean
  /** 本课独立静态候选的入口；正式课程沿用公共放映器。 */
  slidesUrl?: string
}

interface CourseMenuProps {
  /** 页面主标题 */
  title?: string
  /** 副标题 */
  subtitle?: string
  /** 课程清单 json 路径 */
  src?: string
  /** 头部右侧的系列入口链接（如主菜单挂「专题系列 →」） */
  extraLink?: { href: string; label: string }
  extraLinks?: { href: string; label: string }[]
  /** 头部左侧的返回链接（如专题菜单挂「← 返回」） */
  backLink?: { href: string; label: string }
}

/** 课程列表页：根路径无 ?course= 参数时显示。
 *  默认读 courses.json（第九章）；?menu=special 时读 courses_special.json（专题系列）。 */
export default function CourseMenu({
  title = '大学物理交互课堂',
  subtitle = '选择一节课程进入',
  src = '/weblec/courses.json',
  extraLink,
  extraLinks,
  backLink,
}: CourseMenuProps) {
  const [courses, setCourses] = useState<CourseEntry[] | null>(null)

  useEffect(() => {
    // 清单会随验收结果更新；绕过浏览器持久缓存，避免仍显示旧的单课目录。
    const separator = src.includes('?') ? '&' : '?'
    fetch(`${src}${separator}t=${Date.now()}`, { cache: 'no-store' })
      .then(r => r.json())
      .then(setCourses)
      .catch(() => setCourses([]))
  }, [src])

  return (
    <div className="flex min-h-screen flex-col items-center bg-[#0b1f38] px-6 py-16 text-slate-100">
      <div className="flex w-full max-w-3xl items-center justify-between">
        <div className="w-24">
          {backLink && (
            <a href={backLink.href} className="text-sm text-slate-400 hover:text-slate-200">
              {backLink.label}
            </a>
          )}
        </div>
        <div className="text-center">
          <h1 className="text-2xl font-bold">{title}</h1>
          <p className="mt-2 text-sm text-slate-400">{subtitle}</p>
        </div>
        <div className="min-w-24 flex flex-col items-end gap-1 text-right">
          {(extraLinks ?? (extraLink ? [extraLink] : [])).map(link => (
            <a key={link.href} href={link.href}
              className="text-sm font-bold text-[#ffb703] hover:brightness-110">
              {link.label}
            </a>
          ))}
        </div>
      </div>
      <div className="mt-10 grid w-full max-w-3xl gap-5">
        {courses === null && <p className="text-center text-slate-500">加载中…</p>}
        {courses?.length === 0 && <p className="text-center text-slate-500">暂无课程</p>}
        {courses?.map(c => (
          <div key={c.id}
            className="flex flex-wrap items-center gap-4 rounded-xl bg-[#0f2a4a] p-6 ring-1 ring-[#ffb703]/30">
            <div className="min-w-0 flex-1">
              <h2 className="text-lg font-bold leading-relaxed">{c.title}</h2>
              {c.desc && <p className="mt-1 text-sm text-slate-400">{c.desc}</p>}
            </div>
            {c.lectureAvailable !== false && <a href={`/?course=${c.id}`}
              className="rounded-lg bg-[#ffb703] px-4 py-2 text-sm font-bold text-[#0b1f38] hover:brightness-110">
              交互课堂
            </a>}
            <a href={c.slidesUrl ?? `/slides.html?course=${c.id}`}
              className="rounded-lg bg-[#123a63] px-4 py-2 text-sm text-slate-200 hover:bg-[#1a4a7a]">
              静态幻灯片
            </a>
          </div>
        ))}
      </div>
    </div>
  )
}
