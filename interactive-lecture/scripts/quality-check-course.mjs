/** Repeatable single-course layout and quiz acceptance check.
 * Usage: node scripts/quality-check-course.mjs --course kin5-1 --base-url http://127.0.0.1:4173 --output ../work/quality-engineering/kin5-1/baseline
 * Requires an already running lecture server. No TTS or course rebuild is performed.
 */
import assert from 'node:assert/strict'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright'

const root = fileURLToPath(new URL('../', import.meta.url))
const repo = path.resolve(root, '..')
const args = process.argv.slice(2)
const option = (name, fallback) => {
  const index = args.indexOf(`--${name}`)
  return index >= 0 ? args[index + 1] : fallback
}
const course = option('course', 'kin5-1')
const baseUrl = option('base-url', 'http://127.0.0.1:4173').replace(/\/$/, '')
const output = path.resolve(root, option('output', path.join('..', 'work', 'quality-engineering', course, 'latest')))
const skipQuizzes = args.includes('--skip-quizzes')
const skipScreenshots = args.includes('--skip-screenshots')
await mkdir(output, { recursive: true })

const dataPath = path.join(root, 'public', 'weblec', course, 'weblec.json')
const data = JSON.parse(await readFile(dataPath, 'utf8'))
const sha256 = value => createHash('sha256').update(value).digest('hex')
const report = {
  course,
  base_url: baseUrl,
  scope: 'Automated layout, browser runtime and quiz operation checks only; no human listening, independent physics review or teacher approval.',
  weblec_sha256: sha256(await readFile(dataPath)),
  started_at: new Date().toISOString(),
  layout_issues: [],
  quiz_results: [],
  browser_errors: [],
  screenshots: [],
}
let browser
try {
  browser = await chromium.launch({ channel: process.platform === 'win32' ? 'msedge' : 'chrome', headless: true })
  report.browser_version = browser.version()
  const context = await browser.newContext({ viewport: { width: 1600, height: 1000 }, deviceScaleFactor: 1 })
  const page = await context.newPage()
  page.on('pageerror', error => report.browser_errors.push(String(error)))
  page.on('console', message => {
    if (message.type() === 'error') report.browser_errors.push(`console: ${message.text()}`)
  })
  page.on('response', response => {
    if (response.url().startsWith(`${baseUrl}/`) && response.status() >= 400 && !response.url().includes('/api/ask')) {
      report.browser_errors.push(`${response.status()} ${response.url()}`)
    }
  })

  await page.goto(`${baseUrl}/?course=${course}&qa=1`)
  await page.waitForFunction(() => {
    const audio = document.querySelector('audio')
    return audio && audio.readyState >= 1 && Number.isFinite(audio.duration)
  }, null, { timeout: 30000 })
  await page.waitForFunction(() => window.__qaDone === true, null, { timeout: Math.max(60000, data.slides.length * 6000) })
  report.layout_issues = await page.evaluate(() => window.__qaIssues || [])
  await page.addStyleTag({ content: 'div.fixed.bottom-4.left-4 { display: none !important; }' })

  if (!skipScreenshots) {
    const stage = page.locator('.aspect-video').first()
    for (const slide of data.slides) {
      const steps = Object.values(slide.stepTimes)
      const last = steps.length ? Math.max(...steps) : slide.t_start
      const target = Math.min(last + 0.4, slide.t_end - 0.05)
      await page.locator('audio').evaluate(async (audio, time) => {
        if (audio.readyState < 1) await new Promise(resolve => audio.addEventListener('loadedmetadata', resolve, { once: true }))
        audio.currentTime = time
      }, target)
      await page.waitForFunction(time => {
        const audio = document.querySelector('audio')
        return audio && !audio.seeking && Math.abs(audio.currentTime - time) < 0.2
      }, target, { timeout: 10000 })
      await page.evaluate(() => document.fonts.ready)
      // Wait for finite enter/leave animations instead of capturing a page transition.
      await page.waitForFunction(() => document.getAnimations().every(animation => (
        animation.playState !== 'running' || animation.effect?.getTiming().iterations === Infinity
      )), null, { timeout: 5000 })
      const filename = `page-${String(slide.id).padStart(2, '0')}.png`
      await stage.screenshot({ path: path.join(output, filename), animations: 'disabled' })
      report.screenshots.push(filename)
    }
  }

  if (!skipQuizzes) {
    const quizzes = data.slides.flatMap(slide => (slide.interactions || []).map(quiz => ({ page: slide.id, quiz })))
    report.quiz_feedback_results = []
    const openQuiz = async item => {
      // Each attempt starts clean so wrong-answer feedback and the correct path are both tested.
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
      await page.locator('button[title="播放/暂停（空格）"]').click()
      const dialog = page.getByRole('dialog')
      await dialog.waitFor({ state: 'visible', timeout: 10000 })
      assert.equal(await page.locator('audio').evaluate(audio => audio.paused), true, 'Quiz must pause audio')
      return dialog
    }
    const continueAfterAnswer = async dialog => {
      await dialog.getByRole('button', { name: '继续播放 ▶', exact: true }).click()
      await page.waitForFunction(() => {
        const audio = document.querySelector('audio')
        return audio && !audio.paused
      })
    }
    for (const [index, item] of quizzes.entries()) {
      const result = { page: item.page, question: item.quiz.q, trigger: item.quiz.t }
      try {
        const dialog = await openQuiz(item)
        if (Array.isArray(item.quiz.options)) {
          await dialog.locator('button').nth(item.quiz.answer).click()
          await dialog.getByText('判断与参考结论一致。', { exact: true }).waitFor()
          if (item.quiz.feedbackPerOption?.[item.quiz.answer]) {
            await dialog.getByText('你的选项对应的理由', { exact: true }).waitFor()
          }
          const filename = `quiz-${String(index + 1).padStart(2, '0')}-answered.png`
          await dialog.screenshot({ path: path.join(output, filename), animations: 'disabled' })
          report.screenshots.push(filename)
        } else {
          await dialog.getByRole('button', { name: '查看参考答案', exact: true }).click()
        }
        await continueAfterAnswer(dialog)
        result.status = 'passed'
      } catch (error) {
        result.status = 'failed'
        result.error = String(error)
        report.browser_errors.push(`quiz P${item.page}: ${String(error)}`)
      }
      report.quiz_results.push(result)

      if (Array.isArray(item.quiz.options) && item.quiz.feedbackPerOption) {
        const wrongIndex = (item.quiz.answer + 1) % item.quiz.options.length
        const feedback = { page: item.page, option: wrongIndex }
        try {
          const dialog = await openQuiz(item)
          await dialog.locator('button').nth(wrongIndex).click()
          await dialog.getByText(`参考结论是 ${'ABCD'[item.quiz.answer]}，请核对下面的理由。`, { exact: true }).waitFor()
          await dialog.getByText('你的选项对应的理由', { exact: true }).waitFor()
          const filename = `quiz-${String(index + 1).padStart(2, '0')}-wrong-feedback.png`
          await dialog.screenshot({ path: path.join(output, filename), animations: 'disabled' })
          report.screenshots.push(filename)
          await continueAfterAnswer(dialog)
          feedback.status = 'passed'
        } catch (error) {
          feedback.status = 'failed'
          feedback.error = String(error)
          report.browser_errors.push(`quiz feedback P${item.page}: ${String(error)}`)
        }
        report.quiz_feedback_results.push(feedback)
      }
    }
  }

  const blocking = report.layout_issues.filter(issue => issue.kind !== '文本框过宽(参考)')
  report.summary = {
    pages: data.slides.length,
    layout_blocking: blocking.length,
    layout_reference: report.layout_issues.length - blocking.length,
    quizzes_passed: report.quiz_results.filter(item => item.status === 'passed').length,
    quizzes_failed: report.quiz_results.filter(item => item.status === 'failed').length,
    quiz_feedback_passed: (report.quiz_feedback_results || []).filter(item => item.status === 'passed').length,
    quiz_feedback_failed: (report.quiz_feedback_results || []).filter(item => item.status === 'failed').length,
    browser_errors: report.browser_errors.length,
  }
  report.result = blocking.length === 0 && report.browser_errors.length === 0
    && report.quiz_results.every(item => item.status === 'passed')
    && (report.quiz_feedback_results || []).every(item => item.status === 'passed') ? 'passed' : 'failed'
} catch (error) {
  report.result = 'failed'
  report.failure = String(error)
  throw error
} finally {
  report.finished_at = new Date().toISOString()
  await writeFile(path.join(output, 'report.json'), JSON.stringify(report, null, 2), 'utf8')
  if (browser) await browser.close()
}
console.log(JSON.stringify({ output, result: report.result, summary: report.summary }, null, 2))
