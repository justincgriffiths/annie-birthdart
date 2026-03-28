# Phase 2: File Architecture + Quick Wins - Context

**Gathered:** 2026-03-28
**Status:** Ready for planning

<domain>
## Phase Boundary

Split the monolithic index.html (652 lines) into maintainable separate files (CSS, JS, HTML shell), modernize the tab system so new tabs require only HTML changes, and add OG image + ARIA for shareability and accessibility.

</domain>

<decisions>
## Implementation Decisions

### File Split Strategy
- **D-01:** Split into `css/style.css`, `js/app.js`, and `js/publications.js` — single CSS file, JS split by concern
- **D-02:** index.html becomes an HTML shell with `<link>` and `<script>` tags only — no inline CSS/JS
- **D-03:** Publication data array (51 entries) moves to `js/publications.js` to keep app.js focused on navigation/interaction
- **D-04:** No bundler, no build step — raw files served directly by GitHub Pages

### Tab System Modernization
- **D-05:** Tabs should be data-driven from HTML structure — adding a new tab requires only a `<section>` with an ID and a `<button>` with `data-page` in the nav
- **D-06:** JS reads tab config from the DOM at init time (querySelectorAll sections, map IDs) — no hardcoded `ids` array
- **D-07:** Hash routing, swipe, keyboard nav, and GSAP transitions remain as-is — only the tab registry changes

### OG Image for Social Sharing
- **D-08:** Use `images/hero-dance.jpg` (800x535, 97KB) as the OG image — landscape, high energy, represents the celebration
- **D-09:** Add `og:image`, `og:image:width`, `og:image:height`, and `twitter:card` meta tags

### ARIA / Accessibility
- **D-10:** Nav gets `role="tablist"`, each tab gets `role="tab"` + `aria-selected`, each section gets `role="tabpanel"` + `aria-labelledby`
- **D-11:** Focus management on tab switch — move focus to the active panel for screen readers
- **D-12:** Add `<main>` landmark around the app shell, `<nav>` is already semantic

### Claude's Discretion
- CSS custom property organization (grouping, naming) during the split
- Whether to add a `<noscript>` fallback
- Minor HTML cleanup during the split (consistent indentation, attribute ordering)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Current architecture
- `index.html` — the monolithic source file to be split (652 lines: ~230 CSS, ~200 HTML, ~220 JS)
- `CLAUDE.md` — project conventions, tech stack decisions, CDN dependency docs

### Requirements
- `.planning/REQUIREMENTS.md` — ARCH-01 through ARCH-03, META-01, META-02
- `.planning/ROADMAP.md` — Phase 2 success criteria

### Existing patterns
- `.htmlhintrc` — HTML validation rules that must pass after split
- `playwright.config.js` + `tests/` — 35 tests that must continue passing
- `.github/workflows/validate.yml` — CI pipeline that validates on push

</canonical_refs>

<code_context>
## Existing Code Insights

### Current Structure (index.html)
- Lines 17-243: `<style>` block with 13 CSS sections (nav, app shell, grain, shared, home, weekend, menu, publications, gift, anim, responsive)
- Lines 244-475: HTML body (nav, 5 sections, grain overlay)
- Lines 476-651: `<script>` block (publication data, tab nav, resume toggle, swipe, keyboard, gift reveal, confetti)

### Reusable Patterns
- CSS custom properties in `:root` — well-organized, can lift directly to css/style.css
- GSAP loaded from CDN (line 483) — stays as external `<script>` tag
- Google Fonts preconnect — stays in `<head>`

### Integration Points
- `playwright.config.js` uses `serve .` — file split is transparent to tests
- `.surgeignore` already excludes node_modules, tests — CSS/JS files will auto-deploy
- GitHub Pages serves static files — no config changes needed for subdirectories

### Risks
- Hardcoded `const ids=['home','weekend','menu','pubs','gift']` in JS needs to become dynamic
- Some CSS references `var(--*)` that only make sense in context — verify no orphan variables after split
- Publication data references DOM element `pub-list` — must load after HTML

</code_context>

<specifics>
## Specific Ideas

- The tab IDs array `['home','weekend','menu','pubs','gift']` is the main coupling point between HTML and JS — making this DOM-driven is the key modernization
- OG image should include `og:url` pointing to `https://annielovessnakes.com`
- Consider `<script defer>` for app.js and publications.js since they reference DOM elements

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 02-file-architecture-quick-wins*
*Context gathered: 2026-03-28*
