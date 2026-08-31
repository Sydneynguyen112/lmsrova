# Phase 6: Final Polish & Deploy

## Context

- **Parent:** [plan.md](./plan.md)
- **Dependencies:** All prior phases (1-5)
- **Docs:** [Research 1](./research/researcher-01-report.md), [Research 2](./research/researcher-02-report.md)

## Overview

- **Date:** 2026-03-30
- **Priority:** P2
- **Status:** Pending
- **Description:** Animation refinement, cross-browser testing, accessibility audit, and Vercel deployment.

## Key Insights

1. Vietnamese market: 70%+ mobile traffic; mobile testing is paramount.
2. Framer Motion animations should be subtle and performance-conscious.
3. Vercel is the optimal deploy target for Next.js (zero-config, edge network, analytics).
4. Accessibility is often overlooked on Vietnamese landing pages -- an easy differentiator.

## Requirements

1. Smooth, consistent animations across all sections
2. Cross-browser compatibility (Chrome, Safari, Firefox, Samsung Internet)
3. Basic accessibility (WCAG 2.1 AA for contrast, keyboard nav, screen reader labels)
4. Deploy to Vercel with custom domain
5. Final QA checklist pass

## Architecture

No new files. Polish existing components.

```
src/components/animations/scroll-reveal.tsx  -- review easing/duration consistency
src/components/sections/*.tsx                 -- accessibility attributes
src/app/globals.css                           -- reduce-motion media query
next.config.ts                                -- production optimizations
vercel.json                                   -- optional deploy config
```

## Related Code Files

- `landing-page/src/components/animations/scroll-reveal.tsx`
- `landing-page/src/app/globals.css`
- `landing-page/next.config.ts`
- `landing-page/package.json` -- build script

## Implementation Steps

### 1. Animation Polish

Review all animated sections for consistency:
- Standardize durations: section reveals at 0.5s, stagger at 0.08-0.12s
- Standardize easing: `easeOut` for enters, `easeInOut` for transitions
- Add `prefers-reduced-motion` media query:
```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```
- Ensure no animation causes CLS (check `scroll-reveal.tsx` initial states)
- Hero entrance: verify no flash of unstyled content

### 2. Accessibility Audit

Checklist:
- [ ] All images have descriptive `alt` text
- [ ] Color contrast ratio 4.5:1 minimum for body text
- [ ] Focus indicators visible on all interactive elements (buttons, links, accordion)
- [ ] Accordion keyboard accessible (Enter/Space to toggle)
- [ ] Skip-to-content link at top of page
- [ ] `aria-label` on icon-only buttons (scroll-to-top, Zalo widget, mobile menu)
- [ ] Semantic HTML: sections use `<section>`, headings follow h1>h2>h3 order
- [ ] FAQ uses `<details>`/`<summary>` or proper ARIA roles

Implementation:
- Add `<a href="#main-content" class="sr-only focus:not-sr-only">Skip to content</a>` in layout
- Add `id="main-content"` to `<main>` in page.tsx
- Add `aria-label` to scroll-to-top button, Zalo widget, floating CTA
- Review heading hierarchy (h1 in hero, h2 per section, h3 for subsections)

### 3. Cross-Browser Testing

Test on:
- Chrome (desktop + Android)
- Safari (macOS + iOS)
- Firefox (desktop)
- Samsung Internet (Android)

Key areas to test:
- CSS backdrop-filter (glassmorphism cards) -- Safari needs `-webkit-` prefix
- Scroll behavior: smooth -- not supported in some older browsers
- Framer Motion animations performance on low-end devices
- `dvh` viewport units if used -- fallback to `vh`

### 4. Final QA Checklist

- [ ] All links work (anchor navigation, external links)
- [ ] Copy button in payment section copies correctly
- [ ] Countdown timer shows correct values
- [ ] Mobile hamburger menu opens/closes, links close menu
- [ ] No console errors in production build
- [ ] No 404s for images/assets
- [ ] `npm run build` completes without errors
- [ ] `npm run lint` passes

### 5. Vercel Deployment

Steps:
1. Ensure `landing-page/` is its own git repo or monorepo root
2. Connect to Vercel: `npx vercel` or via Vercel dashboard
3. Set environment variables in Vercel dashboard:
   - `NEXT_PUBLIC_GA_ID`
   - `NEXT_PUBLIC_FB_PIXEL_ID`
   - `NEXT_PUBLIC_SITE_URL` (for canonical/sitemap)
4. Set root directory to `landing-page/` if monorepo
5. Deploy and verify build
6. Add custom domain (e.g., vibecoding.vn)
7. Verify SSL certificate auto-provisioned
8. Test production URL

Optional `vercel.json`:
```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "X-Content-Type-Options", "value": "nosniff" },
        { "key": "X-Frame-Options", "value": "DENY" },
        { "key": "Referrer-Policy", "value": "strict-origin-when-cross-origin" }
      ]
    }
  ]
}
```

## Todo List

- [ ] Standardize animation durations/easing across all sections
- [ ] Add `prefers-reduced-motion` CSS
- [ ] Add skip-to-content link
- [ ] Add `aria-label` to all icon-only buttons
- [ ] Verify heading hierarchy (h1 > h2 > h3)
- [ ] Review color contrast ratios (body text #555 on #FFF = 7.5:1 -- OK)
- [ ] Test on Chrome, Safari, Firefox, Samsung Internet
- [ ] Fix any backdrop-filter issues on Safari
- [ ] Run `npm run build` and verify no errors
- [ ] Run `npm run lint` and fix issues
- [ ] Run Lighthouse audit on production build
- [ ] Deploy to Vercel
- [ ] Configure custom domain
- [ ] Set environment variables in Vercel
- [ ] Add security headers via vercel.json
- [ ] Final smoke test on production URL

## Success Criteria

- Production deploy live on Vercel with custom domain
- Lighthouse mobile: 90+ across all categories
- No console errors in production
- Accessible via keyboard navigation
- Animations respect `prefers-reduced-motion`
- All major browsers render correctly
- Security headers present (check with securityheaders.com)

## Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| Build fails on Vercel | No deploy | Test `npm run build` locally first |
| DNS propagation delay | Temporary downtime | Set low TTL before migration |
| Safari rendering differences | Visual bugs | Test early, use `-webkit-` prefixes |
| Monorepo root directory mismatch | Build fails | Set Vercel root to `landing-page/` |

## Security Considerations

- Add security headers (X-Frame-Options, X-Content-Type-Options, Referrer-Policy)
- Verify no exposed API keys or secrets in client bundle
- `.env.local` must be in `.gitignore`
- Ensure no debug/dev artifacts in production build
- CSP header (Content-Security-Policy) -- consider adding if analytics scripts allow

## Next Steps

Post-launch monitoring:
- Track Lighthouse scores weekly
- Monitor GA4 conversion events
- A/B test CTA copy/color variations
- Collect real user testimonials to replace placeholders
- Consider adding video content (hero/instructor intro)
