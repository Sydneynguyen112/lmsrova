"use client";

// Màn kết quả bài test khám bệnh — CHỈ render student_visible.
// Tuyệt đối không nhận/hiển thị flags, care_group hay câu trả lời nhạy cảm.
// ⚠️ Không viết chữ trong file này. Chữ ở lib/intake-content/copy.ts,
// bật/tắt từng khối ở lib/intake-content/display.ts.
import { useEffect } from "react";
import { motion } from "framer-motion";
import confetti from "canvas-confetti";
import { Sparkles, TrendingUp, ShieldCheck, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { StudentVisibleResult } from "@/lib/intake-scoring";
import {
  INTAKE_DISPLAY as D,
  INTAKE_COPY,
  fillCopy,
  CLASSIFICATION_LABELS,
} from "@/lib/intake-content";

const C = INTAKE_COPY.result;

interface IntakeResultScreenProps {
  visible: StudentVisibleResult;
  onDone: () => void;
  saving?: boolean;
}

export function IntakeResultScreen({ visible, onDone, saving }: IntakeResultScreenProps) {
  useEffect(() => {
    if (!D.confetti) return;
    confetti({ particleCount: 90, spread: 75, origin: { y: 0.5 } });
  }, []);

  const p = visible.personality;

  const showLifePath = D.showLifePath && visible.life_path_number !== null;
  const showZodiac = D.showZodiac && !!visible.zodiac_label;
  const showCanChi = D.showCanChi && !!visible.can_chi;
  const showBadges = showLifePath || showZodiac || showCanChi;

  const lifePathTrait = D.showTraits && D.showLifePath && visible.life_path_trait;
  const zodiacTrait = D.showTraits && D.showZodiac && visible.zodiac_trait;

  const showStrengths = D.showStrengths && p.strengths.length > 0;
  const showWeaknesses = D.showWeaknesses && p.weaknesses.length > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-5"
    >
      {/* Nhóm tính cách */}
      {D.showPersonality && (
        <div className="rounded-2xl border-t-4 border-t-gold bg-card border border-border p-6 text-center space-y-3">
          <div className="w-14 h-14 rounded-full bg-gold/10 border border-gold/40 flex items-center justify-center mx-auto">
            <Sparkles className="h-7 w-7 text-gold" />
          </div>
          <p className="text-xs uppercase tracking-widest text-muted-foreground">{C.eyebrow}</p>
          <h1 className="text-2xl font-bold gold-gradient-text">{p.label}</h1>
          <p className="text-sm text-muted-foreground">{p.description}</p>
          {D.showClassification && (
            <span className="inline-block rounded-full border border-gold/40 bg-gold/10 px-3 py-1 text-xs font-medium text-gold">
              {fillCopy(C.classificationPrefix, {
                level: CLASSIFICATION_LABELS[visible.classification] || visible.classification,
              })}
            </span>
          )}
        </div>
      )}

      {/* Thần số học · Cung hoàng đạo · Can chi */}
      {showBadges && (
        <div className="grid grid-cols-3 gap-2">
          {showLifePath && (
            <div className="rounded-xl bg-card border border-border p-3 text-center">
              <p className="text-2xl font-bold text-gold tabular-nums">{visible.life_path_number}</p>
              <p className="text-[11px] text-muted-foreground mt-1">{C.lifePathCaption}</p>
            </div>
          )}
          {showZodiac && (
            <div className="rounded-xl bg-card border border-border p-3 text-center">
              <p className="text-sm font-semibold text-foreground mt-1">{visible.zodiac_label}</p>
              <p className="text-[11px] text-muted-foreground mt-1">{C.zodiacCaption}</p>
            </div>
          )}
          {showCanChi && (
            <div className="rounded-xl bg-card border border-border p-3 text-center">
              <p className="text-sm font-semibold text-foreground mt-1">{visible.can_chi}</p>
              <p className="text-[11px] text-muted-foreground mt-1">{C.canChiCaption}</p>
            </div>
          )}
        </div>
      )}
      {(lifePathTrait || zodiacTrait) && (
        <div className="rounded-xl bg-card border border-border p-4 space-y-1.5">
          {lifePathTrait && (
            <p className="text-xs text-muted-foreground">
              <span className="text-gold font-medium">{visible.life_path_label}:</span> {visible.life_path_trait}
            </p>
          )}
          {zodiacTrait && (
            <p className="text-xs text-muted-foreground">
              <span className="text-gold font-medium">{visible.zodiac_label}:</span> {visible.zodiac_trait}
            </p>
          )}
        </div>
      )}

      {/* Điểm mạnh / cần chú ý */}
      {(showStrengths || showWeaknesses) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {showStrengths && (
            <div className="rounded-xl bg-card border border-border p-4 space-y-2">
              <p className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                <ShieldCheck className="h-3.5 w-3.5" /> {C.strengthsTitle}
              </p>
              <ul className="space-y-1.5">
                {p.strengths.map((s) => (
                  <li key={s} className="text-xs text-muted-foreground leading-relaxed">• {s}</li>
                ))}
              </ul>
            </div>
          )}
          {showWeaknesses && (
            <div className="rounded-xl bg-card border border-border p-4 space-y-2">
              <p className="flex items-center gap-1.5 text-xs font-semibold text-amber-600 dark:text-amber-400">
                <AlertTriangle className="h-3.5 w-3.5" /> {C.weaknessesTitle}
              </p>
              <ul className="space-y-1.5">
                {p.weaknesses.map((w) => (
                  <li key={w} className="text-xs text-muted-foreground leading-relaxed">• {w}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Điểm các chiều trading */}
      {D.showDimensionBars && visible.trading_dimensions.length > 0 && (
        <div className="rounded-xl bg-card border border-border p-4 space-y-3">
          <p className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
            <TrendingUp className="h-3.5 w-3.5 text-gold" /> {C.dimensionsTitle}
          </p>
          {visible.trading_dimensions.map((d) => (
            <div key={d.key} className="space-y-1">
              <div className="flex justify-between text-[11px] text-muted-foreground">
                <span>{d.label}</span>
                {D.showDimensionPct && <span className="tabular-nums">{d.pct}%</span>}
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
      {D.showAdvice && (
        <div className="rounded-xl border border-gold/30 bg-gold/5 p-4">
          <p className="text-xs font-semibold text-gold mb-1">{C.adviceTitle}</p>
          <p className="text-sm text-foreground leading-relaxed">{p.advice}</p>
        </div>
      )}

      <Button
        onClick={onDone}
        disabled={saving}
        className="bg-gold hover:bg-gold/90 text-black font-semibold py-6 rounded-xl text-base w-full"
      >
        {C.doneButton}
      </Button>
    </motion.div>
  );
}
