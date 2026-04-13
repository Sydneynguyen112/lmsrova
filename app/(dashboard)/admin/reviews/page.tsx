"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Star } from "lucide-react";
import { users, mentorReviews, getAvgRating } from "@/lib/mock-data";
import { formatDate } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { PageTransition } from "@/components/shared/PageTransition";
import { Card, CardContent } from "@/components/ui/card";
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
          className={`h-3.5 w-3.5 ${
            i < rating
              ? "fill-yellow-400 text-yellow-400"
              : "fill-none text-muted-foreground/30"
          }`}
        />
      ))}
    </div>
  );
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export default function AdminReviewsPage() {
  const mentors = users.filter((u) => u.role === "mentor");
  const [selectedMentorId, setSelectedMentorId] = useState<string | null>(null);

  const selectedMentor = mentors.find((m) => m.id === selectedMentorId);
  const filteredReviews = selectedMentorId
    ? [...mentorReviews]
        .filter((r) => r.mentor_id === selectedMentorId)
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    : [];

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
            <span className="gold-gradient-text">Đánh giá Mentor</span>
          </h1>
          <p className="mt-1 text-muted-foreground">
            Chọn mentor để xem đánh giá từ học viên
          </p>
        </motion.div>

        {/* Mentor cards — clickable */}
        <motion.div
          variants={item}
          className="grid grid-cols-1 sm:grid-cols-2 gap-4"
        >
          {mentors.map((mentor) => {
            const avg = getAvgRating(mentor.id);
            const count = mentorReviews.filter(
              (r) => r.mentor_id === mentor.id
            ).length;
            const isSelected = selectedMentorId === mentor.id;

            return (
              <Card
                key={mentor.id}
                className={cn(
                  "cursor-pointer transition-all",
                  isSelected
                    ? "ring-2 ring-gold gold-border-glow"
                    : "hover:border-gold/40"
                )}
                onClick={() =>
                  setSelectedMentorId(isSelected ? null : mentor.id)
                }
              >
                <CardContent className="pt-4">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-12 w-12">
                      <AvatarFallback className="bg-gold/15 text-gold font-semibold">
                        {getInitials(mentor.full_name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="font-semibold text-foreground">
                        {mentor.full_name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {mentor.email}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-3xl font-bold text-gold">{avg}</p>
                      <StarRating rating={Math.round(avg)} />
                      <p className="text-xs text-muted-foreground mt-1">
                        {count} đánh giá
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </motion.div>

        {/* Reviews list for selected mentor */}
        <AnimatePresence mode="wait">
          {selectedMentor && (
            <motion.div
              key={selectedMentor.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.3 }}
              className="space-y-3"
            >
              <h2 className="text-lg font-semibold text-foreground">
                Đánh giá cho{" "}
                <span className="text-gold">{selectedMentor.full_name}</span>
                <span className="text-muted-foreground font-normal text-sm ml-2">
                  ({filteredReviews.length})
                </span>
              </h2>

              {filteredReviews.map((review, i) => {
                const student = users.find(
                  (u) => u.id === review.student_id
                );

                return (
                  <motion.div
                    key={review.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.25, delay: i * 0.05 }}
                  >
                    <Card>
                      <CardContent className="pt-4">
                        <div className="flex items-start gap-4">
                          <Avatar className="h-9 w-9 shrink-0">
                            <AvatarFallback className="bg-gold/15 text-gold text-xs font-semibold">
                              {student
                                ? getInitials(student.full_name)
                                : "?"}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0 space-y-1">
                            <div className="flex items-center justify-between gap-2">
                              <p className="font-medium text-foreground">
                                {student?.full_name ?? "Học viên"}
                              </p>
                              <p className="text-xs text-muted-foreground whitespace-nowrap">
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
            </motion.div>
          )}
        </AnimatePresence>

        {/* Empty state when no mentor selected */}
        {!selectedMentorId && (
          <motion.div variants={item}>
            <Card>
              <CardContent className="py-12 text-center">
                <Star className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-muted-foreground">
                  Chọn một mentor ở trên để xem đánh giá
                </p>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </motion.div>
    </PageTransition>
  );
}
