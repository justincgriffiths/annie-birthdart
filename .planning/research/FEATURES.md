# Feature Research: Personal Celebration / Memory Websites

Research for annielovessnakes.com — a birthday site evolving into an ongoing celebration platform.

Constraints: static HTML only (GitHub Pages), no backend, no build step, solo developer (Justin curates everything). Current architecture is a single `index.html` with inline CSS/JS and GSAP from CDN.

---

## Table Stakes

Features users expect from a personal celebration site. Missing these feels broken.

### 1. Mobile-First Responsive Design
- **Status**: DONE — viewport meta, safe-area insets, touch gestures, 380px breakpoint
- **Complexity**: Low
- **JS required**: No (layout is CSS; swipe gestures are progressive enhancement)
- **Dependencies**: None
- **Notes**: Current implementation is strong. The `max-scale=1.0, user-scalable=no` may be worth revisiting for accessibility.

### 2. Shareable Link / OG Meta Tags
- **Status**: PARTIAL — og:title and og:description exist, missing og:image and og:url
- **Complexity**: Low
- **JS required**: No (pure meta tags)
- **Dependencies**: Needs a representative image hosted somewhere (repo or CDN)
- **Notes**: When Annie shares the link, the preview card in iMessage/social should look intentional. A custom og:image with the snake/birthdart branding would make a big difference for zero effort.

### 3. Photo Gallery
- **Status**: NOT BUILT — listed as active requirement in PROJECT.md
- **Complexity**: Medium
- **JS required**: No for basic grid; Yes for lightbox/swipe
- **Dependencies**: Image hosting strategy (repo? external CDN? optimized sizes?)
- **Notes**: This is the single most expected feature on a celebration site. People want to see photos. A CSS grid with `object-fit: cover` works without JS. Lightbox can be CSS-only using `:target` selectors or the `<dialog>` element. For a curated set (10-30 photos), storing in-repo is fine. Beyond that, consider a CDN or GitHub LFS.

### 4. Fast Load Time
- **Status**: GOOD — single HTML file, minimal external deps (GSAP, Google Fonts, Spotify embeds)
- **Complexity**: Low
- **JS required**: N/A
- **Dependencies**: None
- **Notes**: Spotify iframes are the heaviest elements. `loading="lazy"` is already on the playlist embed. The inline SVG snake is a nice touch vs. loading an image. Photo gallery will be the first real performance test.

### 5. Works Offline / Low Connectivity
- **Status**: PARTIAL — inline CSS/JS works, but GSAP CDN and embeds need network
- **Complexity**: Low (graceful degradation) / Medium (service worker)
- **JS required**: Yes for service worker; No for graceful degradation
- **Dependencies**: None
- **Notes**: The GSAP fallback already exists (the `else` branches in goTo/reveal). The site is functional without JS — content is in the HTML. A service worker would be gold-plating at this stage but trivial to add later.

### 6. Accessible Navigation
- **Status**: PARTIAL — tab buttons work, keyboard arrows work, but no ARIA roles/labels on page sections
- **Complexity**: Low
- **JS required**: No for markup; current JS already handles keyboard nav
- **Dependencies**: None
- **Notes**: Adding `role="tablist"`, `role="tab"`, `role="tabpanel"`, and `aria-selected` to the nav would be quick wins. Not critical for a personal site but good practice.

---

## Differentiators

Features that make this site feel like a love letter, not a template.

### 7. Timed Reveals / Date-Gated Content
- **Status**: NOT BUILT — listed as active requirement in PROJECT.md
- **Complexity**: Medium
- **JS required**: Yes (needs `new Date()` comparison)
- **Dependencies**: None
- **Notes**: This is the killer feature for an evolving celebration platform. Implementation approaches:
  - **JS date check**: Compare `Date.now()` against unlock timestamps. Content is in the HTML but hidden. Simple, but content is viewable in source.
  - **CSS-only with manual deploy**: Push new content on the reveal date. No JS needed. Content truly doesn't exist until the date. Requires Justin to be available to deploy.
  - **Hybrid**: Content is in HTML with a `data-reveal="2026-04-12"` attribute. JS shows it on date. Fallback: Justin manually removes the hide class if JS fails.
  - Best approach for this site: the hybrid. Annie isn't going to view-source. The delight of "something new appeared" is worth the minor source-code leak.

### 8. Personalized Tone / Inside Jokes
- **Status**: DONE — deeply personalized throughout (menu names, fake publications, hero tagline, Roo memorial)
- **Complexity**: Low
- **JS required**: No
- **Dependencies**: None
- **Notes**: This is the site's strongest differentiator. Every section has personality. The "College Annie" toggle is genius. Keep this energy in every new feature.

### 9. Evolving Content / New Tabs Over Time
- **Status**: ARCHITECTURE EXISTS — tab system supports adding new tabs
- **Complexity**: Low per tab
- **JS required**: Minimal (add to the `ids` array, wire up the tab button)
- **Dependencies**: Timed reveals (7) if tabs should appear on specific dates
- **Notes**: The current tab system is clean. Adding a new tab requires: one `<button>` in the nav, one `<section>` in `<main>`, adding the ID to the `ids` array. Could combine with timed reveals — tab buttons are hidden until their date.

### 10. Animated Transitions
- **Status**: DONE — GSAP page transitions, staggered reveals, snake SVG draw animation
- **Complexity**: Already built
- **JS required**: Yes (GSAP), but degrades gracefully
- **Dependencies**: GSAP CDN
- **Notes**: The `prefers-reduced-motion` media query is already respected. Current animations are tasteful and not overdone.

### 11. Embedded Media (Spotify, YouTube)
- **Status**: DONE — Spotify player on home, playlist on vibes, YouTube link on gift
- **Complexity**: Low
- **JS required**: No (iframe embeds)
- **Dependencies**: Third-party availability
- **Notes**: Could expand with more embeds: photo slideshows, Apple Music alternatives. Each iframe adds load time.

### 12. Memory Timeline / "Our Story" Section
- **Status**: NOT BUILT
- **Complexity**: Medium
- **JS required**: No for static timeline; Yes for scroll-triggered animations
- **Dependencies**: Photo gallery (3) for inline photos; Timed reveals (7) for growing over time
- **Notes**: A vertical timeline of relationship milestones, trips, family moments. Could start as a simple CSS timeline (border-left with dated entries) and grow. Natural candidate for timed reveals — new entries appear on anniversaries, birthdays, holidays. This is the feature that transforms "birthday site" into "ongoing celebration platform."

### 13. Countdown / Date-Aware Messaging
- **Status**: NOT BUILT
- **Complexity**: Low
- **JS required**: Yes (date math)
- **Dependencies**: None
- **Notes**: Homepage could show different messaging based on date: countdown to next event before, "Happy Birthday!" on the day, "Hope you had the best weekend" after. Low effort, high delight. Can be a single `<p>` element that JS updates.

### 14. Easter Eggs / Hidden Interactions
- **Status**: MINIMAL — the "too bad" YouTube link is an easter egg
- **Complexity**: Low-Medium per egg
- **JS required**: Depends (Konami codes yes, hidden links no)
- **Dependencies**: None
- **Notes**: Potential easter eggs:
  - Tap the snake SVG N times to trigger an animation
  - Hidden tab that appears after visiting all other tabs
  - Secret message in the page source (HTML comments)
  - Shake-to-reveal on mobile (DeviceMotion API)
  - CSS-only: `:hover` on specific elements reveals hidden text

### 15. Printable / Saveable Version
- **Status**: NOT BUILT
- **Complexity**: Low
- **JS required**: No (CSS `@media print`)
- **Dependencies**: None
- **Notes**: A `@media print` stylesheet that formats the menu card and weekend schedule nicely. Annie could print the menu for the fridge. Low effort, thoughtful touch.

### 16. Love Letter / Personal Message Section
- **Status**: NOT BUILT
- **Complexity**: Low
- **JS required**: No
- **Dependencies**: Timed reveals (7) if new letters appear over time
- **Notes**: A dedicated tab or section for a personal message from Justin to Annie. Could be styled like a handwritten letter (Caveat font is already loaded). New letters could appear on significant dates. This is the emotional core of "ongoing celebration platform."

### 17. Photo Scrapbook with Captions
- **Status**: NOT BUILT
- **Complexity**: Medium
- **JS required**: No for basic; Yes for masonry/lightbox
- **Dependencies**: Photo gallery (3) as foundation
- **Notes**: Goes beyond a simple gallery — photos with handwritten-style captions (Caveat font), dates, and context. Think digital scrapbook page, not Instagram grid. CSS Grid + `object-fit` handles layout. Captions in the HTML.

---

## Anti-Features

Things to deliberately NOT build. Including these would hurt the site.

### A. Comments / Guestbook
- **Why not**: This is a love letter from Justin to Annie, not a social platform. Comments introduce moderation, spam, and dilute the personal tone. If friends want to send messages, they can text.
- **Exception**: A curated "messages from friends" section where Justin manually adds submitted quotes is fine — that's curation, not comments.

### B. Social Login / Authentication
- **Why not**: Already out of scope in PROJECT.md. There's no "user" here. Annie doesn't log in. The site is public and personal.

### C. Analytics / Tracking
- **Why not**: No Google Analytics, no Plausible, no tracking pixels. This is a gift, not a product. Tracking Annie's visits to her own birthday site is creepy. If Justin wants to know she visited, she'll tell him.

### D. Share Buttons / Social Integration
- **Why not**: OG meta tags for link previews (table stakes) are fine. But "Share on Twitter" / "Share on Facebook" buttons are tacky on a personal site. Annie shares by texting the URL.

### E. Newsletter / Email Signup
- **Why not**: Justin controls when Annie sees new content. There's no audience to notify. If he wants to tell her something new is live, he texts her.

### F. Dark/Light Theme Toggle
- **Why not**: The dark country-psychedelic theme IS the brand. A light mode would destroy the atmosphere. The design is intentional, not a default.

### G. Search
- **Why not**: The site has 6 tabs. Tab navigation is the search. Adding a search bar implies the site is large and impersonal.

### H. Cookie Consent Banner
- **Why not**: The site sets no cookies. There's nothing to consent to. (Spotify embeds may set their own, but that's Spotify's domain, not this site's responsibility.)

### I. CMS / Admin Panel
- **Why not**: Justin edits HTML directly. A CMS adds complexity for a site with one author and one reader. The entire site is 551 lines. The codebase IS the CMS.

### J. Visitor Counter / "You are visitor #X"
- **Why not**: Nostalgic but wrong vibe. This isn't GeoCities (even though it has that energy in the best way). The site should feel timeless, not web-1.0 gimmicky.

---

## Prioritized Implementation Order

Based on impact, complexity, and the "evolving celebration platform" vision:

| Priority | Feature | Complexity | Why Now |
|----------|---------|------------|---------|
| 1 | OG image meta tag (2) | Low | 10-minute fix, immediately improves sharing |
| 2 | Photo gallery (3) | Medium | Most expected missing feature |
| 3 | Timed reveals (7) | Medium | Core mechanic for "evolving" platform |
| 4 | Date-aware messaging (13) | Low | Homepage feels alive without manual updates |
| 5 | Memory timeline (12) | Medium | Transforms birthday site into celebration platform |
| 6 | Love letter section (16) | Low | Emotional anchor for the platform |
| 7 | Easter eggs (14) | Low each | Ongoing delight, add one at a time |
| 8 | Print stylesheet (15) | Low | Nice-to-have, quick win |

---

*Researched 2026-03-28. Based on analysis of existing site architecture and common patterns in personal celebration/memory websites.*
