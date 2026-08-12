"use client";

// Bài test khám bệnh — onboarding mới thay khảo sát 8 câu cũ.
// Plan: plans/260807-intake-assessment/plan.md
// Câu hỏi soạn từ rova-ops (form builder, form_type='intake'); chưa có form
// published thì dùng bộ fallback trong code — luồng không bao giờ chết.
// ⚠️ Không viết chữ trong file này. Chữ ở lib/intake-content/copy.ts,
// bật/tắt từng khối ở lib/intake-content/display.ts.
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, ArrowLeft, Loader2, Stethoscope, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase";
import { getStoredUserId, type Profile } from "@/lib/auth";
import { isApproved } from "@/lib/approval";
import { getPublishedIntakeForm, submitIntake } from "@/lib/api-intake";
import { getIntakeNextStep, type IntakeNextStep } from "@/lib/intake-next-step";
import { saveLearningPace, type LearningPace } from "@/lib/daily-todo";
import {
  getFallbackQuestions,
  SECTION_LABELS,
  INTAKE_DISPLAY as D,
  INTAKE_COPY,
  fillCopy,
} from "@/lib/intake-content";
import {
  parseMeta,
  type IntakeQuestion,
  type StudentVisibleResult,
} from "@/lib/intake-scoring";
import { BirthDateStep } from "@/components/intake/BirthDateStep";
import { IntakeResultScreen } from "@/components/intake/IntakeResultScreen";

type PageState = "loading" | "intro" | "form" | "computing" | "result";

const HOURS = Array.from({ length: 24 }, (_, i) => `${String(i).padStart(2, "0")}:00`);

export default function OnboardingPage() {
  const router = useRouter();
  const [pageState, setPageState] = useState<PageState>("loading");
  const [profile, setProfile] = useState<Profile | null>(null);
  const [formId, setFormId] = useState<string | null>(null);
  const [questions, setQuestions] = useState<IntakeQuestion[]>([]);
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [error, setError] = useState("");
  const [visible, setVisible] = useState<StudentVisibleResult | null>(null);
  const [nextStep, setNextStep] = useState<IntakeNextStep | null>(null);
  const [pace, setPace] = useState<LearningPace | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const userId = getStoredUserId();
      if (!userId) {
        router.replace("/sign-in");
        return;
      }
      const [{ data: p }, intakeForm] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", userId).single(),
        getPublishedIntakeForm(),
      ]);
      if (cancelled) return;
      if (!p) {
        router.replace("/sign-in");
        return;
      }
      // Đã làm bài rồi (blob legacy tồn tại) → không bắt làm lại
      if (p.onboarding_survey) {
        router.replace("/student");
        return;
      }
      // Chưa được admin/mentor duyệt → về trang chủ xem thông báo chờ duyệt
      if (!(await isApproved(userId))) {
        if (!cancelled) router.replace("/student");
        return;
      }
      setProfile(p as Profile);
      if (intakeForm && intakeForm.questions.length > 0) {
        setFormId(intakeForm.form.id);
        setQuestions(intakeForm.questions);
      } else {
        // Chưa có form intake published — dùng bộ câu hỏi dựng sẵn
        console.warn("Chưa có form khám bệnh published — dùng bộ câu hỏi fallback.");
        setFormId(null);
        setQuestions(getFallbackQuestions());
      }
      setPageState(D.showIntro ? "intro" : "form");
    }

    load();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const question = questions[step];
  const meta = question ? parseMeta(question) : null;
  // Câu nhạy cảm hoặc không bắt buộc → được phép bỏ qua
  const skippable = !!meta && (meta.sensitive || !question.required);
  const hasAnswer = !!question && !!answers[question.id]?.trim();
  const progress = questions.length > 0 ? Math.round(((step + 1) / questions.length) * 100) : 0;

  // Chip section — chỉ hiện khi đổi section so với câu trước
  const sectionLabel = meta?.section ? SECTION_LABELS[meta.section] : null;
  const prevMeta = step > 0 ? parseMeta(questions[step - 1]) : null;
  const sectionChanged = !prevMeta || prevMeta.section !== meta?.section;

  function setAnswer(questionId: string, value: string) {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  }

  function toggleCheckbox(questionId: string, option: string) {
    setAnswers((prev) => {
      const current = prev[questionId] ? prev[questionId].split("|||") : [];
      const updated = current.includes(option)
        ? current.filter((o) => o !== option)
        : [...current, option];
      return { ...prev, [questionId]: updated.join("|||") };
    });
  }

  function handleSkip() {
    if (!question) return;
    setAnswers((prev) => {
      const next = { ...prev };
      delete next[question.id]; // bỏ qua = không ghi gì
      return next;
    });
    advance();
  }

  function advance() {
    setError("");
    if (step < questions.length - 1) {
      setStep(step + 1);
    } else {
      handleFinish();
    }
  }

  function handleBack() {
    setError("");
    if (step > 0) setStep(step - 1);
  }

  async function handleFinish() {
    if (!profile) return;
    // Câu bắt buộc (không nhạy cảm) phải có câu trả lời
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      const m = parseMeta(q);
      if (q.required && !m.sensitive && !answers[q.id]?.trim()) {
        setStep(i);
        setError(fillCopy(INTAKE_COPY.form.requiredError, { question: q.question_text }));
        return;
      }
    }

    if (D.showComputingScreen) setPageState("computing");
    const startedAt = Date.now();
    const { computed, error: submitError } = await submitIntake(profile, formId, questions, answers);
    if (submitError) {
      console.error("submitIntake error:", submitError);
      setPageState("form");
      setError(INTAKE_COPY.form.submitError);
      return;
    }
    // Gợi ý bước kế tiếp — chạy song song với màn "đang phân tích".
    // Tự nuốt lỗi, không có thì màn kết quả chỉ ẩn khối gợi ý.
    const nextStepPromise = D.showNextStep
      ? getIntakeNextStep(profile.id, computed.classification)
      : Promise.resolve(null);

    // Giữ màn "đang phân tích" tối thiểu computingMinMs cho cảm giác được "khám" thật
    const elapsed = Date.now() - startedAt;
    if (D.showComputingScreen && elapsed < D.computingMinMs) {
      await new Promise((r) => setTimeout(r, D.computingMinMs - elapsed));
    }
    setNextStep(await nextStepPromise);
    setVisible(computed.student_visible);
    setPageState("result");
  }

  // Học viên chọn nhịp ngay tại màn kết quả → trang chủ không hỏi lại nữa.
  // Lưu nền: lỗi (vd chưa chạy SQL learning_pace) không chặn dùng trong phiên này.
  function handlePickPace(p: LearningPace) {
    if (!profile) return;
    setPace(p);
    saveLearningPace(profile.id, p).catch(() => {});
  }

  /* ─── Render ─── */

  if (pageState === "loading") {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <Loader2 className="h-8 w-8 animate-spin text-gold" />
      </div>
    );
  }

  if (pageState === "intro") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center space-y-5"
      >
        <div className="w-16 h-16 rounded-full bg-gold/10 border border-gold/40 flex items-center justify-center mx-auto">
          <Stethoscope className="h-8 w-8 text-gold" />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-bold gold-gradient-text">{INTAKE_COPY.intro.title}</h1>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {INTAKE_COPY.intro.subtitle}
          </p>
        </div>
        {D.showIntroBullets && (
          <div className="rounded-xl bg-card border border-border p-4 text-left space-y-2">
            {INTAKE_COPY.intro.bullets.map((b) => (
              <p key={b} className="text-xs text-muted-foreground">
                • {fillCopy(b, { count: questions.length })}
              </p>
            ))}
          </div>
        )}
        <Button
          onClick={() => setPageState("form")}
          className="bg-gold hover:bg-gold/90 text-black font-semibold py-6 rounded-xl text-base w-full"
        >
          {INTAKE_COPY.intro.startButton} <ArrowRight className="h-5 w-5 ml-2" />
        </Button>
      </motion.div>
    );
  }

  if (pageState === "computing") {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex flex-col items-center justify-center min-h-[40vh] gap-4 text-center"
      >
        <Loader2 className="h-10 w-10 animate-spin text-gold" />
        <p className="text-sm text-muted-foreground">{INTAKE_COPY.computing.message}</p>
      </motion.div>
    );
  }

  if (pageState === "result" && visible) {
    // Nút cuối đi thẳng vào việc kế tiếp nếu có; không thì về trang chủ như cũ
    const doneHref =
      D.ctaGoesToLesson && nextStep?.primary ? nextStep.primary.href : "/student";
    return (
      <IntakeResultScreen
        visible={visible}
        nextStep={nextStep}
        pace={pace}
        onPickPace={handlePickPace}
        onDone={() => router.push(doneHref)}
      />
    );
  }

  // pageState === "form"
  return (
    <div className="w-full">
      {/* Thanh tiến độ */}
      {D.showProgressBar && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-muted-foreground">
              {fillCopy(INTAKE_COPY.form.progress, { step: step + 1, total: questions.length })}
            </span>
            <span className="text-xs text-gold tabular-nums">{progress}%</span>
          </div>
          <div className="h-1.5 rounded-full bg-muted overflow-hidden">
            <motion.div
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.35, ease: "easeOut" }}
              className="h-full rounded-full gold-gradient"
            />
          </div>
        </div>
      )}

      <AnimatePresence mode="wait">
        <motion.div
          key={question?.id || step}
          initial={{ opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -24 }}
          transition={{ duration: 0.25 }}
          className="space-y-4"
        >
          {D.showSectionChip && sectionLabel && sectionChanged && (
            <span className="inline-block rounded-full border border-gold/30 bg-gold/5 px-3 py-1 text-[11px] font-medium text-gold uppercase tracking-wide">
              {sectionLabel}
            </span>
          )}

          <h2 className="text-lg font-semibold text-foreground leading-snug">
            {question?.question_text}
            {question?.required && !meta?.sensitive && <span className="text-red-400"> *</span>}
          </h2>

          {/* Ngày sinh */}
          {meta?.semantic === "birth_date" && question && (
            <BirthDateStep
              value={answers[question.id] || ""}
              onChange={(iso) => setAnswer(question.id, iso)}
            />
          )}

          {/* Giờ sinh (tùy chọn) */}
          {meta?.semantic === "birth_time" && question && (
            <select
              value={answers[question.id] || ""}
              onChange={(e) => setAnswer(question.id, e.target.value)}
              className="w-full rounded-lg border border-border bg-card p-2.5 text-sm text-foreground focus:border-gold focus:outline-none"
            >
              <option value="">{INTAKE_COPY.form.birthTimePlaceholder}</option>
              {HOURS.map((h) => (
                <option key={h} value={h}>{h}</option>
              ))}
            </select>
          )}

          {/* Các loại câu hỏi thường */}
          {!meta?.semantic && question?.question_type === "radio" && (
            <div className="space-y-2">
              {question.options?.map((opt, j) => (
                <motion.button
                  key={j}
                  type="button"
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setAnswer(question.id, opt)}
                  className={cn(
                    "w-full text-left rounded-xl border p-3.5 text-sm transition-all",
                    answers[question.id] === opt
                      ? "border-gold bg-gold/10 text-foreground"
                      : "border-border hover:border-gold/40 text-muted-foreground hover:text-foreground"
                  )}
                >
                  {opt}
                </motion.button>
              ))}
            </div>
          )}

          {!meta?.semantic && question?.question_type === "checkbox" && (
            <div className="space-y-2">
              {question.options?.map((opt, j) => {
                const checked = (answers[question.id] || "").split("|||").includes(opt);
                return (
                  <button
                    key={j}
                    type="button"
                    onClick={() => toggleCheckbox(question.id, opt)}
                    className={cn(
                      "w-full text-left rounded-xl border p-3.5 text-sm transition-all",
                      checked
                        ? "border-gold bg-gold/10 text-foreground"
                        : "border-border hover:border-gold/40 text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {opt}
                  </button>
                );
              })}
            </div>
          )}

          {!meta?.semantic && question?.question_type === "select" && (
            <select
              value={answers[question.id] || ""}
              onChange={(e) => setAnswer(question.id, e.target.value)}
              className="w-full rounded-lg border border-border bg-card p-2.5 text-sm text-foreground focus:border-gold focus:outline-none"
            >
              <option value="">{INTAKE_COPY.form.selectPlaceholder}</option>
              {question.options?.map((opt, j) => (
                <option key={j} value={opt}>{opt}</option>
              ))}
            </select>
          )}

          {!meta?.semantic && question?.question_type === "text" && (
            <Input
              value={answers[question.id] || ""}
              onChange={(e) => setAnswer(question.id, e.target.value)}
              placeholder={INTAKE_COPY.form.textPlaceholder}
            />
          )}

          {!meta?.semantic && question?.question_type === "textarea" && (
            <textarea
              value={answers[question.id] || ""}
              onChange={(e) => setAnswer(question.id, e.target.value)}
              placeholder={INTAKE_COPY.form.textPlaceholder}
              rows={4}
              className="w-full rounded-lg border border-border bg-card p-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-gold focus:outline-none resize-none"
            />
          )}

          {!meta?.semantic && question?.question_type === "rating" && (
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((s) => (
                <button key={s} type="button" onClick={() => setAnswer(question.id, String(s))}>
                  <Star
                    className={cn(
                      "h-8 w-8 transition-colors",
                      parseInt(answers[question.id] || "0") >= s
                        ? "text-amber-400 fill-amber-400"
                        : "text-muted-foreground/30"
                    )}
                  />
                </button>
              ))}
            </div>
          )}

          {error && (
            <p className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-700 dark:text-red-300">
              {error}
            </p>
          )}

          {/* Điều hướng */}
          <div className="flex items-center gap-2 pt-2">
            {D.showBackButton && step > 0 && (
              <Button variant="ghost" onClick={handleBack} className="text-muted-foreground">
                <ArrowLeft className="h-4 w-4 mr-1" /> {INTAKE_COPY.form.back}
              </Button>
            )}
            <div className="ml-auto flex items-center gap-2">
              {skippable && !hasAnswer && (
                <Button
                  variant="ghost"
                  onClick={handleSkip}
                  className="text-muted-foreground hover:text-foreground"
                >
                  {INTAKE_COPY.form.skip}
                </Button>
              )}
              <Button
                onClick={advance}
                disabled={!hasAnswer && !skippable}
                className="bg-gold hover:bg-gold/90 text-black font-semibold"
              >
                {step === questions.length - 1 ? INTAKE_COPY.form.finish : INTAKE_COPY.form.next}
                <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
