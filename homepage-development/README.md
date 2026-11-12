# University Physics homepage — development materials

Prepared 2026-11-11 from the local working tree of `physics-interactive-lecture-main`. This is a runnable development handoff for the current homepage, including its catalog pages, source assets, data, and design reference. It captures uncommitted work as well as tracked files; it is not a release of the complete teaching application.

## Start the homepage

Install Node.js matching the package requirement (`^20.19.0 || >=22.12.0`) and npm. Then open a terminal inside this folder:

```sh
npm ci
npm run dev
```

Open **http://127.0.0.1:4174/** on the same computer. Keep the terminal running; use Ctrl+C to stop it. Installation needs internet access to the npm registry. The homepage then uses local assets and local JSON catalogs; it needs no API key or backend.

For a production build and local check:

```sh
npm run build
npm run preview
```

The generated files are in `work/dist/`. The preview server also uses port 4174, so stop the development server before starting it. Port 4174 keeps this package separate from the original site's preview on 4173.

## Included materials

| Location | Contents |
| --- | --- |
| `src/pages/CourseMenu.tsx` | Header, photo hero, global search, subject filters, expand/collapse controls, footer |
| `src/pages/course-menu.css` | Homepage layout, palette, type, and responsive rules |
| `src/components/SubjectCard.tsx`, `subject-card.css` | Subject/chapter/course cards and classroom/slide links |
| `src/components/OrbitPlate.tsx` | The optional single-pendulum demonstration inside its lesson row |
| `src/assets/gewu-header.svg` | Current vector “格物” header mark |
| `src/assets/jnu-minghu.webp` | Minghu hero photograph |
| `src/Homepage.tsx` | Standalone entry, with the original homepage menu definitions extracted from `Home.tsx` |
| `public/weblec/*.json` | Real course catalogs used by all three menu pages |
| `data/branding/logo_gewu_master.png` | Original course-logo master for reference |
| `docs/design-and-integration.md` | Design decisions, dimensions, component map, data contract, integration boundaries |
| `docs/previews/` | Rendered desktop/mobile references |
| `docs/verification.md` | Checks performed on this package and their limits |
| `docs/source-map.json` | Source mapping and hashes for the copied application files |
| `SHA256SUMS.txt` | Checksums for the distributed files |

The five homepage UI source files, global stylesheet, and two active web assets are copied unchanged from the application. The standalone entry and build configuration are adapters for this package. The source map distinguishes copied files from the adapter files.

## What works here

- `/`: the university physics homepage, with 8 subjects and 17 chapters.
- `/?menu=analysis`: the analytical mechanics catalog.
- `/?menu=special`: the teaching-segment catalog.
- Search, filters, subject/chapter expansion, and the optional pendulum demonstration.

The original course-link URLs are preserved. Clicking a classroom or slides link opens an explanatory notice in this isolated project: the lesson player, slides, videos, audio, and their services are not packaged. To use those links for teaching, integrate these homepage components into the complete application.

## Make changes

Edit the title, subtitle, menu labels, subject names, or chapter-to-manifest mapping in `src/Homepage.tsx`. Edit catalog entries in `public/weblec/*.json`. Edit the visual layout in the two CSS files. Replace assets using the existing import names, preserving their source notices.

For integration back into the original repository, apply the UI changes to `interactive-lecture/src/` and keep the full application's `Home.tsx`, routing, lesson player, and existing Vite configuration. Do not replace the original `Home.tsx` or package configuration with this standalone adapter.

## Attribution and license

The current design uses the revised handwritten “格物” mark, a Minghu photo hero, and no decorative hero illustration. System fonts are used; Chinese serif rendering may differ between operating systems.

Project terms are retained in [LICENSE](LICENSE) and [copyright.md](docs/copyright.md). The Minghu image and original logo are described in [third-party-notices.md](docs/third-party-notices.md). The archive adds no new license grant. Runtime dependency licenses, including Lucide's ISC license, are included in `docs/licenses/`.
