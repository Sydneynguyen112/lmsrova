# Phase 4: Third-Party Integrations

## Context

- **Parent:** [plan.md](./plan.md)
- **Dependencies:** None (can run in parallel with Phase 3)
- **Docs:** [Research 2](./research/researcher-02-report.md)

## Overview

- **Date:** 2026-03-30
- **Priority:** P2
- **Status:** Pending
- **Description:** Integrate Zalo chat widget, analytics (GA4 + Facebook Pixel), and QR code for bank payment.

## Key Insights

1. Zalo is Vietnam's dominant messaging app -- chat widget is standard for Vietnamese landing pages.
2. Facebook Pixel critical for retargeting (Vietnamese market heavily uses Facebook ads).
3. QR code payment is increasingly preferred over manual bank transfer copy-paste.
4. Research: "Local payment integration (Momo, bank transfer) critical."

## Requirements

1. Zalo chat widget (floating button, opens Zalo OA conversation)
2. Google Analytics 4 event tracking
3. Facebook Pixel for conversion tracking
4. QR code in payment section for bank transfer

## Architecture

```
src/app/layout.tsx               -- GA4 + FB Pixel scripts
src/components/ui/
  zalo-widget.tsx                -- floating Zalo chat button
  qr-payment.tsx                 -- QR code display
src/components/sections/
  payment.tsx                    -- add QR code
src/lib/analytics.ts             -- event tracking helpers
```

## Related Code Files

- `landing-page/src/app/layout.tsx` -- `<head>` for script injection
- `landing-page/src/components/sections/payment.tsx` -- bank transfer info
- `landing-page/src/app/page.tsx` -- add Zalo widget

## Implementation Steps

### 1. Zalo Chat Widget

Two approaches:

**Option A: Official Zalo OA Widget (Recommended)**
- Add Zalo SDK script in layout.tsx head
- `<div class="zalo-chat-widget" data-oaid="YOUR_OA_ID" data-welcome-message="..." data-autopopup="0"></div>`
- Script: `https://sp.zalo.me/plugins/sdk.js`

**Option B: Simple Zalo Link Button**
- Floating button at bottom-left (opposite scroll-to-top)
- Links to `https://zalo.me/YOUR_PHONE_OR_OA_ID`
- Custom styled with Zalo blue (#0068FF)
- Simpler, no third-party SDK

Go with Option B first (no external SDK dependency), upgrade to Option A when OA ID is available.

Implementation:
- Create `zalo-widget.tsx` -- fixed position button, bottom-left
- Zalo icon (use inline SVG or Lucide `MessageCircle` with Zalo branding)
- z-index: 40 (same layer as scroll-to-top)
- Add to `page.tsx`

### 2. Google Analytics 4

Use Next.js `<Script>` component with `strategy="afterInteractive"`:

```tsx
// In layout.tsx
<Script src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`} strategy="afterInteractive" />
<Script id="ga4" strategy="afterInteractive">
  {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag('js',new Date());gtag('config','${GA_ID}');`}
</Script>
```

Create `src/lib/analytics.ts` with helper functions:
- `trackEvent(action, category, label, value)` -- wraps `gtag('event', ...)`
- `trackCTAClick(tier)` -- fires on pricing button click
- `trackSectionView(sectionId)` -- fires on scroll into view

Wire up CTA buttons in `pricing.tsx`, `hero.tsx`, `final-cta.tsx` to call `trackCTAClick`.

**Config:** Store `GA_MEASUREMENT_ID` in env var `NEXT_PUBLIC_GA_ID`. Use `next.config.ts` env or `.env.local`.

### 3. Facebook Pixel

Similar pattern to GA4:

```tsx
<Script id="fb-pixel" strategy="afterInteractive">
  {`!function(f,b,e,v,n,t,s){...}('${FB_PIXEL_ID}');`}
</Script>
<noscript><img height="1" width="1" style="display:none" src="https://www.facebook.com/tr?id=${FB_PIXEL_ID}&ev=PageView&noscript=1"/></noscript>
```

Track events:
- `PageView` -- automatic
- `ViewContent` -- on pricing section scroll
- `InitiateCheckout` -- on CTA button click
- `Lead` -- on payment section scroll (user saw bank info)

Store `NEXT_PUBLIC_FB_PIXEL_ID` in env.

### 4. QR Code for Bank Payment

In `payment.tsx`, add a QR code image:

**Option A: Static QR image**
- Generate QR code offline (encode bank info: MB Bank, 0389772949, LE BACH HIEP)
- Save as `public/images/payment-qr.png`
- Display with `next/image`

**Option B: VietQR API**
- Use `https://img.vietqr.io/image/MB-0389772949-compact.png?addInfo=VIBECODING`
- Dynamic, always up-to-date
- Requires internet (already a web page, so fine)

Go with Option B (VietQR) -- zero maintenance, standard Vietnamese banking QR.

Implementation in `payment.tsx`:
- Add QR image next to bank details
- Caption: "Quet ma QR de chuyen khoan nhanh"
- Responsive: QR on right side (desktop), below bank info (mobile)

## Todo List

- [ ] Create `src/components/ui/zalo-widget.tsx` (simple link button)
- [ ] Add Zalo widget to `page.tsx`
- [ ] Create `.env.local` with `NEXT_PUBLIC_GA_ID` and `NEXT_PUBLIC_FB_PIXEL_ID` placeholders
- [ ] Add `.env.local` to `.gitignore` (verify)
- [ ] Add GA4 scripts to `layout.tsx` using `next/script`
- [ ] Add Facebook Pixel to `layout.tsx`
- [ ] Create `src/lib/analytics.ts` with tracking helpers
- [ ] Wire `trackCTAClick` to pricing/hero/final-cta buttons
- [ ] Add VietQR image to `payment.tsx`
- [ ] Style QR section responsively
- [ ] Test analytics events in browser devtools (GA debug mode)
- [ ] Verify Zalo link opens correctly on mobile

## Success Criteria

- Zalo button visible on all viewports, opens Zalo chat/link
- GA4 tracks PageView + CTA clicks
- Facebook Pixel fires PageView + InitiateCheckout
- QR code renders in payment section, scannable by banking apps
- No performance degradation from third-party scripts (afterInteractive loading)

## Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| Missing GA/FB IDs at launch | No tracking | Use env vars with fallback (skip script if empty) |
| Third-party scripts block rendering | LCP regression | Use `strategy="afterInteractive"` or `lazyOnload` |
| VietQR API downtime | No QR visible | Add static fallback image, `onError` handler |
| Zalo widget z-index conflict | Overlaps other UI | Test stacking with floating CTA + scroll-to-top |

## Security Considerations

- GA/FB IDs are public (NEXT_PUBLIC_ prefix) -- this is expected, not sensitive
- Never expose server-side secrets in client components
- VietQR URL contains bank account number -- already public on the page
- Zalo link: ensure it points to verified OA, not spoofable
- Add `rel="noopener noreferrer"` to external links

## Next Steps

Proceed to [Phase 5: Performance & SEO](./phase-05-perf-seo.md).
