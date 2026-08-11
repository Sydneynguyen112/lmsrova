# ROVA LMS

Nền tảng học Trading của ROVA — khóa PRO với lộ trình 10 chặng, bài tập chấm bởi mentor, quiz, form tốt nghiệp và dashboard analytics.

- **Production:** https://lmsrova.vercel.app (auto-deploy từ branch `main` qua Vercel)
- **Database + Auth:** Supabase (app gọi trực tiếp từ client, không có API server riêng)
- **Video:** Bunny Stream

## Tech stack

- Next.js 16 (App Router) + React 19 + TypeScript
- Tailwind CSS 4 + shadcn/ui
- `@supabase/supabase-js` — mọi truy vấn nằm trong `lib/api*.ts`

## Chạy local

```bash
npm install
```

Tạo file `.env.local` ở root với 2 biến (lấy từ Supabase Dashboard → Settings → API):

```
NEXT_PUBLIC_SUPABASE_URL=https://<project-id>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<publishable/anon key>
```

```bash
npm run dev    # http://localhost:3000
npm run build  # kiểm tra build trước khi push
```

## Cấu trúc chính

| Đường dẫn | Nội dung |
|---|---|
| `app/(marketing)/` | Trang public: chủ, khóa học, bảng giá, mentor, form đăng ký |
| `app/(auth)/` | Đăng nhập (Google OAuth + email/password), đăng ký, onboarding survey |
| `app/(dashboard)/student/` | Học viên: video, nộp bài, quiz, tiến độ, form tốt nghiệp |
| `app/(dashboard)/mentor/` | Mentor: chấm bài, theo dõi học viên, ghi chú chăm sóc |
| `app/(dashboard)/admin/` | Admin: quản lý user/khóa học/form, analytics |
| `lib/` | Supabase client, API layer (`api-*.ts`), roadmap engine, auth |
| `plans/` | Kế hoạch triển khai từng đợt tính năng |
| `scripts/` | Script vận hành (vd. import học viên từ Google Sheets) |

## Database schema

Schema quản lý bằng các file SQL ở root, **chạy tay trong Supabase Dashboard → SQL Editor** theo thứ tự:

1. `supabase-setup.sql` — bảng nền (profiles, courses, lessons, submissions...)
2. `supabase-roadmap-analytics.sql` — lộ trình 10 chặng, trạng thái học viên, quiz, forms, ghi chú (đã bao gồm nội dung của `supabase-quiz-notes.sql` và `supabase-onboarding-survey.sql`)
3. `supabase-analytics-views.sql` — 6 views cho trang `/admin/analytics`
4. `supabase-onboarding-video.sql` — video onboarding bắt buộc (bảng `app_settings` + 3 cột theo dõi xem trong `profiles`)

Sau bước 2, bật extension **pg_cron** (Dashboard → Database → Extensions) rồi chạy dòng `cron.schedule` được ghi chú ở cuối file để engine trạng thái tự chạy mỗi giờ.

⚠️ Code mới chỉ chạy đúng khi SQL tương ứng đã được chạy trên Supabase — thêm bảng/cột trong code thì phải chạy SQL trước khi deploy.

## Deploy

Xem [DEPLOY.md](DEPLOY.md). Ngắn gọn: push lên `main` → Vercel tự build và deploy.
