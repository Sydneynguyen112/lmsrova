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
  submissions,
  assignments,
  getAtRiskStudents,
  getUngradedSubmissions,
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

// Yesterday activity from mock submissions
function getYesterdayActivity() {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yKey = yesterday.toISOString().split("T")[0];

  const activities: { studentName: string; action: string; time: string }[] = [];
  const activeStudentIds = new Set<string>();

  submissions.forEach((s) => {
    if (!s.submitted_at) return;
    const sKey = new Date(s.submitted_at).toISOString().split("T")[0];
    if (sKey === yKey) {
      const student = mockUsers.find((u) => u.id === s.user_id);
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
  const { activities: yesterdayActivities, activeCount: yesterdayActiveCount } = getYesterdayActivity();

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

        {/* Yesterday Activity */}
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
