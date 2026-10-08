import path from 'path'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

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
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    // The temporary build directory is reusable; cleanup is explicit and recoverable.
    emptyOutDir: false,
    outDir: 'dist-slides',
    assetsInlineLimit: 100 * 1024 * 1024,
    rollupOptions: {
      input: path.resolve(__dirname, 'slides.html'),
      output: { inlineDynamicImports: true },
    },
  },
})
