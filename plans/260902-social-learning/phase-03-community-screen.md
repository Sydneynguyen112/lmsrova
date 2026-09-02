# Phase 03 — Màn Cộng đồng + tiếng vọng

Nguyên tắc vị trí (biên bản): màn Cộng đồng = mọi thứ về ĐOÀN. Thứ tự dọc có chủ đích: dòng tin trước, bảng đua sau, bảng vàng cuối.

## Files

| File | Việc |
|---|---|
| `app/(dashboard)/student/community/page.tsx` | Route mới. Layout: feed → (desktop 2 cột / mobile dọc) bảng Chăm chỉ + Bền bỉ → Bảng vàng tháng này |
| `components/social/progress-feed.tsx` | "Đoàn người cùng đi": 20 event (`getFeed`), avatar + tên + badge bậc cạnh tên + câu event + "· ngày thứ N" khi có + thời gian tương đối. KHÔNG nút đăng bài/like/comment |
| `components/social/leaderboard-card.tsx` | Dùng chung cho 2 bảng đua: top 10 + hàng nổi bật "Bạn — hạng N/M". Không phân trang, không nút xem thêm. Prop nhận data + đơn vị ("điểm" / "ngày") |
| `components/social/gold-board.tsx` | Bảng vàng: danh sách người tốt nghiệp tháng này, mới nhất trước, "về đích sau N ngày" chỉ khi journey_day khác NULL. Không số thứ tự hạng |
| Sidebar/nav của student | Thêm mục "Cộng đồng" (icon kèm chữ) |
| `app/(dashboard)/student/courses/[courseId]/graduation/GraduationView.tsx` | Tiếng vọng chặng 10: dòng "Tháng này đã có N người về đích" + 3 tên gần nhất (từ `getGoldBoard().total_count`) đặt phía trên form tốt nghiệp |
| `app/(dashboard)/student/profile/page.tsx` | Thêm: chuỗi kỷ lục (`best_len`), số ngày về đích của chính mình (nếu đã tốt nghiệp, kể cả >20 — số của MÌNH thì mình được thấy), `badge-shelf` bản đầy đủ, 2 toggle "Hiện tên đầy đủ" / "Ẩn danh trên bảng xếp hạng" (UPDATE 2 cột profiles của chính mình) |

## Luật hiển thị

- Hai bảng đua: hàng của mình luôn hiện dù đứng 187/187 — nhưng KHÔNG bao giờ render hàng của người khác ngoài top 10.
- Scope "Lớp của tôi": CHƯA render UI (biên bản: giấu tới khi MASTER lên LMS). `getLeaderboardEffort` đã nhận `p_course` sẵn, ngày bật chỉ là thêm toggle.
- Empty state đầu tuần (chưa ai có điểm): câu mời thân thiện, không bảng trống trơ.
- Feed trống (lứa thưa): fallback "Đoàn của bạn đang khởi động…" — không che giấu, không fake tin.
- Toggle ẩn danh có mô tả 1 dòng hệ quả ("tên bạn trên bảng của người khác sẽ thành 'Một bạn học'").

## Kiểm chứng phase

- [ ] Bài test hành lang (nguyên lý 5, bản thiết kế gốc): người chưa từng thấy màn này hiểu trong 3 phút "ai vừa làm gì, mình hạng mấy, huy hiệu kế tiếp" mà không cần giải thích
- [ ] User ẩn danh: tự thấy tên mình ở hàng "Bạn", người khác thấy "Một bạn học"
- [ ] Mobile 375px: 3 khối xếp dọc đúng thứ tự, không tràn ngang
- [ ] GraduationView vẫn hoạt động bình thường khi tháng này 0 người tốt nghiệp (ẩn tiếng vọng, không hiện "0 người")
