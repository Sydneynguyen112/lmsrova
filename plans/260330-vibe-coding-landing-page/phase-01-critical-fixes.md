# Phase 1: Critical Fixes

## Context

- **Parent:** [plan.md](./plan.md)
- **Dependencies:** None (first phase)
- **Docs:** [Research 1](./research/researcher-01-report.md), [Research 2](./research/researcher-02-report.md)

## Overview

- **Date:** 2026-03-30
- **Priority:** P0
- **Status:** Pending
- **Description:** Fix broken countdown timer, incorrect structured data pricing, and responsive spacing issues.

## Key Insights

1. `COUNTDOWN_TARGET` is `2025-07-01` -- over 9 months in the past. Timer shows `00:00:00:00`.
2. Structured data in `layout.tsx` shows `price: "499000"` but actual price is `6999000`.
3. Mobile spacing needs tightening on several sections.

## Requirements

1. Countdown timer must always show a meaningful future date
2. Structured data must reflect real pricing (6,999,000 VND basic tier)
3. Mobile layout must be comfortable at 375px width

## Architecture

```
src/lib/constants.ts          -- COUNTDOWN_TARGET fix
src/app/layout.tsx             -- structured data price fix
src/components/ui/countdown-timer.tsx -- rolling deadline logic
src/components/sections/*.tsx  -- responsive spacing audit
```

## Related Code Files

- `landing-page/src/lib/constants.ts` (line 421: `COUNTDOWN_TARGET`)
- `landing-page/src/app/layout.tsx` (line 62: `price: "499000"`)
- `landing-page/src/components/ui/countdown-timer.tsx`
- `landing-page/src/components/sections/pricing.tsx`
- `landing-page/src/components/sections/final-cta.tsx`

## Implementation Steps

### 1. Fix Countdown Timer (rolling deadline)

Replace static `COUNTDOWN_TARGET` with a rolling deadline function. Two approaches:

**Option A (Recommended): Rolling 3-day deadline from first visit**
- Create `getCountdownTarget()` in `constants.ts`
- On first visit, store `deadline` in `localStorage`
- If stored deadline is past, reset to 3 days from now
- Export as function, not static Date

**Option B: Fixed future date**
- Simply update to a future date (e.g., `2026-06-01`)
- Simpler but requires manual updates

Implementation (Option A):
```
// src/lib/countdown.ts (new file)
export function getCountdownTarget(): Date {
  if (typeof window === 'undefined') return new Date(Date.now() + 3 * 86400000);
  const key = 'vibe_coding_deadline';
  const stored = localStorage.getItem(key);
  if (stored) {
    const d = new Date(stored);
    if (d.getTime() > Date.now()) return d;
  }
  const deadline = new Date(Date.now() + 3 * 86400000);
  localStorage.setItem(key, deadline.toISOString());
  return deadline;
}
```

Update `countdown-timer.tsx` to accept a `getTarget` function or make it self-contained. The component already accepts `target: Date`, so the parent components (`Pricing`, `FinalCTA`) should call the function.

### 2. Fix Structured Data Price

In `layout.tsx`, update the JSON-LD offers:
- Change `price: "499000"` to `price: "6999000"`
- Add `highPrice` offer for advanced tier (19999000)
- Consider `AggregateOffer` schema for multiple tiers

### 3. Responsive Spacing Audit

Review each section at 375px breakpoint:
- Hero: check stat grid wrapping (currently `grid-cols-2 sm:grid-cols-4` -- good)
- Pricing cards: ensure no horizontal overflow
- Payment section: bank info box width
- Navbar mobile menu: verify hamburger opens/closes cleanly
- Footer: 4-column to 2-column to 1-column stacking

### 4. Minor Bug Fixes

- Remove unused `next-themes` dependency if dark mode is not used (currently not toggled anywhere)
- Clean up default Next.js SVGs in `public/` (file.svg, globe.svg, etc.) if unused

## Todo List

- [ ] Create `src/lib/countdown.ts` with rolling deadline logic
- [ ] Update `Pricing` component to use `getCountdownTarget()`
- [ ] Update `FinalCTA` component to use `getCountdownTarget()`
- [ ] Remove `COUNTDOWN_TARGET` from constants.ts
- [ ] Fix structured data price in layout.tsx (499000 -> 6999000)
- [ ] Add AggregateOffer schema for both tiers
- [ ] Test responsive layout at 375px, 768px, 1024px
- [ ] Fix any overflow or spacing issues found
- [ ] Remove unused public/ default SVGs
- [ ] Verify `next-themes` usage; remove if unused

## Success Criteria

- Countdown shows positive time remaining for every new visitor
- Countdown persists across page reloads (same visitor sees same deadline)
- Google Rich Results Test passes with correct price
- No horizontal scroll at any viewport width
- All text readable at 375px without zoom

## Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| localStorage blocked (incognito) | Timer resets each visit | Fallback to session-based 3-day window |
| Rolling deadline feels manipulative | Trust erosion | Consider fixed monthly reset instead |
| Schema validation changes | SEO penalty | Test with Google Rich Results validator |

## Security Considerations

- No sensitive data in localStorage (only a deadline timestamp)
- Structured data must not contain misleading pricing
- Ensure no XSS vectors in `dangerouslySetInnerHTML` for JSON-LD (currently safe -- static JSON.stringify)

## Next Steps

Proceed to [Phase 2: Missing UI Components](./phase-02-missing-ui.md) after all critical fixes verified.
