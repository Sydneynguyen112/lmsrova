-- ============================================
-- SIẾT RLS CHO BẢNG profiles
-- ============================================
-- Chạy toàn bộ file này trong Supabase SQL Editor.
--
-- VẤN ĐỀ ĐANG CÓ TRÊN PRODUCTION
-- Policy cũ: CREATE POLICY "allow_all_profiles" ON profiles FOR ALL USING (true) WITH CHECK (true);
-- "FOR ALL" gồm cả DELETE và UPDATE, áp cho role anon. Publishable key nằm công khai
-- trong bundle JS, nên bất kỳ ai mở DevTools trên lmsrova.vercel.app đều có thể:
--   1. Xoá sạch bảng profiles (đã kiểm chứng: request DELETE trả 204)
--   2. UPDATE role của chính mình thành 'admin'
--   3. Đổi email của người khác — nguy hiểm vì app match profile theo email
--
-- FILE NÀY VÁ GÌ
--   - DELETE: chặn hoàn toàn từ client (app không có chỗ nào xoá profile)
--   - UPDATE: chỉ cho phép các cột không mang đặc quyền, theo allowlist
--   - INSERT: chỉ cho tạo role 'student'
--
-- FILE NÀY CHƯA VÁ (xem phần GIỚI HẠN CÒN LẠI ở cuối)
--   - SELECT vẫn mở cho mọi người
-- ============================================

begin;

-- ── 1. Thay policy gộp bằng policy tách theo từng lệnh ──

drop policy if exists "allow_all_profiles" on public.profiles;

-- SELECT: giữ nguyên mức mở hiện tại.
-- Không siết được ở bước này vì client đang đọc profile của người khác ở nhiều chỗ:
-- danh sách học viên/mentor (lib/api.ts), tên tác giả bài blog và người bình luận
-- (app/(dashboard)/student/blog/page.tsx), tên học viên trong dashboard mentor
-- (lib/api-mentor.ts). Siết theo auth.uid() sẽ làm hỏng hết các màn đó.
create policy "profiles_select_all"
  on public.profiles for select
  using (true);

-- INSERT: chặn tự đăng ký thành admin/mentor.
-- Cả hai chỗ insert trong code đều set role 'student' nên không ảnh hưởng gì:
--   lib/auth.ts signUpWithPassword() và ensureProfile()
create policy "profiles_insert_student_only"
  on public.profiles for insert
  with check (role = 'student');

-- UPDATE: cho phép ở tầng RLS, việc giới hạn cột làm ở bước 2.
create policy "profiles_update"
  on public.profiles for update
  using (true)
  with check (true);

-- DELETE: cố tình KHÔNG tạo policy nào.
-- RLS mặc định từ chối khi không có policy khớp -> mọi DELETE từ client bị chặn.

-- ── 2. Quyền ở tầng cột (defense in depth) ──
-- RLS không so sánh được giá trị cũ với giá trị mới trong cùng một biểu thức,
-- nên không thể viết "không được đổi role" bằng policy. Dùng quyền cột thay thế.
-- Lưu ý: phải REVOKE quyền UPDATE ở tầng bảng trước, rồi GRANT lại theo từng cột.
-- Nếu chỉ revoke cột lẻ trong khi quyền bảng còn đó thì không có tác dụng.

revoke delete on public.profiles from anon, authenticated;
revoke update on public.profiles from anon, authenticated;

-- Allowlist: đúng những cột client thật sự ghi, đối chiếu từ code.
--   full_name, phone, discord_handle, avatar_url  -> components/shared/ProfileEditor.tsx
--   classification, care_group, date_of_birth, onboarding_survey -> lib/api-intake.ts
--   ready_for_coaching                            -> lib/api-mentor.ts
--   last_active_date                              -> mốc hoạt động, không mang đặc quyền
grant update (
  full_name,
  phone,
  avatar_url,
  discord_handle,
  classification,
  care_group,
  date_of_birth,
  onboarding_survey,
  ready_for_coaching,
  last_active_date
) on public.profiles to anon, authenticated;

-- Các cột CỐ TÌNH bị khoá, client không đổi được nữa:
--   id, created_at          -> khoá chính và mốc tạo
--   email                   -> app match profile theo email, đổi được là chiếm được tài khoản
--   role, mentor_id         -> đặc quyền
--   risk_tag, status, status_changed_at, external_code,
--   source, source_note, source_tag -> field vận hành/CRM, chỉ sửa từ phía server
-- Nếu sau này có màn admin cần sửa các cột trên, cho chạy qua service_role
-- ở server route, đừng nới lại quyền cho anon.

commit;

-- ============================================
-- KIỂM CHỨNG SAU KHI CHẠY
-- ============================================
-- Liệt kê policy còn lại — phải thấy đúng 3 dòng select/insert/update, không có delete:
--   select policyname, cmd from pg_policies
--   where schemaname = 'public' and tablename = 'profiles' order by cmd;
--
-- Kiểm tra quyền cột của anon — phải KHÔNG thấy role, email, mentor_id:
--   select column_name, privilege_type from information_schema.column_privileges
--   where table_name = 'profiles' and grantee = 'anon' and privilege_type = 'UPDATE'
--   order by column_name;

-- ============================================
-- GIỚI HẠN CÒN LẠI — chưa xử lý ở file này
-- ============================================
-- 1. SELECT vẫn mở: bất kỳ ai cũng đọc được email/phone của toàn bộ học viên qua
--    publishable key. Vá triệt để cần chuyển các màn đọc-profile-người-khác sang
--    server route dùng service_role, hoặc dựng view security definer chỉ lộ
--    id + full_name + avatar_url cho phần blog/mentor.
--
-- 2. UPDATE chưa giới hạn theo dòng: học viên A vẫn sửa được full_name của học viên B.
--    Không siết được bằng auth.uid() lúc này vì ensureProfile() trong lib/auth.ts
--    tạo profile KHÔNG set id, để Postgres sinh gen_random_uuid() — nên
--    profiles.id không khớp auth.users.id ở toàn bộ tài khoản cũ. Muốn siết theo dòng
--    thì phải thống nhất khoá trước (backfill profiles.id = auth.users.id, xử lý
--    cả 21 khoá ngoại đang trỏ tới), rồi mới thêm điều kiện id = auth.uid().
