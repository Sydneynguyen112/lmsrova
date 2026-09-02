# Phase 02 — Trang nhà: khối "Nhịp & đoàn của bạn" + tủ huy hiệu

Nguyên tắc vị trí (biên bản): trang nhà = mọi thứ về MÌNH. Mở trang trong 5 giây đầu vẫn phải là "hôm nay làm gì" — khối mới không được che việc kế tiếp.

## Files

| File | Việc |
|---|---|
| `lib/social-config.ts` | Hằng số mirror SQL: điểm 1/2/3/5, trần 10, nhịp chuẩn 2 ngày/chặng, khung tốt nghiệp 20 ngày. Comment trỏ về `supabase-social.sql` — sửa một bên phải sửa bên kia |
| `lib/api-social.ts` | Wrapper các RPC phase 1: `getMyPulse`, `getLeaderboardEffort`, `getLeaderboardStreak`, `getGoldBoard`, `getFeed`, `getMyBadges` + types. Chỉ `supabase.rpc(...)`, không query bảng social trực tiếp |
| `components/social/pulse-card.tsx` | Khối "Nhịp & đoàn của bạn": chuỗi ngày + hạng tuần + 2-3 dòng tin mới nhất, cả khối là link sang `/student/community` |
| `components/social/badge-shelf.tsx` | Tủ huy hiệu: đã có = màu, chưa có = bóng mờ + tên (dữ liệu `getMyBadges`). Prop `compact` (1 hàng, trang nhà) / đầy đủ (hồ sơ, phase 3) |
| `app/(dashboard)/student/page.tsx` | Gắn `pulse-card` vào vị trí ô streak hiện tại; **xóa hẳn** `calculateStreak()` mock (dòng ~148-183) và mọi hiển thị đọc từ nó; gắn `badge-shelf compact` CUỐI trang |

## Luật hiển thị (đóng đinh, không sáng tạo thêm)

- Chuỗi: chỉ câu trạng thái dương "Đang học đều N ngày" (N=0 → "Hôm nay là ngày đẹp để bắt đầu chuỗi mới"). KHÔNG đếm ngược, KHÔNG cảnh báo sắp đứt, KHÔNG thông báo khi đứt.
- Hạng: "Bạn đang hạng N/M tuần này". Không hiện điểm của người khác trong khối này.
- Tin: câu máy viết theo `event_type`, có `journey_day` thì thêm "· ngày thứ N" (NULL thì thôi, không placeholder).
- Ngôn ngữ đời thường, không thuật ngữ; icon luôn kèm chữ (luật UI của bản thiết kế gốc).

## Kiểm chứng phase

- [ ] User mới (chưa có dữ liệu social) mở trang nhà: không lỗi, khối hiện trạng thái rỗng thân thiện
- [ ] Grep `calculateStreak` = 0 kết quả (mock đã chết hẳn)
- [ ] Trang nhà first paint không chậm đi rõ rệt (pulse + badges fetch song song, có skeleton)
- [ ] `npm run build` sạch
