# Phase 02: Navbar & Hero Redesign

## Context
- [plan.md](./plan.md) -- master plan
- Previous: [phase-01](./phase-01-theme-and-design-system-overhaul.md)
- Next: [phase-03](./phase-03-benefits-and-solution.md)

## Overview
Redesign Navbar and Hero to match lebachhiep.com: white navbar with dark text, hero with large banner image area, navy title section, blue CTA, and trust stats row.

## Key Insights
- Current navbar: transparent/dark bg, white text, gradient logo
- Target navbar: white bg (always), dark navy text, solid styling, logo left / nav right
- Current hero: full-screen dark gradient bg, centered text, glow orbs, badge
- Target hero: large banner image (2560x1690 aspect), title "KHOA HOC VIBE CODING LAP TRINH AI", blue CTA below
- Real site likely has image overlaid with text or image above text section

## Requirements
1. Navbar: white bg, navy text, blue CTA button, no transparency on scroll
2. Hero: banner image placeholder with correct aspect ratio
3. Hero title in Vietnamese uppercase
4. Primary blue CTA button below hero content
5. Trust stats row (10 Chuong, 8 Gio, 0 Dong Code)

## Architecture
```
navbar.tsx -- white bg, dark text, simplified scroll behavior
hero.tsx   -- banner image + title overlay or stacked layout
constants.ts -- update HERO.headline to match real site title
```

## Related Code Files
- `c:/Users/Administrator/LMS_ROVA/landing-page/src/components/sections/navbar.tsx` (90 lines)
- `c:/Users/Administrator/LMS_ROVA/landing-page/src/components/sections/hero.tsx` (104 lines)
- `c:/Users/Administrator/LMS_ROVA/landing-page/src/lib/constants.ts` (lines 30-42, HERO object)

## Implementation Steps

### 1. Update `navbar.tsx`
- Scrolled state: `bg-white shadow-md` instead of `bg-gray-950/80 backdrop-blur`
- Not scrolled: `bg-white` (always white, not transparent)
- Logo: dark navy text `text-[#0A083B]`, "Vibe" + blue "Coding" `text-[#175CFF]`
- Nav links: `text-[#57586E] hover:text-[#175CFF]` instead of gray-400/white
- CTA button: uses updated primary Button (already blue from phase 01)
- Mobile menu: `bg-white` with dark text, border-gray-200
- Mobile hamburger icon: `text-[#0A083B]`

### 2. Update `hero.tsx`
Replace entire hero layout:
```
<section className="bg-white pt-20"> <!-- pt-20 for fixed navbar offset -->
  <Container>
    <!-- Banner image placeholder -->
    <div className="relative w-full aspect-[2560/1690] bg-[#EAF1F8] rounded-[20px] overflow-hidden flex items-center justify-center">
      <span className="text-[#57586E] text-lg">Course Banner Image (2560x1690)</span>
      <!-- Later: <Image src="/images/hero-banner.jpg" fill ... /> -->
    </div>

    <!-- Title section below image -->
    <div className="mt-10 text-center">
      <h1 className="text-3xl md:text-5xl font-bold text-[#0A083B] uppercase tracking-tight font-[family-name:var(--font-roboto-slab)]">
        Khoa Hoc Vibe Coding Lap Trinh AI
      </h1>
      <p className="mt-4 text-[#57586E] text-lg max-w-2xl mx-auto">...</p>
      <Button href="#hoc-phi" size="lg" className="mt-8">Dang Ky Ngay - Chi 499K</Button>
    </div>

    <!-- Trust stats -->
    <div className="mt-10 flex justify-center gap-8 md:gap-16">
      {stats...}
    </div>
  </Container>
</section>
```
- Remove: glow orbs, hero-gradient, grid-pattern, gradient badge, bottom fade div
- Remove: min-h-screen (let content determine height)
- Keep: Framer Motion stagger/fadeUp animations (lighter intensity)

### 3. Update `constants.ts` HERO object
```ts
export const HERO = {
  badge: "100+ hoc vien da tham gia",
  headline: "KHOA HOC VIBE CODING\nLAP TRINH AI",
  subheadline: "Ban mo ta y tuong, AI lam ra phan mem chay that...",
  cta: "Dang Ky Ngay - Chi 499K",
  trustStats: [
    { value: "10 Chuong" },
    { value: "8 Gio Hoc" },
    { value: "0 Dong Code" },
  ],
};
```

## Todo
- [ ] Rewrite navbar.tsx with white bg, dark text, blue CTA
- [ ] Rewrite hero.tsx with banner image placeholder and stacked layout
- [ ] Update HERO constant headline to match real site
- [ ] Remove dark theme classes (glow orbs, hero-gradient usage, bottom fade)
- [ ] Test mobile navbar menu with light theme
- [ ] Verify navbar fixed positioning with hero scroll

## Success Criteria
- Navbar is always white with dark text, blue CTA
- Hero shows banner image placeholder with correct aspect ratio
- Title reads "KHOA HOC VIBE CODING LAP TRINH AI" in navy
- Blue CTA button below title
- Trust stats visible below CTA
- Mobile navbar works with light theme

## Risk Assessment
- **Low**: Fixed navbar z-index may need adjustment with new bg
- **Low**: Hero height change may affect scroll anchors for other sections

## Security Considerations
- No security concerns; no user input or external data

## Next Steps
Proceed to [Phase 03: Benefits & Solution](./phase-03-benefits-and-solution.md)
