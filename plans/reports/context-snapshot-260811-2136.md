# Context Snapshot — 260811-2136

## Nhiệm vụ hiện tại
User vừa yêu cầu: **code giao diện điền biểu mẫu (student-facing) giống Google Forms** cho form onboarding trên rova-ops.

## Việc đã hoàn thành trong phiên
1. **Thiết kế bộ câu hỏi onboarding v3** (12→13 câu): spec đầy đủ tại `plans/reports/spec-260811-1942-onboarding-form-content.md`
   - Phần A (5 câu nền tảng): thâm niên, đã đặt lệnh chưa, TradingView, checklist TỰ TAY (chọn nhiều 6 ô), thiết bị
   - Phần B (5 câu): thời gian/ngày, khung giờ (chọn nhiều), mục tiêu, lý do (văn bản dài), kiểu học (dồn sức→14 ngày / đều đặn / cảm hứng→20 ngày)
   - Phần C (3 câu): nguồn phễu, ô phụ Zoom/giới thiệu (văn bản ngắn, KHÔNG bắt buộc), người hướng dẫn (Andrew / Ham / không nhớ)
   - Phân loại: Khởi động (chưa đặt lệnh hoặc checklist ≤1 → gợi ý khóa cơ bản SONG SONG, không chặn) / Sẵn sàng / Tăng tốc (checklist ≥4 + ≥6 tháng → 14 ngày). Setup TradingView bắt buộc với TẤT CẢ.
   - Đã đo dữ liệu thật (2 CSV Tốt nghiệp × Phân loại): bộ câu thái độ cũ KHÔNG dự đoán tốt nghiệp → đã bỏ.
2. **Đã tạo form trên https://rova-ops.vercel.app/admin/forms/** (đăng nhập qua Chrome thật của user, deviceId 28c53a96-35d3-4027-852d-fa8a0ac5825c, tab 1297847321):
   - Form ID: `form-msoqdm0f-8bch`, URL editor: https://rova-ops.vercel.app/admin/forms/form-msoqdm0f-8bch/
   - Đủ 13 câu đúng thứ tự, tất cả bắt buộc trừ câu 12. Trạng thái: **Nháp, CHƯA xuất bản**.
   - Lưu ý: tiêu đề hiển thị bị cắt "Form Onboarding — Xếp" (đã báo user).

## Việc tiếp theo (sau /compact)
- Code giao diện student điền form kiểu Google Forms.
- **Câu hỏi chưa trả lời: repo rova-ops nằm ở đâu trên máy?** Desktop/LMS chỉ chứa `lmsrova` (LMS học viên, Next.js 16 + Supabase). rova-ops là app khác (admin/mentor). Cần hỏi user đường dẫn repo rova-ops trước khi code.
- Tham khảo UI: form editor rova-ops đã có sẵn các loại câu: Văn bản ngắn/dài, Chọn một, Chọn nhiều, Dropdown, Đánh giá sao.
- Style Google Forms: mỗi câu một card, tiến độ, nút Tiếp/Quay lại hoặc scroll dọc, màu chủ đạo theo theme ROVA (vàng gold + nền tối).

## Quyết định đã chốt trong phiên (không hỏi lại)
- Tốt nghiệp mục tiêu 14–20 ngày; đo tiến độ bằng bài tập + quiz, không đo thời lượng video.
- Không quiz khái niệm; không cờ cảnh báo trong form (thuộc RovaOps xử lý sau).
- Không thu mã nhân sự — dùng tên mentor. Không hỏi kênh nhắc (mặc định gọi + Zalo).
- Câu thu nhập bỏ khỏi form (mentor hỏi miệng sau).
