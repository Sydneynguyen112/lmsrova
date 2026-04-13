"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  users,
  getEnrollmentsByUser,
} from "@/lib/mock-data";
import { cn, formatDate, formatRelativeTime } from "@/lib/utils";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { EmptyState } from "@/components/shared/EmptyState";

type RoleFilter = "all" | "student" | "mentor" | "admin";

const roleFilters: { label: string; value: RoleFilter }[] = [
  { label: "Tất cả", value: "all" },
  { label: "Student", value: "student" },
  { label: "Mentor", value: "mentor" },
  { label: "Admin", value: "admin" },
];

function getInitials(name: string) {
  return name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function getRoleBadgeVariant(role: string) {
  switch (role) {
    case "admin":
      return "default" as const;
    case "mentor":
      return "secondary" as const;
    default:
      return "outline" as const;
  }
}

function getRiskBadge(tag: string | null) {
  if (!tag || tag === "normal") return null;
  const map: Record<string, { label: string; variant: "destructive" | "secondary" | "outline" }> = {
    at_risk: { label: "Nguy cơ cao", variant: "destructive" },
    watch: { label: "Theo dõi", variant: "secondary" },
    churned: { label: "Đã rời", variant: "outline" },
  };
  return map[tag] ?? null;
}

export default function AdminUsersPage() {
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("all");

  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const matchesRole = roleFilter === "all" || u.role === roleFilter;
      const matchesSearch =
        search.trim() === "" ||
        u.full_name.toLowerCase().includes(search.toLowerCase()) ||
        u.email.toLowerCase().includes(search.toLowerCase());
      return matchesRole && matchesSearch;
    });
  }, [search, roleFilter]);

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <h1 className="text-2xl font-bold gold-gradient-text">
          Quản lý Users
        </h1>
        <p className="text-muted-foreground mt-1">
          Danh sách tất cả người dùng trong hệ thống
        </p>
      </motion.div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="flex flex-col sm:flex-row gap-3"
      >
        <Input
          placeholder="Tìm theo tên hoặc email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="sm:max-w-xs"
        />
        <div className="flex gap-1.5">
          {roleFilters.map((rf) => (
            <Button
              key={rf.value}
              variant={roleFilter === rf.value ? "default" : "outline"}
              size="sm"
              onClick={() => setRoleFilter(rf.value)}
              className={cn(
                roleFilter === rf.value &&
                  "bg-gold text-gold-black hover:bg-gold-light"
              )}
            >
              {rf.label}
            </Button>
          ))}
        </div>
      </motion.div>

      {/* Users Table */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
      >
        <Card>
          <CardHeader>
            <CardTitle>
              Users{" "}
              <span className="text-muted-foreground font-normal text-sm">
                ({filteredUsers.length})
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Classification</TableHead>
                    <TableHead>Tiến độ</TableHead>
                    <TableHead>Risk</TableHead>
                    <TableHead>Hoạt động gần nhất</TableHead>
                    <TableHead className="text-right">Ngày tạo</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={8}
                        className="text-center py-8"
                      >
                        <EmptyState variant="search" description="Thử tìm kiếm với từ khoá khác" />
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredUsers.map((user, i) => {
                      const riskInfo = getRiskBadge(user.risk_tag);
                      return (
                        <motion.tr
                          key={user.id}
                          initial={{ opacity: 0, x: -8 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{
                            duration: 0.25,
                            delay: i * 0.03,
                          }}
                          className="border-b border-border/50 hover:bg-muted/30 transition-colors"
                        >
                          <TableCell>
                            <div className="flex items-center gap-2.5">
                              <Avatar className="h-8 w-8">
                                <AvatarFallback className="bg-gold-dark text-foreground text-xs">
                                  {getInitials(user.full_name)}
                                </AvatarFallback>
                              </Avatar>
                              <span className="font-medium whitespace-nowrap">
                                {user.full_name}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {user.email}
                          </TableCell>
                          <TableCell>
                            <Badge variant={getRoleBadgeVariant(user.role)}>
                              {user.role}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {user.classification ?? "—"}
                          </TableCell>
                          <TableCell>
                            {user.role === "student" ? (() => {
                              const enrollments = getEnrollmentsByUser(user.id);
                              const active = enrollments.find((e) => e.status === "active");
                              const pct = active ? active.progress_pct : 0;
                              return (
                                <div className="flex items-center gap-2 min-w-[100px]">
                                  <Progress value={pct} className="flex-1" />
                                  <span className="text-xs text-muted-foreground w-8 text-right">{pct}%</span>
                                </div>
                              );
                            })() : (
                              <span className="text-xs text-muted-foreground">—</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {riskInfo ? (
                              <Badge variant={riskInfo.variant}>
                                {riskInfo.label}
                              </Badge>
                            ) : (
                              <span className="text-xs text-muted-foreground">
                                Bình thường
                              </span>
                            )}
                          </TableCell>
                          <TableCell className="text-muted-foreground whitespace-nowrap">
                            {formatRelativeTime(user.last_active_date)}
                          </TableCell>
                          <TableCell className="text-right text-muted-foreground whitespace-nowrap">
                            {formatDate(user.created_at)}
                          </TableCell>
                        </motion.tr>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </motion.div>

    </div>
  );
}
