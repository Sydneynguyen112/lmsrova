"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import {
  courses,
  modules,
  lessons,
  enrollments,
  getModulesByCourse,
  getLessonsByModule,
} from "@/lib/mock-data";
import { cn, formatPrice, formatDuration } from "@/lib/utils";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { PageTransition } from "@/components/shared/PageTransition";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.12, duration: 0.45, ease: "easeOut" as const },
  }),
};

interface CourseStats {
  id: string;
  title: string;
  description: string;
  price: number | string;
  enrollmentCount: number;
  totalLessons: number;
  totalDurationSec: number;
  moduleCount: number;
}

export default function AdminCoursesPage() {
  const courseStats: CourseStats[] = useMemo(() => {
    return courses.map((course) => {
      const courseModules = getModulesByCourse(course.id);
      const courseLessons = courseModules.flatMap((m) =>
        getLessonsByModule(m.id)
      );
      const enrollmentCount = enrollments.filter(
        (e) => e.course_id === course.id
      ).length;
      const totalDurationSec = courseLessons.reduce(
        (sum, l) => sum + l.duration_sec,
        0
      );

      return {
        id: course.id,
        title: course.title,
        description: course.description,
        price: course.price,
        enrollmentCount,
        totalLessons: courseLessons.length,
        totalDurationSec,
        moduleCount: courseModules.length,
      };
    });
  }, []);

  return (
    <PageTransition>
    <div className="space-y-8">
      {/* Page Title */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <h1 className="text-2xl font-bold gold-gradient-text">
          Quản lý Khoá học
        </h1>
        <p className="text-muted-foreground mt-1">
          Tổng quan các khoá học trên hệ thống ROVA
        </p>
      </motion.div>

      {/* Course Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {courseStats.map((course, i) => (
          <motion.div
            key={course.id}
            custom={i}
            variants={fadeUp}
            initial="hidden"
            animate="visible"
          >
            <Card className="gold-border-glow h-full">
              <CardHeader>
                <CardTitle className="text-lg text-gold">
                  {course.title}
                </CardTitle>
                <CardDescription className="line-clamp-2">
                  {course.description}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Price */}
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground text-sm">
                      Giá khoá học
                    </span>
                    <span className="text-xl font-bold gold-gradient-text">
                      {formatPrice(course.price)}
                    </span>
                  </div>

                  <Separator />

                  {/* Stats Grid */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">
                        Số đăng ký
                      </p>
                      <p className="text-lg font-semibold text-foreground">
                        {course.enrollmentCount}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">
                        Tổng bài học
                      </p>
                      <p className="text-lg font-semibold text-foreground">
                        {course.totalLessons}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">
                        Số modules
                      </p>
                      <p className="text-lg font-semibold text-foreground">
                        {course.moduleCount}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">
                        Tổng thời lượng
                      </p>
                      <p className="text-lg font-semibold text-foreground">
                        {formatDuration(course.totalDurationSec)}
                      </p>
                    </div>
                  </div>

                  <Separator />

                  {/* Tags */}
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="default">{course.id}</Badge>
                    <Badge variant="secondary">
                      {course.moduleCount} module
                      {course.moduleCount > 1 ? "s" : ""}
                    </Badge>
                    <Badge variant="outline">
                      {course.totalLessons} video
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
    </PageTransition>
  );
}
