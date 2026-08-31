# Phase 2: Missing UI Components

## Context

- **Parent:** [plan.md](./plan.md)
- **Dependencies:** [Phase 1](./phase-01-critical-fixes.md) (countdown fix)
- **Docs:** [Research 1](./research/researcher-01-report.md), [Research 2](./research/researcher-02-report.md)

## Overview

- **Date:** 2026-03-30
- **Priority:** P1
- **Status:** Pending
- **Description:** Add floating mobile CTA, testimonial carousel, trust signals, and money-back guarantee badge.

## Key Insights

1. Vietnamese course pages see 70%+ mobile traffic -- sticky CTA is essential for conversion.
2. Static 3-card testimonial grid limits social proof impact. Carousel enables more testimonials without vertical space.
3. Trust signals (guarantee badge, secure payment icons) reduce checkout friction.

## Requirements

1. Floating CTA appears on mobile after scrolling past hero, disappears near pricing section
2. Testimonial carousel with auto-rotation, pause on hover, swipe support
3. Money-back guarantee badge near pricing
4. Trust signal strip (secure payment, lifetime access icons)

## Architecture

```
src/components/ui/
  floating-cta.tsx        -- new: mobile sticky CTA
  testimonial-carousel.tsx -- new: embla-based carousel
  trust-badge.tsx          -- new: guarantee + trust icons

src/components/sections/
  testimonials.tsx         -- refactor to use carousel
  pricing.tsx              -- add trust badge below cards
```

**New dependency:** `embla-carousel-react` (lightweight, 5KB gzipped, React 19 compatible). Avoid Swiper (heavy). Alternatively, build a simple CSS-only carousel with Framer Motion.

## Related Code Files

- `landing-page/src/components/sections/testimonials.tsx` -- current static grid
- `landing-page/src/components/sections/pricing.tsx` -- add trust signals
- `landing-page/src/components/sections/hero.tsx` -- scroll threshold reference
- `landing-page/src/components/ui/scroll-to-top.tsx` -- similar scroll-aware pattern to reuse
- `landing-page/src/app/page.tsx` -- add FloatingCTA
- `landing-page/src/lib/constants.ts` -- add more testimonials data

## Implementation Steps

### 1. Floating Mobile CTA

Create `floating-cta.tsx`:
- Client component using `useEffect` + scroll listener (or `framer-motion` `useScroll`)
- Shows after scrolling 600px (past hero)
- Hides when pricing section is in viewport (user already sees CTA)
- Fixed bottom, full-width on mobile, hidden on `md:` and above
- Red bg, white text: "Dang Ky Ngay -- 6.999K"
- Smooth fade-in/out with `AnimatePresence`
- z-index above scroll-to-top (z-50)

Add to `page.tsx` outside `<main>`.

### 2. Testimonial Carousel

**Option A (Recommended): Framer Motion carousel (no new deps)**
- Horizontal scroll container with snap points
- Auto-advance every 5s, pause on hover/touch
- Dot indicators below
- Swipeable via `drag="x"` + `dragConstraints`

**Option B: Embla Carousel**
- `npm install embla-carousel-react`
- Wrap testimonial cards, add prev/next + dots
- Auto-play plugin

Go with Option A to keep zero new dependencies.

Implementation:
- Create `testimonial-carousel.tsx` in `ui/`
- Accepts `items: Testimonial[]` prop
- Renders horizontal motion.div with drag
- State: `activeIndex`, auto-increment via `useEffect`
- Reuse existing testimonial card markup from `testimonials.tsx`
- On mobile: show 1 card. On tablet: 2. On desktop: 3 (or keep grid for desktop, carousel for mobile only)

Update `testimonials.tsx`:
- Mobile: render carousel
- Desktop (lg+): keep current grid layout
- Use responsive approach: carousel always rendered, but CSS controls layout

### 3. Trust Signals & Guarantee Badge

Create `trust-badge.tsx`:
- Shield icon + "Hoan tien 100% trong 7 ngay" text
- Lock icon + "Thanh toan an toan & bao mat"
- Clock icon + "Truy cap tron doi"
- Horizontal flex row, centered, below pricing cards

Add to `pricing.tsx` after the pricing grid div.

### 4. Before/After Comparison Strip (Optional)

Simple two-column comparison: "Coding truyen thong" vs "Vibe Coding"
- Left (gray): slow, expensive, complex
- Right (red accent): fast, affordable, simple
- Place between Benefits and Solution sections or within Solution

## Todo List

- [ ] Create `src/components/ui/floating-cta.tsx`
- [ ] Add `FloatingCTA` to `page.tsx`
- [ ] Create `src/components/ui/testimonial-carousel.tsx` with Framer Motion
- [ ] Refactor `testimonials.tsx` to use carousel on mobile
- [ ] Create `src/components/ui/trust-badge.tsx`
- [ ] Add trust badges below pricing cards in `pricing.tsx`
- [ ] Test floating CTA show/hide behavior on mobile
- [ ] Test carousel swipe on touch devices
- [ ] Verify carousel auto-rotation pauses on interaction
- [ ] Test z-index stacking (floating CTA vs scroll-to-top vs navbar)

## Success Criteria

- Floating CTA visible on mobile (< 768px) after hero scroll, hidden near pricing
- Carousel auto-rotates, pauses on hover, swipeable
- Trust badges render cleanly below pricing
- No layout shift (CLS) from floating CTA appearing
- No new JS dependencies added (Framer Motion carousel)

## Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| Floating CTA overlaps scroll-to-top | Visual clutter | Position CTA at bottom-center, scroll-to-top at bottom-right; hide scroll-to-top when CTA visible on mobile |
| Carousel jank on low-end Android | Poor UX | Use `will-change: transform`, test on throttled CPU |
| Auto-rotation conflicts with user drag | Frustrating UX | Cancel auto-play on any user interaction, resume after 10s idle |

## Security Considerations

- No user input in these components
- Floating CTA href is internal anchor (#hoc-phi) -- no external redirect risk

## Next Steps

Proceed to [Phase 3: Content Enhancement](./phase-03-content.md).
