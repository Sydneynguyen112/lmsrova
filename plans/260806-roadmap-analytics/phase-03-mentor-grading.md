# Phase 03 — Mentor: chấm từng ảnh, ghi lần chạm, đổi tag học viên

## Context Links
- [Main Plan](plan.md) · [Phase 01](phase-01-database.md) · [Phase 02](phase-02-tracking-engine.md)
- Files chính: `app/(dashboard)/mentor/submissions/page.tsx`, `app/(dashboard)/mentor/students/[studentId]/StudentDetailView.tsx`, `app/(dashboard)/mentor/students/page.tsx`, admin tương ứng

## Overview
- **Description:** Toàn bộ công cụ phía mentor: hàng đợi chấm ảnh, chấm Đúng/Sai từng ảnh, ghi chú lần chạm có kênh/loại, gắn/đổi tag trạng thái có lý do.
- **Priority:** P0 (song song phase 02 được)

## 1. Hàng đợi chấm bài (mentor/submissions)

- Nguồn: `submission_images` verdict='pending' của học viên mình phụ trách (join profiles.mentor_id), group theo học viên → chặng, cũ nhất lên đầu.
- Header hiện: tổng ảnh chờ chấm + số học viên đang bị "Chờ chấm" (đồng hồ họ đang dừng vì mình) — tạo áp lực SLA đúng chỗ.
- Màn chấm: xem ảnh lớn (+ metadata pair/timeframe/note của submission), 2 nút **Đúng / Sai**, ô nhận xét không bắt buộc (bắt buộc nên có khi Sai — warning nhẹ nếu bỏ trống, không chặn). Phím tắt: `C` đúng, `X` sai, `Enter` lưu + ảnh kế.
- Lưu: update verdict + feedback + graded_by + graded_at. Sau mỗi lần chấm gọi `checkAndCompleteStages(userId)` (ảnh thứ 20 correct có thể mở quiz) — trigger DB phase 02 đã lo pause/unpause.

## 2. Ghi chú lần chạm (StudentDetailView)

- Form ghi chú thêm 2 select bắt buộc: **Kênh** (`call` Gọi điện · `zalo` Zalo · `zoom` Zoom · `app` Nhắn trong app) và **Loại** (`nhac_bai` Nhắc bài · `go_ket` Gỡ kẹt · `cham_soc` Chăm sóc · `khac` Khác).
- Timeline ghi chú hiển thị badge kênh + loại. Mỗi note = 1 lần chạm (máy đếm cho quy tắc đề xuất rời bỏ + chỉ số 48h).

## 3. Gắn / đổi tag trạng thái

Trong StudentDetailView (mentor + admin):
- Hiện tag hiện tại + cờ (Kẹt/Chờ chấm) + lịch sử `status_events` (10 dòng gần nhất).
- Người chỉ được gắn tay: `roi_bo`, `tam_dung`, và gỡ về `dung_tien_do` (trường hợp đặc biệt). `hoan_tien` chỉ admin. Các tag máy (`cham`, `quay_lai`, `tot_nghiep`) KHÔNG cho gắn tay — disable trong UI.
- Khi gắn `roi_bo`/`tam_dung`/`hoan_tien`: modal bắt buộc nhập lý do → gọi RPC `set_student_status(user, status, reason, currentUserId)`.
- `tam_dung`: set pause trên dòng stage progress đang mở; gỡ tạm dừng → unpause + giãn deadline (cơ chế phase 02 mục 5).
- **Banner đề xuất máy**: nếu học viên `cham` ≥14 ngày VÀ đếm user_notes ≥3 kể từ khi rơi vào chậm → banner vàng "Máy đề xuất gắn Rời bỏ — chậm X ngày, đã chạm Y lần" + nút gắn nhanh. Máy KHÔNG tự gắn.
- Toggle riêng `ready_for_coaching` (bộ lọc "Sẵn sàng Coaching" — không phải status).

## 4. Danh sách học viên của mentor (mentor/students)

- Cột mới: Tag trạng thái (màu: dung_tien_do xanh lá · cham vàng · két đỏ đậm · roi_bo xám · quay_lai xanh dương · tam_dung xám nhạt · tot_nghiep xanh đậm) + cờ Kẹt/Chờ chấm + chặng hiện tại + số ngày ở chặng + lần chạm gần nhất.
- Filter theo tag + cờ + ready_for_coaching. Sort mặc định: Kẹt trước → Chậm → còn lại.
- Bỏ hiển thị risk_tag cũ ở mọi màn (giữ cột DB, không xoá).

## Acceptance criteria
- [ ] Mentor chấm ảnh thứ 20 đúng → học viên thấy nút quiz ngay lần refresh kế (không cần mentor làm gì thêm).
- [ ] Gắn Rời bỏ không nhập lý do → bị chặn. Lịch sử status_events hiện đúng người đổi + lý do.
- [ ] Học viên roi_bo xem 1 video → cron/refresh đổi quay_lai (máy), deadline chặng đang dở reset từ ngày quay lại.
- [ ] Mentor không thấy/không sửa được học viên của mentor khác (check mentor_id ở query).
