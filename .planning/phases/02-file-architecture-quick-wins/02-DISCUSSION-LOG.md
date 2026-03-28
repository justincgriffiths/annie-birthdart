# Phase 2: File Architecture + Quick Wins - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-03-28
**Phase:** 02-file-architecture-quick-wins
**Areas discussed:** File split strategy, Tab system modernization, OG image, ARIA
**Mode:** --auto (all decisions auto-selected as recommended defaults)

---

## File Split Strategy

| Option | Description | Selected |
|--------|-------------|----------|
| Single CSS + split JS | css/style.css + js/app.js + js/publications.js | ✓ |
| Per-section files | One CSS/JS file per tab section | |
| CSS modules | Separate CSS files per component | |

**User's choice:** [auto] Single CSS + split JS (recommended — matches ROADMAP success criteria)
**Notes:** Publication data is large (51 entries) and independent — separate file keeps app.js focused.

---

## Tab System Modernization

| Option | Description | Selected |
|--------|-------------|----------|
| DOM-driven tabs | JS reads tab config from HTML structure at init | ✓ |
| Config object | Tabs defined in a JS config array | |
| Keep current | Leave hardcoded ids array | |

**User's choice:** [auto] DOM-driven tabs (recommended — ROADMAP says "no changes to core JS logic" to add tabs)
**Notes:** Key change is replacing `const ids=['home',...]` with DOM querySelectorAll.

---

## OG Image

| Option | Description | Selected |
|--------|-------------|----------|
| hero-dance.jpg | Dance floor shot, landscape 800x535, highest energy | ✓ |
| hiking.jpg | Hiking adventure, landscape 800x600 | |
| Custom OG graphic | Create a branded share card | |

**User's choice:** [auto] hero-dance.jpg (recommended — landscape, web-optimized, celebration energy)

---

## ARIA / Accessibility

| Option | Description | Selected |
|--------|-------------|----------|
| Practical ARIA | tablist/tab/tabpanel roles, aria-selected, focus management | ✓ |
| Minimal | Just landmark roles (main, nav) | |
| Full WCAG AA | Comprehensive audit and remediation | |

**User's choice:** [auto] Practical ARIA (recommended — meaningful improvement without over-engineering)

---

## Claude's Discretion

- CSS custom property organization during split
- Whether to add `<noscript>` fallback
- Minor HTML cleanup (indentation, attribute ordering)
