"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";

export function HeroSection() {
  return (
    <section className="relative min-h-[90vh] flex items-center overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 gold-gradient-radial" />
      <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-5" />

      {/* Glow orb */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-gold/5 blur-[120px]" />

      <div className="relative mx-auto max-w-7xl px-4 lg:px-8 py-20 md:py-32 text-center">
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-gold/20 bg-gold/5 text-gold text-sm font-medium mb-8"
        >
          <TrendingUp size={16} />
          <span>Đã có 500+ học viên tham gia</span>
        </motion.div>

        {/* Heading */}
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight leading-[1.1]"
        >
          <span className="text-foreground">Đầu Tư Tốt Nhất Là</span>
          <br />
          <span className="gold-gradient-text">Đầu Tư Vào Chính Mình</span>
        </motion.h1>

        {/* Subtext */}
        <motion.p
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.25 }}
          className="mt-6 text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed"
        >
          Học Trading từ A-Z cùng mentor chuyên nghiệp. Bắt đầu hành trình trở
          thành Trader có lợi nhuận ổn định.
        </motion.p>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.4 }}
          className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <Link href="/courses">
            <Button
              size="lg"
              className="bg-gold hover:bg-gold-medium text-gold-black font-bold text-base px-8 py-6 rounded-xl hover:scale-105 transition-transform gold-glow"
            >
              Bắt đầu học ngay
              <ArrowRight className="ml-2" size={18} />
            </Button>
          </Link>
          <Link href="/mentors">
            <Button
              size="lg"
              variant="outline"
              className="border-gold/30 text-gold hover:bg-gold/5 font-medium text-base px-8 py-6 rounded-xl"
            >
              Tìm hiểu Mentor
            </Button>
          </Link>
        </motion.div>

        {/* Decorative stats row */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.7 }}
          className="mt-20 grid grid-cols-3 max-w-md mx-auto gap-8"
        >
          {[
            { value: "2+", label: "Khoá học" },
            { value: "500+", label: "Học viên" },
            { value: "4.7", label: "Đánh giá" },
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="text-2xl md:text-3xl font-bold text-gold">
                {stat.value}
              </div>
              <div className="text-xs md:text-sm text-muted-foreground mt-1">
                {stat.label}
              </div>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
