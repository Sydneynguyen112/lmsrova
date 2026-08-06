"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Users,
  FileCheck,
  Star,
  AlertTriangle,
  Activity,
  ShieldAlert,
  Eye,
  CheckCircle2,
  FileText,
  Play,
  MessageSquare,
  PhoneCall,
  GraduationCap,
  Filter,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import {
  getStudentsByMentor,
  getUngradedSubmissions,
  getAvgRating,
  getEnrollmentsByUser,
  getRecentSubmissions,
  getNotesByUser,
} from "@/lib/api";
import { cn, formatDate, formatRelativeTime } from "@/lib/utils";
import { supabase } from "@/lib/supabase";
import { useCurrentUser } from "@/lib/auth";
import { FLAG_LABELS } from "@/lib/status-labels";
import {
  fetchTodayActions,
  type TodayActionRow,
  type ActionGroup,
} from "@/lib/api-analytics";
import type { Profile } from "@/lib/auth";
import type { Submission, UserNote } from "@/lib/types";
import { PageTransition } from "@/components/shared/PageTransition";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";

const classificationStyles: Record<string, string> = {
  newbie: "bg-gray-500/15 text-gray-700 dark:text-gray-300 border-gray-500/30",
  beginner: "bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-500/30",
  intermediate: "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30",
  advanced: "bg-green-500/15 text-green-700 dark:text-green-300 border-green-500/30",
};
const classificationLabels: Record<string, string> = {
  newbie: "Newbie", beginner: "Beginner", intermediate: "Intermediate", advanced: "Advanced",
};
const riskStyles: Record<string, string> = {
  normal: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30",
  at_risk: "bg-red-500/15 text-red-700 dark:text-red-300 border-red-500/30",
  watch: "bg-orange-500/15 text-orange-700 dark:text-orange-300 border-orange-500/30",
  churned: "bg-gray-500/15 text-gray-600 dark:text-gray-400 border-gray-500/30",
};
const riskLabels: Record<string, string> = {
  normal: "Bình thường", at_risk: "Nguy cơ", watch: "Theo dõi", churned: "Đã rời",
};

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.08 } } };
const item = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { duration: 0.4 } } };

// 4 thẻ hành động hôm nay của mentor (từ v_today_actions, CHỈ học viên mình phụ trách)
interface MentorActionCardConfig {
  group: ActionGroup;
  label: string;
  icon: LucideIcon;
  iconClass: string;
  countClass: string;
  selectedClass: string;
}

const MENTOR_ACTION_CARDS: MentorActionCardConfig[] = [
  {
    group: "ket",
    label: FLAG_LABELS.ket,
    icon: AlertTriangle,
    iconClass: "text-red-500",
    countClass: "text-red-500",
    selectedClass: "ring-2 ring-red-500/60 border-red-500/40",
  },
  {
    group: "can_cham",
    label: "Cần chạm",
    icon: PhoneCall,
    iconClass: "text-amber-500",
    countClass: "text-amber-500",
    selectedClass: "ring-2 ring-amber-500/60 border-amber-500/40",
  },
  {
    group: "cho_cham",
    label: FLAG_LABELS.cho_cham,
    icon: FileCheck,
    iconClass: "text-sky-500",
    countClass: "text-sky-500",
    selectedClass: "ring-2 ring-sky-500/60 border-sky-500/40",
  },
  {
    group: "cho_tot_nghiep",
    label: "Chờ tốt nghiệp",
    icon: GraduationCap,
    iconClass: "text-emerald-500",
    countClass: "text-emerald-500",
    selectedClass: "ring-2 ring-emerald-500/60 border-emerald-500/40",
  },
];

interface YesterdayStudentActivity {
  userId: string;
  name: string;
  email: string;
  phone: string | null;
  classification: string | null;
  riskTag: string | null;
  progressPct: number;
  latestMentorNote: string | null;
  lastInteractionAt: string | null;
  actions: { action: string; time: string }[];
}

async function buildYesterdayActivity(
  studentIds: Set<string>,
  students: Profile[],
  mentorId: string
): Promise<{ students: YesterdayStudentActivity[]; activeCount: number }> {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yKey = yesterday.toISOString().split("T")[0];

  const recentSubs = (await getRecentSubmissions(50)) as Submission[];
  const relevantSubs = recentSubs.filter((s) => {
    if (!studentIds.has(s.user_id)) return false;
    const sKey = new Date(s.submitted_at).toISOString().split("T")[0];
    return sKey === yKey;
  });

  if (relevantSubs.length === 0) return { students: [], activeCount: 0 };

  const uniqueUserIds = Array.from(new Set(relevantSubs.map((s) => s.user_id)));
  const assignmentIds = Array.from(new Set(relevantSubs.map((s) => s.assignment_id)));

  const [{ data: assignmentRows }, enrollmentResults, noteResults] = await Promise.all([
    supabase.from("assignments").select("id, title").in("id", assignmentIds),
    Promise.all(uniqueUserIds.map((id) => getEnrollmentsByUser(id))),
    Promise.all(uniqueUserIds.map((id) => getNotesByUser(id))),
  ]);

  const assignmentTitleMap = new Map((assignmentRows || []).map((a) => [a.id, a.title as string]));
  const enrollmentMap = new Map(uniqueUserIds.map((id, i) => [id, enrollmentResults[i]]));
  const notesMap = new Map(
    uniqueUserIds.map((id, i) => [
      id,
      (noteResults[i] as UserNote[]).filter((n) => n.author_id === mentorId),
    ])
  );

  const studentMap = new Map<string, YesterdayStudentActivity>();
  relevantSubs.forEach((s) => {
    if (!studentMap.has(s.user_id)) {
      const student = students.find((u) => u.id === s.user_id);
      const enrollment = (enrollmentMap.get(s.user_id) || []).find((e) => e.status === "active");
      const latestNote = (notesMap.get(s.user_id) || [])
        .sort((a, b) => b.created_at.localeCompare(a.created_at))[0];
      studentMap.set(s.user_id, {
        userId: s.user_id,
        name: student?.full_name || "Học viên",
        email: student?.email || "",
        phone: student?.phone || null,
        classification: student?.classification || null,
        riskTag: student?.risk_tag || null,
        progressPct: enrollment?.progress_pct || 0,
        latestMentorNote: latestNote?.content || null,
        lastInteractionAt: latestNote?.created_at || null,
        actions: [],
      });
    }
    const title = assignmentTitleMap.get(s.assignment_id) || "Bài tập";
    studentMap.get(s.user_id)!.actions.push({ action: `Nộp bài ${title}`, time: s.submitted_at });
  });

  return { students: Array.from(studentMap.values()), activeCount: studentMap.size };
}

export default function MentorDashboardPage() {
  const currentUser = useCurrentUser("mentor");
  const [allStudents, setAllStudents] = useState<Profile[]>([]);
  const [mentorUngraded, setMentorUngraded] = useState<Submission[]>([]);
  const [avgRating, setAvgRating] = useState(0);
  const [yesterdayStudents, setYesterdayStudents] = useState<YesterdayStudentActivity[]>([]);
  const [yesterdayActiveCount, setYesterdayActiveCount] = useState(0);
  const [assignmentTitles, setAssignmentTitles] = useState<Map<string, string>>(new Map());
  const [enrollmentsByStudent, setEnrollmentsByStudent] = useState<Map<string, { status: string; progress_pct: number }[]>>(new Map());
  const [todayActions, setTodayActions] = useState<TodayActionRow[]>([]);
  const [selectedActionGroup, setSelectedActionGroup] = useState<ActionGroup | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser) return;
    async function load() {
      const students = await getStudentsByMentor(currentUser!.id);
      setAllStudents(students as Profile[]);

      const studentIds = new Set(students.map((s) => s.id));

      if (students.length > 0) {
        const { data: enrollRows } = await supabase
          .from("enrollments")
          .select("user_id, status, progress_pct")
          .in("user_id", students.map((s) => s.id));
        const map = new Map<string, { status: string; progress_pct: number }[]>();
        (enrollRows || []).forEach((e) => {
          const list = map.get(e.user_id) || [];
          list.push({ status: e.status, progress_pct: e.progress_pct });
          map.set(e.user_id, list);
        });
        setEnrollmentsByStudent(map);
      }
      const [ungraded, avg, actionsData] = await Promise.all([
        getUngradedSubmissions(),
        getAvgRating(currentUser!.id),
        fetchTodayActions(currentUser!.id),
      ]);
      setTodayActions(actionsData);
      const filteredUngraded = (ungraded as Submission[]).filter((s) => studentIds.has(s.user_id));
      setMentorUngraded(filteredUngraded);
      setAvgRating(avg);

      if (filteredUngraded.length > 0) {
        const { data: aRows } = await supabase
          .from("assignments")
          .select("id, title")
          .in("id", Array.from(new Set(filteredUngraded.map((s) => s.assignment_id))));
        setAssignmentTitles(new Map((aRows || []).map((a) => [a.id, a.title as string])));
      }

      const { students: yStudents, activeCount } = await buildYesterdayActivity(
        studentIds,
        students as Profile[],
        currentUser!.id
      );
      setYesterdayStudents(yStudents);
      setYesterdayActiveCount(activeCount);

      setLoading(false);
    }
    load();
  }, [currentUser]);

  if (!currentUser || loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-muted-foreground">Đang tải...</div>
      </div>
    );
  }

  // Risk stats
  const normalCount = allStudents.filter((s) => !s.risk_tag || s.risk_tag === "normal").length;
  const atRiskCount = allStudents.filter((s) => s.risk_tag === "at_risk").length;
  const watchCount = allStudents.filter((s) => s.risk_tag === "watch").length;

  // Hành động hôm nay (đã lọc theo mentor hiện tại ngay từ query)
  const selectedActionRows = selectedActionGroup
    ? todayActions.filter((a) => a.action_group === selectedActionGroup)
    : [];
  const selectedActionConfig = MENTOR_ACTION_CARDS.find((c) => c.group === selectedActionGroup);

  return (
    <PageTransition>
      <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
        <motion.div variants={item}>
          <h1 className="text-2xl md:text-3xl font-bold">
            Xin chào, <span className="gold-gradient-text">{currentUser.full_name}</span>
          </h1>
          <p className="mt-1 text-muted-foreground">Tổng quan hoạt động mentoring của bạn</p>
        </motion.div>

        {/* Hành động hôm nay — 4 thẻ từ v_today_actions, chỉ học viên mình phụ trách */}
        <motion.div variants={item} className="space-y-3">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {MENTOR_ACTION_CARDS.map((cfg) => {
              const count = todayActions.filter((a) => a.action_group === cfg.group).length;
              const isSelected = selectedActionGroup === cfg.group;
              return (
                <button
                  key={cfg.group}
                  type="button"
                  className="w-full text-left"
                  onClick={() => setSelectedActionGroup(isSelected ? null : cfg.group)}
                >
                  <Card className={cn("transition-shadow hover:shadow-md cursor-pointer", isSelected && cfg.selectedClass)}>
                    <CardContent className="py-4 text-center">
                      <cfg.icon className={cn("h-5 w-5 mx-auto", cfg.iconClass)} />
                      <p className={cn("text-2xl font-bold mt-1 tabular-nums", cfg.countClass)}>{count}</p>
                      <p className="text-[11px] text-muted-foreground">{cfg.label}</p>
                    </CardContent>
                  </Card>
                </button>
              );
            })}
          </div>

          {selectedActionGroup && selectedActionConfig && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Filter className={cn("h-5 w-5", selectedActionConfig.iconClass)} />
                  {selectedActionConfig.label}
                  <Badge className="bg-gold/15 text-gold ml-2">{selectedActionRows.length} học viên</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {selectedActionRows.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-4 text-center">
                    Không có học viên nào trong nhóm này hôm nay
                  </p>
                ) : (
                  <div className="space-y-2">
                    {selectedActionRows.map((row) => (
                      <div
                        key={`${row.action_group}-${row.user_id}`}
                        className="flex items-center justify-between gap-3 rounded-lg border border-border/50 bg-muted/30 p-3"
                      >
                        <div className="min-w-0">
                          <Link
                            href={`/mentor/students/${row.user_id}`}
                            className="text-sm font-medium text-foreground hover:text-gold transition-colors"
                          >
                            {row.full_name}
                          </Link>
                          <p className="text-xs text-muted-foreground truncate">{row.detail}</p>
                        </div>
                        <Link
                          href={`/mentor/students/${row.user_id}`}
                          className="text-xs text-gold hover:underline whitespace-nowrap shrink-0"
                        >
                          Xem hồ sơ
                        </Link>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </motion.div>

        {/* Stats Row 1 */}
        <motion.div variants={item} className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <Card>
            <CardContent className="py-4 text-center">
              <Users className="h-5 w-5 text-gold mx-auto" />
              <p className="text-2xl font-bold mt-1">{allStudents.length}</p>
              <p className="text-[11px] text-muted-foreground">Tổng học viên</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="py-4 text-center">
              <FileCheck className="h-5 w-5 text-red-400 mx-auto" />
              <p className="text-2xl font-bold mt-1">{mentorUngraded.length}</p>
              <p className="text-[11px] text-muted-foreground">Bài cần chấm</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="py-4 text-center">
              <Star className="h-5 w-5 text-yellow-400 mx-auto" />
              <p className="text-2xl font-bold mt-1">{avgRating > 0 ? `${avgRating}` : "N/A"}</p>
              <p className="text-[11px] text-muted-foreground">Rating TB</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="py-4 text-center">
              <CheckCircle2 className="h-5 w-5 text-emerald-500 mx-auto" />
              <p className="text-2xl font-bold mt-1 text-emerald-500">{normalCount}</p>
              <p className="text-[11px] text-muted-foreground">Bình thường</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="py-4 text-center">
              <ShieldAlert className="h-5 w-5 text-red-500 mx-auto" />
              <p className="text-2xl font-bold mt-1 text-red-500">{atRiskCount}</p>
              <p className="text-[11px] text-muted-foreground">Nguy cơ</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="py-4 text-center">
              <Eye className="h-5 w-5 text-orange-500 mx-auto" />
              <p className="text-2xl font-bold mt-1 text-orange-500">{watchCount}</p>
              <p className="text-[11px] text-muted-foreground">Cần theo dõi</p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Yesterday Activity — Table */}
        <motion.div variants={item}>
          <Card className="border-gold/20">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Activity className="h-5 w-5 text-gold" />
                Hoạt động hôm qua
                <Badge className="bg-gold/15 text-gold ml-2">{yesterdayActiveCount} học viên</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {yesterdayStudents.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">
                  Không có hoạt động nào từ học viên hôm qua
                </p>
              ) : (
                <div className="overflow-x-auto rounded-2xl border border-border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Học viên</TableHead>
                        <TableHead>SĐT</TableHead>
                        <TableHead>Phân loại</TableHead>
                        <TableHead>Tiến độ</TableHead>
                        <TableHead>Trạng thái</TableHead>
                        <TableHead>Ghi chú gần nhất</TableHead>
                        <TableHead>Tương tác cuối</TableHead>
                        <TableHead>Hoạt động</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {yesterdayStudents.map((s) => (
                        <TableRow key={s.userId}>
                          <TableCell>
                            <Link
                              href={`/mentor/students/${s.userId}`}
                              className="flex items-center gap-2 hover:opacity-80 transition-opacity"
                            >
                              <Avatar className="h-7 w-7">
                                <AvatarFallback className="bg-gold/20 text-gold text-[10px]">
                                  {s.name.split(" ").map((n) => n[0]).join("").slice(-2)}
                                </AvatarFallback>
                              </Avatar>
                              <div className="min-w-0">
                                <p className="text-sm font-medium text-foreground hover:text-gold transition-colors truncate">{s.name}</p>
                                <p className="text-[11px] text-muted-foreground truncate">{s.email}</p>
                              </div>
                            </Link>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                            {s.phone || <span className="italic">—</span>}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className={classificationStyles[s.classification || "newbie"]}>
                              {classificationLabels[s.classification || "newbie"]}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm font-medium text-foreground tabular-nums whitespace-nowrap">
                            {s.progressPct}%
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className={riskStyles[s.riskTag || "normal"]}>
                              {riskLabels[s.riskTag || "normal"]}
                            </Badge>
                          </TableCell>
                          <TableCell className="max-w-[260px]">
                            {s.latestMentorNote ? (
                              <p className="text-xs text-foreground line-clamp-2" title={s.latestMentorNote}>
                                {s.latestMentorNote}
                              </p>
                            ) : (
                              <span className="text-[11px] text-muted-foreground italic">Chưa có ghi chú</span>
                            )}
                          </TableCell>
                          <TableCell className="text-[11px] text-muted-foreground whitespace-nowrap">
                            {s.lastInteractionAt ? formatRelativeTime(s.lastInteractionAt) : <span className="italic">—</span>}
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1 min-w-[200px]">
                              {s.actions.map((act, i) => (
                                <div key={i} className="flex items-center gap-1.5">
                                  <FileText className="h-3 w-3 text-gold shrink-0" />
                                  <span className="text-xs text-foreground">{act.action}</span>
                                </div>
                              ))}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Student list */}
        <motion.div variants={item}>
          <Card>
            <CardHeader className="flex-row items-center justify-between">
              <CardTitle className="text-lg">Danh sách học viên</CardTitle>
              <Link href="/mentor/students" className="text-sm text-gold hover:underline">Xem tất cả</Link>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto rounded-2xl border border-gold-shadow/30">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Học viên</TableHead>
                      <TableHead>Phân loại</TableHead>
                      <TableHead>Tiến độ</TableHead>
                      <TableHead>Trạng thái</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {allStudents.map((student) => {
                      const enrollmentList = enrollmentsByStudent.get(student.id) || [];
                      const activeEnrollment = enrollmentList.find((e) => e.status === "active");
                      const progressPct = activeEnrollment ? activeEnrollment.progress_pct : 0;
                      const initials = student.full_name.split(" ").map((n) => n[0]).join("").slice(-2);
                      return (
                        <TableRow key={student.id}>
                          <TableCell>
                            <Link
                              href={`/mentor/students/${student.id}`}
                              className="flex items-center gap-3 hover:opacity-80 transition-opacity"
                            >
                              <Avatar className="h-8 w-8">
                                <AvatarFallback className="bg-gold/20 text-gold text-xs">{initials}</AvatarFallback>
                              </Avatar>
                              <span className="font-medium text-foreground hover:text-gold transition-colors">{student.full_name}</span>
                            </Link>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className={classificationStyles[student.classification || "newbie"]}>
                              {classificationLabels[student.classification || "newbie"]}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2 min-w-[120px]">
                              <Progress value={progressPct} className="flex-1" />
                              <span className="text-xs text-muted-foreground w-10 text-right">{progressPct}%</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className={riskStyles[student.risk_tag || "normal"]}>
                              {riskLabels[student.risk_tag || "normal"]}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Ungraded */}
        <motion.div variants={item}>
          <Card>
            <CardHeader className="flex-row items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-red-400" />
                Bài nộp chưa chấm
              </CardTitle>
              <Link href="/mentor/submissions" className="text-sm text-gold hover:underline">Xem tất cả</Link>
            </CardHeader>
            <CardContent>
              {mentorUngraded.length === 0 ? (
                <p className="text-muted-foreground text-sm py-4 text-center">Không có bài nộp nào cần chấm</p>
              ) : (
                <div className="space-y-3">
                  {mentorUngraded.map((sub) => {
                    const student = allStudents.find((u) => u.id === sub.user_id);
                    const assignmentTitle = assignmentTitles.get(sub.assignment_id);
                    return (
                      <div key={sub.id} className="flex items-center justify-between rounded-lg border border-border/50 bg-muted/30 p-3">
                        <div className="space-y-1">
                          <p className="font-medium text-foreground text-sm">{student?.full_name || "Học viên"}</p>
                          <p className="text-xs text-muted-foreground">{assignmentTitle || "Bài tập"}</p>
                        </div>
                        <div className="text-right space-y-1">
                          <p className="text-xs text-muted-foreground">{formatRelativeTime(sub.submitted_at)}</p>
                          <Link href="/mentor/submissions" className="text-xs text-gold hover:underline">Chấm bài</Link>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </PageTransition>
  );
}
