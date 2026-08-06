# Phase 05 — Analytics: SQL views + trang /admin/analytics + bảng mini mentor

## Context Links
- [Main Plan](plan.md) · [Phase 01](phase-01-database.md)
- Files mới: `app/(dashboard)/admin/analytics/page.tsx`, thêm mục Sidebar; sửa `app/(dashboard)/mentor/page.tsx`
- Chart: dùng SVG/div thuần hoặc lib nhẹ — repo chưa có chart lib; KHÔNG thêm dependency nặng, ưu tiên bar/progress tự vẽ bằng div (đủ cho dashboard này).

## Overview
- **Description:** Toàn bộ tầng đo lường: views tính sẵn trong DB (client chỉ select), trang analytics admin 4 tầng, bản thu gọn cho mentor.
- **Priority:** P1
- **Nguyên tắc:** median không phải mean; lứa theo THÁNG (`date_trunc('month', enrolled_at)`); mẫu số luôn loại người `hoan_tien`; mọi con số bấm vào được phải ra danh sách tên.

## 1. SQL Views (đặt trong file SQL phase 01 hoặc file riêng `supabase-analytics-views.sql`)

### v_student_roadmap — 1 dòng/học viên, nền của mọi thứ
Join profiles (role student) + enrollment c-pro + stage progress đang mở + roadmap_stages:
`user_id, full_name, mentor_id, status, status_changed_at, enrolled_at, cohort_month (date_trunc tháng), current_stage_key, current_stage_title, stage_order, entered_at, deadline_at, days_in_stage, days_late (0 nếu chưa trễ), is_ket (now() > deadline_at + 3 days và status='cham'), is_cho_cham (pause_started_at not null vì pending grading), correct_images, pending_images, graduated_at, grade`

### v_funnel — đếm học viên đang đứng ở từng chặng
Từ v_student_roadmap: `stage_key, stage_title, order_index, count(*)` — chỉ status học đang sống (dung_tien_do, cham, quay_lai, tam_dung).

### v_today_actions — 5 thẻ tầng 1
Union các nhóm, mỗi dòng: `action_group, user_id, full_name, mentor_id, detail`:
- `ket`: is_ket = true
- `can_cham`: status='cham' VÀ chưa có user_notes nào kể từ lúc rơi vào chậm (join status_events lấy thời điểm vào cham gần nhất)
- `cho_cham`: is_cho_cham = true (kèm mentor chịu trách nhiệm)
- `cho_tot_nghiep`: đã xong video_hoan_thien, chưa có response graduation đạt
- `moi_chua_vao_guong`: enrolled >= 48h mà chưa xong chặng onboarding, hoặc onboard xong >=3 ngày chưa completed video nào

### v_cohort_monthly — tầng 3
Group theo cohort_month: `total, pct_activated_7d` (xong chặng nen_chu... không — kích hoạt = hoàn thành BÀI TẬP đầu tiên: có ảnh nộp đầu trong 7 ngày từ enrolled_at; đơn giản + đúng tinh thần "hành động sớm": có >=1 submission_images trong 7 ngày), `pct_graduated_30d`, `pct_graduated_60d`, `pct_roi_bo`, `median_days_to_graduate`. Lứa chưa đủ N ngày tuổi → pct tương ứng NULL (UI hiện "đang chạy", không hiện 0%).

### v_stage_speed — tầng 2 phụ
Per stage: `median_days` (percentile_cont(0.5) trên completed stages, LOẠI source='import' nếu ngày import không đủ tin), `target_days`, `pct_on_time`.

### v_mentor_scorecard — chỉ admin
Per mentor: `students_total, pct_dung_tien_do, count_ket, graduated_this_month, median_grading_hours` (submission_images: graded_at - created_at, median, 30 ngày gần nhất), `pending_to_grade, touches_this_week` (user_notes), `pct_cham_touched_48h` (học viên rơi vào cham có note trong 48h).

## 2. Trang /admin/analytics — 4 tầng (đã chốt mockup với chủ dự án 06/08)

1. **Tầng 1 — thẻ hành động hôm nay** (5 metric cards từ v_today_actions, đếm theo group): Kẹt (đỏ) · Cần chạm (vàng) · Chờ chấm · Chờ tốt nghiệp (xanh) · Mới chưa vào guồng. Click thẻ → mở danh sách tên (drawer/table dưới thẻ) kèm mentor + nút sang trang học viên.
2. **Tầng 2 — phễu chặng**: bar ngang 10 chặng từ v_funnel + cột phụ median days vs target từ v_stage_speed (chặng nào median > target tô đỏ nhạt).
3. **Tầng 3 — so sánh lứa tháng**: grouped bars từ v_cohort_monthly — % kích hoạt 7 ngày + % tốt nghiệp 30 ngày, mỗi cụm 1 lứa, lứa chưa đủ tuổi ghi "đang chạy". Kèm dòng chú thích cố định: "Lứa mới chưa tròn 30 ngày nên chưa có cột tốt nghiệp".
4. **Tầng 4 — bảng mentor** từ v_mentor_scorecard (chỉ admin thấy trang này nên không cần ẩn gì thêm).

Sidebar admin thêm mục "Analytics" (icon chart-bar) trên mục Biểu mẫu.

## 3. Mentor mini-dashboard (mentor/page.tsx)

Thêm block đầu trang: 4 thẻ từ v_today_actions LỌC THEO mentor_id = mình (Kẹt · Cần chạm · Chờ chấm của mình · Chờ tốt nghiệp) + click ra danh sách. KHÔNG hiện scorecard so sánh mentor. Giữ phần "hoạt động hôm qua" hiện có.

## 4. Ghi chú hiển thị

- Nhãn tiếng Việt: dung_tien_do "Đúng tiến độ" · cham "Chậm" · roi_bo "Rời bỏ" · quay_lai "Quay lại" · tam_dung "Tạm dừng" · tot_nghiep "Tốt nghiệp" · hoan_tien "Hoàn tiền" · cờ "Kẹt", "Chờ chấm". Map tập trung 1 chỗ `lib/status-labels.ts`.
- % luôn làm tròn 0–1 lẻ; số ngày làm tròn 1 lẻ.
- Empty state khi chưa đủ dữ liệu (tuần đầu sau launch) — không hiện NaN.

## Acceptance criteria
- [ ] Mỗi view select được < 1s với 1.000 học viên giả lập.
- [ ] Số trên 5 thẻ = đúng số dòng danh sách khi click.
- [ ] Lứa tháng hiện tại không hiện 0% tốt nghiệp (hiện "đang chạy").
- [ ] Mentor A không nhìn thấy số liệu học viên của mentor B ở mọi block.
