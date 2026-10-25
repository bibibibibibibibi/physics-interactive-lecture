import path from 'path'
import { fileURLToPath } from 'url'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

/**
 * 纯幻灯片静态页的独立构建：单 chunk（inlineDynamicImports）+
 * 字体内联（assetsInlineLimit 拉满，KaTeX 字体转 data URL），
 * 产物交给 lecture_factory/export_slides.py 打成单个 HTML 文件。
 * 用法：npm run build:slides
 *
 * 用 .mjs 而不是 .ts：esbuild 在载入 .ts 配置时偶发
 * `Cannot read file "package.json": winapi error #5`（Access Denied），
 * 换成原生 ESM 的 .mjs 由 Node 直接 import，绕开 esbuild。
 */
const HERE = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  base: './',
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(HERE, './src'),
    },
  },
  build: {
    emptyOutDir: false,
    outDir: 'dist-slides',
    assetsInlineLimit: 100 * 1024 * 1024,
    rollupOptions: {
      input: path.resolve(HERE, 'slides.html'),
      output: { inlineDynamicImports: true },
    },
  },
})
