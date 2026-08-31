# Phase 05: Social Proof & Instructor

## Context
- [plan.md](./plan.md) -- master plan
- Previous: [phase-04](./phase-04-curriculum-and-stats.md)
- Next: [phase-06](./phase-06-pricing-cta-faq-footer.md)

## Overview
Update StudentResults, InstructorBio, and Testimonials sections for light theme. Add image placeholders for student results and instructor photo.

## Key Insights
- Current: dark glass cards, gradient avatars with initials, emoji placeholders for screenshots
- Target: white cards with shadows, proper image placeholders (colored rectangles), clean typography
- lebachhiep.com shows student work screenshots and instructor photo

## Requirements
1. Student results: white cards, image placeholders (not emoji), tech tags
2. Instructor bio: photo placeholder, clean white card, credentials list
3. Testimonials: white cards, star ratings, avatar placeholders
4. All sections use light bg / white cards

## Architecture
```
student-results.tsx  -- white cards, image placeholders
instructor-bio.tsx   -- white card, photo placeholder
testimonials.tsx     -- white cards, light bg section
```

## Related Code Files
- `c:/Users/Administrator/LMS_ROVA/landing-page/src/components/sections/student-results.tsx` (55 lines)
- `c:/Users/Administrator/LMS_ROVA/landing-page/src/components/sections/instructor-bio.tsx` (49 lines)
- `c:/Users/Administrator/LMS_ROVA/landing-page/src/components/sections/testimonials.tsx` (59 lines)

## Implementation Steps

### 1. Update `student-results.tsx`
- Section heading: `text-[#0A083B]`, accent `text-[#175CFF]`
- Subtitle: `text-[#57586E]`
- Cards: `bg-white rounded-[12px] shadow-[0_6px_20px_rgba(0,0,0,0.06)] border border-[#EAF1F8] overflow-hidden`
- Image placeholder: `bg-[#EAF1F8] aspect-video flex items-center justify-center`
  - Text inside: `text-[#57586E] text-sm` "App Screenshot" (remove emoji)
- Title: `text-[#0A083B] font-semibold`
- Description: `text-[#57586E] text-sm`
- Tech tags: `bg-[#EAF1F8] text-[#175CFF] rounded-full px-3 py-1 text-xs`
- Remove: glass-card, gradient-to-br, emoji placeholder

### 2. Update `instructor-bio.tsx`
- Card: `bg-white rounded-[20px] shadow-[0_12px_40px_rgba(0,0,0,0.08)] border border-[#EAF1F8] p-8`
- Photo placeholder: `bg-[#EAF1F8] rounded-[12px] h-32 w-32 flex items-center justify-center`
  - Text: `text-[#57586E] text-sm` "Photo" (remove "LBH" gradient)
- Name: `text-[#0A083B] text-2xl font-bold`
- Title: `text-[#175CFF] text-sm`
- Bio text: `text-[#57586E]`
- Highlight items: `text-[#0A083B] text-sm`
- CheckCircle icon: `text-[#175CFF]` instead of text-green-400
- Remove: glass-card, gradient avatar, gradient-to-br

### 3. Update `testimonials.tsx`
- Section bg: `bg-[#F7F9FA]` instead of stats-gradient
- Heading: `text-[#0A083B]`, accent `text-[#175CFF]`
- Subtitle: `text-[#57586E]`
- Cards: `bg-white rounded-[12px] shadow-[0_6px_20px_rgba(0,0,0,0.06)] border border-[#EAF1F8] p-6`
- Stars: keep `fill-amber-400 text-amber-400` (these work on light bg)
- Quote text: `text-[#57586E]` instead of text-gray-300
- Avatar: `bg-[#175CFF] text-white rounded-full` (solid blue, no gradient)
- Name: `text-[#0A083B] font-semibold`
- Role: `text-[#57586E] text-xs`
- Remove: glass-card, stats-gradient, gradient avatar

## Todo
- [ ] Update student-results.tsx: white cards, proper placeholders, remove emoji
- [ ] Update instructor-bio.tsx: white card, photo placeholder, blue accents
- [ ] Update testimonials.tsx: white cards, light bg section, blue avatars
- [ ] Remove all gradient/glass/dark references
- [ ] Verify 2-col grid for student results on desktop, 3-col for testimonials

## Success Criteria
- All three sections use white cards with subtle shadows on light backgrounds
- Image/photo placeholders are clean rectangles with descriptive text
- Text hierarchy: navy headings, gray body, blue accents
- Stars remain amber on testimonials
- No dark theme classes remain

## Risk Assessment
- **Low**: Avatar gradient removal changes visual identity slightly
- **Low**: Emoji removal in student results is a visual improvement

## Security Considerations
- No security concerns; static content only

## Next Steps
Proceed to [Phase 06: Pricing, CTA, FAQ, Footer](./phase-06-pricing-cta-faq-footer.md)
