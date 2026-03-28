# Annie Loves Snakes

## What This Is

A personal celebration website for Annie (annielovessnakes.com) that started as a birthday event site and is evolving into an ongoing memories/celebration platform. Built as a single-page static HTML app with tab-based navigation, deployed via GitHub Pages. Justin pushes updates — new sections, interactive features, surprise reveals — while Annie travels and experiences them live.

## Core Value

Annie can always visit annielovessnakes.com and find something new, personal, and delightful waiting for her.

## Requirements

### Validated

- ✓ Birthday event SPA with 6 themed sections (home, weekend, menu, vibes, résumé, gift) — existing
- ✓ Tab-based navigation with swipe gestures and GSAP animations — existing
- ✓ Custom domain (annielovessnakes.com) via GitHub Pages — existing
- ✓ Mobile-first responsive design with dark country-psychedelic theme — existing
- ✓ Publications page with 51 real PubMed publications + classy/trashy toggle — existing

### Active

- [ ] CI/CD pipeline: dev → staging → main branch flow with automated validation
- [ ] Staging preview deployment (shareable URL for feedback before going live)
- [ ] Automated quality checks (HTML validation, Lighthouse, link checking) on every push
- [ ] Photo gallery section — curated photos from birthday weekend and beyond
- [ ] Timed reveal system — surprises that unlock on specific dates or triggers
- [ ] New content sections/tabs — expandable beyond the original 6

### Out of Scope

- Backend/server-side code — static site only, no databases
- User accounts or authentication — this is a personal site, not a platform
- Photo upload by visitors — Justin curates all content
- E-commerce or payments — purely personal

## Context

- **Tech**: Single `index.html` (551 lines) with inline CSS/JS, GSAP from CDN, Google Fonts
- **Deploy**: GitHub Pages from `main` branch, CNAME → annielovessnakes.com
- **Branches**: `main` (production), `staging` (preview), `dev` (active work) — created 2026-03-28
- **CI/CD**: GitHub Actions workflows written (validate.yml, deploy-preview.yml), not yet committed
- **Staging preview**: Surge.sh at annie-birthdart-staging.surge.sh (token setup pending)
- **Annie**: Dr. Anne E. Nigra — epidemiologist, Dartmouth alumna, mama of 2, snake lover
- **Tone**: Country-psychedelic, personal, playful — the site should feel like a love letter
- **Photos**: Google Photos album at https://photos.app.goo.gl/zSRtoVcQJAJL4pMx5 — source for photo gallery feature
- **Contributors**: Amelia and Rosie are coordinating on content (groceries, schedule, gifts). Amelia provided content edits.

## Constraints

- **Static only**: No server, no build step — must remain deployable as raw HTML on GitHub Pages
- **Single HTML file**: Current architecture is one index.html. May split into multiple files as features grow, but no bundler.
- **CDN dependencies**: GSAP, Google Fonts. No npm/node for the site itself.
- **Solo developer**: Justin is the only contributor — branch protection is for workflow discipline, not gatekeeping.

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Surge.sh for staging previews | Zero config, free, stable URL — simpler than Netlify/Vercel for a static file | — Pending |
| dev → staging → main branch flow | Gives safe iteration space + preview URL before production | — Pending |
| GitHub Actions for CI | Already on GitHub, free tier sufficient, no additional services needed | — Pending |
| Keep as static HTML (no framework) | Site is small, personal, doesn't need React/Vue overhead | ✓ Good |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd:transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd:complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-03-28 after initialization*
