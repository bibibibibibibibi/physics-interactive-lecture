/* ============================================================
 * build-textbook.mjs — 课本内容切片构建
 *
 * 输入：
 *   ../../uphys-snapshot/data/chapters/ch*.json   （学习平台章节积木）
 *   public/weblec/courses_*.json                  （本站课节清单）
 * 输出：
 *   public/learn/textbook/chXX/<sec>.json         （每小节一个文件，含本章 preamble）
 *   public/learn/textbook/index.json              （章 → 小节目录）
 *   public/learn/assets/...                       （仅拷贝被引用的图片/音视频）
 *   src/lib/textbook-map.json                     （课节 id → 阅读页 URL）
 * 校验：
 *   切片前后块数守恒；课节↔小节映射全量打印，人工核对差异。
 * 用法：node scripts/build-textbook.mjs
 * ============================================================ */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const SRC = path.resolve(ROOT, '../uphys-snapshot')
const OUT = path.join(ROOT, 'public/learn/reading')
const ASSET_OUT = path.join(ROOT, 'public/learn/assets')

/* ---------- 1. 读本站课节，建 课节id → (章,节) 映射 ---------- */
const courseMap = {}        // courseId → { ch, sec, url }
const report = []
const secSeen = {}          // chId → Set(secNo) 被课节引用的小节
for (const f of fs.readdirSync(path.join(ROOT, 'public/weblec'))) {
  if (!/^courses(_.*)?\.json$/.test(f)) continue
  const courses = JSON.parse(fs.readFileSync(path.join(ROOT, 'public/weblec', f), 'utf-8'))
  for (const c of courses) {
    const m = /^(\d+)-(\d+)\s*/.exec(c.title ?? '')
    if (!m) { report.push(`SKIP  ${c.id}  「${c.title}」（无节号标题）`); continue }
    const ch = `ch${m[1].padStart(2, '0')}`
    const sec = `${m[1]}.${Number(m[2])}`
    const url = `/learn/textbook.html?ch=${ch}&sec=${sec}`
    courseMap[c.id] = { ch, sec, url, title: c.title }
    ;(secSeen[ch] ??= new Set()).add(sec)
  }
}

/* ---------- 2. 逐章切片 ---------- */
/* (章,节) → 课节 id 反查：让阅读页能给出「交互课堂/静态幻灯片」并行入口 */
const secToCourse = {}
for (const [id, m] of Object.entries(courseMap)) secToCourse[`${m.ch}@${m.sec}`] = id

/* 输出文件名是确定性的：原地覆盖写，再按清单清掉不再产生的旧文件。
   不做整目录 rm——dev 服务器的文件监视会在 Windows 上锁住目录句柄。 */
fs.mkdirSync(OUT, { recursive: true })
const written = new Set()
const keepFile = f => { written.add(path.resolve(f)); return f }
const index = {}            // chId → { title, chapter, subject, sections: [{sec,title,blocks}] }
const assetRefs = new Set() // 被引用的 assets/ 路径
let totalIn = 0, totalOut = 0, droppedHomework = 0

/** 深度遍历块 JSON，重写 assets/ 路径并登记；
    交互实验页单独指到已移植的 /labs/（带 query/锚点的引用按文件名归位）；
    整串是路径的情况（figure.src 等）之外，还要处理内联 HTML 里嵌入的
    引用，如 example 块 solution_steps 中的 <img src="assets/..."> */
function rewriteAssets(node) {
  if (typeof node === 'string') {
    const lab = /^assets\/interactives\/([^#?]+\.html)/.exec(node)
    if (lab) return '/labs/' + lab[1] + node.slice(lab[0].length)
    if (node.startsWith('assets/')) { assetRefs.add(node); return '/learn/' + node }
    if (node.includes('assets/')) {
      return node.replace(/(["'(=]\s*)assets\/([^\s"'<>\\)]+)/g, (m, pre, p) => {
        const ref = 'assets/' + p
        const labIn = /^assets\/interactives\/([^#?]+\.html)/.exec(ref)
        if (labIn) return pre + '/labs/' + labIn[1] + ref.slice(labIn[0].length)
        assetRefs.add(ref)
        return pre + '/learn/' + ref
      })
    }
    return node
  }
  if (Array.isArray(node)) return node.map(rewriteAssets)
  if (node && typeof node === 'object') {
    for (const k of Object.keys(node)) node[k] = rewriteAssets(node[k])
  }
  return node
}

for (const f of fs.readdirSync(path.join(SRC, 'data/chapters')).sort()) {
  if (!/^ch\d+\.json$/.test(f)) continue
  const data = JSON.parse(fs.readFileSync(path.join(SRC, 'data/chapters', f), 'utf-8'))
  const chId = data.id
  const blocks = data.blocks ?? []
  totalIn += blocks.length

  /* preamble = 首个 section 前的块（导学/章首视频等）；homework 块整体剔除 */
  const sections = []       // {sec, title, blocks[]}
  const preamble = []
  let cur = null
  for (const b of blocks) {
    if (b.type === 'homework') { droppedHomework++; continue }
    if (b.type === 'section') {
      cur = { sec: b.number, title: b.title, head: b, blocks: [] }
      sections.push(cur)
      continue
    }
    ;(cur ? cur.blocks : preamble).push(b)
  }
  const preambleOut = preamble.filter(b => b.type !== 'homework')

  fs.mkdirSync(path.join(OUT, chId), { recursive: true })
  index[chId] = {
    title: data.title, chapter: data.chapter, subject: data.subject,
    sections: [],
  }
  for (const s of sections) {
    const outBlocks = [s.head, ...s.blocks].map(b => rewriteAssets(JSON.parse(JSON.stringify(b))))
    totalOut += outBlocks.length
    const file = `${String(s.sec).replace('.', '-')}.json`
    fs.writeFileSync(keepFile(path.join(OUT, chId, file)), JSON.stringify({
      id: chId, chapter: data.chapter, title: data.title, subject: data.subject,
      sec: s.sec, secTitle: s.title, courseId: secToCourse[`${chId}@${s.sec}`] ?? null,
      blocks: outBlocks,
    }))
    index[chId].sections.push({ sec: s.sec, title: s.title, blocks: outBlocks.length })
  }
  /* 章 preamble 单独成文件（「本章导学」页） */
  if (preambleOut.length) {
    totalOut += preambleOut.length
    fs.writeFileSync(keepFile(path.join(OUT, chId, 'intro.json')), JSON.stringify({
      id: chId, chapter: data.chapter, title: data.title, subject: data.subject,
      sec: null, secTitle: '本章导学', blocks: preambleOut.map(b => rewriteAssets(JSON.parse(JSON.stringify(b)))),
    }))
  }

  /* 映射核对：平台有但本站无课的小节；本站有课但平台无小节 */
  const platSecs = new Set(sections.map(s => String(s.sec)))
  const siteSecs = secSeen[chId] ?? new Set()
  for (const s of platSecs) if (!siteSecs.has(s)) report.push(`NOTE  ${chId} §${s} 平台有小节，本站无对应课节`)
  for (const s of siteSecs) if (!platSecs.has(s)) report.push(`WARN  ${chId} §${s} 本站有课节，平台无对应小节！`)
}
fs.writeFileSync(keepFile(path.join(OUT, 'index.json')), JSON.stringify(index, null, 1))

/* 清掉本次未再产生的旧小节文件（容错：被占用就跳过，不影响本次产物） */
function prune(dir) {
  let entries
  try { entries = fs.readdirSync(dir, { withFileTypes: true }) } catch { return }
  for (const e of entries) {
    const p = path.join(dir, e.name)
    if (e.isDirectory()) { prune(p); try { if (!fs.readdirSync(p).length) fs.rmdirSync(p) } catch {} }
    else if (!written.has(path.resolve(p))) { try { fs.unlinkSync(p) } catch {} }
  }
}
prune(OUT)

/* ---------- 3. 按需拷贝 assets ---------- */
let copied = 0, missing = 0
for (const ref of assetRefs) {
  const from = path.join(SRC, ref)
  const to = path.join(ASSET_OUT, path.relative('assets', ref))
  if (!fs.existsSync(from)) { missing++; report.push(`WARN  缺失资源 ${ref}`); continue }
  fs.mkdirSync(path.dirname(to), { recursive: true })
  fs.copyFileSync(from, to)
  copied++
}

/* ---------- 4. 写课节映射表 ---------- */
const mapOut = {}
for (const [id, m] of Object.entries(courseMap)) mapOut[id] = m.url
fs.writeFileSync(path.join(ROOT, 'src/lib/textbook-map.json'), JSON.stringify(mapOut, null, 1))

/* ---------- 5. 报告 ---------- */
const secCount = Object.values(index).reduce((n, c) => n + c.sections.length, 0)
console.log(`切片：${Object.keys(index).length} 章 / ${secCount} 小节，块 ${totalIn} → ${totalOut}（剔除 homework ${droppedHomework}）`)
console.log(`资源：引用 ${assetRefs.size}，已拷 ${copied}，缺失 ${missing}`)
console.log(`映射：${Object.keys(mapOut).length} 节课节 → 课本小节`)
console.log('\n== 映射核对 ==')
report.forEach(r => console.log(r))
