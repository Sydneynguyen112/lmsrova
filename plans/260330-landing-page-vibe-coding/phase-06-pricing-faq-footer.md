# Phase 06: Pricing, FAQ & Footer

## Context
- [Main Plan](./plan.md)
- [Phase 05: Social Proof](./phase-05-social-proof.md)
- Depends on: Phase 01 (Accordion, shared components)

## Overview
Final conversion sections: Pricing card with value stacking, FAQ for objection handling, final CTA banner, and footer. These sections close the deal. Pricing uses anchoring psychology (original price crossed out). FAQ uses Accordion from Phase 01.

## Key Insights
- Anchoring: show original price crossed out, then discounted price
- Value stacking: list everything included with estimated individual values
- FAQ handles top objections (no code experience needed, time commitment, refund)
- Vietnamese payment methods (MoMo, VNPay, ZaloPay, bank transfer) displayed as trust signals
- Final CTA banner before footer catches users who scrolled the entire page
- Footer: minimal, contact info, social links, copyright

## Requirements
1. Pricing section: single pricing card with value stack, original price struck through, CTA #4
2. FAQ section: 6-8 questions in Accordion format
3. Final CTA banner: urgency-driven last call before footer
4. Footer: contact info, social media links, payment method logos (text-based), copyright

## Architecture

### Pricing Layout
```
[SectionWrapper id="gia"]
  [Heading: "Dau Tu Cho Tuong Lai Cua Ban"]
  [Centered pricing card (max-w-lg)]
    [Badge: "Uu dai dac biet"]
    [Original price: 6.999.000d (struck through)]
    [Current price: 499.000d]
    [Value stack list:]
      - 10 chuong hoc chi tiet (gia tri: 2.000.000d)
      - Claude Super KIT (gia tri: 1.500.000d)
      - Free Claude Max (gia tri: 1.200.000d)
      - Cong dong hoc tap tron doi (gia tri: 999.000d)
      - Ho tro 1-1 (gia tri: 1.300.000d)
    [CTA button #4: "Dang Ky Ngay"]
    [Guarantee: "Hoan tien 100% trong 7 ngay"]
    [Payment logos row: MoMo, VNPay, ZaloPay, Bank Transfer]
```

### FAQ Data
```
Q1: Toi khong biet lap trinh, co hoc duoc khong? (Can I learn without coding background?)
Q2: Khoa hoc mat bao lau? (How long is the course?)
Q3: Co duoc ho tro sau khoa hoc khong? (Is there post-course support?)
Q4: Claude Super KIT la gi? (What is Claude Super KIT?)
Q5: Toi co the hoan tien khong? (Can I get a refund?)
Q6: Can thiet bi gi de hoc? (What equipment do I need?)
Q7: Khoa hoc co thoi han khong? (Is there a deadline?)
Q8: Thanh toan bang hinh thuc nao? (What payment methods?)
```

### Final CTA Layout
```
[Full-width gradient banner]
  [Heading: "San Sang Bien Y Tuong Thanh Hien Thuc?"]
  [Subheading: "Tham gia cung 100+ hoc vien khac"]
  [CTA button #5: "Bat Dau Ngay"]
```

### Footer Layout
```
[Dark background, minimal]
  [Logo/Brand | Contact email | Social links (Facebook, YouTube, Zalo)]
  [Payment methods text]
  [Copyright 2026]
```

## Related Code Files
- `src/components/sections/pricing.tsx` - CREATE
- `src/components/sections/faq.tsx` - CREATE
- `src/components/sections/final-cta.tsx` - CREATE
- `src/components/sections/footer.tsx` - CREATE
- `src/app/page.tsx` - UPDATE: add all remaining sections
- `src/lib/constants.ts` - Uses FAQ_ITEMS, COURSE_PRICE, PAYMENT_METHODS

## Implementation Steps

### Step 1: Add data to constants.ts
- `FAQ_ITEMS`: 8 items with question + answer (Vietnamese)
- `COURSE_PRICE`: originalPrice, currentPrice, currency, valueStack array
- `PAYMENT_METHODS`: array of payment method names
- `SOCIAL_LINKS`: array with name, url, icon name

### Step 2: Create pricing.tsx (~120 lines)
- `"use client"`
- SectionWrapper id="gia"
- Centered card: `max-w-lg mx-auto`
- Card: glass-card with accent border, extra padding
- Badge: "Uu dai dac biet" pill at top
- Price display: original price with `line-through text-gray-500`, current price large + bold + accent color
- Value stack: list items with Lucide `Check` icon, each with item + estimated value
- CTA button: full-width, primary variant, large
- Guarantee text: small, with shield icon
- Payment methods: row of text labels or small badges at bottom
- ScrollReveal animation

### Step 3: Create faq.tsx (~60 lines)
- `"use client"`
- SectionWrapper id="hoi-dap"
- Section heading: "Cau Hoi Thuong Gap"
- Map FAQ_ITEMS through Accordion component (from Phase 01)
- Max-width container for readability: `max-w-3xl mx-auto`
- ScrollReveal on the section

### Step 4: Create final-cta.tsx (~50 lines)
- `"use client"`
- Full-width section with gradient background (blue → violet)
- Centered text: heading + subheading + CTA button
- No SectionWrapper needed (custom bg)
- Framer Motion scale/fade animation

### Step 5: Create footer.tsx (~60 lines)
- Server component (no animations needed)
- Dark background (`bg-gray-950`)
- Flex layout: brand/logo, contact, social links
- Social icons: Lucide icons for common platforms (or text links)
- Payment methods: text list
- Copyright line: `2026 Le Bach Hiep. All rights reserved.`
- Minimal, clean

### Step 6: Update page.tsx - Final composition
- Full page order: Navbar, Hero, PainPoints, Solution, Stats, Curriculum, ClaudeKit, StudentResults, InstructorBio, Testimonials, Pricing, FAQ, FinalCTA, Footer

## Todo
- [ ] Add FAQ_ITEMS, COURSE_PRICE, PAYMENT_METHODS, SOCIAL_LINKS to constants.ts
- [ ] Create pricing.tsx with value-stacked pricing card
- [ ] Create faq.tsx with Accordion
- [ ] Create final-cta.tsx banner
- [ ] Create footer.tsx
- [ ] Update page.tsx with final section composition
- [ ] Test Accordion in FAQ works correctly
- [ ] Verify pricing card responsive on mobile
- [ ] Verify footer layout

## Success Criteria
- Pricing card shows original/discounted prices, value stack, CTA, payment methods
- FAQ accordion expands/collapses all 8 questions
- Final CTA banner is visually prominent with gradient
- Footer shows contact, socials, copyright
- Full page scrolls through all 12+ sections smoothly
- `npm run build` passes
- All nav links scroll to correct sections

## Risk Assessment
- **Payment logos**: No actual images yet; use text labels or Lucide icons as placeholders
- **Price formatting**: Ensure Vietnamese number format (dots not commas): 499.000d not 499,000d
- **Full page performance**: With 14 sections, verify no scroll jank; Framer Motion `viewport={{ once: true }}` prevents re-renders

## Security Considerations
- External social links: use `target="_blank" rel="noopener noreferrer"`
- No payment processing on this page; CTAs link to external enrollment
- No forms collecting user data in this phase

## Next Steps
Phase 07: Polish & Optimization
