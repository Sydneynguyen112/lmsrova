"use client";

import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { Shield, ChevronDown, CheckCircle2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import type { Profile } from "@/lib/auth";
import { cn, formatDate, formatRelativeTime } from "@/lib/utils";
import {
  Card,
  CardHeader,
  CardTitle,
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

type RoleFilter = "all" | "student" | "mentor" | "admin";

const roleFilters: { label: string; value: RoleFilter }[] = [
  { label: "Tất cả", value: "all" },
  { label: "Student", value: "student" },
  { label: "Mentor", value: "mentor" },
  { label: "Admin", value: "admin" },
];

const roleOptions: { value: string; label: string; description: string; color: string }[] = [
  { value: "student", label: "Student", description: "Học viên — xem khoá học, làm bài tập", color: "bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-500/30" },
  { value: "mentor", label: "Mentor", description: "Giảng viên — quản lý học viên, chấm bài", color: "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30" },
  { value: "admin", label: "Admin", description: "Quản trị — toàn quyền hệ thống", color: "bg-red-500/15 text-red-700 dark:text-red-300 border-red-500/30" },
];

function getInitials(name: string) {
  return name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function getRoleBadgeClass(role: string) {
  switch (role) {
    case "admin":
      return "bg-red-500/15 text-red-700 dark:text-red-300 border-red-500/30";
    case "mentor":
      return "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30";
    default:
      return "bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-500/30";
  }
}

function getRiskBadge(tag: string | null) {
  if (!tag || tag === "normal") return null;
  const map: Record<string, { label: string; className: string }> = {
    at_risk: { label: "Nguy cơ", className: "bg-red-500/15 text-red-700 dark:text-red-300 border-red-500/30" },
    watch: { label: "Theo dõi", className: "bg-orange-500/15 text-orange-700 dark:text-orange-300 border-orange-500/30" },
    churned: { label: "Đã rời", className: "bg-gray-500/15 text-gray-600 dark:text-gray-400 border-gray-500/30" },
  };
  return map[tag] ?? null;
}

export default function AdminUsersPage() {
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("all");
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<Profile | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  async function loadUsers() {
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false });
    if (data) setUsers(data as Profile[]);
    setLoading(false);
  }

  useEffect(() => { loadUsers(); }, []);

  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const matchesRole = roleFilter === "all" || u.role === roleFilter;
      const matchesSearch =
        search.trim() === "" ||
        u.full_name.toLowerCase().includes(search.toLowerCase()) ||
        u.email.toLowerCase().includes(search.toLowerCase());
      return matchesRole && matchesSearch;
    });
  }, [users, search, roleFilter]);

  function openRoleDialog(user: Profile) {
    setSelectedUser(user);
    setSaveSuccess(false);
    setDialogOpen(true);
  }

  async function handleChangeRole(newRole: string) {
    if (!selectedUser || selectedUser.role === newRole) return;
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({ role: newRole })
      .eq("id", selectedUser.id);
    setSaving(false);

    if (!error) {
      setSaveSuccess(true);
      setSelectedUser({ ...selectedUser, role: newRole as Profile["role"] });
      // Reload users list
      const { data } = await supabase.from("profiles").select("*").order("created_at", { ascending: false });
      if (data) setUsers(data as Profile[]);
    }
  }

  // Stats
  const totalUsers = users.length;
  const studentCount = users.filter((u) => u.role === "student").length;
  const mentorCount = users.filter((u) => u.role === "mentor").length;
  const adminCount = users.filter((u) => u.role === "admin").length;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-muted-foreground">Đang tải...</div>
      </div>
    );
  }

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
          Quản lý tài khoản và phân quyền người dùng
        </p>
      </motion.div>

      {/* Stats */}
      <motion.div
        className="grid grid-cols-2 sm:grid-cols-4 gap-3"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
      >
        {[
          { label: "Tổng users", value: totalUsers, color: "text-foreground" },
          { label: "Student", value: studentCount, color: "text-blue-600 dark:text-blue-400" },
          { label: "Mentor", value: mentorCount, color: "text-amber-600 dark:text-amber-400" },
          { label: "Admin", value: adminCount, color: "text-red-600 dark:text-red-400" },
        ].map((stat) => (
          <Card key={stat.label}>
            <CardContent className="py-4">
              <p className={cn("text-2xl font-bold", stat.color)}>{stat.value}</p>
              <p className="text-xs text-muted-foreground">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
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
                    <TableHead>Phân loại</TableHead>
                    <TableHead>Trạng thái</TableHead>
                    <TableHead>Ngày tạo</TableHead>
                    <TableHead className="text-center">Phân quyền</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8">
                        <p className="text-muted-foreground">
                          Không tìm thấy người dùng nào
                        </p>
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
                          transition={{ duration: 0.25, delay: i * 0.03 }}
                          className="border-b border-border/50 hover:bg-muted/30 transition-colors"
                        >
                          <TableCell>
                            <div className="flex items-center gap-2.5">
                              <Avatar className="h-8 w-8">
                                {user.avatar_url && <AvatarImage src={user.avatar_url} />}
                                <AvatarFallback className="bg-gold/20 text-gold text-xs">
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
                            <Badge variant="outline" className={getRoleBadgeClass(user.role)}>
                              {user.role}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-muted-foreground capitalize">
                            {user.classification ?? "—"}
                          </TableCell>
                          <TableCell>
                            {riskInfo ? (
                              <Badge variant="outline" className={riskInfo.className}>
                                {riskInfo.label}
                              </Badge>
                            ) : (
                              <span className="text-xs text-muted-foreground">
                                Bình thường
                              </span>
                            )}
                          </TableCell>
                          <TableCell className="text-muted-foreground whitespace-nowrap">
                            {formatDate(user.created_at)}
                          </TableCell>
                          <TableCell className="text-center">
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-gold/50 text-gold hover:bg-gold/10"
                              onClick={() => openRoleDialog(user)}
                            >
                              <Shield className="h-3.5 w-3.5 mr-1.5" />
                              Đổi role
                            </Button>
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

      {/* ── Dialog Phân quyền ── */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Phân quyền người dùng</DialogTitle>
            <DialogDescription>
              Đổi role cho{" "}
              <span className="font-semibold text-foreground">
                {selectedUser?.full_name}
              </span>{" "}
              ({selectedUser?.email})
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2 py-2">
            {roleOptions.map((option) => {
              const isCurrent = selectedUser?.role === option.value;
              return (
                <button
                  key={option.value}
                  onClick={() => !isCurrent && handleChangeRole(option.value)}
                  disabled={saving || isCurrent}
                  className={cn(
                    "w-full flex items-center gap-4 rounded-xl border p-4 text-left transition-all",
                    isCurrent
                      ? "border-gold/50 bg-gold/10"
                      : "border-border hover:border-gold/30 hover:bg-gold/5"
                  )}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className={option.color}>
                        {option.label}
                      </Badge>
                      {isCurrent && (
                        <span className="text-xs text-gold font-medium">
                          Hiện tại
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {option.description}
                    </p>
                  </div>
                  {isCurrent && (
                    <CheckCircle2 className="h-5 w-5 text-gold shrink-0" />
                  )}
                </button>
              );
            })}

            {saveSuccess && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-lg bg-emerald-500/10 border border-emerald-500/30 p-3 flex items-center gap-2"
              >
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                <span className="text-sm text-emerald-700 dark:text-emerald-300">
                  Đã cập nhật role thành công!
                </span>
              </motion.div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Đóng
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
