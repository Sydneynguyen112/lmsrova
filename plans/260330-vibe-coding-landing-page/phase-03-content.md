# Phase 3: Content Enhancement

## Context

- **Parent:** [plan.md](./plan.md)
- **Dependencies:** [Phase 2](./phase-02-missing-ui.md) (carousel component for testimonials)
- **Docs:** [Research 1](./research/researcher-01-report.md)

## Overview

- **Date:** 2026-03-30
- **Priority:** P1
- **Status:** Pending
- **Description:** Add more testimonials, instructor photo/avatar, student project gallery, and partner/media logos.

## Key Insights

1. Only 3 testimonials currently -- research recommends 5-8 for credibility.
2. Instructor section uses text "LBH" initials instead of a real photo -- significantly reduces trust.
3. No visual proof of student outcomes (screenshots, project demos).
4. Research: "Warm imagery (instructor photos, diverse learner groups) over stock photos."

## Requirements

1. Expand testimonials to 6-8 entries with diverse roles
2. Add instructor photo (or high-quality placeholder avatar)
3. Add student project showcase section (screenshots/mockups)
4. Add partner/tool logos section

## Architecture

```
src/lib/constants.ts              -- add more testimonials, project gallery data
src/components/sections/
  instructor-bio.tsx              -- add photo via next/image
  student-projects.tsx            -- new section
  partner-logos.tsx               -- new section (optional)
src/components/sections/testimonials.tsx -- uses expanded data

public/images/
  instructor.jpg                  -- instructor photo (needs asset)
  projects/                       -- student project screenshots
```

## Related Code Files

- `landing-page/src/lib/constants.ts` -- TESTIMONIALS array (3 items), INSTRUCTOR object
- `landing-page/src/components/sections/instructor-bio.tsx` -- initials avatar at line 24-26
- `landing-page/src/components/sections/testimonials.tsx`
- `landing-page/src/app/page.tsx` -- section ordering

## Implementation Steps

### 1. Expand Testimonials

Add 3-5 more testimonials to `TESTIMONIALS` in `constants.ts`:
- Vary roles: startup founder, freelancer, teacher, accountant, designer
- Vary outcomes: SaaS tool, internal dashboard, portfolio site, automation script
- Keep quotes concise (2-3 sentences)
- Add optional `avatar` field to `Testimonial` interface for future photo support

### 2. Instructor Photo

In `instructor-bio.tsx`, replace the initials circle with `next/image`:
```
<Image
  src="/images/instructor.jpg"
  alt="Le Bach Hiep"
  width={112}
  height={112}
  className="rounded-full object-cover"
/>
```

Fallback: if no photo available, keep current initials avatar but improve it:
- Add a subtle gradient border ring
- Increase size slightly
- Add a verified badge icon overlay

Create `public/images/` directory. Add placeholder or request real photo from client.

### 3. Student Project Showcase

Create `student-projects.tsx` section:
- Grid of 4-6 project cards
- Each card: screenshot thumbnail, project name, student name, tech used
- Hover: subtle zoom on image
- Place between `StudentResults` and `InstructorBio` in page.tsx

Data structure in constants:
```
interface StudentProject {
  title: string;
  student: string;
  image: string;       // path to screenshot
  description: string;
  tags: string[];      // ["Desktop App", "Go + Wails"]
}
```

If no real screenshots available: use styled placeholder cards with icon + description (similar to current StudentResults but with visual emphasis).

### 4. Partner/Tool Logos Strip (Optional)

Simple horizontal logo strip showing tools taught in course:
- Claude, Cursor, Vercel, GitHub, Supabase
- Grayscale logos, hover to color
- Place after hero tech carousel or before testimonials
- Note: `TechCarousel` already exists -- this might be redundant. Evaluate whether to enhance TechCarousel instead.

Decision: Skip this if TechCarousel is sufficient. Focus on steps 1-3.

## Todo List

- [ ] Add 3-5 more testimonials to `TESTIMONIALS` in constants.ts
- [ ] Add `avatar?: string` field to `Testimonial` interface
- [ ] Create `public/images/` directory
- [ ] Add instructor photo (or request from client)
- [ ] Update `instructor-bio.tsx` to use `next/image` with photo
- [ ] Add fallback for missing instructor photo (improved initials)
- [ ] Create `StudentProject` interface and data in constants.ts
- [ ] Create `student-projects.tsx` section component
- [ ] Add `StudentProjects` to page.tsx between StudentResults and InstructorBio
- [ ] Create or source 4-6 project screenshot images
- [ ] Evaluate TechCarousel vs separate partner logos -- decide skip/keep

## Success Criteria

- 6+ testimonials visible in carousel
- Instructor section shows real photo (or polished placeholder)
- Student projects section renders with at least 4 cards
- All images use `next/image` with proper dimensions
- No CLS from image loading (explicit width/height)

## Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| No real instructor photo available | Reduced trust | Create polished avatar with gradient + verified badge |
| No real student project screenshots | Section feels fake | Use styled placeholder cards with descriptions; add screenshots later |
| Too many sections makes page long | Fatigue, lower conversion | Keep project showcase compact (max 6 cards); use "show more" toggle if needed |

## Security Considerations

- Images served from `public/` -- no dynamic user uploads
- Student names in testimonials should be verified or anonymized with consent
- No PII beyond first name + role

## Next Steps

Proceed to [Phase 4: Third-Party Integrations](./phase-04-integrations.md).
