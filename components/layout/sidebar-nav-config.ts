import {
  LayoutDashboard,
  BookOpen,
  FileText,
  User,
  Users,
  Star,
  Sprout,
  Shield,
  NotebookPen,
  BarChart3,
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
  { href: "/student/submissions", label: "Bài nộp", icon: FileText, requiresEnrollment: true },
  { href: "/student/graduation", label: "Bài tốt nghiệp", icon: GraduationCap, requiresEnrollment: true },
  { href: "/student/journal", label: "Nhật ký giao dịch", icon: NotebookPen, requiresEnrollment: true },
  { href: "/student/blog", label: "Vườn ươm tâm thức", icon: Sprout },
  { href: "/student/review", label: "Đánh giá Mentor", icon: Star, requiresEnrollment: true },
  { href: "/student/profile", label: "Hồ sơ", icon: User },
];

export const mentorNav: NavItem[] = [
  { href: "/mentor", label: "Dashboard", icon: LayoutDashboard },
  { href: "/mentor/students", label: "Học viên", icon: Users },
  { href: "/mentor/submissions", label: "Bài cần chấm", icon: FileText },
  { href: "/mentor/reviews", label: "Đánh giá", icon: Star },
  { href: "/mentor/profile", label: "Hồ sơ", icon: User },
];

export const adminNav: NavItem[] = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/users", label: "Quản lý Users", icon: Shield },
  { href: "/admin/students", label: "Quản lý Học viên", icon: Users },
  { href: "/admin/mentors", label: "Quản lý Mentor", icon: Star },
  { href: "/admin/courses", label: "Quản lý Khoá học", icon: BookOpen },
  { href: "/admin/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/admin/forms", label: "Biểu mẫu", icon: FileText },
  { href: "/admin/blog", label: "Vườn ươm tâm thức", icon: Sprout },
  { href: "/admin/profile", label: "Hồ sơ", icon: User },
];

export function getNavConfig(pathname: string): {
  items: NavItem[];
  role: string;
  fallbackRole: Role;
} {
  if (pathname.startsWith("/admin"))
    return { items: adminNav, role: "Admin", fallbackRole: "admin" };
  if (pathname.startsWith("/mentor"))
    return { items: mentorNav, role: "Mentor", fallbackRole: "mentor" };
  return { items: studentNav, role: "Học viên", fallbackRole: "student" };
}
