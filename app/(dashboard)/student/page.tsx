"use client";

import { motion } from "framer-motion";
import {
  BookOpen,
  CheckCircle2,
  FileText,
  ChevronRight,
  Play,
} from "lucide-react";
import Link from "next/link";

import {
  modules,
  lessons,
  assignments,
  getEnrollmentsByUser,
  getLessonProgressByUser,
  getSubmissionsByUser,
  getCourseById,
  getModulesByCourse,
  getLessonsByModule,
} from "@/lib/mock-data";
import { cn, formatDate, formatRelativeTime, formatDuration } from "@/lib/utils";
import { useCurrentUser } from "@/lib/auth";
import { PageTransition } from "@/components/shared/PageTransition";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

const fadeIn = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4 },
};

export default function StudentDashboardPage() {
  const currentUser = useCurrentUser("student");

  if (!currentUser) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-muted-foreground">Đang tải...</div>
      </div>
    );
  }

  const enrollments = getEnrollmentsByUser(currentUser.id);
  const activeEnrollments = enrollments.filter((e) => e.status === "active");
  const progressList = getLessonProgressByUser(currentUser.id);
  const completedLessons = progressList.filter((lp) => lp.status === "completed");
  const submissionsList = getSubmissionsByUser(currentUser.id);

  // Find next uncompleted lesson
  const inProgressLp = progressList.find((lp) => lp.status === "in_progress");
  let nextLesson = inProgressLp
    ? lessons.find((l) => l.id === inProgressLp.lesson_id)
    : null;

  // If no in-progress lesson, find the first lesson not started yet from active enrollments
  if (!nextLesson && activeEnrollments.length > 0) {
    for (const enrollment of activeEnrollments) {
      const courseModules = getModulesByCourse(enrollment.course_id);
      for (const mod of courseModules) {
        const moduleLessons = getLessonsByModule(mod.id);
        for (const lesson of moduleLessons) {
          const hasProgress = progressList.find((lp) => lp.lesson_id === lesson.id);
          if (!hasProgress) {
            nextLesson = lesson;
            break;
          }
        }
        if (nextLesson) break;
      }
      if (nextLesson) break;
    }
  }

  // Find which course the next lesson belongs to
  const nextLessonCourseId = nextLesson
    ? (() => {
        const mod = modules.find((m) => m.id === nextLesson!.module_id);
        return mod?.course_id || "";
      })()
    : "";

  const recentSubmissions = [...submissionsList]
    .sort(
      (a, b) =>
        new Date(b.submitted_at).getTime() - new Date(a.submitted_at).getTime()
    )
    .slice(0, 5);

  return (
    <PageTransition>
    <div className="space-y-6 p-6">
      {/* Welcome */}
      <motion.div {...fadeIn}>
        <h1 className="text-2xl font-bold">
          Xin chào,{" "}
          <span className="gold-gradient-text">{currentUser.full_name}</span>!
        </h1>
        <p className="text-muted-foreground mt-1">
          Tiếp tục hành trình trading của bạn.
        </p>
      </motion.div>

      {/* Stats Row */}
      <motion.div
        className="grid grid-cols-1 sm:grid-cols-3 gap-4"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
      >
        <Card>
          <CardContent className="flex items-center gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gold/10">
              <BookOpen className="h-5 w-5 text-gold" />
            </div>
            <div>
              <p className="text-2xl font-bold">{activeEnrollments.length}</p>
              <p className="text-xs text-muted-foreground">Khoá học đang học</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-green-500/10">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{completedLessons.length}</p>
              <p className="text-xs text-muted-foreground">Bài đã hoàn thành</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-500/10">
              <FileText className="h-5 w-5 text-blue-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{submissionsList.length}</p>
              <p className="text-xs text-muted-foreground">Bài nộp</p>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Active Courses */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="text-gold">Khoá học đang học</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {activeEnrollments.map((enrollment) => {
                const course = getCourseById(enrollment.course_id);
                if (!course) return null;
                return (
                  <Link
                    key={enrollment.id}
                    href={`/student/courses/${course.id}`}
                    className="block rounded-lg border border-gold-shadow/30 p-4 hover:bg-gold/5 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-medium text-foreground">
                        {course.title}
                      </p>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <Progress value={enrollment.progress_pct}>
                      <span className="text-xs text-muted-foreground">
                        {Math.round(enrollment.progress_pct)}%
                      </span>
                    </Progress>
                  </Link>
                );
              })}
              {activeEnrollments.length === 0 && (
                <p className="text-muted-foreground text-sm">
                  Chưa có khoá học nào.
                </p>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Next Lesson */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="text-gold">Bài học tiếp theo</CardTitle>
            </CardHeader>
            <CardContent>
              {nextLesson ? (
                <Link
                  href={`/student/courses/${nextLessonCourseId}/${nextLesson.id}`}
                  className="flex items-center gap-4 rounded-lg border border-gold-shadow/30 p-4 hover:bg-gold/5 transition-colors"
                >
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-gold/10">
                    <Play className="h-5 w-5 text-gold" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground truncate">
                      {nextLesson.title}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatDuration(nextLesson.duration_sec)}
                    </p>
                  </div>
                  <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                </Link>
              ) : (
                <p className="text-muted-foreground text-sm">
                  Bạn đã hoàn thành tất cả bài học!
                </p>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Recent Submissions */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.4 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="text-gold">Bài nộp gần đây</CardTitle>
          </CardHeader>
          <CardContent>
            {recentSubmissions.length > 0 ? (
              <div className="space-y-3">
                {recentSubmissions.map((sub) => {
                  const assignment = assignments.find(
                    (a) => a.id === sub.assignment_id
                  );
                  const isGraded = !!sub.graded_at;
                  return (
                    <div
                      key={sub.id}
                      className="flex items-center justify-between rounded-lg border border-gold-shadow/30 p-3"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium truncate">
                          {assignment?.title || "Bài tập"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatRelativeTime(sub.submitted_at)}
                        </p>
                      </div>
                      <Badge
                        variant={isGraded ? "default" : "secondary"}
                        className={cn(
                          isGraded && "bg-green-600 text-white"
                        )}
                      >
                        {isGraded ? "Đã chấm" : "Chờ chấm"}
                      </Badge>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-muted-foreground text-sm">
                Chưa có bài nộp nào.
              </p>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
    </PageTransition>
  );
}
