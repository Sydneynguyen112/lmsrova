# Phase 03: Solution & Stats

## Context
- [Main Plan](./plan.md)
- [Phase 02: Hero & Pain Points](./phase-02-hero-and-pain-points.md)
- Depends on: Phase 01 (shared components), Phase 02 (page structure)

## Overview
Solution section introduces the "Vibe Coding" method as the answer to pain points. Stats section provides social proof via animated counters. Together they bridge problem awareness to credibility.

## Key Insights
- Solution section should feel like a "reveal" - the answer to all pain points listed above
- Counter animations are one of the most engaging scroll-triggered effects
- Stats near social proof elements = 35% conversion lift (research)
- Counter should only animate once (when scrolled into view)
- Vietnamese number formatting: use dot separator (e.g., 6.999K)

## Requirements
1. Solution section: explain Vibe Coding method with step-by-step visual
2. Stats section: 5 animated counters (100+, 10, 8, 98%, 0)
3. Custom `useCounter` hook for smooth count-up animation
4. `whileInView` trigger so counters animate on scroll

## Architecture

### Solution Layout
```
[SectionWrapper id="giai-phap"]
  [Heading: "Vibe Coding - Phuong Phap Lap Trinh Bang AI"]
  [Subheading: explanation text]
  [3-step process visual]
    Step 1: Mo ta y tuong (Describe your idea)
    Step 2: AI tao code (AI generates code)
    Step 3: Chinh sua & deploy (Refine & deploy)
  [CTA button #2]
```

### Stats Layout
```
[SectionWrapper id="thanh-tuu" with accent background]
  [Grid 5 columns (responsive)]
    [Counter: 100+ | Hoc vien]
    [Counter: 10  | Chuong hoc]
    [Counter: 8   | Gio hoc]
    [Counter: 98% | Hai long]
    [Counter: 0   | Dong code]
```

## Related Code Files
- `src/components/sections/solution.tsx` - CREATE
- `src/components/sections/stats.tsx` - CREATE
- `src/hooks/use-counter.ts` - CREATE
- `src/components/animations/counter-animation.tsx` - CREATE
- `src/app/page.tsx` - UPDATE: add Solution + Stats
- `src/lib/constants.ts` - Uses STATS data, SOLUTION_STEPS data

## Implementation Steps

### Step 1: Create use-counter.ts hook (~35 lines)
- Params: `end: number, duration: number (ms), startOnView: boolean`
- Uses `useState` for current value, `useEffect` with `requestAnimationFrame`
- Easing function (ease-out) for natural deceleration
- Returns `{ count, ref }` where ref is attached to element for intersection observer
- Use `useInView` from framer-motion or manual IntersectionObserver
- Only animate once (`once: true`)

### Step 2: Create counter-animation.tsx (~40 lines)
- Presentational component wrapping useCounter
- Props: `value: number, suffix: string, label: string`
- Large number display (text-4xl/5xl font-bold)
- Suffix inline ("+", "%", etc.)
- Label below in muted smaller text
- Framer Motion scale-in when in view

### Step 3: Create solution.tsx (~100 lines)
- `"use client"`
- SectionWrapper id="giai-phap"
- Heading + subheading with ScrollReveal
- 3-step horizontal process (vertical on mobile):
  - Each step: numbered circle + icon + title + description
  - Connected by a line/arrow between steps (CSS border or SVG)
  - Icons: `MessageSquare` (describe), `Cpu` (AI generates), `Rocket` (deploy)
- Steps stagger-animate with ScrollReveal
- CTA button below: "Bat Dau Hoc Ngay" (Start Learning Now)

### Step 4: Create stats.tsx (~60 lines)
- `"use client"`
- SectionWrapper with gradient accent background (blue/violet tint)
- Responsive grid: `grid-cols-2 sm:grid-cols-3 lg:grid-cols-5`
- Map over STATS constant, render CounterAnimation for each
- Stats data: `[{value: 100, suffix: "+", label: "Hoc vien"}, ...]`
- The "0" counter for "Dong code" is a special case (already at target; just display with emphasis)

### Step 5: Update page.tsx
- Add Solution and Stats after PainPoints

## Todo
- [ ] Create use-counter.ts hook
- [ ] Create counter-animation.tsx
- [ ] Create solution.tsx with 3-step process
- [ ] Create stats.tsx with 5 animated counters
- [ ] Update page.tsx
- [ ] Test counter animation triggers only once on scroll
- [ ] Verify responsive grid on mobile (2 cols) and desktop (5 cols)

## Success Criteria
- Solution section clearly shows 3-step process
- All 5 counters animate from 0 to target value on scroll
- Counters don't re-animate on subsequent scrolls
- Responsive: 2-col on mobile, 5-col on desktop for stats
- CTA button #2 present in solution section
- `npm run build` passes

## Risk Assessment
- **Counter animation jank**: Use `requestAnimationFrame` not `setInterval`; keep duration ~2s
- **"0" counter edge case**: Displaying "0 dong code" needs special handling (no animation needed, just emphasis styling)
- **Process step connectors**: CSS lines between steps can break on mobile; use conditional rendering or hide on small screens

## Security Considerations
- No user input; static content only

## Next Steps
Phase 04: Curriculum & Claude Super KIT
