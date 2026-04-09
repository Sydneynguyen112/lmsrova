"use client";

import { motion } from "framer-motion";
import { Star, MessageSquare } from "lucide-react";
import { users, getReviewsByMentor, getAvgRating } from "@/lib/mock-data";
import { formatDate } from "@/lib/utils";
import { useCurrentUser } from "@/lib/auth";
import { PageTransition } from "@/components/shared/PageTransition";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

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
          <CardContent className="pt-4">
            <div className="flex items-center gap-6">
              <div className="text-center">
                <p className="text-4xl font-bold text-gold">{avgRating}</p>
                <StarRating rating={Math.round(avgRating)} />
                <p className="text-xs text-muted-foreground mt-1">
                  {reviews.length} đánh giá
                </p>
              </div>
              <div className="flex-1 space-y-1">
                {[5, 4, 3, 2, 1].map((star) => {
                  const count = reviews.filter(
                    (r) => r.rating === star
                  ).length;
                  const pct =
                    reviews.length > 0
                      ? (count / reviews.length) * 100
                      : 0;

                  return (
                    <div key={star} className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground w-3">
                        {star}
                      </span>
                      <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                      <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                        <div
                          className="h-full bg-yellow-400 rounded-full transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="text-xs text-muted-foreground w-6 text-right">
                        {count}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Reviews list */}
      {reviews.length === 0 ? (
        <motion.div variants={item}>
          <Card>
            <CardContent className="py-12 text-center">
              <MessageSquare className="h-12 w-12 text-muted-foreground/40 mx-auto mb-3" />
              <p className="text-muted-foreground">Chưa có đánh giá nào</p>
            </CardContent>
          </Card>
        </motion.div>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => {
            const student = users.find((u) => u.id === review.student_id);
            const initials = student
              ? student.full_name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .slice(-2)
              : "??";

            return (
              <motion.div key={review.id} variants={item}>
                <Card>
                  <CardContent className="pt-4">
                    <div className="flex items-start gap-4">
                      <Avatar className="h-10 w-10 flex-shrink-0">
                        <AvatarFallback className="bg-gold/20 text-gold text-sm">
                          {initials}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 space-y-2">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                          <p className="font-medium text-foreground">
                            {student?.full_name || "Học viên"}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatDate(review.created_at)}
                          </p>
                        </div>
                        <StarRating rating={review.rating} />
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          {review.feedback}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}
    </motion.div>
    </PageTransition>
  );
}
