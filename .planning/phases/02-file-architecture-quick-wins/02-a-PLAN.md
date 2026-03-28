---
phase: 02-file-architecture-quick-wins
plan: a
type: execute
wave: 1
depends_on: []
files_modified:
  - css/style.css
  - js/publications.js
  - js/app.js
  - index.html
autonomous: true
requirements: [ARCH-01, ARCH-02, ARCH-03]

must_haves:
  truths:
    - "CSS lives in css/style.css, not inline in index.html"
    - "Publication data and render logic live in js/publications.js"
    - "Navigation, interaction, animation logic live in js/app.js"
    - "index.html contains only HTML shell with link/script tags"
    - "Tab system reads IDs from DOM -- no hardcoded ids array"
    - "data-page attributes use section IDs, not numeric indices"
    - "Adding a new tab requires only HTML changes, no JS edits"
  artifacts:
    - path: "css/style.css"
      provides: "All CSS extracted from index.html"
      contains: ":root"
    - path: "js/publications.js"
      provides: "Publication data array + renderPubs()"
      contains: "renderPubs"
    - path: "js/app.js"
      provides: "Tab nav, interactions, animations"
      contains: "goTo"
    - path: "index.html"
      provides: "HTML shell with external CSS/JS references"
      contains: "css/style.css"
  key_links:
    - from: "index.html"
      to: "css/style.css"
      via: "link rel=stylesheet"
      pattern: 'href="css/style.css"'
    - from: "index.html"
      to: "js/publications.js"
      via: "script defer"
      pattern: 'src="js/publications.js" defer'
    - from: "index.html"
      to: "js/app.js"
      via: "script defer"
      pattern: 'src="js/app.js" defer'
    - from: "js/app.js"
      to: "DOM nav buttons"
      via: "querySelectorAll + dataset.page"
      pattern: "querySelectorAll.*tab.*dataset\\.page"
    - from: "js/publications.js"
      to: "DOM #pub-list"
      via: "getElementById + innerHTML"
      pattern: "getElementById.*pub-list"
---

<objective>
Split the monolithic index.html (652 lines) into separate CSS, JS, and HTML files and modernize the tab system from index-based to ID-based DOM-driven discovery.

Purpose: Make the codebase maintainable -- CSS in its own file, JS split by concern, tabs extensible without JS changes. This is the structural foundation for all future phases (gallery tab, reveals, etc.).
Output: css/style.css, js/publications.js, js/app.js, and a slim index.html shell.
</objective>

<execution_context>
@$HOME/.claude/get-shit-done/workflows/execute-plan.md
@$HOME/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/PROJECT.md
@.planning/ROADMAP.md
@.planning/STATE.md
@.planning/phases/02-file-architecture-quick-wins/02-CONTEXT.md
@.planning/phases/02-file-architecture-quick-wins/02-RESEARCH.md
@index.html
</context>

<tasks>

<task type="auto">
  <name>Task 1: Extract CSS and split JS into separate files</name>
  <files>css/style.css, js/publications.js, js/app.js</files>
  <action>
Create directories `css/` and `js/` in the project root.

**css/style.css** (per D-01, D-02):
Extract everything between `<style>` and `</style>` (index.html lines 18-236) verbatim into `css/style.css`. Do NOT reorganize, rename, or restructure -- keep the exact CSS as-is, including all comments, custom properties, keyframes, and media queries. The file should contain:
- `:root` block with all 15 custom properties
- All 11 CSS sections (nav, app shell, grain, shared, home, weekend, menu, publications, gift, anim, responsive)
- All `@keyframes` blocks (drawSnake, pulse, btnGlow, wiggle, confettiFall)
- `@media (prefers-reduced-motion: reduce)` block
- Two responsive `@media` blocks (max-width:380px, min-width:768px)

**js/publications.js** (per D-01, D-03):
Create a self-contained IIFE containing:
- The `P` array (51 publication entries, currently lines 458-509)
- The `renderPubs()` function (currently lines 513-522)
- A call to `renderPubs()` at the end of the IIFE

Copy the exact data and logic from index.html. The file communicates with the rest of the app only through the DOM (`getElementById('pub-list').innerHTML`). No exports needed.

Use this structure:
```javascript
// publications.js -- Publication data + DOM render
// Self-contained: writes to #pub-list, no exports needed
(function() {
    /* Publication data: [year, journal, title, pmid] */
    const P = [
        // ... copy all 51 entries exactly from index.html lines 458-509
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

**js/app.js** (per D-01, D-05, D-06):
Create an IIFE containing ALL remaining JS logic from index.html (lines 525-648), but with the tab system modernized:

1. **DOM-driven tab discovery** (replaces hardcoded `const ids=['home','weekend','menu','pubs','gift']`):
```javascript
const tabs = document.querySelectorAll('.nav-bar .tab');
const ids = Array.from(tabs).map(t => t.dataset.page);
const pages = new Map(ids.map(id => [id, document.getElementById(id)]));
let cur = ids[0];
let busy = false;
```

2. **Rewrite goTo() to use string IDs** instead of numeric indices:
```javascript
function goTo(targetId, dir) {
    if (targetId === cur || !pages.has(targetId) || busy) return;
    busy = true;
    const curIdx = ids.indexOf(cur);
    const targetIdx = ids.indexOf(targetId);
    dir = dir ?? (targetIdx > curIdx ? 1 : -1);

    const f = pages.get(cur);
    const t = pages.get(targetId);

    tabs.forEach(b => b.classList.toggle('active', b.dataset.page === targetId));
    t.querySelectorAll('.si').forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(18px)';
    });

    if (typeof gsap !== 'undefined') {
        gsap.to(f, {
            opacity: 0, x: -36 * dir, duration: 0.22, ease: 'power2.in',
            onComplete() {
                f.classList.remove('active'); f.style.zIndex = ''; gsap.set(f, { x: 0 });
                t.classList.add('active'); t.scrollTop = 0;
                gsap.fromTo(t, { opacity: 0, x: 36 * dir }, {
                    opacity: 1, x: 0, duration: 0.28, ease: 'power2.out',
                    onComplete() { busy = false; reveal(targetId); }
                });
            }
        });
    } else {
        f.classList.remove('active'); t.classList.add('active'); t.scrollTop = 0;
        t.querySelectorAll('.si').forEach(el => { el.style.opacity = '1'; el.style.transform = 'none'; });
        busy = false;
    }

    cur = targetId;
    history.replaceState(null, null, '#' + targetId);
}
```

3. **Update all callers to use string IDs:**
   - Tab click: `tabs.forEach(t => t.addEventListener('click', () => goTo(t.dataset.page)));`
   - Swipe: Add helper `function goByOffset(offset, dir) { const i = ids.indexOf(cur); const n = i + offset; if (n >= 0 && n < ids.length) goTo(ids[n], dir); }` -- use `goByOffset(dx < 0 ? 1 : -1, dx < 0 ? 1 : -1)` in touchend handler
   - Keyboard: Use `goByOffset(1, 1)` for ArrowRight, `goByOffset(-1, -1)` for ArrowLeft
   - Hash load/change: `const startId = hash; if (ids.includes(startId)) goTo(startId);`
   - hashchange: `const hash = location.hash.replace('#',''); if (ids.includes(hash)) goTo(hash);`

4. **Keep everything else unchanged:** reveal(), resume toggle, gift reveal + confetti, touchstart/touchend handlers. Copy the logic exactly, just update any references from numeric cur to string cur.

5. **The `reveal()` function stays the same** -- it already takes a string ID.

6. **The window load handler** needs updating: instead of `const startIdx = ids.indexOf(hash); if(startIdx > 0)`, do `if (ids.includes(hash) && hash !== ids[0])` and use `goTo(hash)` pattern but with direct DOM manipulation for the initial state (since goTo checks `targetId === cur`). Keep the same approach as current code: remove 'active' from home, add to target, set cur, call reveal.

The window load handler should look like:
```javascript
window.addEventListener('load', () => {
    document.querySelector('.snake-body')?.classList.add('drawn');
    const hash = location.hash.replace('#', '');
    if (hash && ids.includes(hash) && hash !== ids[0]) {
        pages.get(ids[0]).classList.remove('active');
        tabs.forEach(b => b.classList.toggle('active', b.dataset.page === hash));
        const t = pages.get(hash);
        t.classList.add('active'); t.scrollTop = 0;
        cur = hash;
        reveal(hash);
    } else { reveal(ids[0]); }
});
```
  </action>
  <verify>
    <automated>ls -la css/style.css js/publications.js js/app.js && wc -l css/style.css js/publications.js js/app.js</automated>
  </verify>
  <done>Three files exist: css/style.css (~220 lines), js/publications.js (~60 lines), js/app.js (~130 lines). CSS is verbatim from index.html. Publications data is complete (51 entries). App.js uses DOM-driven tab discovery with string IDs.</done>
</task>

<task type="auto">
  <name>Task 2: Reduce index.html to HTML shell with external references</name>
  <files>index.html</files>
  <action>
Modify index.html (per D-02, D-04, D-05):

1. **Replace the entire `<style>...</style>` block** (lines 17-237) with a single link tag. Place it after the Google Fonts link (line 16):
```html
<link rel="stylesheet" href="css/style.css">
```

2. **Update nav button data-page attributes** from numeric to ID-based (per D-05):
```html
<button class="tab active" data-page="home"><span class="tab-icon">&#x1F40D;</span><span class="tab-label">Home</span></button>
<button class="tab" data-page="weekend"><span class="tab-icon">&#x1F37E;</span><span class="tab-label">Weekend</span></button>
<button class="tab" data-page="menu"><span class="tab-icon">&#x1F373;</span><span class="tab-label">Menu</span></button>
<button class="tab" data-page="pubs"><span class="tab-icon">&#x1F4DA;</span><span class="tab-label">R&eacute;sum&eacute;</span></button>
<button class="tab" data-page="gift"><span class="tab-icon">&#x1F381;</span><span class="tab-label">Gift</span></button>
```

3. **Replace the entire `<script>` block** (lines 455-650, everything from `<script>` after GSAP to `</script>`) with external script references:
```html
<script src="https://cdn.jsdelivr.net/npm/gsap@3.12.7/dist/gsap.min.js"></script>
<script src="js/publications.js" defer></script>
<script src="js/app.js" defer></script>
```

The GSAP CDN script stays without `defer` (must load first). Both local scripts use `defer` so they execute in document order after HTML parsing. This guarantees: GSAP available -> publications.js renders pub list -> app.js initializes navigation.

4. **Leave everything else in index.html unchanged:** DOCTYPE, head meta tags, Google Fonts preconnect, favicon, grain overlay, all section HTML, main wrapper. The HTML body should remain exactly as-is except for the data-page attribute changes.

The resulting index.html should be roughly 220 lines (was 652).
  </action>
  <verify>
    <automated>cd /home/justin/projects/annie-birthdart && npx htmlhint@latest index.html && wc -l index.html</automated>
  </verify>
  <done>index.html contains no inline CSS or JS. Has `<link rel="stylesheet" href="css/style.css">`, `<script src="js/publications.js" defer>`, `<script src="js/app.js" defer>`. All data-page attributes use string IDs ("home", "weekend", "menu", "pubs", "gift"). HTMLHint passes. File is ~220 lines.</done>
</task>

<task type="auto">
  <name>Task 3: Run full test suite and fix any failures</name>
  <files>tests/structure.spec.js</files>
  <action>
Run the full Playwright test suite to verify the split didn't break anything:
```bash
cd /home/justin/projects/annie-birthdart && npx playwright test
```

**Expected:** 1 test will fail -- `structure.spec.js` line 25-31 "nav tab data-page indices match section order" which asserts `Number(dataPage) === i`. Since data-page is now a string ID, `Number("home")` is NaN.

**Fix:** Update the test in `tests/structure.spec.js` (lines 25-31) to verify that each tab's `data-page` value matches the corresponding section's `id` attribute:

Replace:
```javascript
test('nav tab data-page indices match section order', async ({ page }) => {
    const tabs = page.locator('.tab');
    const count = await tabs.count();
    for (let i = 0; i < count; i++) {
      const dataPage = await tabs.nth(i).getAttribute('data-page');
      expect(Number(dataPage)).toBe(i);
    }
});
```

With:
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

After fixing, re-run the full suite to confirm all 35 tests pass.

If any OTHER tests fail (unexpected), debug by checking:
- CSS file loads (no 404 in console)
- Script execution order (publications.js before app.js)
- Tab click handlers work (goTo uses string IDs consistently)
- Hash routing works (hash values match section IDs)
  </action>
  <verify>
    <automated>cd /home/justin/projects/annie-birthdart && npx playwright test 2>&1 | tail -5</automated>
  </verify>
  <done>All 35 Playwright tests pass. The updated structure test verifies data-page string values match section IDs. No console errors on load.</done>
</task>

</tasks>

<verification>
1. `npx htmlhint@latest index.html` -- HTML validation passes
2. `npx playwright test` -- all 35 tests pass (including updated structure test)
3. `wc -l index.html css/style.css js/publications.js js/app.js` -- index.html ~220 lines, CSS ~220 lines, publications ~60 lines, app ~130 lines
4. `grep -c "style>" index.html` returns 0 (no inline style blocks)
5. `grep -c "<script>" index.html` returns 0 (no inline script blocks, only script src tags)
6. `grep "data-page" index.html` shows string IDs, not numbers
7. No hardcoded `ids` array in js/app.js -- tab discovery is DOM-driven
</verification>

<success_criteria>
- CSS lives in css/style.css -- index.html has zero inline styles
- JS split: js/publications.js has data + render, js/app.js has everything else
- index.html is an HTML shell (~220 lines, was 652)
- data-page attributes use string IDs matching section IDs
- Tab system discovers tabs from DOM at init -- no hardcoded array
- All 35 Playwright tests pass (1 test updated for new data-page scheme)
- HTMLHint validation passes
- No console errors on page load
</success_criteria>

<output>
After completion, create `.planning/phases/02-file-architecture-quick-wins/02-a-SUMMARY.md`
</output>
