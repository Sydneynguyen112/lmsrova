# Upgrade Landing Page to Match lebachhiep.com

## Overview
Transform the existing dark-themed Vibe Coding landing page into a light-themed design matching lebachhiep.com. Core changes: light color scheme, Roboto fonts, 1140px container, solid blue CTAs, proper section ordering, and missing sections (benefits grid, lead capture, urgency mechanics).

## Architecture
```
globals.css (light theme tokens)
  -> layout.tsx (Roboto fonts, defaultTheme="light")
    -> page.tsx (reordered sections)
      -> UI primitives: Button(#175CFF), Container(1140px), SectionWrapper, Accordion
      -> Sections: Navbar > Hero > Benefits > Solution > Stats > Curriculum > ClaudeKit > StudentResults > InstructorBio > Testimonials > Pricing > FAQ > FinalCTA > Footer
      -> constants.ts (content data, unchanged structure)
```

## Phase Tracker

| # | Phase | Files Changed | Est. Lines | Status |
|---|-------|--------------|-----------|--------|
| 1 | Theme & Design System | globals.css, layout.tsx, button.tsx, container.tsx, section-wrapper.tsx | ~120 | TODO |
| 2 | Navbar & Hero Redesign | navbar.tsx, hero.tsx, constants.ts | ~150 | TODO |
| 3 | Benefits & Solution | pain-points.tsx (rename to benefits), solution.tsx | ~120 | TODO |
| 4 | Curriculum & Stats | curriculum.tsx, stats.tsx, accordion.tsx | ~100 | TODO |
| 5 | Social Proof & Instructor | student-results.tsx, instructor-bio.tsx, testimonials.tsx | ~120 | TODO |
| 6 | Pricing, CTA, FAQ, Footer | pricing.tsx, final-cta.tsx, faq.tsx, footer.tsx | ~180 | TODO |
| 7 | Responsive & Polish | All files, page.tsx reorder | ~80 | TODO |

## Key Decisions
- Keep existing component structure; update styles in-place (no new files unless needed)
- Remove `next-themes` / ThemeProvider -- single light theme only
- Keep Framer Motion animations but reduce intensity for professional feel
- Image placeholders use bg-color + dimensions (no external URLs)

## Constraints
- Files must stay under 200 lines each
- No new npm dependencies needed (Roboto via next/font/google)
- TailwindCSS 4 syntax (no tailwind.config.js, use @theme inline)
