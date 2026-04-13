"use client";

import { useState } from "react";
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
} from "lucide-react";
import { getAssignmentsByCourse, getSubmissionsByUser } from "@/lib/mock-data";
import { cn, formatDate } from "@/lib/utils";
import { useCurrentUser } from "@/lib/auth";
import { PageTransition } from "@/components/shared/PageTransition";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const MAX_MODELS = 5;

interface ModelSlot {
  image: string;
  note: string;
}

function emptySlots(): ModelSlot[] {
  return Array.from({ length: MAX_MODELS }, () => ({ image: "", note: "" }));
}

export default function StudentSubmissionsPage() {
  const currentUser = useCurrentUser("student");
  const proAssignments = getAssignmentsByCourse("c-pro");

  const [activeAssignment, setActiveAssignment] = useState<string | null>(null);
  const [models, setModels] = useState<ModelSlot[]>(emptySlots());
  const [instructionsOpen, setInstructionsOpen] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  if (!currentUser) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-muted-foreground">Đang tải...</div>
      </div>
    );
  }

  const mySubmissions = getSubmissionsByUser(currentUser.id);
  const selected = proAssignments.find((a) => a.id === activeAssignment);

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

  function setImage(index: number, file: File) {
    const url = URL.createObjectURL(file);
    updateModel(index, "image", url);
  }

  function clearImage(index: number) {
    updateModel(index, "image", "");
  }

  const filledCount = models.filter((m) => m.image || m.note.trim()).length;

  function handleSubmit() {
    const filled = models.filter((m) => m.image || m.note.trim());
    console.log("Submit:", { assignment_id: activeAssignment, models: filled });
    setSubmitted(true);
  }

  const statusConfig = {
    empty: { icon: Circle, color: "text-muted-foreground", bg: "bg-muted", label: "Chưa nộp" },
    pending: { icon: Clock, color: "text-orange-500", bg: "bg-orange-500/15", label: "Chờ chấm" },
    graded: { icon: CheckCircle2, color: "text-emerald-500", bg: "bg-emerald-500/15", label: "Đã chấm" },
  };

  return (
    <PageTransition>
      <div className="space-y-6">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl md:text-3xl font-bold">
            <span className="gold-gradient-text">Bài nộp — Khoá PRO</span>
          </h1>
          <p className="mt-1 text-muted-foreground">
            Mỗi bài nộp tối đa {MAX_MODELS} mô hình. Mentor chấm từng mô hình riêng.
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

              {/* Previous graded feedback */}
              {mySubmissions
                .filter((s) => s.assignment_id === selected.id && s.graded_at)
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
                    <p className="text-sm text-muted-foreground">Mentor sẽ chấm từng mô hình.</p>
                    <Button variant="outline" size="sm" className="mt-2" onClick={() => { setModels(emptySlots()); setSubmitted(false); }}>
                      Nộp lại
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
                        className="w-full bg-gold hover:bg-gold/90 text-black font-semibold py-5 shadow-lg gold-glow"
                      >
                        <Send className="h-4 w-4 mr-2" />
                        Nộp {filledCount} mô hình
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
                            <p className="text-xs text-muted-foreground mt-0.5">Tối đa {MAX_MODELS} mô hình</p>
                          </div>
                          <div className={cn("flex items-center gap-1.5 text-xs shrink-0", cfg.color)}>
                            <StatusIcon className="h-4 w-4" />
                            <span className="hidden sm:inline">{cfg.label}</span>
                          </div>
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
