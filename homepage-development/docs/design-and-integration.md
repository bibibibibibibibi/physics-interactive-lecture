# Homepage design and integration

This handoff captures the homepage as it exists on 2026-11-11. The core components are current working-tree copies, not a reconstruction from screenshots.

## Visual direction

The page uses a warm off-white background, dark green text, Chinese serif headings, and a wide Minghu photograph. Its spacious first screen and two-column catalog were retained after several iterations. No decorative hero illustration is present. The lesson-specific pendulum demonstration remains available within the catalog.

The personal site informed the restrained palette and typography. The course homepage retains its own large photo hero, clear course navigation, and catalog structure.

The “格物” header mark preserves the handwritten letterforms from the original course mark. Its upper arc was removed for small-size use; a short green wave and gold point sit below the lettering. To the right, “物理课堂” and the department name form a two-line caption separated by a thin rule.

## Layout and tokens

| Item | Current value / behavior |
| --- | --- |
| Page background | `#f7f7f0` |
| Main text | `#273d3a` |
| Muted text | `#61716a` |
| Green accent | `#47675b` |
| Rules | `#d8dcd0` |
| Main action | Background `#e5c98b`, text `#203f32` |
| Logo | Green `#2c4b40`, gold point `#ad894b` |
| Content width | Maximum 1280px; desktop width `calc(100% - 96px)` |
| Header | Minimum 78px; brand left and three navigation links right |
| Hero | Minimum 344px; radius 16px; desktop padding 38px 54px |
| Hero title | Serif, weight 500, `clamp(56px, 6vw, 82px)` |
| Hero photo | Cover; desktop position `center 50%`; dark green gradient overlay |
| Subject grid | Two equal columns, 23px gap |
| Card | `#fdfdf7`, 12px radius, thin pale border |
| Logo size | 70px wide on desktop; 60px at widths ≤560px; aspect ratio 416:207 |
| Heading font stack | Georgia, Songti SC, Noto Serif CJK SC, SimSun, serif |
| Body font stack | System UI, PingFang SC, Microsoft YaHei, sans-serif |

Responsive changes are controlled by the CSS, not device detection:

- At ≤940px, side margins and hero padding reduce; title size becomes 60px.
- At ≤720px, cards become one column, subject filters scroll horizontally, title size is 52px, and the photo hero's minimum height is 310px. The photograph shifts to `39% center`.
- At ≤560px, the header navigation moves below the brand.
- At ≤440px, search occupies the available width and catalog controls can wrap.
- Inside cards ≤540px wide, course descriptions and actions stack using a CSS container query.

## Components and state

`Homepage.tsx` selects a catalog from the query string, passes menu navigation and subject/chapter groups into `CourseMenu`, and shows a notice for lesson routes that are not included in this handoff. In the complete application, these responsibilities are part of `interactive-lecture/src/pages/Home.tsx`, which also hosts the lesson player.

`CourseMenu` fetches each chapter manifest, combines the results into subjects, and handles search, filtering, and expansion. A cleanup guard prevents stale fetch completion from setting state after unmount. Fetch failures currently appear as empty course lists; there is no separate fetch-error UI in the supplied implementation.

Search matches subject names, chapter names, and lesson titles. It searches across all subjects even when a subject filter was active. Search expansion state is separate from browsing expansion state, so clearing search restores the previous browsing view. Selecting a subject clears the search. The main page opens subjects but initially collapses named chapters; the analysis and special catalogs initially show their lessons.

`SubjectCard` renders the original data order and lesson destinations. `OrbitPlate` is mounted only when the user opens the pendulum demonstration. Its animation can be paused and resumes without resetting its state.

Native buttons and anchors remain keyboard accessible. The page includes a skip destination through “浏览课程”, visible focus indicators, labeled search, `aria-expanded` on disclosure controls, `aria-pressed` on filters, and `aria-current` on the active menu. These are implementation details, not a claim of a full accessibility audit.

## Data contract

Each chapter source is a JSON array:

```json
[
  {
    "id": "shm",
    "title": "9-1 简谐振动",
    "desc": "第九章 振动 · 16 页 · 约 7 分钟",
    "lectureAvailable": true,
    "slidesUrl": "/slides.html?course=shm"
  }
]
```

`id` and `title` are required. `desc`, `lectureAvailable`, and `slidesUrl` are optional. An interactive-classroom action is shown unless `lectureAvailable` is explicitly `false`. Its URL is `/?course=<id>`. Slides use the exact `slidesUrl` override when present, otherwise `/slides.html?course=<id>`. A manifest's inclusion in this kit does not mean its referenced lesson media are included.

The subject/chapter mapping is explicit in the entry component, so adding a new manifest alone does not add a new subject or chapter to the page. Retain stable IDs when updating titles or descriptions.

## Integration into the complete site

1. Use the copied `pages/`, `components/`, and `assets/` files under the corresponding `interactive-lecture/src/` directories. Preserve unrelated lesson-player changes.
2. Keep the original `Home.tsx` routing. Transfer any intended menu labels/group changes from the standalone `Homepage.tsx` into its existing no-course branch.
3. Keep the `@/` alias resolving to `src/` and the original global CSS/Tailwind reset. This kit includes the unchanged global `index.css` with a reduced Tailwind configuration; retain the complete project's own build configuration when integrating.
4. Make the catalog manifests available at `/weblec/`. Keep complete lesson routes and custom slides destinations available in the full application.
5. Build and inspect desktop and narrow-screen layouts after integration. Recheck search, subject filtering, keyboard focus, chapter expansion, and lesson destinations.

The current link/data paths start with `/`. Serve this standalone project at a domain root. Hosting beneath a subdirectory requires updating these paths as well as the Vite base path. Changing only Vite's `base` option is insufficient.

The package's lesson notice is a boundary for isolated development, not a replacement for the real player. Its minimal dependencies and build configuration should not overwrite the complete application's configuration.

## Assets and sources

| Asset | Origin / use |
| --- | --- |
| `src/assets/jnu-minghu.webp` | 1448 × 1086. Enhanced image used on [the personal website](https://phys.caoxuanmin.chatgpt.site/); original credited to [Jinan University's campus page](https://www.jnu.edu.cn/36429/list.htm). The on-page credit is retained. |
| `src/assets/gewu-header.svg` | Current 416:207 view box. Vector header adaptation of the course's handwritten mark. |
| `data/branding/logo_gewu_master.png` | 3200 × 1982 original logo master, supplied as a reference asset. |
| Subject icons | Lucide React 0.562.0; see the included ISC license. |

Sources above record existing project provenance; they were not re-audited for this handoff. Earlier experimental prism and mixed-apparatus images are not part of the active design and are not included.
