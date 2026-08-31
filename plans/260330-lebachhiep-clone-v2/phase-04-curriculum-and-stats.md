# Phase 04: Curriculum & Stats

## Context
- [plan.md](./plan.md) -- master plan
- Previous: [phase-03](./phase-03-benefits-and-solution.md)
- Next: [phase-05](./phase-05-social-proof-and-instructor.md)

## Overview
Update Stats and Curriculum sections for light theme. Clean card design with white bg, borders, and blue accent highlights.

## Key Insights
- Current stats: dark gradient bg, white numbers, blue suffix
- Target stats: light bg (#EAF1F8 or #F7F9FA), navy numbers, blue accent
- Current curriculum: glass-card accordion, dark bg, blue-violet gradients
- Target curriculum: white cards with border, clean accordion, blue accents only

## Requirements
1. Stats section with light background, large navy numbers
2. Curriculum accordion with 10 chapters across 3 modules
3. White card design with border and shadow
4. Blue accent for chapter numbers and module badges
5. Accordion component updated for light theme

## Architecture
```
stats.tsx     -- light bg, navy numbers
curriculum.tsx -- white card accordion, blue accents
accordion.tsx  -- light theme (used by FAQ too, so changes apply globally)
```

## Related Code Files
- `c:/Users/Administrator/LMS_ROVA/landing-page/src/components/sections/stats.tsx` (34 lines)
- `c:/Users/Administrator/LMS_ROVA/landing-page/src/components/sections/curriculum.tsx` (99 lines)
- `c:/Users/Administrator/LMS_ROVA/landing-page/src/components/ui/accordion.tsx` (55 lines)

## Implementation Steps

### 1. Update `stats.tsx`
- Section class: `bg-[#F7F9FA] border-y border-[#EAF1F8]` instead of `stats-gradient border-white/5`
- Number: `text-[#0A083B]` instead of `text-white`
- Suffix: `text-[#175CFF]`
- Label: `text-[#57586E]`
- Keep useCounter animation

### 2. Update `curriculum.tsx`
- Section bg: white
- Heading: `text-[#0A083B]`, accent word `text-[#175CFF]` instead of gradient-text
- Subtitle: `text-[#57586E]`
- Module card: `bg-white border border-[#EAF1F8] rounded-[12px] shadow-[0_6px_20px_rgba(0,0,0,0.06)]` instead of glass-card
- Module header button: `hover:bg-[#F7F9FA]` instead of hover:bg-white/[0.03]
- Open state: `bg-[#F7F9FA]` instead of bg-white/5
- BookOpen icon: `text-[#175CFF]`
- Module title: `text-[#0A083B] font-semibold`
- Badge: `bg-[#EAF1F8] text-[#175CFF]` instead of bg-blue-500/10 text-blue-400
- Chapter number: `bg-[#EAF1F8] text-[#175CFF]` (solid, no gradient)
- Chapter title: `text-[#0A083B]`
- Chapter desc: `text-[#57586E]`
- Divider: `border-[#EAF1F8]` instead of border-white/5
- ChevronDown: `text-[#57586E]`

### 3. Update `accordion.tsx`
This is shared between Curriculum and FAQ, so style for light theme:
- Container: `bg-white border border-[#EAF1F8] rounded-[9px]` instead of `border-white/10 bg-white/5`
- Question text: `text-[#0A083B] hover:text-[#175CFF]` instead of text-gray-100
- Open state text: `text-[#175CFF]`
- Answer text: `text-[#57586E]` instead of text-gray-400
- ChevronDown: `text-[#57586E]`

## Todo
- [ ] Update stats.tsx: light bg, navy numbers, blue suffix
- [ ] Update curriculum.tsx: white cards, blue accents, remove glass-card/gradients
- [ ] Update accordion.tsx: light theme styling (affects FAQ too)
- [ ] Remove stats-gradient class usage
- [ ] Verify curriculum accordion expand/collapse still works
- [ ] Verify useCounter hook works with new color scheme

## Success Criteria
- Stats section has light background with large navy numbers
- Curriculum shows clean white cards with blue chapter numbers
- Accordion opens/closes smoothly with light theme colors
- No dark theme remnants (glass-card, white/5, gray-950)

## Risk Assessment
- **Medium**: Accordion changes affect FAQ section too -- must verify FAQ still looks correct (will be finalized in phase 06)
- **Low**: useCounter hook has no color dependencies, should work unchanged

## Security Considerations
- No security concerns; static content only

## Next Steps
Proceed to [Phase 05: Social Proof & Instructor](./phase-05-social-proof-and-instructor.md)
