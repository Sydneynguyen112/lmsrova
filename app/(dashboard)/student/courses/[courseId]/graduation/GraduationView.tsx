"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import confetti from "canvas-confetti";
import {
  GraduationCap, Lock, Loader2, Send, Star, ArrowLeft,
} from "lucide-react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { useCurrentUser } from "@/lib/auth";
import { cn } from "@/lib/utils";
import { type FormQuestionRow, GRADUATION_PASS_GRADE } from "@/lib/api-forms";
import {
  getRoadmapStages,
  getStageProgress,
  checkAndCompleteStages,
  type RoadmapStage,
} from "@/lib/roadmap";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageTransition } from "@/components/shared/PageTransition";
import { GoldEcho } from "@/components/social/GoldEcho";

interface FormInfo {
  id: string;
  title: string;
  description: string | null;
  status: string;
}

type PageState =
  | "loading"
  | "locked" // chưa xong chặng video_hoan_thien
  | "no_form" // admin chưa gắn form
  | "form" // đang điền
  | "already_passed" // đã tốt nghiệp từ trước
  | "result_pass"; // vừa nộp xong

interface Props {
  courseId: string;
}

// Câu chọn một mà mọi tuỳ chọn đều là số (vd thang 1–10) → hiện dạng hàng ô số
function isNumberScale(options: string[] | null | undefined): boolean {
  return !!options && options.length >= 3 && options.every((o) => /^\d{1,2}$/.test(o.trim()));
}

export function GraduationView({ courseId }: Props) {
  const currentUser = useCurrentUser("student");
  const [pageState, setPageState] = useState<PageState>("loading");
  const [form, setForm] = useState<FormInfo | null>(null);
  const [questions, setQuestions] = useState<FormQuestionRow[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const courseHref = `/student/courses/${courseId}`;

  // ── Luồng làm bài của khoá đang mở ──
  useEffect(() => {
    if (!currentUser) return;
    let cancelled = false;

    async function load() {
      const userId = currentUser!.id;
      const [stages, progress] = await Promise.all([
        getRoadmapStages(courseId),
        getStageProgress(userId),
      ]);
      if (cancelled) return;

      const videoStage = stages.find((s: RoadmapStage) => s.stage_key === "video_hoan_thien");
      const gradStage = stages.find((s: RoadmapStage) => s.stage_key === "tot_nghiep");

      // Điều kiện mở: chặng video_hoan_thien đã completed
      const videoDone = videoStage
        ? progress.some((p) => p.stage_id === videoStage.id && p.completed_at)
        : false;
      if (!videoDone) { setPageState("locked"); return; }

      if (!gradStage?.form_id) { setPageState("no_form"); return; }

      const [{ data: f }, { data: q }, { data: passedResp }] = await Promise.all([
        supabase.from("forms").select("id, title, description, status").eq("id", gradStage.form_id).single(),
        supabase.from("form_questions").select("*").eq("form_id", gradStage.form_id).order("order_index"),
        supabase
          .from("form_responses")
          .select("id")
          .eq("form_id", gradStage.form_id)
          .eq("user_id", userId)
          .in("grade", ["tot", "xuat_sac"])
          .order("submitted_at", { ascending: true })
          .limit(1),
      ]);
      if (cancelled) return;

      if (!f || f.status !== "published") { setPageState("no_form"); return; }
      setForm(f as FormInfo);
      setQuestions((q || []) as FormQuestionRow[]);

      const passed = (passedResp || [])[0];
      if (passed) {
        setPageState("already_passed");
        return;
      }
      setPageState("form");
    }

    load();
    return () => { cancelled = true; };
  }, [currentUser, courseId]);

  // Confetti khi vừa đạt
  useEffect(() => {
    if (pageState !== "result_pass") return;
    const fire = (particleRatio: number, opts: confetti.Options) => {
      confetti({ origin: { y: 0.6 }, particleCount: Math.floor(200 * particleRatio), ...opts });
    };
    fire(0.25, { spread: 26, startVelocity: 55 });
    fire(0.2, { spread: 60 });
    fire(0.35, { spread: 100, decay: 0.91, scalar: 0.8 });
    fire(0.1, { spread: 120, startVelocity: 25, decay: 0.92, scalar: 1.2 });
    fire(0.1, { spread: 120, startVelocity: 45 });
  }, [pageState]);

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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!currentUser || !form) return;
    setError("");

    for (const q of questions) {
      if (q.required && !answers[q.id]?.trim()) {
        setError(`Vui lòng trả lời câu hỏi "${q.question_text}"`);
        return;
      }
    }

    setSubmitting(true);

    // Form tốt nghiệp = khảo sát cảm nhận, không chấm điểm: nộp là tốt nghiệp.
    // grade = GRADUATION_PASS_GRADE để engine lộ trình + view SQL nhận là đã qua chặng.
    const { data: response, error: respErr } = await supabase
      .from("form_responses")
      .insert({
        form_id: form.id,
        user_id: currentUser.id,
        respondent_name: currentUser.full_name,
        respondent_email: currentUser.email,
        respondent_phone: currentUser.phone,
        score_pct: null,
        grade: GRADUATION_PASS_GRADE,
      })
      .select()
      .single();

    if (respErr || !response) {
      setError("Có lỗi xảy ra khi nộp bài. Vui lòng thử lại.");
      setSubmitting(false);
      return;
    }

    const answerRows = questions
      .filter((q) => answers[q.id]?.trim())
      .map((q) => ({
        response_id: response.id,
        question_id: q.id,
        answer_value: answers[q.id],
      }));
    if (answerRows.length > 0) {
      await supabase.from("form_answers").insert(answerRows);
    }

    // Qua chặng + gắn tag tốt nghiệp (máy) + đóng enrollment
    await checkAndCompleteStages(currentUser.id, courseId);
    await supabase.rpc("set_student_status", {
      p_user: currentUser.id,
      p_status: "tot_nghiep",
      p_reason: "Nộp form tốt nghiệp (khảo sát cảm nhận)",
      p_by: null,
    });
    await supabase
      .from("enrollments")
      .update({ completed_at: new Date().toISOString(), status: "completed" })
      .eq("user_id", currentUser.id)
      .eq("course_id", courseId);

    setSubmitting(false);
    setPageState("result_pass");
  }

  /* ─── Render ─── */

  if (!currentUser || pageState === "loading") {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-gold" />
      </div>
    );
  }

  if (pageState === "locked") {
    return (
      <PageTransition>
        <div className="flex items-center justify-center min-h-[60vh] p-6">
          <Card className="max-w-md w-full">
            <CardContent className="py-10 flex flex-col items-center gap-4 text-center">
              <div className="w-16 h-16 rounded-full bg-gold/10 flex items-center justify-center">
                <Lock className="h-7 w-7 text-gold" />
              </div>
              <h1 className="text-xl font-bold text-foreground">Bài Tốt nghiệp chưa mở</h1>
              <p className="text-sm text-muted-foreground">
                Hoàn thành các video của khoá để mở bài tốt nghiệp. Bạn cần xong chặng
                "Video hoàn thiện" (tâm lý · quản lý vốn · nhật ký) trước khi làm bài.
              </p>
              <Link href={courseHref}>
                <Button variant="outline" className="border-gold/50 text-gold hover:bg-gold/10">
                  Tiếp tục học
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </PageTransition>
    );
  }

  if (pageState === "no_form") {
    return (
      <PageTransition>
        <div className="flex items-center justify-center min-h-[60vh] p-6">
          <Card className="max-w-md w-full">
            <CardContent className="py-10 flex flex-col items-center gap-4 text-center">
              <div className="w-16 h-16 rounded-full bg-gold/10 flex items-center justify-center">
                <GraduationCap className="h-7 w-7 text-gold" />
              </div>
              <h1 className="text-xl font-bold text-foreground">Bài Tốt nghiệp đang được chuẩn bị</h1>
              <p className="text-sm text-muted-foreground">
                Bài tốt nghiệp của khoá chưa được thiết lập. Vui lòng quay lại sau hoặc liên hệ mentor của bạn.
              </p>
              <Link href={courseHref}>
                <Button variant="ghost">← Về khoá học</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </PageTransition>
    );
  }

  // Màn chúc mừng (vừa đạt hoặc đã đạt từ trước)
  if (pageState === "result_pass" || pageState === "already_passed") {
    return (
      <PageTransition>
        <div className="flex items-center justify-center min-h-[70vh] p-6">
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
            className="text-center space-y-6 max-w-md">
            <div className="w-24 h-24 rounded-full bg-gold/10 border-2 border-gold/40 flex items-center justify-center mx-auto">
              <GraduationCap className="h-12 w-12 text-gold" />
            </div>
            <div className="space-y-2">
              <h1 className="text-3xl font-bold gold-gradient-text">Chúc mừng tốt nghiệp!</h1>
              <p className="text-muted-foreground">
                {pageState === "result_pass"
                  ? "Cảm ơn bạn đã chia sẻ cảm nhận. Bạn đã hoàn thành toàn bộ lộ trình khoá học — cả đội ROVA tự hào về bạn!"
                  : "Bạn đã gửi cảm nhận tốt nghiệp và kết thúc lộ trình khoá học."}
              </p>
            </div>
            <div className="flex items-center justify-center gap-2">
              <Link href={courseHref}>
                <Button variant="ghost">← Về khoá học</Button>
              </Link>
              <Link href="/student">
                <Button className="bg-gold hover:bg-gold/90 text-black font-semibold">
                  Về trang chủ
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </PageTransition>
    );
  }

  // Màn điền form
  return (
    <PageTransition>
      <div className="max-w-2xl mx-auto p-6 space-y-6">
        <Link
          href={courseHref}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-gold transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Về khoá học
        </Link>
        <motion.form onSubmit={handleSubmit} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          {/* Header */}
          <div className="rounded-2xl border-t-4 border-t-gold bg-card border border-border p-6 space-y-2">
            <div className="flex items-center gap-2">
              <GraduationCap className="h-6 w-6 text-gold" />
              <h1 className="text-2xl font-bold gold-gradient-text">{form?.title || "Bài Tốt nghiệp"}</h1>
            </div>
            {form?.description && <p className="text-sm text-muted-foreground">{form.description}</p>}
            <p className="text-xs text-muted-foreground">
              Chia sẻ cảm nhận của bạn về khoá học — không chấm điểm. Gửi xong là bạn chính thức tốt nghiệp.
            </p>
            <p className="text-xs text-red-400">* Bắt buộc</p>
          </div>

          {/* Tiếng vọng Bảng vàng — động lực đúng thời điểm trước cửa ải cuối */}
          <GoldEcho />

          {/* Questions */}
          {questions.map((q, i) => (
            <motion.div key={q.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
              className="rounded-2xl bg-card border border-border p-6 space-y-3">
              <label className="text-sm font-medium text-foreground">
                Câu {i + 1}. {q.question_text} {q.required && <span className="text-red-400">*</span>}
              </label>

              {q.question_type === "text" && (
                <Input value={answers[q.id] || ""} onChange={(e) => setAnswer(q.id, e.target.value)} placeholder="Câu trả lời của bạn" />
              )}

              {q.question_type === "textarea" && (
                <textarea
                  value={answers[q.id] || ""}
                  onChange={(e) => setAnswer(q.id, e.target.value)}
                  placeholder="Câu trả lời của bạn"
                  rows={4}
                  className="w-full rounded-lg border border-border bg-card p-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-gold focus:outline-none resize-none"
                />
              )}

              {q.question_type === "radio" && isNumberScale(q.options) && (
                <div className="flex flex-wrap gap-2">
                  {q.options?.map((opt, j) => (
                    <button key={j} type="button" onClick={() => setAnswer(q.id, opt)} className={cn(
                      "h-10 w-10 rounded-xl border text-sm font-medium tabular-nums transition-all",
                      answers[q.id] === opt ? "border-gold bg-gold/15 text-gold" : "border-border text-foreground hover:border-gold/30"
                    )}>
                      {opt}
                    </button>
                  ))}
                </div>
              )}

              {q.question_type === "radio" && !isNumberScale(q.options) && (
                <div className="space-y-2">
                  {q.options?.map((opt, j) => (
                    <label key={j} className={cn(
                      "flex items-center gap-3 rounded-xl border p-3 text-sm cursor-pointer transition-all",
                      answers[q.id] === opt ? "border-gold bg-gold/10" : "border-border hover:border-gold/30"
                    )}>
                      <input type="radio" name={q.id} value={opt} checked={answers[q.id] === opt} onChange={() => setAnswer(q.id, opt)} className="accent-gold" />
                      {opt}
                    </label>
                  ))}
                </div>
              )}

              {q.question_type === "checkbox" && (
                <div className="space-y-2">
                  {q.options?.map((opt, j) => {
                    const checked = (answers[q.id] || "").split("|||").includes(opt);
                    return (
                      <label key={j} className={cn(
                        "flex items-center gap-3 rounded-xl border p-3 text-sm cursor-pointer transition-all",
                        checked ? "border-gold bg-gold/10" : "border-border hover:border-gold/30"
                      )}>
                        <input type="checkbox" checked={checked} onChange={() => toggleCheckbox(q.id, opt)} className="accent-gold" />
                        {opt}
                      </label>
                    );
                  })}
                </div>
              )}

              {q.question_type === "select" && (
                <select
                  value={answers[q.id] || ""}
                  onChange={(e) => setAnswer(q.id, e.target.value)}
                  className="w-full rounded-lg border border-border bg-card p-2.5 text-sm text-foreground focus:border-gold focus:outline-none"
                >
                  <option value="">Chọn...</option>
                  {q.options?.map((opt, j) => <option key={j} value={opt}>{opt}</option>)}
                </select>
              )}

              {q.question_type === "rating" && (
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <button key={s} type="button" onClick={() => setAnswer(q.id, String(s))}>
                      <Star className={cn("h-8 w-8 transition-colors", parseInt(answers[q.id] || "0") >= s ? "text-amber-400 fill-amber-400" : "text-muted-foreground/30")} />
                    </button>
                  ))}
                </div>
              )}
            </motion.div>
          ))}

          {/* Error */}
          {error && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-700 dark:text-red-300">
              {error}
            </motion.div>
          )}

          {/* Submit */}
          <Button type="submit" disabled={submitting} className="bg-gold hover:bg-gold/90 text-black font-semibold py-6 rounded-xl text-base w-full">
            {submitting ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : <Send className="h-5 w-5 mr-2" />}
            {submitting ? "Đang gửi..." : "Gửi cảm nhận & tốt nghiệp"}
          </Button>
        </motion.form>
      </div>
    </PageTransition>
  );
}
