# Architecture Research: Static SPA with CI/CD

## Current State

551-line single `index.html` with:
- ~216 lines of inline CSS (inside `<style>`)
- ~134 lines of inline JS (inside `<script>`)
- ~200 lines of HTML markup (6 sections: home, weekend, menu, vibes, pubs, gift)
- 52-entry publication data array hardcoded in JS
- GSAP loaded from CDN, Google Fonts via preconnect
- One image asset: `reptile-expo.png`
- CNAME for `annielovessnakes.com`
- GitHub Pages deployment from `main` branch

---

## 1. Single-File vs. Split Architecture

### Option A: Keep Single File

**Pros:**
- Zero dependency resolution at load time -- one HTTP request gets everything
- No relative path issues between environments (dev, staging, prod)
- Easier for CNAME + GitHub Pages: just deploy the root, nothing to wire up
- GitHub Pages serves `index.html` by default, no routing concerns
- Surge.sh staging deploy is literally `surge . <url>` -- one file, done

**Cons:**
- At 551 lines it's already at the edge of comfortable single-file editing
- Adding a photo gallery (50-100 images) means a huge data section in JS
- Adding timed reveals means date-checking logic mixed with layout
- Hard to diff in PRs -- a CSS change and a content change show up in the same file
- Two developers (or two Claude sessions) can't work on CSS and content in parallel

**Verdict:** Split. The file will cross 1000 lines within 2-3 feature additions.

### Option B: Split Into Separate Files (Recommended)

```
/
  index.html          -- Markup only (shell + all sections)
  css/
    style.css         -- All styles
  js/
    app.js            -- Nav, swipe, reveal logic, GSAP orchestration
    publications.js   -- Publication data array + renderer
    reveals.js        -- Timed reveal system (date-gated content)
    gallery.js        -- Photo gallery logic (when added)
  images/
    reptile-expo.png
    gallery/          -- Photo gallery assets (or external URLs)
  CNAME
```

**Why this works without a build step:**
- The browser loads `<link rel="stylesheet" href="css/style.css">` and `<script src="js/app.js">` natively. No bundler needed.
- Each file is cacheable independently. CSS change doesn't bust the JS cache.
- GitHub Pages serves static files from any directory structure.
- Surge.sh deploys directory trees identically.

**Tradeoffs of splitting:**
- Slightly more HTTP requests on first load (mitigated by HTTP/2 multiplexing on GitHub Pages and Surge)
- Need to ensure relative paths work in both prod (`annielovessnakes.com`) and staging (`annie-birthdart-staging.surge.sh`). This works out of the box since both serve from root.
- Script load order matters: `app.js` must come after GSAP CDN. Use `defer` attribute on scripts to handle this cleanly.

**Load order in `index.html`:**
```html
<link rel="stylesheet" href="css/style.css">
<!-- ... markup ... -->
<script src="https://cdn.jsdelivr.net/npm/gsap@3.12.7/dist/gsap.min.js"></script>
<script src="js/publications.js" defer></script>
<script src="js/reveals.js" defer></script>
<script src="js/app.js" defer></script>
```

Note: Since GSAP is loaded synchronously (no `defer`), it will be available before `defer`ed scripts execute. The `defer` scripts run in document order after DOM parsing completes.

---

## 2. Branch Flow: dev -> staging -> main

### Branch Model

```
dev          -- Active work. Push freely. CI validates.
  |
  v (PR)
staging      -- Preview. Surge.sh auto-deploys. Share URL for feedback.
  |
  v (PR)
main         -- Production. GitHub Pages auto-deploys to annielovessnakes.com.
```

### Rules

| Branch | Push triggers | PR target | Deploy target |
|--------|--------------|-----------|---------------|
| `dev` | validate.yml | staging | None (CI only) |
| `staging` | validate.yml + deploy-preview.yml | main | Surge.sh preview |
| `main` | GitHub Pages built-in | -- | annielovessnakes.com |

### PR-Based Promotion

1. **dev -> staging PR:** Runs validation. Merge triggers Surge deploy. Justin (or Annie) previews at `annie-birthdart-staging.surge.sh`.
2. **staging -> main PR:** Runs validation. Merge triggers GitHub Pages deploy. Live at `annielovessnakes.com`.
3. Solo developer, so branch protection is workflow discipline, not gatekeeping. No required reviewers. But the PR exists so the diff is reviewable and CI must pass.

### Conflict Prevention

With a single developer, conflicts are unlikely. But if two Claude sessions are active:
- Splitting files (Option B above) means CSS/JS/content conflicts are isolated to their own files
- PRs provide a visible diff to catch problems before merge

---

## 3. GitHub Actions Workflow Architecture

### validate.yml (Current + Enhancements)

**Triggers:** Push to `dev`/`staging`, PRs to `staging`/`main`

```
validate.yml
  |
  +-- Validate HTML (htmlhint)
  +-- Check links (lychee)
  +-- Lighthouse CI
  +-- (NEW) Check file size budget
  +-- (NEW) Validate image assets exist
```

**Current issue with Lighthouse step:** The existing workflow points Lighthouse at `https://annielovessnakes.com` (production). This means it's testing the already-deployed site, not the code in the PR. Fix:

```yaml
- name: Lighthouse CI
  uses: treosh/lighthouse-ci-action@v12
  with:
    configPath: .lighthouserc.json
    uploadArtifacts: true
    temporaryPublicStorage: true
```

With a `.lighthouserc.json` that uses `staticDistDir`:
```json
{
  "ci": {
    "collect": {
      "staticDistDir": ".",
      "url": ["http://localhost/index.html"]
    }
  }
}
```

This runs Lighthouse against the actual checked-out files, not production.

**Suggested additions:**

```yaml
- name: Check file sizes
  run: |
    MAX_HTML=100000  # 100KB
    MAX_CSS=50000
    MAX_JS=50000
    for f in index.html; do
      size=$(wc -c < "$f")
      if [ "$size" -gt "$MAX_HTML" ]; then
        echo "::error::$f is ${size} bytes (max ${MAX_HTML})"
        exit 1
      fi
    done

- name: Verify image refs
  run: |
    # Check that every src/href to a local file actually exists
    grep -oP 'src="(?!http|data:)([^"]+)"' index.html | \
      sed 's/src="//;s/"//' | \
      while read f; do
        [ -f "$f" ] || { echo "::error::Missing asset: $f"; exit 1; }
      done
```

### deploy-preview.yml (Current -- Good As-Is)

**Triggers:** Push to `staging`

```
deploy-preview.yml
  |
  +-- Checkout
  +-- Install Surge
  +-- Deploy to annie-birthdart-staging.surge.sh
```

The current workflow is correct. One enhancement: add a comment on the PR (if the push is from a PR merge) with the preview URL:

```yaml
- name: Comment preview URL
  if: github.event_name == 'push'
  uses: peter-evans/create-or-update-comment@v4
  with:
    issue-number: ${{ github.event.head_commit.message }}
    body: "Preview deployed: https://annie-birthdart-staging.surge.sh"
```

Actually, for a solo dev this is unnecessary. The URL is static and known. Skip it.

### Potential Future: deploy-prod.yml

GitHub Pages deployment is handled automatically by GitHub when `main` is updated. No custom workflow needed unless you want post-deploy checks:

```yaml
# Optional: post-deploy smoke test
name: Post-Deploy Check
on:
  push:
    branches: [main]
jobs:
  smoke:
    runs-on: ubuntu-latest
    steps:
      - name: Wait for Pages deploy
        run: sleep 60
      - name: Check site is live
        run: curl -sf https://annielovessnakes.com | grep -q "Birthdart"
```

---

## 4. Surge.sh Staging Deployment

### Setup Requirements

1. **Surge account:** `npm install -g surge && surge login`
2. **Get token:** `surge token` -- produces a string
3. **GitHub secret:** Add `SURGE_TOKEN` to repo Settings > Secrets > Actions
4. **Domain:** `annie-birthdart-staging.surge.sh` is available (no custom domain needed for staging)

### How It Works

```
Push to staging branch
  -> GitHub Actions runs deploy-preview.yml
    -> Checks out the repo
    -> Installs surge CLI
    -> Runs: surge . annie-birthdart-staging.surge.sh --token $SURGE_TOKEN
    -> Entire repo directory is uploaded as static site
```

### CNAME Interaction

The `CNAME` file in the repo contains `annielovessnakes.com`. Surge ignores this file -- it uses the domain specified in the CLI command. No conflict.

However, if the repo has a `CNAME` file and Surge serves it, a browser won't be affected (CNAME is not HTML). No issue.

### Cost / Limits

- Surge free tier: Unlimited projects, unlimited deploys, no bandwidth cap listed
- Custom domain on Surge requires the paid tier ($13/mo) -- not needed for staging
- SSL is automatic on `*.surge.sh` subdomains

---

## 5. Image Hosting Strategies

### Option A: In-Repo (Small Scale)

```
images/
  gallery/
    birthday-01.jpg
    birthday-02.jpg
    ...
```

**Pros:**
- Simple. Same deploy pipeline. No external dependencies.
- Works offline (for dev).
- Version controlled alongside code.

**Cons:**
- Git repo bloats with binary files. 50 photos at 200KB each = 10MB of repo history that never compresses.
- GitHub Pages has a soft 1GB repo size recommendation.
- Clone times increase for every contributor (even if just one developer).
- `git diff` on binary files is meaningless noise.

**Mitigation:** Git LFS. GitHub offers 1GB free LFS storage + 1GB/mo bandwidth. But LFS adds setup complexity and GitHub Pages doesn't serve LFS-tracked files directly -- you'd need to check them out in CI. Not worth it for this project.

**Verdict for in-repo:** Fine for up to ~20 images. Beyond that, use external hosting.

### Option B: External CDN (Recommended for Growth)

**Cloudinary (best fit):**
- Free tier: 25 credits/month (~25GB bandwidth or 25K transformations)
- Automatic image optimization (WebP/AVIF, responsive sizes)
- URL-based transformations: `https://res.cloudinary.com/CLOUD/image/upload/w_800,q_auto/gallery/photo1.jpg`
- No build step needed -- just reference URLs in HTML/JS
- SDK not required; URL transformations work from raw `<img>` tags

**Imgur:**
- Free, no account needed for anonymous uploads
- No image optimization or transformation
- URLs can rot (Imgur has deleted old images before)
- Not suitable for a site meant to persist

**GitHub Releases as CDN (hack):**
- Upload images to a GitHub Release as assets
- Get permanent URLs like `https://github.com/user/repo/releases/download/v1/photo.jpg`
- Free, no bandwidth limits on public repos
- No optimization. Manual upload process.

**Recommended approach:**

```
Phase 1 (now - ~20 images):  In-repo under images/
Phase 2 (gallery grows):     Cloudinary free tier
```

### Gallery Data Structure (JS)

```javascript
// js/gallery.js
const GALLERY = [
  { src: "images/gallery/birthday-01.jpg", caption: "Champagne at Rosie's", date: "2026-03-15" },
  { src: "images/gallery/birthday-02.jpg", caption: "The breakfast spread", date: "2026-03-16" },
  // Or with Cloudinary:
  { src: "https://res.cloudinary.com/CLOUD/image/upload/w_600,q_auto/birthdart/champagne.jpg", ... },
];
```

This keeps image metadata in version control while the heavy assets live externally.

---

## 6. Structuring Tab/Section Additions

### Current Tab Architecture

The SPA uses a simple pattern:
1. Nav buttons with `data-page="N"` (index-based)
2. `<section class="page" id="NAME">` elements in order
3. JS array `const ids=['home','weekend','menu','vibes','pubs','gift']` maps indices to IDs
4. `goTo(i, dir)` function handles transitions

### Adding a New Tab

To add a "Photos" tab, you need to touch exactly 3 places:

1. **Nav button** (in `index.html`):
   ```html
   <button class="tab" data-page="6"><span class="tab-icon">&#x1F4F7;</span><span class="tab-label">Photos</span></button>
   ```

2. **Section markup** (in `index.html`):
   ```html
   <section class="page" id="photos">
     <div class="page-content">
       <!-- gallery content -->
     </div>
   </section>
   ```

3. **JS ids array** (in `js/app.js`):
   ```javascript
   const ids = ['home','weekend','menu','vibes','pubs','gift','photos'];
   ```

That's it. No routing config, no build manifest. The index-based system scales to ~10 tabs before the nav bar needs a scrollable redesign.

### Making This More Robust

Current weakness: tabs are coupled to array indices. If you reorder tabs, every `data-page` attribute needs renumbering. Better pattern:

```javascript
// Instead of index-based:
const ids = ['home','weekend','menu','vibes','pubs','gift'];

// Use ID-based lookup from DOM order:
const pages = [...document.querySelectorAll('.page')];
const ids = pages.map(p => p.id);
```

Then `data-page` can use IDs instead of indices:
```html
<button class="tab" data-page="photos">
```

And the nav handler becomes:
```javascript
tabs.forEach(t => t.addEventListener('click', () => {
  goTo(ids.indexOf(t.dataset.page));
}));
```

Now tabs can be reordered in HTML without touching JS.

### Timed Reveals

Timed reveals should work as data-driven attributes on sections or elements:

```html
<section class="page" id="surprise" data-reveal-after="2026-04-12T00:00:00">
  <!-- Content hidden until April 12 -->
</section>
```

```javascript
// js/reveals.js
function checkReveals() {
  const now = new Date();
  document.querySelectorAll('[data-reveal-after]').forEach(el => {
    const revealDate = new Date(el.dataset.revealAfter);
    if (now >= revealDate) {
      el.classList.add('revealed');
    } else {
      el.classList.add('hidden-reveal');
    }
  });
}
```

Nav tabs for unrevealed sections get hidden too:
```css
.hidden-reveal { display: none !important; }
.tab[data-page="surprise"]:not(.revealed-tab) { display: none; }
```

The reveal check runs on page load. No server needed -- it's client-side date checking. Can be "tricked" by changing system time, but this is a personal site, not a security boundary.

---

## 7. CNAME / DNS Considerations

### Current Setup

```
DNS:  annielovessnakes.com -> GitHub Pages IP (via A record or CNAME to username.github.io)
Repo: CNAME file contains "annielovessnakes.com"
Pages: Serves from main branch, custom domain configured
```

### GitHub Pages + Custom Domain

GitHub Pages custom domains work via:
1. `CNAME` file in repo root with the domain name
2. DNS pointing to GitHub's servers (`185.199.108-111.153` for apex, or CNAME to `username.github.io`)
3. GitHub automatically provisions a Let's Encrypt SSL certificate

### Staging Has No DNS Conflict

Staging uses `annie-birthdart-staging.surge.sh` -- a Surge subdomain. It has:
- Its own DNS (managed by Surge)
- Its own SSL cert (auto-provisioned by Surge)
- No overlap with the production domain

The `CNAME` file in the repo does NOT affect Surge deployment. Surge determines the target domain from the CLI argument, not from file contents.

### If You Later Want a Custom Staging Domain

Example: `staging.annielovessnakes.com`

1. Add a DNS CNAME record: `staging.annielovessnakes.com -> na-east1.surge.sh`
2. Update the Surge deploy command: `surge . staging.annielovessnakes.com`
3. Surge paid tier ($13/mo) required for custom domains

Not recommended. The `*.surge.sh` subdomain is fine for staging.

### GitHub Pages Gotcha: Branch Deploys

GitHub Pages deploys from ONE branch only. You cannot have `staging` branch deploy to a second GitHub Pages URL. This is why Surge is needed for staging -- GitHub Pages is reserved for production on `main`.

---

## 8. Recommended File Structure (Target State)

```
annie-birthdart/
  index.html                    # HTML shell: head, nav, section skeletons
  css/
    style.css                   # All styles extracted from inline <style>
  js/
    app.js                      # Nav, swipe, GSAP transitions, reveal init
    publications.js             # Publication data array + renderer
    reveals.js                  # Date-gated content system
    gallery.js                  # Photo gallery (lazy-load, lightbox)
  images/
    reptile-expo.png            # Existing asset
    gallery/                    # Photo gallery assets (phase 1: in-repo)
  CNAME                         # annielovessnakes.com
  .gitignore
  .htmlhintrc                   # HTML linting config
  .lighthouserc.json            # Lighthouse CI config (new)
  .github/
    workflows/
      validate.yml              # HTML lint, link check, Lighthouse, size budget
      deploy-preview.yml        # Surge.sh deploy on staging push
  .planning/                    # Project management (not deployed)
    PROJECT.md
    research/
      ARCHITECTURE.md           # This document
```

---

## 9. Data Flow Diagrams

### Development Flow

```
Developer (Justin)
    |
    | git push
    v
[dev branch]
    |
    | GitHub Actions: validate.yml
    | - HTML lint
    | - Link check
    | - Lighthouse (local)
    | - Size budget
    |
    | PR (dev -> staging)
    v
[staging branch]
    |
    |-- GitHub Actions: validate.yml (same checks)
    |-- GitHub Actions: deploy-preview.yml
    |       |
    |       v
    |   [Surge.sh]
    |   annie-birthdart-staging.surge.sh
    |       |
    |       v
    |   Preview / feedback
    |
    | PR (staging -> main)
    v
[main branch]
    |
    | GitHub Pages (automatic)
    v
[annielovessnakes.com]
```

### Page Load Flow (After Split)

```
Browser requests annielovessnakes.com
    |
    v
index.html (HTML shell, ~150 lines)
    |
    +-- <link> css/style.css        (parallel, cached)
    +-- <script> GSAP CDN           (parallel, cached by CDN)
    +-- <script defer> app.js       (parallel, deferred)
    +-- <script defer> pubs.js      (parallel, deferred)
    +-- <script defer> reveals.js   (parallel, deferred)
    |
    | DOM parsed
    v
defer scripts execute in order:
    1. publications.js  -> renders pub list into #pub-list
    2. reveals.js       -> checks dates, hides/shows gated content
    3. app.js           -> initializes nav, swipe, GSAP animations
    |
    v
User interacts (tab click / swipe)
    |
    v
app.js goTo() -> GSAP animates page transition
```

### Content Addition Flow

```
New feature request (e.g., "add photo gallery tab")
    |
    v
1. Create js/gallery.js with data + render logic
2. Add <section class="page" id="photos"> to index.html
3. Add nav <button> to index.html
4. Add gallery styles to css/style.css
5. Add images to images/gallery/ (or Cloudinary URLs in gallery.js)
    |
    | No build step. No config files. Just add files and reference them.
    v
Push to dev -> validate -> PR to staging -> preview -> PR to main -> live
```

---

## 10. Summary of Recommendations

| Decision | Recommendation | Rationale |
|----------|---------------|-----------|
| Single file vs. split | **Split** into HTML + CSS + JS files | Approaching 1000+ lines with planned features; PRs are unreadable as single-file diffs |
| Branch flow | **dev -> staging -> main** with PRs | Already set up. Gives safe iteration + preview before production |
| Staging deploy | **Surge.sh** at `annie-birthdart-staging.surge.sh` | Zero config, free, stable URL, no DNS changes needed |
| Image hosting (phase 1) | **In-repo** under `images/` | Fine for <20 images, keeps deployment simple |
| Image hosting (phase 2) | **Cloudinary** free tier | URL-based transforms, automatic optimization, no build step |
| Tab additions | **ID-based nav** instead of index-based | Reorder-proof, no JS changes needed to add/remove tabs |
| Timed reveals | **`data-reveal-after` attributes** + client-side date check | No server needed, works with static hosting, declarative |
| Lighthouse CI | **Local static dir** instead of production URL | Tests the PR code, not the already-deployed site |
| Custom staging domain | **Skip** -- use `*.surge.sh` | Not worth $13/mo for a personal project's staging env |

---

*Research completed 2026-03-28. Authored for annie-birthdart CI/CD architecture planning.*
