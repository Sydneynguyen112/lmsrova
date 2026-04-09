"use client";

import { motion } from "framer-motion";
import { BookOpen, ChevronRight, Clock, CheckCircle2 } from "lucide-react";
import Link from "next/link";

import {
  getEnrollmentsByUser,
  getCourseById,
  getModulesByCourse,
  getLessonsByModule,
} from "@/lib/mock-data";
import { cn, formatPrice, formatDate } from "@/lib/utils";
import { useCurrentUser } from "@/lib/auth";
import { EmptyState } from "@/components/shared/EmptyState";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

const statusLabels: Record<string, string> = {
  active: "Đang học",
  completed: "Hoàn thành",
  paused: "Tạm dừng",
  dropped: "Đã huỷ",
};

const statusColors: Record<string, string> = {
  active: "bg-gold/20 text-gold",
  completed: "bg-green-600 text-white",
  paused: "bg-yellow-600/20 text-yellow-500",
  dropped: "bg-red-600/20 text-red-400",
};

export default function StudentCoursesPage() {
  const currentUser = useCurrentUser("student");

  if (!currentUser) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-muted-foreground">Đang tải...</div>
      </div>
    );
  }

  const enrollments = getEnrollmentsByUser(currentUser.id);

  return (
    <div className="space-y-6 p-6">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <h1 className="text-2xl font-bold gold-gradient-text">
          Khoá học của tôi
        </h1>
        <p className="text-muted-foreground mt-1">
          Quản lý và theo dõi tiến độ học tập của bạn.
        </p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {enrollments.map((enrollment, index) => {
          const course = getCourseById(enrollment.course_id);
          if (!course) return null;

          const courseModules = getModulesByCourse(course.id);
          const totalLessons = courseModules.reduce(
            (acc, mod) => acc + getLessonsByModule(mod.id).length,
            0
          );

          return (
            <motion.div
              key={enrollment.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 * (index + 1) }}
            >
              <Link href={`/student/courses/${course.id}`}>
                <Card className="group hover:ring-gold/30 transition-all cursor-pointer">
                  {/* Thumbnail placeholder */}
                  <div className="relative h-40 bg-gradient-to-br from-gold-dark/30 to-gold/10 flex items-center justify-center">
                    <BookOpen className="h-12 w-12 text-gold/50" />
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
                      <span className="flex items-center gap-1">
                        <BookOpen className="h-3.5 w-3.5" />
                        {totalLessons} bài học
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" />
                        {formatDate(enrollment.enrolled_at)}
                      </span>
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

                    {enrollment.status === "completed" && (
                      <div className="flex items-center gap-1.5 text-xs text-green-500">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Hoàn thành {enrollment.completed_at ? formatDate(enrollment.completed_at) : ""}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </Link>
            </motion.div>
          );
        })}
      </div>

      {enrollments.length === 0 && (
        <EmptyState variant="courses" description="Hãy đăng ký khoá học để bắt đầu hành trình Trading" />
      )}
    </div>
  );
}
