# Phase 04: Curriculum & Claude Super KIT

## Context
- [Main Plan](./plan.md)
- [Phase 03: Solution & Stats](./phase-03-solution-and-stats.md)
- Depends on: Phase 01 (Accordion component, constants)

## Overview
Curriculum section shows the 10-chapter course structure organized in 3 modules. Claude Super KIT section showcases the tools/resources included with enrollment. Both are content-heavy sections that need clear hierarchy and expandable UI.

## Key Insights
- Accordion/expandable UI prevents information overload
- 3-module grouping (Foundation, Implementation, Polish) creates clear learning path
- Claude Super KIT is a differentiator; display as feature cards with descriptions
- These sections answer "What will I learn?" and "What do I get?" - critical for conversion

## Requirements
1. Curriculum: 3 modules with expandable chapter lists (using Accordion from Phase 01)
2. Claude Super KIT: feature cards grid showing 4-6 tools included
3. Both sections use ScrollReveal for entrance animations

## Architecture

### Curriculum Layout
```
[SectionWrapper id="noi-dung"]
  [Heading: "Noi Dung Khoa Hoc"]
  [Subheading: "10 chuong, 3 module, tu zero den hero"]
  [Module 1: Nen Tang (Foundation) - Chapters 1-3]
    [Accordion items for each chapter]
  [Module 2: Thuc Hanh (Implementation) - Chapters 4-7]
    [Accordion items for each chapter]
  [Module 3: Hoan Thien (Polish) - Chapters 8-10]
    [Accordion items for each chapter]
```

### Curriculum Data Structure
```ts
Module 1 - Nen Tang (Foundation):
  Ch1: Gioi thieu Vibe Coding & AI (Intro to Vibe Coding & AI)
  Ch2: Cai dat moi truong & cong cu (Setup environment & tools)
  Ch3: Prompt Engineering co ban (Basic Prompt Engineering)

Module 2 - Thuc Hanh (Implementation):
  Ch4: Xay dung ung dung dau tien (Build first app)
  Ch5: Lam viec voi database (Working with database)
  Ch6: Giao dien nguoi dung (User interface)
  Ch7: Tich hop API & dich vu (API & service integration)

Module 3 - Hoan Thien (Polish):
  Ch8: Testing & debugging voi AI (Testing & debugging with AI)
  Ch9: Deploy len production (Deploy to production)
  Ch10: Bao tri & mo rong (Maintenance & scaling)
```

### Claude Super KIT Layout
```
[SectionWrapper id="cong-cu"]
  [Heading: "Claude Super KIT"]
  [Subheading: "Bo cong cu AI manh me di kem khoa hoc"]
  [Grid 2x2 or 2x3]
    [Card: Brainstorming KIT]
    [Card: Planning KIT]
    [Card: Coding KIT]
    [Card: Debugging KIT]
    [Card: Free Claude Max access]
    [Card: Lifetime community access]
```

## Related Code Files
- `src/components/sections/curriculum.tsx` - CREATE
- `src/components/sections/claude-kit.tsx` - CREATE
- `src/app/page.tsx` - UPDATE: add Curriculum + ClaudeKit
- `src/lib/constants.ts` - Uses CURRICULUM, CLAUDE_KIT_FEATURES data
- `src/components/ui/accordion.tsx` - From Phase 01

## Implementation Steps

### Step 1: Create curriculum.tsx (~120 lines)
- `"use client"`
- SectionWrapper id="noi-dung"
- Section heading + subheading with ScrollReveal
- Map over 3 modules from CURRICULUM constant
- Each module: colored badge (Module 1/2/3), module title, chapter count
- Chapters rendered as Accordion items within each module
- Each accordion item shows: chapter number, title, brief description, duration estimate
- Modules stagger-animate with ScrollReveal
- Optional: module progress icons (checkmark-style for visual flow)

### Step 2: Create claude-kit.tsx (~90 lines)
- `"use client"`
- SectionWrapper id="cong-cu"
- Section heading + subheading
- Responsive grid: `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6`
- Each card: glass-card style, icon (Lucide), title, description, highlight badge
- Icons: `Brain` (brainstorm), `ClipboardList` (plan), `Code2` (code), `Bug` (debug), `Zap` (Claude Max), `Users` (community)
- Cards animate with stagger via ScrollReveal
- Highlight the "Free Claude Max" card with accent border/glow

### Step 3: Update page.tsx
- Add Curriculum and ClaudeKit after Stats

## Todo
- [ ] Add CURRICULUM and CLAUDE_KIT_FEATURES to constants.ts
- [ ] Create curriculum.tsx with 3 modules + accordion chapters
- [ ] Create claude-kit.tsx with feature cards grid
- [ ] Update page.tsx
- [ ] Test accordion expand/collapse behavior
- [ ] Verify mobile layout (single column)
- [ ] Verify all Vietnamese text renders correctly

## Success Criteria
- 3 modules displayed with expandable chapter lists
- Accordion opens/closes smoothly with height animation
- Claude KIT shows 6 feature cards in responsive grid
- "Free Claude Max" card is visually distinguished
- ScrollReveal animations trigger on scroll
- `npm run build` passes

## Risk Assessment
- **Accordion state management**: Keep it simple with local useState per accordion group; no need for global state
- **Content length**: Vietnamese descriptions may vary in length; use `line-clamp` or min-height for card consistency
- **Accordion accessibility**: Ensure proper aria attributes (aria-expanded, role="button")

## Security Considerations
- No user input; static content only

## Next Steps
Phase 05: Social Proof (Student Results, Instructor Bio, Testimonials)
