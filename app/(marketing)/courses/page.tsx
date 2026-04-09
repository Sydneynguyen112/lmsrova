"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Search, Clock, BookOpen, ArrowRight } from "lucide-react";
import { courses, modules, lessons } from "@/lib/mock-data";
import { formatPrice, formatDuration } from "@/lib/utils";
import { ScrollReveal } from "@/components/shared/ScrollReveal";
import { staggerContainer, fadeInUp } from "@/components/shared/ScrollReveal";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";

function getCourseStats(courseId: string) {
  const courseModules = modules.filter((m) => m.course_id === courseId);
  const courseLessons = courseModules.flatMap((m) =>
    lessons.filter((l) => l.module_id === m.id)
  );
  const totalDuration = courseLessons.reduce(
    (sum, l) => sum + l.duration_sec,
    0
  );
  return {
    lessonCount: courseLessons.length,
    moduleCount: courseModules.length,
    totalDuration,
  };
}

export default function CoursesPage() {
  const [search, setSearch] = useState("");

  const filtered = courses.filter((c) =>
    c.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      {/* Hero */}
      <section className="py-20 md:py-28 relative">
        <div className="absolute inset-0 gold-gradient-radial" />
        <div className="relative mx-auto max-w-7xl px-4 lg:px-8 text-center">
          <ScrollReveal>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold">
              <span className="gold-gradient-text">Khám phá Khoá học</span>
            </h1>
            <p className="mt-4 text-lg text-muted-foreground max-w-xl mx-auto">
              Chương trình đào tạo Trading bài bản, từ cơ bản đến nâng cao
            </p>
          </ScrollReveal>

          {/* Search */}
          <ScrollReveal delay={0.2}>
            <div className="mt-8 max-w-md mx-auto relative">
              <Search
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              />
              <Input
                placeholder="Tìm kiếm khoá học..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 bg-card border-gold-shadow/30 focus:border-gold/50"
              />
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* Course Grid */}
      <section className="pb-20 md:pb-32">
        <div className="mx-auto max-w-7xl px-4 lg:px-8">
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            className="grid md:grid-cols-2 gap-6 lg:gap-8"
          >
            {filtered.map((course, i) => {
              const stats = getCourseStats(course.id);
              return (
                <motion.div
                  key={course.id}
                  variants={fadeInUp}
                  className="group rounded-2xl border border-gold-shadow/30 bg-card overflow-hidden hover:gold-border-glow transition-all duration-300"
                >
                  {/* Thumbnail */}
                  <div className="aspect-video bg-gradient-to-br from-gold-shadow/50 to-gold-black relative">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <BookOpen size={48} className="text-gold/30" />
                    </div>
                    {i === 1 && (
                      <Badge className="absolute top-4 right-4 bg-gold text-gold-black font-semibold">
                        BEST VALUE
                      </Badge>
                    )}
                  </div>

                  <div className="p-6 lg:p-8">
                    <h2 className="text-2xl font-bold text-foreground mb-3 group-hover:text-gold transition-colors">
                      {course.title}
                    </h2>
                    <p className="text-muted-foreground leading-relaxed mb-6">
                      {course.description}
                    </p>

                    {/* Stats row */}
                    <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-6">
                      <span className="flex items-center gap-1.5">
                        <BookOpen size={14} className="text-gold" />
                        {stats.moduleCount} module &middot; {stats.lessonCount}{" "}
                        bài học
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Clock size={14} className="text-gold" />
                        {formatDuration(stats.totalDuration)}
                      </span>
                    </div>

                    {/* Price & CTA */}
                    <div className="flex items-center justify-between pt-4 border-t border-gold-shadow/30">
                      <span className="text-2xl font-bold text-gold">
                        {formatPrice(course.price)}
                      </span>
                      <Link href="/register">
                        <Button className="bg-gold hover:bg-gold-medium text-gold-black font-semibold">
                          Đăng ký ngay
                          <ArrowRight size={16} className="ml-1" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>

          {filtered.length === 0 && (
            <div className="text-center py-20 text-muted-foreground">
              Không tìm thấy khoá học phù hợp
            </div>
          )}
        </div>
      </section>
    </>
  );
}
