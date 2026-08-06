# Phase 04 — Form tốt nghiệp: form builder có chấm điểm, xếp loại tự động

## Context Links
- [Main Plan](plan.md) · [Phase 01](phase-01-database.md) · Spec form builder gốc: `plans/260415-form-builder/`
- Files: `app/(dashboard)/admin/forms/**`, trang điền form phía học viên, `lib/roadmap.ts`

## Overview
- **Description:** Nâng form builder để tạo được form loại `graduation` có đáp án đúng + điểm, tự chấm % lúc nộp, xếp loại, gắn tag tốt nghiệp tự động, và gắn form vào chặng cuối lộ trình.
- **Priority:** P1
- **Ghi chú:** Form builder theo spec 260415 có thể CHƯA được implement đầy đủ (bảng chưa có trong DB — phase 01 đã tạo). Nếu UI builder chưa có thật, implement theo spec 260415 trước rồi cộng thêm phần dưới đây.

## 1. Builder: thêm loại form `graduation`

- Khi tạo form chọn form_type: survey / onboarding / **graduation**.
- Với graduation: mỗi câu radio/select hiện thêm ô chọn **đáp án đúng** (`correct_option`) + **điểm** (`points`, mặc định 1). Câu text/textarea trong form graduation: không tính điểm (points = 0) — dùng cho câu cảm nhận.
- Validate khi publish form graduation: có ít nhất 1 câu có correct_option; tổng points > 0.

## 2. Gắn form vào lộ trình

- Trang admin quản lý form: với form graduation đã publish, nút "Gắn làm bài tốt nghiệp khoá…" → chọn course → `UPDATE roadmap_stages SET form_id = ... WHERE course_id = ... AND stage_key = 'tot_nghiep'`.
- Chỉ 1 form graduation active per course; gắn form mới thay form cũ (responses cũ giữ nguyên).

## 3. Học viên điền form

- Chặng `tot_nghiep` mở khi chặng `video_hoan_thien` completed (engine phase 02). UI course hiện card "Bài Tốt nghiệp" thay vì lesson.
- Nộp form: client chấm điểm ngay lúc submit: `score_pct = 100 * Σ(points câu đúng) / Σ(points mọi câu có correct_option)`; ghi vào form_responses cùng `grade`:
  - `score_pct < 60` → `khong_dat`
  - `60 <= score_pct < 85` → `tot`
  - `score_pct >= 85` → `xuat_sac`
- (Ranh giới dùng ≥ để không lọt người đúng vạch — đã chốt.)
- `khong_dat`: hiện điểm + thông báo động viên + nút làm lại (không giới hạn; mỗi lần 1 response mới, giữ mọi response).
- Đạt (`tot`/`xuat_sac`):
  - `completeStage` chặng tot_nghiep (điền form đạt = xong lộ trình)
  - set `profiles.status = 'tot_nghiep'` qua RPC (changed_by NULL — máy)
  - `enrollments.completed_at = now()`, `status = 'completed'`
  - Màn chúc mừng + xếp loại (dùng canvas-confetti có sẵn trong deps)

Lưu ý qua-chặng vs tag: chủ dự án chốt "điền form là qua chặng, tag tốt nghiệp chỉ gắn khi đạt". Vì làm lại không giới hạn ngay tại chỗ, implement đơn giản: chặng complete khi có response đầu tiên ĐẠT (khong_dat chưa complete chặng — vẫn ở chặng tot_nghiep, đúng tinh thần "làm lại cho đến khi đạt", và deadline chặng 1 ngày vẫn chạy).

## 4. Admin xem kết quả

- responses viewer (spec 260415) thêm cột score_pct + grade + lần nộp thứ mấy; filter theo grade.
- Trang admin students: cột xếp loại tốt nghiệp cho học viên đã tot_nghiep.

## Acceptance criteria
- [ ] Tạo form graduation 10 câu (8 câu tính điểm) → publish → gắn vào c-pro.
- [ ] Học viên chưa xong video_hoan_thien không thấy/không mở được form.
- [ ] Nộp 7/8 đúng (87.5%) → xuat_sac, confetti, status tot_nghiep, enrollment completed, status_events có dòng máy đổi.
- [ ] Nộp 4/8 (50%) → khong_dat, làm lại được ngay, response cũ vẫn còn trong DB.
