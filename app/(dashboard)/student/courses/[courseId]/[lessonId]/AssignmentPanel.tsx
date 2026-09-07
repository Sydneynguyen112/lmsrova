"use client";

// Tab Bài tập của học viên — nộp ảnh + xem kết quả chấm theo TỪNG LẦN NỘP.
// Bố cục: đề bài → bộ đếm chặng → "Ảnh cần làm lại" (nổi lên đầu) → ô nộp bài → quiz chặng
// → dòng thời gian lần nộp (mỗi lần nộp = 1 card: lưới ảnh đánh số #1..#n giống phía mentor,
// Đúng/Sai từng ảnh, ghi chú + link bài sửa + ảnh sửa của mentor, nhận xét chung).
// Click ảnh → lightbox: phóng to, so cạnh ảnh sửa của mentor, nút "Nộp lại ảnh này"
// (ảnh nộp bù được nối với ảnh cũ qua redo_of_image_id để mentor so sánh).
import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { motion } from "framer-motion";
import {
  ImagePlus,
  X,
  Send,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  FileText,
  FileDown,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  MessageSquare,
  Link2,
  ExternalLink,
  RefreshCw,
  Columns2,
  ZoomIn,
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
  note: string | null;
  image_urls: string[] | null;
  mentor_feedback: string | null;
  graded_at: string | null;
  submitted_at: string;
}

// 1 mục đính kèm = 1 dòng submission_images để mentor chấm ĐÚNG/SAI
interface Attachment {
  id: string;
  url: string; // data URL (ảnh dán/chọn) hoặc link ngoài
  kind: "image" | "link";
  redoOf?: SubmissionImageRow; // đính kèm này nộp bù cho ảnh cũ bị Sai nào
}

// 1 lần nộp + các ảnh của nó, đã sắp theo thứ tự nộp (#1..#n giống phía mentor)
interface TimelineEntry {
  submission: SubmissionRow;
  images: SubmissionImageRow[];
  correct: number;
  incorrect: number;
  pending: number;
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

// Thứ tự ảnh trong 1 lần nộp = thứ tự trong submissions.image_urls (lúc nộp), fallback created_at
function orderImages(imgs: SubmissionImageRow[], urls: string[] | null): SubmissionImageRow[] {
  const idx = new Map((urls || []).map((u, i) => [u, i]));
  return [...imgs].sort((a, b) => {
    const ia = idx.get(a.image_url);
    const ib = idx.get(b.image_url);
    if (ia !== undefined && ib !== undefined && ia !== ib) return ia - ib;
    return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
  });
}

// Toàn bộ ảnh + lần nộp của RIÊNG bài tập này
async function fetchHistory(userId: string, assignmentId: string) {
  const [images, submissions] = await Promise.all([
    getSubmissionImagesByUser(userId),
    getSubmissionsByUser(userId),
  ]);
  return {
    images: images.filter((img) => img.assignment_id === assignmentId),
    submissions: (submissions as SubmissionRow[]).filter((s) => s.assignment_id === assignmentId),
  };
}

function VerdictIcon({ verdict, className }: { verdict: SubmissionImageRow["verdict"]; className?: string }) {
  if (verdict === "correct") return <CheckCircle2 className={cn("text-emerald-400", className)} />;
  if (verdict === "incorrect") return <XCircle className={cn("text-red-400", className)} />;
  return <Clock className={cn("text-orange-400", className)} />;
}

function verdictLabel(v: SubmissionImageRow["verdict"]) {
  return v === "correct" ? "Đúng" : v === "incorrect" ? "Cần làm lại" : "Chờ chấm";
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
  const composerRef = useRef<HTMLTextAreaElement>(null);
  const [submitting, setSubmitting] = useState(false);
  const [justSubmitted, setJustSubmitted] = useState(false);
  const [instructionsOpen, setInstructionsOpen] = useState(false);
  const [allImages, setAllImages] = useState<SubmissionImageRow[]>([]);
  const [submissions, setSubmissions] = useState<SubmissionRow[]>([]);
  // Ảnh cũ bị Sai đang chờ học viên đính ảnh mới vào để nộp bù
  const [pendingRedo, setPendingRedo] = useState<SubmissionImageRow | null>(null);
  // Lần nộp cũ đã đúng hết được thu gọn — mở ra theo id
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  // Lightbox: ảnh đang xem (theo lần nộp + vị trí) + chế độ so với ảnh sửa
  const [lightbox, setLightbox] = useState<{ entry: number; img: number } | null>(null);
  // Chế độ so sánh: mặc định bật khi ảnh có ảnh sửa; học viên tắt/bật thì nhớ theo id ảnh đó
  const [compareOverride, setCompareOverride] = useState<{ id: string; value: boolean } | null>(null);

  const loadHistory = useCallback(async () => {
    const h = await fetchHistory(userId, assignment.id);
    setAllImages(h.images);
    setSubmissions(h.submissions);
  }, [userId, assignment.id]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const h = await fetchHistory(userId, assignment.id);
      if (cancelled) return;
      setAllImages(h.images);
      setSubmissions(h.submissions);
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [userId, assignment.id]);

  // Dòng thời gian lần nộp, mới nhất trước
  const timeline: TimelineEntry[] = useMemo(() => {
    const bySub = new Map<string, SubmissionImageRow[]>();
    for (const img of allImages) {
      const arr = bySub.get(img.submission_id) || [];
      arr.push(img);
      bySub.set(img.submission_id, arr);
    }
    return [...submissions]
      .sort((a, b) => new Date(b.submitted_at).getTime() - new Date(a.submitted_at).getTime())
      .map((s) => {
        const imgs = orderImages(bySub.get(s.id) || [], s.image_urls);
        return {
          submission: s,
          images: imgs,
          correct: imgs.filter((i) => i.verdict === "correct").length,
          incorrect: imgs.filter((i) => i.verdict === "incorrect").length,
          pending: imgs.filter((i) => i.verdict === "pending").length,
        };
      });
  }, [allImages, submissions]);

  // Ảnh Sai đã có ảnh nộp bù rồi → không nhắc nữa
  const redoneIds = useMemo(
    () => new Set(allImages.map((i) => i.redo_of_image_id).filter(Boolean) as string[]),
    [allImages]
  );
  const attachedRedoIds = useMemo(
    () => new Set(attachments.map((a) => a.redoOf?.id).filter(Boolean) as string[]),
    [attachments]
  );
  // Vị trí ảnh trong dòng thời gian (để mở lightbox + ghi "#k lần nộp dd/mm")
  const locate = useCallback(
    (imageId: string) => {
      for (let e = 0; e < timeline.length; e++) {
        const i = timeline[e].images.findIndex((x) => x.id === imageId);
        if (i >= 0) return { entry: e, img: i };
      }
      return null;
    },
    [timeline]
  );
  const todo = useMemo(
    () =>
      timeline
        .flatMap((t) => t.images)
        .filter((i) => i.verdict === "incorrect" && !redoneIds.has(i.id)),
    [timeline, redoneIds]
  );

  function nextId() {
    nextIdRef.current += 1;
    return String(nextIdRef.current);
  }

  function removeAttachment(id: string) {
    setAttachments((prev) => prev.filter((a) => a.id !== id));
  }

  // Đính thêm: nếu đang ghim "nộp bù cho ảnh X" thì mục đầu tiên nhận nhãn đó
  function pushAttachments(items: Omit<Attachment, "redoOf">[]) {
    if (items.length === 0) return;
    setAttachments((prev) => {
      const [first, ...rest] = items;
      const withRedo: Attachment[] = pendingRedo ? [{ ...first, redoOf: pendingRedo }, ...rest] : [first, ...rest];
      return [...prev, ...withRedo];
    });
    if (pendingRedo) setPendingRedo(null);
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

    const added: Omit<Attachment, "redoOf">[] = [];
    for (const file of images.slice(0, room)) {
      try {
        added.push({ id: nextId(), url: await resizeToDataUrl(file), kind: "image" });
      } catch (err) {
        console.error("Không xử lý được ảnh:", err);
        setComposerError("Có file không đọc được — đã bỏ qua.");
      }
    }
    pushAttachments(added);
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
    pushAttachments([{ id: nextId(), url, kind: IMAGE_URL_RE.test(url) ? "image" : "link" }]);
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

  // "Nộp lại ảnh này" → ghim vào ô nộp, cuộn xuống, chờ học viên dán ảnh mới
  function startRedo(img: SubmissionImageRow) {
    setLightbox(null);
    setJustSubmitted(false);
    setPendingRedo(img);
    setTimeout(() => {
      composerRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      composerRef.current?.focus();
    }, 50);
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
        redoOfImageIds: attachments.map((a) => a.redoOf?.id || null),
        note: note.trim() || undefined,
      });
      setSentCount(attachments.length);
      setAttachments([]);
      setPendingRedo(null);
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

  // Lightbox: Esc đóng, ←/→ chuyển ảnh trong cùng lần nộp
  const lbEntry = lightbox ? timeline[lightbox.entry] || null : null;
  const lbImage = lbEntry && lightbox ? lbEntry.images[lightbox.img] || null : null;
  useEffect(() => {
    if (!lightbox || !lbEntry) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setLightbox(null);
      else if (e.key === "ArrowRight")
        setLightbox((l) => (l ? { ...l, img: Math.min(l.img + 1, lbEntry!.images.length - 1) } : l));
      else if (e.key === "ArrowLeft") setLightbox((l) => (l ? { ...l, img: Math.max(l.img - 1, 0) } : l));
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lightbox, lbEntry]);
  const compareOpen = lbImage
    ? compareOverride?.id === lbImage.id
      ? compareOverride.value
      : !!lbImage.fix_image_url
    : false;

  const quizUnlocked = counts.correct >= stage.required_correct_images;
  const progressPercent = Math.min(
    100,
    Math.round((counts.correct / stage.required_correct_images) * 100)
  );

  function imageRef(img: SubmissionImageRow) {
    const loc = locate(img.id);
    if (!loc) return "";
    return `Ảnh #${loc.img + 1} · lần nộp ${formatDate(timeline[loc.entry].submission.submitted_at)}`;
  }

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

      {/* ─── Việc cần làm ngay: ảnh bị Sai chưa nộp bù ─── */}
      {todo.length > 0 && !stageCompleted && (
        <Card className="border-red-500/40 bg-red-500/[0.03]">
          <CardContent className="space-y-3">
            <p className="text-sm font-semibold text-red-600 dark:text-red-400 flex items-center gap-1.5">
              <AlertTriangle className="h-4 w-4" />
              {todo.length} ảnh cần làm lại — xem mentor sửa gì rồi nộp lại ảnh mới
            </p>
            {todo.map((img) => {
              const loc = locate(img.id);
              const attached = attachedRedoIds.has(img.id);
              const pinned = pendingRedo?.id === img.id;
              return (
                <div
                  key={img.id}
                  className="flex flex-col sm:flex-row gap-3 rounded-lg border border-red-500/25 bg-card p-3"
                >
                  <button
                    type="button"
                    onClick={() => loc && setLightbox(loc)}
                    className="relative shrink-0 rounded-md overflow-hidden border border-red-500/40 cursor-zoom-in group"
                    title="Phóng to"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={img.image_url} alt="Ảnh cần làm lại" className="w-full sm:w-40 h-28 object-cover" />
                    <span className="absolute top-1 left-1 rounded bg-black/70 text-white text-[11px] font-semibold px-1.5 py-0.5">
                      {loc ? `#${loc.img + 1}` : ""}
                    </span>
                    <span className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/30 transition-colors">
                      <ZoomIn className="h-6 w-6 text-white opacity-0 group-hover:opacity-100" />
                    </span>
                  </button>
                  <div className="flex-1 min-w-0 space-y-1.5">
                    <p className="text-[11px] text-muted-foreground">{imageRef(img)}</p>
                    <p className="text-sm text-foreground">
                      {img.feedback || "Mentor chưa để lại nhận xét chi tiết cho ảnh này."}
                    </p>
                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      {img.fix_url && (
                        <a
                          href={img.fix_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 rounded-md border border-gold/40 bg-gold/5 px-2 py-1 text-xs text-gold hover:bg-gold/10"
                        >
                          <ExternalLink className="h-3.5 w-3.5" /> Mở bài sửa của mentor
                        </a>
                      )}
                      {img.fix_image_url && (
                        <button
                          type="button"
                          onClick={() => loc && setLightbox(loc)}
                          className="inline-flex items-center gap-1 rounded-md border border-gold/40 bg-gold/5 px-2 py-1 text-xs text-gold hover:bg-gold/10"
                        >
                          <Columns2 className="h-3.5 w-3.5" /> So với ảnh sửa
                        </button>
                      )}
                      {attached ? (
                        <span className="inline-flex items-center gap-1 rounded-md bg-sky-500/15 px-2 py-1 text-xs text-sky-600 dark:text-sky-400">
                          <CheckCircle2 className="h-3.5 w-3.5" /> Đã đính ảnh mới, bấm Nộp bài bên dưới
                        </span>
                      ) : pinned ? (
                        <span className="inline-flex items-center gap-1 rounded-md bg-sky-500/15 px-2 py-1 text-xs text-sky-600 dark:text-sky-400">
                          <RefreshCw className="h-3.5 w-3.5 animate-spin" /> Đang chờ bạn dán ảnh mới vào ô nộp
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => startRedo(img)}
                          className="inline-flex items-center gap-1 rounded-md bg-red-500/15 px-2 py-1 text-xs font-semibold text-red-600 dark:text-red-400 hover:bg-red-500/25"
                        >
                          <RefreshCw className="h-3.5 w-3.5" /> Nộp lại ảnh này
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

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
                Mentor sẽ chấm ĐÚNG/SAI từng ảnh — kết quả hiện ở lần nộp mới nhất bên dưới.
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
              dragOver
                ? "border-gold/60 bg-gold/5"
                : pendingRedo
                  ? "border-sky-500/60"
                  : canSend && "border-gold/30"
            )}
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
          >
            <CardContent className="space-y-3">
              {/* Ghim nộp bù: ảnh kế tiếp dán vào sẽ thay cho ảnh cũ này */}
              {pendingRedo && (
                <div className="flex items-center gap-2 rounded-lg border border-sky-500/40 bg-sky-500/10 px-2.5 py-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={pendingRedo.image_url} alt="" className="h-9 w-14 rounded object-cover border border-red-500/50 shrink-0" />
                  <p className="flex-1 min-w-0 text-xs text-sky-700 dark:text-sky-300">
                    <span className="font-semibold">Nộp bù</span> cho {imageRef(pendingRedo).toLowerCase()} — dán hoặc chọn ảnh mới, ảnh đầu tiên sẽ được nối với ảnh cũ này.
                  </p>
                  <button
                    type="button"
                    onClick={() => setPendingRedo(null)}
                    className="p-1 rounded-full text-muted-foreground hover:text-foreground"
                    title="Huỷ nộp bù"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}

              {attachments.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {attachments.map((a, i) =>
                    a.kind === "image" ? (
                      <div
                        key={a.id}
                        className={cn(
                          "relative w-28 h-28 rounded-lg overflow-hidden bg-muted border-2",
                          a.redoOf ? "border-sky-500/70" : "border-transparent"
                        )}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={a.url} alt="" className="w-full h-full object-cover" />
                        <span className="absolute top-1 left-1 rounded bg-black/70 text-white text-[11px] font-semibold px-1.5 py-0.5">
                          #{i + 1}
                        </span>
                        {a.redoOf && (
                          <span
                            className="absolute bottom-0 inset-x-0 bg-sky-600/90 text-white text-[10px] px-1.5 py-0.5 truncate"
                            title={`Nộp bù cho ${imageRef(a.redoOf)}`}
                          >
                            <RefreshCw className="inline h-2.5 w-2.5 mr-0.5" />
                            Nộp bù {imageRef(a.redoOf).split(" · ")[0]}
                          </span>
                        )}
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
                        className={cn(
                          "flex items-center gap-1.5 max-w-[260px] rounded-lg border bg-muted/40 pl-2 pr-1 py-1.5",
                          a.redoOf ? "border-sky-500/60" : "border-border"
                        )}
                      >
                        <span className="text-[11px] font-semibold text-muted-foreground">#{i + 1}</span>
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
                ref={composerRef}
                placeholder={
                  pendingRedo
                    ? "Dán ảnh mới đã sửa vào đây (Ctrl+V) — viết thêm bạn đã sửa gì nếu muốn..."
                    : "Dán ảnh (Ctrl+V), link biểu đồ, hoặc kéo-thả ảnh vào đây — viết thêm ghi chú nếu muốn..."
                }
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

      {/* ─── Dòng thời gian lần nộp: mới nhất trước ─── */}
      {timeline.length > 0 && (
        <div className="space-y-3">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide pt-2">
            Các lần nộp ({timeline.length})
          </p>
          {timeline.map((entry, eIdx) => {
            const s = entry.submission;
            const seq = timeline.length - eIdx; // lần nộp thứ mấy tính từ đầu
            const hasNotes = entry.images.some((i) => i.feedback || i.fix_url || i.fix_image_url);
            const quiet = eIdx > 0 && entry.incorrect === 0 && entry.pending === 0 && !hasNotes && !s.mentor_feedback;
            const open = !quiet || expanded.has(s.id);
            const borderCls =
              entry.pending > 0
                ? "border-orange-500/30"
                : entry.incorrect > 0
                  ? "border-red-500/30"
                  : "border-emerald-500/25";
            return (
              <Card key={s.id} className={borderCls}>
                <CardContent className="space-y-3">
                  {/* Header lần nộp */}
                  <button
                    type="button"
                    onClick={() =>
                      quiet &&
                      setExpanded((prev) => {
                        const n = new Set(prev);
                        if (n.has(s.id)) n.delete(s.id);
                        else n.add(s.id);
                        return n;
                      })
                    }
                    className={cn("w-full flex flex-wrap items-center gap-2 text-left", quiet && "cursor-pointer")}
                  >
                    <span className="text-sm font-semibold text-foreground">Lần nộp {seq}</span>
                    <span className="text-xs text-muted-foreground">{formatDate(s.submitted_at)}</span>
                    <Badge className="bg-muted text-muted-foreground">{entry.images.length} ảnh</Badge>
                    {entry.pending > 0 ? (
                      <Badge className="bg-orange-500/15 text-orange-600 dark:text-orange-400">
                        <Clock className="h-3 w-3 mr-1" /> {entry.pending} chờ chấm
                      </Badge>
                    ) : (
                      <>
                        {entry.correct > 0 && (
                          <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                            <CheckCircle2 className="h-3 w-3 mr-1" /> {entry.correct} đúng
                          </Badge>
                        )}
                        {entry.incorrect > 0 && (
                          <Badge className="bg-red-500/15 text-red-600 dark:text-red-400">
                            <XCircle className="h-3 w-3 mr-1" /> {entry.incorrect} cần làm lại
                          </Badge>
                        )}
                      </>
                    )}
                    {quiet && (
                      <span className="ml-auto text-xs text-muted-foreground flex items-center gap-1">
                        {open ? "Thu gọn" : "Xem ảnh"}
                        {open ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                      </span>
                    )}
                  </button>

                  {open && (
                    <>
                      {s.note && (
                        <p className="text-sm text-foreground/80 border-l-2 border-gold/30 pl-3 whitespace-pre-line">
                          {s.note}
                        </p>
                      )}

                      {/* Lưới ảnh — số thứ tự giống phía mentor */}
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
                        {entry.images.map((img, iIdx) => {
                          const hasExtra = img.feedback || img.fix_url || img.fix_image_url;
                          return (
                            <div
                              key={img.id}
                              className={cn(
                                "rounded-lg border-2 overflow-hidden bg-muted/20",
                                img.verdict === "correct"
                                  ? "border-emerald-500/50"
                                  : img.verdict === "incorrect"
                                    ? "border-red-500/60"
                                    : "border-orange-500/40"
                              )}
                            >
                              <button
                                type="button"
                                onClick={() => setLightbox({ entry: eIdx, img: iIdx })}
                                className="relative block w-full cursor-zoom-in group"
                                title={`${verdictLabel(img.verdict)} — bấm để phóng to`}
                              >
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                  src={img.image_url}
                                  alt={`Ảnh ${iIdx + 1}`}
                                  loading="lazy"
                                  className="w-full h-32 object-cover"
                                />
                                <span className="absolute top-1 left-1 rounded bg-black/70 text-white text-[11px] font-semibold px-1.5 py-0.5">
                                  #{iIdx + 1}
                                </span>
                                <span className="absolute top-1 right-1 rounded-full bg-black/70 p-0.5">
                                  <VerdictIcon verdict={img.verdict} className="h-4 w-4" />
                                </span>
                                {img.redo_of_image_id && (
                                  <span className="absolute bottom-1 left-1 rounded bg-sky-600/90 text-white text-[10px] px-1.5 py-0.5 flex items-center gap-0.5">
                                    <RefreshCw className="h-2.5 w-2.5" /> Nộp bù
                                  </span>
                                )}
                                {img.fix_image_url && (
                                  <span className="absolute bottom-1 right-1 rounded bg-gold/90 text-black text-[10px] px-1.5 py-0.5 flex items-center gap-0.5">
                                    <Columns2 className="h-2.5 w-2.5" /> Có ảnh sửa
                                  </span>
                                )}
                                <span className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/25 transition-colors">
                                  <ZoomIn className="h-6 w-6 text-white opacity-0 group-hover:opacity-100" />
                                </span>
                              </button>
                              {hasExtra && (
                                <div className="px-2 py-1.5 bg-card space-y-1">
                                  {img.feedback && (
                                    <p className="text-[11px] text-foreground leading-snug line-clamp-2" title={img.feedback}>
                                      {img.feedback}
                                    </p>
                                  )}
                                  {img.fix_url && (
                                    <a
                                      href={img.fix_url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center gap-1 text-[11px] text-gold hover:underline"
                                    >
                                      <ExternalLink className="h-3 w-3" /> Bài sửa của mentor
                                    </a>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>

                      {s.mentor_feedback && (
                        <div className="rounded-lg border border-gold/20 bg-gold/[0.04] px-3 py-2">
                          <div className="flex items-center gap-2 mb-1">
                            <MessageSquare className="h-3.5 w-3.5 text-gold" />
                            <span className="text-xs text-gold font-medium">Nhận xét chung của Mentor</span>
                            {s.graded_at && (
                              <span className="text-[10px] text-muted-foreground ml-auto">{formatDate(s.graded_at)}</span>
                            )}
                          </div>
                          <p className="text-sm text-foreground whitespace-pre-line">{s.mentor_feedback}</p>
                        </div>
                      )}
                    </>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* ─── Lightbox: phóng to + so với ảnh sửa của mentor + nộp lại ─── */}
      {lightbox && lbEntry && lbImage && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex flex-col items-center justify-center p-4"
          onClick={() => setLightbox(null)}
        >
          <button
            type="button"
            onClick={() => setLightbox(null)}
            className="absolute top-4 right-4 text-white/70 hover:text-white"
            title="Đóng (Esc)"
          >
            <X className="h-7 w-7" />
          </button>
          {lightbox.img > 0 && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); setLightbox({ ...lightbox, img: lightbox.img - 1 }); }}
              className="absolute left-2 top-1/2 -translate-y-1/2 text-white/70 hover:text-white"
              title="Ảnh trước (←)"
            >
              <ChevronLeft className="h-9 w-9" />
            </button>
          )}
          {lightbox.img < lbEntry.images.length - 1 && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); setLightbox({ ...lightbox, img: lightbox.img + 1 }); }}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-white/70 hover:text-white"
              title="Ảnh sau (→)"
            >
              <ChevronRight className="h-9 w-9" />
            </button>
          )}

          {/* Tiêu đề */}
          <div className="mb-2 flex items-center gap-2 text-sm text-white/80" onClick={(e) => e.stopPropagation()}>
            <span className="font-semibold text-white">Ảnh #{lightbox.img + 1}/{lbEntry.images.length}</span>
            <span>· lần nộp {formatDate(lbEntry.submission.submitted_at)}</span>
            <span
              className={cn(
                "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold",
                lbImage.verdict === "correct"
                  ? "bg-emerald-500/20 text-emerald-300"
                  : lbImage.verdict === "incorrect"
                    ? "bg-red-500/20 text-red-300"
                    : "bg-orange-500/20 text-orange-300"
              )}
            >
              <VerdictIcon verdict={lbImage.verdict} className="h-3.5 w-3.5" /> {verdictLabel(lbImage.verdict)}
            </span>
          </div>

          {/* Ảnh đơn hoặc so sánh với ảnh sửa của mentor */}
          {compareOpen && lbImage.fix_image_url ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full max-w-[94vw]" onClick={(e) => e.stopPropagation()}>
              <div className="space-y-1">
                <p className="text-xs text-white/70 font-medium">Ảnh của bạn</p>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={lbImage.image_url} alt="Ảnh của bạn" className="w-full max-h-[56vh] object-contain rounded-lg border border-white/20" />
              </div>
              <div className="space-y-1">
                <p className="text-xs text-gold font-medium">Ảnh sửa của mentor</p>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={lbImage.fix_image_url} alt="Ảnh sửa của mentor" className="w-full max-h-[56vh] object-contain rounded-lg border border-gold/50" />
              </div>
            </div>
          ) : (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={lbImage.image_url}
              alt={`Ảnh ${lightbox.img + 1}`}
              onClick={(e) => e.stopPropagation()}
              className="max-h-[60vh] max-w-[94vw] object-contain rounded-lg"
            />
          )}

          {/* Ghi chú mentor + hành động */}
          <div className="mt-3 w-full max-w-2xl space-y-2" onClick={(e) => e.stopPropagation()}>
            {lbImage.feedback && (
              <p className="text-sm text-white/90 text-center whitespace-pre-line">
                <MessageSquare className="inline h-3.5 w-3.5 text-gold mr-1 -mt-0.5" />
                {lbImage.feedback}
              </p>
            )}
            <div className="flex flex-wrap items-center justify-center gap-2">
              {lbImage.fix_image_url && (
                <button
                  type="button"
                  onClick={() => setCompareOverride({ id: lbImage.id, value: !compareOpen })}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-lg border-2 px-3 py-1.5 text-sm font-semibold",
                    compareOpen ? "border-gold bg-gold/20 text-gold" : "border-white/30 text-white/80 hover:border-gold/60"
                  )}
                >
                  <Columns2 className="h-4 w-4" /> {compareOpen ? "Chỉ xem ảnh của tôi" : "So với ảnh sửa"}
                </button>
              )}
              {lbImage.fix_url && (
                <a
                  href={lbImage.fix_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-lg border-2 border-white/30 px-3 py-1.5 text-sm font-semibold text-white/80 hover:border-gold/60"
                >
                  <ExternalLink className="h-4 w-4" /> Mở bài sửa của mentor
                </a>
              )}
              {lbImage.verdict === "incorrect" && !redoneIds.has(lbImage.id) && !stageCompleted && (
                <button
                  type="button"
                  onClick={() => startRedo(lbImage)}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-red-500/80 px-3 py-1.5 text-sm font-semibold text-white hover:bg-red-500"
                >
                  <RefreshCw className="h-4 w-4" /> Nộp lại ảnh này
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
