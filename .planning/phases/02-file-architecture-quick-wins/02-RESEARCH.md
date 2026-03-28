# Phase 2: File Architecture + Quick Wins - Research

**Researched:** 2026-03-28
**Domain:** Static site architecture, ARIA accessibility, Open Graph metadata
**Confidence:** HIGH

## Summary

This phase decomposes a 652-line monolithic `index.html` into three separate files (`css/style.css`, `js/app.js`, `js/publications.js`) plus an HTML shell. The CSS extraction is mechanical (lines 17-237 move verbatim). The JS split requires careful attention: the publication data array (51 entries, ~52 lines) goes to `publications.js`, while all navigation, interaction, and animation logic goes to `app.js`. The tab system modernization changes `data-page` from numeric indices (`"0"`, `"1"`) to section IDs (`"home"`, `"weekend"`), with JS reading tab config from the DOM at init time instead of maintaining a hardcoded `ids` array.

The quick wins (OG image, ARIA tabs) are low-risk additions. OG tags go in `<head>` with four required properties. ARIA requires `role="tablist"` on the nav, `role="tab"` + `aria-selected` + `aria-controls` on buttons, and `role="tabpanel"` + `aria-labelledby` on sections, plus keyboard focus management.

One critical finding: the existing Playwright test `structure.spec.js` line 25-31 explicitly asserts that `data-page` values are numeric indices. This test must be updated to match the new ID-based scheme. All other tests use `.nth()` positioning and CSS class selectors, so they survive the split unchanged.

**Primary recommendation:** Extract CSS verbatim, split JS by concern with `defer` on both scripts, change `data-page` to string IDs, wire ARIA attributes onto existing elements, add OG meta tags, update the one breaking test.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** Split into `css/style.css`, `js/app.js`, and `js/publications.js` -- single CSS file, JS split by concern
- **D-02:** index.html becomes an HTML shell with `<link>` and `<script>` tags only -- no inline CSS/JS
- **D-03:** Publication data array (51 entries) moves to `js/publications.js` to keep app.js focused on navigation/interaction
- **D-04:** No bundler, no build step -- raw files served directly by GitHub Pages
- **D-05:** Tabs should be data-driven from HTML structure -- adding a new tab requires only a `<section>` with an ID and a `<button>` with `data-page` in the nav
- **D-06:** JS reads tab config from the DOM at init time (querySelectorAll sections, map IDs) -- no hardcoded `ids` array
- **D-07:** Hash routing, swipe, keyboard nav, and GSAP transitions remain as-is -- only the tab registry changes
- **D-08:** Use `images/hero-dance.jpg` (800x535, 97KB) as the OG image -- landscape, high energy, represents the celebration
- **D-09:** Add `og:image`, `og:image:width`, `og:image:height`, and `twitter:card` meta tags
- **D-10:** Nav gets `role="tablist"`, each tab gets `role="tab"` + `aria-selected`, each section gets `role="tabpanel"` + `aria-labelledby`
- **D-11:** Focus management on tab switch -- move focus to the active panel for screen readers
- **D-12:** Add `<main>` landmark around the app shell, `<nav>` is already semantic

### Claude's Discretion
- CSS custom property organization (grouping, naming) during the split
- Whether to add a `<noscript>` fallback
- Minor HTML cleanup during the split (consistent indentation, attribute ordering)

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| ARCH-01 | Split `index.html` into separate files: `css/style.css`, `js/app.js`, `js/publications.js` | CSS extraction is mechanical (lines 17-237). JS split boundary identified: publications.js = data array + renderPubs(); app.js = everything else. Script loading order via `defer` ensures correct execution. |
| ARCH-02 | Tab navigation refactored from index-based to ID-based (`data-page="photos"` not `data-page="6"`) | Current code uses `data-page="0"` through `data-page="4"` with hardcoded `const ids=['home','weekend','menu','pubs','gift']`. New approach: `data-page="home"`, `data-page="weekend"`, etc. JS reads IDs from DOM via querySelectorAll. |
| ARCH-03 | New tabs/sections can be added without modifying core JS logic | DOM-driven tab discovery pattern documented. JS reads all `nav .tab[data-page]` buttons and maps to sections by ID. No arrays to maintain. |
| META-01 | `og:image` meta tag for link sharing previews | Full OG tag set documented: og:title, og:description, og:image, og:image:width, og:image:height, og:image:alt, og:url, og:type, twitter:card. Image verified: 800x535 JPEG at 97KB. |
| META-02 | ARIA roles on navigation elements | WAI-ARIA tabs pattern from W3C APG documented: role=tablist/tab/tabpanel, aria-selected, aria-controls, aria-labelledby, keyboard interaction, focus management. |
</phase_requirements>

## Architecture Patterns

### Target File Structure
```
annie-birthdart/
├── index.html           # HTML shell only (~200 lines)
├── css/
│   └── style.css        # All CSS (~230 lines, extracted verbatim)
├── js/
│   ├── app.js           # Nav, interactions, animations (~170 lines)
│   └── publications.js  # Publication data array + render function (~60 lines)
├── images/
│   └── ...              # Unchanged
└── ...                  # Config files unchanged
```

### Pattern 1: CSS Extraction (Mechanical)

**What:** Move lines 17-237 of index.html (everything inside `<style>...</style>`) directly to `css/style.css`. No transformations needed -- the CSS uses only standard features (custom properties, `clamp()`, `env()`) and references no inline-only constructs.

**Verification points:**
- All `:root` custom properties must be present (13 variables)
- `@keyframes` blocks (drawSnake, pulse, btnGlow, wiggle, confettiFall) must transfer
- `@media (prefers-reduced-motion: reduce)` block must transfer
- Two responsive `@media` blocks must transfer

**In index.html, replace `<style>...</style>` with:**
```html
<link rel="stylesheet" href="css/style.css">
```

### Pattern 2: JS Split by Concern

**What:** Split the single `<script>` block (lines 456-649) into two files based on responsibility.

**publications.js contains:**
- The `P` array (51 publication entries, lines 458-509)
- The `renderPubs()` function (lines 513-522)
- A self-executing call to `renderPubs()` at the end

**app.js contains:**
- Tab navigation logic (goTo, reveal functions)
- DOM-driven tab initialization (replaces hardcoded `ids` array)
- Resume toggle handler
- Swipe detection
- Keyboard navigation
- Gift reveal interaction + confetti

**Critical dependency:** `publications.js` must execute before `app.js` because `renderPubs()` populates the `#pub-list` DOM element that exists in the HTML. If `app.js` runs first and tries to animate the pubs section, the list would be empty. Both scripts should use `defer` so they execute in document order after HTML parsing.

**In index.html:**
```html
<script src="https://cdn.jsdelivr.net/npm/gsap@3.12.7/dist/gsap.min.js"></script>
<script src="js/publications.js" defer></script>
<script src="js/app.js" defer></script>
```

**Note on `defer` + external CDN:** The GSAP script tag does NOT have `defer`, so it loads and executes first (blocking). The two local scripts have `defer`, which means they execute after HTML parsing, in order. This guarantees: GSAP loaded -> publications.js renders pub list -> app.js initializes navigation. This is the correct loading order.

### Pattern 3: DOM-Driven Tab System

**What:** Replace the hardcoded `const ids=['home','weekend','menu','pubs','gift']` with DOM discovery at init time.

**Current code (to replace):**
```javascript
const ids=['home','weekend','menu','pubs','gift'];
const tabs=document.querySelectorAll('.tab');
// ...
tabs.forEach(t=>t.addEventListener('click',()=>goTo(+t.dataset.page)));
```

**New approach:**
```javascript
// DOM-driven tab discovery -- no hardcoded array
const tabs = document.querySelectorAll('.nav-bar .tab');
const ids = Array.from(tabs).map(t => t.dataset.page);
const pages = new Map(ids.map(id => [id, document.getElementById(id)]));
let cur = ids[0];
let busy = false;

function goTo(targetId, dir) {
    if (targetId === cur || !pages.has(targetId) || busy) return;
    busy = true;
    const curIdx = ids.indexOf(cur);
    const targetIdx = ids.indexOf(targetId);
    dir = dir ?? (targetIdx > curIdx ? 1 : -1);

    const f = pages.get(cur);
    const t = pages.get(targetId);

    tabs.forEach(b => b.classList.toggle('active', b.dataset.page === targetId));
    // ... GSAP transition logic unchanged ...

    cur = targetId;
    history.replaceState(null, null, '#' + targetId);
}

// Tab click -- now uses string ID directly
tabs.forEach(t => t.addEventListener('click', () => goTo(t.dataset.page)));

// Swipe -- navigate by offset from current position in ids array
function goByOffset(offset, dir) {
    const curIdx = ids.indexOf(cur);
    const newIdx = curIdx + offset;
    if (newIdx >= 0 && newIdx < ids.length) goTo(ids[newIdx], dir);
}
```

**HTML change required:**
```html
<!-- Before: numeric indices -->
<button class="tab active" data-page="0">...</button>
<button class="tab" data-page="1">...</button>

<!-- After: section IDs -->
<button class="tab active" data-page="home">...</button>
<button class="tab" data-page="weekend">...</button>
<button class="tab" data-page="menu">...</button>
<button class="tab" data-page="pubs">...</button>
<button class="tab" data-page="gift">...</button>
```

**Why this satisfies ARCH-03:** To add a new tab, you only need to:
1. Add a `<button class="tab" data-page="newid">` in the nav
2. Add a `<section class="page" id="newid">` in the app container
3. Done. No JS changes.

### Pattern 4: ARIA Tabs (WAI-ARIA APG Compliant)

**Source:** W3C WAI-ARIA Authoring Practices Guide -- Tabs Pattern

**Required attributes by element:**

**Nav (tablist):**
```html
<nav class="nav-bar" role="tablist" aria-label="Site sections">
```

**Each tab button:**
```html
<button class="tab active" role="tab" data-page="home"
        id="tab-home" aria-selected="true" aria-controls="home"
        tabindex="0">
    <span class="tab-icon" aria-hidden="true">&#x1F40D;</span>
    <span class="tab-label">Home</span>
</button>
<button class="tab" role="tab" data-page="weekend"
        id="tab-weekend" aria-selected="false" aria-controls="weekend"
        tabindex="-1">
    ...
</button>
```

**Each section (tabpanel):**
```html
<section class="page active" id="home" role="tabpanel"
         aria-labelledby="tab-home" tabindex="0">
```

**Keyboard interaction (in app.js):**
- Arrow Left/Right: already implemented, but must also update `tabindex` (active tab gets `0`, others get `-1`)
- Home/End: optional but recommended -- move to first/last tab
- The `aria-selected` attribute must toggle in sync with the `active` class

**Focus management (D-11):**
When a tab is activated, move focus to the active tabpanel element for screen reader users. Add to goTo():
```javascript
// After transition completes
t.focus({ preventScroll: true });
```
The `tabindex="0"` on each tabpanel makes them focusable.

### Pattern 5: OG Meta Tags

**Required tags (from ogp.me spec):**
```html
<meta property="og:title" content="Annie's Birthdart Bash">
<meta property="og:description" content="A birthday weekend celebration">
<meta property="og:type" content="website">
<meta property="og:url" content="https://annielovessnakes.com">
<meta property="og:image" content="https://annielovessnakes.com/images/hero-dance.jpg">
<meta property="og:image:width" content="800">
<meta property="og:image:height" content="535">
<meta property="og:image:alt" content="Annie on the dance floor">
<meta name="twitter:card" content="summary_large_image">
```

**Notes:**
- `og:image` must be an absolute URL (not relative) -- social crawlers fetch from their servers, not yours
- `og:title` and `og:description` already exist in the current HTML (lines 11-12) but without the full set
- `twitter:card` set to `summary_large_image` for the large preview card format
- Twitter/X falls back to OG tags for title/description/image, so no need for `twitter:title` etc.
- iMessage and Slack both read OG tags natively

### Pattern 6: Main Landmark

**What:** Wrap the `.app` container in `<main>` for accessibility (D-12).

```html
<main class="app">
    <!-- sections here -->
</main>
```

The `.app` div is already on line 251 as `<main class="app">` -- checking... actually it's already `<main class="app">` on line 251 of the current file. So this is already done. No change needed for the landmark itself. Confirmed: line 251 is `<main class="app">`.

### Anti-Patterns to Avoid

- **Wrapping each file in an IIFE when using `defer`:** `defer` scripts execute in order after parsing. No need for IIFE isolation unless you specifically need to avoid polluting global scope. The current code already uses an IIFE (line 456), but `publications.js` needs its `renderPubs()` called from within its own scope, and `app.js` needs access to the rendered DOM. Keep the IIFE in app.js for encapsulation, but publications.js can be a simple IIFE too since it only needs to run `renderPubs()`.
- **Using `async` instead of `defer`:** `async` scripts execute as soon as they download, in arbitrary order. This would break the publications-before-app dependency.
- **Moving GSAP to `defer`:** GSAP must be available before `app.js` runs. The current non-deferred GSAP CDN script ensures it loads first. If you defer GSAP too, all three scripts would execute in order (fine), but GSAP would load after HTML parsing starts, which changes the current behavior. Leave GSAP as-is.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Focus trapping in tablist | Custom keydown handler from scratch | Follow WAI-ARIA APG keyboard spec exactly | The spec defines precise behavior for Tab, Arrow, Home, End keys -- deviating breaks screen reader expectations |
| Social preview cards | Custom meta tag experiments | The exact OG + twitter:card tags from the spec | Social platforms have specific parsers; non-standard tags are silently ignored |
| Script loading orchestration | Custom loader/promise chain | `defer` attribute on `<script>` tags | Native browser feature, zero overhead, guaranteed execution order |

## Common Pitfalls

### Pitfall 1: Relative og:image URL
**What goes wrong:** Social platforms show no image preview when sharing.
**Why it happens:** Crawlers from Facebook, Twitter, Slack, iMessage fetch the image from their own servers. A relative path like `images/hero-dance.jpg` has no domain context.
**How to avoid:** Always use absolute URL: `https://annielovessnakes.com/images/hero-dance.jpg`
**Warning signs:** Preview shows title/description but no image.

### Pitfall 2: Forgetting aria-selected State Sync
**What goes wrong:** Screen readers announce the wrong active tab.
**Why it happens:** The visual `active` class toggles correctly, but `aria-selected` is only set in the initial HTML and never updated by JS.
**How to avoid:** In the `goTo()` function, update `aria-selected` in the same loop that toggles the `active` class:
```javascript
tabs.forEach(b => {
    const isActive = b.dataset.page === targetId;
    b.classList.toggle('active', isActive);
    b.setAttribute('aria-selected', String(isActive));
    b.setAttribute('tabindex', isActive ? '0' : '-1');
});
```
**Warning signs:** Lighthouse accessibility audit flags "ARIA attributes do not match their roles."

### Pitfall 3: Publication Script Loading Race
**What goes wrong:** `#pub-list` is empty when navigating to the Resume tab.
**Why it happens:** If `publications.js` uses `async` instead of `defer`, it might execute after `app.js` initializes the page.
**How to avoid:** Use `defer` on both scripts. `defer` guarantees execution in document order.
**Warning signs:** Publications tab shows empty list on first load but works on refresh.

### Pitfall 4: Breaking the Existing Test for data-page Indices
**What goes wrong:** CI fails on the `structure.spec.js` test "nav tab data-page indices match section order."
**Why it happens:** The test on line 25-31 asserts `Number(dataPage)` equals the loop index `i`. After changing `data-page` from `"0"` to `"home"`, `Number("home")` is `NaN`.
**How to avoid:** Update the test to verify that each `data-page` value matches the corresponding section ID instead of a numeric index.
**Warning signs:** Test failure immediately after the HTML changes.

### Pitfall 5: CSS File Not Loading (404)
**What goes wrong:** Page renders with no styles -- raw HTML visible.
**Why it happens:** The `css/` directory doesn't exist yet, or the file path in the `<link>` tag has a typo.
**How to avoid:** Create the `css/` and `js/` directories before writing files. Use relative paths (`css/style.css`, not `/css/style.css`) since GitHub Pages serves from the repo root.
**Warning signs:** Page loads but looks unstyled. Browser DevTools shows 404 for CSS file.

### Pitfall 6: IIFE Scope Isolation Between Split Files
**What goes wrong:** Variables from `publications.js` clash with or are invisible to `app.js`.
**Why it happens:** If both files use IIFEs (which they should for encapsulation), neither file's variables are accessible to the other.
**How to avoid:** `publications.js` should be fully self-contained -- it calls `renderPubs()` which writes to the DOM via `getElementById('pub-list').innerHTML`. It doesn't need to export anything. `app.js` reads the DOM, not JS variables from publications.js. The two files communicate through the DOM, not through shared JS scope.
**Warning signs:** Console errors about undefined variables.

## Code Examples

### Complete publications.js
```javascript
// publications.js -- Publication data + DOM render
// Self-contained: writes to #pub-list, no exports needed
(function() {
    const P = [
        [2026,"JAMA Netw Open","Tropical Cyclone Exposure...",41719042],
        // ... 51 entries total (copy from current index.html lines 458-509)
    ];

    function renderPubs() {
        const el = document.getElementById('pub-list');
        if (!el) return;
        let yr = 0, h = '';
        P.forEach(([y, j, t, p]) => {
            if (y !== yr) { yr = y; h += '<div class="pub-year">' + y + '</div>'; }
            h += '<a href="https://pubmed.ncbi.nlm.nih.gov/' + p + '/" target="_blank" rel="noopener" class="pub-item">'
               + '<span class="pub-title">' + t + '</span>'
               + '<span class="pub-journal">' + j + '</span></a>';
        });
        el.innerHTML = h;
    }

    renderPubs();
})();
```

### DOM-Driven Tab Init (for app.js)
```javascript
// Tab discovery -- reads from DOM, no hardcoded list
const tabs = document.querySelectorAll('.nav-bar [role="tab"]');
const ids = Array.from(tabs).map(t => t.dataset.page);
const pages = new Map(ids.map(id => [id, document.getElementById(id)]));
let cur = ids[0];
let busy = false;
```

### Updated goTo() with ARIA
```javascript
function goTo(targetId, dir) {
    if (targetId === cur || !pages.has(targetId) || busy) return;
    busy = true;
    const curIdx = ids.indexOf(cur);
    const targetIdx = ids.indexOf(targetId);
    dir = dir ?? (targetIdx > curIdx ? 1 : -1);

    const f = pages.get(cur);
    const t = pages.get(targetId);

    // Update tab states (visual + ARIA)
    tabs.forEach(b => {
        const isActive = b.dataset.page === targetId;
        b.classList.toggle('active', isActive);
        b.setAttribute('aria-selected', String(isActive));
        b.setAttribute('tabindex', isActive ? '0' : '-1');
    });

    // GSAP transition (unchanged logic)
    t.querySelectorAll('.si').forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(18px)';
    });

    if (typeof gsap !== 'undefined') {
        gsap.to(f, {
            opacity: 0, x: -36 * dir, duration: 0.22, ease: 'power2.in',
            onComplete() {
                f.classList.remove('active');
                f.style.zIndex = '';
                gsap.set(f, { x: 0 });
                t.classList.add('active');
                t.scrollTop = 0;
                gsap.fromTo(t, { opacity: 0, x: 36 * dir }, {
                    opacity: 1, x: 0, duration: 0.28, ease: 'power2.out',
                    onComplete() {
                        busy = false;
                        reveal(targetId);
                        // Focus management (D-11)
                        t.focus({ preventScroll: true });
                    }
                });
            }
        });
    } else {
        f.classList.remove('active');
        t.classList.add('active');
        t.scrollTop = 0;
        t.querySelectorAll('.si').forEach(el => {
            el.style.opacity = '1';
            el.style.transform = 'none';
        });
        busy = false;
        t.focus({ preventScroll: true });
    }

    cur = targetId;
    history.replaceState(null, null, '#' + targetId);
}
```

### Updated Test (structure.spec.js)
```javascript
test('nav tab data-page values match section IDs', async ({ page }) => {
    const tabs = page.locator('.tab');
    const sections = page.locator('.page');
    const count = await tabs.count();
    for (let i = 0; i < count; i++) {
        const dataPage = await tabs.nth(i).getAttribute('data-page');
        const sectionId = await sections.nth(i).getAttribute('id');
        expect(dataPage).toBe(sectionId);
    }
});
```

## Test Impact Analysis

### Tests That Must Be Updated

| Test File | Test Name | Why | Change Required |
|-----------|-----------|-----|-----------------|
| `structure.spec.js` | "nav tab data-page indices match section order" | Asserts `Number(dataPage) === i`, but `data-page` changes from numeric to string IDs | Rewrite to assert `dataPage === sectionId` instead |

### Tests That Pass Without Changes (34 of 35)

All other tests use `.nth(i).click()` to interact with tabs (position-based, not value-based) and check for CSS classes (`/active/`), element visibility, and DOM content. None depend on the `data-page` attribute value being numeric. The file split itself is invisible to tests because:

1. `playwright.config.js` uses `npx serve . -l 3000 -s` which serves static files from the project root, including `css/` and `js/` subdirectories automatically
2. Tests interact with the rendered DOM, not the source HTML structure
3. CSS classes, element IDs, and DOM relationships remain identical after the split

### Specific Test Verification

| Test File | Tests | Concern | Status |
|-----------|-------|---------|--------|
| `navigation.spec.js` (7) | Tab clicks, keyboard nav, hash routing, resume toggle | Uses `.nth()` clicks, checks `#id` classes | SAFE -- no dependency on data-page values |
| `structure.spec.js` (5) | Tab count, labels, data-page, home active, no errors | One test checks data-page numerically | 1 TEST NEEDS UPDATE |
| `layout.spec.js` (9) | Overflow, nav height, icons, max-width, CSS vars | Pure layout/visual checks | SAFE |
| `images-embeds.spec.js` (7) | Alt attrs, image loading, embeds | Image/embed checks only | SAFE |
| `gift-reveal.spec.js` (7) | Reveal button, panel, video, card | Gift interaction only | SAFE |

## HTMLHint Compatibility

The `.htmlhintrc` rules are all compatible with the changes:
- `doctype-first`: Unaffected (doctype stays in index.html)
- `tag-pair`: Unaffected (no new tags)
- `attr-lowercase`: ARIA attributes are lowercase (`aria-selected`, `role`)
- `attr-value-double-quotes`: All new attributes use double quotes
- `id-unique`: New `id="tab-home"` etc. IDs are unique -- verify no collision with existing IDs
- `src-not-empty`: `<link href="css/style.css">` and `<script src="...">` are non-empty
- `alt-require`: No new images

**Note:** HTMLHint validates `index.html` only (the CI command is `npx htmlhint@latest index.html`). The split CSS/JS files are not validated by HTMLHint.

## CI Pipeline Impact

The `validate.yml` workflow runs:
1. `npx htmlhint@latest index.html` -- validates the HTML shell (works fine after split)
2. `lychee index.html` -- checks links in HTML (CSS/JS file references are not links, so unaffected)
3. `npx playwright test --project=mobile` -- runs all 35 tests against `serve .` (CSS/JS served automatically)

No CI changes needed.

## Script Loading Strategy

| Script | Attribute | Behavior | Why |
|--------|-----------|----------|-----|
| GSAP CDN | none (default) | Blocks parsing, executes immediately | Must be available before local scripts |
| `js/publications.js` | `defer` | Executes after HTML parsed, in document order | Needs DOM (`#pub-list`) to exist; must run before app.js |
| `js/app.js` | `defer` | Executes after HTML parsed, after publications.js | Needs DOM + GSAP + rendered publications |

**Why not `type="module"`:** ES modules would work but add unnecessary complexity for a no-build static site. Modules are strict mode, have different scoping, and require CORS headers for local development. `defer` achieves the same ordered execution with zero friction.

## Project Constraints (from CLAUDE.md)

- **Static only**: No server, no build step -- must remain deployable as raw HTML on GitHub Pages
- **No bundler**: Raw files served directly. `css/style.css` and `js/*.js` are served as-is.
- **CDN dependencies**: GSAP from jsDelivr stays as external `<script>` tag
- **Solo developer**: Justin is the only contributor

## Open Questions

1. **Noscript fallback (Claude's discretion)**
   - What we know: The site is JS-heavy (tab navigation, GSAP animations, gift reveal all require JS). Without JS, only the home tab is visible (it has `class="active"` in HTML).
   - Recommendation: Add a minimal `<noscript>` tag in the head that removes `overflow: hidden` so all content is scrollable as a single page. Low effort, graceful degradation.

2. **CSS custom property organization (Claude's discretion)**
   - What we know: Current `:root` block has 13 well-named variables. CSS is organized into 11 commented sections.
   - Recommendation: Keep the existing organization verbatim during extraction. It's already well-structured. Changing it during the split adds unnecessary diff noise and risk.

## Sources

### Primary (HIGH confidence)
- W3C WAI-ARIA Authoring Practices Guide -- Tabs Pattern (https://www.w3.org/WAI/ARIA/apg/patterns/tabs/) -- ARIA roles, attributes, keyboard behavior
- The Open Graph Protocol (https://ogp.me/) -- Required/optional OG properties, image structured properties
- Direct source analysis of `index.html` (652 lines) -- line-by-line structure mapping
- Direct analysis of all 5 test files (35 tests) -- impact assessment

### Secondary (MEDIUM confidence)
- MDN `defer` attribute documentation (from training data, well-established spec) -- Script loading order behavior
- Twitter/X card documentation (from training data) -- `twitter:card` = `summary_large_image` for large previews

## Metadata

**Confidence breakdown:**
- File split mechanics: HIGH -- direct source code analysis, line-by-line mapping
- Tab system modernization: HIGH -- current code fully understood, replacement pattern is standard DOM querying
- ARIA tabs: HIGH -- sourced from W3C WAI-ARIA APG official spec
- OG tags: HIGH -- sourced from ogp.me official spec
- Test impact: HIGH -- all 35 tests read and analyzed for dependencies on changing attributes
- Script loading order: HIGH -- `defer` behavior is well-specified in HTML5

**Research date:** 2026-03-28
**Valid until:** 2026-04-28 (stable domain, no fast-moving dependencies)
