# Bài test khám bệnh — Đánh giá đầu vào toàn diện

## Overview

- **Date:** 2026-08-07
- **Goal:** Thay khảo sát onboarding 8 câu hardcode bằng bài test "khám bệnh" đa chiều: nhóm tính cách, thần số học / cung hoàng đạo / can chi (tự tính từ ngày sinh), trình độ giao dịch (kiến thức · phương pháp · quản lý vốn · kinh nghiệm), hoàn cảnh cá nhân (nợ nần, thu nhập, bế tắc — hỏi khéo, bỏ qua được) → phân **nhóm chăm sóc** cho đội ngũ.
- **Nguồn quyết định:** Sydney (chốt 2026-08-07 qua Claude Code)

## Quyết định đã chốt (nguồn chân lý)

| Quyết định | Chốt |
|---|---|
| Ai làm bài, ở đâu | Học viên tự làm trên LMS, là onboarding mới (thay hẳn bài 8 câu cũ) |
| Nguồn câu hỏi | Soạn từ form builder rova-ops, `form_type='intake'`; chưa publish → bộ fallback trong code |
| Tử vi / thần số học | Tự tính từ ngày sinh (`lib/astro.ts`), không hỏi trực tiếp |
| Kết quả học viên thấy | Bản "đẹp" (`student_visible`): tính cách, điểm mạnh/yếu, tử vi/TSH, lời khuyên. KHÔNG thấy cờ rủi ro / nhóm chăm sóc |
| Câu nhạy cảm | `meta.sensitive=true` → nút "Không muốn chia sẻ", bỏ qua = không ghi, không phạt điểm |
| Nhóm chăm sóc | `no_nang` HOẶC ≥2 cờ mềm → `uu_tien_cham_soc`; 1 cờ → `theo_doi_sat`; sạch cờ + trading ≥70% → `tiem_nang_cao`; còn lại `binh_thuong` |

## Ràng buộc sống còn

- `lib/roadmap.ts:292` hoàn thành stage onboarding dựa trên `!!profile.onboarding_survey` → `submitIntake` **bắt buộc** ghi blob legacy (key = nhãn tiếng Việt, `source:'intake'`).
- Giữ nguyên thứ tự `initStudentRoadmap("c-mov3c81m-fdq2")` → `checkAndCompleteStages(...)`.
- Contract `IntakeMeta` mirror 2 repo: nguồn chân lý `lmsrova/lib/intake-scoring.ts` ↔ bản sao `rova-ops/lib/intake-meta.ts`. Sửa một bên thì sửa y hệt bên kia.
- Schema chỉ thêm (additive), không sửa/xoá cột cũ.

## File đã tạo / sửa

### lmsrova
| File | Nội dung |
|---|---|
| `supabase-intake-assessment.sql` | form_type +'intake' (dò constraint qua pg_constraint), `form_questions.meta JSONB`, bảng `intake_results`, `profiles.date_of_birth` + `care_group`, RLS allow_all |
| `lib/astro.ts` | Số chủ đạo (Pythagoras, master 11/22/33), cung hoàng đạo, can chi (v1 năm dương — lệch với người sinh tháng 1/đầu 2, đã chấp nhận) |
| `lib/intake-scoring.ts` | Contract IntakeMeta + toàn bộ engine: điểm theo chiều, cờ, nhóm tính cách, care group, classification legacy, `student_visible`, blob legacy |
| `lib/api-intake.ts` | `getPublishedIntakeForm`, `submitIntake` (pipeline 5 bước) |
| `lib/intake-fallback.ts` | 10 câu dựng sẵn khi chưa có form published |
| `app/(auth)/onboarding/page.tsx` | Viết mới hoàn toàn: wizard từng câu theo section, bước ngày sinh, nút bỏ qua câu nhạy cảm, màn "đang phân tích", màn kết quả |
| `components/intake/BirthDateStep.tsx` + `IntakeResultScreen.tsx` | Bước ngày sinh + màn kết quả (chỉ đọc `student_visible`) |
| `app/(marketing)/forms/[formId]/page.tsx` | Chặn form intake trên trang public (bắt đăng nhập LMS) |
| `lib/api-forms.ts` | `FormType` +'intake' |

### rova-ops
| File | Nội dung |
|---|---|
| `lib/intake-meta.ts` | Bản mirror contract + `validateIntakePublish` |
| `lib/api-forms.ts` | `FormType` +'intake' |
| `app/admin/forms/page.tsx` | Option "Khám bệnh đầu vào", badge, validate khi publish |
| `app/admin/forms/[formId]/page.tsx` | Khối "Thiết lập khám bệnh": section, chiều, semantic, sensitive, điểm/nhóm/cờ từng option; remap index khi lọc option rỗng; ép `required=false` cho câu sensitive |
| `components/students/IntakeResultCard.tsx` | Panel đầy đủ cho ops: badge care group, cờ rủi ro, điểm chiều, tử vi/TSH, toàn bộ câu trả lời (kể cả nhạy cảm) |
| `app/mentor/.../StudentDetailView.tsx` + `app/admin/.../AdminStudentDetailView.tsx` | Gắn IntakeResultCard phía trên; card onboarding cũ thu gọn khi `survey.source==='intake'` |

## Thứ tự triển khai (zero downtime)

1. Chạy `supabase-intake-assessment.sql` trong Supabase SQL Editor (thuần additive)
2. Deploy rova-ops → đội ngũ soạn form khám bệnh, để **draft**
3. Deploy lmsrova (an toàn nhờ fallback) → **publish** form. Học viên mới đi luồng mới; học viên cũ không bị đụng
4. (Sau, tùy chọn) banner mời học viên cũ làm bài — KHÔNG ghi đè classification của người đã có onboarding_survey

Rollback: unpublish form → học viên mới rơi về bộ fallback.

## Kiểm chứng

- [x] Bảng đáp án astro pass 14/14 (life path 7/11/6; biên cung 18-19/2, 20-21/3, 21-22/11, 25/12, 5/1; can chi Giáp Tý/Mậu Thìn/Canh Thìn)
- [x] Engine 3 kịch bản: rủi ro → `uu_tien_cham_soc` + 4 cờ + newbie; lý tưởng → `tiem_nang_cao` + advanced; bỏ qua câu nhạy cảm → không phạt
- [x] `student_visible` không chứa vết cờ rủi ro (kiểm bằng JSON.stringify)
- [x] `tsc --noEmit` sạch cả 2 repo
- [ ] Chạy SQL trên Supabase (làm tay)
- [ ] Soạn + publish form intake thật trong builder
- [ ] Đăng ký học viên mới end-to-end: DB có `form_responses`(grade null) + `form_answers`(không có câu bỏ qua) + `intake_results` + `profiles.onboarding_survey.source='intake'` + stage onboarding completed
- [ ] Học viên cũ: panel onboarding cũ vẫn render bình thường

## Rủi ro đã ghi nhận

- **Dữ liệu nhạy cảm world-readable** (RLS allow_all + anon key): v1 giảm thiểu bằng cờ enum, không text tự do. Khi làm dự án siết RLS: `intake_results` + `form_answers` ưu tiên số 1.
- Constraint `form_type` không tên → SQL dò qua `pg_constraint` trước khi DROP (đã xử lý trong file).
- `UNIQUE(user_id, form_id)` không bắt NULL form_id → đường fallback tự delete dòng cũ trước khi insert (đã xử lý trong `submitIntake`).
- Làm lại bài với form khác id → thêm dòng intake_results mới; panel ops đọc bản mới nhất theo `computed_at`.
