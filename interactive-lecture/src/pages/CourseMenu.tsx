import { useEffect, useState } from 'react'

interface CourseEntry {
  id: string
  title: string
  desc?: string
}

/** 课程列表页：根路径无 ?course= 参数时显示，从 public/weblec/courses.json 读清单 */
export default function CourseMenu() {
  const [courses, setCourses] = useState<CourseEntry[] | null>(null)

  useEffect(() => {
    fetch('/weblec/courses.json')
      .then(r => r.json())
      .then(setCourses)
      .catch(() => setCourses([]))
  }, [])

  return (
    <div className="flex min-h-screen flex-col items-center bg-[#0b1f38] px-6 py-16 text-slate-100">
      <h1 className="text-2xl font-bold">大学物理交互课堂</h1>
      <p className="mt-2 text-sm text-slate-400">选择一节课程进入</p>
      <div className="mt-10 grid w-full max-w-3xl gap-5">
        {courses === null && <p className="text-center text-slate-500">加载中…</p>}
        {courses?.length === 0 && <p className="text-center text-slate-500">暂无课程</p>}
        {courses?.map(c => (
          <div key={c.id}
            className="flex flex-wrap items-center gap-4 rounded-xl bg-[#0f2a4a] p-6 ring-1 ring-[#ffb703]/30">
            <div className="min-w-0 flex-1">
              <h2 className="truncate text-lg font-bold">{c.title}</h2>
              {c.desc && <p className="mt-1 text-sm text-slate-400">{c.desc}</p>}
            </div>
            <a href={`/?course=${c.id}`}
              className="rounded-lg bg-[#ffb703] px-4 py-2 text-sm font-bold text-[#0b1f38] hover:brightness-110">
              交互课堂
            </a>
            <a href={`/slides.html?course=${c.id}`}
              className="rounded-lg bg-[#123a63] px-4 py-2 text-sm text-slate-200 hover:bg-[#1a4a7a]">
              静态幻灯片
            </a>
          </div>
        ))}
      </div>
    </div>
  )
}
