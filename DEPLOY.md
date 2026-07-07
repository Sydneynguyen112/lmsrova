# Deploy ROVA LMS lÃªn Cloudflare Pages

Project Ä‘Ã£ Ä‘Æ°á»£c cáº¥u hÃ¬nh Ä‘á»ƒ **static export** (`output: 'export'` trong `next.config.ts`) â€” build ra folder `out/` chá»©a HTML/CSS/JS thuáº§n, cháº¡y Ä‘Æ°á»£c trÃªn báº¥t ká»³ static host nÃ o (Cloudflare Pages, Netlify, Vercel, GitHub Pages, S3, Nginx...).

## Tá»•ng quan

- **57 static pages** Ä‘Æ°á»£c pre-render táº¡i build time
- KhÃ´ng cÃ³ server code, khÃ´ng cáº§n Node.js runtime
- Auth dÃ¹ng localStorage (client-side)
- Mock data import trá»±c tiáº¿p, khÃ´ng gá»i API

## CÃ¡c Ä‘iá»ƒm quan trá»ng vá» static export

VÃ¬ dÃ¹ng `output: 'export'`, cÃ¡c feature sau **khÃ´ng hoáº¡t Ä‘á»™ng**:
- Server Actions, API routes, middleware
- Image Optimization (Ä‘Ã£ disable â€” `images.unoptimized: true`)
- `cookies()`, `headers()`, `draftMode()`
- Rewrites, redirects, headers trong `next.config.ts`
- ISR (Incremental Static Regeneration)

CÃ¡c dynamic route pháº£i cÃ³ `generateStaticParams()` Ä‘á»ƒ biáº¿t pre-render nhá»¯ng path nÃ o. ÄÃ£ setup cho:
- `/student/courses/[courseId]` â†’ c-pro, c-coaching
- `/student/courses/[courseId]/[lessonId]` â†’ 27 lessons
- `/mentor/students/[studentId]` â†’ 7 students

Khi thÃªm course/lesson/student má»›i trong `lib/mock-data.ts`, build sáº½ tá»± pre-render thÃªm cÃ¡c path má»›i (khÃ´ng cáº§n sá»­a code).

---

## PhÆ°Æ¡ng Ã¡n 1: Deploy qua Cloudflare Dashboard (khuyÃªn dÃ¹ng â€” khÃ´ng cáº§n CLI)

### BÆ°á»›c 1: Táº¡o project trÃªn Cloudflare Pages

1. VÃ o https://dash.cloudflare.com â†’ **Workers & Pages** â†’ **Create** â†’ Tab **Pages** â†’ **Connect to Git**
2. Authorize Cloudflare truy cáº­p GitHub cá»§a báº¡n
3. Chá»n repo **`Sydneynguyen112/lmsrova`** â†’ **Begin setup**

### BÆ°á»›c 2: Build configuration

Äiá»n Ä‘Ãºng cÃ¡c field sau:

| Field | Value |
|---|---|
| **Project name** | `rova-lms` (hoáº·c tÃªn báº¡n muá»‘n) |
| **Production branch** | `main` |
| **Framework preset** | `Next.js (Static HTML Export)` |
| **Build command** | `npx next build` |
| **Build output directory** | `out` |
| **Root directory (advanced)** | (Ä‘á»ƒ trá»‘ng â€” code á»Ÿ root repo) |
| **Node version** | `20` hoáº·c `22` |

Náº¿u framework preset khÃ´ng tá»± detect Ä‘Ãºng, chá»n **None** vÃ  Ä‘iá»n thá»§ cÃ´ng.

### BÆ°á»›c 3: Environment variables (khÃ´ng cáº§n cho project nÃ y)

Project dÃ¹ng mock-data hardcode, khÃ´ng cáº§n env vars. CÃ³ thá»ƒ bá» qua.

### BÆ°á»›c 4: Save and Deploy

Click **Save and Deploy**. Cloudflare sáº½:
1. Clone repo
2. Cháº¡y `npm install`
3. Cháº¡y `npx next build` â†’ táº¡o folder `out/`
4. Upload lÃªn CDN
5. Cáº¥p URL dáº¡ng `https://rova-lms.pages.dev`

Build Ä‘áº§u tiÃªn máº¥t ~2-3 phÃºt. CÃ¡c láº§n push sau chá»‰ ~1 phÃºt.

### BÆ°á»›c 5: Custom domain (tuá»³ chá»n)

Trong project Pages â†’ **Custom domains** â†’ **Set up a custom domain** â†’ nháº­p domain â†’ lÃ m theo hÆ°á»›ng dáº«n DNS.

---

## PhÆ°Æ¡ng Ã¡n 2: Deploy qua Wrangler CLI (nhanh cho test)

Cáº§n cÃ i Wrangler trÆ°á»›c:

```bash
npm install -g wrangler
wrangler login
```

Sau Ä‘Ã³ trong thÆ° má»¥c project:

```bash
cd c:/Users/Administrator/LMS_ROVA/rova-lms
npx next build
wrangler pages deploy out --project-name=rova-lms
```

Láº§n deploy Ä‘áº§u tiÃªn sáº½ tá»± táº¡o project. URL preview sáº½ hiá»‡n ra sau ~30 giÃ¢y.

---

## PhÆ°Æ¡ng Ã¡n 3: Deploy thá»§ cÃ´ng qua Dashboard (drag & drop)

1. Cháº¡y local: `npx next build` â†’ táº¡o folder `out/`
2. NÃ©n `out/` thÃ nh file ZIP
3. VÃ o Cloudflare Pages â†’ **Create project** â†’ **Upload assets**
4. Upload file ZIP
5. HoÃ n táº¥t

CÃ¡ch nÃ y khÃ´ng tá»± Ä‘á»™ng redeploy khi báº¡n push code. Chá»‰ dÃ¹ng cho test nhanh.

---

## Build local Ä‘á»ƒ test trÆ°á»›c khi deploy

```bash
cd c:/Users/Administrator/LMS_ROVA/rova-lms
npx next build
npx serve out
```

Má»Ÿ http://localhost:3000 Ä‘á»ƒ kiá»ƒm tra â€” giao diá»‡n pháº£i y há»‡t production.

---

## CÃ¡c lÆ°u Ã½ khi deploy

### 1. Line endings trÃªn Windows
Khi commit trÃªn Windows, git cÃ³ thá»ƒ cáº£nh bÃ¡o `LF â†’ CRLF`. ÄÃ¢y chá»‰ lÃ  warning, khÃ´ng áº£nh hÆ°á»Ÿng build.

### 2. Routing trÃªn Cloudflare Pages
Cloudflare Pages tá»± xá»­ lÃ½ routing cho static export vá»›i `trailingSlash: true`:
- `/courses` â†’ `/courses/index.html`
- `/student/courses/c-pro` â†’ `/student/courses/c-pro/index.html`
- KhÃ´ng cáº§n thÃªm `_redirects` file.

### 3. 404 page
Next.js tá»± táº¡o `out/404.html` â€” Cloudflare Pages sáº½ tá»± dÃ¹ng file nÃ y.

### 4. Khi sá»­a mock-data vÃ  redeploy
Cá»© push lÃªn `main` branch â†’ Cloudflare auto-build láº¡i. CÃ¡c path má»›i trong mock-data sáº½ Ä‘Æ°á»£c pre-render tá»± Ä‘á»™ng.

### 5. Build size
Tá»•ng output `out/` hiá»‡n táº¡i ~6 MB (bao gá»“m fonts, JS bundles, pre-rendered HTML). Náº±m thoáº£i mÃ¡i trong free tier Cloudflare Pages (25 MB/file, khÃ´ng giá»›i háº¡n tá»•ng dung lÆ°á»£ng).

### 6. Free tier limits
- **500 builds/month** (thoáº£i mÃ¡i cho dev)
- **Unlimited requests** + bandwidth
- **Unlimited custom domains**
- Project public hoáº·c private Ä‘á»u Ä‘Æ°á»£c (khÃ´ng giá»›i háº¡n)

---

## Troubleshooting

### Build fail: "Dynamic segment must have generateStaticParams"
Náº¿u báº¡n thÃªm dynamic route má»›i (vÃ­ dá»¥ `/admin/users/[userId]`), nhá»› thÃªm `generateStaticParams()` vÃ o page.tsx tÆ°Æ¡ng á»©ng.

### Localhost hoáº¡t Ä‘á»™ng nhÆ°ng Pages khÃ´ng
- Check browser console xem cÃ³ lá»—i 404 assets khÃ´ng
- Verify `trailingSlash: true` trong `next.config.ts`
- Thá»­ `npx serve out` local Ä‘á»ƒ reproduce

### Auth khÃ´ng hoáº¡t Ä‘á»™ng sau deploy
Auth dÃ¹ng localStorage â†’ cáº§n HTTPS Ä‘á»ƒ localStorage hoáº¡t Ä‘á»™ng Ä‘Ãºng trÃªn má»™t sá»‘ browser. Cloudflare Pages tá»± cáº¥p HTTPS nÃªn OK.

### Link/router khÃ´ng hoáº¡t Ä‘á»™ng sau reload
ÄÃ£ báº­t `trailingSlash: true` â€” Next.js táº¡o `index.html` trong tá»«ng folder, routing hoáº¡t Ä‘á»™ng chuáº©n trÃªn static host.

---

## Cáº¥u trÃºc deploy hiá»‡n táº¡i

```
rova-lms/ (repo root)
â”œâ”€â”€ out/                       â† Build output (gitignored)
â”‚   â”œâ”€â”€ index.html            â† Homepage
â”‚   â”œâ”€â”€ courses/index.html
â”‚   â”œâ”€â”€ mentor/students/
â”‚   â”‚   â”œâ”€â”€ u-student-001/index.html
â”‚   â”‚   â”œâ”€â”€ u-student-002/index.html
â”‚   â”‚   â””â”€â”€ ...
â”‚   â”œâ”€â”€ student/courses/c-pro/
â”‚   â”‚   â”œâ”€â”€ index.html
â”‚   â”‚   â”œâ”€â”€ l-pro-01/index.html
â”‚   â”‚   â””â”€â”€ ...
â”‚   â”œâ”€â”€ _next/                â† JS/CSS bundles
â”‚   â””â”€â”€ 404.html
â”‚
â”œâ”€â”€ next.config.ts             â† output: 'export' + trailingSlash
â”œâ”€â”€ package.json
â””â”€â”€ ... (source code)
```

---

## Tá»± Ä‘á»™ng hoÃ¡ trong tÆ°Æ¡ng lai

Sau khi connect GitHub:
- Push lÃªn `main` â†’ Auto deploy production
- Push lÃªn branch khÃ¡c â†’ Auto deploy preview (URL dáº¡ng `https://abc123.rova-lms.pages.dev`)
- Má»Ÿ PR â†’ Cloudflare comment link preview vÃ o PR

KhÃ´ng cáº§n cháº¡y `wrangler deploy` thá»§ cÃ´ng sau nÃ y.
