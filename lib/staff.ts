// Tài khoản đội ngũ ROVA (admin / super_admin / mentor) vào LMS qua mục "Phòng học" bên rova-ops để XEM như học viên:
// mọi khoá coi như đã ghi danh, mọi bài học / quiz / bài tập / form tốt nghiệp mở sẵn — không cần ghi danh hay bật
// unlock_all_lessons cho từng người. Form tốt nghiệp chỉ xem, không nộp (nộp sẽ gắn tag tốt nghiệp lên hồ sơ đội ngũ).
export const STAFF_ROLES = ["admin", "super_admin", "mentor"] as const;

export function isStaffRole(role: string | null | undefined): boolean {
  return !!role && (STAFF_ROLES as readonly string[]).includes(role);
}
