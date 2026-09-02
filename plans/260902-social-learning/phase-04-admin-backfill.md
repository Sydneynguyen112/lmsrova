# Phase 04 — Admin "tốt nghiệp mới" + backfill học viên cũ

Hai việc độc lập, gộp phase vì cùng phục vụ ngày go-live.

## 1. Bộ lọc "tốt nghiệp mới" cho admin (thay cho tích hợp Discord)

Mục đích: admin gán role Hạt giống thịnh vượng bên Discord BẰNG TAY không sót người.

| File | Việc |
|---|---|
| Trang danh sách học viên admin (view hiện có) | Thêm filter "Tốt nghiệp, chưa gán Discord": `tier IN ('pro_graduate','master','master_certified') AND hgtv_granted_at IS NULL`, sort theo ngày tốt nghiệp mới nhất |
| Cùng trang | Mỗi dòng: nút "Đã gán role ✓" → set `hgtv_granted_at = now()` (đã gán thì hiện ngày + người bấm khỏi lo double). Kèm cột `discord_handle` có sẵn để admin tra bên Discord |

Nhịp vận hành đề xuất (ghi vào mô tả filter): admin liếc mỗi sáng, gán xong bấm ✓. Không build gì thêm.

## 2. Script backfill trước ngày import 610 học viên cũ

Bối cảnh: trigger phase 1 bỏ qua `source='import'` nên học viên cũ sẽ KHÔNG có event/điểm (đúng luật "import không đổ ra feed") — nhưng huy hiệu chặng, tier và streak nền thì họ xứng đáng có.

| File | Việc |
|---|---|
| `scripts/backfill-social.mjs` (chạy tay, service key, theo nếp `scripts/` hiện có) | Với mọi user có `student_stage_progress.completed_at NOT NULL`: upsert `user_badges` từng chặng đã qua + set `tier='pro_graduate'` cho ai xong chặng graduation (chỉ nâng, không hạ). KHÔNG insert `activity_events`, KHÔNG cộng `effort_daily` quá khứ (điểm và streak của họ bắt đầu từ 0 kể từ go-live — chuỗi là thói quen hiện tại, không phải công trạng cũ) |
| Cùng script | Flag `--dry-run` in số lượng sẽ ghi trước khi chạy thật |

## Kiểm chứng phase

- [ ] Import thử 3 user giả lập (source='import') → 0 event, 0 điểm; chạy backfill → có huy hiệu + tier đúng, feed vẫn sạch
- [ ] Chạy backfill 2 lần → kết quả y hệt (idempotent)
- [ ] Filter admin: user vừa tốt nghiệp hiện lên trong vòng 1 giờ (theo nhịp engine pg_cron), bấm ✓ thì biến khỏi filter
- [ ] `--dry-run` không ghi gì vào DB (so count trước/sau)
