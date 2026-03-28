---
phase: 02-file-architecture-quick-wins
plan: b
type: execute
wave: 2
depends_on: [02-a]
files_modified:
  - index.html
  - js/app.js
autonomous: true
requirements: [META-01, META-02]

must_haves:
  truths:
    - "Sharing annielovessnakes.com in iMessage/Slack renders a preview card with image, title, and description"
    - "Screen readers announce the correct active tab"
    - "Tab buttons have role=tab, nav has role=tablist, sections have role=tabpanel"
    - "aria-selected and tabindex update dynamically when switching tabs"
    - "Focus moves to active panel after tab switch for screen reader users"
  artifacts:
    - path: "index.html"
      provides: "OG meta tags in head, ARIA attributes on nav/tabs/sections"
      contains: "og:image"
    - path: "js/app.js"
      provides: "ARIA state sync in goTo(), focus management"
      contains: "aria-selected"
  key_links:
    - from: "index.html og:image"
      to: "images/hero-dance.jpg"
      via: "absolute URL meta tag"
      pattern: "https://annielovessnakes.com/images/hero-dance.jpg"
    - from: "js/app.js goTo()"
      to: "tab aria-selected"
      via: "setAttribute in tab loop"
      pattern: "setAttribute.*aria-selected"
    - from: "js/app.js goTo()"
      to: "panel focus"
      via: "focus({ preventScroll: true })"
      pattern: "focus.*preventScroll"
---

<objective>
Add OG meta tags for social sharing previews and ARIA tab pattern attributes for accessibility.

Purpose: When Annie or anyone shares the link in iMessage/Slack, it shows a rich preview card. Screen readers properly announce the tab interface. These are low-effort, high-value improvements per D-08 through D-12.
Output: Updated index.html with OG tags and ARIA attributes, updated js/app.js with ARIA state sync and focus management.
</objective>

<execution_context>
@$HOME/.claude/get-shit-done/workflows/execute-plan.md
@$HOME/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/PROJECT.md
@.planning/ROADMAP.md
@.planning/phases/02-file-architecture-quick-wins/02-CONTEXT.md
@.planning/phases/02-file-architecture-quick-wins/02-RESEARCH.md
@.planning/phases/02-file-architecture-quick-wins/02-a-SUMMARY.md
@index.html
@js/app.js
</context>

<interfaces>
<!-- From Plan A outputs -- executor needs these to know the current state of files -->

index.html head currently has (after Plan A):
```html
<meta property="og:title" content="Annie's Birthdart Bash">
<meta property="og:description" content="A birthday weekend celebration">
```

index.html nav currently has (after Plan A):
```html
<nav class="nav-bar">
    <button class="tab active" data-page="home">...</button>
    <button class="tab" data-page="weekend">...</button>
    <button class="tab" data-page="menu">...</button>
    <button class="tab" data-page="pubs">...</button>
    <button class="tab" data-page="gift">...</button>
</nav>
```

index.html sections currently have (after Plan A):
```html
<section class="page active" id="home">...</section>
<section class="page" id="weekend">...</section>
```

js/app.js goTo() currently has:
```javascript
tabs.forEach(b => b.classList.toggle('active', b.dataset.page === targetId));
```

js/app.js tab discovery:
```javascript
const tabs = document.querySelectorAll('.nav-bar .tab');
const ids = Array.from(tabs).map(t => t.dataset.page);
```
</interfaces>

<tasks>

<task type="auto">
  <name>Task 1: Add OG meta tags and ARIA attributes to index.html</name>
  <files>index.html</files>
  <action>
**OG Meta Tags (per D-08, D-09):**

In the `<head>`, after the existing `og:description` meta tag (line ~12 after Plan A), add the missing OG tags. The existing `og:title` and `og:description` stay. Add:

```html
<meta property="og:type" content="website">
<meta property="og:url" content="https://annielovessnakes.com">
<meta property="og:image" content="https://annielovessnakes.com/images/hero-dance.jpg">
<meta property="og:image:width" content="800">
<meta property="og:image:height" content="535">
<meta property="og:image:alt" content="Annie on the dance floor">
<meta name="twitter:card" content="summary_large_image">
```

CRITICAL: og:image MUST be an absolute URL (`https://annielovessnakes.com/...`), not relative. Social crawlers fetch from their servers and have no domain context for relative paths.

Do NOT add `twitter:title` or `twitter:description` -- Twitter/X falls back to OG tags for those.

**ARIA Tablist on nav (per D-10):**

Update the `<nav>` element:
```html
<nav class="nav-bar" role="tablist" aria-label="Site sections">
```

**ARIA Tab roles on buttons (per D-10):**

Each tab button gets `role="tab"`, `id="tab-{id}"`, `aria-selected`, `aria-controls`, and `tabindex`. The active tab (home) gets `aria-selected="true"` and `tabindex="0"`. All others get `aria-selected="false"` and `tabindex="-1"`.

```html
<button class="tab active" data-page="home" role="tab" id="tab-home" aria-selected="true" aria-controls="home" tabindex="0"><span class="tab-icon" aria-hidden="true">&#x1F40D;</span><span class="tab-label">Home</span></button>
<button class="tab" data-page="weekend" role="tab" id="tab-weekend" aria-selected="false" aria-controls="weekend" tabindex="-1"><span class="tab-icon" aria-hidden="true">&#x1F37E;</span><span class="tab-label">Weekend</span></button>
<button class="tab" data-page="menu" role="tab" id="tab-menu" aria-selected="false" aria-controls="menu" tabindex="-1"><span class="tab-icon" aria-hidden="true">&#x1F373;</span><span class="tab-label">Menu</span></button>
<button class="tab" data-page="pubs" role="tab" id="tab-pubs" aria-selected="false" aria-controls="pubs" tabindex="-1"><span class="tab-icon" aria-hidden="true">&#x1F4DA;</span><span class="tab-label">R&eacute;sum&eacute;</span></button>
<button class="tab" data-page="gift" role="tab" id="tab-gift" aria-selected="false" aria-controls="gift" tabindex="-1"><span class="tab-icon" aria-hidden="true">&#x1F381;</span><span class="tab-label">Gift</span></button>
```

Note: `aria-hidden="true"` on the `.tab-icon` spans so screen readers skip the emoji and read only the label text.

**ARIA Tabpanel roles on sections (per D-10):**

Each section gets `role="tabpanel"`, `aria-labelledby="tab-{id}"`, and `tabindex="0"` (makes panels focusable for D-11 focus management):

```html
<section class="page active" id="home" role="tabpanel" aria-labelledby="tab-home" tabindex="0">
<section class="page" id="weekend" role="tabpanel" aria-labelledby="tab-weekend" tabindex="0">
<section class="page" id="menu" role="tabpanel" aria-labelledby="tab-menu" tabindex="0">
<section class="page" id="pubs" role="tabpanel" aria-labelledby="tab-pubs" tabindex="0">
<section class="page" id="gift" role="tabpanel" aria-labelledby="tab-gift" tabindex="0">
```

**Main landmark (D-12):**
The `<main class="app">` already exists (line 251 of original). Confirm it's still there after Plan A. No change needed.
  </action>
  <verify>
    <automated>cd /home/justin/projects/annie-birthdart && npx htmlhint@latest index.html && grep -c 'og:image' index.html && grep -c 'role="tab"' index.html && grep -c 'role="tabpanel"' index.html && grep -c 'role="tablist"' index.html</automated>
  </verify>
  <done>HTMLHint passes. index.html has og:image meta tag with absolute URL. 5 elements have role="tab". 5 elements have role="tabpanel". 1 element has role="tablist". All ARIA IDs are unique and cross-referenced correctly (aria-controls matches section id, aria-labelledby matches tab id).</done>
</task>

<task type="auto">
  <name>Task 2: Add ARIA state sync and focus management to app.js</name>
  <files>js/app.js</files>
  <action>
**Update goTo() tab state loop (per D-10, D-11):**

In `js/app.js`, find the line inside `goTo()` that toggles the active class on tabs:
```javascript
tabs.forEach(b => b.classList.toggle('active', b.dataset.page === targetId));
```

Replace it with:
```javascript
tabs.forEach(b => {
    const isActive = b.dataset.page === targetId;
    b.classList.toggle('active', isActive);
    b.setAttribute('aria-selected', String(isActive));
    b.setAttribute('tabindex', isActive ? '0' : '-1');
});
```

This syncs `aria-selected` and `tabindex` with the visual `active` class on every tab switch. Active tab gets `tabindex="0"` (in tab order), inactive tabs get `tabindex="-1"` (removed from tab order but programmatically focusable).

**Add focus management to goTo() (per D-11):**

In the GSAP transition's inner `onComplete` callback (after `reveal(targetId)`), add:
```javascript
t.focus({ preventScroll: true });
```

Also add it to the non-GSAP else branch, after `busy = false`:
```javascript
t.focus({ preventScroll: true });
```

This moves focus to the active tabpanel after the transition completes. The `preventScroll: true` avoids jarring scroll jumps since the panel is already in view. The panels are focusable because of `tabindex="0"` added in Task 1.

**Update the window load handler for initial ARIA state:**

In the hash-based initial navigation block (where it sets up the correct tab on page load with a hash), update the tab toggle to also sync ARIA:
```javascript
tabs.forEach(b => {
    const isActive = b.dataset.page === hash;
    b.classList.toggle('active', isActive);
    b.setAttribute('aria-selected', String(isActive));
    b.setAttribute('tabindex', isActive ? '0' : '-1');
});
```

**Do NOT change:**
- Keyboard navigation handlers (ArrowRight/ArrowLeft already call goTo which now updates ARIA)
- Swipe handlers (already call goTo/goByOffset)
- Resume toggle, gift reveal, confetti -- not part of the tablist pattern
  </action>
  <verify>
    <automated>cd /home/justin/projects/annie-birthdart && grep -n "aria-selected" js/app.js && grep -n "focus.*preventScroll" js/app.js && npx playwright test 2>&1 | tail -5</automated>
  </verify>
  <done>js/app.js updates aria-selected and tabindex on every tab switch. Focus moves to active panel after GSAP transition completes. All 35 Playwright tests still pass. No console errors.</done>
</task>

</tasks>

<verification>
1. `npx htmlhint@latest index.html` -- validation passes with new ARIA attributes
2. `npx playwright test` -- all 35 tests still pass
3. `grep "og:image" index.html` -- shows absolute URL to hero-dance.jpg
4. `grep "twitter:card" index.html` -- shows summary_large_image
5. `grep "aria-selected" js/app.js` -- present in goTo() tab loop
6. `grep "focus.*preventScroll" js/app.js` -- present in both GSAP and fallback paths
7. Manual: Open browser DevTools, switch tabs, inspect tab button -- aria-selected toggles correctly
</verification>

<success_criteria>
- OG meta tags present: og:title, og:description, og:type, og:url, og:image (absolute URL), og:image:width, og:image:height, og:image:alt, twitter:card
- Nav has role="tablist", each button has role="tab" + aria-selected + aria-controls + tabindex, each section has role="tabpanel" + aria-labelledby + tabindex="0"
- goTo() syncs aria-selected and tabindex on every tab switch
- Focus moves to active panel after transition
- Tab icons have aria-hidden="true"
- All 35 Playwright tests pass
- HTMLHint validation passes
</success_criteria>

<output>
After completion, create `.planning/phases/02-file-architecture-quick-wins/02-b-SUMMARY.md`
</output>
