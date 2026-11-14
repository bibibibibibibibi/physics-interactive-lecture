/** Chapter 6 real-browser mobile smoke checks at 375 x 812. */
import assert from 'node:assert/strict'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright'

const root = fileURLToPath(new URL('../', import.meta.url))
const repo = path.resolve(root, '..')
const baseUrl = (process.argv.find((_, index, all) => all[index - 1] === '--base-url') || 'http://127.0.0.1:4173').replace(/\/$/, '')
const output = path.join(repo, 'work', 'quality-engineering', 'chapter06', 'mobile')
const courses = Array.from({ length: 7 }, (_, index) => `kin6-${index + 1}-preview`)
await mkdir(output, { recursive: true })

const report = {
  scope: 'Real-browser 375px viewport, page overflow, visible controls and all diagnostic-card interaction checks; not a substitute for human device testing.',
  viewport: { width: 375, height: 812 },
  courses: [],
}
let browser
try {
  browser = await chromium.launch({ channel: process.platform === 'win32' ? 'msedge' : 'chrome', headless: true })
  report.browser_version = browser.version()
  const context = await browser.newContext({
    viewport: report.viewport,
    deviceScaleFactor: 1,
    isMobile: true,
    hasTouch: true,
  })
  const page = await context.newPage()
  for (const course of courses) {
    const data = JSON.parse(await readFile(path.join(root, 'public', 'weblec', course, 'weblec.json'), 'utf8'))
    const courseResult = {
      course,
      pages: [],
      quizzes: [],
      browser_errors: [],
      layout_issues: [],
    }
    const onError = error => courseResult.browser_errors.push(String(error))
    const onConsole = message => {
      if (message.type() === 'error') courseResult.browser_errors.push(`console: ${message.text()}`)
    }
    const onResponse = response => {
      if (response.url().startsWith(`${baseUrl}/`) && response.status() >= 400 && !response.url().includes('/api/ask')) {
        courseResult.browser_errors.push(`${response.status()} ${response.url()}`)
      }
    }
    page.on('pageerror', onError)
    page.on('console', onConsole)
    page.on('response', onResponse)

    await page.goto(`${baseUrl}/?course=${course}&qa=1`)
    await page.waitForFunction(() => {
      const audio = document.querySelector('audio')
      return audio && audio.readyState >= 1 && Number.isFinite(audio.duration)
    }, null, { timeout: 30000 })
    await page.waitForFunction(() => window.__qaDone === true, null, { timeout: Math.max(60000, data.slides.length * 6000) })
    courseResult.layout_issues = await page.evaluate(() => window.__qaIssues || [])
    await page.addStyleTag({ content: 'div.fixed.bottom-4.left-4 { display: none !important; }' })

    const playButton = page.locator('button[title="播放/暂停（空格）"]')
    assert.equal(await playButton.isVisible(), true, `${course}: play control must be visible`)
    assert.equal(await playButton.isEnabled(), true, `${course}: play control must be enabled`)
    for (const slide of data.slides) {
      const steps = Object.values(slide.stepTimes)
      const last = steps.length ? Math.max(...steps) : slide.t_start
      const target = Math.min(last + 0.4, slide.t_end - 0.05)
      await page.locator('audio').evaluate((audio, time) => { audio.currentTime = time }, target)
      await page.waitForFunction(time => {
        const audio = document.querySelector('audio')
        return audio && !audio.seeking && Math.abs(audio.currentTime - time) < 0.2
      }, target, { timeout: 10000 })
      await page.evaluate(() => document.fonts.ready)
      await page.waitForFunction(() => document.getAnimations().every(animation => (
        animation.playState !== 'running' || animation.effect?.getTiming().iterations === Infinity
      )), null, { timeout: 5000 })
      const geometry = await page.evaluate(() => {
        const stage = document.querySelector('.aspect-video')
        const control = document.querySelector('button[title="播放/暂停（空格）"]')
        const stageRect = stage?.getBoundingClientRect()
        const controlRect = control?.getBoundingClientRect()
        const scrollWidth = Math.max(document.documentElement.scrollWidth, document.body.scrollWidth)
        return {
          viewport_width: window.innerWidth,
          scroll_width: scrollWidth,
          horizontal_overflow: scrollWidth > window.innerWidth + 1,
          stage: stageRect ? { left: stageRect.left, right: stageRect.right, top: stageRect.top, width: stageRect.width } : null,
          control: controlRect ? { left: controlRect.left, right: controlRect.right, top: controlRect.top, bottom: controlRect.bottom } : null,
          visible_text_nodes: Array.from(stage?.querySelectorAll('*') || []).filter(element => {
            const style = getComputedStyle(element)
            const rect = element.getBoundingClientRect()
            return element.childElementCount === 0 && element.textContent.trim() && style.visibility !== 'hidden' && style.display !== 'none' && rect.width > 0 && rect.height > 0
          }).length,
        }
      })
      geometry.page = slide.id
      geometry.control_usable = Boolean(geometry.control && geometry.control.left >= -1 && geometry.control.right <= 376 && geometry.control.top >= -1 && geometry.control.bottom <= 813)
      geometry.stage_inside_viewport = Boolean(geometry.stage && geometry.stage.left >= -1 && geometry.stage.right <= 376 && geometry.stage.width > 0)
      courseResult.pages.push(geometry)
      await page.screenshot({ path: path.join(output, `${course}-page-${String(slide.id).padStart(2, '0')}.png`), fullPage: true, animations: 'disabled' })
    }

    const quizzes = data.slides.flatMap(slide => (slide.interactions || []).map(quiz => ({ page: slide.id, quiz })))
    for (const [index, item] of quizzes.entries()) {
      const result = { page: item.page, question: item.quiz.q }
      try {
        await page.goto(`${baseUrl}/?course=${course}`)
        await page.waitForFunction(() => {
          const audio = document.querySelector('audio')
          return audio && audio.readyState >= 1 && Number.isFinite(audio.duration)
        }, null, { timeout: 30000 })
        const start = Math.max(item.quiz.t - 0.7, 0)
        await page.locator('audio').evaluate((audio, time) => { audio.currentTime = time }, start)
        await page.waitForFunction(time => {
          const audio = document.querySelector('audio')
          return audio && !audio.seeking && Math.abs(audio.currentTime - time) < 0.2
        }, start)
        await playButton.click()
        const dialog = page.getByRole('dialog')
        await dialog.waitFor({ state: 'visible', timeout: 10000 })
        const dialogRect = await dialog.boundingBox()
        result.dialog_inside_viewport = Boolean(dialogRect && dialogRect.x >= -1 && dialogRect.x + dialogRect.width <= 376)
        await dialog.locator('button').nth(item.quiz.answer).click()
        await dialog.getByText('判断与参考结论一致。', { exact: true }).waitFor()
        await dialog.getByText('你的选项对应的理由', { exact: true }).waitFor()
        await dialog.screenshot({ path: path.join(output, `${course}-quiz-${index + 1}.png`), animations: 'disabled' })
        await dialog.getByRole('button', { name: '继续播放 ▶', exact: true }).click()
        await page.waitForFunction(() => {
          const audio = document.querySelector('audio')
          return audio && !audio.paused
        })
        result.status = 'passed'
      } catch (error) {
        result.status = 'failed'
        result.error = String(error)
        courseResult.browser_errors.push(`mobile quiz P${item.page}: ${String(error)}`)
      }
      courseResult.quizzes.push(result)
    }
    courseResult.summary = {
      pages: courseResult.pages.length,
      horizontal_overflow_pages: courseResult.pages.filter(item => item.horizontal_overflow).length,
      stage_outside_pages: courseResult.pages.filter(item => !item.stage_inside_viewport).length,
      unusable_control_pages: courseResult.pages.filter(item => !item.control_usable).length,
      quizzes_passed: courseResult.quizzes.filter(item => item.status === 'passed').length,
      quizzes_failed: courseResult.quizzes.filter(item => item.status === 'failed').length,
      dialog_outside: courseResult.quizzes.filter(item => !item.dialog_inside_viewport).length,
      browser_errors: courseResult.browser_errors.length,
    }
    courseResult.result = courseResult.summary.horizontal_overflow_pages === 0
      && courseResult.summary.stage_outside_pages === 0
      && courseResult.summary.unusable_control_pages === 0
      && courseResult.summary.quizzes_failed === 0
      && courseResult.summary.dialog_outside === 0
      && courseResult.summary.browser_errors === 0
      && courseResult.summary.quizzes_passed === quizzes.length ? 'passed' : 'failed'
    report.courses.push(courseResult)
    page.off('pageerror', onError)
    page.off('console', onConsole)
    page.off('response', onResponse)
    console.log(JSON.stringify({ course, result: courseResult.result, summary: courseResult.summary }, null, 2))
  }
  report.summary = {
    courses: report.courses.length,
    pages: report.courses.reduce((sum, item) => sum + item.summary.pages, 0),
    horizontal_overflow_pages: report.courses.reduce((sum, item) => sum + item.summary.horizontal_overflow_pages, 0),
    stage_outside_pages: report.courses.reduce((sum, item) => sum + item.summary.stage_outside_pages, 0),
    unusable_control_pages: report.courses.reduce((sum, item) => sum + item.summary.unusable_control_pages, 0),
    quizzes_passed: report.courses.reduce((sum, item) => sum + item.summary.quizzes_passed, 0),
    quizzes_failed: report.courses.reduce((sum, item) => sum + item.summary.quizzes_failed, 0),
    dialog_outside: report.courses.reduce((sum, item) => sum + item.summary.dialog_outside, 0),
    browser_errors: report.courses.reduce((sum, item) => sum + item.summary.browser_errors, 0),
  }
  report.result = report.courses.every(item => item.result === 'passed') ? 'passed' : 'failed'
} finally {
  await writeFile(path.join(output, 'report.json'), JSON.stringify(report, null, 2), 'utf8')
  if (browser) await browser.close()
}
console.log(JSON.stringify({ result: report.result, summary: report.summary }, null, 2))
