"use client";

import { useRef } from "react";
import { motion, useInView, useSpring, useTransform, MotionValue } from "framer-motion";

function AnimatedNumber({ value, suffix = "" }: { value: number; suffix?: string }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });
  const spring = useSpring(0, { duration: 2000, bounce: 0 });
  const display = useTransform(spring, (latest: number) =>
    Math.round(latest).toLocaleString()
  );

  if (isInView) {
    spring.set(value);
  }

  return (
    <span ref={ref} className="tabular-nums">
      <motion.span>{display}</motion.span>
      {suffix}
    </span>
  );
}

const stats = [
  { value: 2, suffix: "+", label: "Khoá học chuyên sâu" },
  { value: 500, suffix: "+", label: "Học viên đã tham gia" },
  { value: 2, suffix: "", label: "Mentor chuyên nghiệp" },
];

export function StatsSection() {
  return (
    <section className="py-20 md:py-28">
      <div className="mx-auto max-w-5xl px-4 lg:px-8">
        <div className="rounded-2xl border border-gold-shadow/30 bg-card p-8 md:p-12 gold-glow">
          <div className="grid grid-cols-3 gap-8">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-gold mb-2">
                  <AnimatedNumber value={stat.value} suffix={stat.suffix} />
                </div>
                <div className="text-sm md:text-base text-muted-foreground">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
