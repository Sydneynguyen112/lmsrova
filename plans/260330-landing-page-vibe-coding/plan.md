# Vietnamese "Vibe Coding" Course Landing Page

> **Stack**: Next.js 16.2.1 + React 19 + TailwindCSS 4 + Framer Motion 12 + Lucide React + next-themes
> **Location**: `c:/Users/Administrator/LMS_ROVA/landing-page/`
> **Goal**: High-converting Vietnamese landing page selling a "Vibe Coding" AI course (12 sections)

## Research
- [Design Patterns & Vietnamese Market](./research/researcher-01-report.md)
- [Tech Stack & Implementation](./research/researcher-02-report.md)

## Phases

| # | Phase | Status | File |
|---|-------|--------|------|
| 1 | Project Setup & Layout | TODO | [phase-01](./phase-01-project-setup-and-layout.md) |
| 2 | Hero & Pain Points | TODO | [phase-02](./phase-02-hero-and-pain-points.md) |
| 3 | Solution & Stats | TODO | [phase-03](./phase-03-solution-and-stats.md) |
| 4 | Curriculum & KIT | TODO | [phase-04](./phase-04-curriculum-and-kit.md) |
| 5 | Social Proof | TODO | [phase-05](./phase-05-social-proof.md) |
| 6 | Pricing, FAQ & Footer | TODO | [phase-06](./phase-06-pricing-faq-footer.md) |
| 7 | Polish & Optimization | TODO | [phase-07](./phase-07-polish-and-optimization.md) |

## Architecture Overview

```
src/
  app/
    page.tsx              # Main page composing all sections
    layout.tsx            # Root layout (lang="vi", meta, JSON-LD)
    globals.css           # Theme vars, custom utilities
  components/
    ui/                   # Shared UI primitives
      button.tsx
      container.tsx
      section-wrapper.tsx
      accordion.tsx
    sections/             # 12 landing page sections
      navbar.tsx
      hero.tsx
      pain-points.tsx
      solution.tsx
      stats.tsx
      curriculum.tsx
      claude-kit.tsx
      student-results.tsx
      instructor-bio.tsx
      testimonials.tsx
      pricing.tsx
      faq.tsx
      footer.tsx
      final-cta.tsx
    animations/
      counter-animation.tsx
      scroll-reveal.tsx
  lib/
    utils.ts              # Existing cn() utility
    constants.ts          # Course data, FAQ items, curriculum, testimonials
  hooks/
    use-counter.ts        # Counter animation hook
```

## Key Decisions
- **Dark-first design** matching tech landing page aesthetics (dark gradient bg)
- **All content in constants.ts** for easy updates (no CMS)
- **Component file < 200 lines** per development rules
- **Framer Motion `whileInView`** for all scroll-triggered animations
- **No external UI library** - build minimal components with Tailwind
- **Placeholder images** using gradient divs until real assets provided

## Estimated Effort
~7 implementation sessions, each phase self-contained and testable.
