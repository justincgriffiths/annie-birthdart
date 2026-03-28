# Roadmap: Annie Loves Snakes

**Created:** 2026-03-28
**Milestone:** v1.0
**Phases:** 4
**Requirements:** 23 mapped

## Phase 1: CI/CD Pipeline

**Goal:** Establish dev-staging-main workflow with automated validation and staging previews so every future change is tested before Annie sees it.
**Requirements:** CICD-01, CICD-02, CICD-03, CICD-04, CICD-05, CICD-06, CICD-07

### Success Criteria

1. Pushing to `dev` or `staging` triggers HTML validation, Lighthouse, and link checks that report pass/fail on the commit
2. Pushing to `staging` deploys a live preview at annie-birthdart-staging.surge.sh within 2 minutes
3. A PR from `staging` to `main` cannot merge until all validation checks pass

---

## Phase 2: File Architecture + Quick Wins

**Goal:** Split the monolithic index.html into maintainable separate files, modernize the tab system, and ship low-effort improvements (OG image, ARIA) that make the site shareable and accessible.
**Requirements:** ARCH-01, ARCH-02, ARCH-03, META-01, META-02
**Plans:** 3 plans

Plans:
- [ ] 02-a-PLAN.md -- Extract CSS/JS into separate files, modernize tab system to DOM-driven IDs
- [ ] 02-b-PLAN.md -- Add OG meta tags for social sharing and ARIA tab pattern for accessibility
- [ ] 02-c-PLAN.md -- Update tests for new tab scheme, add extensibility/ARIA tests, final verification

### Success Criteria

1. CSS lives in `css/style.css`, JS in `js/app.js` and `js/publications.js` -- index.html contains only the HTML shell and script/link tags
2. Adding a new tab requires only an HTML block and a nav entry -- no changes to core JS logic
3. Sharing annielovessnakes.com in iMessage or Slack renders a preview card with image, title, and description

---

## Phase 3: Photo Gallery

**Goal:** Add a curated photo gallery that loads fast on mobile, supports touch-friendly lightbox viewing, and can grow without bloating the repo.
**Requirements:** GALL-01, GALL-02, GALL-03, GALL-04, GALL-05

### Success Criteria

1. A "Photos" tab appears in navigation and displays a responsive CSS grid of thumbnails
2. Tapping a thumbnail opens a full-size lightbox with swipe navigation on mobile
3. Gallery images lazy-load (no impact on initial page load time) and gallery logic lives in a separate `js/gallery.js` file

---

## Phase 4: Timed Reveals

**Goal:** Build a date-gated content system so Justin can deploy surprises in advance and they unlock automatically on the right day with animation.
**Requirements:** RVRL-01, RVRL-02, RVRL-03, RVRL-04, RVRL-05, RVRL-06

### Success Criteria

1. Content tagged with `data-reveal-after="YYYY-MM-DD"` is hidden before that date and automatically appears on or after it
2. When content unlocks, it plays a GSAP entrance animation and the unlock state persists across page reloads via localStorage
3. Date comparisons work correctly regardless of Annie's timezone (date-only, no time component) and reveal logic lives in a separate `js/reveals.js` file
