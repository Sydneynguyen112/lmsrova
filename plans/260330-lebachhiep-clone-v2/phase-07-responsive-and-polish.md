# Phase 07: Responsive & Polish

## Context
- [plan.md](./plan.md) -- master plan
- Previous: [phase-06](./phase-06-pricing-cta-faq-footer.md)

## Overview
Final pass: reorder sections in page.tsx, audit responsive breakpoints, ensure shadow/border-radius consistency, remove ClaudeKit section (not on real site), and run build verification.

## Key Insights
- lebachhiep.com breakpoints: 767px mobile, 1024px tablet, 1140px desktop
- Border radius range: 9px (buttons, inputs) to 20-30px (large cards, hero image)
- Shadows: 6px for cards, 12px for featured/prominent cards
- Current page.tsx has sections in wrong order and includes ClaudeKit (not on real site)

## Requirements
1. Reorder page.tsx sections to match lebachhiep.com flow
2. Remove or repurpose ClaudeKit section
3. Responsive audit at 767px, 1024px, 1140px
4. Shadow consistency (6px standard, 12px featured)
5. Border radius consistency (9px-30px range)
6. Final build test with no errors

## Architecture
```
page.tsx -- section reorder, remove ClaudeKit import
All section files -- responsive class audit
globals.css -- final cleanup of unused classes
```

## Related Code Files
- `c:/Users/Administrator/LMS_ROVA/landing-page/src/app/page.tsx` (37 lines)
- `c:/Users/Administrator/LMS_ROVA/landing-page/src/components/sections/claude-kit.tsx` (42 lines) -- TO REMOVE
- All section/ui component files (responsive audit)

## Implementation Steps

### 1. Reorder `page.tsx`
Target order matching lebachhiep.com:
```tsx
<Navbar />
<main>
  <Hero />           {/* Banner + title + CTA */}
  <Benefits />       {/* Was PainPoints, now 2-col benefits */}
  <Solution />       {/* 3-step process */}
  <Stats />          {/* Social proof numbers */}
  <Curriculum />     {/* 10 chapters accordion */}
  <StudentResults /> {/* Student work showcase */}
  <InstructorBio />  {/* Instructor section */}
  <Testimonials />   {/* Student feedback */}
  <Pricing />        {/* Price card */}
  <FAQ />            {/* Frequently asked */}
  <FinalCTA />       {/* Lead capture + urgency */}
</main>
<Footer />
```
- Remove: `ClaudeKit` import and usage
- Rename: `PainPoints` import to `Benefits` (if renamed in phase 03)

### 2. Remove or archive `claude-kit.tsx`
- Delete the file or comment out (prefer delete since it's not on real site)
- Remove `CLAUDE_KIT_FEATURES` from constants.ts (and its imports)
- This keeps constants.ts cleaner

### 3. Responsive Audit
Check each section at three breakpoints:

**767px (mobile):**
- All grids collapse to 1 column
- Navbar shows hamburger menu
- Hero banner scales down, text sizes reduce
- Pricing card full-width with padding
- Font sizes: headings 24-28px, body 14px

**1024px (tablet):**
- Benefits: 2-col grid (stays 2-col)
- Testimonials: 2-col (not 3)
- Student results: 2-col (stays 2-col)
- Solution steps: may go 2-col or stay 3-col

**1140px+ (desktop):**
- Container maxes at 1140px (centered)
- All grids at full column count
- Testimonials: 3-col

Specific responsive classes to verify/update:
- `sm:` prefix = 640px (use for 2-col)
- `md:` prefix = 768px (tablet)
- `lg:` prefix = 1024px (3-col grids)

### 4. Shadow & Border Radius Consistency
Audit all files for:
- Standard cards: `shadow-[0_6px_20px_rgba(0,0,0,0.06)]` and `rounded-[12px]`
- Featured cards (pricing, instructor): `shadow-[0_12px_40px_rgba(0,0,0,0.08)]` and `rounded-[20px]`
- Buttons/inputs: `rounded-[9px]`
- Hero banner: `rounded-[20px]`
- Remove any `rounded-2xl`, `rounded-3xl`, `rounded-xl` that don't match 9-30px range

### 5. Final Cleanup
- Remove unused CSS classes from globals.css (hero-gradient, stats-gradient, grid-pattern if not repurposed)
- Remove unused Lucide icon imports from constants.ts
- Verify no `text-white`, `text-gray-100`, `bg-gray-950` dark remnants in any file
- Run: `npm run build` and `npm run lint`

## Todo
- [ ] Reorder sections in page.tsx to match lebachhiep.com
- [ ] Remove claude-kit.tsx and its constants
- [ ] Update page.tsx imports (Benefits instead of PainPoints)
- [ ] Audit responsive: mobile (767px) -- verify 1-col grids, font sizes
- [ ] Audit responsive: tablet (1024px) -- verify 2-col grids
- [ ] Audit responsive: desktop (1140px) -- verify max-width containment
- [ ] Standardize shadows: 6px standard, 12px featured
- [ ] Standardize border-radius: 9px buttons, 12px cards, 20px featured
- [ ] Remove unused CSS classes from globals.css
- [ ] Remove unused constants (CLAUDE_KIT_FEATURES)
- [ ] Run `npm run build` -- zero errors
- [ ] Run `npm run lint` -- no critical warnings

## Success Criteria
- Page sections match lebachhiep.com order exactly
- No ClaudeKit section visible
- Page renders correctly at 767px, 1024px, 1140px
- All cards use consistent shadow/radius values
- `npm run build` succeeds with zero errors
- No dark theme classes remain anywhere in codebase

## Risk Assessment
- **Low**: Removing ClaudeKit loses some content, but it doesn't exist on the real site
- **Low**: Responsive changes may need iterative tweaking based on visual testing
- **Medium**: Build may reveal unused import warnings from removed ClaudeKit

## Security Considerations
- No security concerns in this phase
- Ensure no sensitive data leaked in constants cleanup

## Unresolved Questions
- Should ClaudeKit content be merged into Benefits or Curriculum instead of deleted entirely?
- Exact responsive font sizing at each breakpoint (may need visual comparison with real site)
- Whether to add actual images later or keep placeholders for now
