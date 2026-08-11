"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
  ImagePlus,
  X,
  Send,
  CheckCircle2,
  AlertTriangle,
  FileText,
  FileDown,
  ChevronDown,
  ChevronUp,
  MessageSquare,
  Lock,
} from "lucide-react";

import { getSubmissionsByUser } from "@/lib/api";
import {
  createSubmissionWithImages,
  getSubmissionImagesByUser,
  type SubmissionImageRow,
  type QuizRow,
} from "@/lib/api-student";
import type { ImageCounts, RoadmapStage } from "@/lib/roadmap";
import { cn, formatDate } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { QuizSection } from "./QuizSection";

const MAX_MODELS = 5;

export interface AssignmentRow {
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
  mentor_feedback: string | null;
  graded_at: string | null;
}

interface ModelSlot {
  image: string; // data URL (lưu thẳng vào DB — pattern avatar hiện có)
  note: string;
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

// Ảnh bị chấm sai + phản hồi mentor của RIÊNG bài tập này
async function fetchHistory(userId: string, assignmentId: string) {
  const [images, submissions] = await Promise.all([
    getSubmissionImagesByUser(userId),
    getSubmissionsByUser(userId),
  ]);
  return {
    incorrect: images.filter(
      (img) => img.assignment_id === assignmentId && img.verdict === "incorrect"
    ),
    feedbacks: (submissions as SubmissionRow[]).filter(
      (s) => s.assignment_id === assignmentId && s.graded_at && s.mentor_feedback
    ),
  };
}

interface Props {
  assignment: AssignmentRow;
  stage: RoadmapStage;
  counts: ImageCounts;
  stageCompleted: boolean;
  stageQuiz: QuizRow | null;
  stageQuizPassed: boolean;
  userId: string;
  /** % thời lượng video đã xem (0-1) — chưa đủ ngưỡng thì khoá phần nộp */
  watchedRatio: number;
  /** Ngưỡng % phải xem mới được nộp bài */
  watchGate: number;
  /** Nộp xong / quiz chặng đạt → cha load lại unlock data (bộ đếm + mở bài kế) */
  onProgress: () => void;
}

export function AssignmentPanel({
  assignment,
  stage,
  counts,
  stageCompleted,
  stageQuiz,
  stageQuizPassed,
  userId,
  watchedRatio,
  watchGate,
  onProgress,
}: Props) {
  const [models, setModels] = useState<ModelSlot[]>(emptySlots());
  const [submitting, setSubmitting] = useState(false);
  const [justSubmitted, setJustSubmitted] = useState(false);
  const [instructionsOpen, setInstructionsOpen] = useState(false);
  const [incorrectImages, setIncorrectImages] = useState<SubmissionImageRow[]>([]);
  const [feedbacks, setFeedbacks] = useState<SubmissionRow[]>([]);

  const loadHistory = useCallback(async () => {
    const h = await fetchHistory(userId, assignment.id);
    setIncorrectImages(h.incorrect);
    setFeedbacks(h.feedbacks);
  }, [userId, assignment.id]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const h = await fetchHistory(userId, assignment.id);
      if (cancelled) return;
      setIncorrectImages(h.incorrect);
      setFeedbacks(h.feedbacks);
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [userId, assignment.id]);

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

  const filledCount = models.filter((m) => m.image || m.note.trim()).length;

  async function handleSubmit() {
    if (!assignment || submitting) return;
    setSubmitting(true);
    try {
      const filled = models.filter((m) => m.image || m.note.trim());
      const imageUrls = filled.filter((m) => m.image).map((m) => m.image);
      const note = filled
        .map((m, i) => (m.note.trim() ? `Mô hình ${i + 1}: ${m.note.trim()}` : ""))
        .filter(Boolean)
        .join("\n");

      // 1 lần nộp = 1 dòng submissions + MỖI ẢNH 1 dòng submission_images (verdict pending)
      await createSubmissionWithImages({
        assignmentId: assignment.id,
        userId,
        imageUrls,
        note: note || undefined,
      });
      setJustSubmitted(true);
      await loadHistory();
      onProgress();
    } catch (err) {
      console.error("Không nộp được bài:", err);
    }
    setSubmitting(false);
  }

  const handleQuizPassed = async () => {
    await loadHistory();
    onProgress();
  };

  const quizUnlocked = counts.correct >= stage.required_correct_images;
  const progressPercent = Math.min(
    100,
    Math.round((counts.correct / stage.required_correct_images) * 100)
  );
  // Đề bài luôn xem được; chỉ phần NỘP bị khoá tới khi xem đủ ngưỡng
  const watchGatePassed = watchedRatio >= watchGate;
  const watchedPercent = Math.min(100, Math.round(watchedRatio * 100));
  const gatePercent = Math.round(watchGate * 100);

  return (
    <div className="space-y-4">
      {/* ─── Đề bài + hướng dẫn + tài liệu ─── */}
      <Card>
        <CardContent className="space-y-3">
          <div>
            <h3 className="font-semibold text-foreground">{assignment.title}</h3>
            {assignment.description && (
              <p className="text-sm text-muted-foreground mt-2 whitespace-pre-line">
                {assignment.description}
              </p>
            )}
          </div>

          {(assignment.instructions || assignment.materials.length > 0) && (
            <>
              <button
                onClick={() => setInstructionsOpen(!instructionsOpen)}
                className="flex items-center gap-2 text-xs text-gold hover:underline"
              >
                <FileText className="h-3.5 w-3.5" />
                Hướng dẫn &amp; tài liệu
                {instructionsOpen ? (
                  <ChevronUp className="h-3.5 w-3.5" />
                ) : (
                  <ChevronDown className="h-3.5 w-3.5" />
                )}
              </button>
              {instructionsOpen && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="rounded-lg bg-muted/50 border border-border p-4 space-y-3"
                >
                  {assignment.instructions && (
                    <div className="text-xs text-foreground/80 leading-relaxed whitespace-pre-line">
                      {assignment.instructions}
                    </div>
                  )}
                  {assignment.materials.length > 0 && (
                    <div className="flex flex-wrap gap-2 pt-2 border-t border-border/50">
                      {assignment.materials.map((mat, j) => (
                        <a
                          key={j}
                          href={mat.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-[11px] text-gold hover:underline bg-gold/5 px-2 py-1 rounded-md"
                        >
                          <FileDown className="h-3 w-3" /> {mat.name}
                        </a>
                      ))}
                    </div>
                  )}
                </motion.div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* ─── Bộ đếm chặng ─── */}
      <Card className={cn(stageCompleted ? "border-emerald-500/30" : "border-gold/30")}>
        <CardContent className="space-y-3">
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
            {stageCompleted && (
              <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                Đã qua chặng
              </Badge>
            )}
          </div>

          <div className="h-2 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full rounded-full bg-gold transition-all"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          {!stageCompleted && !quizUnlocked && (
            <p className="text-xs text-muted-foreground">
              Đủ {stage.required_correct_images} ảnh được chấm đúng sẽ mở quiz chặng.
            </p>
          )}
        </CardContent>
      </Card>

      {/* ─── Ảnh bị chấm SAI + feedback mentor để nộp bù ─── */}
      {incorrectImages.length > 0 && (
        <Card className="border-red-500/25">
          <CardContent className="space-y-2">
            <p className="text-xs font-medium text-red-600 dark:text-red-400 flex items-center gap-1.5">
              <AlertTriangle className="h-3.5 w-3.5" />
              Ảnh cần làm lại — xem phản hồi mentor rồi nộp bù ảnh mới bên dưới
            </p>
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
          </CardContent>
        </Card>
      )}

      {/* ─── Phản hồi mentor ở mức lượt nộp ─── */}
      {feedbacks.map((sub) => (
        <Card key={sub.id} className="border-emerald-500/20">
          <CardContent>
            <div className="flex items-center gap-2 mb-2">
              <MessageSquare className="h-3.5 w-3.5 text-gold" />
              <span className="text-xs text-gold font-medium">Phản hồi Mentor</span>
              <span className="text-[10px] text-muted-foreground ml-auto">
                {formatDate(sub.graded_at!)}
              </span>
            </div>
            <p className="text-sm text-foreground">{sub.mentor_feedback}</p>
          </CardContent>
        </Card>
      ))}

      {/* ─── Chưa xem đủ ngưỡng: hiện đề bài nhưng khoá phần nộp ─── */}
      {!stageCompleted && !watchGatePassed && (
        <Card className="border-dashed">
          <CardContent className="py-8 text-center space-y-3">
            <Lock className="h-8 w-8 text-muted-foreground/60 mx-auto" />
            <div>
              <p className="font-semibold text-foreground">
                Xem hết {gatePercent}% video để mở phần nộp bài
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Bạn đã xem {watchedPercent}% — cứ xem tiếp, ô nộp bài sẽ tự mở.
              </p>
            </div>
            <div className="h-2 max-w-xs mx-auto rounded-full bg-muted overflow-hidden">
              <div
                className="h-full rounded-full bg-gold/60 transition-all"
                style={{ width: `${Math.min(100, Math.round((watchedRatio / watchGate) * 100))}%` }}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* ─── Khung nộp ảnh (ẩn khi đã qua chặng hoặc chưa xem đủ) ─── */}
      {!stageCompleted &&
        watchGatePassed &&
        (justSubmitted ? (
          <Card className="border-emerald-500/30">
            <CardContent className="py-10 text-center space-y-2">
              <CheckCircle2 className="h-12 w-12 text-emerald-500 mx-auto" />
              <p className="font-semibold text-foreground">Đã nộp {filledCount} mô hình!</p>
              <p className="text-sm text-muted-foreground">
                Mentor sẽ chấm ĐÚNG/SAI từng ảnh.
              </p>
              <Button
                variant="outline"
                size="sm"
                className="mt-2"
                onClick={() => {
                  setModels(emptySlots());
                  setJustSubmitted(false);
                }}
              >
                Nộp thêm
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="space-y-3">
              {models.map((model, i) => (
                <Card
                  key={i}
                  className={cn(
                    "transition-all",
                    (model.image || model.note.trim()) && "border-gold/30"
                  )}
                >
                  <CardContent>
                    <div className="flex items-start gap-4">
                      <div
                        className={cn(
                          "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg font-bold text-xs",
                          model.image || model.note.trim()
                            ? "bg-gold/15 text-gold"
                            : "bg-muted text-muted-foreground"
                        )}
                      >
                        {i + 1}
                      </div>

                      <div className="shrink-0">
                        {model.image ? (
                          <div className="relative w-24 h-24 rounded-lg overflow-hidden bg-muted">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={model.image}
                              alt=""
                              className="w-full h-full object-cover"
                            />
                            <button
                              onClick={() => updateModel(i, "image", "")}
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
                              onChange={(e) =>
                                e.target.files?.[0] && setImage(i, e.target.files[0])
                              }
                            />
                          </label>
                        )}
                      </div>

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
        ))}

      {/* ─── Đủ ảnh đúng → quiz chặng bung ra ngay tại đây ─── */}
      {!stageCompleted &&
        quizUnlocked &&
        (stageQuizPassed ? (
          <Card className="border-emerald-500/30">
            <CardContent className="flex items-center gap-2 text-sm text-emerald-700 dark:text-emerald-400">
              <CheckCircle2 className="h-4 w-4" />
              Đã đạt quiz chặng — hệ thống đang ghi nhận qua chặng.
            </CardContent>
          </Card>
        ) : stageQuiz ? (
          <Card className="border-gold/30">
            <CardContent>
              <QuizSection
                quiz={stageQuiz}
                userId={userId}
                heading={`Quiz chặng — ${stage.title}`}
                locked={!watchGatePassed}
                lockedNote={`Xem hết ${gatePercent}% video để làm quiz — bạn đã xem ${watchedPercent}%.`}
                onPassed={handleQuizPassed}
              />
            </CardContent>
          </Card>
        ) : stage.quiz_id ? (
          // Có cấu hình quiz_id nhưng không tải được quiz → lỗi dữ liệu thật
          <Card>
            <CardContent className="text-sm text-muted-foreground">
              Quiz chặng chưa được cấu hình — liên hệ mentor để mở chặng tiếp theo.
            </CardContent>
          </Card>
        ) : (
          // Chặng không dùng quiz: đủ ảnh đúng là qua
          <Card className="border-emerald-500/30">
            <CardContent className="flex items-center gap-2 text-sm text-emerald-700 dark:text-emerald-400">
              <CheckCircle2 className="h-4 w-4" />
              Đủ ảnh đạt rồi — hệ thống đang ghi nhận qua chặng.
            </CardContent>
          </Card>
        ))}
    </div>
  );
}
