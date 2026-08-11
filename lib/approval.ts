// Duyệt tài khoản = admin/mentor gán khoá học cho học viên bên rova-ops.
// Không có enrollment active/completed nào = chưa được duyệt.
import { supabase } from "./supabase";

export async function isApproved(userId: string): Promise<boolean> {
  const { data } = await supabase
    .from("enrollments")
    .select("id")
    .eq("user_id", userId)
    .in("status", ["active", "completed"])
    .limit(1);
  return (data?.length ?? 0) > 0;
}
