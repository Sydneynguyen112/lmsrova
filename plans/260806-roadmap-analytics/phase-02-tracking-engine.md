# Phase 02 — Tracking engine: đo giây xem, khoá video tuần tự, 20 ảnh, mở quiz, qua chặng

## Context Links
- [Main Plan](plan.md) · [Phase 01](phase-01-database.md)
- Files chính sẽ sửa: `components/shared/VideoPlayer.tsx`, `app/(dashboard)/student/courses/[courseId]/CourseDetailView.tsx`, `app/(dashboard)/student/courses/[courseId]/[lessonId]/LessonPlayerView.tsx`, `app/(dashboard)/student/submissions/page.tsx`, `lib/api.ts`

## Overview
- **Description:** Toàn bộ logic phía học viên: đo thời gian xem thật, khoá/mở bài tuần tự, nộp ảnh bài tập, đếm 20 ảnh đúng, mở quiz chặng, ghi nhận qua chặng.
- **Priority:** P0

## 1. Đo giây xem video (luật ≥50%)

Trong `VideoPlayer.tsx` / `LessonPlayerView.tsx`:
- Đếm giây xem THẬT: mỗi 10 giây video đang play (không pause, tab visible) cộng dồn vào biến local; flush lên `lesson_progress.watched_seconds` mỗi 30 giây + khi pause/unmount (upsert theo user_id+lesson_id, cột đã thêm ở phase 01).
- Ghi `last_position_sec` để học viên xem tiếp từ chỗ dừng.
- Tua (seek) KHÔNG cộng giây — chỉ thời gian play thật mới đếm. Xem lại đoạn cũ vẫn đếm (đơn giản, chấp nhận được).
- Điều kiện "xem xong bài": `watched_seconds >= lessons.duration_sec * 0.5` → set `lesson_progress.completed = true, completed_at = now(), status = 'completed'` (lần đầu đạt).
- ⚠️ `lessons.duration_sec` phải đúng với video thật — thêm bước verify: nếu duration_sec = 0/null, lấy từ metadata video khi player load và update lessons (chỉ khi đang null).

## 2. Khoá video tuần tự

Trong `CourseDetailView.tsx` (danh sách bài) + `LessonPlayerView` (chặn truy cập trực tiếp bằng URL):

Luật mở khoá bài N+1 (bài sắp theo `order_index` toàn khoá, xuyên module):
1. Bài N đã "xem xong" (≥50%), VÀ
2. Quiz của bài N (quizzes.lesson_id = N) — nếu có — đã có attempt `passed = true`, VÀ
3. Nếu bài N là video của một chặng bài tập (`roadmap_stages.lesson_id = N` với `completion_type = 'assignment_quiz'`): CẢ CHẶNG phải xong (xem mục 4).

UI: bài khoá hiển thị tiêu đề + icon khoá + tooltip "Hoàn thành bài trước để mở". Bài đang mở kế tiếp highlight. KHÔNG ẩn tiêu đề.

Load 1 lần khi vào trang: roadmap_stages của course + lesson_progress + quiz_attempts (passed) + số ảnh correct theo assignment → build map `unlockedLessonIds` thuần client. Viết hàm dùng chung `lib/roadmap.ts: computeUnlockState(...)` — cả CourseDetailView lẫn LessonPlayerView dùng, tránh 2 nơi 2 luật.

## 3. Nộp bài tập theo ảnh

Sửa flow nộp bài (student/submissions + trang bài tập trong course):
- Học viên up nhiều ảnh / nhiều lần. Mỗi lần nộp tạo 1 dòng `submissions` (giữ nguyên) + **mỗi ảnh 1 dòng `submission_images`** (verdict 'pending', denormalize user_id + assignment_id).
- UI hiện bộ đếm chặng: `X/20 ảnh được chấm đúng` + `Y ảnh chờ chấm` + `Z ảnh cần làm lại` (đếm từ submission_images theo verdict).
- Ảnh incorrect hiện feedback của mentor để học viên biết sai gì mà nộp bù.

## 4. Chặng bài tập: 20 ảnh đúng → mở quiz → qua chặng

- Đủ `required_correct_images` (20) ảnh verdict='correct' của assignment chặng → UI mở nút "Làm quiz chặng" (quiz_id từ roadmap_stages — LƯU Ý: quiz chặng gắn qua roadmap_stages.quiz_id, KHÔNG qua quizzes.lesson_id).
- Quiz đạt pass_score → gọi `completeStage(userId, stageId)`:
  - update `student_stage_progress`: `completed_at = now()`
  - tạo dòng progress cho chặng kế: `entered_at = now()`, `deadline_at = entered_at + target_days` 
  - gọi `supabase.rpc('refresh_student_statuses')`
- Quiz trượt: cho làm lại ngay, không giới hạn; mọi lượt lưu `quiz_attempts`.

## 5. Cờ "Chờ chấm" — đồng hồ dừng

Điều kiện pause chặng: `đủ >= 20 ảnh (correct + pending) VÀ pending > 0 VÀ correct < 20` — tức học viên đã nộp đủ phần mình, đang chờ mentor.
- Khi điều kiện bật: set `pause_started_at = now()` trên dòng progress đang mở (nếu chưa set).
- Khi mentor chấm xong (điều kiện tắt): `paused_seconds += now() - pause_started_at; pause_started_at = NULL; deadline_at = deadline_at + khoảng vừa pause`.
- Thực hiện trong DB (function gọi từ trigger trên submission_images khi verdict đổi + khi insert ảnh mới) để không phụ thuộc client nào đang mở.
- `tam_dung` dùng cùng cơ chế pause này (phase 03 UI gắn tag sẽ set/clear pause).

## 6. Các completion_type còn lại

- `onboarding`: hoàn thành khi `profiles.onboarding_survey IS NOT NULL` HOẶC có `form_responses` của form `form_type='onboarding'` (tương lai). Check lúc onboarding submit → completeStage.
- `first_lesson`: lesson_progress đầu tiên đạt completed → completeStage chặng xem_video.
- `lesson_quiz` (Tư duy): lesson của chặng completed + quiz chặng passed.
- `lesson_group` (Video hoàn thiện): TỪNG lesson trong `lesson_ids` completed + với mỗi lesson có quiz (quizzes.lesson_id) thì quiz đó passed.
- `graduation_form`: phase 04.

Viết engine check tập trung trong `lib/roadmap.ts: checkAndCompleteStages(userId)` — gọi sau mọi sự kiện học (video đạt 50%, quiz pass, ảnh được chấm, survey submit). Hàm lấy chặng đang mở, kiểm điều kiện theo completion_type, complete + mở chặng kế, lặp cho tới chặng chưa đạt (phòng trường hợp import/backfill làm nhiều chặng đạt cùng lúc).

## Acceptance criteria
- [ ] Xem video 50% thời lượng → bài kế mở; refresh trang trạng thái giữ nguyên; vào thẳng URL bài khoá bị chặn (redirect về bài đang mở).
- [ ] Tua nhanh tới cuối KHÔNG mở bài (giây thật < 50%).
- [ ] Nộp 3 lần x 7 ảnh = 21 dòng submission_images; mentor chấm 20 correct → nút quiz hiện.
- [ ] Quiz trượt 2 lần + đậu 1 lần → 3 dòng quiz_attempts, chặng completed, chặng kế có entered_at/deadline_at đúng.
- [ ] Nộp đủ 20 ảnh chưa chấm → pause_started_at set; chấm xong → deadline_at giãn đúng bằng thời gian chờ.
