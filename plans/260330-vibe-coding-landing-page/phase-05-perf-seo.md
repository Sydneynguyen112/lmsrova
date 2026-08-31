# Phase 5: Performance & SEO Optimization

## Context

- **Parent:** [plan.md](./plan.md)
- **Dependencies:** [Phase 3](./phase-03-content.md) (images must exist before optimizing)
- **Docs:** [Research 2](./research/researcher-02-report.md)

## Overview

- **Date:** 2026-03-30
- **Priority:** P1
- **Status:** Pending
- **Description:** Optimize images with next/image, add OG images, Vietnamese meta tags, sitemap, and improve Core Web Vitals.

## Key Insights

1. Current `public/` has only default Next.js SVGs -- no optimized images at all.
2. No Open Graph image set -- social shares show no preview.
3. Structured data exists but has wrong price. Vietnamese SEO requires diacritical keywords.
4. No sitemap.xml or robots.txt configured.
5. Research: "Host server in Vietnam/nearby. FCP <1.5s, LCP <2.5s, CLS <0.1."

## Requirements

1. All images use `next/image` with explicit dimensions
2. OG image (1200x630) for social sharing
3. Complete Vietnamese meta tags
4. Sitemap.xml generation
5. robots.txt
6. Lighthouse mobile score 90+

## Architecture

```
src/app/
  layout.tsx          -- enhanced metadata, OG image
  sitemap.ts          -- Next.js sitemap generation
  robots.ts           -- Next.js robots.txt generation
  opengraph-image.tsx -- dynamic OG image (or static)
public/images/
  og-cover.jpg        -- fallback OG image
```

## Related Code Files

- `landing-page/src/app/layout.tsx` -- metadata object, structured data
- `landing-page/next.config.ts` -- image domains, redirects
- `landing-page/src/components/sections/instructor-bio.tsx` -- image
- `landing-page/src/components/sections/hero.tsx` -- potential hero image

## Implementation Steps

### 1. Image Optimization Audit

All images added in Phase 3 must use `next/image`:
- Set explicit `width` and `height` props (prevents CLS)
- Use `priority` prop on above-the-fold images (hero, instructor if visible)
- Use `loading="lazy"` for below-fold images (default behavior)
- Serve WebP via Next.js automatic format detection

Review `next.config.ts` for image configuration:
```ts
const nextConfig = {
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      { protocol: 'https', hostname: 'img.vietqr.io' }, // for QR code
    ],
  },
};
```

### 2. Open Graph Image

**Option A: Static OG image**
- Design a 1200x630 image with course title, instructor photo, key stats
- Save as `public/images/og-cover.jpg`
- Reference in metadata:
```ts
openGraph: {
  images: [{ url: '/images/og-cover.jpg', width: 1200, height: 630 }],
}
```

**Option B: Dynamic OG image with `ImageResponse`**
- Create `src/app/opengraph-image.tsx` using Next.js dynamic OG
- Renders course title + stats programmatically
- More maintainable but more complex

Go with Option A for simplicity. Upgrade to B later if needed.

### 3. Enhanced Vietnamese Meta Tags

Update `layout.tsx` metadata:
```ts
export const metadata: Metadata = {
  title: 'Vibe Coding | Bien Y Tuong Thanh Phan Mem Bang AI',
  description: '...', // keep current
  keywords: [
    'vibe coding', 'lap trinh AI', 'khoa hoc AI',
    'build app bang AI', 'Claude AI', 'khong can biet code',
    'hoc lap trinh', 'lap trinh khong can code', 'AI viet code',
    'khoa hoc lap trinh 2026',
  ],
  alternates: { canonical: 'https://vibecoding.vn' }, // set actual domain
  openGraph: { /* enhanced */ },
  twitter: {
    card: 'summary_large_image',
    title: '...',
    description: '...',
    images: ['/images/og-cover.jpg'],
  },
  robots: { index: true, follow: true },
  other: {
    'google-site-verification': 'YOUR_VERIFICATION_CODE',
  },
};
```

Add additional Vietnamese keywords covering both diacritical and non-diacritical forms.

### 4. Sitemap Generation

Create `src/app/sitemap.ts`:
```ts
import type { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: 'https://vibecoding.vn',
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1,
    },
  ];
}
```

### 5. Robots.txt

Create `src/app/robots.ts`:
```ts
import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: '*', allow: '/' },
    sitemap: 'https://vibecoding.vn/sitemap.xml',
  };
}
```

### 6. Performance Optimizations

- **Font optimization:** Already using `next/font` with Vietnamese subset -- good.
- **CSS:** TailwindCSS 4 auto-purges -- verify no unused custom CSS in globals.css.
- **JS bundle:** Check if Framer Motion tree-shakes properly. Import only needed functions.
- **Lazy sections:** Consider dynamic import for below-fold heavy sections (ClaudeKit, StudentProjects).
- **Preconnect:** Add preconnect hints for external domains (VietQR, Google Analytics).

```tsx
// In layout.tsx <head>
<link rel="preconnect" href="https://www.googletagmanager.com" />
<link rel="dns-prefetch" href="https://img.vietqr.io" />
```

## Todo List

- [ ] Configure `next.config.ts` image formats and remote patterns
- [ ] Ensure all images use `next/image` with explicit dimensions
- [ ] Add `priority` prop to above-fold images
- [ ] Create/source OG image (1200x630) and save to `public/images/og-cover.jpg`
- [ ] Update metadata in `layout.tsx` with OG image, Twitter card, canonical URL
- [ ] Add Vietnamese keyword variants (with and without diacritics)
- [ ] Create `src/app/sitemap.ts`
- [ ] Create `src/app/robots.ts`
- [ ] Add preconnect hints for external domains
- [ ] Audit Framer Motion imports for tree-shaking
- [ ] Run Lighthouse audit; target 90+ mobile
- [ ] Fix any CLS issues from image loading
- [ ] Update structured data with correct canonical URL

## Success Criteria

- Lighthouse mobile score: 90+ (Performance, SEO, Accessibility, Best Practices)
- LCP < 2.5s on 4G throttled connection
- CLS < 0.1
- OG image shows correctly when URL shared on Facebook/Zalo
- sitemap.xml accessible at /sitemap.xml
- robots.txt accessible at /robots.txt
- Google Rich Results Test passes

## Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| Large hero image tanks LCP | Poor Lighthouse score | Use compressed WebP, consider CSS gradient only (current approach works) |
| Framer Motion bundle size | JS bloat | Check bundle analyzer; lazy-load animation-heavy sections |
| Missing canonical URL at launch | Duplicate content issues | Set canonical in env var, fallback to localhost for dev |

## Security Considerations

- No sensitive info in meta tags or structured data
- Google site verification code is public -- expected
- Sitemap should not expose private/draft pages (only one page, so no risk)

## Next Steps

Proceed to [Phase 6: Final Polish & Deploy](./phase-06-polish-deploy.md).
