# Pitfalls Research: Static Site CI/CD on GitHub Pages

Research for the annie-birthdart project (annielovessnakes.com).
Focused on pitfalls specific to this stack: single HTML file, GitHub Pages, Surge.sh staging, GitHub Actions, photo gallery, timed reveals.

---

## 1. GitHub Pages Deployment Gotchas

### 1a. CNAME file gets deleted on deploy

**What happens:** GitHub Pages deployments from Actions or branch pushes can silently remove the `CNAME` file if it is not included in the deployed content. The custom domain disappears, and the site reverts to `username.github.io/repo`.

**Warning signs:** Site works at github.io URL but not at custom domain after a push. GitHub repo settings show custom domain as blank.

**Prevention:**
- The `CNAME` file is already in the repo root (contains `annielovessnakes.com`). Keep it tracked in git on all branches, not just `main`.
- If ever using a deploy action that copies files to a different branch (e.g., `gh-pages`), ensure CNAME is included in the copy.
- Never configure the custom domain exclusively through GitHub UI settings -- it only writes the CNAME file, which gets overwritten on next deploy.

**Phase:** Address during CI/CD setup (current phase). Validate with a test push.

### 1b. Branch source confusion

**What happens:** GitHub Pages can deploy from `main`, `gh-pages`, or GitHub Actions. The repo is set to deploy from `main`. If someone enables "GitHub Actions" as the source in repo settings (or a workflow writes to `gh-pages`), the two sources conflict. Deploys succeed but the wrong content appears.

**Warning signs:** Pushing to `main` does not update the live site. Or the live site shows stale content.

**Prevention:**
- Stick with the current setup: deploy from `main` branch, root folder. Do not add a separate `gh-pages` branch.
- Do not add a `pages` job in GitHub Actions unless switching fully to Actions-based deployment (and then disable branch-based deployment in settings).
- Document the deploy source in PROJECT.md (already done).

**Phase:** CI/CD setup. One-time verification.

### 1c. Aggressive caching (304 Not Modified)

**What happens:** GitHub Pages serves assets with aggressive cache headers. After pushing an update, Annie visits the site and sees the old version. She might not know to hard-refresh. This is especially bad for surprise reveals -- the surprise is stale.

**Warning signs:** "I updated the site but Annie says nothing changed." Browser dev tools show 304 responses.

**Prevention:**
- For the single `index.html`, GitHub Pages already sets relatively short cache (10 minutes). But CDN edge caches can hold longer.
- Add a cache-busting query string to CDN resources if they change: `<script src="lib.js?v=2">`.
- For truly time-sensitive reveals, add a `<meta http-equiv="Cache-Control" content="no-cache">` to the HTML head. This does not affect GitHub's CDN but tells browsers to revalidate.
- Annie's phone browser may cache aggressively. Worst case: the site needs a service worker with update-on-activate strategy, but that is over-engineering for now. Simpler: use `fetch` API in the timed reveal JS to check for fresh content.

**Phase:** Timed reveal implementation (future phase). Revisit if Annie reports stale content.

### 1d. HTTPS certificate delays after CNAME change

**What happens:** GitHub Pages uses Let's Encrypt. After adding or changing a CNAME, the certificate can take up to 24 hours to provision. During this window, HTTPS shows a certificate error.

**Warning signs:** Browser shows "Your connection is not private" on the custom domain immediately after setup.

**Prevention:**
- The CNAME (`annielovessnakes.com`) is already set and the cert should be active. Do not change the CNAME value unless absolutely necessary.
- If DNS changes are needed (e.g., moving registrars), do them during a low-traffic window and warn Annie the site might be briefly unavailable.

**Phase:** Already resolved. Only relevant if domain config changes.

---

## 2. Surge.sh Staging Preview Issues

### 2a. Token expiry and rotation

**What happens:** Surge tokens do not expire on their own, but they can be revoked if the user runs `surge logout` or if Surge changes their auth flow. The GitHub Actions workflow uses `secrets.SURGE_TOKEN`. If the token becomes invalid, deploys fail silently (the workflow exits non-zero but GitHub does not send a notification by default).

**Warning signs:** Deploy-preview workflow fails. Staging URL shows old content or 404.

**Prevention:**
- After generating the token (`surge token`), store it as a GitHub Actions secret immediately. Test with a manual workflow run.
- Add a workflow step that checks the Surge response for errors (the current workflow does not validate the deploy succeeded).
- Consider adding a comment to the workflow noting when the token was created and who owns it.
- Set a calendar reminder to verify the token every 6 months (tokens do not auto-expire, but the account might).

**Phase:** CI/CD setup (current). Token creation is listed as pending in PROJECT.md.

### 2b. Surge domain conflicts

**What happens:** Surge.sh subdomains are first-come-first-served. If `annie-birthdart-staging.surge.sh` is already claimed by another user, the deploy fails. Surge also has reserved words and character restrictions.

**Warning signs:** `surge` command returns "Aborted - Loss of domain ownership" or similar.

**Prevention:**
- Test the domain name locally before committing the workflow: `surge . annie-birthdart-staging.surge.sh`.
- If the name is taken, use an alternative like `annie-birthdart-preview.surge.sh` or `annielovessnakes-staging.surge.sh`.
- Surge allows custom domains but that requires DNS config -- overkill for a staging preview.

**Phase:** CI/CD setup (current). Validate during first manual deploy.

### 2c. HTTPS quirks on Surge

**What happens:** Surge provides free SSL on `.surge.sh` subdomains. However, mixed content issues can arise if the HTML references `http://` resources. The current site uses GSAP from `https://` CDN and Google Fonts from `https://`, so this should be fine. But if someone adds an `http://` image source, Surge will serve over HTTPS and the browser will block the image.

**Warning signs:** Images or scripts not loading on the staging URL. Console shows mixed content warnings.

**Prevention:**
- Always use `https://` or protocol-relative URLs for external resources.
- The HTMLHint config already validates some patterns. Consider adding a CI check that greps for `http://` in `index.html` (excluding `http-equiv`).

**Phase:** CI/CD setup. Add as a validation step.

### 2d. Surge deploys the entire directory

**What happens:** `surge .` deploys everything in the current directory. On GitHub Actions this is the full checkout, which includes `.git/`, `.github/`, `.planning/`, `.htmlhintrc`, and any other dotfiles. None of this is harmful (visitors would need to know the exact filenames), but it is sloppy and could leak planning docs.

**Warning signs:** Someone navigates to `annie-birthdart-staging.surge.sh/.planning/PROJECT.md` and sees internal project docs.

**Prevention:**
- Create a `.surgeignore` file (functions like `.gitignore`) to exclude `.git/`, `.github/`, `.planning/`, `.claude/`, etc.
- Alternatively, modify the deploy step to copy only deployable files to a temp directory first.

**Phase:** CI/CD setup (current). Easy fix, should be done before first deploy.

---

## 3. Image Bloat in Git Repos

### 3a. Committing photos directly to git

**What happens:** Birthday photos are typically 3-10MB each as originals. Even compressed JPEGs at web quality are 200-500KB. A gallery of 30 photos adds 6-15MB to the repo. Git stores every version permanently -- deleting photos from HEAD does not reduce repo size. The 551-line HTML file is currently ~30KB; adding 30 photos makes the repo 200-500x larger.

**Warning signs:** `git clone` takes noticeably longer. GitHub warns about repo size. GitHub Actions checkout step takes 30+ seconds instead of 2 seconds.

**Prevention strategy (tiered):**
1. **Optimize before commit:** Use `imagemagick` or `squoosh` to resize photos to max 1200px wide, JPEG quality 80, strip EXIF. Target <100KB per photo.
2. **Use a CDN instead of git:** Upload photos to a free image CDN (Cloudflare R2, Imgur, imgbb) and reference by URL. Zero repo bloat.
3. **Git LFS:** Tracks large files as pointers. GitHub gives 1GB free storage + 1GB bandwidth/month. Adds complexity but keeps files in the repo workflow.
4. **Separate branch:** Some projects put media on an orphan branch. Clever but fragile and confusing.

**Recommended for this project:** Option 1 (optimize aggressively) for a small gallery (<20 photos). Option 2 (CDN) if the gallery grows. Git LFS is over-engineering for a personal site.

**Phase:** Photo gallery implementation (future phase). Decide before the first photo is committed.

### 3b. The Synology MSI problem

**What happens:** There is already a 58MB `Synology Active Backup for Business Agent-3.1.0-4967-x64.msi` in the working directory. It is not committed (`.gitignore` catches `*.msi`), but if the gitignore pattern is changed or someone uses `git add -A`, it would be committed permanently.

**Warning signs:** Repo size jumps to 58MB+.

**Prevention:**
- The `*.msi` gitignore rule is already in place. Keep it.
- Delete the MSI from the working directory -- it has no business being in a birthday website repo.
- Add `*.msi` to a global gitignore as well.

**Phase:** Immediate housekeeping. Not tied to any feature phase.

---

## 4. GitHub Actions for Static Sites

### 4a. Over-engineering the pipeline

**What happens:** The validation workflow currently runs HTMLHint, lychee link checking, and Lighthouse CI. For a single static HTML file maintained by one person, this is already the right level. The temptation is to add: minification, image optimization pipelines, multiple browser testing, deployment gates, Slack notifications, etc. Each addition increases maintenance burden and workflow runtime for marginal benefit.

**Warning signs:** Workflows take >2 minutes. You spend more time debugging CI than building features. Workflow files are longer than the site itself.

**Prevention:**
- Keep the validation workflow under 5 minutes (already has `timeout-minutes: 5`).
- Only add CI checks that have caught a real bug or prevented a real regression. Do not add speculative checks.
- The link checker has `fail: false` which is correct -- external links break for reasons outside your control.

**Phase:** CI/CD setup (current). Resist scope creep in future phases.

### 4b. Lighthouse CI testing the wrong URL

**What happens:** The current `validate.yml` runs Lighthouse against `https://annielovessnakes.com` -- the production URL. This means Lighthouse results in the `dev` and `staging` branches reflect production, not the branch being tested. It is measuring the wrong thing.

**Warning signs:** Lighthouse scores never change across branches. Performance regression on `dev` is not caught until it hits `main`.

**Prevention:**
- On `staging` branch: run Lighthouse against the Surge preview URL instead.
- On `dev` branch: skip Lighthouse entirely (no deployed URL to test), or use a local server + lighthouse CLI.
- Simplest fix: make the Lighthouse step conditional on the branch, and update the URL for staging:
  ```yaml
  if: github.ref == 'refs/heads/staging'
  urls: https://annie-birthdart-staging.surge.sh
  ```

**Phase:** CI/CD setup (current). Fix before considering Lighthouse results reliable.

### 4c. Secret management hygiene

**What happens:** The `SURGE_TOKEN` is the only secret currently needed. But common mistakes: committing the token to the workflow file directly, storing it as an environment variable in a public step that logs it, or granting overly broad permissions to the workflow.

**Warning signs:** Token visible in workflow logs. Workflow has `permissions: write-all`.

**Prevention:**
- The current workflow correctly uses `${{ secrets.SURGE_TOKEN }}`. Do not change this pattern.
- Avoid `echo $SURGE_TOKEN` or any step that might print secrets to logs.
- Do not add `permissions:` at the workflow level unless needed. The defaults are restrictive enough.

**Phase:** CI/CD setup (current). One-time review.

### 4d. Concurrency and race conditions

**What happens:** Both workflows have `cancel-in-progress: true`. This is good for avoiding stacked runs. But if you push to `staging` rapidly (e.g., multiple quick fixups), the Surge deploy can be interrupted mid-upload, leaving the staging site in a broken state.

**Warning signs:** Staging URL shows a partially deployed site (missing CSS/JS, broken layout).

**Prevention:**
- The single-file architecture actually helps here -- there is only one file to deploy, so partial deploys are unlikely.
- If the site grows to multiple files, consider adding a `surge teardown` step before redeploy, or use Surge's atomic deploy feature.
- Avoid rapid-fire pushes to staging. Use `dev` for iteration, `staging` for "ready to preview."

**Phase:** CI/CD setup. Already mitigated by single-file architecture. Revisit if file count grows.

---

## 5. Single HTML File Scaling Limits

### 5a. When the file becomes unmaintainable

**What happens:** The current `index.html` is 551 lines with inline CSS, inline JS, and all content. This is manageable now. At ~1000 lines, finding and editing specific sections becomes error-prone. At ~2000 lines, the file is actively hostile to maintenance. A photo gallery with inline base64 images could blow past 2000 lines instantly.

**Warning signs:** You make an edit to one section and accidentally break another. CSS selectors start conflicting. The file takes noticeably long to load in an editor.

**Prevention (when to split):**
- **Under 800 lines:** Stay in one file. The simplicity is worth it.
- **800-1500 lines:** Extract CSS to `style.css` and JS to `app.js`. Three files, no build step needed.
- **1500+ lines:** Consider splitting into multiple HTML pages or using HTML includes (but this requires a build step, which violates the "no build step" constraint).
- **Alternative for content scaling:** Keep the HTML file as a shell and load content sections via `fetch()` from separate HTML fragments. This preserves "no build step" while splitting content.

**Phase:** Photo gallery implementation. The gallery will likely push past 800 lines if photos are inline. Plan the split before adding gallery content.

### 5b. CSS specificity wars

**What happens:** All styles are in one `<style>` block. As more tabs/sections are added, class names start colliding or requiring increasingly specific selectors. The current approach uses section-specific prefixes (`.pub-*`, `.menu-*`, `.setlist-*`) which is good. But a photo gallery adds `.gallery-*`, timed reveals add `.reveal-*`, and soon the CSS is 400+ lines of prefix-namespaced styles.

**Warning signs:** You need `!important` to override a style. Two sections look slightly different than intended because of a shared class name.

**Prevention:**
- Continue the current prefix convention (`[section]-[element]`). It works.
- If extracting CSS to a separate file, organize by section with clear comment headers.
- Do not introduce a CSS framework (Tailwind, Bootstrap) -- it would be a larger change than the problem it solves.

**Phase:** Ongoing. No specific phase needed. Just maintain discipline.

### 5c. JavaScript scope pollution

**What happens:** All JS is in one `<script>` block at the end of the file. Variables and functions share global scope. Adding a photo gallery lightbox, a timed reveal system, and swipe gesture handling in the same scope risks name collisions and event handler conflicts.

**Warning signs:** A function name like `init()` or `show()` gets reused. Event listeners fire in unexpected order. One feature's state variable gets clobbered by another's.

**Prevention:**
- Wrap each feature in an IIFE or use object namespaces: `const Gallery = { init() {...} }`.
- When extracting to a separate JS file, use ES modules (`<script type="module">`) for proper scoping. Modules work in all modern browsers without a build step.
- Keep GSAP timeline management centralized in one place -- multiple sections animating independently can cause jank.

**Phase:** Photo gallery and timed reveals. Extract JS before adding significant new functionality.

---

## 6. Mobile Performance with Photo Galleries

### 6a. Loading all images at once

**What happens:** A naive gallery loads all 20-30 photos when the page loads, even though the user is on the Home tab and the gallery tab is not visible. On mobile data (3G/4G), this means 5-20MB of images downloaded before the user even taps the gallery tab. The GSAP animations on the home page stutter because the main thread is handling image decodes.

**Warning signs:** Lighthouse performance score drops below 70. First Contentful Paint increases. Users on slow connections see a blank page for seconds.

**Prevention:**
- **Lazy load with `loading="lazy"`:** Browser-native, zero JS. Images only load when they approach the viewport. Since gallery images are on a hidden tab, they would not load until the tab is activated and the images scroll into view.
- **Use `<picture>` with `srcset`:** Serve smaller images to smaller screens. A 400px-wide phone does not need a 1200px image.
- **Thumbnail-first pattern:** Show small thumbnails (~30KB each) in the gallery grid. Full-size images load only when tapped/clicked (lightbox pattern).
- **Progressive JPEG:** Renders a blurry preview immediately, then sharpens. Better perceived performance than waiting for a full load.

**Phase:** Photo gallery implementation. Non-negotiable for mobile performance.

### 6b. Touch gesture conflicts

**What happens:** The site already has swipe gestures for tab navigation (GSAP-powered). A photo gallery typically has its own swipe gestures (swipe between photos, pinch to zoom). These will conflict. Swiping left on a photo might switch tabs instead of going to the next photo.

**Warning signs:** Swiping in the gallery changes tabs. Or gallery swipe stops working because tab swipe handlers eat the events.

**Prevention:**
- When the gallery lightbox is open, disable the tab swipe handler. Use a state flag: `isLightboxOpen`.
- Use `event.stopPropagation()` in the lightbox swipe handler to prevent the event from reaching the tab swipe handler.
- Test on actual phones (not just browser dev tools) -- touch event behavior varies between iOS Safari and Chrome for Android.

**Phase:** Photo gallery implementation. Must be designed into the gallery from the start, not patched after.

### 6c. Memory pressure on older phones

**What happens:** Each decoded image in the browser consumes width * height * 4 bytes of GPU memory. A 1200x800 photo = 3.8MB of GPU memory. 30 photos = 115MB. Older phones (iPhone SE, budget Android) have limited GPU memory and will start evicting textures, causing janky re-renders or crashes.

**Warning signs:** Gallery scrolling stutters. Browser tab crashes on older devices. GSAP animations freeze during gallery scrolling.

**Prevention:**
- Keep gallery images at reasonable dimensions (max 800px wide for thumbnails, 1200px for lightbox).
- Use `content-visibility: auto` CSS to let the browser skip rendering off-screen images entirely.
- Limit the visible gallery to 10-15 thumbnails per "page" with a "load more" button rather than an infinite scroll.
- Dispose lightbox images when closed (set `src` to empty or a 1x1 pixel).

**Phase:** Photo gallery implementation. Design constraint, not a retrofit.

---

## 7. Timed Reveal Features Across Timezones

### 7a. Client-side time is unreliable

**What happens:** A timed reveal that checks `new Date()` in JavaScript uses the user's device clock. If the reveal is set for "March 30 at noon" and Annie is in a different timezone than expected, or her phone clock is wrong, the reveal fires at the wrong time (or not at all).

**Warning signs:** "The surprise was supposed to show at noon but Annie saw it at 3pm." Or "Annie says the surprise never appeared."

**Prevention:**
- **Never rely solely on the device clock.** Fetch server time from a free API as a reference:
  ```js
  fetch('https://worldtimeapi.org/api/timezone/America/New_York')
  ```
- **Use UTC internally, display locally.** Set all reveal times in UTC. Convert for display only.
- **Use date-only triggers when possible.** "Unlocks on March 30" (any time that day) is more robust than "Unlocks at 12:00 PM EST March 30." A 24-hour window forgives timezone issues.
- **Fallback:** If the time API fails, fall back to device time with a generous buffer (e.g., reveal 1 hour early).

**Phase:** Timed reveal implementation (future phase). Architecture decision needed before writing any reveal code.

### 7b. Reveals that "un-reveal" on refresh

**What happens:** If the reveal logic is purely time-based with no persistence, a user who sees a reveal, closes the browser, and comes back might see the reveal animation again (harmless but less magical) or worse, see the content hidden again if the check is `currentTime > revealTime` and the time comparison has a bug.

**Warning signs:** Annie says "I saw the surprise yesterday but now it is gone."

**Prevention:**
- **Use `localStorage` to persist reveal state.** Once a reveal is unlocked, set `localStorage.setItem('reveal-birthday-2026', 'true')`. On page load, check localStorage first, time second.
- **Graceful degradation:** If localStorage is unavailable (private browsing), fall back to time-only. It means re-animation on refresh, which is acceptable.
- **Never hide already-revealed content.** If the reveal time has passed, show the content immediately without animation. Animation is only for the first viewing.

**Phase:** Timed reveal implementation. Core design requirement.

### 7c. Caching defeats time-based reveals

**What happens:** This combines pitfall 1c (GitHub Pages caching) with timed reveals. If Annie has a cached version of the page, and the reveal was added in a recent push, she sees the old version without the reveal code. The reveal "does not exist" from her browser's perspective.

**Warning signs:** Justin pushes a reveal at 11:55 AM for a noon surprise. Annie loads the page at 12:01 PM but sees the version from this morning without the reveal.

**Prevention:**
- **Separate reveal logic from reveal content.** The reveal check JavaScript should be present in the HTML well before the reveal date. Only the content/unlock time is new. This way, even a cached version has the reveal machinery.
- **Pre-deploy reveals.** Push the reveal code (with a future unlock time) at least 24 hours before the reveal date. This ensures Annie's browser has time to get the fresh version.
- **Add a lightweight version check.** On page load, fetch a tiny `version.json` file (1 byte: `{"v":2}`). If the version does not match the one embedded in the HTML, show a "New content available" prompt.

**Phase:** Timed reveal implementation. Architecture decision -- deploy strategy must account for caching.

### 7d. Timezone-sensitive date formatting

**What happens:** JavaScript's `Date` object is notoriously timezone-sensitive. `new Date('2026-03-30')` creates midnight UTC, which is 8 PM March 29 in PST. If Annie is on the West Coast and the reveal says "Available March 30" but the code checks `new Date('2026-03-30')`, she cannot access it until 8 PM on the 29th -- or more likely, the whole day of the 30th works but the 29th evening is confusingly early.

**Warning signs:** Reveals unlock "early" or "late" by a few hours relative to the intended date.

**Prevention:**
- **Always include timezone in date strings:** `new Date('2026-03-30T00:00:00-04:00')` (Eastern) or use epoch timestamps.
- **For date-only reveals:** Compare only the date portion, not the full timestamp. `new Date().toISOString().slice(0, 10) >= '2026-03-30'` compares UTC dates, which is consistent.
- **Test with device timezone set to different zones.** Chrome DevTools has a timezone override in the Sensors panel.

**Phase:** Timed reveal implementation. Must be in the coding standard before the first reveal is written.

---

## Summary: Phase-Ordered Priority

| Phase | Pitfalls to Address | Severity |
|-------|-------------------|----------|
| **CI/CD Setup (current)** | CNAME preservation (1a), branch source (1b), Lighthouse wrong URL (4b), Surge token (2a), Surge domain claim (2b), .surgeignore (2d), secret hygiene (4c) | High |
| **Photo Gallery** | Image bloat in git (3a), lazy loading (6a), touch conflicts (6b), memory pressure (6c), file split decision (5a) | High |
| **Timed Reveals** | Client time unreliable (7a), persistence (7b), caching vs reveals (7c), timezone formatting (7d), cache busting (1c) | Medium-High |
| **Ongoing** | Over-engineering CI (4a), CSS discipline (5b), JS scope (5c), Synology MSI cleanup (3b) | Low-Medium |
