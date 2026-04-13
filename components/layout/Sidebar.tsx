"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  BookOpen,
  FileText,
  User,
  Users,
  Star,
  Menu,
  X,
  ChevronLeft,
  LogOut,
  Sprout,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useCurrentUser, signOut } from "@/lib/auth";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import type { Role } from "@/lib/types";

interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
}

const studentNav: NavItem[] = [
  { href: "/student", label: "Dashboard", icon: LayoutDashboard },
  { href: "/student/courses", label: "Khoá học của tôi", icon: BookOpen },
  { href: "/student/submissions", label: "Bài nộp", icon: FileText },
  { href: "/student/blog", label: "Vườn ươm tâm thức", icon: Sprout },
  { href: "/student/review", label: "Đánh giá Mentor", icon: Star },
  { href: "/student/profile", label: "Hồ sơ", icon: User },
];

const mentorNav: NavItem[] = [
  { href: "/mentor", label: "Dashboard", icon: LayoutDashboard },
  { href: "/mentor/students", label: "Học viên", icon: Users },
  { href: "/mentor/submissions", label: "Bài cần chấm", icon: FileText },
  { href: "/mentor/reviews", label: "Đánh giá", icon: Star },
];

const adminNav: NavItem[] = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/students", label: "Quản lý Học viên", icon: Users },
  { href: "/admin/mentors", label: "Quản lý Mentor", icon: Star },
  { href: "/admin/courses", label: "Quản lý Khoá học", icon: BookOpen },
  { href: "/admin/blog", label: "Vườn ươm tâm thức", icon: Sprout },
];

function getNavItems(pathname: string): { items: NavItem[]; role: string; fallbackRole: Role } {
  if (pathname.startsWith("/admin")) return { items: adminNav, role: "Admin", fallbackRole: "admin" };
  if (pathname.startsWith("/mentor")) return { items: mentorNav, role: "Mentor", fallbackRole: "mentor" };
  return { items: studentNav, role: "Học viên", fallbackRole: "student" };
}

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { items, role, fallbackRole } = getNavItems(pathname);
  const currentUser = useCurrentUser(fallbackRole);

  const handleSignOut = () => {
    signOut();
    setMobileOpen(false);
    router.push("/sign-in");
  };

  const initials = currentUser?.full_name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(-2) || "?";

  const NavContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center justify-between px-4 h-16 border-b border-sidebar-border">
        {!collapsed && (
          <Link href="/" className="text-xl font-bold gold-gradient-text">
            ROVA
          </Link>
        )}
        <div className="flex items-center gap-1">
          <ThemeToggle className="text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent" />
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="hidden lg:flex p-1.5 rounded-lg text-sidebar-foreground/60 hover:text-gold hover:bg-sidebar-accent"
          >
            <ChevronLeft
              size={18}
              className={cn("transition-transform", collapsed && "rotate-180")}
            />
          </button>
        </div>
      </div>

      {/* Role badge */}
      {!collapsed && (
        <div className="px-4 py-3">
          <span className="text-xs font-medium text-gold bg-gold/15 px-2.5 py-1 rounded-full">
            {role}
          </span>
        </div>
      )}

      {/* Nav items */}
      <nav className="flex-1 px-3 py-2 space-y-1">
        {items.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== `/${role.toLowerCase()}` &&
              pathname.startsWith(item.href + "/"));

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all",
                isActive
                  ? "bg-sidebar-accent text-gold"
                  : "text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent"
              )}
            >
              <item.icon size={18} className={isActive ? "text-gold" : ""} />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Bottom: user info + logout */}
      <div className="px-3 py-4 border-t border-sidebar-border space-y-2">
        {currentUser && !collapsed && (
          <div className="flex items-center gap-3 px-3 py-2 rounded-xl bg-sidebar-accent">
            <Avatar className="w-8 h-8 border border-gold/30 shrink-0">
              <AvatarFallback className="bg-gold/15 text-gold text-xs font-semibold">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-sidebar-foreground truncate">
                {currentUser.full_name}
              </div>
              <div className="text-xs text-sidebar-foreground/50 truncate">
                {currentUser.email}
              </div>
            </div>
          </div>
        )}
        {currentUser && collapsed && (
          <Avatar className="w-8 h-8 mx-auto border border-gold/30">
            <AvatarFallback className="bg-gold/15 text-gold text-xs font-semibold">
              {initials}
            </AvatarFallback>
          </Avatar>
        )}
        <button
          onClick={handleSignOut}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent transition-all"
        >
          <LogOut size={18} />
          {!collapsed && <span>Đăng xuất</span>}
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile toggle */}
      <button
        onClick={() => setMobileOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-card border border-border text-foreground"
      >
        <Menu size={20} />
      </button>

      {/* Mobile overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
              className="lg:hidden fixed inset-0 z-40 bg-black/60"
            />
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="lg:hidden fixed top-0 left-0 bottom-0 z-50 w-[260px] bg-sidebar border-r border-sidebar-border"
            >
              <button
                onClick={() => setMobileOpen(false)}
                className="absolute top-4 right-4 p-1 text-sidebar-foreground/60 hover:text-sidebar-foreground"
              >
                <X size={18} />
              </button>
              <NavContent />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Desktop sidebar */}
      <aside
        className={cn(
          "hidden lg:flex flex-col fixed top-0 left-0 bottom-0 bg-sidebar border-r border-sidebar-border transition-all duration-300 z-30",
          collapsed ? "w-[68px]" : "w-[260px]"
        )}
      >
        <NavContent />
      </aside>
    </>
  );
}
