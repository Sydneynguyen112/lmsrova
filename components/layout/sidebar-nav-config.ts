import {
  LayoutDashboard,
  BookOpen,
  User,
  Star,
  Sprout,
  NotebookPen,
  GraduationCap,
  type LucideIcon,
} from "lucide-react";
import type { Role } from "@/lib/types";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  requiresEnrollment?: boolean;
  children?: NavItem[];
}

export const studentNav: NavItem[] = [
  { href: "/student", label: "Dashboard", icon: LayoutDashboard, requiresEnrollment: true },
  { href: "/student/courses", label: "Khoá học", icon: BookOpen },
  { href: "/student/graduation", label: "Bài tốt nghiệp", icon: GraduationCap, requiresEnrollment: true },
  { href: "/student/journal", label: "Nhật ký giao dịch", icon: NotebookPen, requiresEnrollment: true },
  { href: "/student/blog", label: "Vườn ươm tâm thức", icon: Sprout },
  { href: "/student/review", label: "Đánh giá Mentor", icon: Star, requiresEnrollment: true },
  { href: "/student/profile", label: "Hồ sơ", icon: User },
];

// Khu admin + mentor đã dời sang app riêng rova-ops — LMS chỉ còn học viên.
export function getNavConfig(_pathname: string): {
  items: NavItem[];
  role: string;
  fallbackRole: Role;
} {
  return { items: studentNav, role: "Học viên", fallbackRole: "student" };
}
