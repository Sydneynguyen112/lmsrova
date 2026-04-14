"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Search, Unlock, BookOpen, CheckCircle2, UserCog, Users } from "lucide-react";
import { supabase } from "@/lib/supabase";
import type { Profile } from "@/lib/auth";
import { cn, formatDate } from "@/lib/utils";
import { PageTransition } from "@/components/shared/PageTransition";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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

type DialogTab = "enroll" | "mentor";

export default function AdminStudentsPage() {
  const [search, setSearch] = useState("");
  const [students, setStudents] = useState<Profile[]>([]);
  const [mentors, setMentors] = useState<Profile[]>([]);
  const [courses, setCourses] = useState<CourseItem[]>([]);
  const [enrollments, setEnrollments] = useState<EnrollmentItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogTab, setDialogTab] = useState<DialogTab>("enroll");
  const [selectedStudent, setSelectedStudent] = useState<Profile | null>(null);
  const [enrolling, setEnrolling] = useState(false);
  const [enrollSuccess, setEnrollSuccess] = useState<string | null>(null);
  const [savingMentor, setSavingMentor] = useState(false);
  const [mentorSuccess, setMentorSuccess] = useState(false);

  async function loadData() {
    const [{ data: s }, { data: m }, { data: c }, { data: e }] = await Promise.all([
      supabase.from("profiles").select("*").eq("role", "student").order("created_at", { ascending: false }),
      supabase.from("profiles").select("*").eq("role", "mentor").order("full_name"),
      supabase.from("courses").select("id, title"),
      supabase.from("enrollments").select("*"),
    ]);
    if (s) setStudents(s as Profile[]);
    if (m) setMentors(m as Profile[]);
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

  function openDialog(student: Profile, tab: DialogTab) {
    setSelectedStudent(student);
    setDialogTab(tab);
    setEnrollSuccess(null);
    setMentorSuccess(false);
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
      const { data: e } = await supabase.from("enrollments").select("*");
      if (e) setEnrollments(e as EnrollmentItem[]);
    }
  }

  async function handleAssignMentor(mentorId: string | null) {
    if (!selectedStudent) return;
    setSavingMentor(true);
    const { error } = await supabase
      .from("profiles")
      .update({ mentor_id: mentorId })
      .eq("id", selectedStudent.id);
    setSavingMentor(false);

    if (!error) {
      setMentorSuccess(true);
      setSelectedStudent({ ...selectedStudent, mentor_id: mentorId });
      // Reload students
      const { data: s } = await supabase.from("profiles").select("*").eq("role", "student").order("created_at", { ascending: false });
      if (s) setStudents(s as Profile[]);
    }
  }

  function getStudentCourseInfo(studentId: string) {
    const studentEnrolls = enrollments.filter((e) => e.user_id === studentId);
    const active = studentEnrolls.find((e) => e.status === "active");
    const course = active ? courses.find((c) => c.id === active.course_id) : null;
    return { activeCourse: course, progressPct: active?.progress_pct || 0 };
  }

  function getMentorName(mentorId: string | null) {
    if (!mentorId) return null;
    return mentors.find((m) => m.id === mentorId);
  }

  // Tính số học viên mỗi mentor
  function getMentorStudentCount(mentorId: string) {
    return students.filter((s) => s.mentor_id === mentorId).length;
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
            Danh sách, tiến độ, mở khoá khoá học và gán mentor
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
                      <TableHead>Mentor</TableHead>
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
                        <TableCell colSpan={9} className="text-center py-8">
                          <p className="text-muted-foreground">
                            Không tìm thấy học viên nào
                          </p>
                        </TableCell>
                      </TableRow>
                    ) : (
                      filtered.map((student) => {
                        const { activeCourse, progressPct } = getStudentCourseInfo(student.id);
                        const mentor = getMentorName(student.mentor_id);
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
                                  {student.avatar_url && <AvatarImage src={student.avatar_url} />}
                                  <AvatarFallback className="bg-gold/20 text-gold text-xs">
                                    {initials}
                                  </AvatarFallback>
                                </Avatar>
                                <span className="font-medium text-foreground">
                                  {student.full_name}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell className="text-muted-foreground text-sm">
                              {student.email}
                            </TableCell>
                            <TableCell>
                              {mentor ? (
                                <span className="text-sm text-foreground">{mentor.full_name}</span>
                              ) : (
                                <span className="text-sm text-muted-foreground italic">Chưa gán</span>
                              )}
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant="outline"
                                className={classificationStyles[student.classification || "newbie"]}
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
                                className={riskStyles[student.risk_tag || "normal"]}
                              >
                                {riskLabels[student.risk_tag || "normal"]}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-muted-foreground text-sm">
                              {formatDate(student.created_at)}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1.5 justify-center">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="border-gold/50 text-gold hover:bg-gold/10"
                                  onClick={() => openDialog(student, "enroll")}
                                >
                                  <Unlock className="h-3.5 w-3.5 mr-1" />
                                  Khoá học
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="border-amber-500/50 text-amber-600 dark:text-amber-400 hover:bg-amber-500/10"
                                  onClick={() => openDialog(student, "mentor")}
                                >
                                  <UserCog className="h-3.5 w-3.5 mr-1" />
                                  Mentor
                                </Button>
                              </div>
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

      {/* ── Dialog ── */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          {/* Tabs */}
          <div className="flex gap-1 border-b border-border -mx-4 px-4">
            <button
              onClick={() => { setDialogTab("enroll"); setMentorSuccess(false); }}
              className={cn(
                "flex items-center gap-1.5 px-3 py-2 text-sm font-medium border-b-2 -mb-px transition-colors",
                dialogTab === "enroll"
                  ? "border-gold text-gold"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              <BookOpen className="h-3.5 w-3.5" />
              Khoá học
            </button>
            <button
              onClick={() => { setDialogTab("mentor"); setEnrollSuccess(null); }}
              className={cn(
                "flex items-center gap-1.5 px-3 py-2 text-sm font-medium border-b-2 -mb-px transition-colors",
                dialogTab === "mentor"
                  ? "border-gold text-gold"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              <UserCog className="h-3.5 w-3.5" />
              Mentor
            </button>
          </div>

          <DialogHeader>
            <DialogTitle>
              {dialogTab === "enroll" ? "Mở khoá khoá học" : "Gán Mentor"}
            </DialogTitle>
            <DialogDescription>
              {dialogTab === "enroll" ? "Chọn khoá học để mở cho " : "Chọn mentor phụ trách "}
              <span className="font-semibold text-foreground">
                {selectedStudent?.full_name}
              </span>
            </DialogDescription>
          </DialogHeader>

          {/* ── Tab: Khoá học ── */}
          {dialogTab === "enroll" && (
            <div className="space-y-3 py-2">
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
          )}

          {/* ── Tab: Mentor ── */}
          {dialogTab === "mentor" && (
            <div className="space-y-2 py-2">
              {mentors.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Chưa có mentor nào trong hệ thống.
                </p>
              ) : (
                <>
                  {mentors.map((mentor) => {
                    const isCurrent = selectedStudent?.mentor_id === mentor.id;
                    const studentCount = getMentorStudentCount(mentor.id);
                    return (
                      <button
                        key={mentor.id}
                        onClick={() => !isCurrent && handleAssignMentor(mentor.id)}
                        disabled={savingMentor || isCurrent}
                        className={cn(
                          "w-full flex items-center gap-3 rounded-xl border p-3 text-left transition-all",
                          isCurrent
                            ? "border-gold/50 bg-gold/10"
                            : "border-border hover:border-gold/30 hover:bg-gold/5"
                        )}
                      >
                        <Avatar className="h-9 w-9">
                          {mentor.avatar_url && <AvatarImage src={mentor.avatar_url} />}
                          <AvatarFallback className="bg-amber-500/20 text-amber-600 text-xs">
                            {mentor.full_name.split(" ").map((n) => n[0]).join("").slice(-2)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-foreground">
                              {mentor.full_name}
                            </span>
                            {isCurrent && (
                              <Badge variant="outline" className="text-[10px] border-gold/50 text-gold">
                                Hiện tại
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Users className="h-3 w-3" />
                            {studentCount} học viên
                          </div>
                        </div>
                        {isCurrent ? (
                          <CheckCircle2 className="h-5 w-5 text-gold shrink-0" />
                        ) : (
                          <span className="text-xs text-gold font-medium shrink-0">Chọn</span>
                        )}
                      </button>
                    );
                  })}

                  {/* Nút bỏ gán mentor */}
                  {selectedStudent?.mentor_id && (
                    <button
                      onClick={() => handleAssignMentor(null)}
                      disabled={savingMentor}
                      className="w-full flex items-center justify-center gap-2 rounded-xl border border-dashed border-border p-3 text-sm text-muted-foreground hover:border-red-500/30 hover:text-red-500 transition-colors"
                    >
                      Bỏ gán mentor
                    </button>
                  )}
                </>
              )}

              {mentorSuccess && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-lg bg-emerald-500/10 border border-emerald-500/30 p-3 flex items-center gap-2"
                >
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  <span className="text-sm text-emerald-700 dark:text-emerald-300">
                    Đã cập nhật mentor thành công!
                  </span>
                </motion.div>
              )}
            </div>
          )}

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
