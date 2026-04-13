"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Search, Unlock, BookOpen, CheckCircle2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import type { Profile } from "@/lib/auth";
import { formatDate } from "@/lib/utils";
import { PageTransition } from "@/components/shared/PageTransition";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";

interface CourseItem {
  id: string;
  title: string;
}

interface EnrollmentItem {
  id: string;
  user_id: string;
  course_id: string;
  status: string;
  progress_pct: number;
}

const classificationStyles: Record<string, string> = {
  newbie: "bg-gray-500/15 text-gray-700 dark:text-gray-300 border-gray-500/30",
  beginner: "bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-500/30",
  intermediate: "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30",
  advanced: "bg-green-500/15 text-green-700 dark:text-green-300 border-green-500/30",
};

const classificationLabels: Record<string, string> = {
  newbie: "Newbie",
  beginner: "Beginner",
  intermediate: "Intermediate",
  advanced: "Advanced",
};

const riskStyles: Record<string, string> = {
  normal: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30",
  at_risk: "bg-red-500/15 text-red-700 dark:text-red-300 border-red-500/30",
  watch: "bg-orange-500/15 text-orange-700 dark:text-orange-300 border-orange-500/30",
  churned: "bg-gray-500/15 text-gray-600 dark:text-gray-400 border-gray-500/30",
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

export default function AdminStudentsPage() {
  const [search, setSearch] = useState("");
  const [students, setStudents] = useState<Profile[]>([]);
  const [courses, setCourses] = useState<CourseItem[]>([]);
  const [enrollments, setEnrollments] = useState<EnrollmentItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Profile | null>(null);
  const [enrolling, setEnrolling] = useState(false);
  const [enrollSuccess, setEnrollSuccess] = useState<string | null>(null);

  async function loadData() {
    const [{ data: s }, { data: c }, { data: e }] = await Promise.all([
      supabase.from("profiles").select("*").eq("role", "student").order("created_at", { ascending: false }),
      supabase.from("courses").select("id, title"),
      supabase.from("enrollments").select("*"),
    ]);
    if (s) setStudents(s as Profile[]);
    if (c) setCourses(c as CourseItem[]);
    if (e) setEnrollments(e as EnrollmentItem[]);
    setLoading(false);
  }

  useEffect(() => { loadData(); }, []);

  // Enrollments cho student được chọn
  const studentEnrollments = selectedStudent
    ? enrollments.filter((e) => e.user_id === selectedStudent.id)
    : [];
  const enrolledCourseIds = new Set(studentEnrollments.map((e) => e.course_id));
  const availableCourses = courses.filter((c) => !enrolledCourseIds.has(c.id));

  function openEnrollDialog(student: Profile) {
    setSelectedStudent(student);
    setEnrollSuccess(null);
    setDialogOpen(true);
  }

  async function handleEnroll(courseId: string) {
    if (!selectedStudent) return;
    setEnrolling(true);
    const { error } = await supabase.from("enrollments").insert({
      user_id: selectedStudent.id,
      course_id: courseId,
      status: "active",
      progress_pct: 0,
    });
    setEnrolling(false);

    if (!error) {
      const course = courses.find((c) => c.id === courseId);
      setEnrollSuccess(course?.title || courseId);
      // Reload enrollments
      const { data: e } = await supabase.from("enrollments").select("*");
      if (e) setEnrollments(e as EnrollmentItem[]);
    }
  }

  // Helper: get enrollment info cho một student
  function getStudentCourseInfo(studentId: string) {
    const studentEnrolls = enrollments.filter((e) => e.user_id === studentId);
    const active = studentEnrolls.find((e) => e.status === "active");
    const course = active ? courses.find((c) => c.id === active.course_id) : null;
    return { enrollCount: studentEnrolls.length, activeCourse: course, progressPct: active?.progress_pct || 0 };
  }

  const filtered = students.filter(
    (s) =>
      s.full_name.toLowerCase().includes(search.toLowerCase()) ||
      s.email.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-muted-foreground">Đang tải...</div>
      </div>
    );
  }

  return (
    <PageTransition>
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="space-y-6"
      >
        <motion.div variants={item}>
          <h1 className="text-2xl md:text-3xl font-bold">
            <span className="gold-gradient-text">Quản lý Học viên</span>
          </h1>
          <p className="mt-1 text-muted-foreground">
            Danh sách và tiến độ tất cả học viên trong hệ thống
          </p>
        </motion.div>

        {/* Search */}
        <motion.div variants={item} className="max-w-sm">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Tìm kiếm học viên..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        </motion.div>

        {/* Table */}
        <motion.div variants={item}>
          <Card>
            <CardContent className="pt-4">
              <div className="overflow-x-auto rounded-2xl border border-border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Học viên</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Phân loại</TableHead>
                      <TableHead>Khoá học</TableHead>
                      <TableHead>Tiến độ</TableHead>
                      <TableHead>Trạng thái</TableHead>
                      <TableHead>Ngày tham gia</TableHead>
                      <TableHead className="text-center">Hành động</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-8">
                          <p className="text-muted-foreground">
                            Không tìm thấy học viên nào
                          </p>
                        </TableCell>
                      </TableRow>
                    ) : (
                      filtered.map((student) => {
                        const { activeCourse, progressPct } = getStudentCourseInfo(student.id);
                        const initials = student.full_name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .slice(-2);

                        return (
                          <TableRow key={student.id}>
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <Avatar className="h-8 w-8">
                                  <AvatarFallback className="bg-gold/20 text-gold text-xs">
                                    {initials}
                                  </AvatarFallback>
                                </Avatar>
                                <span className="font-medium text-foreground">
                                  {student.full_name}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell className="text-muted-foreground">
                              {student.email}
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant="outline"
                                className={
                                  classificationStyles[student.classification || "newbie"]
                                }
                              >
                                {classificationLabels[student.classification || "newbie"]}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-muted-foreground text-sm">
                              {activeCourse?.title || "Chưa có"}
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
                                className={
                                  riskStyles[student.risk_tag || "normal"]
                                }
                              >
                                {riskLabels[student.risk_tag || "normal"]}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-muted-foreground text-sm">
                              {formatDate(student.created_at)}
                            </TableCell>
                            <TableCell className="text-center">
                              <Button
                                size="sm"
                                variant="outline"
                                className="border-gold/50 text-gold hover:bg-gold/10"
                                onClick={() => openEnrollDialog(student)}
                              >
                                <Unlock className="h-3.5 w-3.5 mr-1.5" />
                                Mở khoá
                              </Button>
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

      {/* ── Dialog Mở khoá khoá học ── */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Mở khoá khoá học</DialogTitle>
            <DialogDescription>
              Chọn khoá học để mở cho{" "}
              <span className="font-semibold text-foreground">
                {selectedStudent?.full_name}
              </span>
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            {/* Khoá học đã đăng ký */}
            {studentEnrollments.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Đã đăng ký
                </p>
                {studentEnrollments.map((enrollment) => {
                  const course = courses.find((c) => c.id === enrollment.course_id);
                  return (
                    <div
                      key={enrollment.id}
                      className="flex items-center gap-3 rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-3"
                    >
                      <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                      <span className="text-sm font-medium text-foreground flex-1">
                        {course?.title || enrollment.course_id}
                      </span>
                      <Badge variant="outline" className="text-xs capitalize">
                        {enrollment.status}
                      </Badge>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Khoá học có thể mở */}
            {availableCourses.length > 0 ? (
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Có thể mở khoá
                </p>
                {availableCourses.map((course) => (
                  <div
                    key={course.id}
                    className="flex items-center gap-3 rounded-lg border border-gold-shadow/30 p-3 hover:bg-gold/5 transition-colors"
                  >
                    <BookOpen className="h-4 w-4 text-gold shrink-0" />
                    <span className="text-sm font-medium text-foreground flex-1">
                      {course.title}
                    </span>
                    <Button
                      size="sm"
                      disabled={enrolling}
                      className="bg-gold hover:bg-gold/90 text-black font-semibold"
                      onClick={() => handleEnroll(course.id)}
                    >
                      {enrolling ? "Đang mở..." : "Mở khoá"}
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              !enrollSuccess && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Học viên đã được đăng ký tất cả khoá học.
                </p>
              )
            )}

            {/* Success message */}
            {enrollSuccess && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-lg bg-emerald-500/10 border border-emerald-500/30 p-3 flex items-center gap-2"
              >
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                <span className="text-sm text-emerald-700 dark:text-emerald-300">
                  Đã mở khoá <strong>{enrollSuccess}</strong> thành công!
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
    </PageTransition>
  );
}
