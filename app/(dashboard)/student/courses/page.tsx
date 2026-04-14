"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { BookOpen, ChevronRight, Clock, CheckCircle2, Crown, Play, Sparkles, MessageCircle } from "lucide-react";
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
  const unenrolledCourses = courses.filter((c) => !enrolledCourseIds.has(c.id));

  return (
    <div className="space-y-6 p-6">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <h1 className="text-2xl font-bold gold-gradient-text">
          Khoá học
        </h1>
        <p className="text-muted-foreground mt-1">
          Quản lý và theo dõi tiến độ học tập của bạn.
        </p>
      </motion.div>

      {/* Khoá học đang học */}
      {enrollments.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-gold" />
            Khoá học đang học
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                    <Card className="group hover:ring-gold/30 transition-all cursor-pointer">
                      <div className="relative h-40 bg-gradient-to-br from-gold-dark/30 to-gold/10 flex items-center justify-center">
                        {course.thumbnail_url ? (
                          <img src={course.thumbnail_url} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <BookOpen className="h-12 w-12 text-gold/50" />
                        )}
                        <Badge
                          className={cn(
                            "absolute top-3 right-3",
                            statusColors[enrollment.status]
                          )}
                        >
                          {statusLabels[enrollment.status]}
                        </Badge>
                      </div>

                      <CardContent className="space-y-3">
                        <div>
                          <h3 className="font-semibold text-foreground group-hover:text-gold transition-colors">
                            {course.title}
                          </h3>
                          <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                            {course.description}
                          </p>
                        </div>

                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          {course.total_lessons > 0 && (
                            <span className="flex items-center gap-1">
                              <Play className="h-3.5 w-3.5" />
                              {course.total_lessons} bài học
                            </span>
                          )}
                          {course.total_duration_sec > 0 && (
                            <span className="flex items-center gap-1">
                              <Clock className="h-3.5 w-3.5" />
                              {formatDuration(course.total_duration_sec)}
                            </span>
                          )}
                        </div>

                        {enrollment.status !== "dropped" && (
                          <div>
                            <div className="flex items-center justify-between text-xs mb-1">
                              <span className="text-muted-foreground">Tiến độ</span>
                              <span className="text-gold font-medium">
                                {Math.round(enrollment.progress_pct)}%
                              </span>
                            </div>
                            <Progress value={enrollment.progress_pct} />
                          </div>
                        )}

                        {enrollment.status === "completed" && enrollment.completed_at && (
                          <div className="flex items-center gap-1.5 text-xs text-green-500">
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            Hoàn thành {formatDate(enrollment.completed_at)}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      {/* Khoá học chưa đăng ký */}
      {unenrolledCourses.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="space-y-4"
        >
          <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-gold" />
            Khoá học khác
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {unenrolledCourses.map((course, i) => (
              <motion.div
                key={course.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 + i * 0.1 }}
              >
                <Card className="h-full hover:border-gold/40 transition-all overflow-hidden">
                  <div className="relative aspect-[2/1] bg-gradient-to-br from-gold/20 to-card flex items-center justify-center">
                    {course.thumbnail_url ? (
                      <img src={course.thumbnail_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <Crown className="h-12 w-12 text-gold/40" />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                    <div className="absolute bottom-3 left-4">
                      <Badge className="bg-gold/90 text-black font-semibold">
                        {course.id === "c-pro" ? "Best Seller" : "1-on-1"}
                      </Badge>
                    </div>
                  </div>

                  <CardContent className="pt-4 space-y-4">
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

                    <div className="flex items-center justify-between pt-2 border-t border-border">
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

      {/* Chưa có khoá học nào */}
      {enrollments.length === 0 && unenrolledCourses.length === 0 && (
        <div className="text-center py-16 text-muted-foreground">
          Chưa có khoá học nào trong hệ thống.
        </div>
      )}
    </div>
  );
}
