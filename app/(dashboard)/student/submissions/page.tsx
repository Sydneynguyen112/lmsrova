"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileText,
  ImagePlus,
  X,
  Send,
  CheckCircle2,
  Clock,
  Circle,
  MessageSquare,
  FileDown,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  HelpCircle,
} from "lucide-react";
import { getAssignmentsByCourse, getSubmissionsByUser } from "@/lib/api";
import {
  createSubmissionWithImages,
  getSubmissionImagesByUser,
  getQuizzesByIds,
  type SubmissionImageRow,
  type QuizRow,
} from "@/lib/api-student";
import {
  checkAndCompleteStages,
  getImageCountsByAssignment,
  getPassedQuizIds,
  getRoadmapStages,
  getStageProgress,
  type ImageCounts,
  type RoadmapStage,
  type StageProgressRow,
} from "@/lib/roadmap";
import { QuizSection } from "@/app/(dashboard)/student/courses/[courseId]/[lessonId]/LessonPlayerView";
import { cn, formatDate } from "@/lib/utils";
import { supabase } from "@/lib/supabase";
import { useCurrentUser } from "@/lib/auth";
import { PageTransition } from "@/components/shared/PageTransition";
import { LockedFeature } from "@/components/shared/LockedFeature";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const MAX_MODELS = 5;
const COURSE_ID = "c-mov3c81m-fdq2";

interface ModelSlot {
  image: string; // data URL (lưu thẳng vào DB — pattern avatar hiện có)
  note: string;
}

interface AssignmentRow {
  id: string;
  course_id: string;
  title: string;
  description: string | null;
  instructions: string | null;
  materials: { name: string; url: string; type: string }[];
  order_index: number;
}

interface SubmissionRow {
  id: string;
  assignment_id: string;
  user_id: string;
  mentor_feedback: string | null;
  graded_at: string | null;
  submitted_at: string;
}

function emptySlots(): ModelSlot[] {
  return Array.from({ length: MAX_MODELS }, () => ({ image: "", note: "" }));
}

// Resize ảnh về data URL (jpeg) — pattern giống upload avatar trong ProfileEditor
function resizeToDataUrl(file: File, maxSize = 1280): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Không đọc được file ảnh"));
    reader.onload = (e) => {
      const img = new Image();
      img.onerror = () => reject(new Error("File không phải ảnh hợp lệ"));
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let w = img.width;
        let h = img.height;
        if (w > maxSize || h > maxSize) {
          if (w > h) {
            h = (h / w) * maxSize;
            w = maxSize;
          } else {
            w = (w / h) * maxSize;
            h = maxSize;
          }
        }
        canvas.width = w;
        canvas.height = h;
        canvas.getContext("2d")!.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL("image/jpeg", 0.82));
      };
      img.src = e.target!.result as string;
    };
    reader.readAsDataURL(file);
  });
}

export default function StudentSubmissionsPage() {
  const currentUser = useCurrentUser("student");
  const [proAssignments, setProAssignments] = useState<AssignmentRow[]>([]);
  const [mySubmissions, setMySubmissions] = useState<SubmissionRow[]>([]);

  const [activeAssignment, setActiveAssignment] = useState<string | null>(null);
  const [models, setModels] = useState<ModelSlot[]>(emptySlots());
  const [instructionsOpen, setInstructionsOpen] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [hasEnrollment, setHasEnrollment] = useState<boolean | null>(null);

  // ─── Dữ liệu chặng (Phase 02) ───
  const [stages, setStages] = useState<RoadmapStage[]>([]);
  const [stageProgress, setStageProgress] = useState<StageProgressRow[]>([]);
  const [imageCounts, setImageCounts] = useState<Map<string, ImageCounts>>(new Map());
  const [myImages, setMyImages] = useState<SubmissionImageRow[]>([]);
  const [passedQuizIds, setPassedQuizIds] = useState<Set<string>>(new Set());
  const [stageQuizzes, setStageQuizzes] = useState<Map<string, QuizRow>>(new Map());

  const refreshStageData = useCallback(async () => {
    if (!currentUser) return;
    const [counts, images, passed, progress] = await Promise.all([
      getImageCountsByAssignment(currentUser.id),
      getSubmissionImagesByUser(currentUser.id),
      getPassedQuizIds(currentUser.id),
      getStageProgress(currentUser.id),
    ]);
    setImageCounts(counts);
    setMyImages(images);
    setPassedQuizIds(passed);
    setStageProgress(progress);
  }, [currentUser]);

  useEffect(() => {
    if (!currentUser) return;
    async function check() {
      const [{ data }, assignments, submissions, stagesData] = await Promise.all([
        supabase
          .from("enrollments")
          .select("id")
          .eq("user_id", currentUser!.id)
          .limit(1),
        getAssignmentsByCourse(COURSE_ID),
        getSubmissionsByUser(currentUser!.id),
        getRoadmapStages(COURSE_ID),
      ]);
      setHasEnrollment((data ?? []).length > 0);
      setProAssignments(assignments as AssignmentRow[]);
      setMySubmissions(submissions as SubmissionRow[]);
      setStages(stagesData);

      // Quiz CHẶNG lấy từ roadmap_stages.quiz_id (KHÔNG phải quizzes.lesson_id)
      const quizIds = stagesData
        .filter((s) => s.completion_type === "assignment_quiz" && s.quiz_id)
        .map((s) => s.quiz_id as string);
      const quizMap = await getQuizzesByIds(quizIds);
      const byStage = new Map<string, QuizRow>();
      for (const s of stagesData) {
        if (s.quiz_id && quizMap.has(s.quiz_id)) byStage.set(s.id, quizMap.get(s.quiz_id)!);
      }
      setStageQuizzes(byStage);

      await refreshStageData();
    }
    check();
  }, [currentUser, refreshStageData]);

  if (!currentUser || hasEnrollment === null) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-muted-foreground">Đang tải...</div>
      </div>
    );
  }

  if (!hasEnrollment) {
    return (
      <LockedFeature
        title="Bài nộp"
        description="Tính năng nộp bài tập sẽ được mở khi bạn đăng ký khoá học."
      />
    );
  }

  const selected = proAssignments.find((a) => a.id === activeAssignment);

  const stageOfAssignment = (assignmentId: string): RoadmapStage | undefined =>
    stages.find(
      (s) => s.completion_type === "assignment_quiz" && s.assignment_id === assignmentId
    );

  const countsOf = (assignmentId: string): ImageCounts =>
    imageCounts.get(assignmentId) || { correct: 0, pending: 0, incorrect: 0 };

  const isStageCompleted = (stage: RoadmapStage): boolean =>
    stageProgress.some((p) => p.stage_id === stage.id && p.completed_at);

  function getStatus(assignmentId: string) {
    const subs = mySubmissions.filter((s) => s.assignment_id === assignmentId);
    if (subs.length === 0) return "empty";
    if (subs.some((s) => s.graded_at)) return "graded";
    return "pending";
  }

  function openAssignment(id: string) {
    setActiveAssignment(id);
    setModels(emptySlots());
    setSubmitted(false);
    setInstructionsOpen(false);
  }

  function updateModel(index: number, field: keyof ModelSlot, value: string) {
    setModels((prev) => prev.map((m, i) => (i === index ? { ...m, [field]: value } : m)));
  }

  async function setImage(index: number, file: File) {
    try {
      const dataUrl = await resizeToDataUrl(file);
      updateModel(index, "image", dataUrl);
    } catch (err) {
      console.error("Không xử lý được ảnh:", err);
    }
  }

  function clearImage(index: number) {
    updateModel(index, "image", "");
  }

  const filledCount = models.filter((m) => m.image || m.note.trim()).length;

  async function handleSubmit() {
    if (!currentUser || !activeAssignment || submitting) return;
    setSubmitting(true);
    try {
      const filled = models.filter((m) => m.image || m.note.trim());
      const imageUrls = filled.filter((m) => m.image).map((m) => m.image);
      const note = filled
        .map((m, i) => (m.note.trim() ? `Mô hình ${i + 1}: ${m.note.trim()}` : ""))
        .filter(Boolean)
        .join("\n");

      // 1 lần nộp = 1 dòng submissions + MỖI ẢNH 1 dòng submission_images (verdict pending)
      const created = await createSubmissionWithImages({
        assignmentId: activeAssignment,
        userId: currentUser.id,
        imageUrls,
        note: note || undefined,
      });
      setMySubmissions((prev) => [
        {
          id: created.id,
          assignment_id: activeAssignment,
          user_id: currentUser.id,
          mentor_feedback: null,
          graded_at: null,
          submitted_at: new Date().toISOString(),
        },
        ...prev,
      ]);
      setSubmitted(true);
      await refreshStageData();
    } catch (err) {
      console.error("Không nộp được bài:", err);
    }
    setSubmitting(false);
  }

  const handleStageQuizPassed = async () => {
    if (!currentUser) return;
    await checkAndCompleteStages(currentUser.id, COURSE_ID);
    await refreshStageData();
  };

  const statusConfig = {
    empty: { icon: Circle, color: "text-muted-foreground", bg: "bg-muted", label: "Chưa nộp" },
    pending: { icon: Clock, color: "text-orange-500", bg: "bg-orange-500/15", label: "Chờ chấm" },
    graded: { icon: CheckCircle2, color: "text-emerald-500", bg: "bg-emerald-500/15", label: "Đã chấm" },
  };

  // ─── Khối bộ đếm chặng + quiz chặng cho assignment đang mở ───
  function renderStagePanel(assignmentId: string) {
    const stage = stageOfAssignment(assignmentId);
    if (!stage) return null;
    const counts = countsOf(assignmentId);
    const completed = isStageCompleted(stage);
    const quizUnlocked = counts.correct >= stage.required_correct_images;
    const quizPassed = !!stage.quiz_id && passedQuizIds.has(stage.quiz_id);
    const stageQuiz = stageQuizzes.get(stage.id);
    const incorrectImages = myImages.filter(
      (img) => img.assignment_id === assignmentId && img.verdict === "incorrect"
    );

    return (
      <Card className={cn(completed ? "border-emerald-500/30" : "border-gold/30")}>
        <CardContent className="pt-4 space-y-4">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div>
              <p className="text-xs text-gold font-medium uppercase tracking-wide">
                Chặng: {stage.title}
              </p>
              <p className="text-sm text-foreground font-semibold mt-1">
                {counts.correct}/{stage.required_correct_images} ảnh được chấm đúng ·{" "}
                {counts.pending} chờ chấm · {counts.incorrect} cần làm lại
              </p>
            </div>
            {completed && (
              <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                Đã qua chặng
              </Badge>
            )}
          </div>

          {/* Thanh tiến độ ảnh đúng */}
          <div className="h-2 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full rounded-full bg-gold transition-all"
              style={{
                width: `${Math.min(100, Math.round((counts.correct / stage.required_correct_images) * 100))}%`,
              }}
            />
          </div>

          {/* Ảnh bị chấm SAI + feedback mentor để nộp bù */}
          {incorrectImages.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-red-600 dark:text-red-400 flex items-center gap-1.5">
                <AlertTriangle className="h-3.5 w-3.5" />
                Ảnh cần làm lại — xem phản hồi mentor rồi nộp bù ảnh mới
              </p>
              <div className="space-y-2">
                {incorrectImages.map((img) => (
                  <div
                    key={img.id}
                    className="flex items-start gap-3 rounded-lg border border-red-500/25 bg-red-500/5 p-2.5"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={img.image_url}
                      alt="Ảnh bị chấm sai"
                      className="w-16 h-16 rounded-md object-cover shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-foreground">
                        {img.feedback || "Mentor chưa để lại nhận xét chi tiết."}
                      </p>
                      {img.graded_at && (
                        <p className="text-[10px] text-muted-foreground mt-1">
                          Chấm ngày {formatDate(img.graded_at)}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Đủ 20 ảnh đúng → nút "Làm quiz chặng" */}
          {!completed && quizUnlocked && (
            quizPassed ? (
              <div className="rounded-lg bg-emerald-500/10 p-3 text-sm text-emerald-700 dark:text-emerald-400 flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4" />
                Đã đạt quiz chặng — hệ thống đang ghi nhận qua chặng.
              </div>
            ) : stageQuiz ? (
              <StageQuizBlock
                quiz={stageQuiz}
                stageTitle={stage.title}
                userId={currentUser!.id}
                onPassed={handleStageQuizPassed}
              />
            ) : (
              <p className="text-sm text-muted-foreground">
                Quiz chặng chưa được cấu hình — liên hệ mentor để mở chặng tiếp theo.
              </p>
            )
          )}

          {!completed && !quizUnlocked && (
            <p className="text-xs text-muted-foreground">
              Đủ {stage.required_correct_images} ảnh được chấm đúng sẽ mở quiz chặng.
            </p>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <PageTransition>
      <div className="space-y-6">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl md:text-3xl font-bold">
            <span className="gold-gradient-text">Bài nộp — Khoá PRO</span>
          </h1>
          <p className="mt-1 text-muted-foreground">
            Mỗi bài nộp tối đa {MAX_MODELS} mô hình. Mentor chấm ĐÚNG/SAI từng ảnh.
          </p>
        </motion.div>

        <AnimatePresence mode="wait">
          {selected ? (
            /* ─── Assignment worksheet ─── */
            <motion.div
              key={selected.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="space-y-4"
            >
              <button
                onClick={() => setActiveAssignment(null)}
                className="text-sm text-gold hover:underline"
              >
                ← Quay lại danh sách
              </button>

              {/* Assignment header */}
              <Card className="gold-border-glow">
                <CardContent className="pt-5">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gold/10 text-gold font-bold">
                      {selected.order_index}
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-foreground">{selected.title}</h2>
                      <p className="text-sm text-muted-foreground">{selected.description}</p>
                    </div>
                  </div>

                  {/* Instructions toggle */}
                  <button
                    onClick={() => setInstructionsOpen(!instructionsOpen)}
                    className="mt-3 flex items-center gap-2 text-xs text-gold hover:underline"
                  >
                    <FileText className="h-3.5 w-3.5" />
                    Hướng dẫn & tài liệu
                    {instructionsOpen ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                  </button>
                  {instructionsOpen && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      className="mt-3 rounded-lg bg-muted/50 border border-border p-4 space-y-3"
                    >
                      <div className="text-xs text-foreground/80 leading-relaxed whitespace-pre-line">
                        {selected.instructions}
                      </div>
                      {selected.materials.length > 0 && (
                        <div className="flex flex-wrap gap-2 pt-2 border-t border-border/50">
                          {selected.materials.map((mat, j) => (
                            <a key={j} href={mat.url} className="flex items-center gap-1 text-[11px] text-gold hover:underline bg-gold/5 px-2 py-1 rounded-md">
                              <FileDown className="h-3 w-3" /> {mat.name}
                            </a>
                          ))}
                        </div>
                      )}
                    </motion.div>
                  )}
                </CardContent>
              </Card>

              {/* Bộ đếm chặng + ảnh sai + quiz chặng */}
              {renderStagePanel(selected.id)}

              {/* Previous graded feedback (submission-level, pattern cũ) */}
              {mySubmissions
                .filter((s) => s.assignment_id === selected.id && s.graded_at && s.mentor_feedback)
                .map((sub) => (
                  <Card key={sub.id} className="border-emerald-500/20">
                    <CardContent className="pt-4">
                      <div className="flex items-center gap-2 mb-2">
                        <MessageSquare className="h-3.5 w-3.5 text-gold" />
                        <span className="text-xs text-gold font-medium">Phản hồi Mentor</span>
                        <span className="text-[10px] text-muted-foreground ml-auto">{formatDate(sub.graded_at!)}</span>
                      </div>
                      <p className="text-sm text-foreground">{sub.mentor_feedback}</p>
                    </CardContent>
                  </Card>
                ))}

              {submitted ? (
                /* Success */
                <Card className="border-emerald-500/30">
                  <CardContent className="py-10 text-center space-y-2">
                    <CheckCircle2 className="h-12 w-12 text-emerald-500 mx-auto" />
                    <p className="font-semibold text-foreground">Đã nộp {filledCount} mô hình!</p>
                    <p className="text-sm text-muted-foreground">Mentor sẽ chấm ĐÚNG/SAI từng ảnh.</p>
                    <Button variant="outline" size="sm" className="mt-2" onClick={() => { setModels(emptySlots()); setSubmitted(false); }}>
                      Nộp thêm
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                /* Model slots grid */
                <>
                  <div className="space-y-3">
                    {models.map((model, i) => (
                      <Card key={i} className={cn(
                        "transition-all",
                        (model.image || model.note.trim()) && "border-gold/30"
                      )}>
                        <CardContent className="pt-4">
                          <div className="flex items-start gap-4">
                            {/* Model number */}
                            <div className={cn(
                              "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg font-bold text-xs",
                              (model.image || model.note.trim()) ? "bg-gold/15 text-gold" : "bg-muted text-muted-foreground"
                            )}>
                              {i + 1}
                            </div>

                            {/* Image */}
                            <div className="shrink-0">
                              {model.image ? (
                                <div className="relative w-24 h-24 rounded-lg overflow-hidden bg-muted">
                                  {/* eslint-disable-next-line @next/next/no-img-element */}
                                  <img src={model.image} alt="" className="w-full h-full object-cover" />
                                  <button
                                    onClick={() => clearImage(i)}
                                    className="absolute top-1 right-1 p-0.5 rounded-full bg-black/60 text-white"
                                  >
                                    <X className="h-3 w-3" />
                                  </button>
                                </div>
                              ) : (
                                <label className="flex flex-col items-center justify-center w-24 h-24 rounded-lg border-2 border-dashed border-border hover:border-gold/50 cursor-pointer transition-colors bg-muted/30">
                                  <ImagePlus className="h-5 w-5 text-muted-foreground mb-1" />
                                  <span className="text-[9px] text-muted-foreground">Chọn ảnh</span>
                                  <input
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={(e) => e.target.files?.[0] && setImage(i, e.target.files[0])}
                                  />
                                </label>
                              )}
                            </div>

                            {/* Note */}
                            <textarea
                              placeholder={`Mô hình ${i + 1}: dán phân tích, ghi chú...`}
                              value={model.note}
                              onChange={(e) => updateModel(i, "note", e.target.value)}
                              rows={3}
                              className="flex-1 rounded-lg border border-border bg-card p-2.5 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-gold/50 resize-y"
                            />
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>

                  {/* Submit */}
                  {filledCount > 0 && (
                    <div className="sticky bottom-4 z-10">
                      <Button
                        onClick={handleSubmit}
                        disabled={submitting}
                        className="w-full bg-gold hover:bg-gold/90 text-black font-semibold py-5 shadow-lg gold-glow"
                      >
                        <Send className="h-4 w-4 mr-2" />
                        {submitting ? "Đang nộp..." : `Nộp ${filledCount} mô hình`}
                      </Button>
                    </div>
                  )}
                </>
              )}
            </motion.div>
          ) : (
            /* ─── Assignment list ─── */
            <motion.div
              key="list"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-3"
            >
              {proAssignments.map((assignment, i) => {
                const status = getStatus(assignment.id);
                const cfg = statusConfig[status];
                const StatusIcon = cfg.icon;
                const stage = stageOfAssignment(assignment.id);
                const counts = stage ? countsOf(assignment.id) : null;

                return (
                  <motion.div
                    key={assignment.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.06 }}
                    whileHover={{ x: 4 }}
                    className="cursor-pointer"
                    onClick={() => openAssignment(assignment.id)}
                  >
                    <Card className="hover:border-gold/40 transition-all">
                      <CardContent className="py-4">
                        <div className="flex items-center gap-4">
                          <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-xl font-bold text-sm", cfg.bg, cfg.color)}>
                            {assignment.order_index}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-foreground text-sm">{assignment.title}</h3>
                            {stage && counts ? (
                              <p className="text-xs text-muted-foreground mt-0.5">
                                {counts.correct}/{stage.required_correct_images} ảnh đúng ·{" "}
                                {counts.pending} chờ chấm · {counts.incorrect} cần làm lại
                              </p>
                            ) : (
                              <p className="text-xs text-muted-foreground mt-0.5">Tối đa {MAX_MODELS} mô hình</p>
                            )}
                          </div>
                          {stage && isStageCompleted(stage) ? (
                            <div className="flex items-center gap-1.5 text-xs shrink-0 text-emerald-500">
                              <CheckCircle2 className="h-4 w-4" />
                              <span className="hidden sm:inline">Đã qua chặng</span>
                            </div>
                          ) : (
                            <div className={cn("flex items-center gap-1.5 text-xs shrink-0", cfg.color)}>
                              <StatusIcon className="h-4 w-4" />
                              <span className="hidden sm:inline">{cfg.label}</span>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </PageTransition>
  );
}

// Nút "Làm quiz chặng" → mở QuizSection (tái dùng component quiz của LessonPlayerView)
function StageQuizBlock({
  quiz,
  stageTitle,
  userId,
  onPassed,
}: {
  quiz: QuizRow;
  stageTitle: string;
  userId: string;
  onPassed: () => void;
}) {
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <Button
        onClick={() => setOpen(true)}
        className="bg-gold text-black hover:bg-gold/90"
      >
        <HelpCircle className="h-4 w-4 mr-2" />
        Làm quiz chặng
      </Button>
    );
  }

  return (
    <div className="border-t border-gold-shadow/30 pt-4">
      <QuizSection
        quiz={quiz}
        userId={userId}
        heading={`Quiz chặng — ${stageTitle}`}
        onPassed={onPassed}
      />
    </div>
  );
}
