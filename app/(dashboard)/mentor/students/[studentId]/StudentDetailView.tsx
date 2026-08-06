"use client";

// Chi tiết học viên phía mentor (Phase 03): khối trạng thái lộ trình + đổi tag có lý do
// + ghi chú lần chạm (kênh/loại) + banner máy đề xuất Rời bỏ + toggle Sẵn sàng Coaching.
import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Mail,
  Phone,
  Calendar,
  Send,
  Star,
  BookOpen,
  ClipboardList,
  AlertTriangle,
  Flag,
  History,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { getEnrollmentsByUser, getCourseById, getSubmissionsByUser } from "@/lib/api";
import {
  getStudentRoadmapRow,
  getStatusEvents,
  getProfileNames,
  getTouchNotesByUser,
  createTouchNote,
  countNotesSince,
  setStudentStatusManual,
  toggleReadyForCoaching,
  type StudentRoadmapRow,
  type StatusEvent,
  type TouchNote,
} from "@/lib/api-mentor";
import {
  STATUS_LABELS,
  STATUS_STYLES,
  FLAG_LABELS,
  FLAG_STYLES,
  MANUAL_STATUSES,
  REASON_REQUIRED,
  CHANNEL_LABELS,
  NOTE_TYPE_LABELS,
  type StudentStatus,
  type NoteChannel,
  type NoteType,
} from "@/lib/status-labels";
import { formatDate, formatRelativeTime } from "@/lib/utils";
import { supabase } from "@/lib/supabase";
import { useCurrentUser } from "@/lib/auth";
import type { Profile } from "@/lib/auth";
import type { Enrollment, Submission, Course } from "@/lib/types";
import { PageTransition } from "@/components/shared/PageTransition";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

const classificationStyles: Record<string, string> = {
  newbie: "bg-gray-500/15 text-gray-700 dark:text-gray-300 border-gray-500/30",
  beginner: "bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-500/30",
  intermediate: "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30",
  advanced: "bg-green-500/15 text-green-700 dark:text-green-300 border-green-500/30",
};

const classificationLabels: Record<string, string> = {
  newbie: "Newbie",
  beginner: "Beginner",
  intermediate: "Intermediate",
  advanced: "Advanced",
};

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
};

const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

// profiles có thêm cột phase 01 mà lib/auth Profile chưa khai báo
type StudentProfile = Profile & {
  status?: StudentStatus | null;
  status_changed_at?: string | null;
  ready_for_coaching?: boolean;
};

interface Props {
  studentId: string;
}

export function StudentDetailView({ studentId }: Props) {
  const currentUser = useCurrentUser("mentor");
  const [student, setStudent] = useState<StudentProfile | null>(null);
  const [enrollmentList, setEnrollmentList] = useState<Enrollment[]>([]);
  const [courseTitles, setCourseTitles] = useState<Map<string, string>>(new Map());
  const [submissionList, setSubmissionList] = useState<Submission[]>([]);
  const [assignmentTitles, setAssignmentTitles] = useState<Map<string, string>>(new Map());
  const [notes, setNotes] = useState<TouchNote[]>([]);
  const [authorNames, setAuthorNames] = useState<Map<string, string>>(new Map());
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  // Khối trạng thái lộ trình
  const [roadmap, setRoadmap] = useState<StudentRoadmapRow | null>(null);
  const [events, setEvents] = useState<StatusEvent[]>([]);
  const [changerNames, setChangerNames] = useState<Map<string, string>>(new Map());
  const [touchesSinceCham, setTouchesSinceCham] = useState(0);
  const [savingCoaching, setSavingCoaching] = useState(false);

  // Modal đổi tag
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [targetStatus, setTargetStatus] = useState<StudentStatus | null>(null);
  const [statusReason, setStatusReason] = useState("");
  const [savingStatus, setSavingStatus] = useState(false);

  // Form ghi chú lần chạm
  const [noteText, setNoteText] = useState("");
  const [noteChannel, setNoteChannel] = useState<NoteChannel | "">("");
  const [noteType, setNoteType] = useState<NoteType | "">("");
  const [submittingNote, setSubmittingNote] = useState(false);

  const loadStatusBlock = useCallback(async () => {
    const [row, evts] = await Promise.all([
      getStudentRoadmapRow(studentId),
      getStatusEvents(studentId, 10),
    ]);
    setRoadmap(row);
    setEvents(evts);
    const names = await getProfileNames(evts.map((e) => e.changed_by).filter((id): id is string => !!id));
    setChangerNames(names);
    if (row?.status === "cham" && row.status_changed_at) {
      setTouchesSinceCham(await countNotesSince(studentId, row.status_changed_at));
    } else {
      setTouchesSinceCham(0);
    }
  }, [studentId]);

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", studentId)
        .maybeSingle();

      if (!data) {
        setNotFound(true);
        setLoading(false);
        return;
      }
      setStudent(data as StudentProfile);

      const [enrollments, submissions, studentNotes] = await Promise.all([
        getEnrollmentsByUser(studentId),
        getSubmissionsByUser(studentId),
        getTouchNotesByUser(studentId),
      ]);
      setEnrollmentList(enrollments as Enrollment[]);
      setSubmissionList(submissions as Submission[]);
      setNotes(studentNotes);

      await loadStatusBlock();

      const courseIds = Array.from(new Set(enrollments.map((e) => e.course_id)));
      if (courseIds.length > 0) {
        const courseResults = await Promise.all(courseIds.map((id) => getCourseById(id)));
        setCourseTitles(
          new Map(
            courseIds
              .map((id, i) => [id, (courseResults[i] as Course | null)?.title])
              .filter((entry): entry is [string, string] => !!entry[1])
          )
        );
      }

      const assignmentIds = Array.from(new Set(submissions.map((s) => s.assignment_id)));
      if (assignmentIds.length > 0) {
        const { data: aRows } = await supabase
          .from("assignments")
          .select("id, title")
          .in("id", assignmentIds);
        setAssignmentTitles(new Map((aRows || []).map((a) => [a.id, a.title as string])));
      }

      setAuthorNames(await getProfileNames(studentNotes.map((n) => n.author_id)));

      setLoading(false);
    }
    load();
  }, [studentId, loadStatusBlock]);

  if (!currentUser || loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-muted-foreground">Đang tải...</div>
      </div>
    );
  }

  // Mentor chỉ xem/sửa được học viên MÌNH phụ trách (admin/super_admin xem tự do)
  const notMyStudent =
    !!student && currentUser.role === "mentor" && student.mentor_id !== currentUser.id;

  if (notFound || !student || notMyStudent) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-muted-foreground text-lg">
          {notMyStudent ? "Học viên này không thuộc danh sách bạn phụ trách" : "Không tìm thấy học viên"}
        </p>
        <Link href="/mentor/students" className="mt-4 text-gold hover:underline">
          Quay lại danh sách
        </Link>
      </div>
    );
  }

  const survey = student.onboarding_survey ?? null;
  const initials = student.full_name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(-2);

  const currentStatus: StudentStatus = (roadmap?.status || student.status || "dung_tien_do") as StudentStatus;
  const readyForCoaching = roadmap?.ready_for_coaching ?? student.ready_for_coaching ?? false;

  // Banner máy đề xuất: chậm ≥14 ngày (từ status_changed_at) + đã chạm ≥3 lần từ mốc đó
  const statusChangedAt = roadmap?.status_changed_at || student.status_changed_at || null;
  const daysInCham =
    currentStatus === "cham" && statusChangedAt
      ? Math.floor((Date.now() - new Date(statusChangedAt).getTime()) / 86400_000)
      : 0;
  const suggestRoiBo = currentStatus === "cham" && daysInCham >= 14 && touchesSinceCham >= 3;

  const allStatuses = Object.keys(STATUS_LABELS) as StudentStatus[];
  const allowedStatuses: StudentStatus[] = MANUAL_STATUSES; // mentor: roi_bo, tam_dung, dung_tien_do

  const openStatusModal = (preset?: StudentStatus) => {
    setTargetStatus(preset ?? null);
    setStatusReason("");
    setStatusModalOpen(true);
  };

  const handleSaveStatus = async () => {
    if (!targetStatus || savingStatus) return;
    const needReason = REASON_REQUIRED.includes(targetStatus);
    if (needReason && !statusReason.trim()) return;
    setSavingStatus(true);
    try {
      await setStudentStatusManual({
        userId: studentId,
        status: targetStatus,
        reason: statusReason.trim() || null,
        changedBy: currentUser.id,
        prevStatus: currentStatus,
      });
      setStudent((prev) => (prev ? { ...prev, status: targetStatus } : prev));
      setStatusModalOpen(false);
      await loadStatusBlock();
    } catch (err) {
      console.error("Đổi trạng thái thất bại:", err);
    } finally {
      setSavingStatus(false);
    }
  };

  const handleToggleCoaching = async () => {
    if (savingCoaching) return;
    setSavingCoaching(true);
    try {
      await toggleReadyForCoaching(studentId, !readyForCoaching);
      setStudent((prev) => (prev ? { ...prev, ready_for_coaching: !readyForCoaching } : prev));
      setRoadmap((prev) => (prev ? { ...prev, ready_for_coaching: !readyForCoaching } : prev));
    } catch (err) {
      console.error("Đổi Sẵn sàng Coaching thất bại:", err);
    } finally {
      setSavingCoaching(false);
    }
  };

  const handleAddNote = async () => {
    if (!noteText.trim() || !noteChannel || !noteType || submittingNote) return;
    setSubmittingNote(true);
    try {
      const newNote = await createTouchNote({
        user_id: student.id,
        author_id: currentUser.id,
        content: noteText.trim(),
        channel: noteChannel,
        note_type: noteType,
      });
      setNotes((prev) => [newNote, ...prev]);
      setAuthorNames((prev) => new Map(prev).set(currentUser.id, currentUser.full_name));
      setNoteText("");
      setNoteChannel("");
      setNoteType("");
      // 1 note = 1 lần chạm — cập nhật đếm cho banner
      if (currentStatus === "cham") setTouchesSinceCham((c) => c + 1);
    } catch (err) {
      console.error("Failed to add note:", err);
    } finally {
      setSubmittingNote(false);
    }
  };

  const needReason = targetStatus ? REASON_REQUIRED.includes(targetStatus) : false;

  return (
    <PageTransition>
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="space-y-6"
    >
      {/* Back link */}
      <motion.div variants={item}>
        <Link
          href="/mentor/students"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Quay lại danh sách
        </Link>
      </motion.div>

      {/* Banner máy đề xuất gắn Rời bỏ */}
      {suggestRoiBo && (
        <motion.div variants={item}>
          <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-4 flex flex-col sm:flex-row sm:items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0" />
            <p className="flex-1 text-sm text-amber-700 dark:text-amber-300">
              <span className="font-semibold">Máy đề xuất gắn Rời bỏ</span> — chậm {daysInCham} ngày,
              đã chạm {touchesSinceCham} lần. Máy không tự gắn, mentor quyết định.
            </p>
            <Button
              size="sm"
              onClick={() => openStatusModal("roi_bo")}
              className="bg-amber-500 hover:bg-amber-500/90 text-black font-semibold shrink-0"
            >
              Gắn Rời bỏ
            </Button>
          </div>
        </motion.div>
      )}

      {/* Profile card */}
      <motion.div variants={item}>
        <Card className="gold-border-glow">
          <CardContent className="pt-4">
            <div className="flex flex-col sm:flex-row items-start gap-6">
              <Avatar className="h-16 w-16">
                <AvatarFallback className="bg-gold/20 text-gold text-xl font-bold">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 space-y-3">
                <div>
                  <h2 className="text-xl font-bold text-foreground">
                    {student.full_name}
                  </h2>
                  <div className="flex flex-wrap items-center gap-2 mt-2">
                    <Badge className={STATUS_STYLES[currentStatus]}>
                      {STATUS_LABELS[currentStatus]}
                    </Badge>
                    {roadmap?.is_ket && (
                      <Badge className={FLAG_STYLES.ket}>{FLAG_LABELS.ket}</Badge>
                    )}
                    {roadmap?.is_cho_cham && (
                      <Badge className={FLAG_STYLES.cho_cham}>{FLAG_LABELS.cho_cham}</Badge>
                    )}
                    <Badge
                      variant="outline"
                      className={classificationStyles[student.classification || "newbie"]}
                    >
                      {classificationLabels[student.classification || "newbie"]}
                    </Badge>
                  </div>
                </div>
                <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
                  <span className="inline-flex items-center gap-1.5">
                    <Mail className="h-3.5 w-3.5" />
                    {student.email}
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <Phone className="h-3.5 w-3.5" />
                    {student.phone}
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5" />
                    Tham gia: {formatDate(student.created_at)}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Khối trạng thái lộ trình */}
      <motion.div variants={item}>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Flag className="h-4 w-4 text-gold" />
              Trạng thái lộ trình
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              <Badge className={STATUS_STYLES[currentStatus]}>
                {STATUS_LABELS[currentStatus]}
              </Badge>
              {roadmap?.is_ket && <Badge className={FLAG_STYLES.ket}>{FLAG_LABELS.ket}</Badge>}
              {roadmap?.is_cho_cham && (
                <Badge className={FLAG_STYLES.cho_cham}>{FLAG_LABELS.cho_cham}</Badge>
              )}
              {roadmap?.current_stage_title && (
                <span className="text-sm text-muted-foreground">
                  Chặng: <span className="text-foreground font-medium">{roadmap.current_stage_title}</span>
                  {roadmap.days_in_stage !== null && ` · ${Math.floor(Number(roadmap.days_in_stage))} ngày`}
                  {Number(roadmap.days_late) > 0 && (
                    <span className="text-red-500"> · trễ {Math.floor(Number(roadmap.days_late))} ngày</span>
                  )}
                </span>
              )}
              <div className="ml-auto flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleToggleCoaching}
                  disabled={savingCoaching}
                  className={
                    readyForCoaching
                      ? "border-gold/60 bg-gold/10 text-gold"
                      : "border-border text-muted-foreground"
                  }
                >
                  <Sparkles className="h-3.5 w-3.5 mr-1.5" />
                  {readyForCoaching ? "Sẵn sàng Coaching" : "Chưa sẵn sàng Coaching"}
                </Button>
                <Button
                  size="sm"
                  onClick={() => openStatusModal()}
                  className="bg-gold hover:bg-gold/90 text-black font-semibold"
                >
                  Đổi trạng thái
                </Button>
              </div>
            </div>

            <Separator />

            {/* Lịch sử status_events */}
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                <History className="h-3.5 w-3.5" /> Lịch sử thay đổi (10 gần nhất)
              </p>
              {events.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-3">
                  Chưa có thay đổi trạng thái nào
                </p>
              ) : (
                <div className="space-y-2">
                  {events.map((ev) => (
                    <div
                      key={ev.id}
                      className="rounded-lg border border-border/50 bg-muted/20 p-3 flex flex-wrap items-center gap-2 text-sm"
                    >
                      {ev.from_status && (
                        <>
                          <Badge className={STATUS_STYLES[ev.from_status]}>
                            {STATUS_LABELS[ev.from_status]}
                          </Badge>
                          <span className="text-muted-foreground">→</span>
                        </>
                      )}
                      <Badge className={STATUS_STYLES[ev.to_status]}>
                        {STATUS_LABELS[ev.to_status]}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {ev.changed_by
                          ? changerNames.get(ev.changed_by) || "Không rõ"
                          : "Máy"}
                        {" · "}
                        {formatRelativeTime(ev.created_at)}
                      </span>
                      {ev.reason && (
                        <span className="w-full text-xs text-muted-foreground italic border-l-2 border-gold/30 pl-2">
                          {ev.reason}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Enrollment progress */}
        <motion.div variants={item}>
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-gold" />
                Tiến độ khoá học
              </CardTitle>
            </CardHeader>
            <CardContent>
              {enrollmentList.length === 0 ? (
                <p className="text-muted-foreground text-sm">
                  Chưa đăng ký khoá nào
                </p>
              ) : (
                <div className="space-y-4">
                  {enrollmentList.map((enrollment) => {
                    const courseTitle = courseTitles.get(enrollment.course_id);
                    return (
                      <div
                        key={enrollment.id}
                        className="rounded-lg border border-border/50 bg-muted/20 p-4 space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <p className="font-medium text-foreground text-sm">
                            {courseTitle || "Khoá học"}
                          </p>
                          <Badge
                            variant="outline"
                            className={
                              enrollment.status === "completed"
                                ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30"
                                : enrollment.status === "active"
                                ? "bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-500/30"
                                : enrollment.status === "paused"
                                ? "bg-orange-500/15 text-orange-700 dark:text-orange-300 border-orange-500/30"
                                : "bg-gray-500/15 text-gray-600 dark:text-gray-400 border-gray-500/30"
                            }
                          >
                            {enrollment.status === "completed"
                              ? "Hoàn thành"
                              : enrollment.status === "active"
                              ? "Đang học"
                              : enrollment.status === "paused"
                              ? "Tạm dừng"
                              : "Đã huỷ"}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2">
                          <Progress
                            value={enrollment.progress_pct}
                            className="flex-1"
                          />
                          <span className="text-xs text-muted-foreground w-10 text-right">
                            {enrollment.progress_pct}%
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Đăng ký: {formatDate(enrollment.enrolled_at)}
                        </p>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Recent submissions */}
        <motion.div variants={item}>
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Star className="h-4 w-4 text-gold" />
                Bài nộp gần đây
              </CardTitle>
            </CardHeader>
            <CardContent>
              {submissionList.length === 0 ? (
                <p className="text-muted-foreground text-sm">
                  Chưa có bài nộp nào
                </p>
              ) : (
                <div className="space-y-3">
                  {submissionList.map((submission) => {
                    const assignmentTitle = assignmentTitles.get(submission.assignment_id);
                    const isGraded = !!submission.graded_at;

                    return (
                      <div
                        key={submission.id}
                        className="rounded-lg border border-border/50 bg-muted/20 p-3 space-y-1"
                      >
                        <div className="flex items-center justify-between">
                          <p className="font-medium text-foreground text-sm">
                            {assignmentTitle || "Bài tập"}
                          </p>
                          <Badge
                            variant="outline"
                            className={
                              isGraded
                                ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30"
                                : "bg-orange-500/15 text-orange-700 dark:text-orange-300 border-orange-500/30"
                            }
                          >
                            {isGraded ? "Đã chấm" : "Chưa chấm"}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Nộp: {formatRelativeTime(submission.submitted_at)}
                        </p>
                        {submission.mentor_feedback && (
                          <p className="text-xs text-muted-foreground italic mt-1 border-l-2 border-gold/30 pl-2">
                            {submission.mentor_feedback}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Ghi chú lần chạm */}
      <motion.div variants={item}>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Ghi chú lần chạm</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Add note form: kênh + loại BẮT BUỘC */}
            <div className="space-y-2">
              <div className="flex flex-col sm:flex-row gap-2">
                <select
                  value={noteChannel}
                  onChange={(e) => setNoteChannel(e.target.value as NoteChannel | "")}
                  className="rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-gold/50"
                >
                  <option value="" disabled>Kênh chạm *</option>
                  {(Object.keys(CHANNEL_LABELS) as NoteChannel[]).map((c) => (
                    <option key={c} value={c}>{CHANNEL_LABELS[c]}</option>
                  ))}
                </select>
                <select
                  value={noteType}
                  onChange={(e) => setNoteType(e.target.value as NoteType | "")}
                  className="rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-gold/50"
                >
                  <option value="" disabled>Loại chạm *</option>
                  {(Object.keys(NOTE_TYPE_LABELS) as NoteType[]).map((t) => (
                    <option key={t} value={t}>{NOTE_TYPE_LABELS[t]}</option>
                  ))}
                </select>
                <Input
                  placeholder="Nội dung lần chạm..."
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleAddNote();
                  }}
                  className="flex-1"
                />
                <Button
                  onClick={handleAddNote}
                  disabled={!noteText.trim() || !noteChannel || !noteType || submittingNote}
                  className="bg-gold hover:bg-gold/90 text-black"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Mỗi ghi chú = 1 lần chạm — máy đếm cho đề xuất Rời bỏ và chỉ số chạm trong 48h.
              </p>
            </div>

            <Separator />

            {/* Timeline notes: badge kênh + loại */}
            {notes.length === 0 ? (
              <p className="text-muted-foreground text-sm text-center py-4">
                Chưa có ghi chú nào
              </p>
            ) : (
              <div className="space-y-3">
                {notes.map((note) => {
                  const authorName = authorNames.get(note.author_id);
                  return (
                    <div
                      key={note.id}
                      className="rounded-lg border border-border/50 bg-muted/20 p-3 space-y-1.5"
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-xs font-medium text-gold">
                          {authorName || "Mentor"}
                        </p>
                        <Badge className="bg-sky-500/15 text-sky-600 dark:text-sky-400 text-[10px]">
                          {CHANNEL_LABELS[note.channel] || note.channel}
                        </Badge>
                        <Badge className="bg-violet-500/15 text-violet-600 dark:text-violet-400 text-[10px]">
                          {NOTE_TYPE_LABELS[note.note_type] || note.note_type}
                        </Badge>
                        <p className="text-xs text-muted-foreground ml-auto">
                          {formatRelativeTime(note.created_at)}
                        </p>
                      </div>
                      <p className="text-sm text-foreground">{note.content}</p>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
      {/* Onboarding Survey */}
      <motion.div variants={item}>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <ClipboardList className="h-4 w-4 text-gold" />
              Kết quả Onboarding Survey
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!survey ? (
              <p className="text-muted-foreground text-sm text-center py-4">
                Học viên chưa hoàn thành khảo sát
              </p>
            ) : (
              <div className="space-y-4">
                {/* Summary row */}
                <div className="flex flex-wrap items-center gap-3">
                  <div className="rounded-xl bg-gold/10 border border-gold/20 px-4 py-2 text-center">
                    <div className="text-2xl font-bold text-gold">{survey.total_score}</div>
                    <div className="text-xs text-muted-foreground">Tổng điểm</div>
                  </div>
                  <Badge
                    variant="outline"
                    className={classificationStyles[survey.classification]}
                  >
                    {classificationLabels[survey.classification]}
                  </Badge>
                  {survey.has_any_one && (
                    <Badge variant="outline" className="bg-red-500/15 text-red-700 dark:text-red-300 border-red-500/30">
                      <AlertTriangle className="h-3 w-3 mr-1" />
                      Có điểm 1
                    </Badge>
                  )}
                  <span className="text-xs text-muted-foreground">
                    Hoàn thành: {formatDate(survey.completed_at)}
                  </span>
                </div>

                <Separator />

                {/* Answer details */}
                <div className="space-y-3">
                  {Object.entries(survey.answers).map(([key, value]) => {
                    const labels: Record<string, string> = {
                      self_learning: "Tự học",
                      motivation: "Động lực",
                      tradingview_skill: "Kỹ năng TradingView",
                      device: "Thiết bị",
                      trading_method: "Phương pháp giao dịch",
                      probability_thinking: "Tư duy xác suất",
                      income_status: "Tình trạng thu nhập",
                      device_detail: "Chi tiết thiết bị",
                    };

                    const isScored = typeof value === "object" && value !== null && "score" in value;

                    return (
                      <div
                        key={key}
                        className="rounded-lg border border-border/50 bg-muted/20 p-3"
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium text-foreground">
                            {labels[key] || key}
                          </span>
                          {isScored && (
                            <div className="flex items-center gap-1">
                              {Array.from({ length: 4 }).map((_, i) => (
                                <div
                                  key={i}
                                  className={`w-2 h-2 rounded-full ${
                                    i < (value as { score: number }).score
                                      ? "bg-gold"
                                      : "bg-gold/15"
                                  }`}
                                />
                              ))}
                              <span className="text-xs text-gold ml-1 font-medium">
                                {(value as { score: number }).score}/4
                              </span>
                            </div>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {isScored
                            ? (value as { answer: string }).answer
                            : String(value)}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Modal đổi trạng thái */}
      <Dialog open={statusModalOpen} onOpenChange={setStatusModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Đổi trạng thái học viên</DialogTitle>
            <DialogDescription>
              Tag máy gắn (Chậm, Quay lại, Tốt nghiệp) không gắn tay được. Rời bỏ / Tạm dừng bắt buộc nhập lý do.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {allStatuses.map((s) => {
                const allowed = allowedStatuses.includes(s) && s !== currentStatus;
                return (
                  <button
                    key={s}
                    type="button"
                    disabled={!allowed}
                    onClick={() => setTargetStatus(s)}
                    className={`rounded-full px-3 py-1.5 text-sm font-medium transition-all ${
                      targetStatus === s
                        ? "ring-2 ring-gold " + STATUS_STYLES[s]
                        : STATUS_STYLES[s]
                    } ${!allowed ? "opacity-30 cursor-not-allowed" : "cursor-pointer hover:ring-1 hover:ring-gold/50"}`}
                    title={!allowedStatuses.includes(s) ? "Tag máy gắn — không gắn tay" : undefined}
                  >
                    {STATUS_LABELS[s]}
                  </button>
                );
              })}
            </div>
            {targetStatus && (
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">
                  Lý do {needReason ? "(bắt buộc)" : "(không bắt buộc)"}
                </label>
                <textarea
                  value={statusReason}
                  onChange={(e) => setStatusReason(e.target.value)}
                  placeholder="Vd: học viên xin nghỉ 2 tuần vì việc gia đình..."
                  rows={3}
                  className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-gold/50 resize-none"
                />
                {needReason && !statusReason.trim() && (
                  <p className="text-xs text-amber-600 dark:text-amber-400">
                    Tag này bắt buộc nhập lý do mới lưu được.
                  </p>
                )}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setStatusModalOpen(false)}>
              Huỷ
            </Button>
            <Button
              onClick={handleSaveStatus}
              disabled={!targetStatus || (needReason && !statusReason.trim()) || savingStatus}
              className="bg-gold hover:bg-gold/90 text-black font-semibold"
            >
              {savingStatus ? "Đang lưu..." : "Lưu trạng thái"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
    </PageTransition>
  );
}
