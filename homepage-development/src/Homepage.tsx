import CourseMenu from '@/pages/CourseMenu'
import './kit.css'

// Standalone wrapper adapted from the menu-only branch of the original Home.tsx.
// The copied CourseMenu, SubjectCard and OrbitPlate components are unchanged.
function menuNav(cur: 'physics' | 'analysis' | 'special') {
  return [
    { href: '/', label: '大学物理课程', current: cur === 'physics' },
    { href: '/?menu=analysis', label: '分析力学', current: cur === 'analysis' },
    { href: '/?menu=special', label: '教学节段专题', current: cur === 'special' },
  ]
}

function MissingCourse({ courseId }: { courseId: string | null }) {
  const back = courseId && /^sp\d+$/.test(courseId) ? '/?menu=special'
    : courseId === 'analytical-mechanics' ? '/?menu=analysis' : '/'
  return (
    <main className="atlas kit-notice" data-kit-notice>
      <article>
        <p className="kit-eyebrow">HOMEPAGE DEVELOPMENT KIT</p>
        <h1>课程内容未包含在本开发包中</h1>
        <p>本包提供大学物理首页、目录交互和课程清单，用于首页开发。交互课堂播放器、幻灯片及课件媒体需接入完整课程项目。</p>
        {courseId && <p>当前课程：<code>{courseId}</code></p>}
        <a href={back}>返回课程目录</a>
      </article>
    </main>
  )
}

export default function Homepage() {
  const courseId = new URLSearchParams(window.location.search).get('course')
  const isSlidesPage = window.location.pathname.endsWith('/slides.html')
    || window.location.pathname.endsWith('/slides-preview.html')
  if (courseId || isSlidesPage) return <MissingCourse courseId={courseId} />

  const menu = new URLSearchParams(window.location.search).get('menu')
  // 下面的旧参数（mechanics / foundation）落到大学物理目录，兼容旧链接。
  if (menu === 'analysis' || menu === 'analytical') {
    return <CourseMenu nav={menuNav('analysis')}
      title="分析力学" subtitle="从约束、虚功到拉格朗日方程"
      groups={[{ name: '拉格朗日力学', src: '/weblec/courses_analytical.json' }]} />
  }
  if (menu === 'special') {
    return <CourseMenu nav={menuNav('special')}
      title="教学节段专题" subtitle="跨篇选讲：每讲一个主题，独立成节"
      groups={[{ name: '示范课节段', src: '/weblec/courses_special.json' }]} />
  }
  return <CourseMenu nav={menuNav('physics')}
    title="大学物理" subtitle="按章节进入交互课堂，或打开幻灯片复习。"
    groups={[
      { name: '力学', chapters: [
        { title: '第一章　质点运动学', src: '/weblec/courses_mechanics.json' },
        { title: '第二章　牛顿定律', src: '/weblec/courses_newton.json' },
        { title: '第三章　动量守恒定律和能量守恒定律', src: '/weblec/courses_momentum.json' },
        { title: '第四章　刚体转动和流体运动', src: '/weblec/courses_rotation.json' },
      ] },
      { name: '电磁学', chapters: [
        { title: '第五章　静电场', src: '/weblec/courses_electric.json' },
        { title: '第六章　导体与电介质', src: '/weblec/courses_conductor.json' },
        { title: '第七章　恒定磁场', src: '/weblec/courses_magnetic.json' },
        { title: '第八章　电磁感应', src: '/weblec/courses_induction.json' },
      ] },
      { name: '振动与波', chapters: [
        { title: '第九章　振动', src: '/weblec/courses.json' },
        { title: '第十章　波动', src: '/weblec/courses_wave.json' },
      ] },
      { name: '光学', chapters: [
        { title: '第十一章　光学', src: '/weblec/courses_optics.json' },
      ] },
      { name: '热学', chapters: [
        { title: '第十二章　气体动理论', src: '/weblec/courses_thermal.json' },
        { title: '第十三章　热力学基础', src: '/weblec/courses_thermo.json' },
      ] },
      { name: '相对论', chapters: [
        { title: '第十四章　相对论', src: '/weblec/courses_relativity.json' },
      ] },
      { name: '量子与粒子物理', chapters: [
        { title: '第十五章　量子物理', src: '/weblec/courses_quantum.json' },
        { title: '第十六章　原子核与粒子物理', src: '/weblec/courses_nuclear.json' },
      ] },
      { name: '数学基础（预备）', chapters: [
        { title: '第零章　矢量代数', src: '/weblec/courses_foundation.json' },
      ] },
    ]} />
}
