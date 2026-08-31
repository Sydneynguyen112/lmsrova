# Context Snapshot — 260811-2310

## Việc đang làm dở
Chỉnh artifact blueprint quy trình onboarding theo yêu cầu mới nhất của user (CHƯA áp dụng).

- Artifact URL (giữ nguyên khi republish): https://claude.ai/code/artifact/b6f23648-2203-4cd2-b397-89bf333c2456
- File HTML: `/private/tmp/claude-501/-Users-sydneynguyen-Desktop-LMS/0a9c15c5-af90-4915-b892-9741a4fc56a8/scratchpad/rova-onboarding-flow.html` (bản blueprint v2: khung tên bản vẽ + nền kẻ ô + 5 section: 01 ba phễu → hub form, 02 chuỗi B1–B5 + bảng 4 cột, 03 bảng xếp nhóm, 04 chuỗi trạng thái, 05 bảng nguyên tắc)
- Republish: gọi Artifact với cùng file_path (cùng session) → giữ URL. favicon 🧭.

## Yêu cầu chỉnh sửa CHƯA làm (lời user, turn cuối)
1. **Bỏ dòng "Hạn chốt: giao ban thứ 4"** trong khung tên bản vẽ (facts).
2. **Phễu Webinar** — thứ tự đúng: ads → Zoom → đăng ký (chốt đơn) → gửi NGAY link đăng ký LMS.
   - Quy trình nhỏ kèm theo: **Mentor theo dõi bill thanh toán**. Chia đơn FULL cố định: **đơn đầu tiên = anh HAM, đơn tiếp theo = Tiến, xen kẽ cho đến khi hết đơn full**. Mentor thấy bill → **chủ động nhắn Zalo + gọi điện ngay lập tức** cho khách để được kết bạn và gửi link đăng ký LMS.
   - Sau khi khách đăng ký LMS: **admin/mentor duyệt tay** thì khách mới được hiển thị/mở khóa: **video onboarding + form + khóa học** → sau đó vào quy trình chung (5 bước) như cũ.
3. **Phễu Tư vấn trực tiếp**: sale là người hướng dẫn đăng ký → **báo cho mentor/admin duyệt tay** cho khách → mở khóa video onboarding + form + khóa học.

## Gợi ý cách thể hiện (tự quyết khi làm)
- Trong ô Webinar: ghi chuỗi ads → Zoom → đăng ký → gửi link LMS; thêm dòng nhỏ "Chia đơn full: HAM → Tiến xen kẽ · thấy bill → Zalo/gọi ngay".
- Thêm 1 node/dải chung "ADMIN/MENTOR DUYỆT TAY → mở khóa video onboarding + form + khóa học" nằm giữa 3 phễu và hub Form (vì cả webinar lẫn sale đều qua bước duyệt tay).
- Giữ nguyên các section 02–05.

## Việc đã xong trong phiên (không đụng lại)
- rova-ops: trang điền form công khai /forms/[formId] (đã commit bởi phiên song song, bdaf342); rename "Hồ sơ khách hàng" (1e54484); gate super_admin cho /admin/users (f2511e2) — đã push main.
- Form onboarding 13 câu trên RovaOps: vẫn Nháp, chưa publish.
