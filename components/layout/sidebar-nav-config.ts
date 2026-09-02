import {
  LayoutDashboard,
  BookOpen,
  Users,
  Sprout,
  NotebookPen,
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
  { href: "/student", label: "Hành trình của tôi", icon: LayoutDashboard, requiresEnrollment: true },
  { href: "/student/courses", label: "Phòng học", icon: BookOpen },
  { href: "/student/community", label: "Cộng đồng", icon: Users, requiresEnrollment: true },
  { href: "/student/blog", label: "Vườn ươm tâm thức", icon: Sprout },
  { href: "/student/journal", label: "Nhật ký giao dịch", icon: NotebookPen, requiresEnrollment: true },
];

// Khu admin + mentor đã dời sang app riêng rova-ops — LMS chỉ còn học viên.
export function getNavConfig(_pathname: string): {
  items: NavItem[];
  role: string;
  fallbackRole: Role;
} {
  return { items: studentNav, role: "Học viên", fallbackRole: "student" };
}
