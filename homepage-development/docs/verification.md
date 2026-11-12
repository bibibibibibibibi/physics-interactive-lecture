# Package verification

Checked on 2026-11-11 on macOS, using Node.js 24.18.0 and npm 11.16.0.

## Installation and build

- Generated a reduced lockfile from the full application's lockfile and pinned package versions.
- Installed the standalone project's 137 dependency packages with `npm ci --offline --no-audit --no-fund`, using the local npm cache. The kit did not borrow the full application's `node_modules` directory.
- `npm run build` passed TypeScript checking and the Vite production build.
- Served the generated output through `npm run preview` on 127.0.0.1:4174. Checked that the page used production assets rather than the development client.

The archive contains source and the lockfile, not installed dependencies or generated build output. A first-time setup normally needs npm registry access. Installation was verified on this Mac, not on Windows/Linux or with an empty network cache.

## Browser checks

Headless Chrome checks passed for:

- Main heading, active SVG logo, and photograph loading.
- 8 subjects and 17 main-page manifests totaling 128 course entries.
- Search for the pendulum lesson, clearing search, subject filtering, and expand/collapse controls.
- Analysis catalog (1 course) and special catalog (8 courses).
- Classroom links and custom special-course slide links opening the standalone project's explicit missing-content notice.
- No uncaught page errors.
- No document overflow or brand/navigation overlap at 1440 × 900 and 390 × 844.

The [desktop](previews/desktop.png) and [mobile](previews/mobile.png) screenshots were rendered in separate browser contexts and visually inspected. The machine-readable results are in [browser-results.json](browser-results.json).

## File integrity

The 8 original source/style/web-asset files and 19 catalog JSON files were compared byte-for-byte with the current application. The original logo master is also included. Their origin paths and SHA-256 values are recorded in [source-map.json](source-map.json).

The delivery ZIP is checked with Python's `ZipFile.testzip()` and each entry is compared against the corresponding delivered file. `SHA256SUMS.txt` covers all distributed files except itself. The archive excludes dependencies, build output, temporary scripts, private environment files, and earlier unused artwork.

This verifies the homepage development package. It does not validate omitted lessons, audio playback, external link availability, every browser, accessibility compliance, or a public deployment.
