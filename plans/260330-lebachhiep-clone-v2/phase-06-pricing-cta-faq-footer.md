# Phase 06: Pricing, CTA, FAQ, Footer

## Context
- [plan.md](./plan.md) -- master plan
- Previous: [phase-05](./phase-05-social-proof-and-instructor.md)
- Next: [phase-07](./phase-07-responsive-and-polish.md)

## Overview
Update Pricing, FinalCTA, FAQ, and Footer for light theme. Add urgency mechanics (limited spots), lead capture form, and proper pricing display (6.999K crossed -> 499K).

## Key Insights
- Current pricing: dark card with gradient border, amber badge, gray-950 bg
- Target: white card with blue border/accent, clean pricing display, urgency copy
- Current CTA: dark bg with glow orb, gradient text
- Target: light bg or navy bg section, clean CTA with urgency
- FAQ: accordion already updated in phase 04, just verify section wrapper
- Footer: dark footer is acceptable on light sites, but should match lebachhiep.com style

## Requirements
1. Pricing card: strikethrough 6.999K, bold 499K, blue CTA, feature list
2. Urgency: "Chi con X slot" or countdown (optional, copy-based is simpler)
3. Lead capture: email/phone input + submit button (above or near pricing)
4. FAQ: section wrapper light theme verification
5. Footer: contact info, payment methods, navy or dark bg acceptable

## Architecture
```
pricing.tsx   -- white card, blue accents, urgency copy
final-cta.tsx -- urgency CTA, lead capture form
faq.tsx       -- verify light theme (accordion updated in phase 04)
footer.tsx    -- navy bg footer, contact info, payment methods
```

## Related Code Files
- `c:/Users/Administrator/LMS_ROVA/landing-page/src/components/sections/pricing.tsx` (78 lines)
- `c:/Users/Administrator/LMS_ROVA/landing-page/src/components/sections/final-cta.tsx` (39 lines)
- `c:/Users/Administrator/LMS_ROVA/landing-page/src/components/sections/faq.tsx` (30 lines)
- `c:/Users/Administrator/LMS_ROVA/landing-page/src/components/sections/footer.tsx` (46 lines)

## Implementation Steps

### 1. Update `pricing.tsx`
- Outer card: `bg-white rounded-[20px] shadow-[0_12px_40px_rgba(0,0,0,0.08)] border-2 border-[#175CFF] p-1`
- Sale badge: `bg-[#DD3333] text-white` (red accent, not amber/orange gradient)
- Inner content: `bg-white p-8 rounded-[16px]`
- Original price: `text-[#57586E] line-through text-lg` (show "6.999.000d")
- Sale price: `text-[#0A083B] text-5xl font-extrabold` (show "499.000d")
- Subtext: `text-[#57586E]` "Thanh toan mot lan - Truy cap tron doi"
- Divider: `border-[#EAF1F8]`
- Feature list: `text-[#0A083B] text-sm` with `CheckCircle text-[#175CFF]`
- CTA button: primary blue (already styled)
- Urgency line: add `<p className="text-[#DD3333] text-sm font-semibold mt-4 text-center">Chi con 15 slot gia uu dai!</p>`
- Refund note: `text-[#57586E] text-xs`
- Remove: gradient border, gradient badge, gray-950 bg, green checkmarks

### 2. Update `final-cta.tsx`
- Section bg: `bg-[#0A083B]` (navy dark section for contrast) or `bg-[#175CFF]`
- Heading: `text-white text-3xl font-bold`
- Subtitle: `text-white/80`
- Remove: glow orb, gradient-text
- Add lead capture form:
```tsx
<div className="mt-8 flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
  <input
    type="tel"
    placeholder="So dien thoai cua ban"
    className="flex-1 rounded-[9px] border border-white/20 bg-white/10 px-4 py-3 text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-white/30"
  />
  <Button size="md" className="bg-white text-[#175CFF] hover:bg-white/90 whitespace-nowrap">
    Nhan Tu Van
  </Button>
</div>
```
- Keep dual CTA buttons (register + view curriculum)

### 3. Verify `faq.tsx`
- Section heading: `text-[#0A083B]`, accent `text-[#175CFF]`
- Subtitle: `text-[#57586E]`
- Accordion styling already handled in phase 04
- Remove: gradient-text class usage
- Minimal changes expected

### 4. Update `footer.tsx`
- Footer bg: `bg-[#0A083B]` (navy, matching lebachhiep.com style)
- Logo: `text-white` with `text-[#175CFF]` accent
- Payment badges: `border-white/20 text-white/70`
- Contact info: `text-white/70` (remove emoji, use text)
- Copyright: `text-white/40`
- Remove: bg-gray-950/50, border-white/5

## Todo
- [ ] Rewrite pricing.tsx: white card, blue border, red sale badge, urgency line
- [ ] Rewrite final-cta.tsx: navy bg, white text, lead capture form input
- [ ] Verify faq.tsx: update heading colors, remove gradient-text
- [ ] Rewrite footer.tsx: navy bg, clean layout
- [ ] Add urgency copy to pricing ("Chi con X slot")
- [ ] Test lead capture form input styling (no backend needed yet)

## Success Criteria
- Pricing card is white with blue border, shows strikethrough 6.999K -> 499K
- Red "Giam 93%" badge visible
- Urgency text in red below CTA
- Final CTA section has navy bg with lead capture input
- FAQ section clean with light accordion
- Footer is navy with white text

## Risk Assessment
- **Low**: Lead capture form is frontend-only; no backend submission logic yet
- **Low**: Navy bg for CTA/footer contrasts well with light page but needs careful text contrast
- **Medium**: Phone input has no validation -- acceptable for now, add in future

## Security Considerations
- Lead capture form: no submission handler yet; when implemented, sanitize phone input
- No XSS risk since form doesn't submit anywhere currently

## Next Steps
Proceed to [Phase 07: Responsive & Polish](./phase-07-responsive-and-polish.md)
