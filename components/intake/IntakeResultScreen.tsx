"use client";

// Màn kết quả bài test khám bệnh — CHỈ render student_visible.
// Tuyệt đối không nhận/hiển thị flags, care_group hay câu trả lời nhạy cảm.
import { useEffect } from "react";
import { motion } from "framer-motion";
import confetti from "canvas-confetti";
import { Sparkles, TrendingUp, ShieldCheck, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { StudentVisibleResult } from "@/lib/intake-scoring";

const CLASSIFICATION_LABELS: Record<string, string> = {
  newbie: "Người mới bắt đầu",
  beginner: "Sơ cấp",
  intermediate: "Trung cấp",
  advanced: "Nâng cao",
};

interface IntakeResultScreenProps {
  visible: StudentVisibleResult;
  onDone: () => void;
  saving?: boolean;
}

export function IntakeResultScreen({ visible, onDone, saving }: IntakeResultScreenProps) {
  useEffect(() => {
    confetti({ particleCount: 90, spread: 75, origin: { y: 0.5 } });
  }, []);

  const p = visible.personality;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-5"
    >
      {/* Nhóm tính cách */}
      <div className="rounded-2xl border-t-4 border-t-gold bg-card border border-border p-6 text-center space-y-3">
        <div className="w-14 h-14 rounded-full bg-gold/10 border border-gold/40 flex items-center justify-center mx-auto">
          <Sparkles className="h-7 w-7 text-gold" />
        </div>
        <p className="text-xs uppercase tracking-widest text-muted-foreground">Hồ sơ giao dịch của bạn</p>
        <h1 className="text-2xl font-bold gold-gradient-text">{p.label}</h1>
        <p className="text-sm text-muted-foreground">{p.description}</p>
        <span className="inline-block rounded-full border border-gold/40 bg-gold/10 px-3 py-1 text-xs font-medium text-gold">
          Trình độ hiện tại: {CLASSIFICATION_LABELS[visible.classification] || visible.classification}
        </span>
      </div>

      {/* Thần số học · Cung hoàng đạo · Can chi */}
      {(visible.life_path_number !== null || visible.zodiac_label || visible.can_chi) && (
        <div className="grid grid-cols-3 gap-2">
          {visible.life_path_number !== null && (
            <div className="rounded-xl bg-card border border-border p-3 text-center">
              <p className="text-2xl font-bold text-gold tabular-nums">{visible.life_path_number}</p>
              <p className="text-[11px] text-muted-foreground mt-1">Số chủ đạo</p>
            </div>
          )}
          {visible.zodiac_label && (
            <div className="rounded-xl bg-card border border-border p-3 text-center">
              <p className="text-sm font-semibold text-foreground mt-1">{visible.zodiac_label}</p>
              <p className="text-[11px] text-muted-foreground mt-1">Cung hoàng đạo</p>
            </div>
          )}
          {visible.can_chi && (
            <div className="rounded-xl bg-card border border-border p-3 text-center">
              <p className="text-sm font-semibold text-foreground mt-1">{visible.can_chi}</p>
              <p className="text-[11px] text-muted-foreground mt-1">Năm sinh</p>
            </div>
          )}
        </div>
      )}
      {(visible.life_path_trait || visible.zodiac_trait) && (
        <div className="rounded-xl bg-card border border-border p-4 space-y-1.5">
          {visible.life_path_trait && (
            <p className="text-xs text-muted-foreground">
              <span className="text-gold font-medium">{visible.life_path_label}:</span> {visible.life_path_trait}
            </p>
          )}
          {visible.zodiac_trait && (
            <p className="text-xs text-muted-foreground">
              <span className="text-gold font-medium">{visible.zodiac_label}:</span> {visible.zodiac_trait}
            </p>
          )}
        </div>
      )}

      {/* Điểm mạnh / cần chú ý */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="rounded-xl bg-card border border-border p-4 space-y-2">
          <p className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
            <ShieldCheck className="h-3.5 w-3.5" /> Điểm mạnh
          </p>
          <ul className="space-y-1.5">
            {p.strengths.map((s) => (
              <li key={s} className="text-xs text-muted-foreground leading-relaxed">• {s}</li>
            ))}
          </ul>
        </div>
        <div className="rounded-xl bg-card border border-border p-4 space-y-2">
          <p className="flex items-center gap-1.5 text-xs font-semibold text-amber-600 dark:text-amber-400">
            <AlertTriangle className="h-3.5 w-3.5" /> Cần chú ý
          </p>
          <ul className="space-y-1.5">
            {p.weaknesses.map((w) => (
              <li key={w} className="text-xs text-muted-foreground leading-relaxed">• {w}</li>
            ))}
          </ul>
        </div>
      </div>

      {/* Điểm các chiều trading */}
      {visible.trading_dimensions.length > 0 && (
        <div className="rounded-xl bg-card border border-border p-4 space-y-3">
          <p className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
            <TrendingUp className="h-3.5 w-3.5 text-gold" /> Nền tảng giao dịch hiện tại
          </p>
          {visible.trading_dimensions.map((d) => (
            <div key={d.key} className="space-y-1">
              <div className="flex justify-between text-[11px] text-muted-foreground">
                <span>{d.label}</span>
                <span className="tabular-nums">{d.pct}%</span>
              </div>
              <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${d.pct}%` }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                  className="h-full rounded-full gold-gradient"
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Lời khuyên */}
      <div className="rounded-xl border border-gold/30 bg-gold/5 p-4">
        <p className="text-xs font-semibold text-gold mb-1">Lời khuyên dành riêng cho bạn</p>
        <p className="text-sm text-foreground leading-relaxed">{p.advice}</p>
      </div>

      <Button
        onClick={onDone}
        disabled={saving}
        className="bg-gold hover:bg-gold/90 text-black font-semibold py-6 rounded-xl text-base w-full"
      >
        Bắt đầu học ngay →
      </Button>
    </motion.div>
  );
}
