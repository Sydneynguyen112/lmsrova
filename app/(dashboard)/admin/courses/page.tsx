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
  ImagePlus,
  Upload,
  Trash2,
  GripVertical,
  ChevronDown,
  ChevronUp,
  Film,
  Clock,
  Users,
  BookOpen,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { cn, formatPrice, formatDuration } from "@/lib/utils";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { PageTransition } from "@/components/shared/PageTransition";

interface Course {
  id: string;
  title: string;
  description: string;
  price: number | null;
  price_label: string | null;
  thumbnail_url: string | null;
  total_lessons: number;
  total_duration_sec: number;
}

interface Lesson {
  id: string;
  module_id: string;
  title: string;
  video_url: string | null;
  duration_sec: number;
  order_index: number;
  materials: { name: string; url: string; type: string }[];
}

export default function AdminCoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [enrollCounts, setEnrollCounts] = useState<Record<string, number>>({});
  const [expandedCourse, setExpandedCourse] = useState<string | null>(null);
  const [editingLesson, setEditingLesson] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Lesson>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    const [{ data: c }, { data: l }, { data: e }] = await Promise.all([
      supabase.from("courses").select("*").order("created_at"),
      supabase.from("lessons").select("*").order("order_index"),
      supabase.from("enrollments").select("course_id"),
    ]);
    setCourses((c || []) as Course[]);
    setLessons((l || []) as Lesson[]);
    const counts: Record<string, number> = {};
    (e || []).forEach((en: { course_id: string }) => {
      counts[en.course_id] = (counts[en.course_id] || 0) + 1;
    });
    setEnrollCounts(counts);
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
    const { error } = await supabase
      .from("lessons")
      .update({
        title: editForm.title,
        video_url: editForm.video_url,
        duration_sec: editForm.duration_sec,
        materials: editForm.materials,
      })
      .eq("id", editingLesson);

    if (!error) {
      setLessons((prev) =>
        prev.map((l) => (l.id === editingLesson ? { ...l, ...editForm } as Lesson : l))
      );
      setEditingLesson(null);
      setEditForm({});
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
      materials: (prev.materials || []).map((m, i) =>
        i === index ? { ...m, [field]: value } : m
      ),
    }));
  }

  function removeMaterial(index: number) {
    setEditForm((prev) => ({
      ...prev,
      materials: (prev.materials || []).filter((_, i) => i !== index),
    }));
  }

  // Get lessons for a course (via module)
  function getCourseLessons(courseId: string) {
    // For now assume module ID pattern m-{courseId suffix}-all
    return lessons.filter((l) => l.module_id.includes(courseId.replace("c-", "")));
  }

  return (
    <PageTransition>
      <div className="space-y-6">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-2xl md:text-3xl font-bold">
            <span className="gold-gradient-text">Quản lý Khoá học</span>
          </h1>
          <p className="text-muted-foreground mt-1">
            Quản lý video, tài liệu và nội dung bài học
          </p>
        </motion.div>

        {/* Course list */}
        <div className="space-y-4">
          {courses.map((course) => {
            const courseLessons = getCourseLessons(course.id);
            const isExpanded = expandedCourse === course.id;
            const videoCount = courseLessons.filter((l) => l.video_url).length;

            return (
              <motion.div
                key={course.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Card>
                  {/* Course header — clickable */}
                  <CardHeader
                    className="cursor-pointer"
                    onClick={() => setExpandedCourse(isExpanded ? null : course.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        {/* Thumbnail */}
                        <div className="w-16 h-16 rounded-xl bg-muted overflow-hidden shrink-0 flex items-center justify-center">
                          {course.thumbnail_url ? (
                            <img src={course.thumbnail_url} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <BookOpen className="h-6 w-6 text-muted-foreground" />
                          )}
                        </div>
                        <div>
                          <CardTitle className="text-lg">{course.title}</CardTitle>
                          <p className="text-sm text-muted-foreground mt-0.5 line-clamp-1">
                            {course.description}
                          </p>
                          <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Film className="h-3.5 w-3.5" />
                              {videoCount}/{courseLessons.length} video
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="h-3.5 w-3.5" />
                              {formatDuration(course.total_duration_sec)}
                            </span>
                            <span className="flex items-center gap-1">
                              <Users className="h-3.5 w-3.5" />
                              {enrollCounts[course.id] || 0} học viên
                            </span>
                            <span className="font-semibold text-gold">
                              {course.price ? formatPrice(course.price) : course.price_label || "—"}
                            </span>
                          </div>
                        </div>
                      </div>
                      {isExpanded ? (
                        <ChevronUp className="h-5 w-5 text-muted-foreground shrink-0" />
                      ) : (
                        <ChevronDown className="h-5 w-5 text-muted-foreground shrink-0" />
                      )}
                    </div>
                  </CardHeader>

                  {/* Expanded: lesson list */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                      >
                        <CardContent className="space-y-2 pt-0">
                          <Separator />
                          <div className="text-xs text-muted-foreground font-medium uppercase tracking-wide pt-2">
                            Danh sách bài học ({courseLessons.length})
                          </div>

                          {courseLessons.map((lesson) => {
                            const isEditing = editingLesson === lesson.id;
                            const hasVideo = !!lesson.video_url;

                            return (
                              <Card
                                key={lesson.id}
                                className={cn(
                                  "transition-all",
                                  isEditing && "ring-1 ring-gold gold-border-glow"
                                )}
                              >
                                <CardContent className="pt-4 space-y-3">
                                  {isEditing ? (
                                    /* ─── Edit mode ─── */
                                    <div className="space-y-4">
                                      <div className="flex items-center justify-between">
                                        <span className="text-xs text-gold font-medium">
                                          Chỉnh sửa bài {lesson.order_index}
                                        </span>
                                        <div className="flex gap-2">
                                          <Button size="sm" variant="outline" onClick={cancelEdit}>
                                            <X className="h-3.5 w-3.5 mr-1" /> Huỷ
                                          </Button>
                                          <Button
                                            size="sm"
                                            onClick={saveLesson}
                                            disabled={saving}
                                            className="bg-gold hover:bg-gold/90 text-black"
                                          >
                                            <Save className="h-3.5 w-3.5 mr-1" /> {saving ? "Đang lưu..." : "Lưu"}
                                          </Button>
                                        </div>
                                      </div>

                                      {/* Title */}
                                      <div>
                                        <label className="text-xs text-muted-foreground font-medium">Tên bài học</label>
                                        <Input
                                          value={editForm.title || ""}
                                          onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                                          className="mt-1"
                                        />
                                      </div>

                                      {/* Video URL (Bunny Stream Video ID) */}
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
                                        <p className="text-[10px] text-muted-foreground mt-1">
                                          Upload video trên Bunny Stream → copy Video ID → dán vào đây
                                        </p>
                                      </div>

                                      {/* Duration */}
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
                                              <Input
                                                value={mat.name}
                                                onChange={(e) => updateMaterial(j, "name", e.target.value)}
                                                placeholder="Tên tài liệu"
                                                className="flex-1 text-xs"
                                              />
                                              <Input
                                                value={mat.url}
                                                onChange={(e) => updateMaterial(j, "url", e.target.value)}
                                                placeholder="URL file"
                                                className="flex-1 text-xs font-mono"
                                              />
                                              <select
                                                value={mat.type}
                                                onChange={(e) => updateMaterial(j, "type", e.target.value)}
                                                className="rounded-md border border-border bg-card px-2 py-1.5 text-xs"
                                              >
                                                <option value="pdf">PDF</option>
                                                <option value="image">Ảnh</option>
                                                <option value="excel">Excel</option>
                                                <option value="video">Video</option>
                                              </select>
                                              <Button
                                                size="sm"
                                                variant="ghost"
                                                onClick={() => removeMaterial(j)}
                                                className="text-red-400 hover:text-red-500 h-8 w-8 p-0"
                                              >
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
                                      {/* Order + video status */}
                                      <div className={cn(
                                        "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg font-bold text-xs",
                                        hasVideo ? "bg-emerald-500/15 text-emerald-500" : "bg-muted text-muted-foreground"
                                      )}>
                                        {lesson.order_index}
                                      </div>

                                      {/* Video indicator */}
                                      <div className={cn(
                                        "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
                                        hasVideo ? "bg-gold/10" : "bg-muted"
                                      )}>
                                        {hasVideo ? (
                                          <Play className="h-3.5 w-3.5 text-gold" />
                                        ) : (
                                          <Film className="h-3.5 w-3.5 text-muted-foreground/40" />
                                        )}
                                      </div>

                                      {/* Info */}
                                      <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-foreground truncate">
                                          {lesson.title}
                                        </p>
                                        <div className="flex items-center gap-3 text-[10px] text-muted-foreground mt-0.5">
                                          <span>{formatDuration(lesson.duration_sec)}</span>
                                          {hasVideo && (
                                            <span className="text-emerald-500 font-medium">Video OK</span>
                                          )}
                                          {!hasVideo && (
                                            <span className="text-orange-500">Chưa có video</span>
                                          )}
                                          {lesson.materials && lesson.materials.length > 0 && (
                                            <span>{lesson.materials.length} tài liệu</span>
                                          )}
                                        </div>
                                      </div>

                                      {/* Edit button */}
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => startEdit(lesson)}
                                        className="text-muted-foreground hover:text-gold shrink-0"
                                      >
                                        <Pencil className="h-4 w-4" />
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
              </motion.div>
            );
          })}
        </div>
      </div>
    </PageTransition>
  );
}
