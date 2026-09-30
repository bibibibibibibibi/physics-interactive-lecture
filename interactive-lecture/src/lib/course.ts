/**
 * 课程参数化：URL 带 ?course=<id> 时加载 public/weblec/<id>/ 下的课件。
 * - 交互课堂：/?course=shm（无参数时根路径显示课程列表 CourseMenu）
 * - 课程菜单：/?menu=special 显示专题系列目录（courses_special.json），默认显示第九章（courses.json）
 * - 静态幻灯片：/slides.html?course=shm（无参数默认 shm）
 * 课程清单在 public/weblec/courses.json；单文件导出的幻灯片由
 * export_slides.py 注入 __WEBLEC__，不经过这里。
 */
export const COURSE_ID: string | null = new URLSearchParams(window.location.search).get('course')

export const DEFAULT_COURSE = 'shm'

/** 课程媒体根（绝对路径，dev 与 build 后都由 public 目录提供） */
export const COURSE_BASE = `/weblec/${COURSE_ID ?? DEFAULT_COURSE}/`
