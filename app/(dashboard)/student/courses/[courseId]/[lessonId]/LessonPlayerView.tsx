"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Play,
  FileText,
  HelpCircle,
  PenTool,
  Download,
  CheckCircle2,
  PlayCircle,
  Circle,
  Send,
  Lock,
} from "lucide-react";
import Link from "next/link";

import {
  getCourseById,
  getQuizByLesson,
  getAssignmentByLesson,
} from "@/lib/mock-data";
import { cn, formatDuration } from "@/lib/utils";
import { supabase } from "@/lib/supabase";
import { useCurrentUser } from "@/lib/auth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { VideoPlayer, VideoPlaceholder } from "@/components/shared/VideoPlayer";

type TabKey = "materials" | "quiz" | "assignment";

interface ProgressRecord {
  lesson_id: string;
  status?: string;
  completed?: boolean;
  watch_count?: number;
}

interface Props {
  courseId: string;
  lessonId: string;
}

export function LessonPlayerView({ courseId, lessonId }: Props) {
  const currentUser = useCurrentUser("student");
  const [activeTab, setActiveTab] = useState<TabKey>("materials");
  const [quizAnswers, setQuizAnswers] = useState<Record<number, number>>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [assignmentNote, setAssignmentNote] = useState("");
  const [assignmentSubmitted, setAssignmentSubmitted] = useState(false);
  const [isEnrolled, setIsEnrolled] = useState<boolean | null>(null);
  const [dbLesson, setDbLesson] = useState<Record<string, unknown> | null>(null);
  const [dbModuleTitle, setDbModuleTitle] = useState<string>("");
  const [dbModuleLessons, setDbModuleLessons] = useState<Record<string, unknown>[]>([]);
  const [progressList, setProgressList] = useState<ProgressRecord[]>([]);
  const [videoCompleted, setVideoCompleted] = useState(false);

  useEffect(() => {
    if (!currentUser) return;
    async function check() {
      const [{ data: enrollData }, { data: lessonData }, { data: progressData }] = await Promise.all([
        supabase.from("enrollments").select("id").eq("user_id", currentUser!.id).eq("course_id", courseId).limit(1),
        supabase.from("lessons").select("*").eq("id", lessonId).single(),
        supabase.from("lesson_progress").select("*").eq("user_id", currentUser!.id),
      ]);
      setIsEnrolled((enrollData ?? []).length > 0);
      setProgressList(progressData || []);
      if (lessonData) {
        setDbLesson(lessonData);
        const [{ data: modData }, { data: siblingsData }] = await Promise.all([
          supabase.from("modules").select("title").eq("id", lessonData.module_id).single(),
          supabase.from("lessons").select("*").eq("module_id", lessonData.module_id).order("order_index"),
        ]);
        if (modData) setDbModuleTitle(modData.title);
        setDbModuleLessons(siblingsData || []);
      }
    }
    check();
  }, [currentUser, courseId, lessonId]);

  const handleVideoEnded = useCallback(async () => {
    if (!currentUser || videoCompleted) return;
    setVideoCompleted(true);

    // Find current progress for this lesson
    const existing = progressList.find((p) => p.lesson_id === lessonId);
    const newWatchCount = (existing?.watch_count || 0) + 1;

    const now = new Date().toISOString();
    const { data, error } = await supabase
      .from("lesson_progress")
      .upsert(
        {
          user_id: currentUser.id,
          lesson_id: lessonId,
          completed: true,
          completed_at: now,
          status: "completed",
          watch_count: newWatchCount,
          last_watched_at: now,
        },
        { onConflict: "user_id,lesson_id" }
      )
      .select()
      .single();

    if (!error && data) {
      // Update local progress list
      setProgressList((prev) => {
        const idx = prev.findIndex((p) => p.lesson_id === lessonId);
        const updated: ProgressRecord = { lesson_id: lessonId, status: "completed", completed: true, watch_count: newWatchCount };
        if (idx >= 0) {
          const next = [...prev];
          next[idx] = updated;
          return next;
        }
        return [...prev, updated];
      });
    }
  }, [currentUser, lessonId, videoCompleted, progressList]);

  if (!currentUser || isEnrolled === null) {
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

  const course = getCourseById(courseId);
  const lesson = dbLesson as { id: string; module_id: string; title: string; video_url: string; duration_sec: number; materials?: { name: string; url: string; type: string }[] } | null;

  if (!course || !lesson) {
    return (
      <div className="p-6 text-center">
        <p className="text-muted-foreground">Bài học không tồn tại.</p>
      </div>
    );
  }

  const moduleLessons = dbModuleLessons as { id: string; title: string; duration_sec: number }[];
  const quiz = getQuizByLesson(lessonId);
  const assignment = getAssignmentByLesson(lessonId);

  const tabs: { key: TabKey; label: string; icon: React.ReactNode; show: boolean }[] = [
    { key: "materials", label: "Tài liệu", icon: <FileText className="h-4 w-4" />, show: true },
    { key: "quiz", label: "Quiz", icon: <HelpCircle className="h-4 w-4" />, show: !!quiz },
    { key: "assignment", label: "Bài tập", icon: <PenTool className="h-4 w-4" />, show: !!assignment },
  ];

  const handleQuizSubmit = () => setQuizSubmitted(true);
  const handleAssignmentSubmit = () => setAssignmentSubmitted(true);

  const getQuizScore = () => {
    if (!quiz) return 0;
    let correct = 0;
    quiz.questions.forEach((q, i) => {
      if (quizAnswers[i] === q.correct) correct++;
    });
    return Math.round((correct / quiz.questions.length) * 100);
  };

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

          {/* Tabs */}
          <div className="flex gap-1 border-b border-gold-shadow/30">
            {tabs
              .filter((t) => t.show)
              .map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px",
                    activeTab === tab.key
                      ? "border-gold text-gold"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  )}
                >
                  {tab.icon}
                  {tab.label}
                </button>
              ))}
          </div>

          {/* Tab Content */}
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
          >
            {/* Materials Tab */}
            {activeTab === "materials" && (
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

            {/* Quiz Tab */}
            {activeTab === "quiz" && quiz && (
              <Card>
                <CardContent className="space-y-6">
                  <div>
                    <h3 className="font-semibold text-foreground">{quiz.title}</h3>
                    <p className="text-xs text-muted-foreground mt-1">
                      Đạt {quiz.pass_score}% để vượt qua
                    </p>
                  </div>

                  {quiz.questions.map((q, qIndex) => (
                    <div key={qIndex} className="space-y-2">
                      <p className="text-sm font-medium text-foreground">
                        {qIndex + 1}. {q.question}
                      </p>
                      <div className="space-y-1.5 pl-4">
                        {q.options.map((opt, oIndex) => {
                          const isSelected = quizAnswers[qIndex] === oIndex;
                          const isCorrect = q.correct === oIndex;
                          let optClass = "border-gold-shadow/30";
                          if (quizSubmitted) {
                            if (isCorrect) optClass = "border-green-500 bg-green-500/10";
                            else if (isSelected && !isCorrect)
                              optClass = "border-red-500 bg-red-500/10";
                          } else if (isSelected) {
                            optClass = "border-gold bg-gold/10";
                          }

                          return (
                            <label
                              key={oIndex}
                              className={cn(
                                "flex items-center gap-3 rounded-lg border p-3 text-sm cursor-pointer transition-colors",
                                optClass,
                                quizSubmitted && "cursor-default"
                              )}
                            >
                              <input
                                type="radio"
                                name={`q-${qIndex}`}
                                checked={isSelected}
                                disabled={quizSubmitted}
                                onChange={() =>
                                  setQuizAnswers((prev) => ({
                                    ...prev,
                                    [qIndex]: oIndex,
                                  }))
                                }
                                className="accent-gold"
                              />
                              <span>{opt}</span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  ))}

                  {!quizSubmitted ? (
                    <Button
                      onClick={handleQuizSubmit}
                      disabled={
                        Object.keys(quizAnswers).length < quiz.questions.length
                      }
                      className="bg-gold text-black hover:bg-gold/90"
                    >
                      <Send className="h-4 w-4 mr-2" />
                      Nộp bài
                    </Button>
                  ) : (
                    <div
                      className={cn(
                        "rounded-lg p-4 text-sm font-medium",
                        getQuizScore() >= quiz.pass_score
                          ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                          : "bg-red-500/10 text-red-700 dark:text-red-400"
                      )}
                    >
                      Kết quả: {getQuizScore()}% —{" "}
                      {getQuizScore() >= quiz.pass_score
                        ? "Bạn đã vượt qua!"
                        : "Chưa đạt. Hãy xem lại bài học và thử lại."}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Assignment Tab */}
            {activeTab === "assignment" && assignment && (
              <Card>
                <CardContent className="space-y-4">
                  <div>
                    <h3 className="font-semibold text-foreground">
                      {assignment.title}
                    </h3>
                    <p className="text-sm text-muted-foreground mt-2 whitespace-pre-line">
                      {assignment.description}
                    </p>
                  </div>

                  {assignment.materials && assignment.materials.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
                        Tài liệu tham khảo
                      </p>
                      {assignment.materials.map((mat, i) => (
                        <a
                          key={i}
                          href={mat.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 text-sm text-gold hover:underline"
                        >
                          <Download className="h-3.5 w-3.5" />
                          {mat.name}
                        </a>
                      ))}
                    </div>
                  )}

                  {!assignmentSubmitted ? (
                    <>
                      <textarea
                        value={assignmentNote}
                        onChange={(e) => setAssignmentNote(e.target.value)}
                        placeholder="Ghi chú bài làm của bạn..."
                        rows={5}
                        className="w-full rounded-lg border border-gold-shadow/30 bg-card p-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-gold focus:outline-none resize-none"
                      />
                      <Button
                        onClick={handleAssignmentSubmit}
                        disabled={!assignmentNote.trim()}
                        className="bg-gold text-black hover:bg-gold/90"
                      >
                        <Send className="h-4 w-4 mr-2" />
                        Nộp bài tập
                      </Button>
                    </>
                  ) : (
                    <div className="rounded-lg bg-emerald-500/10 p-4 text-sm text-emerald-700 dark:text-emerald-400 flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4" />
                      Bài tập đã được nộp. Mentor sẽ chấm sớm!
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </motion.div>
        </motion.div>

        {/* Right Sidebar — Lesson List */}
        <motion.div
          className="lg:w-[30%] lg:max-w-xs"
          initial={{ opacity: 0, x: 16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
        >
          <Card className="sticky top-6">
            <CardContent>
              <h3 className="text-sm font-semibold text-gold mb-3">
                {dbModuleTitle || "Danh sách bài học"}
              </h3>
              <div className="space-y-0.5 max-h-[60vh] overflow-y-auto">
                {moduleLessons.map((l) => {
                  const lp = progressList.find((p) => p.lesson_id === l.id);
                  const status = lp?.status || (lp?.completed ? "completed" : "not_started");
                  const watchCount = lp?.watch_count || 0;
                  const isCurrent = l.id === lessonId;

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
