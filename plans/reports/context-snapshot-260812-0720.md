# Context Snapshot — 260812-0720

## Việc đang làm dở
Chỉnh chữ trong artifact onboarding (bản v6 — tone editorial giấy ngà, đã publish). CHƯA áp dụng các sửa dưới đây.

- Artifact URL (giữ nguyên khi republish): https://claude.ai/code/artifact/b6f23648-2203-4cd2-b397-89bf333c2456
- File HTML: `/private/tmp/claude-501/-Users-sydneynguyen-Desktop-LMS/0a9c15c5-af90-4915-b892-9741a4fc56a8/scratchpad/rova-onboarding-flow.html`
- Republish: gọi Artifact với cùng file_path, favicon 🧭.
- Bản hiện tại (v6): tone/màu/font lấy theo artifact "Vì sao form Onboarding có bộ câu hỏi này" (0e831241-112d-4608-8a77-6713974b26fb): nền #EDE8D8, vàng #A87B12, Georgia display, masthead + h2-row đánh số 01–04, 4 mục: 01 Ba phễu, 02 Đường ống 5 bước, 03 Swimlane trạng thái, 04 Nguyên tắc.

## Yêu cầu sửa CHƯA làm (lời user, turn cuối)
1. Dòng filed masthead "Hoàn thành: hồ sơ đủ + thật" → viết hoa chữ cái đầu: "Hồ sơ đủ + thật". (Lưu ý: CSS `.filed` đang `text-transform: uppercase` — nếu vẫn hiện thường/không đúng ý, bỏ text-transform và viết hoa thủ công.)
2. Bảng 5 bước, hàng **B1**:
   - Cột Mentor/Sale: thay "Gửi form + câu dẫn ... / Hẹn giờ gọi" bằng 3 dòng: `Nhắn tin CTA` / `Link đăng ký LMS + Link Form` / `Hẹn lịch gọi`
   - Cột Tài liệu: `Link form` / `Video "Ý nghĩa, lợi ích việc điền form"` / `Kịch bản nhắn tin CTA`
3. Hàng **B2**:
   - Cột Khách: `Trả lời form (Các câu hỏi nền tảng)`
   - Cột Tài liệu: `Form Onboarding`

## Việc đã xong (không đụng lại)
- Artifact đã qua v3→v6: bỏ hạn chốt, webinar ads→Zoom→chốt đơn full→gửi link (HAM→Andrew xen kẽ, 3 bước đánh số), gate duyệt tay, scope onboarding = hồ sơ đủ (auto-tick, không chặn học), bỏ xếp nhóm/mục 06/email nurture/flagbox, swimlane Khách·Hệ thống·Mentor, NHÃN: 1ST CALL, xuống dòng viết hoa từng ý, retheme editorial.
- rova-ops đã commit + push main từ trước (bdaf342, 1e54484, f2511e2). Form 13 câu vẫn Nháp.
