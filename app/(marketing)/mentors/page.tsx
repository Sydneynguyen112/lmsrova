"use client";

import { motion } from "framer-motion";
import { Star, Users, MessageCircle } from "lucide-react";
import { ScrollReveal } from "@/components/shared/ScrollReveal";
import { SectionHeader } from "@/components/shared/SectionHeader";
import { staggerContainer, fadeInUp } from "@/components/shared/ScrollReveal";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

interface StaticReview {
  id: string;
  studentName: string;
  rating: number;
  feedback: string;
}

interface StaticMentor {
  id: string;
  fullName: string;
  initials: string;
  bio: string;
  rating: number;
  studentCount: number;
  reviewCount: number;
  recentReviews: StaticReview[];
}

const STATIC_MENTORS: StaticMentor[] = [
  {
    id: "u-mentor-001",
    fullName: "Trương Văn Tiến",
    initials: "VT",
    bio: "5 năm kinh nghiệm trading Forex. Chuyên Price Action và Smart Money Concept. Đã đào tạo hơn 200 học viên từ zero đến profitable.",
    rating: 4.7,
    studentCount: 4,
    reviewCount: 9,
    recentReviews: [
      {
        id: "mr-001",
        studentName: "Lê Quốc Huy",
        rating: 5,
        feedback: "Anh Thành giải thích rất dễ hiểu, reply nhanh, sửa bài kỹ lưỡng.",
      },
      {
        id: "mr-002",
        studentName: "Phạm Thị Mai",
        rating: 4,
        feedback: "Mentor nhiệt tình, nhưng đôi khi reply hơi chậm vào cuối tuần.",
      },
    ],
  },
  {
    id: "u-mentor-002",
    fullName: "Nguyễn Xuân Đại",
    initials: "XĐ",
    bio: "Chuyên gia phân tích kỹ thuật với 4 năm kinh nghiệm. Focus vào Crypto và Stock trading. Phong cách mentoring kiên nhẫn, phù hợp với người mới.",
    rating: 4.8,
    studentCount: 3,
    reviewCount: 4,
    recentReviews: [
      {
        id: "mr-003",
        studentName: "Nguyễn Thùy Trang",
        rating: 5,
        feedback: "Chị Linh rất kiên nhẫn, phân tích bài nộp chi tiết, chỉ ra cả điểm mình chưa thấy.",
      },
      {
        id: "mr-004",
        studentName: "Võ Hoàng Long",
        rating: 5,
        feedback: "Mentoring chiến lược rất hay, giúp mình tối ưu hệ thống trading đang có.",
      },
    ],
  },
];

export default function MentorsPage() {
  const mentors = STATIC_MENTORS;

  return (
    <>
      {/* Hero */}
      <section className="py-20 md:py-28 relative">
        <div className="absolute inset-0 gold-gradient-radial" />
        <div className="relative mx-auto max-w-7xl px-4 lg:px-8 text-center">
          <ScrollReveal>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold">
              <span className="gold-gradient-text">Đội ngũ Mentor</span>
            </h1>
            <p className="mt-4 text-lg text-muted-foreground max-w-xl mx-auto">
              Những trader có kinh nghiệm thực chiến, sẵn sàng đồng hành cùng bạn
            </p>
          </ScrollReveal>
        </div>
      </section>

      {/* Mentors */}
      <section className="pb-20 md:pb-32">
        <div className="mx-auto max-w-5xl px-4 lg:px-8">
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            className="grid md:grid-cols-2 gap-6 lg:gap-8"
          >
            {mentors.map((mentor) => {
              const reviews = mentor.recentReviews;

              return (
                <motion.div
                  key={mentor.id}
                  variants={fadeInUp}
                  className="rounded-2xl border border-gold-shadow/30 bg-card p-8 hover:gold-border-glow transition-all duration-300"
                >
                  <div className="flex items-start gap-5 mb-6">
                    <Avatar className="w-16 h-16 border-2 border-gold/30 shrink-0">
                      <AvatarFallback className="bg-gold/10 text-gold text-xl font-bold">
                        {mentor.initials}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h2 className="text-xl font-bold text-foreground">
                        {mentor.fullName}
                      </h2>
                      <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Star size={14} className="text-gold fill-gold" />
                          {mentor.rating} / 5
                        </span>
                        <span className="flex items-center gap-1">
                          <Users size={14} className="text-gold" />
                          {mentor.studentCount} học viên
                        </span>
                        <span className="flex items-center gap-1">
                          <MessageCircle size={14} className="text-gold" />
                          {mentor.reviewCount} đánh giá
                        </span>
                      </div>
                    </div>
                  </div>

                  <p className="text-muted-foreground leading-relaxed mb-6">
                    {mentor.bio}
                  </p>

                  {/* Recent reviews */}
                  {reviews.length > 0 && (
                    <div className="space-y-3 pt-4 border-t border-gold-shadow/30">
                      <h3 className="text-sm font-semibold text-gold">
                        Đánh giá gần đây
                      </h3>
                      {reviews.slice(0, 2).map((review) => {
                        return (
                          <div
                            key={review.id}
                            className="text-sm text-muted-foreground"
                          >
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium text-foreground">
                                {review.studentName}
                              </span>
                              <div className="flex gap-0.5">
                                {Array.from({ length: review.rating }).map(
                                  (_, i) => (
                                    <Star
                                      key={i}
                                      size={12}
                                      className="text-gold fill-gold"
                                    />
                                  )
                                )}
                              </div>
                            </div>
                            <p className="italic">
                              &ldquo;{review.feedback}&rdquo;
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </section>
    </>
  );
}
