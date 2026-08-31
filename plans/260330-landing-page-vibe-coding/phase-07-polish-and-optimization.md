# Phase 07: Polish & Optimization

## Context
- [Main Plan](./plan.md)
- [Phase 06: Pricing, FAQ & Footer](./phase-06-pricing-faq-footer.md)
- Depends on: All previous phases complete

## Overview
Final pass: responsive audit, performance optimization, SEO verification, dark mode consistency, accessibility basics, and cross-browser testing. This phase turns the MVP into a production-ready page.

## Key Insights
- 60%+ of Vietnamese course purchases happen on mobile (research)
- Core Web Vitals directly impact SEO ranking
- LCP < 2.5s, CLS < 0.1, FID < 100ms targets
- Font-display: swap prevents FOIT (flash of invisible text)
- Framer Motion `viewport={{ once: true }}` prevents re-render on scroll back
- TailwindCSS 4 purges unused styles automatically

## Requirements
1. Responsive design audit across breakpoints (375px, 768px, 1024px, 1440px)
2. Performance: font loading, image optimization pipeline, bundle analysis
3. SEO: verify meta tags, OG tags, JSON-LD in page source
4. Dark mode: ensure all sections consistent (no white flashes)
5. Accessibility: focus states, aria labels, semantic HTML, color contrast
6. Optional: scroll progress indicator bar

## Architecture

### Scroll Progress Indicator (Optional)
```
[Fixed bar at top of viewport]
  [Thin colored bar growing left-to-right as user scrolls]
  [Uses Framer Motion useScroll + useTransform]
```

## Related Code Files
- All component files from Phases 01-06
- `src/app/layout.tsx` - Verify metadata
- `src/app/globals.css` - Final CSS cleanup
- `next.config.ts` - Add image optimization config if needed

## Implementation Steps

### Step 1: Responsive Audit
- Test every section at 375px (iPhone SE), 768px (iPad), 1024px (laptop), 1440px (desktop)
- Fix any text overflow, grid breakage, touch target sizes (min 44px)
- Verify CTA buttons are full-width on mobile
- Navbar hamburger menu works on mobile
- Cards stack to single column on mobile
- Pricing card doesn't overflow on small screens

### Step 2: Performance Optimization
- Verify no lazy-loading on hero section (LCP)
- Add `loading="lazy"` to below-fold images (if any real images added)
- Verify Geist font uses `font-display: swap` (Next.js handles this)
- Check bundle size: `npm run build` output, verify JS < 150KB first-load
- If images are added: configure `next.config.ts` for WebP/AVIF via `images.formats`
- Ensure all Framer Motion animations use `viewport={{ once: true }}` to prevent re-renders
- Add `will-change: auto` (not `transform`) to avoid compositor layer bloat

### Step 3: SEO Verification
- View page source: confirm `<html lang="vi">`
- Confirm meta title, description, keywords present
- Confirm Open Graph tags: og:title, og:description, og:image, og:type, og:locale="vi_VN"
- Confirm JSON-LD Course schema in `<script type="application/ld+json">`
- Test with browser dev tools or Lighthouse SEO audit
- Verify all section headings use proper hierarchy (single H1, then H2s)

### Step 4: Dark Mode Consistency
- Since design is dark-first, verify no white backgrounds leak through
- Check all text colors have sufficient contrast against dark bg
- Verify glass-card borders visible on dark background
- Check form elements (if any) don't have white backgrounds
- Test with `defaultTheme="dark"` forced

### Step 5: Accessibility Basics
- All interactive elements (buttons, accordion triggers) have focus-visible outlines
- Accordion buttons have `aria-expanded` attribute
- Images (when added) have alt text
- Section headings are semantic (h1 > h2 > h3)
- CTA buttons have descriptive text (not just "Click here")
- Color contrast: text meets WCAG AA (4.5:1 ratio)
- Skip-to-content link (optional but good practice)

### Step 6: Optional - Scroll Progress Indicator
- Create `scroll-progress.tsx` (~20 lines)
- Fixed position bar at very top of page (above navbar)
- Uses Framer Motion `useScroll` for `scrollYProgress`
- `useTransform` to map 0-1 to scaleX 0-1
- Thin bar (2-3px) with accent gradient color
- `transform-origin: left` for left-to-right growth
- Add to layout or page.tsx

### Step 7: Final Testing
- `npm run build` - no errors
- `npm run lint` - no critical warnings
- Manual scroll test: all animations fire, all accordion items work, all CTAs visible
- Test smooth scroll navigation from navbar
- Test mobile hamburger menu open/close
- Cross-browser: Chrome, Firefox, Safari (if possible)

## Todo
- [ ] Responsive audit: test all breakpoints, fix issues
- [ ] Performance: verify LCP, check bundle size, optimize if needed
- [ ] SEO: verify meta tags, OG, JSON-LD in page source
- [ ] Dark mode: check all sections for consistency
- [ ] Accessibility: focus states, aria attributes, semantic HTML
- [ ] Optional: create scroll progress indicator
- [ ] Final `npm run build` and `npm run lint`
- [ ] Manual end-to-end scroll test

## Success Criteria
- Page renders correctly at 375px, 768px, 1024px, 1440px
- `npm run build` shows first-load JS < 150KB
- Lighthouse scores: Performance > 90, SEO > 90, Accessibility > 80
- No white flash or inconsistent colors in dark mode
- All animations play once, smoothly, without jank
- All CTAs clickable and prominent on every viewport
- Vietnamese diacritics render correctly everywhere

## Risk Assessment
- **Lighthouse scores**: Framer Motion adds JS weight (~30KB); acceptable for animation quality tradeoff
- **Safari compatibility**: Test `backdrop-filter` (glass effect) - needs `-webkit-backdrop-filter` prefix
- **CLS from fonts**: Geist font swap may cause minor layout shift; acceptable with preload

## Security Considerations
- Run `npm audit` to check for dependency vulnerabilities
- Ensure no sensitive data in build output
- All external links use `rel="noopener noreferrer"`
- No inline scripts that could be XSS vectors

## Next Steps
- Deploy to hosting (Vercel or Cloudflare Pages)
- Replace placeholder content with real photos, testimonials
- Set up analytics (Google Analytics or Plausible)
- Connect CTA buttons to actual enrollment/payment flow
- A/B test CTA copy and pricing presentation
