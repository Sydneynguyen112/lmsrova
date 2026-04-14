"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  BookOpen,
  CheckCircle2,
  FileText,
  ChevronRight,
  Play,
  Crown,
  Users,
  Clock,
  Sparkles,
  MessageCircle,
} from "lucide-react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { cn, formatPrice, formatDuration } from "@/lib/utils";
import { useCurrentUser } from "@/lib/auth";
import { PageTransition } from "@/components/shared/PageTransition";
import { LockedFeature } from "@/components/shared/LockedFeature";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
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
}

export default function StudentDashboardPage() {
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

  const activeEnrollments = enrollments.filter((e) => e.status === "active" || e.status === "completed");
  const enrolledCourseIds = new Set(enrollments.map((e) => e.course_id));
  const unenrolledCourses = courses.filter((c) => !enrolledCourseIds.has(c.id));
  const hasEnrollments = activeEnrollments.length > 0;

  if (!hasEnrollments) {
    return (
      <LockedFeature
        title="Dashboard"
        description="Dashboard học tập sẽ được mở khi bạn đăng ký khoá học."
      />
    );
  }

  return (
    <PageTransition>
      <div className="space-y-6 p-6">
        {/* Welcome */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-2xl font-bold">
            Xin chào,{" "}
            <span className="gold-gradient-text">{currentUser.full_name}</span>!
          </h1>
          <p className="text-muted-foreground mt-1">
            Tiếp tục hành trình trading của bạn.
          </p>
        </motion.div>

        {/* ═══ NOT ENROLLED: Show available courses ═══ */}
        {false && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="space-y-4"
          >
            <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-gold" />
              Khoá học dành cho bạn
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {courses.map((course, i) => (
                <motion.div
                  key={course.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 + i * 0.1 }}
                >
                  <Card className="h-full hover:border-gold/40 transition-all overflow-hidden">
                    {/* Thumbnail */}
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
                        <h3 className="text-lg font-bold text-foreground">
                          {course.title}
                        </h3>
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                          {course.description}
                        </p>
                      </div>

                      {/* Stats */}
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

                      {/* Price + CTA */}
                      <div className="flex items-center justify-between pt-2 border-t border-border">
                        <div>
                          {course.price ? (
                            <p className="text-xl font-bold text-gold">
                              {formatPrice(course.price)}
                            </p>
                          ) : (
                            <p className="text-base font-semibold text-gold">
                              {course.price_label || "Liên hệ"}
                            </p>
                          )}
                        </div>
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

        {/* ═══ ENROLLED: Normal dashboard ═══ */}
        {hasEnrollments && (
          <>
            {/* Stats Row */}
            <motion.div
              className="grid grid-cols-1 sm:grid-cols-3 gap-4"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
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
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10">
                    <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">
                      {Math.round(activeEnrollments.reduce((s, e) => s + e.progress_pct, 0) / activeEnrollments.length || 0)}%
                    </p>
                    <p className="text-xs text-muted-foreground">Tiến độ trung bình</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="flex items-center gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-500/10">
                    <FileText className="h-5 w-5 text-blue-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{activeEnrollments.length}</p>
                    <p className="text-xs text-muted-foreground">Khoá đã đăng ký</p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Active courses */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="text-gold">Khoá học đang học</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {activeEnrollments.map((enrollment) => {
                    const course = courses.find((c) => c.id === enrollment.course_id);
                    if (!course) return null;
                    return (
                      <Link
                        key={enrollment.id}
                        href={`/student/courses/${course.id}`}
                        className="block rounded-lg border border-border p-4 hover:bg-gold/5 transition-colors"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <p className="font-medium text-foreground">{course.title}</p>
                          <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div className="flex items-center gap-3">
                          <Progress value={enrollment.progress_pct} className="flex-1" />
                          <span className="text-xs text-muted-foreground w-10 text-right">
                            {Math.round(enrollment.progress_pct)}%
                          </span>
                        </div>
                      </Link>
                    );
                  })}
                </CardContent>
              </Card>
            </motion.div>

            {/* Unenrolled courses — teaser */}
            {unenrolledCourses.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <Card>
                  <CardHeader>
                    <CardTitle className="text-gold flex items-center gap-2">
                      <Sparkles className="h-5 w-5" /> Khoá học khác
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {unenrolledCourses.map((course) => (
                      <div
                        key={course.id}
                        className="flex items-center justify-between rounded-lg border border-border p-4"
                      >
                        <div>
                          <p className="font-medium text-foreground">{course.title}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">{course.description}</p>
                        </div>
                        <div className="text-right shrink-0 ml-4">
                          <p className="text-lg font-bold text-gold">
                            {course.price ? formatPrice(course.price) : course.price_label}
                          </p>
                          {course.price ? (
                            <Link href={`/student/checkout/${course.id}`}>
                              <Button size="sm" className="mt-1 bg-gold hover:bg-gold/90 text-black text-xs">
                                Đăng ký
                              </Button>
                            </Link>
                          ) : (
                            <Button size="sm" variant="outline" className="mt-1 border-gold/50 text-gold text-xs">
                              Tư vấn
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </>
        )}
      </div>
    </PageTransition>
  );
}
