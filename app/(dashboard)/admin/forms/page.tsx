"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  FileText,
  Pencil,
  Trash2,
  Copy,
  Eye,
  Globe,
  Lock,
  BarChart3,
  CheckCircle2,
  ClipboardCheck,
  UserPlus,
  GraduationCap,
  Link2,
} from "lucide-react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { cn, formatDate } from "@/lib/utils";
import {
  type FormRow,
  type FormType,
  type FormQuestionRow,
  validateGraduationPublish,
  getGraduationAttachments,
  attachGraduationForm,
} from "@/lib/api-forms";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageTransition } from "@/components/shared/PageTransition";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";

interface CourseLite {
  id: string;
  title: string;
}

function genId(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}

const FORM_TYPE_OPTIONS = [
  { value: "survey", label: "Khảo sát", desc: "Gửi link cho bất kỳ ai", icon: FileText },
  { value: "onboarding", label: "Onboarding", desc: "Hiện khi học viên đăng ký", icon: UserPlus },
  { value: "graduation", label: "Tốt nghiệp", desc: "Có đáp án đúng + chấm điểm", icon: GraduationCap },
] as const;

export default function AdminFormsPage() {
  const [forms, setForms] = useState<FormRow[]>([]);
  const [responseCounts, setResponseCounts] = useState<Record<string, number>>({});
  const [courses, setCourses] = useState<CourseLite[]>([]);
  // course_id -> form_id đang gắn làm bài tốt nghiệp
  const [attachments, setAttachments] = useState<Map<string, string>>(new Map());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [toastError, setToastError] = useState(false);

  // Dialog tạo form
  const [createOpen, setCreateOpen] = useState(false);
  const [formData, setFormData] = useState({ title: "", description: "", form_type: "survey" as FormType });

  // Dialog gắn bài tốt nghiệp
  const [attachForm, setAttachForm] = useState<FormRow | null>(null);
  const [attachCourseId, setAttachCourseId] = useState("");

  useEffect(() => { loadData(); }, []);
  useEffect(() => { if (toast) { const t = setTimeout(() => { setToast(null); setToastError(false); }, 4000); return () => clearTimeout(t); } }, [toast]);

  function showToast(msg: string, isError = false) {
    setToast(msg);
    setToastError(isError);
  }

  async function loadData() {
    const [{ data: f }, { data: r }, { data: c }, att] = await Promise.all([
      supabase.from("forms").select("*").order("created_at", { ascending: false }),
      supabase.from("form_responses").select("form_id"),
      supabase.from("courses").select("id, title").order("title"),
      getGraduationAttachments(),
    ]);
    setForms((f || []) as FormRow[]);
    const counts: Record<string, number> = {};
    (r || []).forEach((resp: { form_id: string }) => {
      counts[resp.form_id] = (counts[resp.form_id] || 0) + 1;
    });
    setResponseCounts(counts);
    setCourses((c || []) as CourseLite[]);
    setAttachments(att);
    setLoading(false);
  }

  // Các course mà form này đang được gắn làm bài tốt nghiệp
  function attachedCoursesOf(formId: string): CourseLite[] {
    const ids: string[] = [];
    attachments.forEach((fId, courseId) => { if (fId === formId) ids.push(courseId); });
    return courses.filter((c) => ids.includes(c.id));
  }

  async function handleCreate() {
    const id = genId("form");
    setSaving(true);
    const { error } = await supabase.from("forms").insert({
      id,
      title: formData.title,
      description: formData.description || null,
      form_type: formData.form_type,
      status: "draft",
    });
    setSaving(false);
    if (error) { showToast("Lỗi: " + error.message, true); return; }
    setCreateOpen(false);
    setFormData({ title: "", description: "", form_type: "survey" });
    showToast("Tạo biểu mẫu thành công!");
    loadData();
  }

  async function togglePublish(form: FormRow) {
    const newStatus = form.status === "published" ? "draft" : "published";
    // Validate khi publish form graduation: >=1 câu có đáp án đúng, tổng điểm > 0
    if (newStatus === "published" && form.form_type === "graduation") {
      const { data: q } = await supabase
        .from("form_questions")
        .select("*")
        .eq("form_id", form.id)
        .order("order_index");
      const err = validateGraduationPublish((q || []) as FormQuestionRow[]);
      if (err) { showToast(err, true); return; }
    }
    const { error } = await supabase.from("forms").update({ status: newStatus }).eq("id", form.id);
    if (!error) {
      showToast(newStatus === "published" ? "Đã xuất bản biểu mẫu!" : "Đã chuyển về nháp");
      loadData();
    }
  }

  async function deleteForm(id: string) {
    if (!confirm("Xoá biểu mẫu này và tất cả câu trả lời?")) return;
    await supabase.from("forms").delete().eq("id", id);
    showToast("Đã xoá biểu mẫu");
    loadData();
  }

  function copyLink(formId: string) {
    const url = `${window.location.origin}/forms/${formId}`;
    navigator.clipboard.writeText(url);
    showToast("Đã copy link biểu mẫu!");
  }

  function openAttachDialog(form: FormRow) {
    setAttachForm(form);
    setAttachCourseId(courses[0]?.id || "");
  }

  async function handleAttach() {
    if (!attachForm || !attachCourseId) return;
    setSaving(true);
    const { error } = await attachGraduationForm(attachCourseId, attachForm.id);
    setSaving(false);
    if (error) { showToast("Lỗi: " + error, true); return; }
    const courseTitle = courses.find((c) => c.id === attachCourseId)?.title || attachCourseId;
    setAttachForm(null);
    showToast(`Đã gắn "${attachForm.title}" làm bài tốt nghiệp khoá ${courseTitle}!`);
    loadData();
  }

  function typeBadge(formType: FormType) {
    if (formType === "graduation") {
      return (
        <Badge variant="outline" className="bg-gold/15 text-gold border-gold/40">
          <GraduationCap className="h-3 w-3 mr-1" /> Tốt nghiệp
        </Badge>
      );
    }
    if (formType === "onboarding") {
      return (
        <Badge variant="outline" className="bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30">
          <UserPlus className="h-3 w-3 mr-1" /> Onboarding
        </Badge>
      );
    }
    return (
      <Badge variant="outline" className="bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-500/30">
        <FileText className="h-3 w-3 mr-1" /> Survey
      </Badge>
    );
  }

  if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><div className="text-muted-foreground">Đang tải...</div></div>;

  return (
    <PageTransition>
      <div className="space-y-6">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold"><span className="gold-gradient-text">Biểu mẫu</span></h1>
            <p className="text-muted-foreground mt-1">Tạo khảo sát, onboarding survey và bài tốt nghiệp có chấm điểm</p>
          </div>
          <Button onClick={() => setCreateOpen(true)} className="bg-gold hover:bg-gold/90 text-black font-semibold">
            <Plus className="h-4 w-4 mr-2" /> Tạo biểu mẫu
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
        {forms.length === 0 && (
          <Card className="py-16">
            <CardContent className="flex flex-col items-center gap-4 text-center">
              <div className="w-16 h-16 rounded-full bg-gold/10 flex items-center justify-center">
                <ClipboardCheck className="h-7 w-7 text-gold" />
              </div>
              <p className="font-semibold text-foreground">Chưa có biểu mẫu nào</p>
              <p className="text-sm text-muted-foreground">Bấm "Tạo biểu mẫu" để bắt đầu</p>
            </CardContent>
          </Card>
        )}

        {/* Form list */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {forms.map((form, i) => {
            const attachedCourses = form.form_type === "graduation" ? attachedCoursesOf(form.id) : [];
            return (
              <motion.div key={form.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                <Card className="h-full hover:border-gold/40 transition-all group">
                  <CardContent className="pt-5 space-y-4 flex flex-col h-full">
                    {/* Type + Status badges */}
                    <div className="flex items-center gap-2 flex-wrap">
                      {typeBadge(form.form_type)}
                      <Badge variant="outline" className={cn(
                        form.status === "published"
                          ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30"
                          : "bg-gray-500/15 text-gray-600 dark:text-gray-400 border-gray-500/30"
                      )}>
                        {form.status === "published" ? <><Globe className="h-3 w-3 mr-1" /> Đã xuất bản</> : <><Lock className="h-3 w-3 mr-1" /> Nháp</>}
                      </Badge>
                    </div>

                    {/* Title + desc */}
                    <div className="flex-1">
                      <h3 className="font-semibold text-foreground group-hover:text-gold transition-colors">{form.title}</h3>
                      {form.description && <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{form.description}</p>}
                      {/* Badge form đang được gắn làm bài tốt nghiệp */}
                      {attachedCourses.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {attachedCourses.map((c) => (
                            <Badge key={c.id} variant="outline" className="bg-gold/10 text-gold border-gold/40 text-[10px]">
                              <Link2 className="h-3 w-3 mr-1" /> Bài tốt nghiệp: {c.title}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Stats */}
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <BarChart3 className="h-3.5 w-3.5" /> {responseCounts[form.id] || 0} phản hồi
                      </span>
                      <span>{formatDate(form.created_at)}</span>
                    </div>

                    {/* Nút gắn bài tốt nghiệp — chỉ form graduation đã publish */}
                    {form.form_type === "graduation" && form.status === "published" && (
                      <Button size="sm" variant="outline" onClick={() => openAttachDialog(form)}
                        className="w-full border-gold/50 text-gold hover:bg-gold/10">
                        <GraduationCap className="h-3.5 w-3.5 mr-1.5" /> Gắn làm bài tốt nghiệp
                      </Button>
                    )}

                    {/* Actions */}
                    <div className="flex items-center gap-1.5 pt-2 border-t border-border">
                      <Link href={`/admin/forms/${form.id}`} className="flex-1">
                        <Button size="sm" variant="outline" className="w-full border-gold/50 text-gold hover:bg-gold/10">
                          <Pencil className="h-3.5 w-3.5 mr-1" /> Chỉnh sửa
                        </Button>
                      </Link>
                      <Link href={`/admin/forms/${form.id}/responses`}>
                        <Button size="sm" variant="outline"><Eye className="h-3.5 w-3.5" /></Button>
                      </Link>
                      <Button size="sm" variant="outline" onClick={() => togglePublish(form)}>
                        {form.status === "published" ? <Lock className="h-3.5 w-3.5" /> : <Globe className="h-3.5 w-3.5" />}
                      </Button>
                      {form.status === "published" && (
                        <Button size="sm" variant="outline" onClick={() => copyLink(form.id)}>
                          <Copy className="h-3.5 w-3.5" />
                        </Button>
                      )}
                      <Button size="sm" variant="ghost" onClick={() => deleteForm(form.id)} className="text-muted-foreground hover:text-red-500">
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
            <DialogTitle>Tạo biểu mẫu mới</DialogTitle>
            <DialogDescription>Tạo khảo sát, onboarding survey hoặc bài tốt nghiệp</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <label className="text-xs font-medium text-muted-foreground">Tên biểu mẫu *</label>
              <Input value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} placeholder="Ví dụ: Khảo sát mức độ hài lòng" className="mt-1" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Mô tả</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Mô tả ngắn về biểu mẫu..."
                rows={2}
                className="mt-1 w-full rounded-lg border border-border bg-card p-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-gold focus:outline-none resize-none"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Loại biểu mẫu</label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-2">
                {FORM_TYPE_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setFormData({ ...formData, form_type: opt.value })}
                    className={cn(
                      "rounded-xl border p-3 text-left transition-all",
                      formData.form_type === opt.value
                        ? "border-gold/50 bg-gold/10"
                        : "border-border hover:border-gold/30 hover:bg-gold/5"
                    )}
                  >
                    <opt.icon className={cn("h-5 w-5 mb-1", formData.form_type === opt.value ? "text-gold" : "text-muted-foreground")} />
                    <p className="text-sm font-medium text-foreground">{opt.label}</p>
                    <p className="text-[11px] text-muted-foreground">{opt.desc}</p>
                  </button>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>Huỷ</Button>
            <Button onClick={handleCreate} disabled={!formData.title || saving} className="bg-gold hover:bg-gold/90 text-black">
              {saving ? "Đang tạo..." : "Tạo biểu mẫu"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Attach graduation Dialog */}
      <Dialog open={!!attachForm} onOpenChange={(open) => { if (!open) setAttachForm(null); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Gắn làm bài tốt nghiệp</DialogTitle>
            <DialogDescription>
              Chọn khoá học sẽ dùng "{attachForm?.title}" làm bài tốt nghiệp. Gắn form mới sẽ thay form cũ (phản hồi cũ giữ nguyên).
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <label className="text-xs font-medium text-muted-foreground">Khoá học</label>
            <select
              value={attachCourseId}
              onChange={(e) => setAttachCourseId(e.target.value)}
              className="w-full rounded-lg border border-border bg-card p-2.5 text-sm text-foreground focus:border-gold focus:outline-none"
            >
              {courses.length === 0 && <option value="">Chưa có khoá học nào</option>}
              {courses.map((c) => (
                <option key={c.id} value={c.id}>{c.title}</option>
              ))}
            </select>
            {attachCourseId && attachments.get(attachCourseId) && attachments.get(attachCourseId) !== attachForm?.id && (
              <p className="text-xs text-amber-600 dark:text-amber-400">
                Khoá này đang gắn form khác — gắn tiếp sẽ thay thế.
              </p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAttachForm(null)}>Huỷ</Button>
            <Button onClick={handleAttach} disabled={!attachCourseId || saving} className="bg-gold hover:bg-gold/90 text-black">
              {saving ? "Đang gắn..." : "Gắn bài tốt nghiệp"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageTransition>
  );
}
