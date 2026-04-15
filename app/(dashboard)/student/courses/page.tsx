"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  BookOpen,
  ChevronRight,
  Clock,
  CheckCircle2,
  Crown,
  Play,
  Sparkles,
  MessageCircle,
  Lock,
  ChevronDown,
} from "lucide-react";
import Link from "next/link";

import { supabase } from "@/lib/supabase";
import { cn, formatPrice, formatDate, formatDuration } from "@/lib/utils";
import { useCurrentUser } from "@/lib/auth";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

interface Course {
  id: string;
  title: string;
  description: string;
  price: number | null;
  price_label: string | null;
  thumbnail_url: string | null;
  badge_label: string | null;
  total_lessons: number;
  total_duration_sec: number;
}

interface Enrollment {
  id: string;
  course_id: string;
  status: string;
  progress_pct: number;
  enrolled_at: string;
  completed_at: string | null;
}

const statusLabels: Record<string, string> = {
  active: "Đang học",
  completed: "Hoàn thành",
  paused: "Tạm dừng",
  dropped: "Đã huỷ",
};

const statusColors: Record<string, string> = {
  active: "bg-gold/20 text-gold",
  completed: "bg-emerald-600/15 text-emerald-700 dark:text-emerald-300",
  paused: "bg-orange-500/15 text-orange-700 dark:text-orange-300",
  dropped: "bg-red-500/15 text-red-700 dark:text-red-300",
};

interface ModuleWithLessons {
  id: string;
  title: string;
  lessons: { id: string; title: string; duration_sec: number }[];
}

/** Component hiển thị modules + lessons cho 1 khoá học (locked) */
function CourseModulePreview({ courseId }: { courseId: string }) {
  const [expandedModule, setExpandedModule] = useState<string | null>(null);
  const [modules, setModules] = useState<ModuleWithLessons[]>([]);

  useEffect(() => {
    async function load() {
      const { data: mods } = await supabase
        .from("modules")
        .select("*")
        .eq("course_id", courseId)
        .order("order_index");
      if (!mods || mods.length === 0) return;

      const moduleIds = mods.map((m: { id: string }) => m.id);
      const { data: lessons } = await supabase
        .from("lessons")
        .select("id, title, duration_sec, module_id")
        .in("module_id", moduleIds)
        .order("order_index");

      const result: ModuleWithLessons[] = mods.map((m: { id: string; title: string }) => ({
        id: m.id,
        title: m.title,
        lessons: (lessons || []).filter((l: { module_id: string }) => l.module_id === m.id),
      }));
      setModules(result);
    }
    load();
  }, [courseId]);

  if (modules.length === 0) return null;

  return (
    <div className="space-y-1.5 mt-3 pt-3 border-t border-border">
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide px-1">
        Nội dung khoá học
      </p>
      {modules.map((mod) => {
        const isExpanded = expandedModule === mod.id;

        return (
          <div key={mod.id}>
            <button
              onClick={() => setExpandedModule(isExpanded ? null : mod.id)}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm hover:bg-gold/5 transition-colors"
            >
              <BookOpen className="h-3.5 w-3.5 text-gold shrink-0" />
              <span className="flex-1 text-left font-medium text-foreground truncate">
                {mod.title}
              </span>
              <span className="text-xs text-muted-foreground shrink-0">
                {mod.lessons.length} bài
              </span>
              <ChevronDown
                className={cn(
                  "h-3.5 w-3.5 text-muted-foreground transition-transform",
                  isExpanded && "rotate-180"
                )}
              />
            </button>

            {isExpanded && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="pl-4 space-y-0.5 overflow-hidden"
              >
                {mod.lessons.map((lesson, i) => (
                  <div
                    key={lesson.id}
                    className="flex items-center gap-2.5 px-3 py-1.5 text-sm text-muted-foreground/60"
                  >
                    <Lock className="h-3 w-3 shrink-0" />
                    <span className="flex-1 truncate">
                      {i + 1}. {lesson.title}
                    </span>
                    <span className="text-[11px] shrink-0">
                      {formatDuration(lesson.duration_sec)}
                    </span>
                  </div>
                ))}
              </motion.div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function StudentCoursesPage() {
  const currentUser = useCurrentUser("student");
  const [courses, setCourses] = useState<Course[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser) return;
    async function load() {
      const [{ data: c }, { data: e }] = await Promise.all([
        supabase.from("courses").select("*").order("created_at"),
        supabase.from("enrollments").select("*").eq("user_id", currentUser!.id),
      ]);
      setCourses((c || []) as Course[]);
      setEnrollments((e || []) as Enrollment[]);
      setLoading(false);
    }
    load();
  }, [currentUser]);

  if (!currentUser || loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-muted-foreground">Đang tải...</div>
      </div>
    );
  }

  const enrolledCourseIds = new Set(enrollments.map((e) => e.course_id));
  const enrolledCourses = courses.filter((c) => enrolledCourseIds.has(c.id));
  const unenrolledCourses = courses.filter((c) => !enrolledCourseIds.has(c.id));

  return (
    <div className="space-y-6 p-6">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <h1 className="text-2xl font-bold gold-gradient-text">Khoá học</h1>
        <p className="text-muted-foreground mt-1">
          Quản lý và theo dõi tiến độ học tập của bạn.
        </p>
      </motion.div>

      {/* ── Khoá học đang học ── */}
      {enrollments.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-gold" />
            Khoá học đang học
          </h2>
          <div className="space-y-3">
            {enrollments.map((enrollment, index) => {
              const course = courses.find((c) => c.id === enrollment.course_id);
              if (!course) return null;

              return (
                <motion.div
                  key={enrollment.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.1 * (index + 1) }}
                >
                  <Link href={`/student/courses/${course.id}`}>
                    <Card className="group hover:border-gold/40 transition-all cursor-pointer">
                      <CardContent className="flex items-center gap-4 py-5">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gold/10">
                          <BookOpen className="h-6 w-6 text-gold" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-foreground group-hover:text-gold transition-colors">
                              {course.title}
                            </h3>
                            <Badge className={cn("text-[10px]", statusColors[enrollment.status])}>
                              {statusLabels[enrollment.status]}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                            {course.description}
                          </p>
                          <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                            {course.total_lessons > 0 && (
                              <span className="flex items-center gap-1">
                                <Play className="h-3 w-3" /> {course.total_lessons} bài học
                              </span>
                            )}
                            {course.total_duration_sec > 0 && (
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" /> {formatDuration(course.total_duration_sec)}
                              </span>
                            )}
                          </div>
                          {enrollment.status !== "dropped" && (
                            <div className="flex items-center gap-3 mt-2">
                              <Progress value={enrollment.progress_pct} className="flex-1" />
                              <span className="text-xs text-gold font-medium w-10 text-right">
                                {Math.round(enrollment.progress_pct)}%
                              </span>
                            </div>
                          )}
                        </div>
                        <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0" />
                      </CardContent>
                    </Card>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Khoá học chưa đăng ký — với module preview ── */}
      {unenrolledCourses.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="space-y-4"
        >
          <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-gold" />
            {enrollments.length > 0 ? "Khoá học khác" : "Khoá học"}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {unenrolledCourses.map((course, i) => (
              <motion.div
                key={course.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 + i * 0.1 }}
              >
                <Card className="h-full hover:border-gold/40 transition-all overflow-hidden flex flex-col">
                  {/* Header */}
                  <div className="relative aspect-[2/1] bg-gradient-to-br from-gold/20 to-card flex items-center justify-center">
                    {course.thumbnail_url ? (
                      <img src={course.thumbnail_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <Crown className="h-12 w-12 text-gold/40" />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                    <div className="absolute bottom-3 left-4">
                      {course.badge_label && (
                        <Badge className="bg-gold/90 text-black font-semibold">
                          {course.badge_label}
                        </Badge>
                      )}
                    </div>
                  </div>

                  <CardContent className="pt-4 space-y-3 flex-1 flex flex-col">
                    <div>
                      <h3 className="text-lg font-bold text-foreground">{course.title}</h3>
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{course.description}</p>
                    </div>

                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      {course.total_lessons > 0 && (
                        <span className="flex items-center gap-1">
                          <Play className="h-3.5 w-3.5" /> {course.total_lessons} bài học
                        </span>
                      )}
                      {course.total_duration_sec > 0 && (
                        <span className="flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5" /> {formatDuration(course.total_duration_sec)}
                        </span>
                      )}
                    </div>

                    {/* Module + Lesson preview */}
                    <div className="flex-1">
                      <CourseModulePreview courseId={course.id} />
                    </div>

                    {/* Price + CTA */}
                    <div className="flex items-center justify-between pt-3 border-t border-border mt-auto">
                      {course.price ? (
                        <p className="text-xl font-bold text-gold">{formatPrice(course.price)}</p>
                      ) : (
                        <p className="text-base font-semibold text-gold">{course.price_label || "Liên hệ"}</p>
                      )}
                      {course.price ? (
                        <Link href={`/student/checkout/${course.id}`}>
                          <Button className="bg-gold hover:bg-gold/90 text-black font-semibold">
                            Đăng ký ngay
                          </Button>
                        </Link>
                      ) : (
                        <Link href="https://m.me/rova" target="_blank">
                          <Button variant="outline" className="border-gold/50 text-gold hover:bg-gold/10">
                            <MessageCircle className="h-4 w-4 mr-1" /> Tư vấn
                          </Button>
                        </Link>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {enrollments.length === 0 && unenrolledCourses.length === 0 && (
        <div className="text-center py-16 text-muted-foreground">
          Chưa có khoá học nào trong hệ thống.
        </div>
      )}
    </div>
  );
}
