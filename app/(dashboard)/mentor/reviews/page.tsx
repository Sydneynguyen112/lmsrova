"use client";

import { motion } from "framer-motion";
import { Star } from "lucide-react";
import { getReviewsByMentor, getAvgRating, getReviewsPerDay } from "@/lib/mock-data";
import { useCurrentUser } from "@/lib/auth";
import { PageTransition } from "@/components/shared/PageTransition";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
};

const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={`h-4 w-4 ${
            i < rating
              ? "fill-yellow-400 text-yellow-400"
              : "fill-none text-muted-foreground/40"
          }`}
        />
      ))}
    </div>
  );
}

export default function MentorReviewsPage() {
  const currentUser = useCurrentUser("mentor");

  if (!currentUser) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-muted-foreground">Đang tải...</div>
      </div>
    );
  }

  const reviews = getReviewsByMentor(currentUser.id);
  const avgRating = getAvgRating(currentUser.id);
  const reviewsPerDay = getReviewsPerDay(currentUser.id, 14);
  const maxReviewDay = Math.max(...reviewsPerDay.map((d) => d.count), 1);

  return (
    <PageTransition>
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="space-y-6"
    >
      <motion.div variants={item}>
        <h1 className="text-2xl md:text-3xl font-bold">
          <span className="gold-gradient-text">Đánh giá từ học viên</span>
        </h1>
        <p className="mt-1 text-muted-foreground">
          Những phản hồi từ học viên về quá trình mentoring
        </p>
      </motion.div>

      {/* Summary */}
      <motion.div variants={item}>
        <Card className="gold-border-glow">
          <CardContent className="py-10">
            <div className="flex flex-col items-center text-center gap-3">
              <p className="text-6xl font-bold text-gold">{avgRating}</p>
              <StarRating rating={Math.round(avgRating)} />
              <p className="text-muted-foreground">
                {reviews.length} đánh giá từ học viên
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Reviews per day bar chart */}
      <motion.div variants={item}>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Đánh giá mỗi ngày</CardTitle>
            <p className="text-sm text-muted-foreground">14 ngày gần nhất</p>
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-2" style={{ height: 200 }}>
              {reviewsPerDay.map((day) => {
                const hasReview = day.count > 0;
                const barHeight = hasReview
                  ? Math.max((day.count / maxReviewDay) * 160, 24)
                  : 6;
                const dayLabel = new Date(day.date + "T00:00:00").toLocaleDateString("vi-VN", {
                  day: "2-digit",
                  month: "2-digit",
                });

                return (
                  <div
                    key={day.date}
                    className="flex-1 flex flex-col items-center justify-end h-full"
                  >
                    {hasReview && (
                      <span className="text-xs font-semibold text-foreground mb-1">
                        {day.count}
                      </span>
                    )}
                    <div
                      className="w-full max-w-10 rounded-t-md"
                      style={{
                        height: barHeight,
                        backgroundColor: hasReview
                          ? "var(--primary)"
                          : "var(--border)",
                      }}
                    />
                    <span className="text-[10px] text-muted-foreground mt-2 leading-none">
                      {dayLabel}
                    </span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
    </PageTransition>
  );
}
