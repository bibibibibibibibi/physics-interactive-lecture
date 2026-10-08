/** Actual deployment smoke test. No TTS, no QA auto-runner, no course rebuild. */
import assert from 'node:assert/strict'
import { spawn, execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { createServer } from 'node:net'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright'

const root = fileURLToPath(new URL('../', import.meta.url))
const repo = path.resolve(root, '..')
const dist = path.join(root, 'dist')
const output = path.join(repo, 'work/project-sync/browser-smoke', new Date().toISOString().replace(/[:.]/g, '-'))
await mkdir(output, { recursive: true })
const isWindows = process.platform === 'win32'
const channel = process.env.LECTURE_BROWSER_CHANNEL || (isWindows ? 'msedge' : 'chrome')
const executablePath = process.env.LECTURE_BROWSER_EXECUTABLE
const exec = promisify(execFile)
const reserve = createServer()
await new Promise((resolve, reject) => { reserve.once('error', reject); reserve.listen(0, '127.0.0.1', resolve) })
const port = reserve.address().port
await new Promise(resolve => reserve.close(resolve))
const command = isWindows ? 'powershell.exe' : (process.env.LECTURE_PYTHON || 'python3')
const args = isWindows
  ? ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', path.join(dist, 'serve-win.ps1'), '-Port', String(port), '-LastPort', String(port), '-NoBrowser']
  : [path.join(dist, 'serve-mac.py'), '--directory', dist, '--port', String(port), '--last-port', String(port), '--no-browser']
const server = spawn(command, args, { cwd: dist, stdio: ['ignore', 'pipe', 'pipe'] })
let log = ''
server.stdout.on('data', value => { log += value.toString() })
server.stderr.on('data', value => { log += value.toString() })
server.on('error', error => { log += String(error) })
let browser
let page
const evidence = { platform: process.platform, channel: executablePath ? 'configured-executable' : channel, url: `http://127.0.0.1:${port}`, courses: [], operations: [], scope: 'Deployment and browser smoke only; no complete course interaction, human listening or teaching approval.' }
const errors = []
async function mediaSnapshot() {
  if (!page || page.isClosed()) return null
  return page.evaluate(() => ({
    url: location.href, title: document.querySelector('h1')?.textContent,
    media: [...document.querySelectorAll('audio,video')].map(a => ({
      tag: a.tagName, src: a.getAttribute('src'), currentSrc: a.currentSrc,
      paused: a.paused, time: a.currentTime, duration: a.duration,
      readyState: a.readyState, networkState: a.networkState,
      error: a.error && { code: a.error.code, message: a.error.message },
    })), trace: window.__lectureMediaTrace,
  }))
}
try {
  const base = evidence.url
  let ready = false
  for (let attempt = 0; attempt < 400; attempt++) {
    if (server.exitCode !== null) throw new Error(`Server exited: ${log}`)
    try { const response = await fetch(`${base}/`); if (response.ok) { ready = true; break } } catch {}
    await new Promise(resolve => setTimeout(resolve, 100))
  }
  assert.ok(ready, `Server did not become ready: ${log}`)
  browser = await chromium.launch({ ...(executablePath ? { executablePath } : { channel }), headless: true })
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } })
  await context.addInitScript(() => {
    const trace = window.__lectureMediaTrace = []
    const add = (event, a, detail) => {
      trace.push({ event, ms: performance.now(), ...(a ? {
        src: a.getAttribute('src'), currentSrc: a.currentSrc, paused: a.paused,
        time: a.currentTime, readyState: a.readyState, networkState: a.networkState,
        error: a.error && { code: a.error.code, message: a.error.message },
      } : {}), detail })
      if (trace.length > 200) trace.shift()
    }
    for (const event of ['loadstart', 'abort', 'emptied', 'loadedmetadata', 'canplay', 'play', 'playing', 'pause', 'waiting', 'stalled', 'error', 'seeked']) {
      document.addEventListener(event, e => { if (e.target instanceof HTMLMediaElement) add(event, e.target) }, true)
    }
    window.addEventListener('unhandledrejection', e => add('unhandledrejection', null, String(e.reason)))
    new MutationObserver(records => {
      for (const record of records) if (record.type === 'attributes' && record.target instanceof HTMLMediaElement) add('src-change', record.target, record.oldValue)
    }).observe(document, { subtree: true, attributes: true, attributeFilter: ['src'], attributeOldValue: true })
  })
  // Keep the test local. Remote optional links are outside this transport contract.
  await context.route('**/*', async route => {
    const url = route.request().url()
    if (/^https?:/.test(url) && !url.startsWith(base + '/')) return route.abort()
    return route.continue()
  })
  page = await context.newPage()
  page.on('pageerror', error => errors.push(String(error)))
  page.on('response', response => {
    if (response.url().startsWith(base + '/') && response.status() >= 400 && !response.url().includes('/api/ask')) errors.push(`${response.status()} ${response.url()}`)
  })
  await page.goto(`${base}/?menu=special`)
  const menu = JSON.parse(await readFile(path.join(dist, 'weblec/courses_special.json'), 'utf8'))
  assert.equal(menu.length, 8)
  for (const item of menu) {
    assert.equal(item.lectureAvailable, true)
    await page.locator(`a[href="/?course=${item.id}"]`).waitFor({ state: 'visible', timeout: 20000 })
    await page.locator(`a[href="${item.slidesUrl}"]`).waitFor({ state: 'visible' })
  }
  evidence.operations.push('Real special menu renders eight classroom and static links')
  await page.screenshot({ path: path.join(output, 'special-menu.png'), fullPage: true })
  for (const item of menu) {
    await page.goto(`${base}/?course=${item.id}`)
    await page.waitForFunction(() => {
      const audio = document.querySelector('audio')
      return audio && Number.isFinite(audio.duration) && audio.duration > 0 && audio.readyState >= 1
    }, null, { timeout: 30000 })
    const state = await page.locator('audio').evaluate(audio => ({ duration: audio.duration, source: audio.currentSrc, paused: audio.paused }))
    assert.ok(state.source.includes(`/weblec/${item.id}/audio.mp3`))
    const data = JSON.parse(await readFile(path.join(dist, 'weblec', item.id, 'weblec.json'), 'utf8'))
    assert.ok(Math.abs(state.duration - data.duration) < 3, `${item.id} decoded audio duration mismatch`)
    evidence.courses.push({ id: item.id, duration: state.duration, source: state.source })
  }
  await page.goto(`${base}/?course=sp1`)
  await page.locator('button[title="播放/暂停（空格）"]').waitFor({ state: 'visible' })
  evidence.before_first_play = await mediaSnapshot()
  await page.locator('button[title="播放/暂停（空格）"]').click()
  evidence.after_first_play = await mediaSnapshot()
  await page.waitForFunction(() => { const a = document.querySelector('audio'); return a && !a.paused && a.currentTime > 1 })
  await page.locator('button[title="播放/暂停（空格）"]').click()
  assert.equal(await page.locator('audio').evaluate(audio => audio.paused), true)
  await page.locator('audio').evaluate(audio => { audio.currentTime = 0.25 })
  await page.locator('button[title="播放/暂停（空格）"]').click()
  await page.waitForFunction(() => { const a = document.querySelector('audio'); return a && !a.paused && a.currentTime > 0.6 && a.currentTime < 2 })
  await page.locator('button[title="播放/暂停（空格）"]').click()
  evidence.operations.push('sp1 classroom UI play/pause and audio API backward seek then resume')
  await page.screenshot({ path: path.join(output, 'sp1-classroom.png') })
  const sp1 = JSON.parse(await readFile(path.join(dist, 'weblec/sp1/weblec.json'), 'utf8'))
  const videoPage = sp1.slides.find(slide => slide.elements.some(element => element.type === 'html' && element.src?.startsWith('synced-video.html')))
  assert.ok(videoPage, 'sp1 native video wrapper must exist')
  const videoElement = videoPage.elements.find(element => element.type === 'html' && element.src?.startsWith('synced-video.html'))
  await page.goto(`${base}/weblec/sp1/${videoElement.src}`)
  await page.waitForFunction(() => { const v = document.querySelector('video'); return v && v.readyState >= 1 && v.duration > 2 })
  const video = page.locator('video')
  assert.equal(await video.evaluate(v => v.controls), true)
  await video.evaluate(async v => { v.muted = true; await v.play() })
  await page.waitForFunction(() => { const v = document.querySelector('video'); return v && !v.paused && v.currentTime > 0.3 })
  await video.evaluate(v => { v.pause(); v.currentTime = Math.min(v.duration - 1, 2) })
  await page.waitForFunction(() => { const v = document.querySelector('video'); return v && !v.seeking && v.currentTime > 1.5 })
  await video.evaluate(v => { v.currentTime = 0.2 })
  await page.waitForFunction(() => { const v = document.querySelector('video'); return v && !v.seeking && v.currentTime < 0.5 })
  evidence.operations.push('Native video decodes with controls; media API play/pause and forward/backward seek')
  await page.screenshot({ path: path.join(output, 'native-video.png') })
  await page.goto(`${base}/weblec/sp1/sim_turntable.html?embed=1`)
  await page.locator('body > canvas').waitFor({ state: 'visible' })
  const sendModelTime = time => page.evaluate(t => window.postMessage({
    type: 'lecture-state', mode: 'interactive', pageId: 4, pageTime: t,
    playing: false, step: 2, steps: { 1: 0, 2: 1 },
  }, location.origin), time)
  await sendModelTime(6)
  await page.waitForFunction(() => {
    const data = document.body.dataset.lectureState
    return data && JSON.parse(data).pageTime === 6
  })
  const late = JSON.parse(await page.locator('body').getAttribute('data-lecture-state'))
  await sendModelTime(1)
  await page.waitForFunction(() => {
    const data = document.body.dataset.lectureState
    return data && JSON.parse(data).pageTime === 1
  })
  const early = JSON.parse(await page.locator('body').getAttribute('data-lecture-state'))
  assert.ok(Number.isFinite(early.omega) && Number.isFinite(late.omega))
  assert.ok(late.r < early.r && late.omega > early.omega, 'Model must restore earlier radius/rotation after backward time')
  evidence.operations.push('WebGL model loads and restores its actual radius/rotation on a backward timeline message')
  await page.screenshot({ path: path.join(output, 'webgl-model.png') })
  assert.deepEqual(errors, [], `Browser runtime/asset errors: ${errors.join('\n')}`)
  evidence.result = 'passed'
  console.log(`Browser smoke passed on ${process.platform}/${channel}: eight classrooms, real audio playback and native video decoding/seek.`)
} catch (error) {
  evidence.result = 'failed'
  evidence.failure = String(error)
  evidence.failure_state = await mediaSnapshot().catch(error => ({ snapshot_failure: String(error) }))
  if (page && !page.isClosed()) await page.screenshot({ path: path.join(output, 'failure.png') }).catch(error => { evidence.screenshot_failure = String(error) })
  throw error
} finally {
  evidence.browser_errors = errors
  if (browser) await browser.close().catch(error => { evidence.browser_close_failure = String(error); process.exitCode = 1 })
  if (server.exitCode === null) {
    if (isWindows) await exec('taskkill.exe', ['/PID', String(server.pid), '/T', '/F']).catch(error => { evidence.stop_failure = String(error); process.exitCode = 1 })
    else server.kill('SIGTERM')
  }
  await writeFile(path.join(output, 'server.log'), log)
  await writeFile(path.join(output, 'result.json'), JSON.stringify(evidence, null, 2) + '\n')
  console.log(`Evidence retained: ${output}`)
}
