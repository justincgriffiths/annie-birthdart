# Requirements: Annie Loves Snakes

**Defined:** 2026-03-28
**Core Value:** Annie can always visit annielovessnakes.com and find something new, personal, and delightful waiting for her.

## v1 Requirements

### CI/CD Pipeline

- [ ] **CICD-01**: Push to `dev` or `staging` triggers HTML validation (HTMLHint)
- [ ] **CICD-02**: Push to `dev` or `staging` triggers Lighthouse CI against local files (not production)
- [ ] **CICD-03**: Push to `dev` or `staging` triggers link checking (lychee)
- [ ] **CICD-04**: Push to `staging` deploys preview to Surge.sh at stable URL
- [ ] **CICD-05**: `.surgeignore` excludes `.git/`, `.github/`, `.planning/`, `.claude/` from preview deploy
- [ ] **CICD-06**: `SURGE_TOKEN` stored as GitHub repo secret
- [ ] **CICD-07**: PR from `staging` to `main` requires validation checks to pass

### File Architecture

- [ ] **ARCH-01**: Split `index.html` into separate files: `css/style.css`, `js/app.js`, `js/publications.js`
- [ ] **ARCH-02**: Tab navigation refactored from index-based to ID-based (`data-page="photos"` not `data-page="6"`)
- [ ] **ARCH-03**: New tabs/sections can be added without modifying core JS logic

### Photo Gallery

- [ ] **GALL-01**: New "Photos" tab in navigation
- [ ] **GALL-02**: CSS grid thumbnail layout with responsive sizing
- [ ] **GALL-03**: Lightbox viewer (GLightbox) with swipe/touch support
- [ ] **GALL-04**: Lazy loading for gallery images (`loading="lazy"` + responsive `<picture>`)
- [ ] **GALL-05**: Gallery module in separate `js/gallery.js` file

### Timed Reveals

- [ ] **RVRL-01**: `data-reveal-after` attribute system for date-gated content
- [ ] **RVRL-02**: Client-side date check on load and every 60 seconds
- [ ] **RVRL-03**: GSAP unlock animation when content reveals
- [ ] **RVRL-04**: `localStorage` persistence of unlock state
- [ ] **RVRL-05**: Timezone-safe date comparisons (date-only, no time)
- [ ] **RVRL-06**: Timed reveal module in separate `js/reveals.js` file

### Quick Wins

- [x] **META-01**: `og:image` meta tag for link sharing previews
- [x] **META-02**: ARIA roles on navigation elements

## v2 Requirements

### Content Expansion

- **CONT-01**: Date-aware homepage messaging (countdown before events, greeting on day, follow-up after)
- **CONT-02**: Memory timeline section (evolving history of celebrations)
- **CONT-03**: Easter eggs hidden throughout the site

### Performance

- **PERF-01**: Image optimization CI guard (reject commits with unoptimized images)
- **PERF-02**: Progressive AVIF support in `<picture>` elements

### Photo Hosting

- **HOST-01**: Cloudinary migration if gallery exceeds 20 images

## Out of Scope

| Feature | Reason |
|---------|--------|
| Backend/server-side code | Static site only — no databases, no APIs |
| User accounts / authentication | Personal site, not a platform |
| Visitor photo uploads | Justin curates all content |
| Build tools / bundlers | Must remain deployable as raw HTML |
| Comments or guestbook | Keep it one-directional (Justin → Annie) |
| Analytics tracking | Personal/private site, no tracking needed |
| Real-time chat / messaging | Overkill for personal celebration site |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| CICD-01 | Phase 1 | Pending |
| CICD-02 | Phase 1 | Pending |
| CICD-03 | Phase 1 | Pending |
| CICD-04 | Phase 1 | Pending |
| CICD-05 | Phase 1 | Pending |
| CICD-06 | Phase 1 | Pending |
| CICD-07 | Phase 1 | Pending |
| ARCH-01 | Phase 2 | Pending |
| ARCH-02 | Phase 2 | Pending |
| ARCH-03 | Phase 2 | Pending |
| META-01 | Phase 2 | Complete |
| META-02 | Phase 2 | Complete |
| GALL-01 | Phase 3 | Pending |
| GALL-02 | Phase 3 | Pending |
| GALL-03 | Phase 3 | Pending |
| GALL-04 | Phase 3 | Pending |
| GALL-05 | Phase 3 | Pending |
| RVRL-01 | Phase 4 | Pending |
| RVRL-02 | Phase 4 | Pending |
| RVRL-03 | Phase 4 | Pending |
| RVRL-04 | Phase 4 | Pending |
| RVRL-05 | Phase 4 | Pending |
| RVRL-06 | Phase 4 | Pending |

**Coverage:**
- v1 requirements: 23 total
- Mapped to phases: 23
- Unmapped: 0 ✓

---
*Requirements defined: 2026-03-28*
*Last updated: 2026-03-28 after initial definition*
