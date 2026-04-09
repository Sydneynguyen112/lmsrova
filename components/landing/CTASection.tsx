"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export function CTASection() {
  return (
    <section className="py-20 md:py-32 relative overflow-hidden">
      {/* Gradient background */}
      <div className="absolute inset-0 gold-gradient" />
      <div className="absolute inset-0 bg-gold-black/40" />

      <div className="relative mx-auto max-w-4xl px-4 lg:px-8 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
        >
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-foreground leading-tight mb-6">
            Đừng chần chừ!
            <br />
            <span className="text-gold">
              Nâng cấp kỹ năng Trading ngay hôm nay
            </span>
          </h2>
          <p className="text-lg text-foreground/70 mb-10 max-w-2xl mx-auto">
            Hàng trăm học viên đã thay đổi cuộc sống nhờ Trading có phương pháp.
            Bước tiếp theo thuộc về bạn.
          </p>
          <Link href="/register">
            <Button
              size="lg"
              className="bg-gold hover:bg-gold-light text-gold-black font-bold text-lg px-10 py-7 rounded-xl hover:scale-105 transition-transform"
            >
              Tham gia ROVA
              <ArrowRight className="ml-2" size={20} />
            </Button>
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
