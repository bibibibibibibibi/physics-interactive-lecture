// 把 public/ 复制进 dist/，替代 Vite 内置的 copyPublicDir（已在 vite.config.ts 中关闭）。
//
// 为什么要绕开：public/learn/textbook 是一个被系统进程持有句柄的残留目录
// （拒绝访问、无法删除、无法改名），Vite 内置 copyDir 扫描到它就 EPERM 中断。
// 这里用 filter 精确跳过这一个目录，其余内容照常复制。
// 该僵尸目录将来被释放删除后，本脚本行为不变（filter 找不到它，无害）。
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)))
const PUBLIC = path.join(ROOT, 'public')
const DIST = path.join(ROOT, 'dist')

// 精确匹配僵尸目录本身（注意：learn/textbook.html 是正常文件，不能排除）
const SKIP = new Set([path.join(PUBLIC, 'learn', 'textbook').toLowerCase()])

let copied = 0
fs.cpSync(PUBLIC, DIST, {
  recursive: true,
  force: true,
  filter: (src) => {
    if (SKIP.has(path.resolve(src).toLowerCase())) return false
    copied += 1
    return true
  },
})
console.log(`[copy-public] ${copied} entries copied to dist/ (skipped locked dir: public/learn/textbook)`)
