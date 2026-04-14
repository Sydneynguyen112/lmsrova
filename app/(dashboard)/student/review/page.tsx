"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Star, Send, CheckCircle2 } from "lucide-react";
import { users, getReviewsByMentor } from "@/lib/mock-data";
import { formatDate } from "@/lib/utils";
import { supabase } from "@/lib/supabase";
import { useCurrentUser } from "@/lib/auth";
import { PageTransition } from "@/components/shared/PageTransition";
import { LockedFeature } from "@/components/shared/LockedFeature";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
};

const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

export default function StudentReviewPage() {
  const currentUser = useCurrentUser("student");
  const [rating, setRating] = useState(0);
  const [hoveredStar, setHoveredStar] = useState(0);
  const [feedback, setFeedback] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [hasEnrollment, setHasEnrollment] = useState<boolean | null>(null);

  useEffect(() => {
    if (!currentUser) return;
    async function check() {
      const { data } = await supabase
        .from("enrollments")
        .select("id")
        .eq("user_id", currentUser!.id)
        .limit(1);
      setHasEnrollment((data ?? []).length > 0);
    }
    check();
  }, [currentUser]);

  if (!currentUser || hasEnrollment === null) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-muted-foreground">Đang tải...</div>
      </div>
    );
  }

  if (!hasEnrollment) {
    return (
      <LockedFeature
        title="Đánh giá Mentor"
        description="Tính năng đánh giá mentor sẽ được mở khi bạn đăng ký khoá học."
      />
    );
  }

  const mentor = users.find((u) => u.id === currentUser.mentor_id);
  const mentorInitials = mentor
    ? mentor.full_name.split(" ").map((n) => n[0]).join("").slice(-2)
    : "?";

  // Check if student already reviewed this mentor
  const existingReviews = mentor
    ? getReviewsByMentor(mentor.id).filter((r) => r.student_id === currentUser.id)
    : [];
  const hasReviewed = existingReviews.length > 0;
  const lastReview = hasReviewed ? existingReviews[existingReviews.length - 1] : null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0 || !feedback.trim()) return;
    console.log("Submit review:", {
      mentor_id: mentor?.id,
      student_id: currentUser.id,
      rating,
      feedback,
    });
    setSubmitted(true);
  };

  const ratingLabels = ["", "Rất không hài lòng", "Không hài lòng", "Bình thường", "Hài lòng", "Rất hài lòng"];

  return (
    <PageTransition>
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="space-y-6 max-w-2xl"
      >
        <motion.div variants={item}>
          <h1 className="text-2xl md:text-3xl font-bold">
            <span className="gold-gradient-text">Đánh giá Mentor</span>
          </h1>
          <p className="mt-1 text-muted-foreground">
            Chia sẻ trải nghiệm học tập với mentor của bạn
          </p>
        </motion.div>

        {/* Mentor info */}
        {mentor && (
          <motion.div variants={item}>
            <Card>
              <CardContent className="pt-5">
                <div className="flex items-center gap-4">
                  <Avatar className="h-14 w-14">
                    <AvatarFallback className="bg-gold/15 text-gold font-semibold text-lg">
                      {mentorInitials}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">
                      Mentor của bạn
                    </p>
                    <p className="text-lg font-semibold text-foreground">
                      {mentor.full_name}
                    </p>
                    <p className="text-sm text-muted-foreground">{mentor.email}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Previous review */}
        {hasReviewed && lastReview && !submitted && (
          <motion.div variants={item}>
            <Card className="border-gold/20">
              <CardContent className="pt-5 space-y-3">
                <p className="text-sm font-medium text-foreground">
                  Đánh giá trước đó của bạn
                </p>
                <div className="flex items-center gap-0.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={`h-4 w-4 ${
                        i < lastReview.rating
                          ? "fill-yellow-400 text-yellow-400"
                          : "fill-none text-muted-foreground/30"
                      }`}
                    />
                  ))}
                  <span className="text-sm text-muted-foreground ml-2">
                    {formatDate(lastReview.created_at)}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground italic">
                  &ldquo;{lastReview.feedback}&rdquo;
                </p>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Review form or success */}
        <motion.div variants={item}>
          {submitted ? (
            <Card className="gold-border-glow">
              <CardContent className="py-10 text-center space-y-3">
                <CheckCircle2 className="h-12 w-12 text-emerald-500 mx-auto" />
                <h2 className="text-lg font-semibold text-foreground">
                  Cảm ơn bạn đã đánh giá!
                </h2>
                <p className="text-sm text-muted-foreground">
                  Phản hồi của bạn giúp mentor cải thiện chất lượng mentoring.
                </p>
                <Button
                  variant="outline"
                  onClick={() => {
                    setSubmitted(false);
                    setRating(0);
                    setFeedback("");
                  }}
                  className="mt-2"
                >
                  Viết đánh giá mới
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Card className="gold-border-glow">
              <CardContent className="pt-5">
                <form onSubmit={handleSubmit} className="space-y-5">
                  {/* Star rating */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">
                      {hasReviewed ? "Cập nhật đánh giá" : "Đánh giá mentor"}
                    </label>
                    <div className="flex items-center gap-1">
                      {Array.from({ length: 5 }).map((_, i) => {
                        const starValue = i + 1;
                        const isActive = starValue <= (hoveredStar || rating);
                        return (
                          <button
                            key={i}
                            type="button"
                            onMouseEnter={() => setHoveredStar(starValue)}
                            onMouseLeave={() => setHoveredStar(0)}
                            onClick={() => setRating(starValue)}
                            className="p-1 transition-transform hover:scale-110"
                          >
                            <Star
                              className={`h-8 w-8 transition-colors ${
                                isActive
                                  ? "fill-yellow-400 text-yellow-400"
                                  : "fill-none text-muted-foreground/30"
                              }`}
                            />
                          </button>
                        );
                      })}
                      {(hoveredStar || rating) > 0 && (
                        <span className="text-sm text-gold ml-3 font-medium">
                          {ratingLabels[hoveredStar || rating]}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Feedback text */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">
                      Nhận xét & nhắn gửi tới Mentor
                    </label>
                    <textarea
                      placeholder="Chia sẻ trải nghiệm học tập, điều bạn thích, góp ý cải thiện..."
                      value={feedback}
                      onChange={(e) => setFeedback(e.target.value)}
                      rows={5}
                      required
                      className="w-full rounded-lg border border-border bg-card p-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-gold/50 resize-y"
                    />
                  </div>

                  {/* Submit */}
                  <Button
                    type="submit"
                    disabled={rating === 0 || !feedback.trim()}
                    className="w-full bg-gold hover:bg-gold/90 text-black font-semibold py-5"
                  >
                    <Send className="h-4 w-4 mr-2" />
                    {hasReviewed ? "Gửi đánh giá mới" : "Gửi đánh giá"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          )}
        </motion.div>
      </motion.div>
    </PageTransition>
  );
}
