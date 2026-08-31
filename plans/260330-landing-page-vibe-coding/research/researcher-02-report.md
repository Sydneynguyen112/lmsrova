---
title: Tech Stack & Implementation Research
date: 2026-03-30
---

## Tech Stack Comparison

### Astro vs Next.js vs Plain HTML
**Verdict: Use Astro for pure landing page focus.**

**Astro:**
- 40% faster load times, 90% less JavaScript than Next.js
- Default static HTML rendering (zero JS unless explicit)
- Perfect for content-focused, SEO-heavy pages
- 8KB homepage bundle vs Next.js's 85KB
- Zero hydration overhead

**Next.js:**
- Best when adding future features (e.g., forms, admin panel)
- React Server Components closing performance gap
- Overkill for static landing pages; includes React runtime bloat
- Strong ecosystem and ecosystem integrations

**Plain HTML/CSS/JS:**
- No build overhead; maximal control
- Steeper learning curve for animations
- Not recommended; Astro provides better DX

**Recommendation:** Astro + TailwindCSS 4 as base stack.

---

## Animation Libraries

### Scroll Effects Strategy
**Best Practice:** Hybrid approach

1. **CSS-only:** Use `scroll-behavior: smooth`, `@view-transition`, CSS animations for 80% of needs (performant, no JS overhead)
2. **Framer Motion:** useScroll for parallax; whileInView for viewport triggers; best for React-heavy interactions
3. **AOS (Animate on Scroll):** Lightweight alternative if not using React; ~4KB minified
4. **GSAP:** Enterprise-grade; overkill for landing pages unless complex timeline animations needed

**For landing page:** CSS animations + Framer Motion's `whileInView` covers all cases. Avoid GSAP complexity.

---

## Deployment Strategy

### Free Tier Ranking
1. **Cloudflare Pages:** Unlimited bandwidth (game-changer), instant global edge deployment
2. **Vercel:** 100GB/month, 100k serverless calls; best Next.js integration
3. **Netlify:** 100GB/month, reduced to 100 build minutes (down from 300)

**Recommendation:** Cloudflare Pages. Zero-cost scaling, fastest edge network globally.

---

## Core Web Vitals Optimization

### Critical Checklist
- **LCP (Largest Contentful Paint):** Never lazy-load LCP image; preload critical fonts
- **Font Strategy:** Use `font-display: swap`, preload via `<link rel="preload">`, subset icon fonts
- **Image Format:** WebP/AVIF over JPEG; compress aggressively
- **Load Order:** Critical CSS → Fonts → Above-fold images → Deferred scripts
- **Avoid:** 16% of pages still lazy-load LCP images (common mistake)

Astro handles 90% automatically via static HTML generation.

---

## Component Patterns (TailwindCSS)

### Essential Components
1. **Accordion FAQ:** Flowbite/Preline provide headless components
2. **Testimonial Carousel:** Embla or Swiper.js (~10KB), minimal JS
3. **Pricing Cards:** Grid-based, shadow/border variations via Tailwind
4. **Stats Counter:** CSS counters or JS counter-up animation
5. **Responsive Video Embed:** CSS aspect-ratio wrapper (`aspect-video`)

**Library:** Use Tailwind Plus (500+ pre-built components) or Flowbite (open-source alternative).

---

## Vietnamese SEO Implementation

### Meta Tags
- Title: 50-60 chars, keyword-first (Vietnamese diacritics matter)
- Description: 150-160 chars, clear CTA
- Open Graph: `og:title`, `og:description`, `og:image`, `og:type`

### Structured Data (JSON-LD)
```json
{
  "@context": "https://schema.org",
  "@type": "Course",
  "name": "Lập trình Web với Vibe",
  "description": "...",
  "provider": { "@type": "Organization", "name": "LeBach Hiep" },
  "courseMode": "Online",
  "duration": "PT40H"
}
```

### Vietnamese-Specific
- Hyphens in Vietnamese compound words (e.g., lập-trình)
- Use `lang="vi"` HTML attribute
- Vietnamese agencies report 25% CTR boost from schema markup

---

## Recommended Tech Stack

```
Framework:    Astro
Styling:      TailwindCSS 4
UI Library:   Flowbite (accordion, carousel)
Animations:   CSS + Framer Motion (React wrapper)
Images:       next/image equivalent or sharp CLI
Deployment:   Cloudflare Pages
CMS (optional): Sanity.io or Markdoc for content updates
```

## Implementation Priority

1. Astro site with TailwindCSS layout
2. Add Flowbite components (accordion, pricing)
3. Integrate Framer Motion for scroll effects
4. JSON-LD schema markup for SEO
5. Deploy to Cloudflare Pages (0 cost, 0 latency)

---

## Unresolved Questions

- Vietnamese language-specific font subsetting strategy?
- Astro + form handling (contact form, email capture) approach?
- Analytics integration for Vietnamese market tracking?
