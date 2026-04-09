"use client";

import { motion } from "framer-motion";
import { Star, Users } from "lucide-react";
import { getMentors, mentorProfiles, getAvgRating, users } from "@/lib/mock-data";
import { ScrollReveal } from "@/components/shared/ScrollReveal";
import { SectionHeader } from "@/components/shared/SectionHeader";
import { staggerContainer, fadeInUp } from "@/components/shared/ScrollReveal";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export function MentorsSection() {
  const mentors = getMentors();

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
            const profile = mentorProfiles.find(
              (p) => p.user_id === mentor.id
            );
            const rating = getAvgRating(mentor.id);
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
                className="group relative p-8 rounded-2xl border border-gold-shadow/30 bg-card hover:gold-border-glow transition-all duration-300 text-center"
              >
                <Avatar className="w-20 h-20 mx-auto mb-4 border-2 border-gold/30">
                  <AvatarFallback className="bg-gold/10 text-gold text-xl font-bold">
                    {initials}
                  </AvatarFallback>
                </Avatar>

                <h3 className="text-xl font-bold text-foreground mb-1">
                  {mentor.full_name}
                </h3>

                <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground mb-4">
                  <span className="flex items-center gap-1">
                    <Star size={14} className="text-gold fill-gold" />
                    {rating}
                  </span>
                  <span className="flex items-center gap-1">
                    <Users size={14} className="text-gold" />
                    {studentCount} học viên
                  </span>
                </div>

                <p className="text-muted-foreground leading-relaxed text-sm">
                  {profile?.bio}
                </p>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}
