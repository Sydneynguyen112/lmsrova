"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  PlayCircle,
  Circle,
  Lock,
  GraduationCap,
  Award,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";

import { cn, formatDuration } from "@/lib/utils";
import { supabase } from "@/lib/supabase";
import { useCurrentUser } from "@/lib/auth";
import {
  loadStudentUnlockData,
  firstOpenLessonId,
  isLessonCompleted,
  type StudentUnlockData,
  type CourseLessonRow,
} from "@/lib/api-student";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";

interface DbCourse {
  id: string;
  title: string;
  description: string;
  price: number | null;
  price_label: string | null;
}

interface DbModule {
  id: string;
  course_id: string;
  title: string;
  order_index: number;
}

interface Props {
  courseId: string;
}

export function CourseDetailView({ courseId }: Props) {
  const currentUser = useCurrentUser("student");
  const [isEnrolled, setIsEnrolled] = useState<boolean | null>(null);
  const [course, setCourse] = useState<DbCourse | null>(null);
  const [courseModules, setCourseModules] = useState<DbModule[]>([]);
  const [unlockData, setUnlockData] = useState<StudentUnlockData | null>(null);
  const [loading, setLoading] = useState(true);
  // Đã tốt nghiệp khoá này chưa (để CTA đổi chữ) — null = chưa đạt
  const [gradPassed, setGradPassed] = useState(false);
  const [enrolling, setEnrolling] = useState(false);

  // Khoá miễn phí: học viên tự ghi danh rồi học luôn, không cần tư vấn
  const isFree = !!course && !course.price && course.price_label === "Miễn phí";

  async function enrollFree() {
    if (!currentUser || enrolling) return;
    setEnrolling(true);
    const { error } = await supabase.from("enrollments").insert({
      user_id: currentUser.id,
      course_id: courseId,
      status: "active",
      progress_pct: 0,
    });
    if (!error) setIsEnrolled(true);
    setEnrolling(false);
  }

  useEffect(() => {
    if (!currentUser) return;
    let cancelled = false;
    async function fetchAll() {
      // Load 1 lần khi vào trang: enrollment, course, modules + toàn bộ dữ liệu unlock
      // (roadmap_stages, lesson_progress, quiz map, quiz passed, image counts)
      const [{ data: enrollData }, { data: courseData }, { data: modulesData }, data] =
        await Promise.all([
          supabase
            .from("enrollments")
            .select("id")
            .eq("user_id", currentUser!.id)
            .eq("course_id", courseId)
            .limit(1),
          supabase.from("courses").select("*").eq("id", courseId).single(),
          supabase.from("modules").select("*").eq("course_id", courseId).order("order_index"),
          loadStudentUnlockData(currentUser!.id, courseId),
        ]);
      if (cancelled) return;

      setIsEnrolled((enrollData ?? []).length > 0);
      if (courseData) setCourse(courseData);
      setCourseModules(modulesData || []);
      setUnlockData(data);
      setLoading(false);
    }
    fetchAll();
    return () => {
      cancelled = true;
    };
  }, [currentUser, courseId]);

  // Đã đạt bài tốt nghiệp chưa — chỉ hỏi khi khoá đã gắn form
  useEffect(() => {
    if (!currentUser || !unlockData) return;
    const formId = unlockData.stages.find((s) => s.stage_key === "tot_nghiep")?.form_id;
    if (!formId) return;
    let cancelled = false;
    async function checkPassed() {
      const { data } = await supabase
        .from("form_responses")
        .select("id")
        .eq("form_id", formId!)
        .eq("user_id", currentUser!.id)
        .in("grade", ["tot", "xuat_sac"])
        .limit(1);
      if (!cancelled) setGradPassed((data ?? []).length > 0);
    }
    checkPassed();
    return () => {
      cancelled = true;
    };
  }, [currentUser, unlockData]);

  if (!currentUser || loading || !unlockData) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-muted-foreground">Đang tải...</div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="p-6 text-center">
        <p className="text-muted-foreground">Khoá học không tồn tại.</p>
      </div>
    );
  }

  const data = unlockData;
  const lessonsByModule = new Map<string, CourseLessonRow[]>();
  for (const l of data.lessons) {
    const list = lessonsByModule.get(l.module_id) || [];
    list.push(l);
    lessonsByModule.set(l.module_id, list);
  }

  // Cùng định nghĩa "xong bài" với trang danh sách khoá học (lib/api-student)
  const isCompleted = (lessonId: string) => isLessonCompleted(data.progressMap.get(lessonId));

  const completedCount = data.lessons.filter((l) => isCompleted(l.id)).length;
  const totalCount = data.lessons.length;
  const progressPct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
  const currentOpenLessonId = firstOpenLessonId(data);

  // CTA bài tốt nghiệp: mở ngay khi xong chặng video cuối của khoá
  const videoStage = data.stages.find((s) => s.stage_key === "video_hoan_thien");
  const videoStageDone = videoStage
    ? data.stageProgress.some((p) => p.stage_id === videoStage.id && p.completed_at)
    : false;
  const hasGradStage = data.stages.some((s) => s.stage_key === "tot_nghiep");
  const showGraduationCta = !!isEnrolled && hasGradStage && videoStageDone;

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
          {isFree ? (
            <>
              <p className="text-sm text-foreground flex-1">
                Khoá học miễn phí — bấm để bắt đầu học ngay.
              </p>
              <button
                onClick={enrollFree}
                disabled={enrolling}
                className="shrink-0 rounded-md bg-gold px-4 py-2 text-sm font-semibold text-black hover:bg-gold/90 disabled:opacity-60"
              >
                {enrolling ? "Đang mở..." : "Học miễn phí"}
              </button>
            </>
          ) : (
            <p className="text-sm text-foreground">
              Khoá học chưa được mở. Bạn có thể xem danh sách bài học bên dưới nhưng chưa truy cập được nội dung.
            </p>
          )}
        </motion.div>
      )}

      {/* CTA bài tốt nghiệp — hiện sau khi học xong chương video cuối */}
      {showGraduationCta && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
          <Link
            href={`/student/courses/${courseId}/graduation`}
            className="group flex items-center gap-4 rounded-xl border border-gold/40 bg-gold/5 p-4 transition-all hover:border-gold hover:bg-gold/10"
          >
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gold/15">
              {gradPassed ? (
                <Award className="h-6 w-6 text-gold" />
              ) : (
                <GraduationCap className="h-6 w-6 text-gold" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-foreground">
                {gradPassed ? "Bạn đã tốt nghiệp khoá này" : "Bài tốt nghiệp đã mở"}
              </p>
              <p className="text-sm text-muted-foreground">
                {gradPassed
                  ? "Xem lại kết quả và xếp loại của bạn."
                  : "Bạn đã hoàn thành các video của khoá — làm bài để kết thúc lộ trình."}
              </p>
            </div>
            <span className="flex shrink-0 items-center gap-1.5 text-sm font-medium text-gold">
              {gradPassed ? "Xem kết quả" : "Làm bài"}
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </span>
          </Link>
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
                const moduleLessons = lessonsByModule.get(mod.id) || [];
                const modCompleted = moduleLessons.filter((l) => isCompleted(l.id)).length;

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
                          const lp = data.progressMap.get(lesson.id);
                          const status = lp?.status || (lp?.completed ? "completed" : "not_started");
                          const watchCount = lp?.watch_count || 0;
                          const isUnlocked = data.unlock.unlockedLessonIds.has(lesson.id);
                          const isCurrentOpen = lesson.id === currentOpenLessonId;

                          // Chưa enroll: giữ nguyên hành vi cũ (khoá toàn bộ)
                          if (!isEnrolled) {
                            return (
                              <div
                                key={lesson.id}
                                className="flex items-center gap-3 rounded-md px-3 py-2 text-sm text-muted-foreground/60 cursor-not-allowed"
                              >
                                <Lock size={16} className="text-muted-foreground/40 shrink-0" />
                                <span className="flex-1 truncate">{lesson.title}</span>
                                <span className="text-xs whitespace-nowrap">
                                  {formatDuration(lesson.duration_sec)}
                                </span>
                              </div>
                            );
                          }

                          // Khoá video tuần tự: bài khoá hiện tiêu đề + icon khoá + tooltip
                          if (!isUnlocked) {
                            return (
                              <div
                                key={lesson.id}
                                title="Hoàn thành bài trước để mở"
                                className="flex items-center gap-3 rounded-md px-3 py-2 text-sm text-muted-foreground/50 cursor-not-allowed"
                              >
                                <Lock size={16} className="text-muted-foreground/40 shrink-0" />
                                <span className="flex-1 truncate">{lesson.title}</span>
                                <span className="text-xs whitespace-nowrap">
                                  {formatDuration(lesson.duration_sec)}
                                </span>
                              </div>
                            );
                          }

                          const statusIcon =
                            status === "completed" ? (
                              <span className="relative">
                                <CheckCircle2 size={18} className="text-emerald-500" />
                                {watchCount >= 2 && (
                                  <span className="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 rounded-full bg-emerald-500 text-white text-[10px] font-bold flex items-center justify-center px-0.5 leading-none">
                                    {watchCount}
                                  </span>
                                )}
                              </span>
                            ) : status === "in_progress" ? (
                              <PlayCircle size={18} className="text-gold" />
                            ) : (
                              <Circle size={18} className="text-muted-foreground/40" />
                            );

                          return (
                            <Link
                              key={lesson.id}
                              href={`/student/courses/${courseId}/${lesson.id}`}
                              className={cn(
                                "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors hover:bg-gold/5",
                                isCurrentOpen && "bg-gold/10 ring-1 ring-gold/40"
                              )}
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
                              {isCurrentOpen && (
                                <Badge className="bg-gold/20 text-gold text-[10px] px-1.5 py-0">
                                  Học tiếp
                                </Badge>
                              )}
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
