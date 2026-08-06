"use client";

// Danh sách học viên của mentor (Phase 03): tag trạng thái + cờ Kẹt/Chờ chấm
// + chặng hiện tại + số ngày ở chặng + lần chạm gần nhất. Filter tag/cờ/Sẵn sàng Coaching.
// Sort mặc định: Kẹt → Chậm → còn lại. Bỏ hiển thị risk_tag cũ.
import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { Search, Sparkles } from "lucide-react";
import Link from "next/link";
import { getStudentsByMentor } from "@/lib/api";
import {
  getMentorRoadmapRows,
  getLastTouchByUsers,
  type StudentRoadmapRow,
} from "@/lib/api-mentor";
import {
  STATUS_LABELS,
  STATUS_STYLES,
  FLAG_LABELS,
  FLAG_STYLES,
  type StudentStatus,
} from "@/lib/status-labels";
import { formatDate, formatRelativeTime } from "@/lib/utils";
import { useCurrentUser } from "@/lib/auth";
import type { Profile } from "@/lib/auth";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
};

const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

type FlagFilter = "all" | "ket" | "cho_cham";

export default function MentorStudentsPage() {
  const currentUser = useCurrentUser("mentor");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StudentStatus | "all">("all");
  const [flagFilter, setFlagFilter] = useState<FlagFilter>("all");
  const [readyOnly, setReadyOnly] = useState(false);
  const [students, setStudents] = useState<Profile[]>([]);
  const [roadmapRows, setRoadmapRows] = useState<Map<string, StudentRoadmapRow>>(new Map());
  const [lastTouch, setLastTouch] = useState<Map<string, string>>(new Map());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser) return;
    async function load() {
      const s = (await getStudentsByMentor(currentUser!.id)) as Profile[];
      setStudents(s);
      const [rows, touches] = await Promise.all([
        getMentorRoadmapRows(currentUser!.id), // SELECT * FROM v_student_roadmap WHERE mentor_id = ...
        getLastTouchByUsers(s.map((st) => st.id)),
      ]);
      setRoadmapRows(new Map(rows.map((r) => [r.user_id, r])));
      setLastTouch(touches);
      setLoading(false);
    }
    load();
  }, [currentUser]);

  const filtered = useMemo(() => {
    const rankOf = (row: StudentRoadmapRow | undefined): number => {
      if (row?.is_ket) return 0; // Kẹt trước
      if (row?.status === "cham") return 1; // rồi Chậm
      return 2; // còn lại
    };
    return students
      .filter((s) => {
        const row = roadmapRows.get(s.id);
        if (!s.full_name.toLowerCase().includes(search.toLowerCase())) return false;
        if (statusFilter !== "all" && (row?.status || "dung_tien_do") !== statusFilter) return false;
        if (flagFilter === "ket" && !row?.is_ket) return false;
        if (flagFilter === "cho_cham" && !row?.is_cho_cham) return false;
        if (readyOnly && !row?.ready_for_coaching) return false;
        return true;
      })
      .sort((a, b) => {
        const ra = roadmapRows.get(a.id);
        const rb = roadmapRows.get(b.id);
        const diff = rankOf(ra) - rankOf(rb);
        if (diff !== 0) return diff;
        return Number(rb?.days_late || 0) - Number(ra?.days_late || 0); // trễ nhiều lên trước
      });
  }, [students, roadmapRows, search, statusFilter, flagFilter, readyOnly]);

  if (!currentUser || loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-muted-foreground">Đang tải...</div>
      </div>
    );
  }

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="space-y-6"
    >
      <motion.div variants={item}>
        <h1 className="text-2xl md:text-3xl font-bold">
          <span className="gold-gradient-text">Danh sách học viên</span>
        </h1>
        <p className="mt-1 text-muted-foreground">
          Quản lý và theo dõi tiến độ học viên của bạn
        </p>
      </motion.div>

      {/* Search + filters */}
      <motion.div variants={item} className="flex flex-wrap items-center gap-3">
        <div className="relative max-w-sm flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Tìm kiếm học viên..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as StudentStatus | "all")}
          className="rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-gold/50"
        >
          <option value="all">Mọi trạng thái</option>
          {(Object.keys(STATUS_LABELS) as StudentStatus[]).map((s) => (
            <option key={s} value={s}>{STATUS_LABELS[s]}</option>
          ))}
        </select>
        <select
          value={flagFilter}
          onChange={(e) => setFlagFilter(e.target.value as FlagFilter)}
          className="rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-gold/50"
        >
          <option value="all">Mọi cờ</option>
          <option value="ket">{FLAG_LABELS.ket}</option>
          <option value="cho_cham">{FLAG_LABELS.cho_cham}</option>
        </select>
        <Button
          size="sm"
          variant="outline"
          onClick={() => setReadyOnly((v) => !v)}
          className={
            readyOnly
              ? "border-gold/60 bg-gold/10 text-gold"
              : "border-border text-muted-foreground"
          }
        >
          <Sparkles className="h-3.5 w-3.5 mr-1.5" />
          Sẵn sàng Coaching
        </Button>
      </motion.div>

      {/* Table */}
      <motion.div variants={item}>
        <Card>
          <CardContent className="pt-4">
            <div className="overflow-x-auto rounded-2xl border border-gold-shadow/30">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Học viên</TableHead>
                  <TableHead>Tag</TableHead>
                  <TableHead>Chặng hiện tại</TableHead>
                  <TableHead>Ngày ở chặng</TableHead>
                  <TableHead>Lần chạm gần nhất</TableHead>
                  <TableHead>Ngày tham gia</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      <p className="text-muted-foreground">
                        Không tìm thấy học viên nào
                      </p>
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((student) => {
                    const row = roadmapRows.get(student.id);
                    const status = (row?.status || "dung_tien_do") as StudentStatus;
                    const touch = lastTouch.get(student.id);
                    const initials = student.full_name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .slice(-2);

                    return (
                      <TableRow key={student.id}>
                        <TableCell>
                          <Link
                            href={`/mentor/students/${student.id}`}
                            className="flex items-center gap-3 hover:opacity-80 transition-opacity"
                          >
                            <Avatar className="h-8 w-8">
                              <AvatarFallback className="bg-gold/20 text-gold text-xs">
                                {initials}
                              </AvatarFallback>
                            </Avatar>
                            <div className="min-w-0">
                              <p className="font-medium text-foreground flex items-center gap-1.5">
                                {student.full_name}
                                {row?.ready_for_coaching && (
                                  <Sparkles className="h-3.5 w-3.5 text-gold shrink-0" />
                                )}
                              </p>
                              <p className="text-xs text-muted-foreground truncate">
                                {student.email}
                              </p>
                            </div>
                          </Link>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap items-center gap-1.5">
                            <Badge className={STATUS_STYLES[status]}>
                              {STATUS_LABELS[status]}
                            </Badge>
                            {row?.is_ket && (
                              <Badge className={FLAG_STYLES.ket}>{FLAG_LABELS.ket}</Badge>
                            )}
                            {row?.is_cho_cham && (
                              <Badge className={FLAG_STYLES.cho_cham}>{FLAG_LABELS.cho_cham}</Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-foreground">
                          {row?.current_stage_title || "—"}
                        </TableCell>
                        <TableCell className="text-sm">
                          {row?.days_in_stage !== null && row?.days_in_stage !== undefined ? (
                            <span className="text-foreground">
                              {Math.floor(Number(row.days_in_stage))} ngày
                              {Number(row.days_late) > 0 && (
                                <span className="text-red-500 text-xs">
                                  {" "}(trễ {Math.floor(Number(row.days_late))})
                                </span>
                              )}
                            </span>
                          ) : (
                            "—"
                          )}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {touch ? formatRelativeTime(touch) : "Chưa chạm"}
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {formatDate(student.created_at)}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}
