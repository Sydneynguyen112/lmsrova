"use client";

import { motion } from "framer-motion";
import { Users, FileCheck, Star, AlertTriangle } from "lucide-react";
import Link from "next/link";
import {
  users,
  assignments,
  getStudentsByMentor,
  getUngradedSubmissions,
  getAvgRating,
  getEnrollmentsByUser,
  getCourseById,
} from "@/lib/mock-data";
import { formatDate, formatRelativeTime } from "@/lib/utils";
import { useCurrentUser } from "@/lib/auth";
import { PageTransition } from "@/components/shared/PageTransition";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
  newbie: "bg-gray-500/20 text-gray-300 border-gray-500/30",
  beginner: "bg-blue-500/20 text-blue-300 border-blue-500/30",
  intermediate: "bg-amber-500/20 text-amber-300 border-amber-500/30",
  advanced: "bg-green-500/20 text-green-300 border-green-500/30",
};

const classificationLabels: Record<string, string> = {
  newbie: "Newbie",
  beginner: "Beginner",
  intermediate: "Intermediate",
  advanced: "Advanced",
};

const riskStyles: Record<string, string> = {
  normal: "bg-green-500/20 text-green-300 border-green-500/30",
  at_risk: "bg-red-500/20 text-red-300 border-red-500/30",
  watch: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",
  churned: "bg-gray-500/20 text-gray-400 border-gray-500/30",
};

const riskLabels: Record<string, string> = {
  normal: "Bình thường",
  at_risk: "Nguy cơ",
  watch: "Theo dõi",
  churned: "Đã rời",
};

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
};

const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

export default function MentorDashboardPage() {
  const currentUser = useCurrentUser("mentor");

  if (!currentUser) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-muted-foreground">Đang tải...</div>
      </div>
    );
  }

  const students = getStudentsByMentor(currentUser.id);
  const ungradedSubmissions = getUngradedSubmissions();
  const avgRating = getAvgRating(currentUser.id);

  // Only ungraded submissions for mentor's students
  const mentorStudentIds = new Set(students.map((s) => s.id));
  const mentorUngraded = ungradedSubmissions.filter((s) =>
    mentorStudentIds.has(s.user_id)
  );

  const stats = [
    {
      label: "Tổng học viên",
      value: students.length,
      icon: Users,
      color: "text-gold",
    },
    {
      label: "Bài cần chấm",
      value: mentorUngraded.length,
      icon: FileCheck,
      color: "text-red-400",
    },
    {
      label: "Rating trung bình",
      value: avgRating > 0 ? `${avgRating}/5` : "N/A",
      icon: Star,
      color: "text-yellow-400",
    },
  ];

  return (
    <PageTransition>
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="space-y-8"
    >
      {/* Page heading */}
      <motion.div variants={item}>
        <h1 className="text-2xl md:text-3xl font-bold">
          Xin chào,{" "}
          <span className="gold-gradient-text">
            {currentUser.full_name}
          </span>
        </h1>
        <p className="mt-1 text-muted-foreground">
          Tổng quan hoạt động mentoring của bạn
        </p>
      </motion.div>

      {/* Stats */}
      <motion.div
        variants={item}
        className="grid grid-cols-1 sm:grid-cols-3 gap-4"
      >
        {stats.map((stat) => (
          <Card key={stat.label} className="gold-border-glow">
            <CardContent className="flex items-center gap-4 pt-2">
              <div className="rounded-lg bg-gold/10 p-3">
                <stat.icon className={`h-5 w-5 ${stat.color}`} />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
                <p className="text-2xl font-bold text-foreground">
                  {stat.value}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </motion.div>

      {/* Student list table */}
      <motion.div variants={item}>
        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle className="text-lg">Danh sách học viên</CardTitle>
            <Link
              href="/mentor/students"
              className="text-sm text-gold hover:underline"
            >
              Xem tất cả
            </Link>
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
                {students.map((student) => {
                  const enrollmentList = getEnrollmentsByUser(student.id);
                  const activeEnrollment = enrollmentList.find(
                    (e) => e.status === "active"
                  );
                  const progressPct = activeEnrollment
                    ? activeEnrollment.progress_pct
                    : 0;
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
                          <span className="font-medium text-foreground">
                            {student.full_name}
                          </span>
                        </Link>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={
                            classificationStyles[
                              student.classification || "newbie"
                            ]
                          }
                        >
                          {classificationLabels[
                            student.classification || "newbie"
                          ]}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 min-w-[120px]">
                          <Progress value={progressPct} className="flex-1" />
                          <span className="text-xs text-muted-foreground w-10 text-right">
                            {progressPct}%
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={riskStyles[student.risk_tag || "normal"]}
                        >
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

      {/* Ungraded submissions */}
      <motion.div variants={item}>
        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-red-400" />
              Bài nộp chưa chấm
            </CardTitle>
            <Link
              href="/mentor/submissions"
              className="text-sm text-gold hover:underline"
            >
              Xem tất cả
            </Link>
          </CardHeader>
          <CardContent>
            {mentorUngraded.length === 0 ? (
              <p className="text-muted-foreground text-sm py-4 text-center">
                Không có bài nộp nào cần chấm
              </p>
            ) : (
              <div className="space-y-3">
                {mentorUngraded.map((submission) => {
                  const student = users.find(
                    (u) => u.id === submission.user_id
                  );
                  const assignment = assignments.find(
                    (a) => a.id === submission.assignment_id
                  );

                  return (
                    <div
                      key={submission.id}
                      className="flex items-center justify-between rounded-lg border border-border/50 bg-muted/30 p-3"
                    >
                      <div className="space-y-1">
                        <p className="font-medium text-foreground text-sm">
                          {student?.full_name || "Học viên"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {assignment?.title || "Bài tập"}
                        </p>
                      </div>
                      <div className="text-right space-y-1">
                        <p className="text-xs text-muted-foreground">
                          {formatRelativeTime(submission.submitted_at)}
                        </p>
                        <Link
                          href="/mentor/submissions"
                          className="text-xs text-gold hover:underline"
                        >
                          Chấm bài
                        </Link>
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
