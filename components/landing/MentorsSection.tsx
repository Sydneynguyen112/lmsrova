"use client";

import { motion } from "framer-motion";
import { Star, Users } from "lucide-react";
import { ScrollReveal } from "@/components/shared/ScrollReveal";
import { SectionHeader } from "@/components/shared/SectionHeader";
import { staggerContainer, fadeInUp } from "@/components/shared/ScrollReveal";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface StaticMentor {
  id: string;
  fullName: string;
  initials: string;
  bio: string;
  rating: number;
  studentCount: number;
}

const STATIC_MENTORS: StaticMentor[] = [
  {
    id: "u-mentor-001",
    fullName: "Trương Văn Tiến",
    initials: "VT",
    bio: "5 năm kinh nghiệm trading Forex. Chuyên Price Action và Smart Money Concept. Đã đào tạo hơn 200 học viên từ zero đến profitable.",
    rating: 4.7,
    studentCount: 4,
  },
  {
    id: "u-mentor-002",
    fullName: "Nguyễn Xuân Đại",
    initials: "XĐ",
    bio: "Chuyên gia phân tích kỹ thuật với 4 năm kinh nghiệm. Focus vào Crypto và Stock trading. Phong cách mentoring kiên nhẫn, phù hợp với người mới.",
    rating: 4.8,
    studentCount: 3,
  },
];

export function MentorsSection() {
  const mentors = STATIC_MENTORS;

  return (
    <section className="py-20 md:py-32 relative">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-gold/[0.02] to-transparent" />
      <div className="relative mx-auto max-w-7xl px-4 lg:px-8">
        <ScrollReveal>
          <SectionHeader
            title="Đội ngũ Mentor"
            subtitle="Những trader có kinh nghiệm thực chiến, tận tâm với học viên"
          />
        </ScrollReveal>

        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          className="grid md:grid-cols-2 gap-6 lg:gap-8 max-w-3xl mx-auto"
        >
          {mentors.map((mentor) => {
            return (
              <motion.div
                key={mentor.id}
                variants={fadeInUp}
                className="group relative p-8 rounded-2xl border border-gold-shadow/30 bg-card hover:gold-border-glow transition-all duration-300 text-center"
              >
                <Avatar className="w-20 h-20 mx-auto mb-4 border-2 border-gold/30">
                  <AvatarFallback className="bg-gold/10 text-gold text-xl font-bold">
                    {mentor.initials}
                  </AvatarFallback>
                </Avatar>

                <h3 className="text-xl font-bold text-foreground mb-1">
                  {mentor.fullName}
                </h3>

                <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground mb-4">
                  <span className="flex items-center gap-1">
                    <Star size={14} className="text-gold fill-gold" />
                    {mentor.rating}
                  </span>
                  <span className="flex items-center gap-1">
                    <Users size={14} className="text-gold" />
                    {mentor.studentCount} học viên
                  </span>
                </div>

                <p className="text-muted-foreground leading-relaxed text-sm">
                  {mentor.bio}
                </p>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}
