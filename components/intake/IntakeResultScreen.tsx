"use client";

// Màn kết quả bài test khám bệnh — CHỈ render student_visible.
// Tuyệt đối không nhận/hiển thị flags, care_group hay câu trả lời nhạy cảm.
// ⚠️ Không viết chữ trong file này. Chữ ở lib/intake-content/copy.ts,
// bật/tắt từng khối ở lib/intake-content/display.ts.
import { useEffect } from "react";
import { motion } from "framer-motion";
import confetti from "canvas-confetti";
import {
  Sparkles, TrendingUp, ShieldCheck, AlertTriangle,
  Compass, PlayCircle, ClipboardCheck, Upload, Hourglass, GraduationCap,
  ArrowRight, Zap, Footprints,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import type { StudentVisibleResult } from "@/lib/intake-scoring";
import type { IntakeNextStep } from "@/lib/intake-next-step";
import { PACE_INFO, type LearningPace, type TodoItem } from "@/lib/daily-todo";
import {
  INTAKE_DISPLAY as D,
  INTAKE_COPY,
  fillCopy,
  CLASSIFICATION_LABELS,
} from "@/lib/intake-content";

const C = INTAKE_COPY.result;
const N = INTAKE_COPY.nextStep;

const KIND_ICON: Record<TodoItem["kind"], typeof PlayCircle> = {
  watch: PlayCircle,
  quiz: ClipboardCheck,
  assignment: Upload,
  waiting: Hourglass,
  graduation: GraduationCap,
};

interface IntakeResultScreenProps {
  visible: StudentVisibleResult;
  /** Bỏ trống = chế độ xem lại: không pháo giấy, không nút "Bắt đầu học ngay" */
  onDone?: () => void;
  saving?: boolean;
  /** null = chưa tải xong hoặc khoá chưa có lộ trình → ẩn khối gợi ý */
  nextStep?: IntakeNextStep | null;
  /** Nhịp học viên vừa chọn tại màn này; null = chưa chọn */
  pace?: LearningPace | null;
  onPickPace?: (p: LearningPace) => void;
}

export function IntakeResultScreen({
  visible,
  onDone,
  saving,
  nextStep,
  pace,
  onPickPace,
}: IntakeResultScreenProps) {
  useEffect(() => {
    if (!onDone || !D.confetti) return;
    confetti({ particleCount: 90, spread: 75, origin: { y: 0.5 } });
  }, [onDone]);

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

      {/* Bước kế tiếp — gợi ý lộ trình học ngay sau khi khám xong */}
      {D.showNextStep && nextStep && (
        <div className="rounded-xl border border-border bg-card p-4 space-y-4">
          <p className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
            <Compass className="h-3.5 w-3.5 text-gold" /> {N.title}
          </p>

          {/* Chặng hiện tại */}
          {D.showStageProgress && (
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-medium text-foreground truncate">
                  {nextStep.stageTitle
                    ? fillCopy(N.stageLabel, {
                        current: nextStep.stageDone + 1,
                        total: nextStep.stageTotal,
                        title: nextStep.stageTitle,
                      })
                    : N.finished}
                </span>
                <span className="text-[11px] text-muted-foreground shrink-0">
                  {fillCopy(N.stageCount, {
                    done: nextStep.stageDone,
                    total: nextStep.stageTotal,
                  })}
                </span>
              </div>
              <Progress
                value={(nextStep.stageDone / Math.max(1, nextStep.stageTotal)) * 100}
              />
            </div>
          )}

          {/* MỘT việc kế tiếp */}
          {D.showNextTask &&
            (nextStep.primary ? (
              <a href={nextStep.primary.href} className="block">
                <div className="flex items-center gap-2.5 rounded-lg border border-gold/40 bg-gold/5 px-3 py-2.5 transition-colors hover:border-gold/70">
                  {(() => {
                    const Icon = KIND_ICON[nextStep.primary.kind];
                    return <Icon className="h-4 w-4 text-gold shrink-0" />;
                  })()}
                  <span className="min-w-0">
                    <span className="block text-sm font-medium text-foreground truncate">
                      {nextStep.primary.title}
                    </span>
                    <span className="block text-[11px] text-muted-foreground">
                      {nextStep.primary.detail}
                    </span>
                  </span>
                  <ArrowRight className="h-4 w-4 text-gold ml-auto shrink-0" />
                </div>
              </a>
            ) : (
              <p className="text-xs text-muted-foreground">{N.noTask}</p>
            ))}

          {/* Chọn nhịp học */}
          {D.showPacePicker && onPickPace && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-foreground">{N.paceTitle}</p>
              <p className="text-[11px] text-muted-foreground leading-relaxed">{N.paceHint}</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {(Object.keys(PACE_INFO) as LearningPace[]).map((option) => {
                  const Icon = option === "fast" ? Zap : Footprints;
                  const suggested = option === nextStep.suggestedPace;
                  return (
                    <button
                      key={option}
                      type="button"
                      onClick={() => onPickPace(option)}
                      className={cn(
                        "rounded-lg border p-3 text-left transition-colors hover:border-gold/60",
                        pace === option
                          ? "border-gold bg-gold/10"
                          : suggested
                            ? "border-gold/50 bg-gold/5"
                            : "border-border"
                      )}
                    >
                      <span className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                        <Icon className="h-3.5 w-3.5 text-gold" />
                        {PACE_INFO[option].label}
                        {suggested && (
                          <span className="text-[10px] font-medium text-gold bg-gold/10 rounded-full px-1.5 py-0.5">
                            {N.paceSuggested}
                          </span>
                        )}
                      </span>
                      <span className="block text-[11px] text-muted-foreground mt-1">
                        {PACE_INFO[option].desc}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {onDone && (
        <Button
          onClick={onDone}
          disabled={saving}
          className="bg-gold hover:bg-gold/90 text-black font-semibold py-6 rounded-xl text-base w-full"
        >
          {C.doneButton}
        </Button>
      )}
    </motion.div>
  );
}
