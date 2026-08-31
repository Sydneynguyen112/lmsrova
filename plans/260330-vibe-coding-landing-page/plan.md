# Vibe Coding Landing Page - Implementation Plan

**Date:** 2026-03-30 | **Status:** Planning | **Progress:** 0/6 phases

## Overview

Improve and complete the Vibe Coding landing page (`landing-page/`) to match lebachhiep.com conversion quality. Codebase is ~90% complete; remaining work is fixes, missing components, content, integrations, and optimization.

**Stack:** Next.js 16 + React 19 + TailwindCSS 4 + Framer Motion 12

## Research

- [Design Research](./research/researcher-01-report.md) - Vietnamese course page patterns, animation trends
- [Tech Research](./research/researcher-02-report.md) - Next.js perf, SEO, component recommendations

## Phases

| # | Phase | Priority | Status | File |
|---|-------|----------|--------|------|
| 1 | Critical Fixes | P0 | Pending | [phase-01](./phase-01-critical-fixes.md) |
| 2 | Missing UI Components | P1 | Pending | [phase-02](./phase-02-missing-ui.md) |
| 3 | Content Enhancement | P1 | Pending | [phase-03](./phase-03-content.md) |
| 4 | Third-Party Integrations | P2 | Pending | [phase-04](./phase-04-integrations.md) |
| 5 | Performance & SEO | P1 | Pending | [phase-05](./phase-05-perf-seo.md) |
| 6 | Final Polish & Deploy | P2 | Pending | [phase-06](./phase-06-polish-deploy.md) |

## Dependencies

- Phase 2 depends on Phase 1 (timer fix used by floating CTA)
- Phase 3 depends on Phase 2 (carousel component needed for testimonials)
- Phase 4 is independent (can run in parallel with 3)
- Phase 5 depends on Phase 3 (images must exist before optimization)
- Phase 6 depends on all prior phases

## Key Metrics

- Lighthouse Mobile: target 90+
- LCP < 2.5s, CLS < 0.1, FID < 100ms
- Mobile responsive: tested on 375px, 768px, 1024px, 1440px

## Unresolved Questions

1. Instructor photo asset - need actual photo file from client
2. Student testimonial photos - real or placeholder avatars?
3. Zalo OA ID for chat widget integration
4. Google Analytics / Facebook Pixel IDs
5. QR code image for bank transfer - static or dynamic via API?
6. Vercel project/domain for deployment
7. Video content (hero/bio) - YouTube embed or self-hosted?
