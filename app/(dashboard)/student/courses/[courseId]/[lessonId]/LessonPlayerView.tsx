"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  FileText,
  HelpCircle,
  PenTool,
  Download,
  CheckCircle2,
  PlayCircle,
  Circle,
  Lock,
  ImagePlus,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { getAssignmentsByCourse } from "@/lib/api";
import {
  loadStudentUnlockData,
  firstOpenLessonId,
  getQuizById,
  backfillLessonDuration,
  incrementWatchCount,
  type StudentUnlockData,
  type CourseLessonRow,
  type QuizRow,
} from "@/lib/api-student";
import {
  checkAndCompleteStages,
  flushWatchProgress,
  WORK_WATCH_THRESHOLD,
  type RoadmapStage,
} from "@/lib/roadmap";
import { cn, formatDuration } from "@/lib/utils";
import { supabase } from "@/lib/supabase";
import { useCurrentUser } from "@/lib/auth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { VideoPlayer, VideoPlaceholder } from "@/components/shared/VideoPlayer";
import { QuizSection } from "./QuizSection";
import { AssignmentPanel, type AssignmentRow } from "./AssignmentPanel";

type TabKey = "materials" | "quiz" | "assignment";

// ─────────────────────────────────────────────────────────────────────────────
// LessonPlayerView
// ─────────────────────────────────────────────────────────────────────────────

interface Props {
  courseId: string;
  lessonId: string;
}

export function LessonPlayerView({ courseId, lessonId }: Props) {
  const currentUser = useCurrentUser("student");
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabKey>("materials");
  const [isEnrolled, setIsEnrolled] = useState<boolean | null>(null);
  const [dbCourse, setDbCourse] = useState<{ id: string; title: string } | null>(null);
  const [unlockData, setUnlockData] = useState<StudentUnlockData | null>(null);
  const [videoCompleted, setVideoCompleted] = useState(false);
  const [lessonQuiz, setLessonQuiz] = useState<QuizRow | null>(null);
  const [stageQuiz, setStageQuiz] = useState<QuizRow | null>(null);
  const [assignment, setAssignment] = useState<AssignmentRow | null>(null);
  const [redirecting, setRedirecting] = useState(false);
  // Giây xem cộng dồn NGAY trong phiên — unlockData chỉ nạp lại khi qua chặng,
  // không có state này thì tab Quiz/Bài tập chỉ mở sau khi tải lại trang.
  const [liveWatchedSec, setLiveWatchedSec] = useState(0);

  // duration thật của video (từ DB, hoặc backfill từ metadata player)
  const durationRef = useRef(0);

  const refreshUnlock = useCallback(async () => {
    if (!currentUser) return;
    const data = await loadStudentUnlockData(currentUser.id, courseId);
    setUnlockData(data);
  }, [currentUser, courseId]);

  useEffect(() => {
    if (!currentUser) return;
    let cancelled = false;

    async function load() {
      const [{ data: enrollData }, { data: courseData }, data] = await Promise.all([
        supabase
          .from("enrollments")
          .select("id")
          .eq("user_id", currentUser!.id)
          .eq("course_id", courseId)
          .limit(1),
        supabase.from("courses").select("id, title").eq("id", courseId).single(),
        loadStudentUnlockData(currentUser!.id, courseId),
      ]);
      if (cancelled) return;

      const enrolled = (enrollData ?? []).length > 0;
      setIsEnrolled(enrolled);
      if (courseData) setDbCourse(courseData);

      const lesson = data.lessons.find((l) => l.id === lessonId);

      // Khoá video tuần tự: vào thẳng URL bài khoá → redirect về bài đang mở đầu tiên
      if (enrolled && lesson && !data.unlock.unlockedLessonIds.has(lessonId)) {
        const target = firstOpenLessonId(data);
        if (target && target !== lessonId) {
          setRedirecting(true);
          router.replace(`/student/courses/${courseId}/${target}`);
          return;
        }
      }

      setUnlockData(data);
      if (lesson) {
        durationRef.current = lesson.duration_sec || 0;
        setVideoCompleted(!!data.progressMap.get(lessonId)?.completed);
        setLiveWatchedSec(data.progressMap.get(lessonId)?.watched_seconds || 0);
      }

      // Quiz theo bài học (quizzes.lesson_id)
      const lessonQuizId = data.lessonQuizMap.get(lessonId);
      if (lessonQuizId) {
        const q = await getQuizById(lessonQuizId);
        if (!cancelled) setLessonQuiz(q);
      } else {
        setLessonQuiz(null);
      }

      // Quiz CHẶNG (roadmap_stages.quiz_id — KHÔNG phải quizzes.lesson_id)
      const stage = data.stages.find(
        (s) => s.completion_type === "assignment_quiz" && s.lesson_id === lessonId
      );
      if (stage?.quiz_id) {
        const q = await getQuizById(stage.quiz_id);
        if (!cancelled) setStageQuiz(q);
      } else {
        setStageQuiz(null);
      }

      // Bài tập của chặng — nguồn đúng là roadmap_stages.assignment_id.
      // (order_index của lesson đánh theo từng module nên không dùng để ghép được.)
      if (stage?.assignment_id) {
        const courseAssignments = (await getAssignmentsByCourse(courseId)) as AssignmentRow[];
        if (!cancelled) {
          setAssignment(courseAssignments.find((a) => a.id === stage.assignment_id) ?? null);
        }
      } else {
        setAssignment(null);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [currentUser, courseId, lessonId, router]);

  // ─── Đo giây xem thật ───

  const handleDuration = useCallback(
    (d: number) => {
      // lessons.duration_sec = 0/null → lấy từ metadata video và update (chỉ khi đang null/0)
      if (durationRef.current <= 0 && d > 0) {
        durationRef.current = Math.round(d);
        backfillLessonDuration(lessonId, d);
      }
    },
    [lessonId]
  );

  const handleFlush = useCallback(
    (addedSeconds: number, positionSec: number) => {
      if (!currentUser) return;
      setLiveWatchedSec((prev) => prev + Math.max(0, addedSeconds));
      flushWatchProgress(currentUser.id, lessonId, addedSeconds, positionSec, durationRef.current)
        .then(({ justCompleted }) => {
          if (justCompleted) {
            setVideoCompleted(true);
            // Vừa đạt >=50% → check qua chặng + refresh unlock state UI
            checkAndCompleteStages(currentUser.id, courseId).then(refreshUnlock);
          }
        })
        .catch((err) => console.error("Không lưu được tiến độ xem:", err));
    },
    [currentUser, lessonId, courseId, refreshUnlock]
  );

  const handleVideoEnded = useCallback(() => {
    if (!currentUser) return;
    incrementWatchCount(currentUser.id, lessonId);
  }, [currentUser, lessonId]);

  // Nộp ảnh xong / quiz đạt → check qua chặng rồi load lại bộ đếm + trạng thái mở khoá
  const handleStageProgress = useCallback(() => {
    if (!currentUser) return;
    checkAndCompleteStages(currentUser.id, courseId).then(refreshUnlock);
  }, [currentUser, courseId, refreshUnlock]);

  // ─── Render ───

  if (!currentUser || isEnrolled === null || redirecting || (isEnrolled && !unlockData)) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-muted-foreground">Đang tải...</div>
      </div>
    );
  }

  if (!isEnrolled) {
    return (
      <div className="p-6 space-y-4">
        <Link
          href={`/student/courses/${courseId}`}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-gold transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Quay lại khoá học
        </Link>
        <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
          <div className="w-20 h-20 rounded-full bg-gold/10 border-2 border-gold/30 flex items-center justify-center">
            <Lock className="h-8 w-8 text-gold" />
          </div>
          <h2 className="text-xl font-bold text-foreground">Bài học chưa được mở khoá</h2>
          <p className="text-muted-foreground text-center max-w-md">
            Bạn cần được mở khoá khoá học này để xem nội dung bài học.
          </p>
        </div>
      </div>
    );
  }

  const data = unlockData!;
  const lesson = data.lessons.find((l) => l.id === lessonId);

  if (!dbCourse || !lesson) {
    return (
      <div className="p-6 text-center">
        <p className="text-muted-foreground">Bài học không tồn tại.</p>
      </div>
    );
  }

  const moduleLessons = data.lessons.filter((l) => l.module_id === lesson.module_id);
  const currentStage: RoadmapStage | undefined = data.stages.find(
    (s) => s.completion_type === "assignment_quiz" && s.lesson_id === lessonId
  );
  const stageCompleted = currentStage
    ? data.stageProgress.some((p) => p.stage_id === currentStage.id && p.completed_at)
    : false;
  const stageCounts = currentStage?.assignment_id
    ? data.imageCounts.get(currentStage.assignment_id) || { correct: 0, pending: 0, incorrect: 0 }
    : null;
  const stageQuizPassed = !!currentStage?.quiz_id && data.passedQuizIds.has(currentStage.quiz_id);

  // Bài tập làm ngay trong bài học — chấm báo trên tab khi chặng còn dở
  const hasAssignment = !!assignment && !!currentStage;
  const assignmentPending = hasAssignment && !stageCompleted;

  const startAt = data.progressMap.get(lessonId)?.last_position_sec || 0;

  // Tỉ lệ đã xem — duration chưa có thì coi như đủ, tránh khoá oan (giống isLessonWatched)
  const watchedSeconds = Math.max(
    liveWatchedSec,
    data.progressMap.get(lessonId)?.watched_seconds || 0
  );
  const watchedRatio = lesson.duration_sec
    ? Math.min(1, watchedSeconds / lesson.duration_sec)
    : 1;
  const workGatePassed = watchedRatio >= WORK_WATCH_THRESHOLD;
  const watchedPercent = Math.round(watchedRatio * 100);
  const gatePercent = Math.round(WORK_WATCH_THRESHOLD * 100);
  const gateNote = `Xem hết ${gatePercent}% video để mở — bạn đã xem ${watchedPercent}%.`;

  const tabs: {
    key: TabKey;
    label: string;
    icon: React.ReactNode;
    show: boolean;
    locked: boolean;
  }[] = [
    { key: "materials", label: "Tài liệu", icon: <FileText className="h-4 w-4" />, show: true, locked: false },
    { key: "quiz", label: "Quiz", icon: <HelpCircle className="h-4 w-4" />, show: !!lessonQuiz, locked: !workGatePassed },
    { key: "assignment", label: "Bài tập", icon: <PenTool className="h-4 w-4" />, show: hasAssignment, locked: !workGatePassed },
  ];

  // Đổi bài học không unmount view → activeTab cũ có thể trỏ vào tab đang bị khoá
  const currentTab = tabs.find((t) => t.key === activeTab);
  const shownTab: TabKey = currentTab?.locked ? "materials" : activeTab;

  return (
    <div className="p-4 lg:p-6 space-y-4">
      {/* Back link */}
      <Link
        href={`/student/courses/${courseId}`}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-gold transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Quay lại khoá học
      </Link>

      <div className="flex flex-col lg:flex-row gap-4 lg:gap-6">
        {/* Main Content — Left 70% */}
        <motion.div
          className="flex-1 lg:w-[70%] space-y-4"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          {/* Video Player */}
          {lesson.video_url ? (
            <VideoPlayer
              playbackId={lesson.video_url}
              title={lesson.title}
              startAt={startAt}
              onDuration={handleDuration}
              onFlush={handleFlush}
              onEnded={handleVideoEnded}
            />
          ) : (
            <VideoPlaceholder title={lesson.title} />
          )}

          {/* Video completed toast */}
          {videoCompleted && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-2 rounded-lg bg-emerald-500/10 border border-emerald-500/30 p-3 text-sm text-emerald-700 dark:text-emerald-400"
            >
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              Đã hoàn thành bài học! Tiến độ đã được cập nhật.
            </motion.div>
          )}

          {/* ─── Dải tóm tắt chặng — bấm mở thẳng tab Bài tập, không rời trang ─── */}
          {currentStage && stageCounts && (
            <Card className={cn(stageCompleted ? "border-emerald-500/30" : "border-gold/30")}>
              <CardContent className="flex items-center justify-between gap-3 flex-wrap">
                <div>
                  <h3 className="font-semibold text-foreground">Chặng: {currentStage.title}</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {stageCounts.correct}/{currentStage.required_correct_images} ảnh được chấm
                    đúng · {stageCounts.pending} chờ chấm · {stageCounts.incorrect} cần làm lại
                  </p>
                </div>
                {stageCompleted ? (
                  <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    Đã qua chặng
                  </Badge>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-gold/40 text-gold"
                    disabled={!workGatePassed}
                    title={workGatePassed ? undefined : gateNote}
                    onClick={() => setActiveTab("assignment")}
                  >
                    {workGatePassed ? (
                      <ImagePlus className="h-4 w-4 mr-2" />
                    ) : (
                      <Lock className="h-4 w-4 mr-2" />
                    )}
                    Làm bài tập ngay
                  </Button>
                )}
              </CardContent>
            </Card>
          )}

          {/* Tabs */}
          <div className="flex gap-1 border-b border-gold-shadow/30">
            {tabs
              .filter((t) => t.show)
              .map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  disabled={tab.locked}
                  title={tab.locked ? gateNote : undefined}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px",
                    tab.locked
                      ? "border-transparent text-muted-foreground/50 cursor-not-allowed"
                      : shownTab === tab.key
                        ? "border-gold text-gold"
                        : "border-transparent text-muted-foreground hover:text-foreground"
                  )}
                >
                  {tab.locked ? <Lock className="h-4 w-4" /> : tab.icon}
                  {tab.label}
                  {tab.key === "assignment" && !tab.locked && assignmentPending && (
                    <span className="h-1.5 w-1.5 rounded-full bg-gold" />
                  )}
                </button>
              ))}
          </div>

          {/* Nhắc ngưỡng xem — chỉ hiện khi thật sự có tab đang bị khoá */}
          {tabs.some((t) => t.show && t.locked) && (
            <div className="flex items-center gap-2 rounded-lg border border-dashed border-gold/30 bg-gold/5 px-3 py-2 text-sm text-muted-foreground">
              <Lock className="h-4 w-4 shrink-0 text-gold/70" />
              <span className="flex-1">
                Xem hết {gatePercent}% video để mở Quiz và Bài tập — bạn đã xem{" "}
                <span className="text-gold font-medium">{watchedPercent}%</span>.
              </span>
              <div className="h-1.5 w-24 shrink-0 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full rounded-full bg-gold/60 transition-all"
                  style={{ width: `${Math.min(100, Math.round((watchedRatio / WORK_WATCH_THRESHOLD) * 100))}%` }}
                />
              </div>
            </div>
          )}

          {/* Tab Content */}
          <motion.div
            key={shownTab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
          >
            {/* Materials Tab */}
            {shownTab === "materials" && (
              <Card>
                <CardContent className="space-y-2">
                  {lesson.materials && lesson.materials.length > 0 ? (
                    lesson.materials.map((mat, i) => (
                      <a
                        key={i}
                        href={mat.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 rounded-lg border border-gold-shadow/30 p-3 hover:bg-gold/5 transition-colors"
                      >
                        <Download className="h-4 w-4 text-gold shrink-0" />
                        <span className="text-sm text-foreground flex-1">
                          {mat.name}
                        </span>
                        <Badge variant="outline" className="text-xs">
                          {mat.type}
                        </Badge>
                      </a>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground py-4 text-center">
                      Bài này chưa có tài liệu đính kèm.
                    </p>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Quiz Tab — quiz theo bài học */}
            {shownTab === "quiz" && lessonQuiz && (
              <Card>
                <CardContent>
                  <QuizSection
                    quiz={lessonQuiz}
                    userId={currentUser.id}
                    onPassed={handleStageProgress}
                  />
                </CardContent>
              </Card>
            )}

            {/* Bài tập — đề bài, bộ đếm chặng, nộp ảnh, quiz chặng trong một mạch */}
            {shownTab === "assignment" && assignment && currentStage && stageCounts && (
              <AssignmentPanel
                assignment={assignment}
                stage={currentStage}
                counts={stageCounts}
                stageCompleted={stageCompleted}
                stageQuiz={stageQuiz}
                stageQuizPassed={stageQuizPassed}
                userId={currentUser.id}
                onProgress={handleStageProgress}
              />
            )}
          </motion.div>
        </motion.div>

        {/* Right Sidebar — Lesson List (có khoá tuần tự) */}
        <motion.div
          className="lg:w-[30%] lg:max-w-xs"
          initial={{ opacity: 0, x: 16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
        >
          <Card className="sticky top-6">
            <CardContent>
              <h3 className="text-sm font-semibold text-gold mb-3">
                {lesson.module_title || "Danh sách bài học"}
              </h3>
              <div className="space-y-0.5 max-h-[60vh] overflow-y-auto">
                {moduleLessons.map((l: CourseLessonRow) => {
                  const lp = data.progressMap.get(l.id);
                  const status = lp?.status || (lp?.completed ? "completed" : "not_started");
                  const watchCount = lp?.watch_count || 0;
                  const isCurrent = l.id === lessonId;
                  const isUnlocked = data.unlock.unlockedLessonIds.has(l.id);

                  if (!isUnlocked) {
                    // Bài khoá: hiện tiêu đề + icon khoá + tooltip
                    return (
                      <div
                        key={l.id}
                        title="Hoàn thành bài trước để mở"
                        className="flex items-center gap-2 rounded-md px-2 py-2 text-xs text-muted-foreground/50 cursor-not-allowed"
                      >
                        <Lock size={16} className="shrink-0 text-muted-foreground/40" />
                        <span className="flex-1 truncate">{l.title}</span>
                        <span className="text-[10px] whitespace-nowrap opacity-70">
                          {formatDuration(l.duration_sec)}
                        </span>
                      </div>
                    );
                  }

                  const statusIcon =
                    status === "completed" ? (
                      <span className="relative shrink-0">
                        <CheckCircle2 size={18} className="text-emerald-500" />
                        {watchCount >= 2 && (
                          <span className="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 rounded-full bg-emerald-500 text-white text-[10px] font-bold flex items-center justify-center px-0.5 leading-none">
                            {watchCount}
                          </span>
                        )}
                      </span>
                    ) : status === "in_progress" ? (
                      <PlayCircle size={18} className="text-gold shrink-0" />
                    ) : (
                      <Circle size={18} className="text-muted-foreground/40 shrink-0" />
                    );

                  return (
                    <Link
                      key={l.id}
                      href={`/student/courses/${courseId}/${l.id}`}
                      className={cn(
                        "flex items-center gap-2 rounded-md px-2 py-2 text-xs transition-colors",
                        isCurrent
                          ? "bg-gold/10 text-gold font-medium"
                          : "text-muted-foreground hover:bg-gold/5 hover:text-foreground"
                      )}
                    >
                      {statusIcon}
                      <span className="flex-1 truncate">{l.title}</span>
                      <span className="text-[10px] whitespace-nowrap opacity-70">
                        {formatDuration(l.duration_sec)}
                      </span>
                    </Link>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
