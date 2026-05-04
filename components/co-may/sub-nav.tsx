"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Settings, FileBarChart, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type RoleSlug = "student" | "mentor" | "admin";

interface SubNavTab {
  segment: string;
  label: string;
  icon: LucideIcon;
}

const TABS: SubNavTab[] = [
  { segment: "tong-quan", label: "Tổng quan & Hiệu suất", icon: LayoutDashboard },
  { segment: "quan-ly", label: "Cỗ Máy Chi Tiết", icon: Settings },
  { segment: "lich-su", label: "Báo cáo & Nhật ký", icon: FileBarChart },
];

export function SubNav({ role }: { role: RoleSlug }) {
  const pathname = usePathname();

  return (
    <nav className="border-b border-border">
      <div className="flex gap-1 overflow-x-auto -mb-px">
        {TABS.map((tab) => {
          const href = `/${role}/co-may/${tab.segment}`;
          const active = pathname === href || pathname.startsWith(href + "/");
          const Icon = tab.icon;
          return (
            <Link
              key={tab.segment}
              href={href}
              className={cn(
                "flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 -mb-px transition-colors",
                active
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground hover:border-border",
              )}
            >
              <Icon size={16} />
              {tab.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
