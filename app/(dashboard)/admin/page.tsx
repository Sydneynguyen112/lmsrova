"use client";

import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import {
  Users,
  BookOpen,
  DollarSign,
  FileCheck,
  CheckCircle2,
  ShieldAlert,
  Eye,
  Activity,
  FileText,
  AlertTriangle,
} from "lucide-react";
import {
  users as mockUsers,
  courses as mockCourses,
  enrollments as mockEnrollments,
  getAtRiskStudents,
  getUngradedSubmissions,
  getRecentSubmissions,
  getEnrollmentsByUser,
} from "@/lib/mock-data";
import { cn, formatPrice, formatDate, formatRelativeTime } from "@/lib/utils";
import { supabase } from "@/lib/supabase";
import type { Profile } from "@/lib/auth";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { PageTransition } from "@/components/shared/PageTransition";

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.08, duration: 0.4, ease: "easeOut" as const },
  }),
};

function getInitials(name: string) {
  return name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
}

interface YesterdayStudentActivity {
  userId: string;
  name: string;
  email: string;
  phone: string | null;
  mentorName: string | null;
  classification: string | null;
  riskTag: string | null;
  progressPct: number;
  actions: { action: string; time: string }[];
}

function getYesterdayActivity() {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yKey = yesterday.toISOString().split("T")[0];

  const studentMap = new Map<string, YesterdayStudentActivity>();

  const recentSubs = getRecentSubmissions();
  recentSubs.forEach((s) => {
    const sKey = new Date(s.submitted_at).toISOString().split("T")[0];
    if (sKey !== yKey) return;

    if (!studentMap.has(s.user_id)) {
      const student = mockUsers.find((u) => u.id === s.user_id);
      const mentor = student?.mentor_id ? mockUsers.find((u) => u.id === student.mentor_id) : null;
      const enrollment = getEnrollmentsByUser(s.user_id).find((e) => e.status === "active");
      studentMap.set(s.user_id, {
        userId: s.user_id,
        name: student?.full_name || "Học viên",
        email: student?.email || "",
        phone: student?.phone || null,
        mentorName: mentor?.full_name || null,
        classification: student?.classification || null,
        riskTag: student?.risk_tag || null,
        progressPct: enrollment?.progress_pct || 0,
        actions: [],
      });
    }
    studentMap.get(s.user_id)!.actions.push({ action: s.action, time: s.submitted_at });
  });

  return { students: Array.from(studentMap.values()), activeCount: studentMap.size };
}

export default function AdminDashboardPage() {
  const [dbUsers, setDbUsers] = useState<Profile[]>([]);

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });
      if (data) setDbUsers(data as Profile[]);
    }
    load();
  }, []);

  const allStudents = dbUsers.filter((u) => u.role === "student");
  const totalUsers = dbUsers.length;
  const totalEnrollments = mockEnrollments.length;
  const ungradedCount = getUngradedSubmissions().length;

  // Risk stats
  const normalCount = allStudents.filter((s) => !s.risk_tag || s.risk_tag === "normal").length;
  const atRiskCount = allStudents.filter((s) => s.risk_tag === "at_risk").length;
  const watchCount = allStudents.filter((s) => s.risk_tag === "watch").length;

  // Revenue
  const estimatedRevenue = useMemo(() => {
    return mockCourses.reduce((total, course) => {
      if (typeof course.price !== "number") return total;
      const count = mockEnrollments.filter((e) => e.course_id === course.id).length;
      return total + course.price * count;
    }, 0);
  }, []);

  // Enrollment distribution
  const enrollmentDistribution = useMemo(() => {
    return mockCourses.map((course) => {
      const count = mockEnrollments.filter((e) => e.course_id === course.id).length;
      return { title: course.title, count };
    });
  }, []);
  const maxEnrollment = Math.max(...enrollmentDistribution.map((d) => d.count), 1);

  // Recent users from Supabase
  const recentUsers = dbUsers.slice(0, 5);

  // At risk from mock
  const atRiskStudents = getAtRiskStudents();

  // Yesterday activity
  const { students: yesterdayStudents, activeCount: yesterdayActiveCount } = getYesterdayActivity();

  const classificationLabels: Record<string, string> = { newbie: "Newbie", beginner: "Beginner", intermediate: "Intermediate", advanced: "Advanced" };
  const classificationStyles: Record<string, string> = {
    newbie: "bg-gray-500/15 text-gray-700 dark:text-gray-300 border-gray-500/30",
    beginner: "bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-500/30",
    intermediate: "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30",
    advanced: "bg-green-500/15 text-green-700 dark:text-green-300 border-green-500/30",
  };
  const riskStyles: Record<string, string> = {
    normal: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30",
    at_risk: "bg-red-500/15 text-red-700 dark:text-red-300 border-red-500/30",
    watch: "bg-orange-500/15 text-orange-700 dark:text-orange-300 border-orange-500/30",
  };
  const riskLabels: Record<string, string> = { normal: "Bình thường", at_risk: "Nguy cơ", watch: "Theo dõi" };

  return (
    <PageTransition>
      <div className="space-y-6">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <h1 className="text-2xl font-bold gold-gradient-text">Admin Dashboard</h1>
          <p className="text-muted-foreground mt-1">Tổng quan hệ thống ROVA LMS</p>
        </motion.div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3">
          {[
            { label: "Tổng Users", value: totalUsers, icon: Users, color: "text-gold" },
            { label: "Enrollments", value: totalEnrollments, icon: BookOpen, color: "text-blue-500" },
            { label: "Doanh thu", value: formatPrice(estimatedRevenue), icon: DollarSign, color: "text-emerald-500" },
            { label: "Chưa chấm", value: ungradedCount, icon: FileCheck, color: "text-red-400" },
            { label: "Bình thường", value: normalCount, icon: CheckCircle2, color: "text-emerald-500" },
            { label: "Nguy cơ", value: atRiskCount, icon: ShieldAlert, color: "text-red-500" },
            { label: "Theo dõi", value: watchCount, icon: Eye, color: "text-orange-500" },
          ].map((stat, i) => (
            <motion.div key={stat.label} custom={i} variants={fadeUp} initial="hidden" animate="visible">
              <Card>
                <CardContent className="py-4 text-center">
                  <stat.icon className={cn("h-5 w-5 mx-auto", stat.color)} />
                  <p className={cn("text-xl font-bold mt-1", typeof stat.value === "number" && stat.color === "text-red-500" ? "text-red-500" : "")}>{stat.value}</p>
                  <p className="text-[11px] text-muted-foreground">{stat.label}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Yesterday Activity — Table */}
        <motion.div custom={7} variants={fadeUp} initial="hidden" animate="visible">
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
                        <TableHead>Mentor</TableHead>
                        <TableHead>Phân loại</TableHead>
                        <TableHead>Tiến độ</TableHead>
                        <TableHead>Trạng thái</TableHead>
                        <TableHead>Hoạt động</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {yesterdayStudents.map((s) => (
                        <TableRow key={s.userId}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Avatar className="h-7 w-7">
                                <AvatarFallback className="bg-gold/20 text-gold text-[10px]">
                                  {getInitials(s.name)}
                                </AvatarFallback>
                              </Avatar>
                              <div className="min-w-0">
                                <p className="text-sm font-medium text-foreground truncate">{s.name}</p>
                                <p className="text-[11px] text-muted-foreground truncate">{s.email}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                            {s.phone || <span className="italic">—</span>}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                            {s.mentorName || <span className="italic">Chưa gán</span>}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className={classificationStyles[s.classification || "newbie"]}>
                              {classificationLabels[s.classification || "newbie"]}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2 min-w-[100px]">
                              <Progress value={s.progressPct} className="flex-1" />
                              <span className="text-xs text-muted-foreground w-8 text-right">{s.progressPct}%</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className={riskStyles[s.riskTag || "normal"]}>
                              {riskLabels[s.riskTag || "normal"]}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1 min-w-[200px]">
                              {s.actions.map((act, i) => (
                                <div key={i} className="flex items-center gap-1.5">
                                  <FileText className="h-3 w-3 text-gold shrink-0" />
                                  <span className="text-xs text-foreground">{act.action}</span>
                                  <span className="text-[10px] text-muted-foreground ml-auto shrink-0">
                                    {formatRelativeTime(act.time)}
                                  </span>
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

        {/* Enrollment Distribution */}
        <motion.div custom={8} variants={fadeUp} initial="hidden" animate="visible">
          <Card>
            <CardHeader>
              <CardTitle>Phân bố Enrollment theo khoá</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {enrollmentDistribution.map((item) => (
                  <div key={item.title} className="space-y-1.5">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-foreground truncate max-w-[70%]">{item.title}</span>
                      <span className="text-gold font-medium">{item.count} enrollments</span>
                    </div>
                    <div className="h-3 w-full rounded-full bg-muted overflow-hidden">
                      <motion.div
                        className="h-full rounded-full bg-gradient-to-r from-gold-dark to-gold"
                        initial={{ width: 0 }}
                        animate={{ width: `${(item.count / maxEnrollment) * 100}%` }}
                        transition={{ duration: 0.8, ease: "easeOut", delay: 0.3 }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Recent Users */}
        <motion.div custom={9} variants={fadeUp} initial="hidden" animate="visible">
          <Card>
            <CardHeader>
              <CardTitle>Users gần đây</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto rounded-2xl border border-gold-shadow/30">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tên</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead className="text-right">Ngày tạo</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentUsers.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Avatar className="h-8 w-8">
                              {user.avatar_url && <AvatarImage src={user.avatar_url} />}
                              <AvatarFallback className="bg-gold-dark text-foreground text-xs">
                                {getInitials(user.full_name)}
                              </AvatarFallback>
                            </Avatar>
                            <span className="font-medium">{user.full_name}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={user.role === "admin" ? "default" : user.role === "mentor" ? "secondary" : "outline"}>
                            {user.role}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">{user.email}</TableCell>
                        <TableCell className="text-right text-muted-foreground">{formatDate(user.created_at)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* At Risk Students */}
        <motion.div custom={10} variants={fadeUp} initial="hidden" animate="visible">
          <Card className="border-destructive/30">
            <CardHeader>
              <CardTitle className="text-destructive flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Students cần lưu ý
              </CardTitle>
            </CardHeader>
            <CardContent>
              {atRiskStudents.length === 0 ? (
                <p className="text-muted-foreground text-sm">Không có học viên nào cần lưu ý.</p>
              ) : (
                <div className="space-y-3">
                  {atRiskStudents.map((student) => (
                    <div key={student.id} className="flex items-center justify-between rounded-lg border border-border/50 p-3">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9">
                          <AvatarFallback className="bg-destructive/20 text-destructive text-xs">
                            {getInitials(student.full_name)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-sm">{student.full_name}</p>
                          <p className="text-xs text-muted-foreground">{student.classification ?? "N/A"}</p>
                        </div>
                      </div>
                      <Badge variant={student.risk_tag === "at_risk" ? "destructive" : "secondary"}>
                        {student.risk_tag === "at_risk" ? "Nguy cơ cao" : "Theo dõi"}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </PageTransition>
  );
}
