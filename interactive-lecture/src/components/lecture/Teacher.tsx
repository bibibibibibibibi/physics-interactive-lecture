import { useEffect, useMemo, useRef, useState } from 'react'
import type { RefObject } from 'react'
import { TEACHER_IMGS, VIDEO_H, VIDEO_W } from '@/lib/lecture'
import type { LaserTarget, Pose, TeacherImg } from '@/lib/lecture'

interface Props {
  character: string
  characterName: string
  switchable: boolean
  onSwitch: () => void
  shownPose: Pose
  laserTarget: LaserTarget | null
  /** 视频舞台内层容器，用于把激光目标换算成视口坐标 */
  stageRef: RefObject<HTMLDivElement | null>
  fs: boolean
}

/** 网页卡通讲师：平时紧邻视频右下角外侧；全屏时收进画面右下角。
    点击切换讲师，按住拖动可挪动位置；激光指点时自动朝向知识点 */
export default function Teacher({ character, characterName, switchable, onSwitch, shownPose, laserTarget, stageRef, fs }: Props) {
  /** 小人可拖动：teacherPos 为视口坐标（fixed 定位），null=默认右下角。
      非全屏时可在整个网页范围拖动；全屏时 fixed 相对全屏容器。
      拖动与点击切换共存：位移超过 6px 视为拖动，不触发切换 */
  const [teacherPos, setTeacherPos] = useState<{ x: number; y: number } | null>(null)
  const teacherDraggedRef = useRef(false)
  function startTeacherDrag(e: React.MouseEvent) {
    e.preventDefault()
    const el = (e.currentTarget as HTMLElement).getBoundingClientRect()
    const grabDX = e.clientX - el.left
    const grabDY = e.clientY - el.top
    const startX = e.clientX
    const startY = e.clientY
    let moved = false
    function bounds() {
      // 全屏时限制在全屏容器内，否则整个浏览器窗口都可拖动
      if (document.fullscreenElement) {
        const r = document.fullscreenElement.getBoundingClientRect()
        return { minX: r.left, minY: r.top, maxX: r.right - el.width, maxY: r.bottom - el.height }
      }
      return { minX: 0, minY: 0, maxX: window.innerWidth - el.width, maxY: window.innerHeight - el.height }
    }
    function onMove(ev: MouseEvent) {
      if (!moved && Math.hypot(ev.clientX - startX, ev.clientY - startY) < 6) return
      moved = true
      teacherDraggedRef.current = true
      const b = bounds()
      setTeacherPos({
        x: Math.min(b.maxX, Math.max(b.minX, ev.clientX - grabDX)),
        y: Math.min(b.maxY, Math.max(b.minY, ev.clientY - grabDY)),
      })
    }
    function onUp() {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }
  /** 全屏切换后把小人放回默认右下角（视频角落在两种模式下尺寸差异大，
      保留旧坐标容易让人找不到他），用户再拖一次即可 */
  useEffect(() => {
    setTeacherPos(null)
  }, [fs])
  function onTeacherClick() {
    if (teacherDraggedRef.current) { teacherDraggedRef.current = false; return }
    onSwitch()
  }

  /** 激光指点方向自适应：小人在知识点右侧时保持原图（手臂朝左），
      被拖到知识点左侧时水平镜像，让手臂始终朝向知识点（视口坐标比较） */
  const flipTeacher = useMemo(() => {
    if (shownPose !== 'laser' || !laserTarget) return false
    const stage = stageRef.current
    if (!stage) return false
    const sr = stage.getBoundingClientRect()
    const targetX = sr.left + (laserTarget.x / VIDEO_W) * sr.width
    let cx: number
    if (teacherPos) cx = teacherPos.x + 48
    else cx = sr.right + 4  // 默认在视频右下角外侧
    return cx < targetX
  }, [shownPose, laserTarget, teacherPos, stageRef])

  /** 激光姿态按方位/距离选变体：高位分「斜上/高举」两档，低位分「斜下/俯身」两档，
      平指按横向距离选「远指/平指/侧身」；同一档内按目标下标奇偶确定性轮换，
      避免同一页相邻知识点姿态雷同，也保证重放/跳页结果一致（不依赖随机数） */
  const laserVariant = useMemo((): TeacherImg => {
    if (shownPose !== 'laser' || !laserTarget) return 'laser'
    const stage = stageRef.current
    if (!stage) return 'laser'
    const sr = stage.getBoundingClientRect()
    const dotY = sr.top + (laserTarget.y / VIDEO_H) * sr.height
    const dotX = sr.left + (laserTarget.x / VIDEO_W) * sr.width
    const cy = teacherPos ? teacherPos.y + 60 : sr.bottom - 60
    const cx = teacherPos ? teacherPos.x + 48 : sr.right + 4
    const dy = dotY - cy
    const dx = Math.abs(dotX - cx)
    const alt = laserTarget.idx % 2 === 0
    if (dy < -200) return alt ? 'laser_high' : 'laser_up'
    if (dy < -70) return 'laser_up'
    if (dy > 200) return alt ? 'laser_low' : 'laser_down'
    if (dy > 70) return 'laser_down'
    /** 远指用舞台宽度的相对阈值：窄窗口下固定 600px 永远达不到 */
    if (dx > sr.width * 0.5) return 'laser_far'
    return alt ? 'laser_lean' : 'laser'
  }, [shownPose, laserTarget, teacherPos, stageRef])

  /** 同一知识点持续指点超过 4 秒：换成「画圈强调」变体，避免一个姿势僵住。
      纯派生（elapsed 由 Home 按时间轴算出），跳进激光中段也立即正确 */
  const circling = (laserTarget?.elapsed ?? 0) > 4

  /** 实际要显示的立绘：激光姿态时换成对应方向变体 */
  const effPose: TeacherImg = shownPose === 'laser' ? (circling ? 'laser_circle' : laserVariant) : shownPose

  return (
    <button
      onMouseDown={startTeacherDrag}
      onClick={onTeacherClick}
      title={switchable ? `点击切换讲师（当前：${characterName}），按住可拖动` : undefined}
      className={`select-none cursor-grab active:cursor-grabbing z-30 ${
        teacherPos
          ? fs ? 'fixed h-48 w-32' : 'fixed h-36 w-24'
          : fs
            ? 'absolute bottom-24 right-5 h-48 w-32'
            : 'hidden lg:block absolute -bottom-1 -right-14 h-36 w-24'
      }`}
      style={{
        ...(teacherPos ? { left: teacherPos.x, top: teacherPos.y } : {}),
        transform: flipTeacher ? 'scaleX(-1)' : undefined,
        transition: 'transform 0.3s',
      }}
    >
      <style>{`@keyframes tutor-in{from{transform:translateY(6px) scale(.96);}to{transform:translateY(0) scale(1);}} .anim-in{animation:tutor-in .45s ease-out}`}</style>
      {TEACHER_IMGS.map(p => (
        <img
          key={`${character}-${p}-${p === effPose ? 'on' : 'off'}`}
          src={`/poses/${character}/pose_${p}.png`}
          alt=""
          draggable={false}
          className={`absolute bottom-0 right-0 h-full w-auto object-contain origin-bottom transition-opacity duration-500 ${p === effPose ? 'opacity-100 anim-in' : 'opacity-0'}`}
        />
      ))}
    </button>
  )
}
