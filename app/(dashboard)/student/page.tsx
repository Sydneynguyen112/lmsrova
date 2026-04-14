"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  BookOpen,
  CheckCircle2,
  FileText,
  ChevronRight,
  Sparkles,
  MessageCircle,
  Send,
  Star,
  XCircle,
  Clock,
  Quote,
} from "lucide-react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { cn, formatPrice } from "@/lib/utils";
import { useCurrentUser } from "@/lib/auth";
import { users, getSubmissionsByUser, getReviewsByMentor } from "@/lib/mock-data";
import { PageTransition } from "@/components/shared/PageTransition";
import { LockedFeature } from "@/components/shared/LockedFeature";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

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

// ── Quotes động lực ──
const quotes = [
  { text: "Kỷ luật là cầu nối giữa mục tiêu và thành quả.", author: "Jim Rohn" },
  { text: "Thị trường không thưởng cho sự cố gắng, mà thưởng cho sự kiên nhẫn.", author: "Jesse Livermore" },
  { text: "Thành công trong trading đến từ việc quản lý rủi ro, không phải tìm kiếm lợi nhuận.", author: "Paul Tudor Jones" },
  { text: "Đừng tìm kim ở đáy biển. Hãy chờ nó trôi vào bờ.", author: "Mark Minervini" },
  { text: "Trader giỏi không phải người đúng nhiều nhất, mà là người thua ít nhất.", author: "George Soros" },
  { text: "Kế hoạch giao dịch là la bàn, cảm xúc là bão — hãy giữ chặt la bàn.", author: "ROVA" },
  { text: "Mỗi lệnh thua là một bài học, nếu bạn chịu mở mắt nhìn.", author: "ROVA" },
  { text: "Sự kiên nhẫn không phải là khả năng chờ đợi, mà là cách bạn hành xử trong khi chờ.", author: "Joyce Meyer" },
  { text: "Khi bạn cảm thấy muốn bỏ cuộc, hãy nhớ lý do bạn bắt đầu.", author: "Unknown" },
  { text: "Thị trường luôn đúng. Nhiệm vụ của trader là lắng nghe.", author: "Ed Seykota" },
  { text: "Đơn giản hoá hệ thống, phức tạp hoá kỷ luật.", author: "ROVA" },
  { text: "Không có phương pháp hoàn hảo, chỉ có phương pháp phù hợp với bạn.", author: "ROVA" },
];

function getDailyQuote() {
  const today = new Date();
  const dayOfYear = Math.floor(
    (today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / 86400000
  );
  return quotes[dayOfYear % quotes.length];
}

export default function StudentDashboardPage() {
  const currentUser = useCurrentUser("student");
  const [courses, setCourses] = useState<Course[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(true);

  // Mentor review state
  const [rating, setRating] = useState(0);
  const [hoveredStar, setHoveredStar] = useState(0);
  const [feedback, setFeedback] = useState("");
  const [reviewSubmitted, setReviewSubmitted] = useState(false);

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

  // ── Submissions stats ──
  const mySubmissions = getSubmissionsByUser(currentUser.id);
  const totalSubmitted = mySubmissions.length;
  const gradedSubmissions = mySubmissions.filter((s) => s.graded_at);
  const totalGraded = gradedSubmissions.length;
  const pendingSubmissions = totalSubmitted - totalGraded;
  // "Đúng" = graded + có annotated_image_urls (mentor confirmed), "Sai" = graded + có feedback sửa
  const correctCount = gradedSubmissions.filter((s) => s.annotated_image_urls && s.annotated_image_urls.length > 0).length;
  const incorrectCount = totalGraded - correctCount;

  // ── Mentor info ──
  const mentor = users.find((u) => u.id === currentUser.mentor_id);
  const mentorInitials = mentor
    ? mentor.full_name.split(" ").map((n: string) => n[0]).join("").slice(-2)
    : "";

  // Existing reviews
  const existingReviews = mentor
    ? getReviewsByMentor(mentor.id).filter((r) => r.student_id === currentUser.id)
    : [];
  const hasReviewed = existingReviews.length > 0;
  const lastReview = hasReviewed ? existingReviews[existingReviews.length - 1] : null;

  const handleReviewSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0 || !feedback.trim()) return;
    setReviewSubmitted(true);
  };

  const ratingLabels = ["", "Rất không hài lòng", "Không hài lòng", "Bình thường", "Hài lòng", "Rất hài lòng"];
  const dailyQuote = getDailyQuote();

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

        {/* ── Daily Quote ── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
        >
          <Card className="border-gold/20 bg-gradient-to-r from-gold/5 to-transparent">
            <CardContent className="flex items-start gap-4 py-5">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gold/10">
                <Quote className="h-5 w-5 text-gold" />
              </div>
              <div>
                <p className="text-sm text-foreground italic leading-relaxed">
                  &ldquo;{dailyQuote.text}&rdquo;
                </p>
                <p className="text-xs text-gold font-medium mt-1.5">
                  — {dailyQuote.author}
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* ── Stats Row: Courses + Submissions ── */}
        <motion.div
          className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card>
            <CardContent className="py-4 text-center">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gold/10 mx-auto">
                <BookOpen className="h-4 w-4 text-gold" />
              </div>
              <p className="text-2xl font-bold mt-2">{activeEnrollments.length}</p>
              <p className="text-[11px] text-muted-foreground">Khoá đang học</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="py-4 text-center">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/10 mx-auto">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              </div>
              <p className="text-2xl font-bold mt-2">
                {Math.round(activeEnrollments.reduce((s, e) => s + e.progress_pct, 0) / activeEnrollments.length || 0)}%
              </p>
              <p className="text-[11px] text-muted-foreground">Tiến độ</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="py-4 text-center">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-500/10 mx-auto">
                <FileText className="h-4 w-4 text-blue-500" />
              </div>
              <p className="text-2xl font-bold mt-2">{totalSubmitted}</p>
              <p className="text-[11px] text-muted-foreground">Bài đã nộp</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="py-4 text-center">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-500/10 mx-auto">
                <Clock className="h-4 w-4 text-amber-500" />
              </div>
              <p className="text-2xl font-bold mt-2">{pendingSubmissions}</p>
              <p className="text-[11px] text-muted-foreground">Chờ chấm</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="py-4 text-center">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/10 mx-auto">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              </div>
              <p className="text-2xl font-bold mt-2 text-emerald-600 dark:text-emerald-400">{correctCount}</p>
              <p className="text-[11px] text-muted-foreground">Bài đúng</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="py-4 text-center">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-red-500/10 mx-auto">
                <XCircle className="h-4 w-4 text-red-500" />
              </div>
              <p className="text-2xl font-bold mt-2 text-red-600 dark:text-red-400">{incorrectCount}</p>
              <p className="text-[11px] text-muted-foreground">Cần sửa</p>
            </CardContent>
          </Card>
        </motion.div>

        {/* ── Active courses — full width ── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-3"
        >
          <h2 className="text-lg font-semibold text-gold flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Khoá học đang học
          </h2>
          {activeEnrollments.map((enrollment) => {
            const course = courses.find((c) => c.id === enrollment.course_id);
            if (!course) return null;
            return (
              <Link
                key={enrollment.id}
                href={`/student/courses/${course.id}`}
                className="block"
              >
                <Card className="hover:border-gold/40 transition-all">
                  <CardContent className="flex items-center gap-4 py-5">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gold/10">
                      <BookOpen className="h-6 w-6 text-gold" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-foreground">{course.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{course.description}</p>
                      <div className="flex items-center gap-3 mt-2">
                        <Progress value={enrollment.progress_pct} className="flex-1" />
                        <span className="text-xs text-gold font-medium w-10 text-right">
                          {Math.round(enrollment.progress_pct)}%
                        </span>
                      </div>
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0" />
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </motion.div>

        {/* ── Mentor Review Section ── */}
        {mentor && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="space-y-3"
          >
            <h2 className="text-lg font-semibold text-gold flex items-center gap-2">
              <Star className="h-5 w-5" />
              Đánh giá Mentor
            </h2>

            <Card>
              <CardContent className="space-y-5">
                {/* Mentor info */}
                <div className="flex items-center gap-4">
                  <Avatar className="h-12 w-12">
                    {mentor.avatar_url && <AvatarImage src={mentor.avatar_url} />}
                    <AvatarFallback className="bg-gold/15 text-gold font-semibold">
                      {mentorInitials}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">
                      Mentor của bạn
                    </p>
                    <p className="font-semibold text-foreground">{mentor.full_name}</p>
                  </div>
                </div>

                {/* Previous review */}
                {hasReviewed && lastReview && !reviewSubmitted && (
                  <div className="rounded-lg border border-border p-3 space-y-2">
                    <p className="text-xs font-medium text-muted-foreground">Đánh giá trước đó</p>
                    <div className="flex items-center gap-0.5">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={cn("h-4 w-4", i < lastReview.rating
                            ? "fill-yellow-400 text-yellow-400"
                            : "fill-none text-muted-foreground/30"
                          )}
                        />
                      ))}
                    </div>
                    <p className="text-sm text-muted-foreground italic">
                      &ldquo;{lastReview.feedback}&rdquo;
                    </p>
                  </div>
                )}

                {/* Review form or success */}
                {reviewSubmitted ? (
                  <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/30 p-4 text-center space-y-2">
                    <CheckCircle2 className="h-8 w-8 text-emerald-500 mx-auto" />
                    <p className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
                      Cảm ơn bạn đã đánh giá!
                    </p>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => { setReviewSubmitted(false); setRating(0); setFeedback(""); }}
                    >
                      Viết đánh giá mới
                    </Button>
                  </div>
                ) : (
                  <form onSubmit={handleReviewSubmit} className="space-y-4">
                    {/* Stars */}
                    <div>
                      <p className="text-sm font-medium text-foreground mb-2">
                        {hasReviewed ? "Cập nhật đánh giá" : "Đánh giá mentor"}
                      </p>
                      <div className="flex items-center gap-0.5">
                        {Array.from({ length: 5 }).map((_, i) => {
                          const val = i + 1;
                          const isActive = val <= (hoveredStar || rating);
                          return (
                            <button
                              key={i}
                              type="button"
                              onMouseEnter={() => setHoveredStar(val)}
                              onMouseLeave={() => setHoveredStar(0)}
                              onClick={() => setRating(val)}
                              className="p-0.5 transition-transform hover:scale-110"
                            >
                              <Star
                                className={cn("h-7 w-7 transition-colors", isActive
                                  ? "fill-yellow-400 text-yellow-400"
                                  : "fill-none text-muted-foreground/30"
                                )}
                              />
                            </button>
                          );
                        })}
                        {(hoveredStar || rating) > 0 && (
                          <span className="text-xs text-gold ml-2 font-medium">
                            {ratingLabels[hoveredStar || rating]}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Feedback */}
                    <textarea
                      placeholder="Chia sẻ trải nghiệm học tập, điều bạn thích, góp ý cải thiện..."
                      value={feedback}
                      onChange={(e) => setFeedback(e.target.value)}
                      rows={3}
                      required
                      className="w-full rounded-lg border border-border bg-card p-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-gold/50 resize-none"
                    />

                    <Button
                      type="submit"
                      disabled={rating === 0 || !feedback.trim()}
                      className="bg-gold hover:bg-gold/90 text-black font-semibold"
                    >
                      <Send className="h-4 w-4 mr-2" />
                      {hasReviewed ? "Gửi đánh giá mới" : "Gửi đánh giá"}
                    </Button>
                  </form>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* ── Unenrolled courses — 2 columns ── */}
        {unenrolledCourses.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="space-y-3"
          >
            <h2 className="text-lg font-semibold text-gold flex items-center gap-2">
              <Sparkles className="h-5 w-5" /> Khoá học khác
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {unenrolledCourses.map((course) => (
                <Card key={course.id} className="hover:border-gold/40 transition-all">
                  <CardContent className="space-y-3">
                    <div>
                      <p className="font-semibold text-foreground">{course.title}</p>
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{course.description}</p>
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t border-border">
                      <p className="text-lg font-bold text-gold">
                        {course.price ? formatPrice(course.price) : course.price_label}
                      </p>
                      {course.price ? (
                        <Link href={`/student/checkout/${course.id}`}>
                          <Button size="sm" className="bg-gold hover:bg-gold/90 text-black font-semibold">
                            Đăng ký ngay
                          </Button>
                        </Link>
                      ) : (
                        <Link href="https://m.me/rova" target="_blank">
                          <Button size="sm" variant="outline" className="border-gold/50 text-gold">
                            <MessageCircle className="h-3.5 w-3.5 mr-1" /> Tư vấn
                          </Button>
                        </Link>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </PageTransition>
  );
}
