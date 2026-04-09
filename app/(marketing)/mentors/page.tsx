"use client";

import { motion } from "framer-motion";
import { Star, Users, MessageCircle } from "lucide-react";
import { getMentors, mentorProfiles, getAvgRating, getReviewsByMentor, users } from "@/lib/mock-data";
import { ScrollReveal } from "@/components/shared/ScrollReveal";
import { SectionHeader } from "@/components/shared/SectionHeader";
import { staggerContainer, fadeInUp } from "@/components/shared/ScrollReveal";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

export default function MentorsPage() {
  const mentors = getMentors();

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
              const profile = mentorProfiles.find(
                (p) => p.user_id === mentor.id
              );
              const rating = getAvgRating(mentor.id);
              const reviews = getReviewsByMentor(mentor.id);
              const studentCount = users.filter(
                (u) => u.mentor_id === mentor.id
              ).length;
              const initials = mentor.full_name
                .split(" ")
                .map((n) => n[0])
                .join("")
                .slice(-2);

              return (
                <motion.div
                  key={mentor.id}
                  variants={fadeInUp}
                  className="rounded-2xl border border-gold-shadow/30 bg-card p-8 hover:gold-border-glow transition-all duration-300"
                >
                  <div className="flex items-start gap-5 mb-6">
                    <Avatar className="w-16 h-16 border-2 border-gold/30 shrink-0">
                      <AvatarFallback className="bg-gold/10 text-gold text-xl font-bold">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h2 className="text-xl font-bold text-foreground">
                        {mentor.full_name}
                      </h2>
                      <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Star size={14} className="text-gold fill-gold" />
                          {rating} / 5
                        </span>
                        <span className="flex items-center gap-1">
                          <Users size={14} className="text-gold" />
                          {studentCount} học viên
                        </span>
                        <span className="flex items-center gap-1">
                          <MessageCircle size={14} className="text-gold" />
                          {reviews.length} đánh giá
                        </span>
                      </div>
                    </div>
                  </div>

                  <p className="text-muted-foreground leading-relaxed mb-6">
                    {profile?.bio}
                  </p>

                  {/* Recent reviews */}
                  {reviews.length > 0 && (
                    <div className="space-y-3 pt-4 border-t border-gold-shadow/30">
                      <h3 className="text-sm font-semibold text-gold">
                        Đánh giá gần đây
                      </h3>
                      {reviews.slice(0, 2).map((review) => {
                        const student = users.find(
                          (u) => u.id === review.student_id
                        );
                        return (
                          <div
                            key={review.id}
                            className="text-sm text-muted-foreground"
                          >
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium text-foreground">
                                {student?.full_name}
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
