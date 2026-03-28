<!-- GSD:project-start source:PROJECT.md -->
## Project

**Annie Loves Snakes**

A personal celebration website for Annie (annielovessnakes.com) that started as a birthday event site and is evolving into an ongoing memories/celebration platform. Built as a single-page static HTML app with tab-based navigation, deployed via GitHub Pages. Justin pushes updates — new sections, interactive features, surprise reveals — while Annie travels and experiences them live.

**Core Value:** Annie can always visit annielovessnakes.com and find something new, personal, and delightful waiting for her.

### Constraints

- **Static only**: No server, no build step — must remain deployable as raw HTML on GitHub Pages
- **Single HTML file**: Current architecture is one index.html. May split into multiple files as features grow, but no bundler.
- **CDN dependencies**: GSAP, Google Fonts. No npm/node for the site itself.
- **Solo developer**: Justin is the only contributor — branch protection is for workflow discipline, not gatekeeping.
<!-- GSD:project-end -->

<!-- GSD:stack-start source:research/STACK.md -->
## Technology Stack

## 1. GitHub Actions: Static Site Validation
### HTMLHint (HTML validation)
- name: Validate HTML
- Lightweight, zero-config default, works on raw HTML files
- Does not require a running server (unlike Lighthouse for some checks)
- Active maintenance, 5k+ GitHub stars
- `html-validate` -- heavier, more opinionated, overkill for a single-file site
- W3C validator API -- rate-limited, requires network call, slower CI
- `nickhealthy/htmlhint-action` -- thin wrapper with no real value over `npx htmlhint`
### Lychee (link checking)
- name: Check links
- 10-100x faster than `muffet`, `linkchecker`, or `html-proofer`
- Native GitHub Action with good defaults
- Handles both internal anchors and external URLs
- Caching support for CI (avoids re-checking unchanged links)
- `linkchecker` (Python) -- slow, heavy dependency
- `muffet` (Go) -- requires a running server, not suitable for raw HTML files
- `html-proofer` -- Ruby dependency, slower, designed for Jekyll sites
### Lighthouse CI
- name: Lighthouse CI
- Direct `lighthouse` CLI in CI -- `treosh/lighthouse-ci-action` handles server setup, artifact upload, and result parsing
- PageSpeed Insights API -- rate-limited, requires API key, tests production URL only
### Recommended Workflow Structure
## 2. Staging Preview Deploys: Surge.sh
- **Zero config**: `surge . subdomain.surge.sh` -- that's it. No `netlify.toml`, no `wrangler.toml`, no dashboard setup.
- **Stable URL**: `annie-birthdart-staging.surge.sh` is always the same URL. Share it once with Annie, it always works.
- **Free tier**: Unlimited deploys, custom subdomains on `surge.sh`, HTTPS included.
- **No account dashboard**: Token-based auth via `SURGE_TOKEN` secret. No extra service to manage.
- **Deploys raw files**: No build step required. It just pushes the directory.
- name: Deploy to Surge
- name: Comment preview URL
- **Netlify**: Requires `netlify.toml`, has a dashboard, overkill for one HTML file. The free tier now has build minute limits.
- **Vercel**: Assumes a framework, tries to detect and build. Fighting its defaults for a raw HTML file is annoying.
- **Cloudflare Pages**: Good product, but requires Cloudflare account setup, `wrangler` CLI, and dashboard config. Overhead not justified here.
- **GitHub Pages from staging branch**: Can only serve one branch at a time. Using it for staging would mean production goes offline.
- **Render Static Sites**: Requires a repo connection and dashboard config per site.
## 3. Image Optimization for Static Sites
### Lazy Loading
- Supported in all modern browsers (Chrome, Firefox, Safari 15.4+, Edge)
- Zero JavaScript required
- Browser handles intersection observation natively
- Works with `<img>` and `<iframe>`
- `lazysizes.js` or `lozad.js` -- the native attribute has made JS lazy-loading libraries obsolete. They add payload for functionality the browser provides free.
- `IntersectionObserver` polyfills -- unnecessary in 2026, baseline support is universal.
### Responsive Images
### Image Format
- **WebP**: 25-35% smaller than JPEG at equivalent quality. Universal browser support.
- **AVIF**: 40-50% smaller than JPEG. Good support (Chrome, Firefox, Safari 16+), but slower to encode.
- **JPEG**: Fallback only. Always provide it in the `<img>` src for any ancient browser.
- **PNG for photos**: PNG is for graphics/screenshots, not photographs. 3-5x larger than WebP for photos.
- **GIF for anything**: Use WebP or MP4 for any animation.
- **JPEG 2000 / JPEG XL**: Poor/inconsistent browser support, not worth the complexity.
### Pre-deploy Image Processing
# Install once
# Batch convert
- name: Optimize images
- TinyPNG/Squoosh web UI for batch work -- manual, doesn't scale
- `imagemin` -- deprecated, unmaintained since 2023
- Sharp in a build step -- violates the "no build tools" constraint (but Sharp CLI for one-off local processing is fine)
## 4. GSAP Animations (Already in Use)
### Version Pinning
### Plugins to Add (all free, all CDN-available)
- **Anime.js**: Smaller but less capable. GSAP is already loaded, adding Anime.js means two animation libraries.
- **Motion One (formerly Motion)**: Newer, smaller, but less battle-tested. No reason to switch when GSAP is working.
- **CSS-only animations for complex sequences**: CSS `@keyframes` can't do staggered reveals, scroll-triggered sequences, or coordinated timelines. Use CSS for simple hover/transition states, GSAP for orchestrated sequences.
- **Framer Motion / React Spring**: Framework-dependent. Not applicable.
- **GSAP paid plugins (MorphSVG, DrawSVG, SplitText)**: Require Club membership. Not needed for this project.
### Animation Patterns for This Project
## 5. Lightbox Libraries for Photo Galleries
### Recommendation: GLightbox
- **Zero dependencies**: Pure JS, no jQuery, no framework
- **13KB gzipped** (JS + CSS): tiny footprint
- **Touch/swipe native**: Swipe between images on mobile -- matches the site's existing swipe UX
- **Video support**: Can display MP4/YouTube/Vimeo inline if needed later
- **Responsive**: Handles srcset, adapts to viewport
- **Active maintenance**: Regular releases, good issue response
- **Accessible**: Keyboard navigation, focus trapping, ARIA attributes
- **CSS customizable**: Easy to theme to match the dark country-psychedelic aesthetic
### Alternatives Considered
| Library | Size | Dependencies | Verdict |
|---------|------|-------------|---------|
| **GLightbox** | 13KB gz | None | **Winner** |
| Lightgallery.js | 20KB gz | None | Good but heavier, more features than needed |
| Fancybox 5 | 15KB gz | None | Good, but new license requires attribution link visible on page |
| PhotoSwipe 5 | 12KB gz | None | Strong contender, but API is more complex for basic use |
| SimpleLightbox | 8KB gz | None | Too simple -- no video support, limited touch gestures |
| Tobii | 6KB gz | None | Lightweight but unmaintained since 2022 |
- **Fancybox 5**: The "Fancyapps" license requires a visible attribution link on the page, or you pay. Not worth it.
- **Lightbox2**: jQuery dependency. Dead library.
- **Magnific Popup**: jQuery dependency. Unmaintained since 2016.
- **PhotoSwipe**: Excellent library, but its "define your own data source" API adds boilerplate. GLightbox's declarative `href` + `data-gallery` approach is simpler for a static HTML site.
- **Any React/Vue gallery component**: Framework dependency. Not applicable.
## 6. Date-Based Content Reveal Patterns
### Architecture: Pure JS with Progressive Enhancement
### Pattern: CSS-Hidden + JS Date Check
### Key Design Decisions
- **Server-side date gating**: Violates the static-site constraint.
- **Encrypted content with date-derived keys**: Over-engineered for a personal site. The audience is one person who loves you.
- **Third-party "scheduled content" services**: Unnecessary dependency. `new Date()` is free and permanent.
- **`localStorage` to track "seen" state**: Tempting, but fragile. If Annie clears her browser data or uses a different device, state is lost. The date check is stateless and works everywhere.
- **Web Workers or Service Workers for timing**: Unnecessary complexity. `setInterval` on the main thread is fine for a once-per-minute check.
### Countdown Animation (GSAP Integration)
## Summary: The Stack
| Need | Tool | Version/Source | Size |
|------|------|---------------|------|
| HTML validation | HTMLHint | `npx htmlhint@latest` in CI | CI only |
| Link checking | Lychee | `lycheeverse/lychee-action@v2` | CI only |
| Performance audit | Lighthouse CI | `treosh/lighthouse-ci-action@v12` | CI only |
| Staging preview | Surge.sh | CLI + GitHub Action | CI only |
| Animations | GSAP + ScrollTrigger | 3.12.7 from jsDelivr | 28KB gz core + 10KB plugin |
| Photo lightbox | GLightbox | 3.3.0 from jsDelivr | 13KB gz |
| Image format | WebP primary, AVIF progressive, JPEG fallback | `<picture>` element | N/A |
| Lazy loading | Native `loading="lazy"` | Browser built-in | 0KB |
| Responsive images | `srcset` + `sizes` | HTML standard | 0KB |
| Timed reveals | Custom JS + `data-reveal-date` | Inline, ~30 lines | <1KB |
| Image optimization | squoosh-cli local + calibreapp/image-actions CI | Pre-commit / CI | CI only |
<!-- GSD:stack-end -->

<!-- GSD:conventions-start source:CONVENTIONS.md -->
## Conventions

Conventions not yet established. Will populate as patterns emerge during development.
<!-- GSD:conventions-end -->

<!-- GSD:architecture-start source:ARCHITECTURE.md -->
## Architecture

Architecture not yet mapped. Follow existing patterns found in the codebase.
<!-- GSD:architecture-end -->

<!-- GSD:workflow-start source:GSD defaults -->
## GSD Workflow Enforcement

Before using Edit, Write, or other file-changing tools, start work through a GSD command so planning artifacts and execution context stay in sync.

Use these entry points:
- `/gsd:quick` for small fixes, doc updates, and ad-hoc tasks
- `/gsd:debug` for investigation and bug fixing
- `/gsd:execute-phase` for planned phase work

Do not make direct repo edits outside a GSD workflow unless the user explicitly asks to bypass it.
<!-- GSD:workflow-end -->



<!-- GSD:profile-start -->
## Developer Profile

> Profile not yet configured. Run `/gsd:profile-user` to generate your developer profile.
> This section is managed by `generate-claude-profile` -- do not edit manually.
<!-- GSD:profile-end -->
