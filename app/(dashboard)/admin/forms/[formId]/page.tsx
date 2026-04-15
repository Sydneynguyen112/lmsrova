"use client";

import { useState, useEffect, use } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, Plus, Save, Trash2, ChevronUp, ChevronDown, Pencil, X,
  Type, AlignLeft, CircleDot, CheckSquare, List, Star,
  GripVertical, Globe, Lock, Copy, Eye, CheckCircle2,
} from "lucide-react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { PageTransition } from "@/components/shared/PageTransition";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";

interface Form {
  id: string;
  title: string;
  description: string | null;
  form_type: string;
  status: string;
}

interface Question {
  id: string;
  form_id: string;
  question_text: string;
  question_type: string;
  options: string[];
  required: boolean;
  order_index: number;
}

const QUESTION_TYPES = [
  { value: "text", label: "Văn bản ngắn", icon: Type },
  { value: "textarea", label: "Văn bản dài", icon: AlignLeft },
  { value: "radio", label: "Chọn một", icon: CircleDot },
  { value: "checkbox", label: "Chọn nhiều", icon: CheckSquare },
  { value: "select", label: "Dropdown", icon: List },
  { value: "rating", label: "Đánh giá sao", icon: Star },
];

function genId(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}

export default function FormBuilderPage({ params }: { params: Promise<{ formId: string }> }) {
  const { formId } = use(params);
  const [form, setForm] = useState<Form | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  // Add question dialog
  const [addOpen, setAddOpen] = useState(false);
  const [newQ, setNewQ] = useState({ question_text: "", question_type: "text", required: false, options: [""] });

  // Edit question
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editQ, setEditQ] = useState<Partial<Question>>({});

  // Preview
  const [previewOpen, setPreviewOpen] = useState(false);

  useEffect(() => { loadData(); }, [formId]);
  useEffect(() => { if (toast) { const t = setTimeout(() => setToast(null), 3000); return () => clearTimeout(t); } }, [toast]);

  async function loadData() {
    const [{ data: f }, { data: q }] = await Promise.all([
      supabase.from("forms").select("*").eq("id", formId).single(),
      supabase.from("form_questions").select("*").eq("form_id", formId).order("order_index"),
    ]);
    if (f) setForm(f as Form);
    setQuestions((q || []) as Question[]);
    setLoading(false);
  }

  async function updateFormInfo(field: string, value: string) {
    await supabase.from("forms").update({ [field]: value, updated_at: new Date().toISOString() }).eq("id", formId);
    setForm((prev) => prev ? { ...prev, [field]: value } : prev);
  }

  async function togglePublish() {
    if (!form) return;
    const newStatus = form.status === "published" ? "draft" : "published";
    await supabase.from("forms").update({ status: newStatus }).eq("id", formId);
    setForm({ ...form, status: newStatus });
    setToast(newStatus === "published" ? "Đã xuất bản!" : "Đã chuyển về nháp");
  }

  function copyLink() {
    navigator.clipboard.writeText(`${window.location.origin}/forms/${formId}`);
    setToast("Đã copy link!");
  }

  /* ─── Question CRUD ─── */
  async function addQuestion() {
    const id = genId("q");
    setSaving(true);
    const hasOptions = ["radio", "checkbox", "select"].includes(newQ.question_type);
    const { error } = await supabase.from("form_questions").insert({
      id,
      form_id: formId,
      question_text: newQ.question_text,
      question_type: newQ.question_type,
      options: hasOptions ? newQ.options.filter((o) => o.trim()) : [],
      required: newQ.required,
      order_index: questions.length + 1,
    });
    setSaving(false);
    if (error) { setToast("Lỗi: " + error.message); return; }
    setAddOpen(false);
    setNewQ({ question_text: "", question_type: "text", required: false, options: [""] });
    setToast("Đã thêm câu hỏi!");
    loadData();
  }

  function startEdit(q: Question) {
    setEditingId(q.id);
    setEditQ({ ...q, options: q.options?.length ? q.options : [""] });
  }

  async function saveEdit() {
    if (!editingId) return;
    setSaving(true);
    const hasOptions = ["radio", "checkbox", "select"].includes(editQ.question_type || "");
    await supabase.from("form_questions").update({
      question_text: editQ.question_text,
      question_type: editQ.question_type,
      options: hasOptions ? (editQ.options || []).filter((o: string) => o.trim()) : [],
      required: editQ.required,
    }).eq("id", editingId);
    setSaving(false);
    setEditingId(null);
    setToast("Đã lưu câu hỏi!");
    loadData();
  }

  async function deleteQuestion(id: string) {
    if (!confirm("Xoá câu hỏi này?")) return;
    await supabase.from("form_questions").delete().eq("id", id);
    setToast("Đã xoá câu hỏi");
    loadData();
  }

  async function moveQuestion(id: string, direction: "up" | "down") {
    const idx = questions.findIndex((q) => q.id === id);
    if (idx < 0) return;
    const swapIdx = direction === "up" ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= questions.length) return;

    const a = questions[idx];
    const b = questions[swapIdx];
    await Promise.all([
      supabase.from("form_questions").update({ order_index: b.order_index }).eq("id", a.id),
      supabase.from("form_questions").update({ order_index: a.order_index }).eq("id", b.id),
    ]);
    loadData();
  }

  const needsOptions = (type: string) => ["radio", "checkbox", "select"].includes(type);

  if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><div className="text-muted-foreground">Đang tải...</div></div>;
  if (!form) return <div className="p-6 text-center text-muted-foreground">Biểu mẫu không tồn tại.</div>;

  return (
    <PageTransition>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <Link href="/admin/forms" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-gold transition-colors">
              <ArrowLeft className="h-4 w-4" /> Biểu mẫu
            </Link>
            <input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              onBlur={(e) => updateFormInfo("title", e.target.value)}
              className="block text-2xl font-bold bg-transparent border-none outline-none text-foreground w-full gold-gradient-text"
            />
            <input
              value={form.description || ""}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              onBlur={(e) => updateFormInfo("description", e.target.value)}
              placeholder="Thêm mô tả..."
              className="block text-sm bg-transparent border-none outline-none text-muted-foreground w-full"
            />
            <div className="flex items-center gap-2">
              <Badge variant="outline" className={cn(
                form.status === "published"
                  ? "bg-emerald-500/15 text-emerald-500 border-emerald-500/30"
                  : "bg-gray-500/15 text-gray-500 border-gray-500/30"
              )}>
                {form.status === "published" ? <><Globe className="h-3 w-3 mr-1" /> Đã xuất bản</> : <><Lock className="h-3 w-3 mr-1" /> Nháp</>}
              </Badge>
              <Badge variant="outline">{form.form_type === "onboarding" ? "Onboarding" : "Survey"}</Badge>
            </div>
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => setPreviewOpen(true)}>
              <Eye className="h-4 w-4 mr-1" /> Xem trước
            </Button>
            <Button size="sm" variant="outline" onClick={togglePublish}>
              {form.status === "published" ? <><Lock className="h-4 w-4 mr-1" /> Huỷ xuất bản</> : <><Globe className="h-4 w-4 mr-1" /> Xuất bản</>}
            </Button>
            {form.status === "published" && (
              <Button size="sm" variant="outline" onClick={copyLink}>
                <Copy className="h-4 w-4 mr-1" /> Copy link
              </Button>
            )}
          </div>
        </div>

        {/* Toast */}
        <AnimatePresence>
          {toast && (
            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
              className="flex items-center gap-2 rounded-lg bg-emerald-500/10 border border-emerald-500/30 p-3 text-sm text-emerald-700 dark:text-emerald-400">
              <CheckCircle2 className="h-4 w-4 shrink-0" />{toast}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Questions list */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Câu hỏi ({questions.length})</h2>
            <Button size="sm" onClick={() => setAddOpen(true)} className="bg-gold hover:bg-gold/90 text-black">
              <Plus className="h-4 w-4 mr-1" /> Thêm câu hỏi
            </Button>
          </div>

          {questions.length === 0 && (
            <Card className="py-12">
              <CardContent className="text-center text-muted-foreground">
                <p>Chưa có câu hỏi. Bấm "Thêm câu hỏi" để bắt đầu.</p>
              </CardContent>
            </Card>
          )}

          {questions.map((q, idx) => {
            const isEditing = editingId === q.id;
            const typeInfo = QUESTION_TYPES.find((t) => t.value === q.question_type);

            return (
              <motion.div key={q.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
                <Card className={cn("transition-all", isEditing && "ring-1 ring-gold")}>
                  <CardContent className="pt-4">
                    {isEditing ? (
                      /* ─── Edit mode ─── */
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gold font-medium">Chỉnh sửa câu {q.order_index}</span>
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline" onClick={() => setEditingId(null)}><X className="h-3.5 w-3.5 mr-1" /> Huỷ</Button>
                            <Button size="sm" onClick={saveEdit} disabled={saving} className="bg-gold hover:bg-gold/90 text-black">
                              <Save className="h-3.5 w-3.5 mr-1" /> {saving ? "Đang lưu..." : "Lưu"}
                            </Button>
                          </div>
                        </div>
                        <div>
                          <label className="text-xs text-muted-foreground font-medium">Câu hỏi</label>
                          <Input value={editQ.question_text || ""} onChange={(e) => setEditQ({ ...editQ, question_text: e.target.value })} className="mt-1" />
                        </div>
                        <div>
                          <label className="text-xs text-muted-foreground font-medium">Loại câu hỏi</label>
                          <div className="grid grid-cols-3 gap-2 mt-1">
                            {QUESTION_TYPES.map((t) => (
                              <button key={t.value} type="button" onClick={() => setEditQ({ ...editQ, question_type: t.value })}
                                className={cn("flex items-center gap-2 rounded-lg border p-2 text-xs transition-all",
                                  editQ.question_type === t.value ? "border-gold bg-gold/10 text-gold" : "border-border text-muted-foreground hover:border-gold/30"
                                )}>
                                <t.icon className="h-3.5 w-3.5" /> {t.label}
                              </button>
                            ))}
                          </div>
                        </div>
                        {needsOptions(editQ.question_type || "") && (
                          <div>
                            <label className="text-xs text-muted-foreground font-medium">Tuỳ chọn</label>
                            <div className="space-y-2 mt-1">
                              {(editQ.options || [""]).map((opt: string, i: number) => (
                                <div key={i} className="flex gap-2">
                                  <Input value={opt} onChange={(e) => {
                                    const opts = [...(editQ.options || [])];
                                    opts[i] = e.target.value;
                                    setEditQ({ ...editQ, options: opts });
                                  }} placeholder={`Tuỳ chọn ${i + 1}`} className="flex-1 text-xs" />
                                  <Button size="sm" variant="ghost" onClick={() => {
                                    const opts = (editQ.options || []).filter((_: string, j: number) => j !== i);
                                    setEditQ({ ...editQ, options: opts.length ? opts : [""] });
                                  }} className="text-red-400 hover:text-red-500 h-8 w-8 p-0">
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </Button>
                                </div>
                              ))}
                              <Button size="sm" variant="outline" onClick={() => setEditQ({ ...editQ, options: [...(editQ.options || []), ""] })} className="text-xs">
                                <Plus className="h-3 w-3 mr-1" /> Thêm tuỳ chọn
                              </Button>
                            </div>
                          </div>
                        )}
                        <label className="flex items-center gap-2 text-sm">
                          <input type="checkbox" checked={editQ.required || false} onChange={(e) => setEditQ({ ...editQ, required: e.target.checked })} className="accent-gold" />
                          Bắt buộc trả lời
                        </label>
                      </div>
                    ) : (
                      /* ─── View mode ─── */
                      <div className="flex items-center gap-3">
                        <div className="flex flex-col gap-0.5 shrink-0">
                          <button onClick={() => moveQuestion(q.id, "up")} disabled={idx === 0} className="text-muted-foreground/40 hover:text-gold disabled:opacity-20 transition-colors">
                            <ChevronUp className="h-4 w-4" />
                          </button>
                          <button onClick={() => moveQuestion(q.id, "down")} disabled={idx === questions.length - 1} className="text-muted-foreground/40 hover:text-gold disabled:opacity-20 transition-colors">
                            <ChevronDown className="h-4 w-4" />
                          </button>
                        </div>
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gold/10 text-gold font-bold text-xs">
                          {q.order_index}
                        </div>
                        {typeInfo && <typeInfo.icon className="h-4 w-4 text-muted-foreground shrink-0" />}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">
                            {q.question_text}
                            {q.required && <span className="text-red-400 ml-1">*</span>}
                          </p>
                          <div className="flex items-center gap-2 text-[10px] text-muted-foreground mt-0.5">
                            <span>{typeInfo?.label}</span>
                            {q.options?.length > 0 && <span>{q.options.length} tuỳ chọn</span>}
                          </div>
                        </div>
                        <Button size="sm" variant="ghost" onClick={() => startEdit(q)} className="text-muted-foreground hover:text-gold"><Pencil className="h-4 w-4" /></Button>
                        <Button size="sm" variant="ghost" onClick={() => deleteQuestion(q.id)} className="text-muted-foreground hover:text-red-500"><Trash2 className="h-4 w-4" /></Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* ─── Add Question Dialog ─── */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader><DialogTitle>Thêm câu hỏi</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <label className="text-xs font-medium text-muted-foreground">Câu hỏi *</label>
              <Input value={newQ.question_text} onChange={(e) => setNewQ({ ...newQ, question_text: e.target.value })} placeholder="Nhập câu hỏi..." className="mt-1" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Loại câu hỏi</label>
              <div className="grid grid-cols-3 gap-2 mt-2">
                {QUESTION_TYPES.map((t) => (
                  <button key={t.value} type="button" onClick={() => setNewQ({ ...newQ, question_type: t.value })}
                    className={cn("flex items-center gap-2 rounded-xl border p-3 text-xs transition-all",
                      newQ.question_type === t.value ? "border-gold bg-gold/10 text-gold" : "border-border text-muted-foreground hover:border-gold/30"
                    )}>
                    <t.icon className="h-4 w-4" /> {t.label}
                  </button>
                ))}
              </div>
            </div>
            {needsOptions(newQ.question_type) && (
              <div>
                <label className="text-xs font-medium text-muted-foreground">Tuỳ chọn</label>
                <div className="space-y-2 mt-1">
                  {newQ.options.map((opt, i) => (
                    <div key={i} className="flex gap-2">
                      <Input value={opt} onChange={(e) => {
                        const opts = [...newQ.options];
                        opts[i] = e.target.value;
                        setNewQ({ ...newQ, options: opts });
                      }} placeholder={`Tuỳ chọn ${i + 1}`} className="flex-1 text-xs" />
                      {newQ.options.length > 1 && (
                        <Button size="sm" variant="ghost" onClick={() => setNewQ({ ...newQ, options: newQ.options.filter((_, j) => j !== i) })} className="text-red-400 h-8 w-8 p-0">
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>
                  ))}
                  <Button size="sm" variant="outline" onClick={() => setNewQ({ ...newQ, options: [...newQ.options, ""] })} className="text-xs">
                    <Plus className="h-3 w-3 mr-1" /> Thêm tuỳ chọn
                  </Button>
                </div>
              </div>
            )}
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={newQ.required} onChange={(e) => setNewQ({ ...newQ, required: e.target.checked })} className="accent-gold" />
              Bắt buộc trả lời
            </label>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)}>Huỷ</Button>
            <Button onClick={addQuestion} disabled={!newQ.question_text || saving} className="bg-gold hover:bg-gold/90 text-black">
              {saving ? "Đang thêm..." : "Thêm câu hỏi"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Preview Dialog ─── */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="sm:max-w-xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{form.title}</DialogTitle>
            {form.description && <p className="text-sm text-muted-foreground">{form.description}</p>}
          </DialogHeader>
          <div className="space-y-5 py-2">
            {questions.map((q) => (
              <div key={q.id} className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  {q.question_text} {q.required && <span className="text-red-400">*</span>}
                </label>
                {q.question_type === "text" && <Input placeholder="Câu trả lời..." disabled className="bg-muted" />}
                {q.question_type === "textarea" && <textarea placeholder="Câu trả lời..." disabled rows={3} className="w-full rounded-lg border border-border bg-muted p-3 text-sm resize-none" />}
                {q.question_type === "radio" && (
                  <div className="space-y-1.5 pl-1">{q.options?.map((opt, i) => (
                    <label key={i} className="flex items-center gap-2 text-sm"><input type="radio" disabled className="accent-gold" /> {opt}</label>
                  ))}</div>
                )}
                {q.question_type === "checkbox" && (
                  <div className="space-y-1.5 pl-1">{q.options?.map((opt, i) => (
                    <label key={i} className="flex items-center gap-2 text-sm"><input type="checkbox" disabled className="accent-gold" /> {opt}</label>
                  ))}</div>
                )}
                {q.question_type === "select" && (
                  <select disabled className="w-full rounded-lg border border-border bg-muted p-2.5 text-sm">
                    <option>Chọn...</option>
                    {q.options?.map((opt, i) => <option key={i}>{opt}</option>)}
                  </select>
                )}
                {q.question_type === "rating" && (
                  <div className="flex gap-1">{[1, 2, 3, 4, 5].map((s) => <Star key={s} className="h-6 w-6 text-muted-foreground/30" />)}</div>
                )}
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPreviewOpen(false)}>Đóng</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageTransition>
  );
}
