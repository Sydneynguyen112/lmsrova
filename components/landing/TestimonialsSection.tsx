"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Star, ChevronLeft, ChevronRight, Quote } from "lucide-react";
import { ScrollReveal } from "@/components/shared/ScrollReveal";
import { SectionHeader } from "@/components/shared/SectionHeader";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

interface StaticReview {
  id: string;
  studentName: string;
  classification: string;
  rating: number;
  feedback: string;
}

const STATIC_REVIEWS: StaticReview[] = [
  {
    id: "mr-001",
    studentName: "Lê Quốc Huy",
    classification: "newbie",
    rating: 5,
    feedback: "Anh Thành giải thích rất dễ hiểu, reply nhanh, sửa bài kỹ lưỡng.",
  },
  {
    id: "mr-002",
    studentName: "Phạm Thị Mai",
    classification: "beginner",
    rating: 4,
    feedback: "Mentor nhiệt tình, nhưng đôi khi reply hơi chậm vào cuối tuần.",
  },
  {
    id: "mr-003",
    studentName: "Nguyễn Thùy Trang",
    classification: "intermediate",
    rating: 5,
    feedback: "Chị Linh rất kiên nhẫn, phân tích bài nộp chi tiết, chỉ ra cả điểm mình chưa thấy.",
  },
  {
    id: "mr-004",
    studentName: "Võ Hoàng Long",
    classification: "advanced",
    rating: 5,
    feedback: "Mentoring chiến lược rất hay, giúp mình tối ưu hệ thống trading đang có.",
  },
  {
    id: "mr-005",
    studentName: "Trần Văn Đức",
    classification: "beginner",
    rating: 5,
    feedback: "Giải thích Price Action rõ ràng, dễ áp dụng ngay.",
  },
  {
    id: "mr-011",
    studentName: "Bùi Đăng Khoa",
    classification: "newbie",
    rating: 5,
    feedback: "Buổi chiều hôm nay rất bổ ích, cảm ơn anh!",
  },
  {
    id: "mr-006",
    studentName: "Bùi Đăng Khoa",
    classification: "newbie",
    rating: 4,
    feedback: "Nội dung bài review rất chi tiết, mình học được nhiều.",
  },
  {
    id: "mr-007",
    studentName: "Lê Quốc Huy",
    classification: "newbie",
    rating: 5,
    feedback: "Mentor giải đáp thắc mắc rất nhanh, support tận tâm.",
  },
  {
    id: "mr-008",
    studentName: "Phạm Thị Mai",
    classification: "beginner",
    rating: 5,
    feedback: "Buổi 1-on-1 rất bổ ích, cảm ơn anh Thành!",
  },
  {
    id: "mr-012",
    studentName: "Trần Văn Đức",
    classification: "beginner",
    rating: 4,
    feedback: "Review bài chi tiết, giúp mình hiểu rõ lỗi sai.",
  },
  {
    id: "mr-013",
    studentName: "Lê Quốc Huy",
    classification: "newbie",
    rating: 5,
    feedback: "Anh Thành support cả ngày, quá tuyệt vời!",
  },
  {
    id: "mr-009",
    studentName: "Hoàng Việt Anh",
    classification: "newbie",
    rating: 4,
    feedback: "Chị Linh hướng dẫn tỉ mỉ, thích cách phân tích chart.",
  },
  {
    id: "mr-010",
    studentName: "Nguyễn Thùy Trang",
    classification: "intermediate",
    rating: 5,
    feedback: "Support nhanh, bài chấm kỹ, rất hài lòng!",
  },
];

export function TestimonialsSection() {
  const [current, setCurrent] = useState(0);
  const reviews = STATIC_REVIEWS;

  const next = () => setCurrent((c) => (c + 1) % reviews.length);
  const prev = () => setCurrent((c) => (c - 1 + reviews.length) % reviews.length);

  const review = reviews[current];
  const initials = review.studentName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(-2) || "?";

  return (
    <section className="py-20 md:py-32 relative">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-gold/[0.02] to-transparent" />
      <div className="relative mx-auto max-w-7xl px-4 lg:px-8">
        <ScrollReveal>
          <SectionHeader
            title="Học viên nói gì?"
            subtitle="Phản hồi thực tế từ những người đã đồng hành cùng ROVA"
          />
        </ScrollReveal>

        <div className="max-w-2xl mx-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={current}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="relative p-8 md:p-10 rounded-2xl border border-gold-shadow/30 bg-card text-center"
            >
              <Quote size={32} className="text-gold/20 mx-auto mb-6" />

              <p className="text-lg md:text-xl text-foreground leading-relaxed mb-8 italic">
                &ldquo;{review.feedback}&rdquo;
              </p>

              {/* Stars */}
              <div className="flex items-center justify-center gap-1 mb-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    size={18}
                    className={
                      i < review.rating
                        ? "text-gold fill-gold"
                        : "text-gold/20"
                    }
                  />
                ))}
              </div>

              {/* Student */}
              <div className="flex items-center justify-center gap-3">
                <Avatar className="w-10 h-10 border border-gold/20">
                  <AvatarFallback className="bg-gold/10 text-gold text-sm font-semibold">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className="text-left">
                  <div className="text-sm font-semibold text-foreground">
                    {review.studentName}
                  </div>
                  <div className="text-xs text-muted-foreground capitalize">
                    {review.classification}
                  </div>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Navigation */}
          <div className="flex items-center justify-center gap-4 mt-6">
            <Button
              variant="outline"
              size="icon"
              onClick={prev}
              className="border-gold/20 text-gold hover:bg-gold/5 rounded-full"
            >
              <ChevronLeft size={18} />
            </Button>
            <div className="flex gap-2">
              {reviews.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrent(i)}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    i === current ? "bg-gold" : "bg-gold/20"
                  }`}
                />
              ))}
            </div>
            <Button
              variant="outline"
              size="icon"
              onClick={next}
              className="border-gold/20 text-gold hover:bg-gold/5 rounded-full"
            >
              <ChevronRight size={18} />
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
