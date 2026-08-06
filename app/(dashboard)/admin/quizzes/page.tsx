"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Pencil,
  Trash2,
  CheckCircle2,
  ClipboardCheck,
  Link2,
  BookOpen,
  BarChart3,
  Route,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import {
  type QuizRow,
  type StageOption,
  type LessonOption,
  listQuizzes,
  getAttemptCounts,
  createQuiz,
  deleteQuiz,
  getStageOptions,
  getLessonOptions,
  attachQuizToStage,
  validateQuizQuestions,
} from "@/lib/api-quizzes";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageTransition } from "@/components/shared/PageTransition";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";

function genId(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}

export default function AdminQuizzesPage() {
  const [quizzes, setQuizzes] = useState<QuizRow[]>([]);
  const [attemptCounts, setAttemptCounts] = useState<Record<string, number>>({});
  const [stages, setStages] = useState<StageOption[]>([]);
  const [lessons, setLessons] = useState<LessonOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [toastError, setToastError] = useState(false);

  // Dialog tạo quiz
  const [createOpen, setCreateOpen] = useState(false);
  const [quizData, setQuizData] = useState({ title: "", pass_score: 70 });

  // Dialog gắn quiz vào chặng
  const [attachQuiz, setAttachQuiz] = useState<QuizRow | null>(null);
  const [attachStageId, setAttachStageId] = useState("");

  useEffect(() => { loadData(); }, []);
  useEffect(() => { if (toast) { const t = setTimeout(() => { setToast(null); setToastError(false); }, 4000); return () => clearTimeout(t); } }, [toast]);

  function showToast(msg: string, isError = false) {
    setToast(msg);
    setToastError(isError);
  }

  async function loadData() {
    const [q, counts, st, ls] = await Promise.all([
      listQuizzes(),
      getAttemptCounts(),
      getStageOptions(),
      getLessonOptions(),
    ]);
    setQuizzes(q);
    setAttemptCounts(counts);
    setStages(st);
    setLessons(ls);
    setLoading(false);
  }

  function stagesOf(quizId: string): StageOption[] {
    return stages.filter((s) => s.quiz_id === quizId);
  }

  function lessonLabelOf(lessonId: string | null): string | null {
    if (!lessonId) return null;
    return lessons.find((l) => l.id === lessonId)?.label || lessonId;
  }

  async function handleCreate() {
    setSaving(true);
    const { error } = await createQuiz(genId("quiz"), quizData.title, quizData.pass_score);
    setSaving(false);
    if (error) { showToast("Lỗi: " + error, true); return; }
    setCreateOpen(false);
    setQuizData({ title: "", pass_score: 70 });
    showToast("Tạo quiz thành công! Bấm Chỉnh sửa để thêm câu hỏi.");
    loadData();
  }

  async function handleDelete(quiz: QuizRow) {
    const attempts = attemptCounts[quiz.id] || 0;
    if (attempts > 0) {
      // Dữ liệu lượt làm là tích luỹ — không bao giờ xoá (đã chốt trong plan)
      showToast(`Quiz đã có ${attempts} lượt làm — không thể xoá để giữ dữ liệu học viên.`, true);
      return;
    }
    if (!confirm(`Xoá quiz "${quiz.title}"?`)) return;
    const { error } = await deleteQuiz(quiz.id);
    if (error) { showToast("Lỗi: " + error, true); return; }
    showToast("Đã xoá quiz");
    loadData();
  }

  function openAttachDialog(quiz: QuizRow) {
    const err = validateQuizQuestions(quiz.questions || []);
    if (err) { showToast("Chưa gắn được: " + err, true); return; }
    setAttachQuiz(quiz);
    setAttachStageId(stages[0]?.id || "");
  }

  async function handleAttach() {
    if (!attachQuiz || !attachStageId) return;
    setSaving(true);
    const { error } = await attachQuizToStage(attachStageId, attachQuiz.id);
    setSaving(false);
    if (error) { showToast("Lỗi: " + error, true); return; }
    const stageTitle = stages.find((s) => s.id === attachStageId)?.title || attachStageId;
    setAttachQuiz(null);
    showToast(`Đã gắn "${attachQuiz.title}" vào chặng ${stageTitle}!`);
    loadData();
  }

  if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><div className="text-muted-foreground">Đang tải...</div></div>;

  return (
    <PageTransition>
      <div className="space-y-6">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold"><span className="gold-gradient-text">Quiz</span></h1>
            <p className="text-muted-foreground mt-1">Tạo quiz trắc nghiệm, gắn vào bài học hoặc chặng lộ trình</p>
          </div>
          <Button onClick={() => setCreateOpen(true)} className="bg-gold hover:bg-gold/90 text-black font-semibold">
            <Plus className="h-4 w-4 mr-2" /> Tạo quiz
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

        {/* Empty */}
        {quizzes.length === 0 && (
          <Card className="py-16">
            <CardContent className="flex flex-col items-center gap-4 text-center">
              <div className="w-16 h-16 rounded-full bg-gold/10 flex items-center justify-center">
                <ClipboardCheck className="h-7 w-7 text-gold" />
              </div>
              <p className="font-semibold text-foreground">Chưa có quiz nào</p>
              <p className="text-sm text-muted-foreground">Bấm "Tạo quiz" để bắt đầu</p>
            </CardContent>
          </Card>
        )}

        {/* Quiz list */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {quizzes.map((quiz, i) => {
            const attachedStages = stagesOf(quiz.id);
            const lessonLabel = lessonLabelOf(quiz.lesson_id);
            const nQuestions = (quiz.questions || []).length;
            return (
              <motion.div key={quiz.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                <Card className="h-full hover:border-gold/40 transition-all group">
                  <CardContent className="pt-5 space-y-4 flex flex-col h-full">
                    {/* Badges */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="outline" className={cn(
                        nQuestions > 0
                          ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30"
                          : "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30"
                      )}>
                        {nQuestions > 0 ? `${nQuestions} câu hỏi` : "Chưa có câu hỏi"}
                      </Badge>
                      <Badge variant="outline" className="bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-500/30">
                        Đạt ≥ {quiz.pass_score}
                      </Badge>
                    </div>

                    {/* Title + attachments */}
                    <div className="flex-1">
                      <h3 className="font-semibold text-foreground group-hover:text-gold transition-colors">{quiz.title}</h3>
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {lessonLabel && (
                          <Badge variant="outline" className="bg-gold/10 text-gold border-gold/40 text-[10px]">
                            <BookOpen className="h-3 w-3 mr-1" /> {lessonLabel}
                          </Badge>
                        )}
                        {attachedStages.map((s) => (
                          <Badge key={s.id} variant="outline" className="bg-gold/10 text-gold border-gold/40 text-[10px]">
                            <Route className="h-3 w-3 mr-1" /> Chặng: {s.title}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <BarChart3 className="h-3.5 w-3.5" /> {attemptCounts[quiz.id] || 0} lượt làm
                      </span>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1.5 pt-2 border-t border-border">
                      <Link href={`/admin/quizzes/${quiz.id}`} className="flex-1">
                        <Button size="sm" variant="outline" className="w-full border-gold/50 text-gold hover:bg-gold/10">
                          <Pencil className="h-3.5 w-3.5 mr-1" /> Chỉnh sửa
                        </Button>
                      </Link>
                      <Button size="sm" variant="outline" onClick={() => openAttachDialog(quiz)} title="Gắn vào chặng lộ trình">
                        <Link2 className="h-3.5 w-3.5" />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => handleDelete(quiz)} className="text-muted-foreground hover:text-red-500">
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Create Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Tạo quiz mới</DialogTitle>
            <DialogDescription>Tạo xong sẽ thêm câu hỏi ở bước chỉnh sửa</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <label className="text-xs font-medium text-muted-foreground">Tên quiz *</label>
              <Input value={quizData.title} onChange={(e) => setQuizData({ ...quizData, title: e.target.value })} placeholder="Ví dụ: Quiz chặng Nến chủ" className="mt-1" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Điểm đạt (0–100)</label>
              <Input
                type="number"
                min={0}
                max={100}
                value={quizData.pass_score}
                onChange={(e) => setQuizData({ ...quizData, pass_score: Math.max(0, Math.min(100, Number(e.target.value) || 0)) })}
                className="mt-1"
              />
              <p className="text-[11px] text-muted-foreground mt-1">Học viên đạt từ mức này trở lên là qua. Mặc định 70.</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>Huỷ</Button>
            <Button onClick={handleCreate} disabled={!quizData.title || saving} className="bg-gold hover:bg-gold/90 text-black">
              {saving ? "Đang tạo..." : "Tạo quiz"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Attach stage Dialog */}
      <Dialog open={!!attachQuiz} onOpenChange={(open) => { if (!open) setAttachQuiz(null); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Gắn quiz vào chặng lộ trình</DialogTitle>
            <DialogDescription>
              Học viên phải đạt "{attachQuiz?.title}" mới qua được chặng này. Gắn quiz mới sẽ thay quiz cũ của chặng.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <label className="text-xs font-medium text-muted-foreground">Chặng</label>
            <select
              value={attachStageId}
              onChange={(e) => setAttachStageId(e.target.value)}
              className="w-full rounded-lg border border-border bg-card p-2.5 text-sm text-foreground focus:border-gold focus:outline-none"
            >
              {stages.length === 0 && <option value="">Chưa có chặng nào</option>}
              {stages.map((s) => (
                <option key={s.id} value={s.id}>{s.title} ({s.stage_key})</option>
              ))}
            </select>
            {(() => {
              const current = stages.find((s) => s.id === attachStageId);
              if (current?.quiz_id && current.quiz_id !== attachQuiz?.id) {
                return (
                  <p className="text-xs text-amber-600 dark:text-amber-400">
                    Chặng này đang gắn quiz khác — gắn tiếp sẽ thay thế.
                  </p>
                );
              }
              return null;
            })()}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAttachQuiz(null)}>Huỷ</Button>
            <Button onClick={handleAttach} disabled={!attachStageId || saving} className="bg-gold hover:bg-gold/90 text-black">
              {saving ? "Đang gắn..." : "Gắn vào chặng"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageTransition>
  );
}
