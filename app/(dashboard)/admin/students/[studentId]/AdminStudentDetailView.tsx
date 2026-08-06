"use client";

// Chi tiết học viên phía admin (Phase 03): đồng bộ tính năng bản mentor —
// khối trạng thái + đổi tag (admin gắn thêm được hoan_tien) + ghi chú lần chạm + banner đề xuất.
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
  Users,
  Flag,
  History,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import {
  getEnrollmentsByUser,
  getSubmissionsByUser,
  getOnboardingSurveyByUser,
} from "@/lib/api";
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
  ADMIN_ONLY_STATUSES,
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
import { PageTransition } from "@/components/shared/PageTransition";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
  newbie: "Newbie", beginner: "Beginner", intermediate: "Intermediate", advanced: "Advanced",
};

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.08 } } };
const item = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { duration: 0.4 } } };

interface DbCourse {
  id: string;
  title: string;
}

interface DbEnrollment {
  id: string;
  course_id: string;
  status: string;
  progress_pct: number;
  enrolled_at: string;
}

interface DbSubmission {
  id: string;
  assignment_id: string;
  mentor_feedback: string | null;
  graded_at: string | null;
  submitted_at: string;
}

interface DbAssignment {
  id: string;
  title: string;
}

// profiles có thêm cột phase 01 mà lib/auth Profile chưa khai báo
type StudentProfile = Profile & {
  status?: StudentStatus | null;
  status_changed_at?: string | null;
  ready_for_coaching?: boolean;
};

interface Props {
  studentId: string;
}

export function AdminStudentDetailView({ studentId }: Props) {
  const currentUser = useCurrentUser("admin");
  const [student, setStudent] = useState<StudentProfile | null>(null);
  const [mentorName, setMentorName] = useState<string | null>(null);
  const [enrollmentList, setEnrollmentList] = useState<DbEnrollment[]>([]);
  const [submissionList, setSubmissionList] = useState<DbSubmission[]>([]);
  const [notes, setNotes] = useState<TouchNote[]>([]);
  const [authorNames, setAuthorNames] = useState<Map<string, string>>(new Map());
  const [assignments, setAssignments] = useState<DbAssignment[]>([]);
  const [courses, setCourses] = useState<DbCourse[]>([]);
  const [survey, setSurvey] = useState<Profile["onboarding_survey"] | null>(null);
  const [loading, setLoading] = useState(true);

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
  const [savingNote, setSavingNote] = useState(false);

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
      const { data: studentData } = await supabase.from("profiles").select("*").eq("id", studentId).single();
      if (!studentData) {
        setLoading(false);
        return;
      }
      setStudent(studentData as StudentProfile);

      const [enrollments, submissions, notesData, surveyData] = await Promise.all([
        getEnrollmentsByUser(studentId),
        getSubmissionsByUser(studentId),
        getTouchNotesByUser(studentId),
        getOnboardingSurveyByUser(studentId),
      ]);
      setEnrollmentList(enrollments as DbEnrollment[]);
      setSubmissionList(submissions as DbSubmission[]);
      setNotes(notesData);
      setSurvey(surveyData);

      await loadStatusBlock();

      const courseIds = Array.from(new Set((enrollments as DbEnrollment[]).map((e) => e.course_id)));
      const assignmentIds = Array.from(new Set((submissions as DbSubmission[]).map((s) => s.assignment_id)));

      const [
        { data: coursesData },
        { data: assignmentsData },
        authorNameMap,
        mentorResult,
      ] = await Promise.all([
        courseIds.length > 0 ? supabase.from("courses").select("id, title").in("id", courseIds) : Promise.resolve({ data: [] as DbCourse[] }),
        assignmentIds.length > 0 ? supabase.from("assignments").select("id, title").in("id", assignmentIds) : Promise.resolve({ data: [] as DbAssignment[] }),
        getProfileNames(notesData.map((n) => n.author_id)),
        studentData.mentor_id
          ? supabase.from("profiles").select("full_name").eq("id", studentData.mentor_id).single()
          : Promise.resolve({ data: null }),
      ]);
      if (coursesData) setCourses(coursesData as DbCourse[]);
      if (assignmentsData) setAssignments(assignmentsData as DbAssignment[]);
      setAuthorNames(authorNameMap);
      if (mentorResult.data) setMentorName(mentorResult.data.full_name);

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

  if (!student) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-muted-foreground text-lg">Không tìm thấy học viên</p>
        <Link href="/admin/students" className="mt-4 text-gold hover:underline">Quay lại danh sách</Link>
      </div>
    );
  }

  const displayMentorName = mentorName;
  const initials = student.full_name.split(" ").map((n) => n[0]).join("").slice(-2);

  function getCourseTitle(courseId: string) {
    return courses.find((c) => c.id === courseId)?.title;
  }

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
  // Admin: được gắn thêm hoan_tien
  const allowedStatuses: StudentStatus[] = [...MANUAL_STATUSES, ...ADMIN_ONLY_STATUSES];

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
    if (!noteText.trim() || !noteChannel || !noteType || savingNote) return;
    setSavingNote(true);
    try {
      const newNote = await createTouchNote({
        user_id: studentId,
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
      if (currentStatus === "cham") setTouchesSinceCham((c) => c + 1);
    } finally {
      setSavingNote(false);
    }
  };

  const needReason = targetStatus ? REASON_REQUIRED.includes(targetStatus) : false;

  return (
    <PageTransition>
      <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
        <motion.div variants={item}>
          <Link
            href="/admin/students"
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
                đã chạm {touchesSinceCham} lần. Máy không tự gắn, người phụ trách quyết định.
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
                  {student.avatar_url && <AvatarImage src={student.avatar_url} />}
                  <AvatarFallback className="bg-gold/20 text-gold text-xl font-bold">{initials}</AvatarFallback>
                </Avatar>
                <div className="flex-1 space-y-3">
                  <div>
                    <h2 className="text-xl font-bold text-foreground">{student.full_name}</h2>
                    <div className="flex flex-wrap items-center gap-2 mt-2">
                      <Badge className={STATUS_STYLES[currentStatus]}>
                        {STATUS_LABELS[currentStatus]}
                      </Badge>
                      {roadmap?.is_ket && <Badge className={FLAG_STYLES.ket}>{FLAG_LABELS.ket}</Badge>}
                      {roadmap?.is_cho_cham && (
                        <Badge className={FLAG_STYLES.cho_cham}>{FLAG_LABELS.cho_cham}</Badge>
                      )}
                      <Badge variant="outline" className={classificationStyles[student.classification || "newbie"]}>
                        {classificationLabels[student.classification || "newbie"]}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
                    <span className="inline-flex items-center gap-1.5">
                      <Mail className="h-3.5 w-3.5" /> {student.email}
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <Phone className="h-3.5 w-3.5" /> {student.phone || "Chưa cập nhật"}
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <Users className="h-3.5 w-3.5" /> Mentor: {displayMentorName || "Chưa gán"}
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5" /> Tham gia: {formatDate(student.created_at)}
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
                  <BookOpen className="h-4 w-4 text-gold" /> Tiến độ khoá học
                </CardTitle>
              </CardHeader>
              <CardContent>
                {enrollmentList.length === 0 ? (
                  <p className="text-muted-foreground text-sm">Chưa đăng ký khoá nào</p>
                ) : (
                  <div className="space-y-4">
                    {enrollmentList.map((enrollment) => {
                      const course = { title: getCourseTitle(enrollment.course_id) };
                      return (
                        <div key={enrollment.id} className="rounded-lg border border-border/50 bg-muted/20 p-4 space-y-2">
                          <div className="flex items-center justify-between">
                            <p className="font-medium text-foreground text-sm">{course?.title || "Khoá học"}</p>
                            <Badge variant="outline" className={
                              enrollment.status === "active" ? "bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-500/30"
                              : enrollment.status === "completed" ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30"
                              : "bg-orange-500/15 text-orange-700 dark:text-orange-300 border-orange-500/30"
                            }>
                              {enrollment.status === "active" ? "Đang học" : enrollment.status === "completed" ? "Hoàn thành" : enrollment.status}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2">
                            <Progress value={enrollment.progress_pct} className="flex-1" />
                            <span className="text-xs text-muted-foreground w-10 text-right">{enrollment.progress_pct}%</span>
                          </div>
                          <p className="text-xs text-muted-foreground">Đăng ký: {formatDate(enrollment.enrolled_at)}</p>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Submissions */}
          <motion.div variants={item}>
            <Card className="h-full">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Star className="h-4 w-4 text-gold" /> Bài nộp gần đây
                </CardTitle>
              </CardHeader>
              <CardContent>
                {submissionList.length === 0 ? (
                  <p className="text-muted-foreground text-sm">Chưa có bài nộp nào</p>
                ) : (
                  <div className="space-y-3">
                    {submissionList.map((submission) => {
                      const assignment = assignments.find((a) => a.id === submission.assignment_id);
                      const isGraded = !!submission.graded_at;
                      return (
                        <div key={submission.id} className="rounded-lg border border-border/50 bg-muted/20 p-3 space-y-1">
                          <div className="flex items-center justify-between">
                            <p className="font-medium text-foreground text-sm">{assignment?.title || "Bài tập"}</p>
                            <Badge variant="outline" className={isGraded ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30" : "bg-orange-500/15 text-orange-700 dark:text-orange-300 border-orange-500/30"}>
                              {isGraded ? "Đã chấm" : "Chưa chấm"}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground">Nộp: {formatRelativeTime(submission.submitted_at)}</p>
                          {submission.mentor_feedback && (
                            <p className="text-xs text-muted-foreground italic mt-1 border-l-2 border-gold/30 pl-2">{submission.mentor_feedback}</p>
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
                    onKeyDown={(e) => { if (e.key === "Enter") handleAddNote(); }}
                    className="flex-1"
                  />
                  <Button
                    onClick={handleAddNote}
                    disabled={!noteText.trim() || !noteChannel || !noteType || savingNote}
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
              {notes.length === 0 ? (
                <p className="text-muted-foreground text-sm text-center py-4">Chưa có ghi chú</p>
              ) : (
                <div className="space-y-3">
                  {notes.map((note) => (
                    <div key={note.id} className="rounded-lg border border-border/50 bg-muted/20 p-3 space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-xs font-medium text-gold">{authorNames.get(note.author_id) || "Admin"}</p>
                        <Badge className="bg-sky-500/15 text-sky-600 dark:text-sky-400 text-[10px]">
                          {CHANNEL_LABELS[note.channel] || note.channel}
                        </Badge>
                        <Badge className="bg-violet-500/15 text-violet-600 dark:text-violet-400 text-[10px]">
                          {NOTE_TYPE_LABELS[note.note_type] || note.note_type}
                        </Badge>
                        <p className="text-xs text-muted-foreground ml-auto">{formatRelativeTime(note.created_at)}</p>
                      </div>
                      <p className="text-sm text-foreground">{note.content}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Survey */}
        {survey && (
          <motion.div variants={item}>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <ClipboardList className="h-4 w-4 text-gold" /> Kết quả Onboarding
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="rounded-xl bg-gold/10 border border-gold/20 px-4 py-2 text-center">
                      <div className="text-2xl font-bold text-gold">{survey.total_score}</div>
                      <div className="text-xs text-muted-foreground">Tổng điểm</div>
                    </div>
                    <Badge variant="outline" className={classificationStyles[survey.classification]}>
                      {classificationLabels[survey.classification]}
                    </Badge>
                    {survey.has_any_one && (
                      <Badge variant="outline" className="bg-red-500/15 text-red-700 dark:text-red-300 border-red-500/30">
                        <AlertTriangle className="h-3 w-3 mr-1" /> Có điểm 1
                      </Badge>
                    )}
                  </div>
                  <Separator />
                  <div className="space-y-3">
                    {Object.entries(survey.answers).map(([key, value]) => {
                      const labels: Record<string, string> = {
                        self_learning: "Tự học", motivation: "Động lực", tradingview_skill: "TradingView",
                        device: "Thiết bị", trading_method: "Phương pháp", probability_thinking: "Tư duy xác suất",
                        income_status: "Thu nhập", device_detail: "Chi tiết thiết bị",
                      };
                      const isScored = typeof value === "object" && value !== null && "score" in value;
                      return (
                        <div key={key} className="rounded-lg border border-border/50 bg-muted/20 p-3">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-medium text-foreground">{labels[key] || key}</span>
                            {isScored && (
                              <span className="text-xs text-gold font-medium">{(value as { score: number }).score}/4</span>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {isScored ? (value as { answer: string }).answer : String(value)}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Modal đổi trạng thái */}
        <Dialog open={statusModalOpen} onOpenChange={setStatusModalOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Đổi trạng thái học viên</DialogTitle>
              <DialogDescription>
                Tag máy gắn (Chậm, Quay lại, Tốt nghiệp) không gắn tay được. Rời bỏ / Tạm dừng / Hoàn tiền bắt buộc nhập lý do.
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
                    placeholder="Vd: học viên yêu cầu hoàn tiền vì lý do cá nhân..."
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
