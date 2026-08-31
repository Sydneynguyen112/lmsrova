# Phase 02: Hero & Pain Points

## Context
- [Main Plan](./plan.md)
- [Phase 01: Setup](./phase-01-project-setup-and-layout.md)
- Depends on: Phase 01 (shared components, constants, theme)

## Overview
Build the above-the-fold Hero section and Pain Points section. Hero is the LCP-critical element driving first impressions. Pain Points validate the audience's struggles to prime them for the solution.

## Key Insights
- Hero headline must communicate value in < 3 seconds: "Turn Ideas Into Software With AI"
- CTA button is the first of 3-5 placements on the page
- Never lazy-load hero background/images (LCP optimization)
- Pain points use icon + short text cards; grid layout works best
- Framer Motion staggered entrance creates premium feel
- Mobile: hero text must be readable without horizontal scroll

## Requirements
1. Hero section: gradient background, headline, subheadline, CTA button, trust badges (stats preview)
2. Pain Points section: 4-6 problem cards in responsive grid
3. Framer Motion animations: hero fade-in on load, pain points whileInView

## Architecture

### Hero Layout
```
[Full-width gradient background with subtle animated particles/grid]
  [Container]
    [Badge: "100+ hoc vien da tham gia"]
    [H1: "Bien Y Tuong Thanh Phan Mem Bang AI"]
    [Subheadline: "Khoa hoc Vibe Coding..."]
    [CTA Button: "Dang Ky Ngay - Chi 499K"]
    [Trust row: "10 chuong | 8 gio | 0 dong code"]
```

### Pain Points Layout
```
[SectionWrapper id="van-de"]
  [Heading: "Ban co dang gap nhung van de nay?"]
  [Grid 2x3 or 3x2]
    [Card: icon + title + description] x 6
```

### Pain Point Cards Content (Vietnamese)
1. Muon tao app nhung khong biet code (Want to build app but can't code)
2. Hoc lap trinh qua kho va mat thoi gian (Learning programming too hard & time-consuming)
3. Thue dev qua dat, khong kiem soat duoc (Hiring devs too expensive, no control)
4. Y tuong hay nhung khong biet bat dau (Great ideas but don't know where to start)
5. So cong nghe phuc tap (Afraid of complex technology)
6. Da thu nhieu cach nhung that bai (Tried many ways but failed)

## Related Code Files
- `src/components/sections/hero.tsx` - CREATE
- `src/components/sections/pain-points.tsx` - CREATE
- `src/app/page.tsx` - UPDATE: import and compose Hero + PainPoints
- `src/lib/constants.ts` - Uses PAIN_POINTS data

## Implementation Steps

### Step 1: Create hero.tsx (~120 lines)
- `"use client"` (Framer Motion requires client component)
- Full-viewport height section (`min-h-screen`) with radial gradient background
- Background: CSS radial gradient (blue/violet glow center, fading to dark)
- Optional: subtle grid pattern overlay using CSS background-image
- Content centered vertically and horizontally
- Badge component: small pill showing "100+ hoc vien" with subtle glow
- H1: large bold text, possibly with gradient text effect on key words
- Subheadline: text-lg/xl, muted color, max-w-2xl
- CTA Button (from shared Button component): primary variant, large size
- Trust stats row: 3-4 inline stats separated by dots/dividers
- Animation: `motion.div` with staggerChildren, each child fades up sequentially
- No lazy-loaded images in hero (LCP critical)

### Step 2: Create pain-points.tsx (~100 lines)
- `"use client"` for animations
- SectionWrapper with id="van-de" and dark card background variant
- Section heading with ScrollReveal wrapper
- Responsive grid: `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6`
- Each card: glass-card style (semi-transparent bg, border, rounded-xl)
- Card content: Lucide icon (top), title (font-semibold), description (text-sm, muted)
- Icons: `Code2, Clock, DollarSign, Lightbulb, Shield, XCircle` from Lucide
- Cards animate in with stagger using ScrollReveal or manual whileInView with delay index

### Step 3: Update page.tsx
- Import Hero and PainPoints components
- Replace boilerplate with: `<main><Navbar /><Hero /><PainPoints />...</main>`
- Keep as server component if possible; sections are client components themselves

## Todo
- [ ] Create hero.tsx with gradient bg, headline, CTA, trust stats
- [ ] Create pain-points.tsx with icon cards grid
- [ ] Update page.tsx to compose sections
- [ ] Test on mobile viewport (375px)
- [ ] Verify LCP is not blocked by lazy loading
- [ ] Verify animations play smoothly (no jank)

## Success Criteria
- Hero fills viewport with gradient, text is readable
- CTA button is prominent and clickable
- Pain points grid renders 6 cards responsively
- Animations trigger: hero on page load, pain points on scroll
- Mobile: single column, text doesn't overflow
- `npm run build` passes

## Risk Assessment
- **LCP regression**: Ensure no images are lazy-loaded in hero; gradient bg is CSS-only (fast)
- **Vietnamese text length**: Vietnamese phrases can be longer than English; test that headlines don't break layout
- **Animation performance**: Use `will-change: transform` sparingly; Framer Motion handles this internally

## Security Considerations
- No user input; static content only
- External links (if any) should use `rel="noopener noreferrer"`

## Next Steps
Phase 03: Solution & Stats sections
