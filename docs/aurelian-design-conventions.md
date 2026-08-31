# Aurelian Design Conventions — ROVA LMS

Project-specific UI conventions cho `rova-lms/`. Audit 2026-05-04.

## Button radius — `rounded-lg`, KHÔNG `rounded-full`

**Decision:** Toàn bộ button trong LMS dùng `rounded-lg` (≈10px). Không dùng `rounded-full` cho button chính dù spec gốc Cỗ Máy v5 yêu cầu pill shape.

**Why:**
- 100% button sẵn có trong LMS (`components/ui/button.tsx`) base radius `rounded-lg` qua cva config.
- Refactor sang `rounded-full` sẽ break visual consistency với 10+ existing pages (student dashboard, courses, sign-in, pricing, …).
- Aurelian palette + `rounded-lg` đã hài hoà — gold không cần pill để nổi bật.

**Tradeoff documented:**
- Mất "đặc thù pill gold" của Cỗ Máy gốc (`comayintien.vercel.app`).
- Spec v5 nguyên bản (`rova-lms/cursor-prompt-v5-supabase-aurelian.md`) yêu cầu pill — đã deviate, không phá build.

**How to apply:**
- Khi thêm button variant mới (như `anchor` cho Cỗ Máy): inherit `rounded-lg` từ base cva, KHÔNG override `rounded-full`.
- Nếu user/PO muốn pill-only cho 1 module riêng: tạo variant tách biệt (vd: `anchor-pill`), document deviation.
- Pricing CTA, sign-in CTA, all dashboard CTAs: stick `rounded-lg`.

**Reference files:**
- `rova-lms/components/ui/button.tsx` — cva config với 7 variants (default, outline, secondary, ghost, destructive, link, anchor)
- `rova-lms/cursor-prompt-v5-supabase-aurelian.md` — spec gốc (deviate)
- `plans/reports/cook-260504-1100-phase-01-foundation.md` — quyết định ban đầu
- `plans/reports/review-260504-1300-comay-mvp.md` — review confirm

## Color tokens — Aurelian palette

| Token | Hex (light) | Usage |
|---|---|---|
| `--primary` | `#CD9C20` | Gold đậm — CTA chính, branding accent |
| `--secondary` | `#C8AA6F` | Vàng kem — accent phụ |
| `--background` | `#EDE8D8` | Cream tertiary — light mode bg |
| `--card` | `#F5F2E8` | Off-white — card bg |
| (inline) | `#3B6C4F` (light) / `#5C9C75` (dark) | **Profit** — trading P&L positive |
| (inline) | `#C03B3B` (light) / `#E06464` (dark) | **Loss** — trading P&L negative |

Gold gradient utility classes: `gold-gradient-text`, `gold-glow`, `gold-border-glow`, `gold-gradient-radial`.

## Typography

`Manrope` cho TẤT CẢ. Imported via `next/font/google` ở `rova-lms/app/layout.tsx` với subsets `["latin", "vietnamese"]`. **Không** override với font khác — Vietnamese diacritics đã verified.

## Base UI primitive gotchas

### `DropdownMenuLabel` cần parent `DropdownMenuGroup`
Component `DropdownMenuLabel` (= base-ui `MenuPrimitive.GroupLabel`) đọc context `MenuGroupContext`. Khi rendered ngoài `DropdownMenuGroup` → throw **Base UI error #31** ("Component must be inside MenuGroup") → trong production build hiện browser-level "This page couldn't load".

**Quy tắc:**
- Cần label decorative trong DropdownMenuContent → dùng plain `<div className="px-1.5 py-1 text-xs font-medium text-muted-foreground">`.
- Chỉ dùng `<DropdownMenuLabel>` khi đã wrap `<DropdownMenuGroup>` xung quanh items.

**Reference:** `plans/reports/fix-260505-1136-dropdown-error-31.md`

### `<DropdownMenuTrigger render={<Button>}>` conflict
Button của LMS đã wrap base-ui `ButtonPrimitive`. Đặt `<Button>` vào MenuTrigger.render gây **double base-ui Button context** → render fail.

**Quy tắc:**
- Trigger DropdownMenu: dùng children + className button-style trực tiếp:
  ```tsx
  <DropdownMenuTrigger className="inline-flex items-center gap-1 rounded-lg border ...">
    {children}
  </DropdownMenuTrigger>
  ```
- Không apply rule này cho `DialogTrigger` — Dialog không có Button context conflict, `render={<Button>}` work bình thường.

## Z-index ladder (cần document khi có thêm overlay)

| Layer | z-index | File |
|---|---|---|
| Sidebar mobile drawer | 50 | `components/layout/Sidebar.tsx:291` |
| Sidebar desktop | 30 | `components/layout/Sidebar.tsx:255` |
| Dialog/Modal (base-ui) | 50 | `components/ui/dialog.tsx` |
| Withdraw celebration overlay | 60 | `components/co-may/quan-ly/withdraw-modal.tsx:128` |

**Rule:** Khi thêm overlay mới, update bảng này + chọn z-index không chồng. Hiện tại safe nhưng chưa rigorous — tất cả overlay manual coordinate.
