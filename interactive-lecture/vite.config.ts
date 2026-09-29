import path from "path"
import react from "@vitejs/plugin-react"
import { defineConfig, loadEnv, type Plugin } from "vite"
import { inspectAttr } from 'kimi-plugin-inspect-react'

/**
 * /api/ask —— 答疑 AI 代理。
 * 前端把问题 + 当前知识点上下文 POST 过来，这里调用 OpenAI 兼容的
 * chat completions 接口（默认 Moonshot/Kimi）。API key 只存在于服务端：
 * 在 interactive-lecture/.env.local 里配置：
 *   AI_API_KEY=sk-...
 *   AI_BASE_URL=https://api.moonshot.cn/v1   （可选，默认 Kimi 开放平台）
 *   AI_MODEL=moonshot-v1-8k                  （可选）
 * 未配置 key 时接口返回 503，前端自动退回离线答疑库。
 */
function askAiPlugin(env: Record<string, string>): Plugin {
  return {
    name: 'ask-ai',
    configureServer(server) {
      server.middlewares.use('/api/ask', async (req, res) => {
        res.setHeader('Content-Type', 'application/json; charset=utf-8')
        if (req.method !== 'POST') {
          res.statusCode = 405
          res.end(JSON.stringify({ error: 'method not allowed' }))
          return
        }
        const apiKey = env.AI_API_KEY
        if (!apiKey) {
          res.statusCode = 503
          res.end(JSON.stringify({ error: 'AI_API_KEY not configured' }))
          return
        }
        try {
          const body = await new Promise<string>((resolve) => {
            let data = ''
            req.on('data', c => (data += c))
            req.on('end', () => resolve(data))
          })
          const { question, context } = JSON.parse(body)
          const baseUrl = (env.AI_BASE_URL || 'https://api.moonshot.cn/v1').replace(/\/$/, '')
          const model = env.AI_MODEL || 'moonshot-v1-8k'
          const sys = [
            '你是一位大学物理助教，正在配合一节「' + (context?.lecture ?? '') + '」的讲授视频回答学生提问。',
            '学生当前点击的知识点是：「' + (context?.bullet ?? '') + '」（所在页：' + (context?.slide ?? '') + '）。',
            '本页讲解原文：' + (context?.narration ?? ''),
            context?.qa ? '本知识点已有预设问答可供参考：' + context.qa : '',
            '要求：紧扣该知识点回答，通俗准确，150 字以内；公式用 LaTeX 行内语法 $...$ 表示；',
            '如果现有讲解材料无法直接回答这个问题，先明确说明"这个我暂时没法直接解答"，然后以"你是不是想问："开头列出 2-3 个与本节课相关、学生可能想问的问题；',
            '如果问题与本节课无关，简短回答后引导学生回到当前知识点。',
          ].join('\n')
          const resp = await fetch(`${baseUrl}/chat/completions`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
              model,
              messages: [
                { role: 'system', content: sys },
                { role: 'user', content: question },
              ],
              temperature: 0.3,
            }),
            signal: AbortSignal.timeout(30000),
          })
          if (!resp.ok) {
            res.statusCode = 502
            res.end(JSON.stringify({ error: `upstream ${resp.status}` }))
            return
          }
          const data = await resp.json() as any
          res.end(JSON.stringify({ answer: data.choices?.[0]?.message?.content ?? '' }))
        } catch (e: any) {
          res.statusCode = 500
          res.end(JSON.stringify({ error: String(e?.message ?? e) }))
        }
      })
    },
  }
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  return {
    base: './',
    plugins: [inspectAttr(), react(), askAiPlugin(env)],
    server: {
      port: 3000,
    },
    build: {
      // 多页构建：交互课堂 index.html + 静态幻灯片 slides.html 都要进 dist
      rollupOptions: {
        input: {
          main: path.resolve(__dirname, 'index.html'),
          slides: path.resolve(__dirname, 'slides.html'),
        },
      },
    },
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
  }
});
