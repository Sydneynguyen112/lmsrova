# Social Learning — feed tiến bộ, huy hiệu, 3 bảng xếp hạng

## Overview

- **Date:** 2026-09-02
- **Goal:** Dựng tầng social learning cho học viên: dòng tin tiến bộ máy sinh 100%, tủ huy hiệu, 3 bảng xếp hạng (Chăm chỉ tuần / Bền bỉ / Bảng vàng tốt nghiệp tháng), khối "Nhịp & đoàn của bạn" ở trang nhà. LMS thuần, KHÔNG tích hợp Discord.
- **Nguồn chân lý (logic):** vault `2ndbrain/11-giao-dich-tai-chinh/production/lms-social-learning-chot-logic.md` (biên bản chốt cùng Sydney 02-09-2026). Plan này chỉ dịch logic đó sang kỹ thuật — mâu thuẫn thì biên bản thắng.

## Quyết định đã chốt (tóm tắt từ biên bản)

| Quyết định | Chốt |
|---|---|
| Điểm nỗ lực | +1 lần đầu vào học trong ngày · +2 hoàn thành bài · +3 nộp bài tập · +5 qua chặng · trần 10/ngày. Hằng số để một chỗ (`lib/social-config.ts` mirror trong SQL) |
| 3 bảng | Chăm chỉ (tuần lịch VN, reset 0h thứ Hai) · Bền bỉ (chuỗi ngày, không cửa sổ) · Bảng vàng (tháng lịch, không xếp hạng) |
| Hiển thị bảng | Top 10 + dòng "Bạn hạng N/M". Không xem full, không hiện đáy |
| Streak | Ân xá 1 ngày: nghỉ 1 ngày lẻ không đứt, nghỉ 2 ngày liên tiếp về 0. Đứt thì im lặng, giữ kỷ lục `best_len`. Đồng hạng: ai đạt trước đứng trên |
| Feed | 3 loại event: stage_completed · badge_earned · graduated. "Ngày thứ N" CHỈ hiện khi N ≤ 2 × order_index chặng (đúng nhịp 10 chặng/20 ngày); Bảng vàng kèm số ngày chỉ khi ≤ 20. KHÔNG BAO GIỜ hiện ngày nhập học tuyệt đối |
| Tên | Mặc định rút gọn "Minh N." + avatar; profile toggle `show_full_name` và `is_anonymous` ("Một bạn học"). Tên do server render trong RPC, client không nhận full_name của người khác khi ẩn danh |
| Huy hiệu | Mỗi chặng 1 · tốt nghiệp · bậc · "Top 10 tuần" (cron sáng thứ Hai, lặp lại thì tăng `times`) |
| Bậc | `profiles.tier`: pro → pro_graduate → master → master_certified. Chỉ đi lên, trigger không bao giờ hạ |
| Vị trí | Trang nhà = của TÔI (khối nhịp & đoàn + tủ huy hiệu cuối trang). Màn Cộng đồng = của ĐOÀN (feed + 2 bảng đua + bảng vàng). Tiếng vọng: chặng 10 hiện "tháng này N người về đích"; hồ sơ giữ kỷ lục |
| Scope theo khóa | Dữ liệu có `course_id` ngay từ đầu; UI "Lớp của tôi" GIẤU tới khi MASTER lên LMS |
| Discord | Không đụng. Chỉ thêm bộ lọc "tốt nghiệp mới" + cột đánh dấu đã gán role tay cho admin |

## Ràng buộc sống còn

- **Client không ghi bảng social.** App gọi Supabase thẳng bằng anon key → mọi dữ liệu social sinh bằng trigger trên bảng có sẵn (`lesson_progress`, `submissions`, `student_stage_progress`); client chỉ đọc qua RPC SECURITY DEFINER. Không theo nếp RLS allow_all cũ.
- **Idempotent.** Engine pg_cron chạy lại mỗi giờ; trigger dựa trên chuyển tiếp `completed_at NULL → NOT NULL` + UNIQUE/ON CONFLICT, chạy lại không sinh dòng đôi.
- **Import không đổ ra feed.** `student_stage_progress.source='import'` → trigger bỏ qua event/điểm (huy hiệu + tier vẫn cấp bằng script backfill riêng, không event).
- **Múi giờ `Asia/Ho_Chi_Minh`** cho mọi phép tính ngày/tuần/tháng (helper `vn_today()`). pg_cron chạy UTC → lịch thứ Hai 00:05 VN = Chủ nhật 17:05 UTC.
- Schema additive; không sửa cột cũ. Mọi khẳng định tư tưởng (không bêu, không dọa streak) là luật sản phẩm, xem biên bản mục "Cố tình KHÔNG làm".
- Ô streak hiện tại ở `app/(dashboard)/student/page.tsx` (`calculateStreak`, mock từ submissions, tự cộng hôm nay khi mở trang) sẽ bị **thay ruột** bằng RPC — xóa mock, không giữ song song hai nguồn số.

## Phases

1. [phase-01-database.md](phase-01-database.md) — `supabase-social.sql`: bảng + trigger + RPC + seed huy hiệu + cron Top 10 tuần
2. [phase-02-home-pulse.md](phase-02-home-pulse.md) — `lib/api-social.ts` + khối "Nhịp & đoàn của bạn" + thay ruột ô streak + tủ huy hiệu cuối trang nhà
3. [phase-03-community-screen.md](phase-03-community-screen.md) — màn Cộng đồng (feed + 2 bảng + bảng vàng) + tiếng vọng chặng 10 + hồ sơ
4. [phase-04-admin-backfill.md](phase-04-admin-backfill.md) — bộ lọc "tốt nghiệp mới" cho admin + script backfill 610 học viên cũ

Mỗi phase ship độc lập: xong phase 1 dữ liệu tích lũy ngầm; phase 2–3 bày ra màn hình; phase 4 trước ngày import.

## Thứ tự triển khai (zero downtime)

1. Chạy `supabase-social.sql` (additive) → trigger bắt đầu tích điểm ngầm cho học viên đang học
2. Deploy phase 2 (trang nhà) — an toàn vì chỉ đọc
3. Deploy phase 3 (màn Cộng đồng)
4. Trước khi import học viên cũ: chạy script backfill phase 4

Rollback từng phase: UI là component mới, gỡ bằng revert; SQL rollback = DROP các object `social_*` (không đụng bảng cũ).

## Kiểm chứng (khớp mục Kiểm chứng của biên bản)

- [ ] Qua 1 chặng (source='app') → đúng 1 `activity_events` + 1 `user_badges` + effort +5; UPDATE lại dòng đó lần nữa → không sinh gì thêm
- [ ] `source='import'` → không event, không điểm
- [ ] Cày cả ngày → `effort_daily.points` đứng ở 10
- [ ] Streak: học 3 ngày, nghỉ 1, học tiếp → chuỗi 4; nghỉ 2 ngày liền → về 0 lặng lẽ, `best_len` giữ nguyên
- [ ] Chặng tốt nghiệp completed → `tier='pro_graduate'`, event graduated; admin set tay tier cao hơn → trigger không hạ xuống
- [ ] "Ngày thứ N": qua chặng order_index=7 ở ngày 9 → event có journey_day=9; ở ngày 20 → journey_day NULL
- [ ] `is_anonymous=true` → RPC trả "Một bạn học", không lộ full_name; client SELECT thẳng bảng social → RLS chặn
- [ ] Cron thứ Hai: 10 người tuần trước nhận badge top10 (lần 2 tăng `times`, không lỗi unique)
- [ ] `npm run build` + `tsc --noEmit` sạch

## Rủi ro đã ghi nhận

- `lesson_progress`/`submissions` vẫn client-writable (kiến trúc hiện tại) → học viên rành kỹ thuật có thể farm điểm; trần 10/ngày chặn thiệt hại. Sửa tận gốc thuộc dự án siết RLS (đã có `supabase-rls-profiles-hardening.sql` làm tiền lệ).
- Danh tính caller trong RPC là `p_viewer uuid` do client gửi (vì `auth.uid()` không khớp `profiles.id` — app map bằng email + fallback localStorage, xem phase 1 mục 6). Luật ẩn danh không phụ thuộc caller nên vẫn giữ; spoof chỉ xem được hạng người khác.
- Leaderboard tuần quét `effort_daily` toàn bộ user: OK với ngàn học viên (index `(day, course_id)`); nếu chậm mới thêm bảng tổng, chưa làm.
- `enrollments` có thể có nhiều dòng/user/course (không UNIQUE) → journey_day lấy `MIN(enrolled_at)`.
- Học viên chưa có `enrollments.completed_at` khi tốt nghiệp qua form → Bảng vàng đọc từ event graduated (nguồn duy nhất), không phụ thuộc cột đó.
