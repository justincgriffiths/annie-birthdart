# Stack Research: CI/CD, Galleries, and Timed Reveals

Research for annielovessnakes.com -- a single-file static HTML site on GitHub Pages.
Constraint: no frameworks, no build tools, no npm in the site itself. CDN-only JS.

---

## 1. GitHub Actions: Static Site Validation

### HTMLHint (HTML validation)

**Use: `htmlhint/htmlhint` CLI via a GitHub Action**

The existing `validate.yml` uses `nickhealthy/htmlhint-action@v1` -- this is a third-party wrapper. Prefer the official approach: install HTMLHint directly and run it. This avoids depending on a community-maintained Action that may go stale.

```yaml
- name: Validate HTML
  run: |
    npx htmlhint@latest index.html
```

A `.htmlhintrc` config file at repo root controls rules. Key rules for this project:

```json
{
  "tagname-lowercase": true,
  "attr-lowercase": true,
  "attr-value-double-quotes": true,
  "doctype-first": true,
  "tag-pair": true,
  "spec-char-escape": true,
  "id-unique": true,
  "src-not-empty": true,
  "alt-require": true
}
```

**Why HTMLHint over alternatives:**
- Lightweight, zero-config default, works on raw HTML files
- Does not require a running server (unlike Lighthouse for some checks)
- Active maintenance, 5k+ GitHub stars

**Do NOT use:**
- `html-validate` -- heavier, more opinionated, overkill for a single-file site
- W3C validator API -- rate-limited, requires network call, slower CI
- `nickhealthy/htmlhint-action` -- thin wrapper with no real value over `npx htmlhint`

### Lychee (link checking)

**Use: `lycheeverse/lychee-action@v2`**

Already in the workflow. Lychee is written in Rust, extremely fast, and handles static HTML files natively. The existing config is correct.

Recommended flag additions:

```yaml
- name: Check links
  uses: lycheeverse/lychee-action@v2
  with:
    args: >-
      --verbose
      --no-progress
      --exclude-mail
      --exclude 'fonts.googleapis.com'
      --exclude 'fonts.gstatic.com'
      --timeout 30
      index.html
    fail: true  # Change from false to true once links are stable
```

`--exclude-mail` prevents false positives on mailto links. Excluding Google Fonts avoids rate-limit flakes.

**Why Lychee over alternatives:**
- 10-100x faster than `muffet`, `linkchecker`, or `html-proofer`
- Native GitHub Action with good defaults
- Handles both internal anchors and external URLs
- Caching support for CI (avoids re-checking unchanged links)

**Do NOT use:**
- `linkchecker` (Python) -- slow, heavy dependency
- `muffet` (Go) -- requires a running server, not suitable for raw HTML files
- `html-proofer` -- Ruby dependency, slower, designed for Jekyll sites

### Lighthouse CI

**Use: `treosh/lighthouse-ci-action@v12`**

Already in the workflow, but the current config has a problem: it audits the live production URL (`https://annielovessnakes.com`), meaning it tests the currently deployed version, not the code in the PR. Fix this by using Lighthouse's static file serving mode:

```yaml
- name: Lighthouse CI
  uses: treosh/lighthouse-ci-action@v12
  with:
    configPath: .lighthouserc.json
    uploadArtifacts: true
    temporaryPublicStorage: true
```

With `.lighthouserc.json`:

```json
{
  "ci": {
    "collect": {
      "staticDistDir": ".",
      "url": ["http://localhost/index.html"]
    },
    "assert": {
      "assertions": {
        "categories:performance": ["warn", { "minScore": 0.8 }],
        "categories:accessibility": ["error", { "minScore": 0.9 }],
        "categories:best-practices": ["warn", { "minScore": 0.8 }]
      }
    }
  }
}
```

`staticDistDir` tells Lighthouse CI to serve the files locally -- tests the actual commit, not production.

**Do NOT use:**
- Direct `lighthouse` CLI in CI -- `treosh/lighthouse-ci-action` handles server setup, artifact upload, and result parsing
- PageSpeed Insights API -- rate-limited, requires API key, tests production URL only

### Recommended Workflow Structure

Split into two jobs for faster feedback:

```yaml
jobs:
  lint:
    runs-on: ubuntu-latest
    timeout-minutes: 3
    steps:
      - uses: actions/checkout@v4
      - run: npx htmlhint@latest index.html
      - uses: lycheeverse/lychee-action@v2
        with:
          args: --verbose --no-progress --exclude-mail index.html
          fail: true

  lighthouse:
    runs-on: ubuntu-latest
    timeout-minutes: 5
    steps:
      - uses: actions/checkout@v4
      - uses: treosh/lighthouse-ci-action@v12
        with:
          configPath: .lighthouserc.json
          uploadArtifacts: true
          temporaryPublicStorage: true
```

Lint runs fast (~30s). Lighthouse is slower (~2-3min). Parallel jobs give faster total CI time.

---

## 2. Staging Preview Deploys: Surge.sh

**Use: Surge.sh** (already selected in `deploy-preview.yml`)

**Why Surge.sh is the right call for this project:**

- **Zero config**: `surge . subdomain.surge.sh` -- that's it. No `netlify.toml`, no `wrangler.toml`, no dashboard setup.
- **Stable URL**: `annie-birthdart-staging.surge.sh` is always the same URL. Share it once with Annie, it always works.
- **Free tier**: Unlimited deploys, custom subdomains on `surge.sh`, HTTPS included.
- **No account dashboard**: Token-based auth via `SURGE_TOKEN` secret. No extra service to manage.
- **Deploys raw files**: No build step required. It just pushes the directory.

**Setup steps remaining:**
1. `npm install -g surge` locally
2. `surge login` to authenticate
3. `surge token` to get the deploy token
4. Add `SURGE_TOKEN` to GitHub repo secrets (Settings > Secrets > Actions)
5. First manual deploy: `surge . annie-birthdart-staging.surge.sh`

**What the workflow improvement looks like:**

```yaml
- name: Deploy to Surge
  run: surge . annie-birthdart-staging.surge.sh --token ${{ secrets.SURGE_TOKEN }}

- name: Comment preview URL
  if: github.event_name == 'pull_request'
  uses: actions/github-script@v7
  with:
    script: |
      github.rest.issues.createComment({
        issue_number: context.issue.number,
        owner: context.repo.owner,
        repo: context.repo.repo,
        body: 'Preview deployed: https://annie-birthdart-staging.surge.sh'
      })
```

**Do NOT use:**
- **Netlify**: Requires `netlify.toml`, has a dashboard, overkill for one HTML file. The free tier now has build minute limits.
- **Vercel**: Assumes a framework, tries to detect and build. Fighting its defaults for a raw HTML file is annoying.
- **Cloudflare Pages**: Good product, but requires Cloudflare account setup, `wrangler` CLI, and dashboard config. Overhead not justified here.
- **GitHub Pages from staging branch**: Can only serve one branch at a time. Using it for staging would mean production goes offline.
- **Render Static Sites**: Requires a repo connection and dashboard config per site.

---

## 3. Image Optimization for Static Sites

The site currently has zero images. When the photo gallery ships, images become the primary performance concern.

### Lazy Loading

**Use: Native `loading="lazy"` attribute**

```html
<img src="photos/annie-birthday-01.webp" loading="lazy" alt="Annie at the party">
```

- Supported in all modern browsers (Chrome, Firefox, Safari 15.4+, Edge)
- Zero JavaScript required
- Browser handles intersection observation natively
- Works with `<img>` and `<iframe>`

**Do NOT use:**
- `lazysizes.js` or `lozad.js` -- the native attribute has made JS lazy-loading libraries obsolete. They add payload for functionality the browser provides free.
- `IntersectionObserver` polyfills -- unnecessary in 2026, baseline support is universal.

### Responsive Images

**Use: `<picture>` element with `srcset`**

```html
<picture>
  <source srcset="photos/annie-01-800.avif" type="image/avif">
  <source srcset="photos/annie-01-800.webp" type="image/webp">
  <img src="photos/annie-01-800.jpg"
       srcset="photos/annie-01-400.jpg 400w,
               photos/annie-01-800.jpg 800w,
               photos/annie-01-1200.jpg 1200w"
       sizes="(max-width: 600px) 100vw, 50vw"
       loading="lazy"
       alt="Annie at the party">
</picture>
```

For this mobile-first site, target three widths: 400w, 800w, 1200w. Most visitors will load the 400w or 800w version.

### Image Format

**Use: WebP as the primary format, AVIF as progressive enhancement, JPEG as fallback**

- **WebP**: 25-35% smaller than JPEG at equivalent quality. Universal browser support.
- **AVIF**: 40-50% smaller than JPEG. Good support (Chrome, Firefox, Safari 16+), but slower to encode.
- **JPEG**: Fallback only. Always provide it in the `<img>` src for any ancient browser.

**Do NOT use:**
- **PNG for photos**: PNG is for graphics/screenshots, not photographs. 3-5x larger than WebP for photos.
- **GIF for anything**: Use WebP or MP4 for any animation.
- **JPEG 2000 / JPEG XL**: Poor/inconsistent browser support, not worth the complexity.

### Pre-deploy Image Processing

Since there's no build step, images must be optimized before committing. Two approaches:

**Option A: Local CLI (recommended)**

```bash
# Install once
brew install squoosh-cli  # or: npm install -g @aspect-build/squoosh-cli

# Batch convert
for f in photos/originals/*.jpg; do
  squoosh-cli --webp '{"quality":80}' --resize '{"width":800}' -d photos/ "$f"
done
```

**Option B: GitHub Action for automated optimization**

```yaml
- name: Optimize images
  uses: calibreapp/image-actions@main
  with:
    githubToken: ${{ secrets.GITHUB_TOKEN }}
    webp: true
    webpQuality: 80
```

This runs on PR, optimizes images, and commits the result back. Good guard against accidentally committing unoptimized photos.

**Do NOT use:**
- TinyPNG/Squoosh web UI for batch work -- manual, doesn't scale
- `imagemin` -- deprecated, unmaintained since 2023
- Sharp in a build step -- violates the "no build tools" constraint (but Sharp CLI for one-off local processing is fine)

---

## 4. GSAP Animations (Already in Use)

**Current: GSAP 3.12.7 from jsDelivr CDN**

```html
<script src="https://cdn.jsdelivr.net/npm/gsap@3.12.7/dist/gsap.min.js"></script>
```

### Version Pinning

Stay on 3.12.x. GSAP 3.12 is the last fully free version. As of 2024, GSAP moved to a new license model where some plugins require a paid "Club" membership. The core library and ScrollTrigger remain free for public sites.

**Consider updating to the latest 3.12.x patch** but do NOT jump to a newer major version without checking the license. Pin the exact version in the CDN URL (already done correctly).

### Plugins to Add (all free, all CDN-available)

**ScrollTrigger** -- for scroll-based animations in the photo gallery:

```html
<script src="https://cdn.jsdelivr.net/npm/gsap@3.12.7/dist/ScrollTrigger.min.js"></script>
```

```js
gsap.registerPlugin(ScrollTrigger);
gsap.from('.gallery-item', {
  opacity: 0, y: 40, duration: 0.6, stagger: 0.1,
  scrollTrigger: { trigger: '.gallery-grid', start: 'top 80%' }
});
```

**Flip** -- for layout transitions (e.g., gallery grid to single-image view):

```html
<script src="https://cdn.jsdelivr.net/npm/gsap@3.12.7/dist/Flip.min.js"></script>
```

These two plugins cover every animation need for the gallery and timed reveals. Both are included in GSAP's free tier for public websites.

**Do NOT use:**
- **Anime.js**: Smaller but less capable. GSAP is already loaded, adding Anime.js means two animation libraries.
- **Motion One (formerly Motion)**: Newer, smaller, but less battle-tested. No reason to switch when GSAP is working.
- **CSS-only animations for complex sequences**: CSS `@keyframes` can't do staggered reveals, scroll-triggered sequences, or coordinated timelines. Use CSS for simple hover/transition states, GSAP for orchestrated sequences.
- **Framer Motion / React Spring**: Framework-dependent. Not applicable.
- **GSAP paid plugins (MorphSVG, DrawSVG, SplitText)**: Require Club membership. Not needed for this project.

### Animation Patterns for This Project

**Tab transitions** (already implemented): `gsap.to` / `gsap.fromTo` with `power2` easing. Good.

**Gallery image entrance**: ScrollTrigger + staggered `fromTo`. Images fade up as you scroll.

**Timed reveal "unlock" effect**: `gsap.timeline()` with a sequence -- lock icon spins, content fades in, confetti burst via CSS particles.

---

## 5. Lightbox Libraries for Photo Galleries

### Recommendation: GLightbox

**Use: GLightbox 3.3.0+**

```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/glightbox@3.3.0/dist/css/glightbox.min.css">
<script src="https://cdn.jsdelivr.net/npm/glightbox@3.3.0/dist/js/glightbox.min.js"></script>
```

```js
const lightbox = GLightbox({
  touchNavigation: true,
  loop: true,
  autoplayVideos: true
});
```

```html
<a href="photos/full/annie-01.webp" class="glightbox" data-gallery="birthday">
  <img src="photos/thumb/annie-01.webp" loading="lazy" alt="Annie celebrating">
</a>
```

**Why GLightbox:**
- **Zero dependencies**: Pure JS, no jQuery, no framework
- **13KB gzipped** (JS + CSS): tiny footprint
- **Touch/swipe native**: Swipe between images on mobile -- matches the site's existing swipe UX
- **Video support**: Can display MP4/YouTube/Vimeo inline if needed later
- **Responsive**: Handles srcset, adapts to viewport
- **Active maintenance**: Regular releases, good issue response
- **Accessible**: Keyboard navigation, focus trapping, ARIA attributes
- **CSS customizable**: Easy to theme to match the dark country-psychedelic aesthetic

**Integration with existing GSAP**: GLightbox fires events (`open`, `close`, `slide_changed`) that can trigger GSAP animations:

```js
const lightbox = GLightbox({
  onOpen: () => gsap.from('.goverlay', { opacity: 0, duration: 0.3 }),
  onClose: () => { /* re-trigger gallery entrance animation */ }
});
```

### Alternatives Considered

| Library | Size | Dependencies | Verdict |
|---------|------|-------------|---------|
| **GLightbox** | 13KB gz | None | **Winner** |
| Lightgallery.js | 20KB gz | None | Good but heavier, more features than needed |
| Fancybox 5 | 15KB gz | None | Good, but new license requires attribution link visible on page |
| PhotoSwipe 5 | 12KB gz | None | Strong contender, but API is more complex for basic use |
| SimpleLightbox | 8KB gz | None | Too simple -- no video support, limited touch gestures |
| Tobii | 6KB gz | None | Lightweight but unmaintained since 2022 |

**Do NOT use:**
- **Fancybox 5**: The "Fancyapps" license requires a visible attribution link on the page, or you pay. Not worth it.
- **Lightbox2**: jQuery dependency. Dead library.
- **Magnific Popup**: jQuery dependency. Unmaintained since 2016.
- **PhotoSwipe**: Excellent library, but its "define your own data source" API adds boilerplate. GLightbox's declarative `href` + `data-gallery` approach is simpler for a static HTML site.
- **Any React/Vue gallery component**: Framework dependency. Not applicable.

---

## 6. Date-Based Content Reveal Patterns

### Architecture: Pure JS with Progressive Enhancement

The timed reveal system should work with zero server-side logic. Content is in the HTML but hidden; JavaScript checks the date and reveals it.

### Pattern: CSS-Hidden + JS Date Check

```html
<!-- Timed content block -->
<div class="timed-reveal" data-reveal-date="2026-04-15" data-reveal-label="Annie's Anniversary Surprise">
  <div class="reveal-locked">
    <span class="reveal-icon">&#x1F512;</span>
    <span class="reveal-countdown"></span>
  </div>
  <div class="reveal-content" hidden>
    <!-- Actual surprise content here -->
    <h3>Happy Anniversary</h3>
    <p>...</p>
  </div>
</div>
```

```css
.reveal-content[hidden] { display: none; }
.reveal-locked { /* styled lock/countdown display */ }
.timed-reveal.revealed .reveal-locked { display: none; }
.timed-reveal.revealed .reveal-content { display: block; }
```

```js
function checkReveals() {
  const now = new Date();
  document.querySelectorAll('.timed-reveal').forEach(el => {
    const revealDate = new Date(el.dataset.revealDate + 'T00:00:00');
    if (now >= revealDate) {
      el.classList.add('revealed');
      el.querySelector('.reveal-content').hidden = false;
      // Optional: GSAP entrance animation
      if (!el.dataset.animated) {
        el.dataset.animated = 'true';
        gsap.from(el.querySelector('.reveal-content'), {
          opacity: 0, y: 20, duration: 0.6, ease: 'power2.out'
        });
      }
    } else {
      // Update countdown
      const diff = revealDate - now;
      const days = Math.floor(diff / 86400000);
      const label = el.querySelector('.reveal-countdown');
      if (label) label.textContent = days > 0 ? `${days} day${days !== 1 ? 's' : ''} to go` : 'Coming soon';
    }
  });
}

// Check on load and every minute (in case she's watching at midnight)
checkReveals();
setInterval(checkReveals, 60000);
```

### Key Design Decisions

**Client-side date only**: The check uses `new Date()` which reads the visitor's local clock. This is fine -- Annie is the only audience, and the "security" is social (she won't inspect source to peek). If she changes her device clock, she sees it early. That's okay for a love letter site.

**Content is in the HTML source**: Deliberately. "View Source" spoilers are acceptable. The reveal is a UX delight feature, not DRM. If she peeks, she peeks -- it's her site.

**If source-level hiding matters later**: Fetch content from a separate file on reveal:

```js
if (now >= revealDate && !el.querySelector('.reveal-content').innerHTML.trim()) {
  fetch(`reveals/${el.dataset.revealId}.html`)
    .then(r => r.text())
    .then(html => {
      el.querySelector('.reveal-content').innerHTML = html;
      el.querySelector('.reveal-content').hidden = false;
      el.classList.add('revealed');
    });
}
```

This keeps surprise content out of the main HTML source. The separate `.html` fragment files are still static -- no server needed. A determined person could find them via the Network tab or repo, but it's an extra layer.

**Do NOT use:**
- **Server-side date gating**: Violates the static-site constraint.
- **Encrypted content with date-derived keys**: Over-engineered for a personal site. The audience is one person who loves you.
- **Third-party "scheduled content" services**: Unnecessary dependency. `new Date()` is free and permanent.
- **`localStorage` to track "seen" state**: Tempting, but fragile. If Annie clears her browser data or uses a different device, state is lost. The date check is stateless and works everywhere.
- **Web Workers or Service Workers for timing**: Unnecessary complexity. `setInterval` on the main thread is fine for a once-per-minute check.

### Countdown Animation (GSAP Integration)

For locked reveals, animate the countdown with GSAP:

```js
// Pulse the lock icon
gsap.to('.reveal-icon', {
  scale: 1.1, duration: 0.8, repeat: -1, yoyo: true, ease: 'sine.inOut'
});

// When a reveal unlocks (first visit after date):
function animateUnlock(el) {
  const tl = gsap.timeline();
  tl.to(el.querySelector('.reveal-icon'), { rotation: 360, scale: 0, duration: 0.5 })
    .from(el.querySelector('.reveal-content'), { opacity: 0, y: 30, duration: 0.8, ease: 'back.out(1.4)' }, '-=0.2');
}
```

---

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

**Total new JS payload added to the page: ~23KB gzipped** (GLightbox + ScrollTrigger). Everything else is either CI-only, browser-native, or inline JS under 1KB.

---

*Researched 2026-03-28. Based on project context from PROJECT.md and existing codebase analysis.*
