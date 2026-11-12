/**
 * 课程参数化：URL 带 ?course=<id> 时加载 public/weblec/<id>/ 下的课件。
 * - 交互课堂：/?course=shm（无参数时根路径显示课程目录 SiteMenuPage）
 * - 课程菜单：/?menu=special 显示专题系列目录（courses_special.json），默认显示第九章（courses.json）
 * - 静态幻灯片：/slides.html?course=shm（无参数默认 shm）
 * 课程清单在 public/weblec/courses.json；单文件导出的幻灯片由
 * export_slides.py 注入 __WEBLEC__，不经过这里。
 */
const requestedCourse = new URLSearchParams(window.location.search).get('course')
/** Historical review bookmarks now resolve to the maintained course and its media. */
const courseAliases: Record<string, string> = {
  'sp1-correction-review': 'sp1',
  'sp3-static-review': 'sp3',
}
export const COURSE_ID: string | null = requestedCourse
  ? courseAliases[requestedCourse] ?? requestedCourse
  : null

export const DEFAULT_COURSE = 'shm'

/** 课程媒体根（绝对路径，dev 与 build 后都由 public 目录提供） */
export const COURSE_BASE = `/weblec/${COURSE_ID ?? DEFAULT_COURSE}/`

/** 全部章节清单文件（与课程目录页分组一致），用于查找某节课的上一节/下一节 */
export const CHAPTER_FILES = [
  'courses_mechanics.json', 'courses_newton.json', 'courses_momentum.json', 'courses_rotation.json',
  'courses_electric.json', 'courses_conductor.json', 'courses_magnetic.json', 'courses_induction.json',
  'courses.json', 'courses_wave.json', 'courses_optics.json',
  'courses_thermal.json', 'courses_thermo.json', 'courses_relativity.json',
  'courses_quantum.json', 'courses_nuclear.json', 'courses_foundation.json',
  'courses_analytical.json', 'courses_special.json',
]
