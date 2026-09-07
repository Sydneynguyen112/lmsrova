"use client";

import { useState, useEffect, useCallback, useRef } from "react";
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
  Link2,
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

const MAX_ATTACHMENTS = 20;

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

// 1 mục đính kèm = 1 dòng submission_images để mentor chấm ĐÚNG/SAI
interface Attachment {
  id: string;
  url: string; // data URL (ảnh dán/chọn) hoặc link ngoài
  kind: "image" | "link";
}

const URL_RE = /^https?:\/\/\S+$/i;
const IMAGE_URL_RE = /\.(png|jpe?g|gif|webp|avif|bmp|svg)(\?|#|$)/i;

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

// Ảnh bị chấm sai + ảnh đúng có ghi chú + phản hồi mentor của RIÊNG bài tập này
async function fetchHistory(userId: string, assignmentId: string) {
  const [images, submissions] = await Promise.all([
    getSubmissionImagesByUser(userId),
    getSubmissionsByUser(userId),
  ]);
  const mine = images.filter((img) => img.assignment_id === assignmentId);
  return {
    incorrect: mine.filter((img) => img.verdict === "incorrect"),
    // Ảnh đạt nhưng mentor vẫn ghi chú riêng (khen / góp ý nhỏ) → cho học viên đọc
    noted: mine.filter((img) => img.verdict === "correct" && img.feedback?.trim()),
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
  onProgress,
}: Props) {
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [note, setNote] = useState("");
  const [composerError, setComposerError] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const [sentCount, setSentCount] = useState(0);
  const nextIdRef = useRef(0);
  const [submitting, setSubmitting] = useState(false);
  const [justSubmitted, setJustSubmitted] = useState(false);
  const [instructionsOpen, setInstructionsOpen] = useState(false);
  const [incorrectImages, setIncorrectImages] = useState<SubmissionImageRow[]>([]);
  const [notedImages, setNotedImages] = useState<SubmissionImageRow[]>([]);
  const [feedbacks, setFeedbacks] = useState<SubmissionRow[]>([]);

  const loadHistory = useCallback(async () => {
    const h = await fetchHistory(userId, assignment.id);
    setIncorrectImages(h.incorrect);
    setNotedImages(h.noted);
    setFeedbacks(h.feedbacks);
  }, [userId, assignment.id]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const h = await fetchHistory(userId, assignment.id);
      if (cancelled) return;
      setIncorrectImages(h.incorrect);
      setNotedImages(h.noted);
      setFeedbacks(h.feedbacks);
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [userId, assignment.id]);

  function nextId() {
    nextIdRef.current += 1;
    return String(nextIdRef.current);
  }

  function removeAttachment(id: string) {
    setAttachments((prev) => prev.filter((a) => a.id !== id));
  }

  // Ảnh dán/kéo-thả/chọn file → resize về data URL rồi đính kèm
  async function addFiles(files: File[]) {
    const images = files.filter((f) => f.type.startsWith("image/"));
    if (images.length === 0) return;
    setComposerError("");

    const room = MAX_ATTACHMENTS - attachments.length;
    if (room <= 0) {
      setComposerError(`Tối đa ${MAX_ATTACHMENTS} ảnh/link mỗi lượt nộp.`);
      return;
    }

    const added: Attachment[] = [];
    for (const file of images.slice(0, room)) {
      try {
        added.push({ id: nextId(), url: await resizeToDataUrl(file), kind: "image" });
      } catch (err) {
        console.error("Không xử lý được ảnh:", err);
        setComposerError("Có file không đọc được — đã bỏ qua.");
      }
    }
    if (added.length > 0) setAttachments((prev) => [...prev, ...added]);
    if (images.length > room) {
      setComposerError(`Tối đa ${MAX_ATTACHMENTS} ảnh/link mỗi lượt nộp.`);
    }
  }

  function addUrl(url: string) {
    if (attachments.length >= MAX_ATTACHMENTS) {
      setComposerError(`Tối đa ${MAX_ATTACHMENTS} ảnh/link mỗi lượt nộp.`);
      return;
    }
    setComposerError("");
    setAttachments((prev) => [
      ...prev,
      { id: nextId(), url, kind: IMAGE_URL_RE.test(url) ? "image" : "link" },
    ]);
  }

  // Ctrl+V: ảnh trong clipboard → đính kèm; link đơn lẻ → chip; còn lại để rơi vào ghi chú
  function handlePaste(e: React.ClipboardEvent<HTMLTextAreaElement>) {
    const files = Array.from(e.clipboardData.files);
    if (files.some((f) => f.type.startsWith("image/"))) {
      e.preventDefault();
      addFiles(files);
      return;
    }
    const text = e.clipboardData.getData("text").trim();
    if (URL_RE.test(text)) {
      e.preventDefault();
      addUrl(text);
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    addFiles(Array.from(e.dataTransfer.files));
  }

  const canSend = attachments.length > 0 || note.trim().length > 0;

  async function handleSubmit() {
    if (!assignment || submitting || !canSend) return;
    setSubmitting(true);
    setComposerError("");
    try {
      // 1 lần nộp = 1 dòng submissions + MỖI ẢNH 1 dòng submission_images (verdict pending)
      await createSubmissionWithImages({
        assignmentId: assignment.id,
        userId,
        imageUrls: attachments.map((a) => a.url),
        note: note.trim() || undefined,
      });
      setSentCount(attachments.length);
      setAttachments([]);
      setNote("");
      setJustSubmitted(true);
      await loadHistory();
      onProgress();
    } catch (err) {
      console.error("Không nộp được bài:", err);
      setComposerError("Không nộp được bài — kiểm tra mạng rồi thử lại.");
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

      {/* ─── Ảnh chấm ĐÚNG nhưng mentor có ghi chú riêng ─── */}
      {notedImages.length > 0 && (
        <Card className="border-emerald-500/25">
          <CardContent className="space-y-2">
            <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Ảnh đã đạt — mentor có ghi chú thêm
            </p>
            {notedImages.map((img) => (
              <div
                key={img.id}
                className="flex items-start gap-3 rounded-lg border border-emerald-500/25 bg-emerald-500/5 p-2.5"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={img.image_url}
                  alt="Ảnh đã đạt"
                  className="w-16 h-16 rounded-md object-cover shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-foreground">{img.feedback}</p>
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

      {/* ─── Ô soạn kiểu chat: dán ảnh/link + ghi chú (ẩn khi đã qua chặng) ─── */}
      {!stageCompleted &&
        (justSubmitted ? (
          <Card className="border-emerald-500/30">
            <CardContent className="py-10 text-center space-y-2">
              <CheckCircle2 className="h-12 w-12 text-emerald-500 mx-auto" />
              <p className="font-semibold text-foreground">
                Đã nộp {sentCount} ảnh/link!
              </p>
              <p className="text-sm text-muted-foreground">
                Mentor sẽ chấm ĐÚNG/SAI từng ảnh.
              </p>
              <Button
                variant="outline"
                size="sm"
                className="mt-2"
                onClick={() => setJustSubmitted(false)}
              >
                Nộp thêm
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card
            className={cn(
              "sticky bottom-4 z-10 transition-colors shadow-lg",
              dragOver ? "border-gold/60 bg-gold/5" : canSend && "border-gold/30"
            )}
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
          >
            <CardContent className="space-y-3">
              {attachments.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {attachments.map((a) =>
                    a.kind === "image" ? (
                      <div
                        key={a.id}
                        className="relative w-20 h-20 rounded-lg overflow-hidden bg-muted"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={a.url} alt="" className="w-full h-full object-cover" />
                        <button
                          onClick={() => removeAttachment(a.id)}
                          className="absolute top-1 right-1 p-0.5 rounded-full bg-black/60 text-white"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ) : (
                      <div
                        key={a.id}
                        className="flex items-center gap-1.5 max-w-[240px] rounded-lg border border-border bg-muted/40 pl-2 pr-1 py-1.5"
                      >
                        <Link2 className="h-3.5 w-3.5 text-gold shrink-0" />
                        <span className="text-[11px] text-foreground/80 truncate">
                          {a.url}
                        </span>
                        <button
                          onClick={() => removeAttachment(a.id)}
                          className="p-0.5 rounded-full text-muted-foreground hover:text-foreground"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    )
                  )}
                </div>
              )}

              <textarea
                placeholder="Dán ảnh (Ctrl+V), link biểu đồ, hoặc kéo-thả ảnh vào đây — viết thêm ghi chú nếu muốn..."
                value={note}
                onChange={(e) => setNote(e.target.value)}
                onPaste={handlePaste}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
                    e.preventDefault();
                    handleSubmit();
                  }
                }}
                rows={3}
                className="w-full rounded-lg border border-border bg-card p-2.5 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-gold/50 resize-y"
              />

              {composerError && (
                <p className="text-xs text-red-600 dark:text-red-400">{composerError}</p>
              )}

              <div className="flex items-center gap-3">
                <label className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-gold cursor-pointer transition-colors">
                  <ImagePlus className="h-4 w-4" />
                  Thêm ảnh
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={(e) => {
                      addFiles(Array.from(e.target.files ?? []));
                      e.target.value = "";
                    }}
                  />
                </label>
                <span className="text-[11px] text-muted-foreground/70">
                  {attachments.length}/{MAX_ATTACHMENTS} · Ctrl+Enter để nộp
                </span>
                <Button
                  onClick={handleSubmit}
                  disabled={submitting || !canSend}
                  className="ml-auto bg-gold hover:bg-gold/90 text-black font-semibold gold-glow"
                >
                  <Send className="h-4 w-4 mr-2" />
                  {submitting ? "Đang nộp..." : "Nộp bài"}
                </Button>
              </div>
            </CardContent>
          </Card>
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
