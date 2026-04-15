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
} from "lucide-react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { cn, formatDate } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageTransition } from "@/components/shared/PageTransition";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";

interface Form {
  id: string;
  title: string;
  description: string | null;
  form_type: "survey" | "onboarding";
  status: "draft" | "published";
  created_at: string;
}

function genId(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}

export default function AdminFormsPage() {
  const [forms, setForms] = useState<Form[]>([]);
  const [responseCounts, setResponseCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  // Dialog
  const [createOpen, setCreateOpen] = useState(false);
  const [formData, setFormData] = useState({ title: "", description: "", form_type: "survey" as "survey" | "onboarding" });

  useEffect(() => { loadData(); }, []);
  useEffect(() => { if (toast) { const t = setTimeout(() => setToast(null), 3000); return () => clearTimeout(t); } }, [toast]);

  async function loadData() {
    const [{ data: f }, { data: r }] = await Promise.all([
      supabase.from("forms").select("*").order("created_at", { ascending: false }),
      supabase.from("form_responses").select("form_id"),
    ]);
    setForms((f || []) as Form[]);
    const counts: Record<string, number> = {};
    (r || []).forEach((resp: { form_id: string }) => {
      counts[resp.form_id] = (counts[resp.form_id] || 0) + 1;
    });
    setResponseCounts(counts);
    setLoading(false);
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
    if (error) { setToast("Lỗi: " + error.message); return; }
    setCreateOpen(false);
    setFormData({ title: "", description: "", form_type: "survey" });
    setToast("Tạo biểu mẫu thành công!");
    loadData();
  }

  async function togglePublish(form: Form) {
    const newStatus = form.status === "published" ? "draft" : "published";
    const { error } = await supabase.from("forms").update({ status: newStatus }).eq("id", form.id);
    if (!error) {
      setToast(newStatus === "published" ? "Đã xuất bản biểu mẫu!" : "Đã chuyển về nháp");
      loadData();
    }
  }

  async function deleteForm(id: string) {
    if (!confirm("Xoá biểu mẫu này và tất cả câu trả lời?")) return;
    await supabase.from("forms").delete().eq("id", id);
    setToast("Đã xoá biểu mẫu");
    loadData();
  }

  function copyLink(formId: string) {
    const url = `${window.location.origin}/forms/${formId}`;
    navigator.clipboard.writeText(url);
    setToast("Đã copy link biểu mẫu!");
  }

  if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><div className="text-muted-foreground">Đang tải...</div></div>;

  return (
    <PageTransition>
      <div className="space-y-6">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold"><span className="gold-gradient-text">Biểu mẫu</span></h1>
            <p className="text-muted-foreground mt-1">Tạo khảo sát, onboarding survey và thu thập phản hồi</p>
          </div>
          <Button onClick={() => setCreateOpen(true)} className="bg-gold hover:bg-gold/90 text-black font-semibold">
            <Plus className="h-4 w-4 mr-2" /> Tạo biểu mẫu
          </Button>
        </motion.div>

        {/* Toast */}
        <AnimatePresence>
          {toast && (
            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
              className="flex items-center gap-2 rounded-lg bg-emerald-500/10 border border-emerald-500/30 p-3 text-sm text-emerald-700 dark:text-emerald-400">
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
          {forms.map((form, i) => (
            <motion.div key={form.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <Card className="h-full hover:border-gold/40 transition-all group">
                <CardContent className="pt-5 space-y-4 flex flex-col h-full">
                  {/* Type + Status badges */}
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className={cn(
                      form.form_type === "onboarding"
                        ? "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30"
                        : "bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-500/30"
                    )}>
                      {form.form_type === "onboarding" ? <><UserPlus className="h-3 w-3 mr-1" /> Onboarding</> : <><FileText className="h-3 w-3 mr-1" /> Survey</>}
                    </Badge>
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
                  </div>

                  {/* Stats */}
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <BarChart3 className="h-3.5 w-3.5" /> {responseCounts[form.id] || 0} phản hồi
                    </span>
                    <span>{formatDate(form.created_at)}</span>
                  </div>

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
          ))}
        </div>
      </div>

      {/* Create Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Tạo biểu mẫu mới</DialogTitle>
            <DialogDescription>Tạo khảo sát hoặc onboarding survey</DialogDescription>
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
              <div className="flex gap-3 mt-2">
                {[
                  { value: "survey", label: "Khảo sát", desc: "Gửi link cho bất kỳ ai", icon: FileText },
                  { value: "onboarding", label: "Onboarding", desc: "Hiện khi học viên đăng ký", icon: UserPlus },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setFormData({ ...formData, form_type: opt.value as "survey" | "onboarding" })}
                    className={cn(
                      "flex-1 rounded-xl border p-3 text-left transition-all",
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
    </PageTransition>
  );
}
