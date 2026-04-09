"use client";

import { motion } from "framer-motion";
import { Users, BookOpen, Headphones } from "lucide-react";
import { ScrollReveal } from "@/components/shared/ScrollReveal";
import { SectionHeader } from "@/components/shared/SectionHeader";
import { staggerContainer, fadeInUp } from "@/components/shared/ScrollReveal";

const features = [
  {
    icon: Users,
    title: "Mentor 1:1",
    description:
      "Được hỗ trợ trực tiếp từ mentor có kinh nghiệm thực chiến. Sửa bài, review chart, và tư vấn chiến lược cá nhân hoá.",
  },
  {
    icon: BookOpen,
    title: "Học theo lộ trình",
    description:
      "Hệ thống bài giảng từ cơ bản đến nâng cao, được thiết kế bài bản. Mỗi bài đều có quiz và bài tập thực hành.",
  },
  {
    icon: Headphones,
    title: "Hỗ trợ liên tục",
    description:
      "Cộng đồng Discord sôi động, hỗ trợ 24/7. Không bao giờ phải học một mình trên hành trình Trading.",
  },
];

export function FeaturesSection() {
  return (
    <section className="py-20 md:py-32 relative">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-gold/[0.02] to-transparent" />
      <div className="relative mx-auto max-w-7xl px-4 lg:px-8">
        <ScrollReveal>
          <SectionHeader
            title="Tại sao chọn ROVA?"
            subtitle="Phương pháp học Trading hiệu quả nhất, được thiết kế cho người Việt"
          />
        </ScrollReveal>

        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          className="grid md:grid-cols-3 gap-6 lg:gap-8"
        >
          {features.map((feature) => (
            <motion.div
              key={feature.title}
              variants={fadeInUp}
              className="group relative p-8 rounded-2xl border border-gold-shadow/30 bg-card hover:gold-border-glow transition-all duration-300"
            >
              <div className="w-12 h-12 rounded-xl bg-gold/10 flex items-center justify-center mb-6 group-hover:bg-gold/20 transition-colors">
                <feature.icon size={24} className="text-gold" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-3">
                {feature.title}
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
