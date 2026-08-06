"use client";

// Hàng đợi chấm ảnh (Phase 03) — mentor chấm từng ảnh Đúng/Sai.
// Nguồn: submission_images verdict='pending' của học viên mình phụ trách,
// group theo học viên → bài tập, ảnh cũ nhất trước. Phím tắt: C đúng · X sai · Enter lưu + ảnh kế.
import { useState, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileCheck,
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Clock,
  Hourglass,
  AlertTriangle,
  Keyboard,
} from "lucide-react";
import { getStudentsByMentor, getAssignmentsByCourse } from "@/lib/api";
import {
  getPendingImagesByStudents,
  countChoChamStudents,
  gradeImage,
  type PendingImage,
} from "@/lib/api-mentor";
import { checkAndCompleteStages } from "@/lib/roadmap";
import { cn, formatDate, formatRelativeTime } from "@/lib/utils";
import { useCurrentUser } from "@/lib/auth";
import type { Profile } from "@/lib/auth";
import { PageTransition } from "@/components/shared/PageTransition";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

function getInitials(name: string) {
  return name.split(" ").map((n) => n[0]).join("").slice(-2);
}

interface QueueGroup {
  studentId: string;
  assignmentId: string;
  images: PendingImage[];
}

export default function MentorGradingQueuePage() {
  const currentUser = useCurrentUser("mentor");
  const [students, setStudents] = useState<Profile[]>([]);
  const [images, setImages] = useState<PendingImage[]>([]);
  const [assignmentTitles, setAssignmentTitles] = useState<Map<string, string>>(new Map());
  const [choChamCount, setChoChamCount] = useState(0);
  const [loading, setLoading] = useState(true);

  // Màn chấm: group đang mở + trạng thái chấm ảnh hiện tại
  const [activeGroup, setActiveGroup] = useState<{ studentId: string; assignmentId: string } | null>(null);
  const [verdict, setVerdict] = useState<"correct" | "incorrect" | null>(null);
  const [feedback, setFeedback] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!currentUser) return;
    async function load() {
      const s = (await getStudentsByMentor(currentUser!.id)) as Profile[];
      setStudents(s);
      const [imgs, waiting] = await Promise.all([
        getPendingImagesByStudents(s.map((st) => st.id)),
        countChoChamStudents(currentUser!.id),
      ]);
      setImages(imgs);
      setChoChamCount(waiting);

      const a = (await getAssignmentsByCourse("c-mov3c81m-fdq2")) as { id: string; title: string }[];
      setAssignmentTitles(new Map(a.map((x) => [x.id, x.title])));
      setLoading(false);
    }
    load();
  }, [currentUser]);

  // Group ảnh pending: học viên → bài tập, thứ tự theo ảnh cũ nhất
  const groups: QueueGroup[] = useMemo(() => {
    const map = new Map<string, QueueGroup>();
    for (const img of images) {
      const key = `${img.user_id}::${img.assignment_id}`;
      const g = map.get(key) || { studentId: img.user_id, assignmentId: img.assignment_id, images: [] };
      g.images.push(img); // images đã sort created_at asc từ query
      map.set(key, g);
    }
    return Array.from(map.values()).sort(
      (a, b) => new Date(a.images[0].created_at).getTime() - new Date(b.images[0].created_at).getTime()
    );
  }, [images]);

  const currentGroup = activeGroup
    ? groups.find((g) => g.studentId === activeGroup.studentId && g.assignmentId === activeGroup.assignmentId) || null
    : null;
  const currentImage = currentGroup?.images[0] || null;
  const currentStudent = currentGroup ? students.find((s) => s.id === currentGroup.studentId) : null;

  const handleSave = useCallback(async () => {
    if (!currentImage || !verdict || !currentUser || saving) return;
    setSaving(true);
    try {
      await gradeImage(currentImage.id, verdict, feedback, currentUser.id);
      // Ảnh thứ 20 đúng có thể qua chặng + mở quiz — engine chung lo hết
      await checkAndCompleteStages(currentImage.user_id, "c-mov3c81m-fdq2");
      setImages((prev) => prev.filter((i) => i.id !== currentImage.id));
      setVerdict(null);
      setFeedback("");
      // Hết ảnh của group → quay về danh sách + refresh số học viên chờ chấm
      if (currentGroup && currentGroup.images.length <= 1) {
        setActiveGroup(null);
        countChoChamStudents(currentUser.id).then(setChoChamCount);
      }
    } catch (err) {
      console.error("Chấm ảnh thất bại:", err);
    } finally {
      setSaving(false);
    }
  }, [currentImage, verdict, feedback, currentUser, saving, currentGroup]);

  // Phím tắt: C = đúng, X = sai (ngoài ô nhập), Enter = lưu + ảnh kế
  useEffect(() => {
    if (!currentImage) return;
    function onKeyDown(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement | null)?.tagName;
      const inField = tag === "INPUT" || tag === "TEXTAREA";
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSave();
        return;
      }
      if (inField) return;
      if (e.key.toLowerCase() === "c") setVerdict("correct");
      else if (e.key.toLowerCase() === "x") setVerdict("incorrect");
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [currentImage, handleSave]);

  if (!currentUser || loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-muted-foreground">Đang tải...</div>
      </div>
    );
  }

  const meta = currentImage?.submissions?.metadata || null;
  const showFeedbackWarning = verdict === "incorrect" && !feedback.trim();

  return (
    <PageTransition>
      <div className="space-y-6">
        {/* Header: tổng ảnh chờ + số học viên đang chờ chấm (đồng hồ dừng vì mình) */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl md:text-3xl font-bold">
            <span className="gold-gradient-text">Chấm bài</span>
          </h1>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <Badge className="bg-orange-500/15 text-orange-700 dark:text-orange-300">
              <Clock className="h-3 w-3 mr-1" />
              {images.length} ảnh chờ chấm
            </Badge>
            <Badge className={cn(
              choChamCount > 0
                ? "bg-sky-500/15 text-sky-600 dark:text-sky-400"
                : "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
            )}>
              <Hourglass className="h-3 w-3 mr-1" />
              {choChamCount} học viên đang Chờ chấm (đồng hồ dừng)
            </Badge>
          </div>
        </motion.div>

        <AnimatePresence mode="wait">
          {currentGroup && currentImage && currentStudent ? (
            /* ─── Màn chấm từng ảnh ─── */
            <motion.div
              key={currentImage.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="space-y-4"
            >
              <div className="flex items-center justify-between">
                <button
                  onClick={() => { setActiveGroup(null); setVerdict(null); setFeedback(""); }}
                  className="text-sm text-gold hover:underline flex items-center gap-1"
                >
                  <ArrowLeft className="h-4 w-4" /> Quay lại hàng đợi
                </button>
                <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                  <Keyboard className="h-3.5 w-3.5" /> C = Đúng · X = Sai · Enter = Lưu + ảnh kế
                </span>
              </div>

              {/* Học viên + bài tập + còn lại */}
              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-gold/15 text-gold font-semibold">
                        {getInitials(currentStudent.full_name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-foreground">{currentStudent.full_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {assignmentTitles.get(currentGroup.assignmentId) || "Bài tập"}
                      </p>
                    </div>
                    <Badge className="bg-orange-500/15 text-orange-700 dark:text-orange-300 shrink-0">
                      Còn {currentGroup.images.length} ảnh
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              {/* Ảnh lớn */}
              <Card>
                <CardContent className="pt-4 space-y-4">
                  <div className="rounded-xl border border-border bg-muted/20 overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={currentImage.image_url}
                      alt="Ảnh bài tập học viên nộp"
                      className="w-full max-h-[70vh] object-contain"
                    />
                  </div>

                  {/* Metadata submission: pair / timeframe / note */}
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
                    {meta?.pair && (
                      <span className="font-medium text-foreground">
                        {meta.pair}
                        {meta.timeframe ? ` · ${meta.timeframe}` : ""}
                      </span>
                    )}
                    {!meta?.pair && meta?.timeframe && (
                      <span className="font-medium text-foreground">{meta.timeframe}</span>
                    )}
                    {meta?.formula && <span className="text-muted-foreground">CT: {meta.formula}</span>}
                    {meta?.direction && <span className="text-muted-foreground">Hướng: {meta.direction}</span>}
                    <span className="text-xs text-muted-foreground ml-auto">
                      Nộp {formatDate(currentImage.created_at)} · {formatRelativeTime(currentImage.created_at)}
                    </span>
                  </div>
                  {meta?.note && (
                    <p className="text-sm text-foreground border-l-2 border-gold/30 pl-3">
                      {meta.note}
                    </p>
                  )}

                  {/* 2 nút Đúng / Sai */}
                  <div className="grid grid-cols-2 gap-3">
                    <Button
                      variant="outline"
                      onClick={() => setVerdict("correct")}
                      className={cn(
                        "py-6 text-base font-semibold border-2",
                        verdict === "correct"
                          ? "border-emerald-500 bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                          : "border-border hover:border-emerald-500/50"
                      )}
                    >
                      <CheckCircle2 className="h-5 w-5 mr-2" /> Đúng (C)
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setVerdict("incorrect")}
                      className={cn(
                        "py-6 text-base font-semibold border-2",
                        verdict === "incorrect"
                          ? "border-red-500 bg-red-500/15 text-red-600 dark:text-red-400"
                          : "border-border hover:border-red-500/50"
                      )}
                    >
                      <XCircle className="h-5 w-5 mr-2" /> Sai (X)
                    </Button>
                  </div>

                  {/* Nhận xét (không bắt buộc; nên có khi Sai) */}
                  <div className="space-y-1.5">
                    <textarea
                      placeholder="Nhận xét cho học viên (không bắt buộc)..."
                      value={feedback}
                      onChange={(e) => setFeedback(e.target.value)}
                      rows={2}
                      className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-gold/50 resize-none"
                    />
                    {showFeedbackWarning && (
                      <p className="text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1">
                        <AlertTriangle className="h-3 w-3" />
                        Chấm Sai nên kèm nhận xét để học viên biết sửa gì — vẫn lưu được nếu bỏ trống.
                      </p>
                    )}
                  </div>

                  <Button
                    onClick={handleSave}
                    disabled={!verdict || saving}
                    className="w-full bg-gold hover:bg-gold/90 text-black font-semibold py-5"
                  >
                    {saving ? "Đang lưu..." : "Lưu + ảnh kế (Enter)"}
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          ) : (
            /* ─── Danh sách hàng đợi: học viên → bài tập ─── */
            <motion.div
              key="queue"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-3"
            >
              {groups.length === 0 && (
                <Card>
                  <CardContent className="py-12 text-center">
                    <FileCheck className="h-12 w-12 text-emerald-500/40 mx-auto mb-3" />
                    <p className="text-muted-foreground">Tuyệt vời! Không còn ảnh nào chờ chấm</p>
                  </CardContent>
                </Card>
              )}

              {groups.map((group) => {
                const student = students.find((s) => s.id === group.studentId);
                if (!student) return null;
                return (
                  <motion.div
                    key={`${group.studentId}-${group.assignmentId}`}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    whileHover={{ x: 4 }}
                    className="cursor-pointer"
                    onClick={() => {
                      setActiveGroup({ studentId: group.studentId, assignmentId: group.assignmentId });
                      setVerdict(null);
                      setFeedback("");
                    }}
                  >
                    <Card className="hover:border-gold/40 transition-all">
                      <CardContent className="py-4">
                        <div className="flex items-center gap-4">
                          <Avatar className="h-10 w-10">
                            <AvatarFallback className="bg-gold/15 text-gold font-semibold">
                              {getInitials(student.full_name)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-foreground">{student.full_name}</p>
                            <p className="text-xs text-muted-foreground">
                              {assignmentTitles.get(group.assignmentId) || "Bài tập"} · nộp cũ nhất{" "}
                              {formatRelativeTime(group.images[0].created_at)}
                            </p>
                          </div>
                          <Badge className="bg-orange-500/15 text-orange-700 dark:text-orange-300 shrink-0">
                            {group.images.length} ảnh chờ
                          </Badge>
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
