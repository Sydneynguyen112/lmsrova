# Phase 01: Theme & Design System Overhaul

## Context
- [plan.md](./plan.md) -- master plan
- Next phase: [phase-02](./phase-02-navbar-and-hero-redesign.md)

## Overview
Switch the entire design system from dark theme (black #0a0a0a bg) to light theme (white/off-white bg) matching lebachhiep.com. Update fonts from Geist to Roboto. Update all UI primitives.

## Key Insights
- Current: dark bg #0a0a0a, white text, gradient amber/orange buttons, glass-card with rgba white
- Target: white/#F7F9FA bg, dark navy #0A083B text, solid #175CFF buttons, white cards with shadows
- TailwindCSS 4 uses `@theme inline` in globals.css instead of tailwind.config.js

## Requirements
1. Replace color palette completely
2. Replace Geist fonts with Roboto + Roboto Slab
3. Remove dark-theme-only ThemeProvider (or force light)
4. Update all utility CSS classes (glass-card, gradient-text, hero-gradient, etc.)
5. Update Button, Container, SectionWrapper primitives

## Architecture
```
src/app/globals.css          -- new @theme tokens, new utility classes
src/app/layout.tsx           -- Roboto fonts, remove ThemeProvider or set light
src/components/ui/button.tsx -- solid #175CFF, border-radius 9px
src/components/ui/container.tsx -- max-w-[1140px]
src/components/ui/section-wrapper.tsx -- light bg defaults
src/components/theme-provider.tsx -- may remove or simplify
```

## Related Code Files
- `c:/Users/Administrator/LMS_ROVA/landing-page/src/app/globals.css` (72 lines)
- `c:/Users/Administrator/LMS_ROVA/landing-page/src/app/layout.tsx` (89 lines)
- `c:/Users/Administrator/LMS_ROVA/landing-page/src/components/ui/button.tsx` (62 lines)
- `c:/Users/Administrator/LMS_ROVA/landing-page/src/components/ui/container.tsx` (15 lines)
- `c:/Users/Administrator/LMS_ROVA/landing-page/src/components/ui/section-wrapper.tsx` (20 lines)
- `c:/Users/Administrator/LMS_ROVA/landing-page/src/components/theme-provider.tsx` (11 lines)

## Implementation Steps

### 1. Update `globals.css`
Replace entire `@theme inline` block:
```css
@theme inline {
  --color-background: #FFFFFF;
  --color-foreground: #0A083B;
  --color-primary: #175CFF;
  --color-primary-hover: #1350E0;
  --color-secondary: #F7F9FA;
  --color-body: #57586E;
  --color-light-bg: #EAF1F8;
  --color-accent-red: #DD3333;
  --color-navy: #0A083B;
  --font-sans: var(--font-roboto);
  --font-serif: var(--font-roboto-slab);
}
```
Replace `.gradient-text` with navy/blue color (no gradient needed, or use primary blue).
Replace `.glass-card` with:
```css
.card { background: #fff; border: 1px solid #EAF1F8; border-radius: 12px; box-shadow: 0 6px 20px rgba(0,0,0,0.06); }
```
Remove `.hero-gradient`, `.stats-gradient`, `.grid-pattern` dark styles. Replace with light equivalents.

### 2. Update `layout.tsx`
- Import `Roboto` and `Roboto_Slab` from `next/font/google` instead of Geist
- Roboto: weights [400, 600, 700], variable `--font-roboto`
- Roboto_Slab: weights [600, 700], variable `--font-roboto-slab`
- Change `defaultTheme="dark"` to `defaultTheme="light"` (or remove ThemeProvider entirely)
- Update body class: remove dark-specific classes

### 3. Update `button.tsx`
- Primary variant: `bg-[#175CFF] text-white hover:bg-[#1350E0]` (no gradient)
- Secondary variant: `bg-white text-[#0A083B] border border-[#EAF1F8] hover:bg-[#F7F9FA]`
- Ghost variant: `text-[#57586E] hover:text-[#0A083B] hover:bg-[#F7F9FA]`
- Border radius: `rounded-[9px]` instead of `rounded-xl`
- Remove shadow-orange, shadow-amber references

### 4. Update `container.tsx`
- Change `max-w-7xl` to `max-w-[1140px]`

### 5. Update `section-wrapper.tsx`
- Keep structure, ensure no dark-bg classes leak in

## Todo
- [ ] Rewrite globals.css with light theme tokens and utility classes
- [ ] Replace Geist with Roboto + Roboto Slab in layout.tsx
- [ ] Set defaultTheme to "light" or remove ThemeProvider
- [ ] Update Button variants to solid blue primary
- [ ] Update Container to max-w-[1140px]
- [ ] Verify SectionWrapper has no dark-theme remnants
- [ ] Run `npm run build` to verify no compile errors

## Success Criteria
- Page loads with white background, dark navy text
- Buttons are solid #175CFF blue with 9px border radius
- Roboto font renders for all text
- Container maxes out at 1140px
- No dark theme remnants visible

## Risk Assessment
- **Low**: Font swap may cause FOUT (flash of unstyled text) -- mitigated by next/font
- **Low**: Some hardcoded dark colors in section components won't be caught until phases 2-6
- **Medium**: TailwindCSS 4 @theme syntax -- verify the variable names work with Tailwind utility classes

## Security Considerations
- No secrets or API keys involved
- Google Fonts loaded via next/font (self-hosted, no external requests)

## Next Steps
Proceed to [Phase 02: Navbar & Hero Redesign](./phase-02-navbar-and-hero-redesign.md)
