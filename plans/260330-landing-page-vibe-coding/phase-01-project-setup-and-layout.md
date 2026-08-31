# Phase 01: Project Setup & Layout

## Context
- [Main Plan](./plan.md)
- [Research: Design Patterns](./research/researcher-01-report.md)
- [Research: Tech Stack](./research/researcher-02-report.md)

## Overview
Set up the foundation: Vietnamese locale, SEO metadata, JSON-LD schema, color theme, shared UI components, and sticky navbar. Everything downstream depends on this phase.

## Key Insights
- `lang="vi"` is critical for Vietnamese SEO (25% CTR boost from schema markup per research)
- Dark gradient background is standard for tech/AI course landing pages
- Sticky navbar with CTA increases scroll-depth conversion
- Geist font already loaded; works well for both Latin and Vietnamese diacritics
- TailwindCSS 4 uses `@theme inline` block for custom properties (already in globals.css)
- Next.js 16 may have breaking changes; consult `node_modules/next/dist/docs/` before coding

## Requirements
1. Update `layout.tsx`: `lang="vi"`, Vietnamese metadata, Open Graph tags, JSON-LD Course schema
2. Update `globals.css`: dark theme colors, gradient utilities, section spacing
3. Create shared UI: Button, Container, SectionWrapper, Accordion
4. Create Navbar with smooth-scroll links, sticky behavior, mobile hamburger, CTA button
5. Create `constants.ts` for all course data (centralized content)
6. Create `scroll-reveal.tsx` animation wrapper (reused by all sections)

## Architecture

### Color Theme (Dark-first)
```
Background:   #0a0a0a → #111827 (dark gradient)
Primary:      #3b82f6 (blue-500, trust/tech)
Accent:       #8b5cf6 (violet-500, AI/innovation)
CTA:          #f59e0b → #f97316 (amber→orange gradient, urgency)
Text:         #f9fafb (gray-50)
Text muted:   #9ca3af (gray-400)
Card bg:      #1f2937 (gray-800) with border #374151 (gray-700)
```

### JSON-LD Schema
```json
{
  "@context": "https://schema.org",
  "@type": "Course",
  "name": "Vibe Coding - Bien Y Tuong Thanh Phan Mem Bang AI",
  "description": "Khoa hoc Vibe Coding - Lap trinh bang AI khong can viet code",
  "provider": { "@type": "Person", "name": "Le Bach Hiep" },
  "courseMode": "Online",
  "numberOfCredits": "10",
  "timeRequired": "PT8H",
  "offers": { "@type": "Offer", "price": "499000", "priceCurrency": "VND" }
}
```

## Related Code Files
- `src/app/layout.tsx` - UPDATE: lang, metadata, JSON-LD
- `src/app/globals.css` - UPDATE: theme colors, utilities
- `src/app/page.tsx` - UPDATE: compose sections (later phases)
- `src/components/ui/button.tsx` - CREATE
- `src/components/ui/container.tsx` - CREATE
- `src/components/ui/section-wrapper.tsx` - CREATE
- `src/components/ui/accordion.tsx` - CREATE
- `src/components/sections/navbar.tsx` - CREATE
- `src/components/animations/scroll-reveal.tsx` - CREATE
- `src/lib/constants.ts` - CREATE

## Implementation Steps

### Step 1: Update layout.tsx
- Change `lang="en"` to `lang="vi"`
- Add comprehensive Metadata export: title, description, keywords (Vietnamese), openGraph, twitter card
- Add JSON-LD script tag in `<head>` via metadata.other or a Script component
- Keep ThemeProvider but set `defaultTheme="dark"` (dark-first design)
- Keep Geist fonts (they support Vietnamese diacritics)

### Step 2: Update globals.css
- Replace light-mode `:root` vars with dark theme palette
- Add CSS custom properties for gradients, section padding
- Add smooth scroll: `html { scroll-behavior: smooth; }`
- Add utility classes: `.gradient-text`, `.glass-card` (backdrop-blur)
- Define section spacing tokens (`--section-py: 5rem`)

### Step 3: Create constants.ts
- Export `NAV_LINKS` array (section IDs + Vietnamese labels)
- Export `PAIN_POINTS` array (icon name + title + description)
- Export `STATS` array (value, suffix, label)
- Export `CURRICULUM` (3 modules, each with chapters)
- Export `CLAUDE_KIT_FEATURES` array
- Export `TESTIMONIALS` array (name, role, quote, avatar placeholder)
- Export `FAQ_ITEMS` array (question + answer)
- Export `COURSE_PRICE` object
- All content in Vietnamese

### Step 4: Create shared UI components
**Button** (~40 lines): variant prop (primary/secondary/ghost), size prop, gradient CTA style, Framer Motion whileHover/whileTap scale
**Container** (~15 lines): max-w-7xl mx-auto px-4 wrapper
**SectionWrapper** (~25 lines): section tag with id, py spacing, optional background variant
**Accordion** (~60 lines): collapsible panel with Framer Motion height animation, Lucide ChevronDown icon

### Step 5: Create scroll-reveal.tsx
- Wrapper using Framer Motion `motion.div` with `whileInView`
- Props: direction (up/down/left/right), delay, duration
- `viewport={{ once: true, margin: "-100px" }}` to trigger slightly before visible
- Default: fade-in + slide-up

### Step 6: Create Navbar
- Sticky (`sticky top-0 z-50`) with backdrop-blur glass effect
- Logo/brand text on left
- Nav links (smooth scroll via `href="#section-id"`) - hidden on mobile
- CTA button on right ("Dang Ky Ngay" / Register Now)
- Mobile: hamburger menu with slide-down menu panel
- Background becomes more opaque on scroll (useEffect + scroll listener)
- All links use Vietnamese labels from constants

## Todo
- [ ] Update layout.tsx with lang="vi", metadata, JSON-LD
- [ ] Update globals.css with dark theme + utilities
- [ ] Create constants.ts with all Vietnamese content
- [ ] Create Button component
- [ ] Create Container component
- [ ] Create SectionWrapper component
- [ ] Create Accordion component
- [ ] Create scroll-reveal.tsx animation wrapper
- [ ] Create Navbar with sticky + mobile menu
- [ ] Verify `npm run build` passes with no errors

## Success Criteria
- `npm run build` succeeds
- Page renders with dark background, sticky navbar visible
- Smooth scroll works when clicking nav links
- Mobile hamburger menu opens/closes
- All Vietnamese text renders correctly with diacritics
- JSON-LD visible in page source

## Risk Assessment
- **Next.js 16 breaking changes**: Consult `node_modules/next/dist/docs/` for metadata API changes before coding
- **Font Vietnamese diacritics**: Geist supports Latin Extended; verify rendering of characters like `Ứ, ổ, ẫ`
- **TailwindCSS 4 syntax**: Uses `@theme inline` block, not `tailwind.config.js`; extend colors via CSS variables

## Security Considerations
- No user input in this phase; minimal attack surface
- Ensure no sensitive data in constants.ts (all public marketing content)

## Next Steps
Phase 02: Hero & Pain Points sections
