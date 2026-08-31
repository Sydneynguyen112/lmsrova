# ROVA LMS

Nền tảng học Trading của ROVA — khóa PRO với lộ trình 10 chặng, bài tập chấm bởi mentor, quiz, form tốt nghiệp.

Repo này là **app học viên** (landing page, auth/onboarding, khu học tập, forms). Dashboard **admin + mentor** nằm ở repo riêng **`rova-ops`** — hai app dùng chung một Supabase project, admin/mentor đọc/ghi cùng dữ liệu LMS.

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
| `app/page.tsx` | Landing page |
| `app/(auth)/` | Đăng nhập (Google OAuth + email/password), đăng ký, onboarding survey + video onboarding bắt buộc |
| `app/(dashboard)/student/` | Học viên: khóa học (video, nộp bài, quiz, tốt nghiệp), nhật ký, blog, kết quả đầu vào, hồ sơ |
| `app/forms/[formId]/` | Form động (đăng ký, khảo sát, intake...) |
| `app/(legal)/` | Trang privacy / terms |
| `lib/` | Supabase client, API layer (`api-*.ts`), roadmap engine, intake scoring, auth |
| `plans/` | Kế hoạch triển khai từng đợt tính năng |
| `scripts/` | Script vận hành (import học viên, wire stages, kiểm tra dữ liệu) |

> Dashboard mentor (chấm bài, theo dõi học viên, ghi chú chăm sóc) và admin (quản lý user/khóa học/form, analytics) đã chuyển sang repo **`rova-ops`**. `lib/api-mentor.ts`, `lib/api-analytics.ts` còn lại ở đây phục vụ tra cứu chung.

## Database schema

**Supabase project này dùng chung với `rova-ops`** — dashboard admin/mentor bên đó đọc/ghi cùng dữ liệu LMS. File SQL ở repo này là nguồn chuẩn của schema: đổi schema phải kiểm tra ảnh hưởng cả hai app trước khi chạy.

Schema quản lý bằng các file SQL ở root, **chạy tay trong Supabase Dashboard → SQL Editor** theo thứ tự:

1. `supabase-setup.sql` — bảng nền (profiles, courses, lessons, submissions...)
2. `supabase-roadmap-analytics.sql` — lộ trình 10 chặng, trạng thái học viên, quiz, forms, ghi chú (đã bao gồm nội dung của `supabase-quiz-notes.sql` và `supabase-onboarding-survey.sql`)
3. `supabase-analytics-views.sql` — 6 views cho trang analytics (dùng bởi `rova-ops`)
4. `supabase-onboarding-video.sql` — video onboarding bắt buộc (bảng `app_settings` + 3 cột theo dõi xem trong `profiles`)
5. `supabase-daily-todo.sql` — todolist hằng ngày (cột `profiles.learning_pace` — nhịp học tự chọn)
6. `supabase-intake-assessment.sql` — bài test đánh giá đầu vào (mở rộng `forms`, thuần additive, idempotent)
7. `supabase-rls-profiles-hardening.sql` — siết RLS bảng `profiles` (chặn delete + leo quyền từ client)

Sau bước 2, bật extension **pg_cron** (Dashboard → Database → Extensions) rồi chạy dòng `cron.schedule` được ghi chú ở cuối file để engine trạng thái tự chạy mỗi giờ.

Ngoài ra có 2 script dữ liệu **chạy một lần khi cần, đọc kỹ ghi chú đầu file trước khi chạy**:

- `supabase-wire-stages.sql` — nối `roadmap_stages` với bài học (ghép theo tên, phải đối chiếu lại)
- `supabase-fix-watch-count.sql` — sửa dữ liệu `watch_count` bị đếm dư từ bug cũ

⚠️ Code mới chỉ chạy đúng khi SQL tương ứng đã được chạy trên Supabase — thêm bảng/cột trong code thì phải chạy SQL trước khi deploy.

## Deploy

Xem [DEPLOY.md](DEPLOY.md). Ngắn gọn: push lên `main` → Vercel tự build và deploy.
