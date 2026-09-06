-- ============================================
-- CẮT QUYỀN GHI CỦA KHÁCH VÃNG LAI (anon) TRÊN CÁC BẢNG NỘI DUNG & DỮ LIỆU HỌC
-- ============================================
-- Chạy toàn bộ file này trong Supabase SQL Editor.
-- File này KHÔNG đụng tới bảng profiles — profiles có file riêng:
-- supabase-rls-profiles-hardening.sql
--
-- VẤN ĐỀ ĐANG CÓ TRÊN PRODUCTION (đã kiểm chứng 06-09-2026)
-- supabase-setup.sql tạo policy "allow_all_<bảng>" FOR ALL USING (true) WITH CHECK (true).
-- "FOR ALL" áp cho cả vai anon, mà publishable key nằm công khai trong bundle JS.
-- Kiểm chứng thực tế bằng chính key đó, KHÔNG đăng nhập, đọc được:
--   profiles 641 dòng (họ tên, email, phone, ngày sinh, khảo sát đầu vào)
--   enrollments 635 dòng · lessons 34 dòng (gồm video_url) · lesson_progress 19 dòng
-- Và vì là FOR ALL nên người lạ còn GHI/XOÁ được: xoá sạch danh mục bài học,
-- xoá 635 dòng ghi danh, hoặc đổi video_url của mọi bài.
--
-- FILE NÀY VÁ GÌ
--   Chuyển toàn bộ quyền GHI (insert/update/delete) từ vai anon sang vai
--   authenticated. Khách vãng lai chỉ còn đọc, muốn ghi phải đăng nhập thật.
--
-- VÌ SAO SIẾT THÔ (mở cả 4 lệnh cho authenticated) CHỨ KHÔNG THEO TỪNG LỆNH
--   Siết theo đúng lệnh mà code dùng thì chặt hơn, nhưng phải quét được HẾT chỗ
--   gọi ở cả 2 repo (lmsrova + rova-ops). Quét hụt một lệnh là gãy một tính năng
--   trên production, ví dụ mentor chấm bài có thể update submissions theo cách
--   grep không bắt được. Bước này ưu tiên chặn người lạ mà không gãy gì.
--   Siết mịn hơn để sau, khi đã có danh tính phía máy chủ.
--
-- FILE NÀY CHƯA VÁ (xem GIỚI HẠN CÒN LẠI ở cuối)
--   - SELECT vẫn mở cho mọi người
--   - Người đã đăng nhập vẫn ghi được lên dữ liệu của người khác
--
-- TRƯỚC KHI CHẠY — kiểm 3 điều kiện (đã xác nhận 06-09-2026)
--   1. Quản trị viên rova-ops đăng nhập Supabase thật (signInWithPassword /
--      signInWithGoogle trong rova-ops/lib/auth.ts) -> vẫn ghi được.
--   2. Học viên lmsrova cũng đăng nhập thật -> vẫn lưu được tiến độ.
--   3. Đường đăng nhập cũ không mật khẩu (signInWithEmail) đã chết, không còn
--      chỗ nào gọi -> không còn ai ghi với vai anon một cách hợp lệ.
-- ============================================

begin;

-- ── Hàm phụ: áp cùng một khuôn cho mọi bảng, đỡ lặp 10 lần ──
-- Sau khi chạy xong sẽ drop đi, không để lại rác trong database.
create or replace function pg_temp.siet_ghi(ten_bang text)
returns void language plpgsql as $$
begin
  -- Bỏ policy gộp cũ
  execute format('drop policy if exists %I on public.%I', 'allow_all_' || ten_bang, ten_bang);
  -- Dọn policy của chính file này nếu chạy lại lần 2 (idempotent)
  execute format('drop policy if exists %I on public.%I', ten_bang || '_select_all', ten_bang);
  execute format('drop policy if exists %I on public.%I', ten_bang || '_write_authenticated', ten_bang);

  -- SELECT: giữ nguyên mức mở hiện tại, không siết ở bước này.
  execute format(
    'create policy %I on public.%I for select using (true)',
    ten_bang || '_select_all', ten_bang
  );

  -- GHI: chỉ vai authenticated. Vai anon không khớp policy nào -> RLS từ chối.
  execute format(
    'create policy %I on public.%I for all to authenticated using (true) with check (true)',
    ten_bang || '_write_authenticated', ten_bang
  );

  -- Tầng quyền bảng (defense in depth): grant được kiểm TRƯỚC cả RLS.
  -- Cắt hẳn quyền ghi của anon, giữ nguyên quyền đọc.
  execute format('revoke insert, update, delete on public.%I from anon', ten_bang);
  execute format('grant select on public.%I to anon', ten_bang);
  execute format('grant select, insert, update, delete on public.%I to authenticated', ten_bang);
end;
$$;

-- ── Áp cho từng bảng ──
-- Danh sách lấy từ supabase-setup.sql, trừ profiles (có file riêng).
select pg_temp.siet_ghi('courses');
select pg_temp.siet_ghi('modules');
select pg_temp.siet_ghi('lessons');
select pg_temp.siet_ghi('assignments');
select pg_temp.siet_ghi('submissions');
select pg_temp.siet_ghi('enrollments');
select pg_temp.siet_ghi('lesson_progress');
select pg_temp.siet_ghi('blog_posts');
select pg_temp.siet_ghi('blog_comments');
select pg_temp.siet_ghi('blog_likes');

commit;

-- ============================================
-- KIỂM CHỨNG SAU KHI CHẠY
-- ============================================
-- 1. Mỗi bảng phải có đúng 2 policy: _select_all (roles = {public}) và
--    _write_authenticated (roles = {authenticated}). Không còn allow_all_*:
--
--   select tablename, policyname, roles, cmd from pg_policies
--   where schemaname = 'public'
--     and tablename in ('courses','modules','lessons','assignments','submissions',
--                       'enrollments','lesson_progress','blog_posts','blog_comments','blog_likes')
--   order by tablename, cmd;
--
-- 2. Vai anon chỉ còn SELECT, không còn INSERT/UPDATE/DELETE:
--
--   select table_name, privilege_type from information_schema.role_table_grants
--   where grantee = 'anon' and table_schema = 'public'
--     and table_name in ('lessons','enrollments','lesson_progress')
--   order by table_name, privilege_type;
--
-- 3. Thử từ ngoài bằng publishable key, KHÔNG đăng nhập — phải trả 401/403:
--
--   curl -X DELETE -H "apikey: <publishable key>" \
--     -H "Authorization: Bearer <publishable key>" \
--     "<SUPABASE_URL>/rest/v1/lessons?id=eq.00000000-0000-0000-0000-000000000000"
--
-- 4. Đăng nhập vào lmsrova bằng tài khoản học viên thật, xem một video ~1 phút,
--    tải lại trang, kiểm tiến độ có được lưu không (đây là đường ghi hay gãy nhất).
-- 5. Đăng nhập rova-ops, thử sửa tên một bài học rồi hoàn tác.

-- ============================================
-- CÁCH LÙI NẾU HỎNG
-- ============================================
-- Trả lại nguyên trạng (mở toang như cũ) cho một bảng:
--   drop policy if exists "lessons_select_all" on public.lessons;
--   drop policy if exists "lessons_write_authenticated" on public.lessons;
--   create policy "allow_all_lessons" on public.lessons for all using (true) with check (true);
--   grant select, insert, update, delete on public.lessons to anon;

-- ============================================
-- GIỚI HẠN CÒN LẠI — chưa xử lý ở file này
-- ============================================
-- 1. SELECT vẫn mở: người lạ vẫn đọc được email/phone của 641 học viên qua
--    publishable key. Vá triệt để cần chuyển các màn đọc-profile-người-khác sang
--    server route dùng service_role, hoặc view security definer chỉ lộ
--    id + full_name + avatar_url.
--
-- 2. Đã đăng nhập là ghi được lên dữ liệu người khác: học viên A vẫn sửa được
--    lesson_progress của học viên B. Muốn siết theo dòng (user_id = auth.uid())
--    thì vướng đúng cái đã ghi trong supabase-rls-profiles-hardening.sql:
--    ensureProfile() tạo profile không set id nên profiles.id KHÔNG khớp
--    auth.users.id ở tài khoản cũ. Phải backfill khoá trước (21 khoá ngoại đang
--    trỏ tới), rồi mới thêm được điều kiện theo dòng.
--
-- 3. rova-ops vẫn dùng publishable key cho thao tác quản trị. Đúng ra admin phải
--    đi qua server route với service_role. Chừng nào chưa làm, bất kỳ ai đăng ký
--    một tài khoản học viên là đã đủ quyền ghi lên bảng nội dung.
