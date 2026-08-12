"use client";

// Hiện ngay khi học viên xem đủ video onboarding — chỉ có một lối ra là bấm
// làm bài test đầu vào (không nút đóng, không click nền để tắt).
import { motion } from "framer-motion";
import { Stethoscope, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface IntakePromptModalProps {
  onStart: () => void;
}

export function IntakePromptModal({ onStart }: IntakePromptModalProps) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/85 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, y: 16, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.35 }}
        className="w-full max-w-md rounded-2xl border border-gold/30 bg-card p-6 shadow-xl space-y-5"
      >
        <div className="text-center space-y-3">
          <div className="w-16 h-16 rounded-full bg-gold/10 border-2 border-gold/30 flex items-center justify-center mx-auto">
            <Stethoscope className="h-7 w-7 text-gold" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground">
              Xong video — còn một bước nữa
            </h2>
            <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
              Bài test &ldquo;khám bệnh&rdquo; đầu vào giúp ROVA biết bạn đang ở đâu để
              gợi ý lộ trình học đúng sức. Làm một lần, khoảng 5 phút.
            </p>
          </div>
        </div>

        <Button
          onClick={onStart}
          className="w-full bg-gold hover:bg-gold-medium text-gold-black font-semibold"
          size="lg"
        >
          Làm bài test đầu vào
          <ArrowRight className="h-4 w-4 ml-1.5" />
        </Button>
      </motion.div>
    </div>
  );
}
