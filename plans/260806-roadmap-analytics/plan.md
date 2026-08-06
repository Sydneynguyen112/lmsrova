# Roadmap học tập + Analytics Dashboard — Main Plan

## Overview
- **Date:** 2026-08-06
- **Goal:** Biến LMS thành hệ thống "lộ trình có deadline + thực hành bắt buộc + phản hồi mentor + dashboard đo lường" cho khoá 3 Hộp PRO.
- **Nguồn quyết định:** Toàn bộ thông số dưới đây đã được chủ dự án (Sydney) chốt từng mục ngày 05–06/08/2026. KHÔNG tự ý đổi thông số khi implement — hỏi lại nếu thấy mâu thuẫn.

## Phases
| # | File | Nội dung | Ưu tiên |
|---|------|----------|---------|
| 01 | [phase-01-database.md](phase-01-database.md) | Toàn bộ schema mới + migration + seed lộ trình + pg_cron | P0 — làm đầu tiên |
| 02 | [phase-02-tracking-engine.md](phase-02-tracking-engine.md) | Đo giây xem video, khoá video tuần tự, đếm 20 ảnh, mở quiz, engine trạng thái/deadline | P0 |
| 03 | [phase-03-mentor-grading.md](phase-03-mentor-grading.md) | Mentor chấm từng ảnh Đúng/Sai, ghi chú lần chạm (kênh/loại), đổi tag học viên | P0 |
| 04 | [phase-04-graduation-form.md](phase-04-graduation-form.md) | Form builder có chấm điểm, form tốt nghiệp, xếp loại tự động | P1 |
| 05 | [phase-05-analytics-dashboard.md](phase-05-analytics-dashboard.md) | SQL views cho bộ chỉ số + trang /admin/analytics + bảng mini cho mentor | P1 |
| 06 | [phase-06-import.md](phase-06-import.md) | Import toàn bộ học viên từ Google Sheets: tài khoản, mentor, lịch sử chặng | P1 — chạy sau khi 01 xong |

## Bối cảnh hệ thống (đã khảo sát 06/08/2026)
- Next.js 16 App Router, React 19, **static export** (`output: 'export'`) → KHÔNG có server code. Mọi logic chạy client-side gọi Supabase, hoặc chạy trong database (views, functions, pg_cron).
- Supabase: bảng đang có thật gồm `profiles, courses, modules, lessons, assignments, submissions, enrollments, lesson_progress, mentor_reviews, blog_*, comay_*, mt5_*, daily_discipline_reports, tournaments, tournament_registrations, apps_access, admin_audit_log, user_features, mentor_notifications`.
- ⚠️ **Các bảng có trong code nhưng CHƯA có trong DB thật** (phải tạo ở phase 01): `quizzes`, `quiz_attempts`, `user_notes`, `forms`, `form_questions`, `form_responses`, `form_answers`, cột `profiles.onboarding_survey`.
- ⚠️ `lesson_progress` chưa có cột đếm giây xem (chỉ có `watch_count`).
- Auth hiện tại: Google OAuth qua Supabase Auth + `signInWithEmail(email)` KHÔNG kiểm tra mật khẩu (lib/auth.ts). Phase 06 sẽ chuyển sang `supabase.auth.signInWithPassword`.
- RLS: mọi bảng đang `allow_all`. **Siết RLS là dự án riêng, KHÔNG làm trong đợt này** — nhưng bảng mới phải thiết kế sẵn sàng cho RLS (luôn có user_id/role rõ ràng).

## Quyết định đã chốt (nguồn chân lý)

### Lộ trình khoá PRO — 10 chặng, tổng chuẩn 20 ngày
| # | stage_key | Chặng | Hoàn thành khi | Ngày chuẩn |
|---|-----------|-------|----------------|-----------|
| 1 | `onboarding` | Onboarding | Đăng ký + hoàn thành onboarding survey | 1 |
| 2 | `xem_video` | Xem video | Xem ≥50% thời lượng **1 video bất kỳ đầu tiên** | 1 |
| 3 | `nen_chu` | Nến chủ | 20 ảnh chấm ĐÚNG + quiz đạt | 2 |
| 4 | `cau_truc` | Cấu trúc | 20 ảnh chấm ĐÚNG + quiz đạt | 3 |
| 5 | `tu_duy` | Tư duy (chương 4) | Xem ≥50% video + quiz đạt (không có bài tập) | 1 |
| 6 | `ct1` | Công thức 1 | 20 ảnh chấm ĐÚNG + quiz đạt | 3 |
| 7 | `ct2` | Công thức 2 | 20 ảnh chấm ĐÚNG + quiz đạt | 3 |
| 8 | `ct3` | Công thức 3 | 20 ảnh chấm ĐÚNG + quiz đạt | 3 |
| 9 | `video_hoan_thien` | Video hoàn thiện (tâm lý · quản lý vốn · nhật ký) | Xem ≥50% TỪNG video trong nhóm + quiz nếu bài có quiz | 2 |
| 10 | `tot_nghiep` | Bài Tốt nghiệp | Điền form graduation (điền xong = qua chặng) | 1 |

- Deadline đếm **cả T7/CN**. Không ân hạn: quá deadline là gắn Chậm ngay.
- Mapping chặng ↔ lesson/assignment/quiz đặt trong bảng `roadmap_stages` (admin sửa được, không hardcode trong code UI).

### Cơ chế học (thay đổi sản phẩm)
1. **Khoá video tuần tự**: học viên thấy tiêu đề mọi bài, nhưng bài N+1 chỉ mở khi bài N xong điều kiện: xem ≥50% thời lượng + quiz của bài (nếu có) đạt + nếu bài là đầu chặng bài tập thì phải xong CẢ chặng (20 ảnh đúng + quiz).
2. **1 bài tập = 1 ảnh**. Mỗi chặng bài tập cần **20 ảnh được mentor chấm ĐÚNG**. Ảnh chấm SAI không tính, học viên nộp bù; ảnh sai vẫn LƯU (để phân tích tỷ lệ sai/chặng).
3. Đủ 20 ảnh đúng → **quiz chặng hiện ra** → đạt `pass_score` (mặc định 70) → qua chặng. Trượt làm lại **không giới hạn**, **lưu mọi lượt làm** trong `quiz_attempts` (nền gamification sau này — KHÔNG bao giờ xoá dữ liệu attempts).
4. **Form tốt nghiệp**: chấm điểm tự động theo %. `< 60%` = Không đạt (làm lại đến khi đạt) · `>= 60%` = Tốt · `>= 85%` = Xuất Sắc. Tag `tot_nghiep` chỉ gắn khi ĐẠT (tự động). Form chỉ mở sau khi xong chặng `video_hoan_thien`.

### Trạng thái học viên — 7 tag + 2 cờ
Tag chính (cột `profiles.status`, thay hẳn `risk_tag` cũ; mỗi người đúng 1 tag):
| status | Ai gắn | Điều kiện |
|--------|--------|-----------|
| `dung_tien_do` | máy | trong deadline chặng hiện tại |
| `cham` | máy | quá deadline (không ân hạn) |
| `roi_bo` | mentor/CS gắn tay | máy ĐỀ XUẤT khi chậm ≥14 ngày VÀ đã chạm ≥3 lần không phản hồi |
| `quay_lai` | máy | người `roi_bo` CHƯA tốt nghiệp có hoạt động học (xem video/nộp bài/làm quiz). Khi quay lại: **reset mốc deadline** = tính lại từ ngày quay lại + chặng đang dừng |
| `tam_dung` | mentor gắn tay | học viên xin nghỉ có lý do — đồng hồ deadline DỪNG |
| `tot_nghiep` | máy | form tốt nghiệp đạt ≥60% |
| `hoan_tien` | admin | kết thúc, hoàn tiền |

Cờ phụ (computed, không phải status):
- `ket` (Kẹt): đang `cham` và đã quá deadline **+3 ngày** trở lên.
- `cho_cham` (Chờ chấm): đã nộp đủ 20 ảnh của chặng mà mentor chưa chấm xong → **đồng hồ deadline DỪNG** (cộng dồn `paused_seconds`), thời gian chờ chấm tính vào SLA mentor, không tính lỗi học viên.

Mọi thay đổi status (máy hay người) ghi 1 dòng vào `status_events`. Bắt buộc nhập `reason` khi người gắn `roi_bo` / `tam_dung` / `hoan_tien`.

### Ghi chú lần chạm (can thiệp)
`user_notes` thêm 2 cột bắt buộc chọn khi tạo:
- `channel`: `call` · `zalo` · `zoom` · `app`
- `note_type`: `nhac_bai` · `go_ket` · `cham_soc` · `khac`

Mỗi note = 1 lần chạm → máy đếm được "đã chạm ≥3 lần" và "% học viên chậm được chạm trong 48h".

### Phân quyền xem
- **Admin/super_admin**: trang `/admin/analytics` đầy đủ, gồm so sánh mentor.
- **Mentor**: bản thu gọn trên trang chủ mentor, CHỈ học viên mình phụ trách, KHÔNG thấy scorecard mentor khác.
- **Học viên**: chỉ thấy tiến độ chính mình (như hiện tại).

### Đo lường
- Lứa (cohort) cắt theo **THÁNG** nhập học (~50 hv/tháng). Dùng **median**, không dùng trung bình, cho thời-gian-mỗi-chặng.
- Chỉ số Bắc Đẩu: **% tốt nghiệp trong 30 ngày theo lứa** (+ mốc 60 ngày).

### Import dữ liệu cũ (phase 06)
- Import **toàn bộ** khách từ Google Sheets (các tab PRO). Tạo tài khoản Supabase Auth: email = tên đăng nhập, **mật khẩu = SĐT**; thiếu SĐT → mật khẩu `Rovatrading26`.
- Chia mentor: Sale = `Andrew` → mentor Andrew · Sale = `Ham` → mentor Ham · còn lại (Vicky/Javis/Hafi/khác) chia đều luân phiên cho Andrew & Ham.
- Ngày các chặng trong Sheets import vào `student_stage_progress` với `source = 'import'`.

## Thứ tự implement khuyến nghị
1. Phase 01 (database) → chạy SQL trên Supabase, verify bằng select.
2. Phase 02 (tracking engine) — cần trước khi học viên mới học.
3. Phase 03 (mentor grading) — song song 02 được.
4. Phase 06 (import) — ngay khi 01 xong là chạy được (không cần 02/03).
5. Phase 04 (graduation form) và Phase 05 (analytics) — sau cùng.

## Nguyên tắc chung khi code
- Đọc `AGENTS.md` — Next.js version này có breaking changes, đọc docs trong `node_modules/next/dist/docs/` trước khi viết code.
- Static export: KHÔNG dùng Server Actions/API routes/middleware. Logic nặng đẩy xuống DB (views/functions/pg_cron), client chỉ select.
- Convention có sẵn: TEXT PK + `genId(prefix)` cho bảng thực thể; UUID PK cho bảng transactional; JSONB cho dữ liệu mềm; RLS `allow_all` (tạm — theo pattern hiện có).
- Tiếng Việt cho mọi label UI. Code/column bằng tiếng Anh hoặc không dấu.
- KHÔNG xoá/ghi đè dữ liệu `quiz_attempts`, `status_events`, `submission_images` — đây là dữ liệu tích luỹ.
