---
phase: 02-file-architecture-quick-wins
plan: c
type: execute
wave: 2
depends_on: [02-a]
files_modified:
  - tests/structure.spec.js
  - .surgeignore
autonomous: false
requirements: [ARCH-02, ARCH-03]

must_haves:
  truths:
    - "Test suite validates the new ID-based data-page scheme"
    - "Adding a new tab+section pair causes the test to detect it automatically"
    - "Surge deploys include css/ and js/ directories"
    - "Full test suite passes as final verification of the phase"
  artifacts:
    - path: "tests/structure.spec.js"
      provides: "Updated test for ID-based data-page values + new extensibility test"
      contains: "data-page values match section IDs"
    - path: ".surgeignore"
      provides: "Deploy ignore list (unchanged but verified)"
  key_links:
    - from: "tests/structure.spec.js"
      to: "index.html nav buttons"
      via: "Playwright locator .tab getAttribute data-page"
      pattern: "getAttribute.*data-page"
    - from: "tests/structure.spec.js"
      to: "index.html sections"
      via: "Playwright locator .page getAttribute id"
      pattern: "getAttribute.*id"
---

<objective>
Update the test suite for the new tab scheme, add an extensibility test proving ARCH-03, verify deploy config, and run final end-to-end validation of the entire phase.

Purpose: Close the loop on the file split and tab modernization. The updated tests serve as a regression guard for future phases (gallery tab, reveals) and prove that the tab system is truly extensible.
Output: Updated tests, verified deploy config, clean test run confirming all Phase 2 work.
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
@tests/structure.spec.js
@tests/navigation.spec.js
@.surgeignore
</context>

<interfaces>
<!-- From Plan A -- the test needs to validate against this structure -->

index.html nav (after Plan A):
```html
<nav class="nav-bar" ...>
    <button class="tab active" data-page="home" ...>
    <button class="tab" data-page="weekend" ...>
    <button class="tab" data-page="menu" ...>
    <button class="tab" data-page="pubs" ...>
    <button class="tab" data-page="gift" ...>
</nav>
```

index.html sections (after Plan A):
```html
<section class="page active" id="home" ...>
<section class="page" id="weekend" ...>
<section class="page" id="menu" ...>
<section class="page" id="pubs" ...>
<section class="page" id="gift" ...>
```

js/app.js tab discovery (after Plan A):
```javascript
const tabs = document.querySelectorAll('.nav-bar .tab');
const ids = Array.from(tabs).map(t => t.dataset.page);
```
</interfaces>

<tasks>

<task type="auto">
  <name>Task 1: Update structure tests and add extensibility test</name>
  <files>tests/structure.spec.js</files>
  <action>
**NOTE:** Plan A (Task 3) already updates the data-page test as part of its "fix any failures" step. However, if Plan A only did the minimal fix, this task ensures the test is robust and adds the extensibility test.

**Verify and update the data-page test** (currently lines 25-31):

If Plan A already updated this test to use string ID matching, verify it looks correct. If it still has the numeric assertion, replace it. The final version should be:

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

**Add a new extensibility test** (per ARCH-03) that proves the tab system requires no JS changes to add a tab. Append this test inside the existing `test.describe('Page structure')` block:

```javascript
test('tab count matches section count (extensibility check)', async ({ page }) => {
    const tabCount = await page.locator('.tab').count();
    const sectionCount = await page.locator('.page').count();
    expect(tabCount).toBe(sectionCount);
    expect(tabCount).toBeGreaterThanOrEqual(5);
});
```

This test will automatically validate any new tabs added in future phases (Phase 3 gallery tab) by confirming the tab-to-section count stays in sync. The `>= 5` guard ensures we don't accidentally remove tabs.

**Add ARIA structure test** to validate the accessibility attributes from Plan B persist. Append inside the same describe block:

```javascript
test('ARIA tab attributes are correctly wired', async ({ page }) => {
    const nav = page.locator('.nav-bar');
    await expect(nav).toHaveAttribute('role', 'tablist');

    const tabs = page.locator('.tab');
    const count = await tabs.count();
    for (let i = 0; i < count; i++) {
      const tab = tabs.nth(i);
      await expect(tab).toHaveAttribute('role', 'tab');
      const dataPage = await tab.getAttribute('data-page');
      await expect(tab).toHaveAttribute('id', 'tab-' + dataPage);
      await expect(tab).toHaveAttribute('aria-controls', dataPage);
    }

    const sections = page.locator('.page');
    const sectionCount = await sections.count();
    for (let i = 0; i < sectionCount; i++) {
      const section = sections.nth(i);
      await expect(section).toHaveAttribute('role', 'tabpanel');
      const id = await section.getAttribute('id');
      await expect(section).toHaveAttribute('aria-labelledby', 'tab-' + id);
    }
});
```
  </action>
  <verify>
    <automated>cd /home/justin/projects/annie-birthdart && npx playwright test tests/structure.spec.js 2>&1 | tail -10</automated>
  </verify>
  <done>structure.spec.js has updated data-page test (string IDs), extensibility test (tab/section count match), and ARIA wiring test. All structure tests pass.</done>
</task>

<task type="checkpoint:human-verify" gate="blocking">
  <what-built>
Phase 2 complete: monolithic index.html split into css/style.css + js/publications.js + js/app.js + HTML shell. Tab system is DOM-driven (ID-based). OG meta tags added for social sharing. ARIA tab pattern implemented with focus management. Tests updated and passing.
  </what-built>
  <how-to-verify>
1. Open the site locally: `cd /home/justin/projects/annie-birthdart && npx serve . -l 3000` then visit http://localhost:3000
2. **Tab navigation:** Click through all 5 tabs -- transitions should look identical to before
3. **Keyboard nav:** Press ArrowRight/ArrowLeft -- tabs switch correctly
4. **Hash routing:** Visit http://localhost:3000/#gift -- should land on Gift tab
5. **Swipe:** On mobile or using DevTools device emulation, swipe left/right
6. **Resume toggle:** On Resume tab, toggle between Dr. Nigra and College Annie
7. **Gift reveal:** Click "Unwrap It" -- video, expo card, confetti all work
8. **Publications:** Resume tab shows all 51 publications grouped by year
9. **Social preview:** Paste https://annielovessnakes.com into https://www.opengraph.xyz/ to verify OG tags render correctly (will work after deploy to main)
10. **View source:** Confirm index.html has no inline `<style>` or `<script>` blocks
11. **File structure:** Confirm css/style.css, js/publications.js, js/app.js exist

Run full test suite: `npx playwright test` -- all tests pass (should be 37+ now with new tests).
  </how-to-verify>
  <resume-signal>Type "approved" or describe any issues</resume-signal>
</task>

</tasks>

<verification>
1. `npx playwright test` -- all tests pass (35 original - 1 updated + 2 new = 37+ total)
2. `npx htmlhint@latest index.html` -- validation passes
3. `cat .surgeignore` -- does NOT list css/ or js/ (so they deploy)
4. File structure: `ls css/style.css js/publications.js js/app.js` -- all exist
5. `wc -l index.html` -- roughly 220 lines (was 652)
6. Human verification of visual/functional parity
</verification>

<success_criteria>
- Updated data-page test validates string IDs (not numeric indices)
- Extensibility test proves tab/section count stays in sync
- ARIA test validates role, id, aria-controls, aria-labelledby wiring
- All Playwright tests pass (37+)
- Human confirms: site looks and works identically to before the split
- Human confirms: all tabs, keyboard nav, hash routing, swipe, resume toggle, gift reveal work
</success_criteria>

<output>
After completion, create `.planning/phases/02-file-architecture-quick-wins/02-c-SUMMARY.md`
</output>
