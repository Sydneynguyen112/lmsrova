# Context Snapshot — 260811 21:58

## Việc vừa xong (đã push, Vercel tự deploy)
- rova-ops: gộp Quiz vào mục Biểu mẫu (tab "Quiz bài học"), editor mới `/admin/forms/quiz/[quizId]`, đường cũ redirect, bỏ Quiz khỏi sidebar (commit 168acdc).
- rova-ops: nút "Tải lên" cheatsheet trong Khoá học → sửa bài học → Tài liệu; upload vào bucket `materials`, tự điền url/name/type (commit 1f874f7). Build pass.
- Commit kèm WIP intake của máy này (feat(intake) bdaf342) vì forms page phụ thuộc `lib/intake-meta.ts` chưa track — user đã được báo, chưa phản hồi gỡ hay giữ.
- Import 619 học viên cũ (06/08) đã xong từ trước: 613 tạo + 6 update, 0 lỗi.

## Đang chờ user
- ✅ 21:58 user ĐÃ chạy supabase-storage-materials.sql (bucket `materials` + policies OK). Còn lại: thử upload 1 file thật để nghiệm thu.

## ✅ XONG (22:25) — Google Forms-style builder
- Đã làm lại `/admin/forms/[formId]` kiểu Google Forms: bấm card sửa tại chỗ, autosave 1s, kéo-thả đổi thứ tự, nhân bản, thêm câu inline (bỏ dialog cũ). 4 file: page.tsx + builder-question-card.tsx + builder-intake-fields.tsx + builder-shared.ts. Giữ nguyên logic chấm điểm graduation + meta intake + tab Quiz.
- Push origin/main = f67a156. Build pass. Vercel tự deploy.
- ⚠️ Có PHIÊN CLAUDE KHÁC đang chạy song song trong ~/Documents/rova-ops (đổi tên menu "Hồ sơ khách hàng", restrict super_admin, đang gỡ tính năng chat/messages). Mình làm qua git worktree riêng (đã xoá) để không đụng. Phiên kia cần `git pull --rebase` trước khi push.

## Next steps nếu tiếp tục
1. User xác nhận đã chạy SQL → thử upload 1 file trong rova-ops → kiểm tra học viên thấy trong tab Tài liệu (lmsrova).
2. Nếu user muốn gỡ intake: revert bdaf342 + gỡ phần intake trong forms page (cẩn thận: forms/page.tsx đan xen intake từ trước).
3. Việc treo cũ (06/08): tạo nội dung quiz 6 chặng, form tốt nghiệp, map lesson chặng tu_duy/video_hoan_thien, siết RLS.

## Repo/paths
- rova-ops: ~/Documents/rova-ops (main, đã push tới bdaf342)
- lmsrova (học viên): ~/Documents/lmsrova + clone Desktop/LMS/lmsrova — pull --rebase trước khi làm
- Data khách gốc: repo GitHub 2nbrain, file Rova_CS.xlsx tab PRO 3; CSV sạch tại lmsrova/scripts/import/pro3.csv (gitignored)
