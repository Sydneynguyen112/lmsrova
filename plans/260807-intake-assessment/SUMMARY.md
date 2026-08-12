# Bài test khám bệnh — Bản đồ hệ thống & nhật ký refactor

> Cập nhật: 2026-08-12 · Bổ sung cho [plan.md](./plan.md) (bản thiết kế gốc 2026-08-07).
> plan.md = *định làm gì*. File này = *đang nằm ở đâu, tính thế nào, sửa ở đâu*.

---

## 1. Việc đã làm trong đợt này

### 1.1 Kéo code về local
Clone `rova-lms` đang tụt sau remote 6 commit — toàn bộ feature khám bệnh nằm ở
`fcd3e06 feat(intake): bài test khám bệnh thay khảo sát onboarding 8 câu`, chưa có trên máy.
Đã `git pull --ff-only`: `074cf2b` → `a7b7c71`.

### 1.2 Gom nội dung vào một đầu mục — `lib/intake-content/`
Trước đó chữ nghĩa nằm rải rác: luận giải tính cách chôn trong engine chấm điểm,
bảng thần số học/hoàng đạo chôn trong file toán, nhãn trình độ chôn trong file UI,
biểu mẫu dự phòng là một file riêng. Sửa một câu chữ phải mở 4 file khác nhau.

Đã tách thành `lib/intake-content/` — xem [index.ts](../../lib/intake-content/index.ts):

| File | Nội dung | Sửa khi nào |
|---|---|---|
| `display.ts` | **17 công tắc bật/tắt** từng khối hiển thị | Muốn ẩn/hiện một phần |
| `copy.ts` | Chữ giao diện + `fillCopy()` thay `{khoá}` | Đổi câu chữ nút/tiêu đề |
| `personality.ts` | Luận giải 4 nhóm tính cách + thứ tự ưu tiên khi hoà phiếu | Đổi lời đọc vị |
| `life-path.ts` | Luận giải 12 số chủ đạo + danh sách số master | Đổi lời thần số học |
| `zodiac.ts` | Luận giải 12 cung + mốc ngày phân cung | Đổi lời hoàng đạo |
| `can-chi.ts` | Bảng Can + Chi | Hầu như không |
| `labels.ts` | Nhãn hệ thống (section, chiều, cờ, nhóm chăm sóc, trình độ) | ⚠️ Phải mirror sang ops |
| `questions.ts` | Biểu mẫu 10 câu dự phòng | Thêm/bớt câu hỏi dự phòng |
| `types.ts` | Kiểu dùng chung — cắt vòng import content ↔ engine | Đổi cấu trúc, không phải đổi chữ |

Hệ quả:
- `lib/astro.ts` giờ **thuần toán**, không còn một chữ tiếng Việt nào.
- `lib/intake-scoring.ts` giờ **thuần engine**; vẫn re-export lại nhãn + kiểu nên
  bản mirror `OPS_ROVA/lib/intake-meta.ts` **không phải sửa gì**.
- `lib/intake-fallback.ts` bị xoá, chuyển thành `intake-content/questions.ts`.
  `order_index` sinh theo vị trí mảng thay cho biến `seq` dùng chung (thêm câu ở
  giữa không còn lệch số thứ tự).
- `IntakeResultScreen.tsx` và `onboarding/page.tsx` không còn chuỗi chữ hardcode.

Commit: `2e8f578 refactor(intake): gom nội dung bài test khám bệnh vào lib/intake-content`

### 1.3 Gộp ý nghĩa onboarding vào bài khám bệnh

**Bối cảnh:** việc gộp thực ra đã xong từ `fcd3e06` — bài khám bệnh *đã thay*
khảo sát 8 câu, route `/onboarding` chính là bài khám bệnh. Còn sót lại 2 mảnh:

**Mảnh 1 — khối "Bước kế tiếp" trên màn kết quả (LMS).**
Onboarding lẽ ra phải "gợi ý lộ trình học tập tiếp theo" — video chào mừng còn
hứa sẵn câu này với học viên ([onboarding-video/page.tsx:26](../../app/(auth)/onboarding-video/page.tsx))
— nhưng phần đó chưa hề tồn tại. Đã dựng:
- `lib/intake-next-step.ts` — `getIntakeNextStep()`, gọi sau `submitIntake` (lúc
  đó chặng 1 vừa xong, chặng 2 đã mở). Dùng lại `buildDailyTodo` + `suggestPace`
  có sẵn, **không bịa lộ trình riêng**. Tự nuốt lỗi → hỏng thì chỉ mất khối gợi ý.
- Màn kết quả hiện thêm: "Chặng 2/10 — Xem video" + thanh tiến độ · việc kế tiếp
  bấm vào đi thẳng bài học · chọn nhịp học ngay tại chỗ (gợi ý sẵn theo trình độ).
- Nút cuối đi thẳng vào việc kế tiếp thay vì về trang chủ.
- Học viên chọn nhịp tại đây → `DailyTodoCard` ngoài trang chủ không hỏi lại.
- 5 công tắc mới trong `display.ts`: `showNextStep` (tắt cả khối) ·
  `showStageProgress` · `showNextTask` · `showPacePicker` · `ctaGoesToLesson`.

> **Giới hạn phải nói thẳng:** lộ trình hiện **giống hệt nhau cho mọi học viên** —
> 10 chặng cố định, cùng thứ tự, cùng `target_days`. `isStageConditionMet()`
> không đọc `classification` / `personality_group` / `dimension_scores`.
> Toàn bộ ảnh hưởng của trình độ là: highlight sẵn một nút nhịp học, và nhịp đó
> quyết định hiện **3 hay 2** việc mỗi ngày (cùng danh sách, cùng thứ tự).
> Muốn cá nhân hoá thật (chiều yếu → đẩy bài tương ứng lên trước, hoặc nới
> `target_days` cho newbie) thì phải **tạo mới dữ liệu ánh xạ** — hiện không tồn
> tại ở bảng nào, file nào. Khối UI đã dựng sẵn để cắm mapping vào sau.

**Mảnh 2 — `form_type='onboarding'` mồ côi (ops).**
Loại form này không code nào bên LMS đọc, nhưng trang public `/forms/[formId]`
vẫn bắt nhập tên+SĐT và hiện "Mentor của ROVA sẽ liên hệ" — tức nó đang đóng vai
**form thu lead**. Đã đổi nhãn cho đúng việc nó làm, không đụng DB, form cũ không hỏng:
- Danh sách tạo form: "Onboarding · Hiện khi học viên đăng ký" → **"Khảo sát thu
  lead · Form công khai, bắt nhập tên + SĐT"**
- Badge: "Onboarding" → **"Thu lead"** (cả trang danh sách và trang chi tiết)

### 1.3 Kiểm chứng
- `tsc --noEmit` sạch · `npm run build` pass (17 route).
- Script tạm chạy **29/29 assert** rồi xoá:
  - Bảng đáp án chuẩn cuối `astro.ts`: thần số học (7 / 11 giữ master / 6), 6 mốc
    biên phân cung (18-19/2, 20-21/3, 5/1, 25/12), can chi (Giáp Tý / Mậu Thìn / Canh Thìn).
  - Biểu mẫu dự phòng: đúng 10 câu, `order_index` = 10…100, id đầu/cuối đúng.
  - 4 kịch bản engine: hoà phiếu → tie-break; bỏ qua câu nhạy cảm → không bị phạt
    điểm và không sinh cờ; đáp án rủi ro → bắt đúng cờ + `uu_tien_cham_soc`;
    `student_visible` không rò một chữ nào về cờ / nhóm chăm sóc.
- Thử lật 8 công tắc sang `false` rồi typecheck lại → sạch, `as const` không gây lỗi.

---

## 2. Luồng học viên

```
/register  →  (chờ admin/mentor duyệt)  →  /onboarding-video  →  /onboarding  →  /student
                                           (video chào mừng,      (BÀI TEST
                                            không chặn)            KHÁM BỆNH)
```

- Cổng chuyển hướng: `student/page.tsx:115` — `onboarding_survey` null + đã duyệt → đá sang `/onboarding-video`.
- `/onboarding-video` không chặn: `page.tsx:96` chỉ ghi mốc 80% để thống kê, nút
  "Tiếp tục" luôn bấm được. Chưa cấu hình video → nhảy thẳng `/onboarding`.
- **Route `/onboarding` chính là bài test khám bệnh** — tên route là di sản cuối
  cùng của khảo sát 8 câu cũ.
- Trạng thái trang: `intro → form → computing → result`.

---

## 3. Kết quả được tính thế nào

Đầu mối duy nhất: `computeIntake()` — [intake-scoring.ts](../../lib/intake-scoring.ts).

| Thứ hiện ra | Hàm tính | Cách tính |
|---|---|---|
| **Nhóm tính cách**<br>"Nhà giao dịch Thận trọng" | `derivePersonalityGroup()` | Bầu đa số các option có gắn `optionGroups`. Hoà phiếu → theo `PERSONALITY_TIEBREAK` (mặc định nghiêng phía an toàn: thận trọng > kỷ luật > cảm nhận > mạo hiểm) |
| **Số chủ đạo** | `lifePathNumber()` (astro) | Pythagoras: cộng hết chữ số `YYYYMMDD`, rút gọn tới ≤9, giữ master 11/22/33 |
| **Cung hoàng đạo** | `westernZodiac()` (astro) | Duyệt ngược `ZODIAC_ORDER`, lấy cung đầu tiên đã bắt đầu |
| **Năm sinh can chi** | `canChi()` (astro) | `CAN[(year-4)%10]` + `CHI[(year-4)%12]` |
| **Thanh % 4 chiều** | `computeDimensionScores()` | `earned/max` theo `optionScores`. Câu bỏ qua **không tính vào `max`** — không phạt người không chia sẻ |
| **Trình độ** | `mapClassification()` | Chạm đáy bất kỳ chiều trading → cap `newbie`. Không thì theo TB 4 chiều: ≤25 newbie · ≤50 beginner · ≤75 intermediate · >75 advanced |
| **Điểm mạnh / yếu / lời khuyên** | tra `PERSONALITY_INFO` | **Tĩnh theo archetype**, không sinh động theo câu trả lời |
| *(ẩn)* **Cờ rủi ro** | `collectFlags()` | Gom `optionFlags` của các option đã chọn |
| *(ẩn)* **Nhóm chăm sóc** | `computeCareGroup()` | `no_nang` HOẶC ≥2 cờ mềm → ưu tiên chăm sóc · 1 cờ → theo dõi sát · sạch cờ + trading ≥70% → tiềm năng cao · còn lại bình thường |

### Ranh giới riêng tư — bất di bất dịch
`student_visible` là payload **duy nhất** màn kết quả học viên đọc.
`flags` và `care_group` **tuyệt đối không được lọt vào** ([intake-scoring.ts:280](../../lib/intake-scoring.ts)).
Đã có assert kiểm chuyện này.

### Cảnh báo về bộ câu hỏi dự phòng
Thang điểm `[1,2,3,4]` nghĩa là **chọn đáp án thấp nhất vẫn ra 25%, không bao giờ ra 0%**.
Nếu muốn có mốc 0% thì thang phải bắt đầu từ 0.

---

## 4. Câu hỏi đến từ đâu

Hai nguồn, ưu tiên nguồn 1:

1. **Form `form_type='intake'` đang published** — soạn bên ops, `getPublishedIntakeForm()`.
2. **Bộ dự phòng 10 câu trong code** — `getFallbackQuestions()`, dùng khi chưa
   publish form nào. `form_id = null`, chạy y hệt pipeline thật.

Rollback an toàn: unpublish form → học viên mới rơi về bộ dự phòng.

---

## 5. Dữ liệu được lưu ở đâu

`submitIntake()` — [api-intake.ts:67](../../lib/api-intake.ts). Thứ tự **bắt buộc**:

1. `form_responses` (grade = null, để không lọt vào query tốt nghiệp) + `form_answers` (chỉ câu đã trả lời)
2. Tính điểm client-side
3. Upsert `intake_results` — giữ cả `student_visible` dạng JSON
4. Update `profiles`: `classification`, `care_group`, `date_of_birth`, **`onboarding_survey`**
5. `initStudentRoadmap()` → `checkAndCompleteStages()`

> ⚠️ **Bước 4 là mắt xích sống còn.** `roadmap.ts:289` mở chặng 1 chỉ dựa trên
> `!!profiles.onboarding_survey` — nội dung blob không bao giờ bị đọc, chỉ xét
> có/không. Thiếu blob = học viên kẹt chặng 1 vĩnh viễn.
> Blob do `buildLegacyOnboardingBlob()` dựng, mang `source: "intake"`.

Đường dự phòng (`form_id = null`) phải tự xoá dòng cũ trước khi insert, vì
`UNIQUE(user_id, form_id)` không bắt được NULL trong Postgres.

---

## 6. Hiện ở đâu trong rova-ops

Không có menu "Khám bệnh" riêng. Feature nằm trong 2 nơi có sẵn:

### Soạn đề — chỉ admin
- **Sidebar "Biểu mẫu" → `/admin/forms`** — nút "Tạo biểu mẫu" → loại
  **"Khám bệnh đầu vào"** (*Chấm đa chiều + phân nhóm chăm sóc*). Form loại này
  mang badge đỏ "Khám bệnh".
- **`/admin/forms/[formId]`** — panel hướng dẫn "Form khám bệnh đầu vào"; mở từng
  câu ra thấy khối đỏ **"Thiết lập khám bệnh"**: *Phần (bước wizard)* · *Chiều
  đánh giá* · *Ý nghĩa đặc biệt* (Ngày sinh / Giờ sinh) · *Câu nhạy cảm* · bảng
  **"Điểm · nhóm tính cách · cờ rủi ro cho từng tuỳ chọn"**.
- Publish bị chặn nếu thiếu câu Ngày sinh / câu tính cách / câu chấm chiều trading.

### Xem kết quả — admin **và** mentor
`/admin/students/[id]` hoặc `/mentor/students/[id]` → card **"Kết quả khám bệnh đầu vào"**
(`components/students/IntakeResultCard.tsx`), nằm dưới "Ghi chú hội thoại", trên
"Kết quả Onboarding".

Bản đầy đủ, hiện thêm 3 thứ học viên **không bao giờ thấy**:
- Badge nhóm chăm sóc (viền card đỏ nếu *Ưu tiên chăm sóc*)
- Khối "Cờ rủi ro (n)" + dòng nhắc *"Học viên không nhìn thấy các cờ này"*
- Toàn bộ câu trả lời, câu nhạy cảm gắn tag đỏ "Nhạy cảm"

### Kho luận giải KHÔNG có UI quản trị
Grep toàn repo ops: không một chữ mô tả tính cách / diễn giải số chủ đạo / tính
chất cung nào. Ops chỉ chọn *mã nhóm* và hiện *nhãn ngắn*.
→ `lib/intake-content/` bên LMS là nơi **duy nhất** sửa được nội dung luận giải.

---

## 7. Ràng buộc phải nhớ khi sửa

| Ràng buộc | Chi tiết |
|---|---|
| **Mirror 2 repo** | Sửa `labels.ts` (SECTION / DIMENSION / FLAG / CARE_GROUP) → phải sửa y hệt `OPS_ROVA/lib/intake-meta.ts`. Các file content khác thì không, sửa thoải mái |
| **Blob legacy** | Không được bỏ bước ghi `profiles.onboarding_survey` trong `submitIntake` |
| **Thứ tự roadmap** | Giữ nguyên `initStudentRoadmap(ROADMAP_COURSE_ID)` → `checkAndCompleteStages(...)` |
| **Riêng tư** | `flags` / `care_group` / câu nhạy cảm không được vào `student_visible` |
| **Schema** | Chỉ thêm (additive), không sửa/xoá cột cũ |
| **`optionScores` song song `options`** | Cùng độ dài, cùng thứ tự. Chèn option giữa chừng phải đánh lại chỉ số trong `optionGroups` / `optionFlags` |

---

## 8. Còn treo

| Việc | Ghi chú |
|---|---|
| **Chạy `supabase-intake-assessment.sql`** | ⚠️ Chưa chạy trên Supabase. Chưa chạy thì bảng `intake_results` không tồn tại → học viên nộp bài sẽ lỗi |
| Soạn + publish form intake thật | Đang chạy bằng bộ dự phòng |
| Test end-to-end học viên mới | Kiểm `form_responses` (grade null) + `form_answers` (không có câu bỏ qua) + `intake_results` + `onboarding_survey.source='intake'` + chặng onboarding completed |
| Can chi theo năm dương | Người sinh tháng 1 / đầu tháng 2 lệch 1 con giáp — v1 chấp nhận, ghi ở [astro.ts:48](../../lib/astro.ts) |
| RLS `allow_all` | Dữ liệu nhạy cảm đang world-readable như mọi bảng khác. Khi siết RLS: `intake_results` + `form_answers` ưu tiên số 1 |
| Panel admin chưa chặn blob giả | `AdminStudentDetailView.tsx:688` render `total_score` / "Có điểm 1" từ blob legacy mà **thiếu** guard `source === "intake"` (bản mentor có guard ở `StudentDetailView.tsx:755`). Admin đang thấy số tổng hợp giả như thể là điểm khảo sát 8 câu cũ |
| Chặng tốt nghiệp thiếu `form_id` | `supabase-wire-stages.sql:41` — form tốt nghiệp chưa được tạo. Học viên đi hết 9 chặng sẽ thấy việc "Form tốt nghiệp" trỏ vào chặng chết |
| Khối "Bước kế tiếp" chưa test end-to-end | Đã unit-test phần toán số chặng (13/13), nhưng chưa chạy thật được vì bảng `intake_results` chưa tồn tại trên Supabase |
| Cá nhân hoá lộ trình thật | Cần dữ liệu ánh xạ *chiều yếu → học gì trước* hoặc `target_days` theo trình độ. Chưa tồn tại ở đâu cả — xem mục 1.3 |
