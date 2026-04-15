"use client";

import { useState, useEffect, use } from "react";
import { motion } from "framer-motion";
import { CheckCircle2, Star, Send, Loader2 } from "lucide-react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface Form {
  id: string;
  title: string;
  description: string | null;
  form_type: string;
  status: string;
}

interface Question {
  id: string;
  question_text: string;
  question_type: string;
  options: string[];
  required: boolean;
  order_index: number;
}

export default function PublicFormPage({ params }: { params: Promise<{ formId: string }> }) {
  const { formId } = use(params);
  const [form, setForm] = useState<Form | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [info, setInfo] = useState({ name: "", email: "", phone: "" });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      const [{ data: f }, { data: q }] = await Promise.all([
        supabase.from("forms").select("*").eq("id", formId).eq("status", "published").single(),
        supabase.from("form_questions").select("*").eq("form_id", formId).order("order_index"),
      ]);
      if (f) setForm(f as Form);
      setQuestions((q || []) as Question[]);
      setLoading(false);
    }
    load();
  }, [formId]);

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
    setError("");

    // Validate required
    for (const q of questions) {
      if (q.required && !answers[q.id]?.trim()) {
        setError(`Vui lòng trả lời câu hỏi "${q.question_text}"`);
        return;
      }
    }

    setSubmitting(true);

    // Create response
    const { data: response, error: respErr } = await supabase
      .from("form_responses")
      .insert({
        form_id: formId,
        respondent_name: info.name || null,
        respondent_email: info.email || null,
        respondent_phone: info.phone || null,
      })
      .select()
      .single();

    if (respErr || !response) {
      setError("Có lỗi xảy ra. Vui lòng thử lại.");
      setSubmitting(false);
      return;
    }

    // Create answers
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

    setSubmitting(false);
    setSubmitted(true);
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--neutral-bg)] dark:bg-[var(--dark-bg)] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[var(--gold-primary)]" />
      </div>
    );
  }

  if (!form) {
    return (
      <div className="min-h-screen bg-[var(--neutral-bg)] dark:bg-[var(--dark-bg)] flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-lg font-semibold text-foreground">Biểu mẫu không tồn tại hoặc chưa được xuất bản.</p>
          <Link href="/" className="text-sm text-[var(--gold-primary)] hover:underline">Về trang chủ</Link>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-[var(--neutral-bg)] dark:bg-[var(--dark-bg)] flex items-center justify-center p-4">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center space-y-6 max-w-md">
          <div className="w-20 h-20 rounded-full bg-emerald-500/10 border-2 border-emerald-500/30 flex items-center justify-center mx-auto">
            <CheckCircle2 className="h-10 w-10 text-emerald-500" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-foreground">Cảm ơn bạn!</h2>
            <p className="text-muted-foreground mt-2">Câu trả lời của bạn đã được ghi nhận. Cảm ơn bạn đã dành thời gian.</p>
          </div>
          <Link href="/">
            <Button variant="outline" className="border-[var(--gold-primary)]/50 text-[var(--gold-primary)]">Về trang chủ ROVA</Button>
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--neutral-bg)] dark:bg-[var(--dark-bg)]">
      {/* Top bar */}
      <div className="border-b border-[var(--border-light)] dark:border-[var(--dark-border)] bg-white/80 dark:bg-[var(--dark-surface)]/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/" className="text-lg font-bold" style={{ color: "var(--gold-primary)" }}>ROVA</Link>
          <span className="text-xs text-muted-foreground">Biểu mẫu khảo sát</span>
        </div>
      </div>

      {/* Form */}
      <div className="max-w-2xl mx-auto px-4 py-8">
        <motion.form onSubmit={handleSubmit} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          {/* Header */}
          <div className="rounded-2xl border-t-4 bg-white dark:bg-[var(--dark-surface)] border border-[var(--border-light)] dark:border-[var(--dark-border)] p-6 space-y-2"
            style={{ borderTopColor: "var(--gold-primary)" }}>
            <h1 className="text-2xl font-bold text-foreground">{form.title}</h1>
            {form.description && <p className="text-sm text-muted-foreground">{form.description}</p>}
            <p className="text-xs text-red-400">* Bắt buộc</p>
          </div>

          {/* Contact info */}
          <div className="rounded-2xl bg-white dark:bg-[var(--dark-surface)] border border-[var(--border-light)] dark:border-[var(--dark-border)] p-6 space-y-4">
            <p className="text-sm font-medium text-foreground">Thông tin của bạn</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted-foreground">Họ tên</label>
                <Input value={info.name} onChange={(e) => setInfo({ ...info, name: e.target.value })} placeholder="Nguyễn Văn A" className="mt-1" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Email</label>
                <Input type="email" value={info.email} onChange={(e) => setInfo({ ...info, email: e.target.value })} placeholder="email@example.com" className="mt-1" />
              </div>
            </div>
            <div className="md:w-1/2">
              <label className="text-xs text-muted-foreground">Số điện thoại</label>
              <Input value={info.phone} onChange={(e) => setInfo({ ...info, phone: e.target.value })} placeholder="0901234567" className="mt-1" />
            </div>
          </div>

          {/* Questions */}
          {questions.map((q, i) => (
            <motion.div key={q.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              className="rounded-2xl bg-white dark:bg-[var(--dark-surface)] border border-[var(--border-light)] dark:border-[var(--dark-border)] p-6 space-y-3">
              <label className="text-sm font-medium text-foreground">
                {q.question_text} {q.required && <span className="text-red-400">*</span>}
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
                  className="w-full rounded-lg border border-border bg-card p-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-[var(--gold-primary)] focus:outline-none resize-none"
                />
              )}

              {q.question_type === "radio" && (
                <div className="space-y-2">
                  {q.options?.map((opt, j) => (
                    <label key={j} className={cn(
                      "flex items-center gap-3 rounded-xl border p-3 text-sm cursor-pointer transition-all",
                      answers[q.id] === opt ? "border-[var(--gold-primary)] bg-[var(--gold-primary)]/10" : "border-border hover:border-[var(--gold-primary)]/30"
                    )}>
                      <input type="radio" name={q.id} value={opt} checked={answers[q.id] === opt} onChange={() => setAnswer(q.id, opt)} className="accent-[var(--gold-primary)]" />
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
                        checked ? "border-[var(--gold-primary)] bg-[var(--gold-primary)]/10" : "border-border hover:border-[var(--gold-primary)]/30"
                      )}>
                        <input type="checkbox" checked={checked} onChange={() => toggleCheckbox(q.id, opt)} className="accent-[var(--gold-primary)]" />
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
                  className="w-full rounded-lg border border-border bg-card p-2.5 text-sm text-foreground focus:border-[var(--gold-primary)] focus:outline-none"
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
          <Button type="submit" disabled={submitting} className="bg-[var(--gold-primary)] hover:opacity-90 text-black font-semibold py-6 rounded-xl text-base w-full">
            {submitting ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : <Send className="h-5 w-5 mr-2" />}
            {submitting ? "Đang gửi..." : "Gửi câu trả lời"}
          </Button>
        </motion.form>
      </div>
    </div>
  );
}
