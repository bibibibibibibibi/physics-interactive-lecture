/** Course-owned builds and preview. Never load the shared Vite config. */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';
import { createHash } from 'node:crypto';

const COURSE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(COURSE, '../../..');
const APP = path.join(ROOT, 'interactive-lecture');
const WORK = path.join(ROOT, 'work/special-series/sp2');
// Tailwind's existing configuration resolves content from the application cwd.
process.chdir(APP);
process.env.JITI_CACHE = 'false';
const require = createRequire(path.join(APP, 'package.json'));
async function packageImport(name) {
  return import(pathToFileURL(require.resolve(name)).href);
}
const { build, preview } = await packageImport('vite');
const { default: react } = await packageImport('@vitejs/plugin-react');
const visualOnly = process.argv.includes('--visual-only');
const mode = process.argv[2] || 'slides';
const compileOnly = mode === 'check';
const appMode = mode === 'app' || compileOnly || process.argv.includes('--app');
if (visualOnly && appMode) throw new Error('The untimed visual preview is only for manual slides, never the audio player.');
const publicDir = compileOnly ? false : path.join(WORK, visualOnly ? 'visual-preview/public' : 'public');
const outDir = path.join(WORK, compileOnly ? 'frontend-preflight' : visualOnly ? 'visual-preview/slides-stage' : appMode ? 'app-stage' : 'slides-stage');
if (!compileOnly) {
  const dataPath = path.join(publicDir, 'weblec/sp2/weblec.json');
  if (!fs.existsSync(dataPath)) throw new Error('Build the isolated sp2 data first; shared published data is never a fallback.');
  const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
  if (!visualOnly && (data.preview_mode || !(data.duration > 0) || !fs.existsSync(path.join(publicDir, 'weblec/sp2/audio.mp3')))) {
    throw new Error('The lecture candidate requires real matched audio and timing; use --visual-only for manual layout review.');
  }
}
const readOnlyPoses = {
  name: 'sp2-read-only-poses',
  configurePreviewServer(server) {
    server.middlewares.use((req, res, next) => {
      const hit = /^\/poses\/([a-z0-9_-]+)\/(pose_[a-z0-9_-]+\.png)(?:\?.*)?$/.exec(req.url || '');
      if (!hit) return next();
      const file = path.join(APP, 'public/poses', hit[1], hit[2]);
      if (!fs.existsSync(file)) return next();
      res.setHeader('Content-Type', 'image/png');
      fs.createReadStream(file).pipe(res);
    });
  },
};
const rendererSourceHashes = {};
const sha = value => createHash('sha256').update(value).digest('hex');
const fingerprintRenderer = {
  name: 'sp2-renderer-fingerprint', enforce: 'pre',
  transform(code, id) {
    const file = id.split('?')[0];
    if (file.startsWith(path.join(APP, 'src') + path.sep)) {
      rendererSourceHashes[path.relative(APP, file)] = sha(code);
    }
    return null;
  },
};
const config = {
  configFile: false,
  root: APP,
  base: './',
  publicDir,
  cacheDir: path.join(WORK, 'vite-cache', visualOnly ? 'visual' : mode),
  plugins: [fingerprintRenderer, react(), readOnlyPoses],
  resolve: { alias: { '@': path.join(APP, 'src') } },
  build: {
    outDir, emptyOutDir: false,
    assetsInlineLimit: appMode ? 4096 : 100 * 1024 * 1024,
    rollupOptions: appMode
      ? { input: { main: path.join(APP, 'index.html'), slides: path.join(APP, 'slides.html') } }
      : { input: path.join(APP, 'slides.html'), output: { inlineDynamicImports: true } },
  },
};
if (mode === 'serve') {
  const portArg = process.argv.find(x => x.startsWith('--port='));
  const server = await preview({ ...config, preview: { host: '127.0.0.1', port: Number(portArg?.slice(7) || 8122), strictPort: true, open: false } });
  server.printUrls();
} else {
  if (!['slides', 'app', 'check'].includes(mode)) throw new Error(`Unknown candidate build mode: ${mode}`);
  const result = await build(config);
  const outputs = (Array.isArray(result) ? result : [result]).flatMap(r => r.output ?? []);
  const manifest = {
    generated_at: new Date().toISOString(), mode, visual_only: visualOnly,
    compile_only: compileOnly, source_sha256: sha(fs.readFileSync(path.join(COURSE, 'slides.json'))),
    candidate_data_sha256: compileOnly ? null : sha(fs.readFileSync(path.join(publicDir, 'weblec/sp2/weblec.json'))),
    source_hash_basis: 'Code actually received by the pre-transform hook during this build',
    renderer_source_files: rendererSourceHashes,
    output_files: outputs.map(o => {
      const file = path.join(outDir, o.fileName);
      return { path: file, sha256: sha(fs.readFileSync(file)), bytes: fs.statSync(file).size };
    }),
  };
  const manifestPath = path.join(outDir, 'renderer-build.json');
  if (fs.existsSync(manifestPath)) {
    const old = path.join(WORK, 'renderer-manifests', `${Date.now()}-${mode}.json`);
    fs.mkdirSync(path.dirname(old), { recursive: true }); fs.copyFileSync(manifestPath, old);
  }
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n');
}
