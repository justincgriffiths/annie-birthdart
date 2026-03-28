# Research Synthesis

Condensed from STACK.md, FEATURES.md, ARCHITECTURE.md, and PITFALLS.md.

---

## Stack Recommendations

| Need | Pick | Notes |
|------|------|-------|
| HTML validation | `npx htmlhint@latest` in CI | Drop the third-party wrapper action. `.htmlhintrc` at repo root. |
| Link checking | `lycheeverse/lychee-action@v2` | Already in place. Add `--exclude-mail` and `--exclude fonts.googleapis.com`. |
| Performance audit | `treosh/lighthouse-ci-action@v12` | Must switch to `staticDistDir` mode -- current config tests production, not the PR. |
| Staging preview | Surge.sh (`annie-birthdart-staging.surge.sh`) | Zero config, free, stable URL. Needs `SURGE_TOKEN` secret + `.surgeignore`. |
| Animations | GSAP 3.12.7 + ScrollTrigger (jsDelivr) | Stay on 3.12.x (last fully free version). Add ScrollTrigger + Flip for gallery. |
| Photo lightbox | GLightbox 3.3.0 (jsDelivr) | 13KB gz, zero deps, touch/swipe native, fires events for GSAP integration. |
| Image format | WebP primary, AVIF progressive, JPEG fallback | `<picture>` + `srcset` at 400w/800w/1200w. Native `loading="lazy"`. |
| Image optimization | squoosh-cli local + `calibreapp/image-actions` in CI | Pre-commit resize to max 1200px, quality 80. CI guard against unoptimized commits. |
| Timed reveals | Custom JS (~30 lines) + `data-reveal-date` attributes | Client-side date check, GSAP unlock animation, `setInterval` every 60s. |

**Total new JS payload to the page: ~23KB gzipped** (GLightbox + ScrollTrigger). Everything else is CI-only, browser-native, or inline.

---

## Table Stakes Features

Must exist for the site to feel complete:

1. **Photo gallery** -- the single most expected missing feature. CSS grid thumbnails, GLightbox for full-size, lazy-loaded.
2. **OG image meta tag** -- `og:image` is missing. 10-minute fix that makes link sharing in iMessage look intentional.
3. **Timed reveals** -- core mechanic for "evolving celebration platform." Content hides until a date, then unlocks with animation.
4. **Date-aware homepage messaging** -- countdown before events, greeting on the day, follow-up after. Single `<p>` element, JS updates it.
5. **Mobile-first responsive** -- already done. Revisit `user-scalable=no` for accessibility.
6. **Fast load time** -- already good. Photo gallery is the first real performance test.

Already done well: personalized tone, animated transitions, embedded media, accessible keyboard nav.

---

## Key Architecture Decisions

### Single-file vs. split: Split.
The file is 551 lines and will cross 1000 with gallery + reveals. Split to `index.html` (shell) + `css/style.css` + `js/app.js` + `js/publications.js` + `js/reveals.js` + `js/gallery.js`. No build step needed -- browser loads `<link>` and `<script defer>` natively. HTTP/2 multiplexing eliminates extra-request concerns.

### Image hosting: Tiered.
Phase 1 (fewer than 20 images): in-repo under `images/gallery/`, aggressively optimized before commit (max 1200px, WebP, quality 80). Phase 2 (gallery grows): Cloudinary free tier with URL-based transforms. Do not use Git LFS -- overhead not justified.

### Branch flow: dev -> staging -> main with PRs.
`dev` for iteration (CI validates). `staging` for preview (Surge deploys). `main` for production (GitHub Pages auto-deploys). Solo dev, so PRs are for diff visibility and CI gates, not reviewers.

### Tab system: Switch from index-based to ID-based nav.
Current system couples tabs to array indices. Refactor so `data-page="photos"` uses IDs and DOM order determines position. Tabs can then be reordered or added without touching JS.

### Timed reveals: `data-reveal-after` attributes + client-side date check.
Content lives in HTML (or fetched from fragments for source-hiding). JS checks dates on load and every 60s. Use `localStorage` to persist unlock state. Use date-only comparisons to avoid timezone edge cases.

---

## Top Pitfalls to Avoid

### 1. Lighthouse CI tests production, not the PR (Severity: High)
The current workflow runs Lighthouse against `https://annielovessnakes.com`. Regressions on `dev`/`staging` go undetected. Fix: use `staticDistDir: "."` in `.lighthouserc.json` to test the checked-out files.

### 2. Surge deploys the entire repo including `.planning/` (Severity: High)
`surge .` uploads everything -- dotfiles, planning docs, git metadata. Create a `.surgeignore` excluding `.git/`, `.github/`, `.planning/`, `.claude/` before first staging deploy.

### 3. Gallery images will bloat the git repo (Severity: High)
30 photos at 200KB each = 6MB of permanent git history. Optimize before commit (target less than 100KB per photo). Move to Cloudinary if gallery exceeds 20 images. Never `git add -A` -- there is already a 58MB Synology MSI in the working directory.

### 4. Caching defeats timed reveals (Severity: Medium-High)
If Annie has a cached page version, new reveal code does not exist in her browser. Deploy reveal code (with future unlock date) at least 24 hours before the reveal date. Separate the reveal machinery from the reveal content.

### 5. Client-side timezone bugs in date comparisons (Severity: Medium)
`new Date('2026-03-30')` creates midnight UTC, which is 8 PM March 29 in PST. Use date-only comparisons (`toISOString().slice(0,10) >= '2026-03-30'`) or include explicit timezone offsets. Test with Chrome DevTools timezone override.

---

## Phase Implications

Suggested build order based on dependency chains:

| Phase | Work | Dependencies | Pitfalls to Address |
|-------|------|-------------|-------------------|
| **1. CI/CD Hardening** | Fix Lighthouse to test local files. Create `.surgeignore`. Set up `SURGE_TOKEN`. Claim Surge subdomain. Add `.htmlhintrc` and `.lighthouserc.json`. | None | 1, 2 |
| **2. File Split** | Extract inline CSS/JS to separate files. Refactor tab system to ID-based nav. Verify load order with `defer`. | Phase 1 (CI validates the split) | -- |
| **3. OG Image + Quick Wins** | Add `og:image` meta. Add ARIA roles to nav. Clean up Synology MSI from working directory. | Phase 2 (split makes edits cleaner) | 3 (MSI cleanup) |
| **4. Photo Gallery** | CSS grid thumbnails, GLightbox, lazy loading, responsive `<picture>`. Decide in-repo vs. Cloudinary. | Phase 2 (needs `js/gallery.js` and `css/style.css`) | 3, touch conflicts, memory pressure |
| **5. Timed Reveals** | `data-reveal-after` system, `localStorage` persistence, GSAP unlock animation, countdown display. | Phase 2 (needs `js/reveals.js`) | 4, 5 |
| **6. Content Expansion** | Date-aware homepage, memory timeline, love letter section, easter eggs. | Phases 4 + 5 (gallery + reveals are building blocks) | -- |

Phases 1-3 are low-risk scaffolding. Phase 4 (gallery) is the highest-complexity work. Phase 5 (reveals) has the most subtle bugs (timezones, caching). Phase 6 is incremental content that uses the systems built in 4 and 5.

---

*Synthesized 2026-03-28 from STACK.md, FEATURES.md, ARCHITECTURE.md, PITFALLS.md.*
