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
} from "lucide-react";
import Link from "next/link";
import {
  users,
  assignments,
  submissions,
  getStudentsByMentor,
  getUngradedSubmissions,
  getAvgRating,
  getEnrollmentsByUser,
} from "@/lib/mock-data";
import { cn, formatDate, formatRelativeTime } from "@/lib/utils";
import { supabase } from "@/lib/supabase";
import { useCurrentUser } from "@/lib/auth";
import type { Profile } from "@/lib/auth";
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

// Tính hoạt động hôm qua từ mock submissions
function getYesterdayActivity(studentIds: Set<string>) {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yKey = yesterday.toISOString().split("T")[0];

  const activities: { studentName: string; action: string; time: string }[] = [];
  const activeStudentIds = new Set<string>();

  submissions.forEach((s) => {
    if (!studentIds.has(s.user_id)) return;
    if (!s.submitted_at) return;
    const sKey = new Date(s.submitted_at).toISOString().split("T")[0];
    if (sKey === yKey) {
      const student = users.find((u) => u.id === s.user_id);
      const assignment = assignments.find((a) => a.id === s.assignment_id);
      activities.push({
        studentName: student?.full_name || "Học viên",
        action: `Nộp bài: ${assignment?.title || "Bài tập"}`,
        time: s.submitted_at,
      });
      activeStudentIds.add(s.user_id);
    }
  });

  return { activities, activeCount: activeStudentIds.size };
}

export default function MentorDashboardPage() {
  const currentUser = useCurrentUser("mentor");
  const [dbStudents, setDbStudents] = useState<Profile[]>([]);

  useEffect(() => {
    if (!currentUser) return;
    async function load() {
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("role", "student")
        .eq("mentor_id", currentUser!.id);
      if (data) setDbStudents(data as Profile[]);
    }
    load();
  }, [currentUser]);

  if (!currentUser) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-muted-foreground">Đang tải...</div>
      </div>
    );
  }

  const mockStudents = getStudentsByMentor(currentUser.id);
  const dbEmails = new Set(dbStudents.map((s) => s.email));
  const allStudents = [...dbStudents, ...mockStudents.filter((s) => !dbEmails.has(s.email))];

  const ungradedSubmissions = getUngradedSubmissions();
  const avgRating = getAvgRating(currentUser.id);
  const mentorStudentIds = new Set(allStudents.map((s) => s.id));
  const mentorUngraded = ungradedSubmissions.filter((s) => mentorStudentIds.has(s.user_id));

  // Risk stats
  const normalCount = allStudents.filter((s) => !s.risk_tag || s.risk_tag === "normal").length;
  const atRiskCount = allStudents.filter((s) => s.risk_tag === "at_risk").length;
  const watchCount = allStudents.filter((s) => s.risk_tag === "watch").length;

  // Yesterday activity
  const { activities: yesterdayActivities, activeCount: yesterdayActiveCount } = getYesterdayActivity(mentorStudentIds);

  return (
    <PageTransition>
      <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
        <motion.div variants={item}>
          <h1 className="text-2xl md:text-3xl font-bold">
            Xin chào, <span className="gold-gradient-text">{currentUser.full_name}</span>
          </h1>
          <p className="mt-1 text-muted-foreground">Tổng quan hoạt động mentoring của bạn</p>
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

        {/* Yesterday Activity */}
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
              {yesterdayActivities.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">
                  Không có hoạt động nào từ học viên hôm qua
                </p>
              ) : (
                <div className="space-y-2">
                  {yesterdayActivities.map((act, i) => (
                    <div key={i} className="flex items-center gap-3 rounded-lg border border-border/50 p-3">
                      <FileText className="h-4 w-4 text-gold shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground">{act.studentName}</p>
                        <p className="text-xs text-muted-foreground">{act.action}</p>
                      </div>
                      <span className="text-xs text-muted-foreground shrink-0">{formatRelativeTime(act.time)}</span>
                    </div>
                  ))}
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
                      const enrollmentList = getEnrollmentsByUser(student.id);
                      const activeEnrollment = enrollmentList.find((e) => e.status === "active");
                      const progressPct = activeEnrollment ? activeEnrollment.progress_pct : 0;
                      const initials = student.full_name.split(" ").map((n) => n[0]).join("").slice(-2);
                      return (
                        <TableRow key={student.id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <Avatar className="h-8 w-8">
                                <AvatarFallback className="bg-gold/20 text-gold text-xs">{initials}</AvatarFallback>
                              </Avatar>
                              <span className="font-medium text-foreground">{student.full_name}</span>
                            </div>
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
                    const student = users.find((u) => u.id === sub.user_id);
                    const assignment = assignments.find((a) => a.id === sub.assignment_id);
                    return (
                      <div key={sub.id} className="flex items-center justify-between rounded-lg border border-border/50 bg-muted/30 p-3">
                        <div className="space-y-1">
                          <p className="font-medium text-foreground text-sm">{student?.full_name || "Học viên"}</p>
                          <p className="text-xs text-muted-foreground">{assignment?.title || "Bài tập"}</p>
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
