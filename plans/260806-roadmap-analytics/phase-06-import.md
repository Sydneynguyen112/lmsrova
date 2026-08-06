# Phase 06 — Import học viên cũ từ Google Sheets + chuyển auth sang mật khẩu

## Context Links
- [Main Plan](plan.md) · [Phase 01](phase-01-database.md)
- Files: `scripts/import-students.mjs` (mới), `app/(auth)/sign-in/page.tsx`, `lib/auth.ts`

## Overview
- **Description:** Đưa TOÀN BỘ khách trong Google Sheets vào LMS: tạo tài khoản đăng nhập được, gán mentor, import lịch sử chặng; đồng thời chuyển sign-in sang email + mật khẩu thật.
- **Priority:** P1 — chạy ngay khi phase 01 xong (không cần 02/03).

## 0. Chuẩn bị dữ liệu (việc của chủ dự án)
- Export từng tab PRO của Google Sheets ra CSV, bỏ vào `scripts/import/` (gitignore folder này — chứa SĐT thật, KHÔNG commit).
- Cột kỳ vọng (theo sheet hiện tại): `No (mã ĐH…), SĐT, Họ và tên, Ngày tạo đơn, Sale, Công nợ, Mentor, Ngày Onboarding, Ngày Xem video, Ngày Nến chủ, Ngày Cấu trúc, Ngày CT1, Ngày CT2, Ngày CT3, Ngày Tốt nghiệp, Giai đoạn hiện tại, Trạng thái học..., Trạng thái khách hàng, Email(nếu có)`.
- ⚠️ Sheet có thể KHÔNG có cột email — script phải xử lý: thiếu email → sinh email kỹ thuật `dh1179@rova.local` từ mã ĐH (đăng nhập bằng email này; ghi chú cho CS đổi sang email thật khi liên hệ khách).

## 1. Chuyển sign-in sang mật khẩu (BẮT BUỘC trước import)
Hiện `signInWithEmail(email)` KHÔNG kiểm tra mật khẩu (lib/auth.ts) — ai biết email là vào được. Vì import sẽ đưa hàng trăm tài khoản thật lên:
- Sign-in page: form email + mật khẩu → `supabase.auth.signInWithPassword({email, password})`. Sau khi auth thành công, flow `ensureProfile`/localStorage giữ nguyên như Google OAuth.
- Bỏ hẳn đường `signInWithEmail` không mật khẩu (giữ Google OAuth).
- Thêm nút "Quên mật khẩu" dùng `supabase.auth.resetPasswordForEmail` (email kỹ thuật `.local` không nhận được mail — CS đổi email thật trước, chấp nhận).

## 2. Script import (`scripts/import-students.mjs`)
Chạy local bằng Node, cần env `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` (service key — CHỈ nằm trong `.env.local`, không bao giờ vào client bundle/commit).

Từng dòng CSV:
1. **Auth user**: `supabase.auth.admin.createUser({ email, password, email_confirm: true })`
   - password = SĐT (chuẩn hoá: bỏ khoảng trắng; giữ số 0 đầu — password là string)
   - thiếu SĐT → password `Rovatrading26` (đã chốt)
   - email trùng đã tồn tại → skip tạo auth, dùng user cũ (idempotent)
2. **Profile**: upsert theo email — full_name, phone, role 'student', `source = 'import-sheet'`, status khởi tạo tạm 'dung_tien_do' (cron tính lại ngay sau import), lưu mã ĐH vào cột mới `profiles.external_code TEXT` (thêm ở phase 01 nếu chưa — ALTER ADD IF NOT EXISTS).
3. **Mentor** (đã chốt): Sale = 'Andrew' → mentor Andrew · Sale = 'Ham' → mentor Ham · còn lại chia đều luân phiên Andrew/Ham (đếm running count để cân). Lookup mentor theo tên trong profiles role='mentor' — nếu chưa có 2 profile mentor này, script tạo (role mentor, email admin cung cấp).
4. **Enrollment** c-pro: `enrolled_at = Ngày Onboarding` (fallback Ngày tạo đơn), status 'active'.
5. **Lịch sử chặng** → `student_stage_progress` với `source='import'`:
   - Cột ngày nào có giá trị → dòng progress chặng đó completed_at = ngày đó; entered_at = ngày chặng trước (fallback cùng ngày).
   - Chặng đầu tiên CHƯA có ngày = chặng hiện tại → dòng progress mở: entered_at = ngày chặng trước gần nhất, deadline_at = entered_at + target_days.
   - Lưu ý mapping cột cũ → chặng mới: sheet cũ KHÔNG có cột "Tư duy" và "Video hoàn thiện" → học viên import đang giữa lộ trình sẽ vào chặng mới tương ứng gần nhất (vd xong Cấu trúc → chặng hiện tại là tu_duy). Ngày Tốt nghiệp có → set status tot_nghiep + enrollment completed (KHÔNG bắt học lại chặng mới).
6. **Ghi chú cũ**: cột "Trạng thái khách hàng" (text tự do) nếu có → 1 dòng user_notes (channel 'app', note_type 'khac', author = admin) để không mất thông tin CS đã ghi.
7. Cuối script: gọi `refresh_student_statuses()` + in báo cáo: tạo mới X, skip Y, lỗi Z (kèm mã ĐH từng dòng lỗi) → xuất `scripts/import/report-<date>.csv`.

Idempotent: chạy lại không nhân đôi (upsert theo email; progress upsert theo user+stage).

## 3. Sau import (việc của chủ dự án + CS)
- Gửi học viên cũ: link đăng nhập + hướng dẫn "email + mật khẩu là SĐT của bạn" (kênh Zalo).
- CS ưu tiên đổi email thật cho các tài khoản `.local`.
- Kiểm tra ngẫu nhiên 5 học viên: đăng nhập được, đúng chặng hiện tại, đúng mentor.

## Acceptance criteria
- [ ] Chạy script 2 lần → số profile không đổi (idempotent).
- [ ] Học viên có SĐT đăng nhập được bằng email + SĐT; học viên thiếu SĐT bằng `Rovatrading26`.
- [ ] Chia mentor: đếm theo Sale đúng luật; tổng 2 mentor chênh nhau ≤ 1 với nhóm "còn lại".
- [ ] Học viên sheet đã "Hoàn thành" → status tot_nghiep, không bị bắt học lại.
- [ ] Học viên đang "Xem video" → chặng hiện tại đúng, deadline hợp lệ, cron xếp dung_tien_do/cham đúng.
- [ ] `scripts/import/` nằm trong .gitignore.
