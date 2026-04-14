"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, BookOpen, CheckCircle2, PlayCircle, Circle, Lock } from "lucide-react";
import Link from "next/link";

import {
  getCourseById,
  getModulesByCourse,
  getLessonsByModule,
  getLessonProgressByUser,
} from "@/lib/mock-data";
import { cn, formatDuration } from "@/lib/utils";
import { supabase } from "@/lib/supabase";
import { useCurrentUser } from "@/lib/auth";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";

interface Props {
  courseId: string;
}

export function CourseDetailView({ courseId }: Props) {
  const currentUser = useCurrentUser("student");
  const [isEnrolled, setIsEnrolled] = useState<boolean | null>(null);

  useEffect(() => {
    if (!currentUser) return;
    async function check() {
      const { data } = await supabase
        .from("enrollments")
        .select("id")
        .eq("user_id", currentUser!.id)
        .eq("course_id", courseId)
        .limit(1);
      setIsEnrolled((data ?? []).length > 0);
    }
    check();
  }, [currentUser, courseId]);

  if (!currentUser || isEnrolled === null) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-muted-foreground">Đang tải...</div>
      </div>
    );
  }

  const course = getCourseById(courseId);
  const courseModules = getModulesByCourse(courseId);
  const progressList = getLessonProgressByUser(currentUser.id);

  if (!course) {
    return (
      <div className="p-6 text-center">
        <p className="text-muted-foreground">Khoá học không tồn tại.</p>
      </div>
    );
  }

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
            {isEnrolled ? (
              <Badge className="bg-gold/20 text-gold">Đang học</Badge>
            ) : (
              <Badge className="bg-gray-500/15 text-gray-600 dark:text-gray-400 border-gray-500/30">
                <Lock className="h-3 w-3 mr-1" />
                Chưa mở khoá
              </Badge>
            )}
          </div>
        </div>
      </motion.div>

      {/* Locked banner */}
      {!isEnrolled && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl border border-gold/30 bg-gold/5 p-4 flex items-center gap-3"
        >
          <Lock className="h-5 w-5 text-gold shrink-0" />
          <p className="text-sm text-foreground">
            Khoá học chưa được mở. Bạn có thể xem danh sách bài học bên dưới nhưng chưa truy cập được nội dung.
          </p>
        </motion.div>
      )}

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
                        <span className="font-medium truncate">{mod.title}</span>
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
                          const statusIcon = !isEnrolled ? (
                            <Lock size={16} className="text-muted-foreground/40" />
                          ) : status === "completed" ? (
                            <CheckCircle2 size={18} className="text-green-500" />
                          ) : status === "in_progress" ? (
                            <PlayCircle size={18} className="text-gold" />
                          ) : (
                            <Circle size={18} className="text-muted-foreground/40" />
                          );

                          if (!isEnrolled) {
                            return (
                              <div
                                key={lesson.id}
                                className="flex items-center gap-3 rounded-md px-3 py-2 text-sm text-muted-foreground/60 cursor-not-allowed"
                              >
                                <span className="shrink-0">{statusIcon}</span>
                                <span className="flex-1 truncate">{lesson.title}</span>
                                <span className="text-xs whitespace-nowrap">
                                  {formatDuration(lesson.duration_sec)}
                                </span>
                              </div>
                            );
                          }

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
