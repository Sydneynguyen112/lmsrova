# Context Snapshot — 260806 15:10

## Trạng thái hệ thống (đã verify)
- lmsrova = Rova LMS, production Vercel https://lmsrova.vercel.app, auto-deploy từ `main`.
- SQL roadmap + analytics ĐÃ chạy trên Supabase (11 bảng + 6 view, 10 stages seeded, 17 học viên ở chặng 1).
- pg_cron: user XÁC NHẬN đã bật (06/08 ~15:00).
- Quiz builder admin ĐÃ ship (commit 3ecc65e): /admin/quizzes + /admin/quizzes/[quizId] + lib/api-quizzes.ts + sidebar. Đã push, Vercel deploy.
- Docs đã dọn (commit 60ce8f0). Remote có commit lạ 8c1e061 (fix course id + seed 5 assignment) — máy/người khác cùng push, đã rebase sạch.
- .env.local đã tạo (URL + sb_publishable_0yYw615L9zEnvqgQF_2jtQ_nOypG6Ft — key công khai). node_modules đã cài, build PASS.

## Task đang dở: IMPORT HỌC VIÊN CŨ (phase 06)
- User muốn chạy import. Script có sẵn: `lmsrova/scripts/import-students.mjs`.
- Spec: `lmsrova/plans/260806-roadmap-analytics/phase-06-import.md` — import từ Google Sheets tab PRO; email = username, password = SĐT (thiếu → `Rovatrading26`); sale Andrew→mentor Andrew, Ham→Ham, còn lại chia đều; lịch sử chặng vào `student_stage_progress` với `source='import'`.
- Cần: (1) file data học viên cũ, (2) SUPABASE_SERVICE_ROLE_KEY từ user (Dashboard → Settings → API).
- **User nói data học viên cũ nằm trong "bộ não thứ 2" — project thứ 2 trên GitHub (Sydneynguyen112). NEXT STEP: `gh repo list Sydneynguyen112` để tìm repo, xem data trong đó, đưa user xác nhận trước khi import.**
- LƯU Ý: 17 học viên hiện tại đang bị seed ở chặng 1 deadline 07/08 — import phải ghi đè/điều chỉnh tiến độ thật, không thì họ bị gắn "chậm" oan (pg_cron đã chạy mỗi giờ).

## Việc còn treo sau import
1. User tạo nội dung quiz 6 chặng qua /admin/quizzes rồi gắn chặng (nút 🔗).
2. Form tốt nghiệp: tạo qua /admin/forms (type graduation) → publish → "Gắn làm bài tốt nghiệp".
3. Map lesson cho chặng tu_duy (lesson_id) + video_hoan_thien (lesson_ids) — chưa có UI, làm bằng SQL update roadmap_stages.
4. Dự án riêng: siết RLS (đang allow-all).

## Quy tắc phiên
- Memory đã lưu: auto commit+push sau mỗi việc xong (pull --rebase nếu rejected); SQL chạy trước khi push code cần bảng mới.
- Check bảng Supabase: dùng node + createRequire supabase-js, select thật limit 1 (KHÔNG dùng head:true — báo OK giả với bảng không tồn tại).
