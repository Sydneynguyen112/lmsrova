"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Clock, BookOpen, ArrowRight } from "lucide-react";
import { courses, modules, lessons } from "@/lib/mock-data";
import { formatPrice, formatDuration } from "@/lib/utils";
import { ScrollReveal } from "@/components/shared/ScrollReveal";
import { SectionHeader } from "@/components/shared/SectionHeader";
import { staggerContainer, fadeInUp } from "@/components/shared/ScrollReveal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

function getCourseStats(courseId: string) {
  const courseModules = modules.filter((m) => m.course_id === courseId);
  const courseLessons = courseModules.flatMap((m) =>
    lessons.filter((l) => l.module_id === m.id)
  );
  const totalDuration = courseLessons.reduce((sum, l) => sum + l.duration_sec, 0);
  return { lessonCount: courseLessons.length, totalDuration };
}

export function CoursesSection() {
  return (
    <section className="py-20 md:py-32">
      <div className="mx-auto max-w-7xl px-4 lg:px-8">
        <ScrollReveal>
          <SectionHeader
            title="Khoá học nổi bật"
            subtitle="Chương trình đào tạo bài bản, từ nền tảng đến chuyên sâu"
          />
        </ScrollReveal>

        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          className="grid md:grid-cols-2 gap-6 lg:gap-8"
        >
          {courses.map((course, i) => {
            const stats = getCourseStats(course.id);
            return (
              <motion.div
                key={course.id}
                variants={fadeInUp}
                className="group relative rounded-2xl border border-gold-shadow/30 bg-card overflow-hidden hover:gold-border-glow transition-all duration-300"
              >
                {/* Thumbnail */}
                <div className="aspect-video bg-gradient-to-br from-gold-shadow/50 to-gold-black relative overflow-hidden">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <BookOpen size={48} className="text-gold/30" />
                  </div>
                  {i === 1 && (
                    <Badge className="absolute top-4 right-4 bg-gold text-gold-black font-semibold">
                      BEST VALUE
                    </Badge>
                  )}
                </div>

                {/* Content */}
                <div className="p-6 lg:p-8">
                  <h3 className="text-xl lg:text-2xl font-bold text-foreground mb-3 group-hover:text-gold transition-colors">
                    {course.title}
                  </h3>
                  <p className="text-muted-foreground leading-relaxed mb-6 line-clamp-2">
                    {course.description}
                  </p>

                  {/* Stats */}
                  <div className="flex items-center gap-4 text-sm text-muted-foreground mb-6">
                    <span className="flex items-center gap-1.5">
                      <BookOpen size={14} className="text-gold" />
                      {stats.lessonCount} bài học
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Clock size={14} className="text-gold" />
                      {formatDuration(stats.totalDuration)}
                    </span>
                  </div>

                  {/* Price & CTA */}
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-bold text-gold">
                      {formatPrice(course.price)}
                    </span>
                    <Link href="/courses">
                      <Button
                        variant="outline"
                        className="border-gold/30 text-gold hover:bg-gold/5"
                      >
                        Xem chi tiết
                        <ArrowRight size={16} className="ml-1" />
                      </Button>
                    </Link>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}
