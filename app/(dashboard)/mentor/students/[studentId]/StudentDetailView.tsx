"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Mail,
  Phone,
  Calendar,
  Send,
  Star,
  BookOpen,
  ClipboardList,
  AlertTriangle,
} from "lucide-react";
import Link from "next/link";
import {
  users,
  assignments,
  getEnrollmentsByUser,
  getCourseById,
  getSubmissionsByUser,
  getNotesByUser,
  getLessonProgressByUser,
  getOnboardingSurveyByUser,
} from "@/lib/mock-data";
import { formatDate, formatRelativeTime } from "@/lib/utils";
import { useCurrentUser } from "@/lib/auth";
import { PageTransition } from "@/components/shared/PageTransition";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";

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

interface Props {
  studentId: string;
}

export function StudentDetailView({ studentId }: Props) {
  const currentUser = useCurrentUser("mentor");
  const [noteText, setNoteText] = useState("");

  if (!currentUser) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-muted-foreground">Đang tải...</div>
      </div>
    );
  }

  const student = users.find((u) => u.id === studentId);

  if (!student) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-muted-foreground text-lg">
          Không tìm thấy học viên
        </p>
        <Link href="/mentor/students" className="mt-4 text-gold hover:underline">
          Quay lại danh sách
        </Link>
      </div>
    );
  }

  const enrollmentList = getEnrollmentsByUser(student.id);
  const submissionList = getSubmissionsByUser(student.id);
  const notes = getNotesByUser(student.id);
  const survey = getOnboardingSurveyByUser(student.id);
  const initials = student.full_name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(-2);

  const handleAddNote = () => {
    if (!noteText.trim()) return;
    console.log("Adding note for student:", student.id, "Content:", noteText);
    setNoteText("");
  };

  return (
    <PageTransition>
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="space-y-6"
    >
      {/* Back link */}
      <motion.div variants={item}>
        <Link
          href="/mentor/students"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Quay lại danh sách
        </Link>
      </motion.div>

      {/* Profile card */}
      <motion.div variants={item}>
        <Card className="gold-border-glow">
          <CardContent className="pt-4">
            <div className="flex flex-col sm:flex-row items-start gap-6">
              <Avatar className="h-16 w-16">
                <AvatarFallback className="bg-gold/20 text-gold text-xl font-bold">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 space-y-3">
                <div>
                  <h2 className="text-xl font-bold text-foreground">
                    {student.full_name}
                  </h2>
                  <div className="flex flex-wrap items-center gap-2 mt-2">
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
                    <Badge
                      variant="outline"
                      className={riskStyles[student.risk_tag || "normal"]}
                    >
                      {riskLabels[student.risk_tag || "normal"]}
                    </Badge>
                  </div>
                </div>
                <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
                  <span className="inline-flex items-center gap-1.5">
                    <Mail className="h-3.5 w-3.5" />
                    {student.email}
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <Phone className="h-3.5 w-3.5" />
                    {student.phone}
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5" />
                    Tham gia: {formatDate(student.created_at)}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Enrollment progress */}
        <motion.div variants={item}>
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-gold" />
                Tiến độ khoá học
              </CardTitle>
            </CardHeader>
            <CardContent>
              {enrollmentList.length === 0 ? (
                <p className="text-muted-foreground text-sm">
                  Chưa đăng ký khoá nào
                </p>
              ) : (
                <div className="space-y-4">
                  {enrollmentList.map((enrollment) => {
                    const course = getCourseById(enrollment.course_id);
                    return (
                      <div
                        key={enrollment.id}
                        className="rounded-lg border border-border/50 bg-muted/20 p-4 space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <p className="font-medium text-foreground text-sm">
                            {course?.title || "Khoá học"}
                          </p>
                          <Badge
                            variant="outline"
                            className={
                              enrollment.status === "completed"
                                ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30"
                                : enrollment.status === "active"
                                ? "bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-500/30"
                                : enrollment.status === "paused"
                                ? "bg-orange-500/15 text-orange-700 dark:text-orange-300 border-orange-500/30"
                                : "bg-gray-500/15 text-gray-600 dark:text-gray-400 border-gray-500/30"
                            }
                          >
                            {enrollment.status === "completed"
                              ? "Hoàn thành"
                              : enrollment.status === "active"
                              ? "Đang học"
                              : enrollment.status === "paused"
                              ? "Tạm dừng"
                              : "Đã huỷ"}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2">
                          <Progress
                            value={enrollment.progress_pct}
                            className="flex-1"
                          />
                          <span className="text-xs text-muted-foreground w-10 text-right">
                            {enrollment.progress_pct}%
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Đăng ký: {formatDate(enrollment.enrolled_at)}
                        </p>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Recent submissions */}
        <motion.div variants={item}>
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Star className="h-4 w-4 text-gold" />
                Bài nộp gần đây
              </CardTitle>
            </CardHeader>
            <CardContent>
              {submissionList.length === 0 ? (
                <p className="text-muted-foreground text-sm">
                  Chưa có bài nộp nào
                </p>
              ) : (
                <div className="space-y-3">
                  {submissionList.map((submission) => {
                    const assignment = assignments.find(
                      (a) => a.id === submission.assignment_id
                    );
                    const isGraded = !!submission.graded_at;

                    return (
                      <div
                        key={submission.id}
                        className="rounded-lg border border-border/50 bg-muted/20 p-3 space-y-1"
                      >
                        <div className="flex items-center justify-between">
                          <p className="font-medium text-foreground text-sm">
                            {assignment?.title || "Bài tập"}
                          </p>
                          <Badge
                            variant="outline"
                            className={
                              isGraded
                                ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30"
                                : "bg-orange-500/15 text-orange-700 dark:text-orange-300 border-orange-500/30"
                            }
                          >
                            {isGraded ? "Đã chấm" : "Chưa chấm"}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Nộp: {formatRelativeTime(submission.submitted_at)}
                        </p>
                        {submission.mentor_feedback && (
                          <p className="text-xs text-muted-foreground italic mt-1 border-l-2 border-gold/30 pl-2">
                            {submission.mentor_feedback}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Mentor Notes */}
      <motion.div variants={item}>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Ghi chú Mentor</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Add note form */}
            <div className="flex gap-2">
              <Input
                placeholder="Thêm ghi chú mới..."
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleAddNote();
                }}
                className="flex-1"
              />
              <Button
                onClick={handleAddNote}
                disabled={!noteText.trim()}
                className="bg-gold hover:bg-gold/90 text-black"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>

            <Separator />

            {/* Existing notes */}
            {notes.length === 0 ? (
              <p className="text-muted-foreground text-sm text-center py-4">
                Chưa có ghi chú nào
              </p>
            ) : (
              <div className="space-y-3">
                {notes.map((note) => {
                  const author = users.find((u) => u.id === note.author_id);
                  return (
                    <div
                      key={note.id}
                      className="rounded-lg border border-border/50 bg-muted/20 p-3 space-y-1"
                    >
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-medium text-gold">
                          {author?.full_name || "Mentor"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatRelativeTime(note.created_at)}
                        </p>
                      </div>
                      <p className="text-sm text-foreground">{note.content}</p>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
      {/* Onboarding Survey */}
      <motion.div variants={item}>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <ClipboardList className="h-4 w-4 text-gold" />
              Kết quả Onboarding Survey
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!survey ? (
              <p className="text-muted-foreground text-sm text-center py-4">
                Học viên chưa hoàn thành khảo sát
              </p>
            ) : (
              <div className="space-y-4">
                {/* Summary row */}
                <div className="flex flex-wrap items-center gap-3">
                  <div className="rounded-xl bg-gold/10 border border-gold/20 px-4 py-2 text-center">
                    <div className="text-2xl font-bold text-gold">{survey.total_score}</div>
                    <div className="text-xs text-muted-foreground">Tổng điểm</div>
                  </div>
                  <Badge
                    variant="outline"
                    className={classificationStyles[survey.classification]}
                  >
                    {classificationLabels[survey.classification]}
                  </Badge>
                  {survey.has_any_one && (
                    <Badge variant="outline" className="bg-red-500/15 text-red-700 dark:text-red-300 border-red-500/30">
                      <AlertTriangle className="h-3 w-3 mr-1" />
                      Có điểm 1
                    </Badge>
                  )}
                  <span className="text-xs text-muted-foreground">
                    Hoàn thành: {formatDate(survey.completed_at)}
                  </span>
                </div>

                <Separator />

                {/* Answer details */}
                <div className="space-y-3">
                  {Object.entries(survey.answers).map(([key, value]) => {
                    const labels: Record<string, string> = {
                      self_learning: "Tự học",
                      motivation: "Động lực",
                      tradingview_skill: "Kỹ năng TradingView",
                      device: "Thiết bị",
                      trading_method: "Phương pháp giao dịch",
                      probability_thinking: "Tư duy xác suất",
                      income_status: "Tình trạng thu nhập",
                      device_detail: "Chi tiết thiết bị",
                    };

                    const isScored = typeof value === "object" && value !== null && "score" in value;

                    return (
                      <div
                        key={key}
                        className="rounded-lg border border-border/50 bg-muted/20 p-3"
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium text-foreground">
                            {labels[key] || key}
                          </span>
                          {isScored && (
                            <div className="flex items-center gap-1">
                              {Array.from({ length: 4 }).map((_, i) => (
                                <div
                                  key={i}
                                  className={`w-2 h-2 rounded-full ${
                                    i < (value as { score: number }).score
                                      ? "bg-gold"
                                      : "bg-gold/15"
                                  }`}
                                />
                              ))}
                              <span className="text-xs text-gold ml-1 font-medium">
                                {(value as { score: number }).score}/4
                              </span>
                            </div>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {isScored
                            ? (value as { answer: string }).answer
                            : String(value)}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
    </PageTransition>
  );
}
