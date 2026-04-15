"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Play,
  Pencil,
  Save,
  X,
  Plus,
  FileDown,
  Upload,
  Trash2,
  ChevronDown,
  ChevronUp,
  Film,
  Clock,
  Users,
  BookOpen,
  Layers,
  HelpCircle,
  Image,
  CheckCircle2,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { cn, formatPrice, formatDuration } from "@/lib/utils";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { PageTransition } from "@/components/shared/PageTransition";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

/* ─── Types ─── */
interface Course {
  id: string;
  title: string;
  description: string;
  price: number | null;
  price_label: string | null;
  thumbnail_url: string | null;
  badge_label: string | null;
  total_lessons: number;
  total_duration_sec: number;
}

interface Module {
  id: string;
  course_id: string;
  title: string;
  order_index: number;
}

interface Lesson {
  id: string;
  module_id: string;
  title: string;
  video_url: string | null;
  thumbnail_url: string | null;
  description: string | null;
  duration_sec: number;
  order_index: number;
  materials: { name: string; url: string; type: string }[];
}

/* ─── Helpers ─── */
function genId(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}

/* ─────────────────────────────────────────────── */
export default function AdminCoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [modules, setModules] = useState<Module[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [enrollCounts, setEnrollCounts] = useState<Record<string, number>>({});
  const [expandedCourse, setExpandedCourse] = useState<string | null>(null);
  const [expandedModule, setExpandedModule] = useState<string | null>(null);

  // Edit states
  const [editingLesson, setEditingLesson] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Lesson>>({});
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  // Dialog states
  const [courseDialog, setCourseDialog] = useState(false);
  const [moduleDialog, setModuleDialog] = useState(false);
  const [lessonDialog, setLessonDialog] = useState(false);
  const [editCourseDialog, setEditCourseDialog] = useState(false);
  const [courseForm, setCourseForm] = useState({ title: "", description: "", price: "", price_label: "", thumbnail_url: "", badge_label: "" });
  const [moduleForm, setModuleForm] = useState({ title: "", course_id: "" });
  const [lessonForm, setLessonForm] = useState({ title: "", module_id: "", video_url: "", thumbnail_url: "", description: "", duration_sec: "" });
  const [editCourseForm, setEditCourseForm] = useState<Course | null>(null);

  useEffect(() => { loadData(); }, []);

  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(t);
    }
  }, [toast]);

  async function loadData() {
    const [{ data: c }, { data: m }, { data: l }, { data: e }] = await Promise.all([
      supabase.from("courses").select("*").order("created_at"),
      supabase.from("modules").select("*").order("order_index"),
      supabase.from("lessons").select("*").order("order_index"),
      supabase.from("enrollments").select("course_id"),
    ]);
    setCourses((c || []) as Course[]);
    setModules((m || []) as Module[]);
    setLessons((l || []) as Lesson[]);
    const counts: Record<string, number> = {};
    (e || []).forEach((en: { course_id: string }) => {
      counts[en.course_id] = (counts[en.course_id] || 0) + 1;
    });
    setEnrollCounts(counts);
  }

  /* ─── Course CRUD ─── */
  async function createCourse() {
    const id = genId("c");
    setSaving(true);
    const { error } = await supabase.from("courses").insert({
      id,
      title: courseForm.title,
      description: courseForm.description,
      price: courseForm.price ? parseInt(courseForm.price) : null,
      price_label: courseForm.price_label || null,
      thumbnail_url: courseForm.thumbnail_url || null,
      badge_label: courseForm.badge_label || null,
      total_lessons: 0,
      total_duration_sec: 0,
    });
    setSaving(false);
    if (!error) {
      setCourseDialog(false);
      setCourseForm({ title: "", description: "", price: "", price_label: "", thumbnail_url: "", badge_label: "" });
      setToast("Tạo khoá học thành công!");
      loadData();
    }
  }

  async function updateCourse() {
    if (!editCourseForm) return;
    setSaving(true);
    const { error } = await supabase.from("courses").update({
      title: editCourseForm.title,
      description: editCourseForm.description,
      price: editCourseForm.price,
      price_label: editCourseForm.price_label,
      thumbnail_url: editCourseForm.thumbnail_url,
      badge_label: editCourseForm.badge_label,
    }).eq("id", editCourseForm.id);
    setSaving(false);
    if (!error) {
      setEditCourseDialog(false);
      setToast("Cập nhật khoá học thành công!");
      loadData();
    }
  }

  async function deleteCourse(courseId: string) {
    if (!confirm("Xoá khoá học này? Tất cả modules và lessons bên trong cũng sẽ bị xoá.")) return;
    const courseModuleIds = modules.filter((m) => m.course_id === courseId).map((m) => m.id);
    if (courseModuleIds.length > 0) {
      await supabase.from("lessons").delete().in("module_id", courseModuleIds);
      await supabase.from("modules").delete().eq("course_id", courseId);
    }
    await supabase.from("courses").delete().eq("id", courseId);
    setToast("Đã xoá khoá học");
    loadData();
  }

  /* ─── Module CRUD ─── */
  async function createModule() {
    const id = genId("m");
    const existing = modules.filter((m) => m.course_id === moduleForm.course_id);
    setSaving(true);
    const { error } = await supabase.from("modules").insert({
      id,
      course_id: moduleForm.course_id,
      title: moduleForm.title,
      order_index: existing.length + 1,
    });
    setSaving(false);
    if (!error) {
      setModuleDialog(false);
      setModuleForm({ title: "", course_id: "" });
      setToast("Tạo module thành công!");
      loadData();
    }
  }

  async function deleteModule(moduleId: string) {
    if (!confirm("Xoá module này và tất cả bài học bên trong?")) return;
    await supabase.from("lessons").delete().eq("module_id", moduleId);
    await supabase.from("modules").delete().eq("id", moduleId);
    setToast("Đã xoá module");
    loadData();
  }

  /* ─── Lesson CRUD ─── */
  async function createLesson() {
    const id = genId("l");
    const existing = lessons.filter((l) => l.module_id === lessonForm.module_id);
    setSaving(true);
    const { error } = await supabase.from("lessons").insert({
      id,
      module_id: lessonForm.module_id,
      title: lessonForm.title,
      video_url: lessonForm.video_url || null,
      duration_sec: lessonForm.duration_sec ? parseInt(lessonForm.duration_sec) : 0,
      order_index: existing.length + 1,
      materials: [],
    });
    setSaving(false);
    if (!error) {
      setLessonDialog(false);
      setLessonForm({ title: "", module_id: "", video_url: "", thumbnail_url: "", description: "", duration_sec: "" });
      setToast("Tạo bài học thành công!");
      // Update course total_lessons
      const mod = modules.find((m) => m.id === lessonForm.module_id);
      if (mod) {
        const allModIds = modules.filter((m) => m.course_id === mod.course_id).map((m) => m.id);
        const total = lessons.filter((l) => allModIds.includes(l.module_id)).length + 1;
        await supabase.from("courses").update({ total_lessons: total }).eq("id", mod.course_id);
      }
      loadData();
    }
  }

  async function deleteLesson(lessonId: string) {
    if (!confirm("Xoá bài học này?")) return;
    await supabase.from("lessons").delete().eq("id", lessonId);
    setToast("Đã xoá bài học");
    loadData();
  }

  function startEdit(lesson: Lesson) {
    setEditingLesson(lesson.id);
    setEditForm({ ...lesson });
  }

  function cancelEdit() {
    setEditingLesson(null);
    setEditForm({});
  }

  async function saveLesson() {
    if (!editingLesson || !editForm) return;
    setSaving(true);
    const { error } = await supabase.from("lessons").update({
      title: editForm.title,
      video_url: editForm.video_url,
      duration_sec: editForm.duration_sec,
      materials: editForm.materials,
    }).eq("id", editingLesson);
    if (!error) {
      setLessons((prev) =>
        prev.map((l) => (l.id === editingLesson ? { ...l, ...editForm } as Lesson : l))
      );
      setEditingLesson(null);
      setEditForm({});
      setToast("Đã lưu bài học!");
    }
    setSaving(false);
  }

  function addMaterial() {
    setEditForm((prev) => ({
      ...prev,
      materials: [...(prev.materials || []), { name: "", url: "", type: "pdf" }],
    }));
  }

  function updateMaterial(index: number, field: string, value: string) {
    setEditForm((prev) => ({
      ...prev,
      materials: (prev.materials || []).map((m, i) => (i === index ? { ...m, [field]: value } : m)),
    }));
  }

  function removeMaterial(index: number) {
    setEditForm((prev) => ({
      ...prev,
      materials: (prev.materials || []).filter((_, i) => i !== index),
    }));
  }

  function getCourseLessons(courseId: string) {
    const courseModuleIds = new Set(modules.filter((m) => m.course_id === courseId).map((m) => m.id));
    return lessons.filter((l) => courseModuleIds.has(l.module_id));
  }

  function getCourseModules(courseId: string) {
    return modules.filter((m) => m.course_id === courseId).sort((a, b) => a.order_index - b.order_index);
  }

  function getModuleLessons(moduleId: string) {
    return lessons.filter((l) => l.module_id === moduleId).sort((a, b) => a.order_index - b.order_index);
  }

  /* ─── Render ─── */
  return (
    <PageTransition>
      <div className="space-y-6">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">
              <span className="gold-gradient-text">Quản lý Khoá học</span>
            </h1>
            <p className="text-muted-foreground mt-1">Quản lý khoá học, modules, bài học, video và tài liệu</p>
          </div>
          <Button onClick={() => setCourseDialog(true)} className="bg-gold hover:bg-gold/90 text-black font-semibold">
            <Plus className="h-4 w-4 mr-2" /> Tạo khoá học
          </Button>
        </motion.div>

        {/* Toast */}
        <AnimatePresence>
          {toast && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="flex items-center gap-2 rounded-lg bg-emerald-500/10 border border-emerald-500/30 p-3 text-sm text-emerald-700 dark:text-emerald-400"
            >
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              {toast}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Empty state */}
        {courses.length === 0 && (
          <Card className="py-16">
            <CardContent className="flex flex-col items-center gap-4 text-center">
              <div className="w-16 h-16 rounded-full bg-gold/10 flex items-center justify-center">
                <BookOpen className="h-7 w-7 text-gold" />
              </div>
              <div>
                <p className="font-semibold text-foreground">Chưa có khoá học nào</p>
                <p className="text-sm text-muted-foreground mt-1">Bấm "Tạo khoá học" để bắt đầu</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* ─── Course list ─── */}
        <div className="space-y-4">
          {courses.map((course) => {
            const courseLessons = getCourseLessons(course.id);
            const courseModules = getCourseModules(course.id);
            const isExpanded = expandedCourse === course.id;
            const videoCount = courseLessons.filter((l) => l.video_url).length;

            return (
              <motion.div key={course.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
                <Card>
                  {/* Course header */}
                  <CardHeader className="cursor-pointer" onClick={() => setExpandedCourse(isExpanded ? null : course.id)}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-xl bg-muted overflow-hidden shrink-0 flex items-center justify-center">
                          {course.thumbnail_url ? (
                            <img src={course.thumbnail_url} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <BookOpen className="h-6 w-6 text-muted-foreground" />
                          )}
                        </div>
                        <div>
                          <CardTitle className="text-lg">{course.title}</CardTitle>
                          <p className="text-sm text-muted-foreground mt-0.5 line-clamp-1">{course.description}</p>
                          <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1"><Layers className="h-3.5 w-3.5" /> {courseModules.length} module</span>
                            <span className="flex items-center gap-1"><Film className="h-3.5 w-3.5" /> {videoCount}/{courseLessons.length} video</span>
                            <span className="flex items-center gap-1"><Users className="h-3.5 w-3.5" /> {enrollCounts[course.id] || 0} học viên</span>
                            <span className="font-semibold text-gold">
                              {course.price ? formatPrice(course.price) : course.price_label || "—"}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => { e.stopPropagation(); setEditCourseForm(course); setEditCourseDialog(true); }}
                          className="text-muted-foreground hover:text-gold"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => { e.stopPropagation(); deleteCourse(course.id); }}
                          className="text-muted-foreground hover:text-red-500"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                        {isExpanded ? <ChevronUp className="h-5 w-5 text-muted-foreground" /> : <ChevronDown className="h-5 w-5 text-muted-foreground" />}
                      </div>
                    </div>
                  </CardHeader>

                  {/* Expanded: modules + lessons */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}>
                        <CardContent className="space-y-3 pt-0">
                          <Separator />

                          {/* Actions */}
                          <div className="flex gap-2 pt-2">
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-gold/50 text-gold hover:bg-gold/10"
                              onClick={() => { setModuleForm({ title: "", course_id: course.id }); setModuleDialog(true); }}
                            >
                              <Plus className="h-3.5 w-3.5 mr-1" /> Thêm Module
                            </Button>
                          </div>

                          {/* Modules */}
                          {courseModules.length === 0 && (
                            <p className="text-sm text-muted-foreground text-center py-4">
                              Chưa có module. Bấm "Thêm Module" để bắt đầu.
                            </p>
                          )}

                          {courseModules.map((mod) => {
                            const modLessons = getModuleLessons(mod.id);
                            const isModExpanded = expandedModule === mod.id;

                            return (
                              <Card key={mod.id} className="bg-card/50">
                                <CardHeader className="py-3 px-4 cursor-pointer" onClick={() => setExpandedModule(isModExpanded ? null : mod.id)}>
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-gold/10 text-gold font-bold text-xs">
                                        {mod.order_index}
                                      </div>
                                      <div>
                                        <p className="text-sm font-semibold text-foreground">{mod.title}</p>
                                        <p className="text-[11px] text-muted-foreground">{modLessons.length} bài học</p>
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-1">
                                      <Button
                                        size="sm" variant="ghost"
                                        onClick={(e) => { e.stopPropagation(); deleteModule(mod.id); }}
                                        className="text-muted-foreground hover:text-red-500 h-7 w-7 p-0"
                                      >
                                        <Trash2 className="h-3.5 w-3.5" />
                                      </Button>
                                      {isModExpanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                                    </div>
                                  </div>
                                </CardHeader>

                                <AnimatePresence>
                                  {isModExpanded && (
                                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}>
                                      <CardContent className="pt-0 space-y-2">
                                        <Separator />

                                        {/* Add lesson button */}
                                        <Button
                                          size="sm" variant="outline"
                                          className="border-dashed border-gold/40 text-gold hover:bg-gold/10 w-full"
                                          onClick={() => { setLessonForm({ title: "", module_id: mod.id, video_url: "", thumbnail_url: "", description: "", duration_sec: "" }); setLessonDialog(true); }}
                                        >
                                          <Plus className="h-3.5 w-3.5 mr-1" /> Thêm bài học
                                        </Button>

                                        {/* Lesson list */}
                                        {modLessons.map((lesson) => {
                                          const isEditing = editingLesson === lesson.id;
                                          const hasVideo = !!lesson.video_url;

                                          return (
                                            <Card key={lesson.id} className={cn("transition-all", isEditing && "ring-1 ring-gold gold-border-glow")}>
                                              <CardContent className="pt-4 space-y-3">
                                                {isEditing ? (
                                                  /* ─── Edit mode ─── */
                                                  <div className="space-y-4">
                                                    <div className="flex items-center justify-between">
                                                      <span className="text-xs text-gold font-medium">Chỉnh sửa bài {lesson.order_index}</span>
                                                      <div className="flex gap-2">
                                                        <Button size="sm" variant="outline" onClick={cancelEdit}>
                                                          <X className="h-3.5 w-3.5 mr-1" /> Huỷ
                                                        </Button>
                                                        <Button size="sm" onClick={saveLesson} disabled={saving} className="bg-gold hover:bg-gold/90 text-black">
                                                          <Save className="h-3.5 w-3.5 mr-1" /> {saving ? "Đang lưu..." : "Lưu"}
                                                        </Button>
                                                      </div>
                                                    </div>

                                                    <div>
                                                      <label className="text-xs text-muted-foreground font-medium">Tên bài học</label>
                                                      <Input value={editForm.title || ""} onChange={(e) => setEditForm({ ...editForm, title: e.target.value })} className="mt-1" />
                                                    </div>

                                                    <div>
                                                      <label className="text-xs text-muted-foreground font-medium flex items-center gap-1">
                                                        <Film className="h-3.5 w-3.5" /> Bunny Stream Video ID
                                                      </label>
                                                      <Input
                                                        value={editForm.video_url || ""}
                                                        onChange={(e) => setEditForm({ ...editForm, video_url: e.target.value })}
                                                        placeholder="Dán Video ID từ Bunny Stream..."
                                                        className="mt-1 font-mono text-xs"
                                                      />
                                                    </div>

                                                    <div>
                                                      <label className="text-xs text-muted-foreground font-medium">Thời lượng (giây)</label>
                                                      <Input
                                                        type="number"
                                                        value={editForm.duration_sec || 0}
                                                        onChange={(e) => setEditForm({ ...editForm, duration_sec: parseInt(e.target.value) || 0 })}
                                                        className="mt-1 w-32"
                                                      />
                                                    </div>

                                                    {/* Materials */}
                                                    <div>
                                                      <div className="flex items-center justify-between">
                                                        <label className="text-xs text-muted-foreground font-medium flex items-center gap-1">
                                                          <FileDown className="h-3.5 w-3.5" /> Tài liệu đính kèm
                                                        </label>
                                                        <Button size="sm" variant="outline" onClick={addMaterial} className="text-xs h-7">
                                                          <Plus className="h-3 w-3 mr-1" /> Thêm
                                                        </Button>
                                                      </div>
                                                      <div className="space-y-2 mt-2">
                                                        {(editForm.materials || []).map((mat, j) => (
                                                          <div key={j} className="flex gap-2 items-center">
                                                            <Input value={mat.name} onChange={(e) => updateMaterial(j, "name", e.target.value)} placeholder="Tên tài liệu" className="flex-1 text-xs" />
                                                            <Input value={mat.url} onChange={(e) => updateMaterial(j, "url", e.target.value)} placeholder="URL file" className="flex-1 text-xs font-mono" />
                                                            <select
                                                              value={mat.type}
                                                              onChange={(e) => updateMaterial(j, "type", e.target.value)}
                                                              className="rounded-md border border-border bg-card px-2 py-1.5 text-xs"
                                                            >
                                                              <option value="pdf">PDF</option>
                                                              <option value="slide">Slide</option>
                                                              <option value="image">Ảnh</option>
                                                              <option value="excel">Excel</option>
                                                              <option value="video">Video</option>
                                                            </select>
                                                            <Button size="sm" variant="ghost" onClick={() => removeMaterial(j)} className="text-red-400 hover:text-red-500 h-8 w-8 p-0">
                                                              <Trash2 className="h-3.5 w-3.5" />
                                                            </Button>
                                                          </div>
                                                        ))}
                                                      </div>
                                                    </div>
                                                  </div>
                                                ) : (
                                                  /* ─── View mode ─── */
                                                  <div className="flex items-center gap-3">
                                                    <div className={cn(
                                                      "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg font-bold text-xs",
                                                      hasVideo ? "bg-emerald-500/15 text-emerald-500" : "bg-muted text-muted-foreground"
                                                    )}>
                                                      {lesson.order_index}
                                                    </div>
                                                    <div className={cn(
                                                      "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
                                                      hasVideo ? "bg-gold/10" : "bg-muted"
                                                    )}>
                                                      {hasVideo ? <Play className="h-3.5 w-3.5 text-gold" /> : <Film className="h-3.5 w-3.5 text-muted-foreground/40" />}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                      <p className="text-sm font-medium text-foreground truncate">{lesson.title}</p>
                                                      <div className="flex items-center gap-3 text-[10px] text-muted-foreground mt-0.5">
                                                        <span>{formatDuration(lesson.duration_sec)}</span>
                                                        {hasVideo ? <span className="text-emerald-500 font-medium">Video OK</span> : <span className="text-orange-500">Chưa có video</span>}
                                                        {lesson.materials && lesson.materials.length > 0 && <span>{lesson.materials.length} tài liệu</span>}
                                                      </div>
                                                    </div>
                                                    <Button size="sm" variant="ghost" onClick={() => startEdit(lesson)} className="text-muted-foreground hover:text-gold shrink-0">
                                                      <Pencil className="h-4 w-4" />
                                                    </Button>
                                                    <Button size="sm" variant="ghost" onClick={() => deleteLesson(lesson.id)} className="text-muted-foreground hover:text-red-500 shrink-0">
                                                      <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                  </div>
                                                )}
                                              </CardContent>
                                            </Card>
                                          );
                                        })}
                                      </CardContent>
                                    </motion.div>
                                  )}
                                </AnimatePresence>
                              </Card>
                            );
                          })}
                        </CardContent>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* ══════════════════════════════════════════════ */}
      {/* DIALOGS                                        */}
      {/* ══════════════════════════════════════════════ */}

      {/* ─── Create Course Dialog ─── */}
      <Dialog open={courseDialog} onOpenChange={setCourseDialog}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Tạo khoá học mới</DialogTitle>
            <DialogDescription>Nhập thông tin khoá học</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <label className="text-xs font-medium text-muted-foreground">Tên khoá học *</label>
              <Input value={courseForm.title} onChange={(e) => setCourseForm({ ...courseForm, title: e.target.value })} placeholder="Ví dụ: Khoá 3 Hộp PRO" className="mt-1" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Mô tả</label>
              <textarea
                value={courseForm.description}
                onChange={(e) => setCourseForm({ ...courseForm, description: e.target.value })}
                placeholder="Mô tả ngắn về khoá học..."
                rows={3}
                className="mt-1 w-full rounded-lg border border-border bg-card p-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-gold focus:outline-none resize-none"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground">Giá (VND)</label>
                <Input type="number" value={courseForm.price} onChange={(e) => setCourseForm({ ...courseForm, price: e.target.value })} placeholder="3990000" className="mt-1" />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Label giá (nếu không có giá)</label>
                <Input value={courseForm.price_label} onChange={(e) => setCourseForm({ ...courseForm, price_label: e.target.value })} placeholder="Liên hệ" className="mt-1" />
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Thumbnail URL</label>
              <Input value={courseForm.thumbnail_url} onChange={(e) => setCourseForm({ ...courseForm, thumbnail_url: e.target.value })} placeholder="https://..." className="mt-1" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Badge label (hiển thị trên thumbnail)</label>
              <Input value={courseForm.badge_label} onChange={(e) => setCourseForm({ ...courseForm, badge_label: e.target.value })} placeholder="Ví dụ: Best Seller, 1-on-1, Hot..." className="mt-1" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCourseDialog(false)}>Huỷ</Button>
            <Button onClick={createCourse} disabled={!courseForm.title || saving} className="bg-gold hover:bg-gold/90 text-black">
              {saving ? "Đang tạo..." : "Tạo khoá học"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Edit Course Dialog ─── */}
      <Dialog open={editCourseDialog} onOpenChange={setEditCourseDialog}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Chỉnh sửa khoá học</DialogTitle>
          </DialogHeader>
          {editCourseForm && (
            <div className="space-y-4 py-2">
              <div>
                <label className="text-xs font-medium text-muted-foreground">Tên khoá học</label>
                <Input value={editCourseForm.title} onChange={(e) => setEditCourseForm({ ...editCourseForm, title: e.target.value })} className="mt-1" />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Mô tả</label>
                <textarea
                  value={editCourseForm.description}
                  onChange={(e) => setEditCourseForm({ ...editCourseForm, description: e.target.value })}
                  rows={3}
                  className="mt-1 w-full rounded-lg border border-border bg-card p-3 text-sm text-foreground focus:border-gold focus:outline-none resize-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Giá (VND)</label>
                  <Input type="number" value={editCourseForm.price || ""} onChange={(e) => setEditCourseForm({ ...editCourseForm, price: parseInt(e.target.value) || null })} className="mt-1" />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Label giá</label>
                  <Input value={editCourseForm.price_label || ""} onChange={(e) => setEditCourseForm({ ...editCourseForm, price_label: e.target.value })} className="mt-1" />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Thumbnail URL</label>
                <Input value={editCourseForm.thumbnail_url || ""} onChange={(e) => setEditCourseForm({ ...editCourseForm, thumbnail_url: e.target.value })} className="mt-1" />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Badge label (hiển thị trên thumbnail)</label>
                <Input value={editCourseForm.badge_label || ""} onChange={(e) => setEditCourseForm({ ...editCourseForm, badge_label: e.target.value })} placeholder="Ví dụ: Best Seller, 1-on-1, Hot..." className="mt-1" />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditCourseDialog(false)}>Huỷ</Button>
            <Button onClick={updateCourse} disabled={saving} className="bg-gold hover:bg-gold/90 text-black">
              {saving ? "Đang lưu..." : "Lưu"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Create Module Dialog ─── */}
      <Dialog open={moduleDialog} onOpenChange={setModuleDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Thêm Module</DialogTitle>
            <DialogDescription>
              Module cho khoá: <span className="text-foreground font-semibold">{courses.find((c) => c.id === moduleForm.course_id)?.title}</span>
            </DialogDescription>
          </DialogHeader>
          <div className="py-2">
            <label className="text-xs font-medium text-muted-foreground">Tên Module *</label>
            <Input
              value={moduleForm.title}
              onChange={(e) => setModuleForm({ ...moduleForm, title: e.target.value })}
              placeholder="Ví dụ: Toàn bộ bài học"
              className="mt-1"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModuleDialog(false)}>Huỷ</Button>
            <Button onClick={createModule} disabled={!moduleForm.title || saving} className="bg-gold hover:bg-gold/90 text-black">
              {saving ? "Đang tạo..." : "Tạo Module"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Create Lesson Dialog ─── */}
      <Dialog open={lessonDialog} onOpenChange={setLessonDialog}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Thêm bài học</DialogTitle>
            <DialogDescription>
              Module: <span className="text-foreground font-semibold">{modules.find((m) => m.id === lessonForm.module_id)?.title}</span>
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <label className="text-xs font-medium text-muted-foreground">Tên bài học *</label>
              <Input value={lessonForm.title} onChange={(e) => setLessonForm({ ...lessonForm, title: e.target.value })} placeholder="Ví dụ: Chương 1: Lời chào mừng" className="mt-1" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                <Film className="h-3.5 w-3.5" /> Bunny Stream Video ID
              </label>
              <Input value={lessonForm.video_url} onChange={(e) => setLessonForm({ ...lessonForm, video_url: e.target.value })} placeholder="Dán Video ID (có thể thêm sau)" className="mt-1 font-mono text-xs" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Thời lượng (giây)</label>
              <Input type="number" value={lessonForm.duration_sec} onChange={(e) => setLessonForm({ ...lessonForm, duration_sec: e.target.value })} placeholder="720" className="mt-1 w-32" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setLessonDialog(false)}>Huỷ</Button>
            <Button onClick={createLesson} disabled={!lessonForm.title || saving} className="bg-gold hover:bg-gold/90 text-black">
              {saving ? "Đang tạo..." : "Tạo bài học"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageTransition>
  );
}
