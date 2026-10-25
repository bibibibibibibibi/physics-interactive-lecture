import path from 'path'
import { fileURLToPath } from 'url'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

/** esbuild 载入时 __dirname 可用（CJS）；runner 载入时是 ESM，需要从 import.meta 取。 */
const HERE = typeof __dirname !== 'undefined'
  ? __dirname
  : path.dirname(fileURLToPath(import.meta.url))

/**
 * 纯幻灯片静态页的独立构建：单 chunk（inlineDynamicImports）+
 * 字体内联（assetsInlineLimit 拉满，KaTeX 字体转 data URL），
 * 产物交给 lecture_factory/export_slides.py 打成单个 HTML 文件。
 * 用法：npm run build:slides
 */
export default defineConfig({
  base: './',
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(HERE, './src'),
    },
  },
  build: {
    // The temporary build directory is reusable; cleanup is explicit and recoverable.
    emptyOutDir: false,
    outDir: 'dist-slides',
    assetsInlineLimit: 100 * 1024 * 1024,
    rollupOptions: {
      input: path.resolve(HERE, 'slides.html'),
      output: { inlineDynamicImports: true },
    },
  },
})
