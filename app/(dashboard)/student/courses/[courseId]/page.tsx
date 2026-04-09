"use client";

import { motion } from "framer-motion";
import { ArrowLeft, BookOpen, Clock, CheckCircle2, PlayCircle, Circle } from "lucide-react";
import Link from "next/link";
import { use } from "react";

import {
  getCourseById,
  getModulesByCourse,
  getLessonsByModule,
  getLessonProgressByUser,
  getEnrollmentsByUser,
} from "@/lib/mock-data";
import { cn, formatDuration } from "@/lib/utils";
import { useCurrentUser } from "@/lib/auth";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";

export default function CourseDetailPage({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const { courseId } = use(params);
  const currentUser = useCurrentUser("student");

  if (!currentUser) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-muted-foreground">Đang tải...</div>
      </div>
    );
  }

  const course = getCourseById(courseId);
  const courseModules = getModulesByCourse(courseId);
  const progressList = getLessonProgressByUser(currentUser.id);
  const enrollment = getEnrollmentsByUser(currentUser.id).find(
    (e) => e.course_id === courseId
  );

  if (!course) {
    return (
      <div className="p-6 text-center">
        <p className="text-muted-foreground">Khoá học không tồn tại.</p>
      </div>
    );
  }

  // Count totals
  const allLessons = courseModules.flatMap((mod) => getLessonsByModule(mod.id));
  const completedCount = allLessons.filter((l) =>
    progressList.some((lp) => lp.lesson_id === l.id && lp.status === "completed")
  ).length;
  const totalCount = allLessons.length;
  const progressPct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <div className="space-y-6 p-6">
      {/* Back link */}
      <Link
        href="/student/courses"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-gold transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Khoá học của tôi
      </Link>

      {/* Header */}
      <motion.div
        className="flex flex-col md:flex-row gap-6"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        {/* Progress Ring */}
        <div className="flex shrink-0 items-center justify-center">
          <div className="relative h-28 w-28">
            <svg className="h-full w-full -rotate-90" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="42"
                fill="none"
                stroke="currentColor"
                strokeWidth="8"
                className="text-muted/30"
              />
              <circle
                cx="50"
                cy="50"
                r="42"
                fill="none"
                stroke="currentColor"
                strokeWidth="8"
                strokeDasharray={`${progressPct * 2.64} ${264 - progressPct * 2.64}`}
                strokeLinecap="round"
                className="text-gold"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-xl font-bold text-gold">{progressPct}%</span>
            </div>
          </div>
        </div>

        <div className="flex-1 space-y-2">
          <h1 className="text-2xl font-bold gold-gradient-text">{course.title}</h1>
          <p className="text-sm text-muted-foreground">{course.description}</p>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <BookOpen className="h-4 w-4" />
              {completedCount}/{totalCount} bài học
            </span>
            {enrollment && (
              <Badge
                className={cn(
                  enrollment.status === "active" && "bg-gold/20 text-gold",
                  enrollment.status === "completed" && "bg-green-600 text-white"
                )}
              >
                {enrollment.status === "active" ? "Đang học" : enrollment.status === "completed" ? "Hoàn thành" : enrollment.status}
              </Badge>
            )}
          </div>
        </div>
      </motion.div>

      {/* Modules Accordion */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="text-gold">Nội dung khoá học</CardTitle>
          </CardHeader>
          <CardContent>
            <Accordion className="space-y-2">
              {courseModules.map((mod) => {
                const moduleLessons = getLessonsByModule(mod.id);
                const modCompleted = moduleLessons.filter((l) =>
                  progressList.some(
                    (lp) => lp.lesson_id === l.id && lp.status === "completed"
                  )
                ).length;

                return (
                  <AccordionItem key={mod.id} value={mod.id}>
                    <AccordionTrigger className="px-3">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <span className="font-medium truncate">
                          {mod.title}
                        </span>
                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                          {modCompleted}/{moduleLessons.length}
                        </span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-1 pl-2">
                        {moduleLessons.map((lesson) => {
                          const lp = progressList.find(
                            (p) => p.lesson_id === lesson.id
                          );
                          const status = lp?.status || "not_started";
                          const statusIcon =
                            status === "completed"
                              ? <CheckCircle2 size={18} className="text-green-500" />
                              : status === "in_progress"
                              ? <PlayCircle size={18} className="text-gold" />
                              : <Circle size={18} className="text-muted-foreground/40" />;

                          return (
                            <Link
                              key={lesson.id}
                              href={`/student/courses/${courseId}/${lesson.id}`}
                              className="flex items-center gap-3 rounded-md px-3 py-2 text-sm hover:bg-gold/5 transition-colors"
                            >
                              <span className="shrink-0">{statusIcon}</span>
                              <span
                                className={cn(
                                  "flex-1 truncate",
                                  status === "completed"
                                    ? "text-muted-foreground"
                                    : "text-foreground"
                                )}
                              >
                                {lesson.title}
                              </span>
                              <span className="text-xs text-muted-foreground whitespace-nowrap">
                                {formatDuration(lesson.duration_sec)}
                              </span>
                            </Link>
                          );
                        })}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                );
              })}
            </Accordion>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
