"use client";

import { useState, useEffect, use } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, Plus, Save, Trash2, ChevronUp, ChevronDown, X, CheckCircle2, CircleDot,
} from "lucide-react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";
import {
  type QuizRow,
  type QuizQuestion,
  type LessonOption,
  updateQuiz,
  getLessonOptions,
  validateQuizQuestions,
} from "@/lib/api-quizzes";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageTransition } from "@/components/shared/PageTransition";

const MAX_OPTIONS = 6;

export default function AdminQuizEditorPage({ params }: { params: Promise<{ quizId: string }> }) {
  const { quizId } = use(params);
  const [quiz, setQuiz] = useState<QuizRow | null>(null);
  const [lessons, setLessons] = useState<LessonOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [toastError, setToastError] = useState(false);

  useEffect(() => {
    async function load() {
      const [{ data }, ls] = await Promise.all([
        supabase.from("quizzes").select("*").eq("id", quizId).maybeSingle(),
        getLessonOptions(),
      ]);
      setQuiz(data as QuizRow | null);
      setLessons(ls);
      setLoading(false);
    }
    load();
  }, [quizId]);

  useEffect(() => { if (toast) { const t = setTimeout(() => { setToast(null); setToastError(false); }, 4000); return () => clearTimeout(t); } }, [toast]);

  function showToast(msg: string, isError = false) {
    setToast(msg);
    setToastError(isError);
  }

  function patch(p: Partial<QuizRow>) {
    if (!quiz) return;
    setQuiz({ ...quiz, ...p });
    setDirty(true);
  }

  function patchQuestion(idx: number, p: Partial<QuizQuestion>) {
    if (!quiz) return;
    const questions = quiz.questions.map((q, i) => (i === idx ? { ...q, ...p } : q));
    patch({ questions });
  }

  function addQuestion() {
    if (!quiz) return;
    patch({ questions: [...quiz.questions, { question: "", options: ["", ""], correct: 0 }] });
  }

  function removeQuestion(idx: number) {
    if (!quiz) return;
    patch({ questions: quiz.questions.filter((_, i) => i !== idx) });
  }

  function moveQuestion(idx: number, dir: -1 | 1) {
    if (!quiz) return;
    const target = idx + dir;
    if (target < 0 || target >= quiz.questions.length) return;
    const questions = [...quiz.questions];
    [questions[idx], questions[target]] = [questions[target], questions[idx]];
    patch({ questions });
  }

  function addOption(qIdx: number) {
    if (!quiz) return;
    const q = quiz.questions[qIdx];
    if (q.options.length >= MAX_OPTIONS) return;
    patchQuestion(qIdx, { options: [...q.options, ""] });
  }

  function removeOption(qIdx: number, oIdx: number) {
    if (!quiz) return;
    const q = quiz.questions[qIdx];
    if (q.options.length <= 2) return;
    const options = q.options.filter((_, i) => i !== oIdx);
    // Giữ đáp án đúng trỏ vào đúng nội dung cũ sau khi xoá 1 lựa chọn
    let correct = q.correct;
    if (oIdx === q.correct) correct = 0;
    else if (oIdx < q.correct) correct = q.correct - 1;
    patchQuestion(qIdx, { options, correct });
  }

  function setOptionText(qIdx: number, oIdx: number, text: string) {
    if (!quiz) return;
    const q = quiz.questions[qIdx];
    patchQuestion(qIdx, { options: q.options.map((o, i) => (i === oIdx ? text : o)) });
  }

  async function handleSave() {
    if (!quiz) return;
    if (!quiz.title.trim()) { showToast("Tên quiz không được để trống.", true); return; }
    const err = validateQuizQuestions(quiz.questions);
    if (err && quiz.questions.length > 0) { showToast(err, true); return; }
    setSaving(true);
    const { error } = await updateQuiz(quiz.id, {
      title: quiz.title.trim(),
      pass_score: quiz.pass_score,
      lesson_id: quiz.lesson_id,
      questions: quiz.questions,
    });
    setSaving(false);
    if (error) { showToast("Lỗi: " + error, true); return; }
    setDirty(false);
    showToast("Đã lưu quiz!");
  }

  if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><div className="text-muted-foreground">Đang tải...</div></div>;

  if (!quiz) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <p className="text-muted-foreground">Không tìm thấy quiz này.</p>
        <Link href="/admin/quizzes"><Button variant="outline"><ArrowLeft className="h-4 w-4 mr-2" /> Về danh sách quiz</Button></Link>
      </div>
    );
  }

  return (
    <PageTransition>
      <div className="space-y-6 max-w-3xl">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <Link href="/admin/quizzes">
              <Button size="sm" variant="outline"><ArrowLeft className="h-4 w-4" /></Button>
            </Link>
            <h1 className="text-xl md:text-2xl font-bold truncate"><span className="gold-gradient-text">{quiz.title || "Quiz"}</span></h1>
          </div>
          <Button onClick={handleSave} disabled={saving || !dirty} className="bg-gold hover:bg-gold/90 text-black font-semibold shrink-0">
            <Save className="h-4 w-4 mr-2" /> {saving ? "Đang lưu..." : dirty ? "Lưu thay đổi" : "Đã lưu"}
          </Button>
        </motion.div>

        {/* Toast */}
        <AnimatePresence>
          {toast && (
            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
              className={cn(
                "flex items-center gap-2 rounded-lg border p-3 text-sm",
                toastError
                  ? "bg-red-500/10 border-red-500/30 text-red-700 dark:text-red-400"
                  : "bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-400"
              )}>
              <CheckCircle2 className="h-4 w-4 shrink-0" />{toast}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Cài đặt chung */}
        <Card>
          <CardContent className="pt-5 space-y-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground">Tên quiz *</label>
              <Input value={quiz.title} onChange={(e) => patch({ title: e.target.value })} className="mt-1" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-muted-foreground">Điểm đạt (0–100)</label>
                <Input
                  type="number"
                  min={0}
                  max={100}
                  value={quiz.pass_score}
                  onChange={(e) => patch({ pass_score: Math.max(0, Math.min(100, Number(e.target.value) || 0)) })}
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Gắn vào bài học (tuỳ chọn)</label>
                <select
                  value={quiz.lesson_id || ""}
                  onChange={(e) => patch({ lesson_id: e.target.value || null })}
                  className="mt-1 w-full rounded-lg border border-border bg-card p-2 text-sm text-foreground focus:border-gold focus:outline-none"
                >
                  <option value="">— Không gắn bài học —</option>
                  {lessons.map((l) => (
                    <option key={l.id} value={l.id}>{l.label}</option>
                  ))}
                </select>
                <p className="text-[11px] text-muted-foreground mt-1">Quiz gắn bài học sẽ hiện sau khi học viên xem xong bài đó.</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Câu hỏi */}
        <div className="space-y-4">
          {quiz.questions.map((q, qIdx) => (
            <motion.div key={qIdx} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
              <Card>
                <CardContent className="pt-5 space-y-3">
                  <div className="flex items-start gap-2">
                    <span className="mt-2 text-sm font-semibold text-gold shrink-0">Câu {qIdx + 1}</span>
                    <textarea
                      value={q.question}
                      onChange={(e) => patchQuestion(qIdx, { question: e.target.value })}
                      placeholder="Nhập nội dung câu hỏi..."
                      rows={2}
                      className="flex-1 rounded-lg border border-border bg-card p-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-gold focus:outline-none resize-none"
                    />
                    <div className="flex flex-col gap-1 shrink-0">
                      <Button size="sm" variant="ghost" onClick={() => moveQuestion(qIdx, -1)} disabled={qIdx === 0}><ChevronUp className="h-3.5 w-3.5" /></Button>
                      <Button size="sm" variant="ghost" onClick={() => moveQuestion(qIdx, 1)} disabled={qIdx === quiz.questions.length - 1}><ChevronDown className="h-3.5 w-3.5" /></Button>
                      <Button size="sm" variant="ghost" onClick={() => removeQuestion(qIdx)} className="text-muted-foreground hover:text-red-500"><Trash2 className="h-3.5 w-3.5" /></Button>
                    </div>
                  </div>

                  {/* Đáp án — bấm chấm tròn để chọn đáp án đúng */}
                  <div className="space-y-2 pl-2">
                    {q.options.map((opt, oIdx) => (
                      <div key={oIdx} className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => patchQuestion(qIdx, { correct: oIdx })}
                          title="Chọn làm đáp án đúng"
                          className={cn(
                            "shrink-0 rounded-full p-1 transition-colors",
                            q.correct === oIdx ? "text-emerald-500" : "text-muted-foreground hover:text-gold"
                          )}
                        >
                          {q.correct === oIdx ? <CheckCircle2 className="h-4 w-4" /> : <CircleDot className="h-4 w-4" />}
                        </button>
                        <Input
                          value={opt}
                          onChange={(e) => setOptionText(qIdx, oIdx, e.target.value)}
                          placeholder={`Đáp án ${oIdx + 1}`}
                          className={cn(q.correct === oIdx && "border-emerald-500/50")}
                        />
                        <Button size="sm" variant="ghost" onClick={() => removeOption(qIdx, oIdx)} disabled={q.options.length <= 2} className="text-muted-foreground hover:text-red-500 shrink-0">
                          <X className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    ))}
                    <div className="flex items-center justify-between">
                      <Button size="sm" variant="outline" onClick={() => addOption(qIdx)} disabled={q.options.length >= MAX_OPTIONS}>
                        <Plus className="h-3.5 w-3.5 mr-1" /> Thêm đáp án
                      </Button>
                      <p className="text-[11px] text-muted-foreground">Chấm xanh = đáp án đúng</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}

          <Button variant="outline" onClick={addQuestion} className="w-full border-dashed border-gold/40 text-gold hover:bg-gold/10">
            <Plus className="h-4 w-4 mr-2" /> Thêm câu hỏi
          </Button>
        </div>
      </div>
    </PageTransition>
  );
}
