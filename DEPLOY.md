# Deploy ROVA LMS

Production chạy trên **Vercel**: https://lmsrova.vercel.app

> Lưu ý lịch sử: trước đây project deploy dạng static export lên Cloudflare Pages.
> Từ khi chuyển sang Supabase + có route dynamic, app **cần server runtime** nên đã chuyển hẳn sang Vercel.
> Hướng dẫn Cloudflare cũ đã bị gỡ; `wrangler.toml` cũng đã xóa.

## Quy trình deploy thường ngày

1. Code xong, chạy `npm run build` local để chắc chắn build không lỗi.
2. Nếu tính năng có file SQL mới → **chạy SQL trên Supabase TRƯỚC** (xem phần Database bên dưới).
3. Push lên `main` → Vercel tự build + deploy (~1-2 phút).
4. Mở https://lmsrova.vercel.app kiểm tra tính năng vừa lên.

Push lên branch khác sẽ tạo **preview deployment** với URL riêng — dùng để review trước khi merge vào `main`.

## Environment variables (Vercel)

Vercel → Project `lmsrova` → Settings → Environment Variables cần có:

| Biến | Lấy ở đâu |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase Dashboard → Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase Dashboard → Settings → API (publishable key) |

Đổi env var xong phải **Redeploy** thì mới có hiệu lực.

## Database (Supabase)

Schema KHÔNG tự migrate khi deploy. Mỗi lần code thêm bảng/cột:

1. Vào Supabase Dashboard → **SQL Editor**
2. Dán nội dung file SQL tương ứng ở root repo → **Run**
3. Verify bằng vài câu `SELECT` (các file SQL có sẵn câu verify ở cuối)

Thứ tự chạy từ đầu (project mới): `supabase-setup.sql` → `supabase-roadmap-analytics.sql` → `supabase-analytics-views.sql`. Chi tiết xem [README.md](README.md).

## Khi deploy hỏng

- Build fail trên Vercel → xem log build trong Vercel Dashboard, sửa lỗi, push lại.
- Web lên nhưng tính năng lỗi "table not found" → quên chạy SQL trên Supabase (bước 2 ở trên).
- Cần quay về bản cũ gấp → Vercel Dashboard → Deployments → chọn bản trước → **Promote to Production**.
