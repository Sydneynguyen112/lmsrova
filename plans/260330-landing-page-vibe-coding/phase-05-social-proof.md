# Phase 05: Social Proof

## Context
- [Main Plan](./plan.md)
- [Phase 04: Curriculum & KIT](./phase-04-curriculum-and-kit.md)
- Depends on: Phase 01 (shared components)

## Overview
Three social proof sections: Student Results (apps built), Instructor Bio (credentials), Testimonials (reviews). Social proof near CTAs = 35% conversion lift. This is the trust-building core of the page.

## Key Insights
- Vietnamese audience heavily weights instructor credentials (research)
- Real names + photos in testimonials critical for Vietnamese market
- Student results should show tangible outputs (app screenshots/descriptions)
- Testimonials with specific outcomes > generic praise
- Community emphasis resonates with Vietnamese collective learning culture
- Use placeholder avatars (gradient circles with initials) until real photos provided

## Requirements
1. Student Results: gallery/grid of apps students have built
2. Instructor Bio: photo placeholder, credentials, experience highlights
3. Testimonials: grid of review cards with name, role, quote, avatar
4. CTA button #3 after testimonials

## Architecture

### Student Results Layout
```
[SectionWrapper id="ket-qua"]
  [Heading: "Hoc Vien Da Tao Ra Nhung Gi?"]
  [Grid 2x2 or carousel]
    [Result card: app name + description + tech tags + gradient placeholder image]
```

### Instructor Bio Layout
```
[SectionWrapper id="giang-vien"]
  [Two-column layout (stack on mobile)]
    [Left: Avatar placeholder + social links]
    [Right: Name, title, bio text, credential badges]
      - 13 nam kinh nghiem lap trinh
      - Da dao tao 100+ hoc vien
      - Chuyen gia AI & Vibe Coding
```

### Testimonials Layout
```
[SectionWrapper id="danh-gia"]
  [Heading: "Hoc Vien Noi Gi?"]
  [Grid 1x3 (responsive)]
    [Testimonial card: avatar + name + role + stars + quote] x 6
  [CTA button #3]
```

## Related Code Files
- `src/components/sections/student-results.tsx` - CREATE
- `src/components/sections/instructor-bio.tsx` - CREATE
- `src/components/sections/testimonials.tsx` - CREATE
- `src/app/page.tsx` - UPDATE
- `src/lib/constants.ts` - Uses STUDENT_RESULTS, INSTRUCTOR, TESTIMONIALS data

## Implementation Steps

### Step 1: Add data to constants.ts
- `STUDENT_RESULTS`: 4 items with appName, description, techTags array
- `INSTRUCTOR`: name, title, bio, credentials array, socialLinks
- `TESTIMONIALS`: 6 items with name, role, quote, rating (1-5)

### Step 2: Create student-results.tsx (~80 lines)
- `"use client"`
- SectionWrapper id="ket-qua"
- Grid: `grid-cols-1 sm:grid-cols-2 gap-6`
- Each card: gradient placeholder (simulating app screenshot), app name, description, tech tag pills
- Tags: small rounded badges showing tech stack (e.g., "Next.js", "AI", "Database")
- Cards stagger-animate with ScrollReveal
- Gradient placeholders: different color gradients per card for visual variety

### Step 3: Create instructor-bio.tsx (~100 lines)
- `"use client"`
- SectionWrapper id="giang-vien"
- Two-column flex layout: `flex-col lg:flex-row gap-12 items-center`
- Left column: large avatar placeholder (gradient circle with initials "LBH"), social icon links below
- Right column: H2 name, title/role, bio paragraph, credential list with check icons
- Credentials rendered as badge-like items with Lucide `CheckCircle` icon
- ScrollReveal on the whole section

### Step 4: Create testimonials.tsx (~100 lines)
- `"use client"`
- SectionWrapper id="danh-gia"
- Grid: `grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6`
- Each card: glass-card, avatar (gradient circle + initials), name, role, star rating (Lucide `Star` filled), quote in italic
- Cards stagger-animate
- CTA button #3 below the grid: "Tham Gia Ngay" (Join Now)

### Step 5: Update page.tsx
- Add StudentResults, InstructorBio, Testimonials after ClaudeKit

## Todo
- [ ] Add STUDENT_RESULTS, INSTRUCTOR, TESTIMONIALS to constants.ts
- [ ] Create student-results.tsx with app showcase grid
- [ ] Create instructor-bio.tsx with two-column layout
- [ ] Create testimonials.tsx with review cards + CTA
- [ ] Update page.tsx
- [ ] Test responsive layouts (mobile single-col, desktop multi-col)
- [ ] Verify avatar placeholders render consistently

## Success Criteria
- 4 student result cards displayed in responsive grid
- Instructor bio shows credentials with two-column layout
- 6 testimonial cards with names, roles, ratings, quotes
- CTA #3 present after testimonials
- All sections animate on scroll
- Responsive: stacks to single column on mobile
- `npm run build` passes

## Risk Assessment
- **Placeholder images**: Gradient circles are fine for MVP; real photos needed before launch
- **Testimonial authenticity**: Use realistic Vietnamese names and specific outcomes in placeholder data
- **Card height inconsistency**: Quote length varies; use `min-h` or truncation strategy

## Security Considerations
- If real testimonial photos are added later, ensure they're optimized and served from same origin (no external hotlinking)
- No user-generated content; all testimonials are curated

## Next Steps
Phase 06: Pricing, FAQ & Footer
