"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileCheck,
  Send,
  CheckCircle2,
  Clock,
  ArrowLeft,
  ImagePlus,
  MessageSquare,
  Circle,
} from "lucide-react";
import {
  users,
  getStudentsByMentor,
  getUngradedSubmissions,
  getSubmissionsByUser,
  getAssignmentsByCourse,
} from "@/lib/mock-data";
import { cn, formatDate, formatRelativeTime } from "@/lib/utils";
import { useCurrentUser } from "@/lib/auth";
import { PageTransition } from "@/components/shared/PageTransition";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

function getInitials(name: string) {
  return name.split(" ").map((n) => n[0]).join("").slice(-2);
}

export default function MentorSubmissionsPage() {
  const currentUser = useCurrentUser("mentor");
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [feedbacks, setFeedbacks] = useState<Record<string, string>>({});
  const [gradedIds, setGradedIds] = useState<Set<string>>(new Set());

  if (!currentUser) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-muted-foreground">Đang tải...</div>
      </div>
    );
  }

  const students = getStudentsByMentor(currentUser.id);
  const proAssignments = getAssignmentsByCourse("c-pro");
  const allUngraded = getUngradedSubmissions();
  const mentorStudentIds = new Set(students.map((s) => s.id));
  const mentorUngraded = allUngraded.filter((s) => mentorStudentIds.has(s.user_id));

  const studentsWithUngraded = students.filter((s) =>
    mentorUngraded.some((sub) => sub.user_id === s.id)
  );

  const selectedStudent = students.find((s) => s.id === selectedStudentId);
  const studentSubmissions = selectedStudentId ? getSubmissionsByUser(selectedStudentId) : [];

  function getSubsForAssignment(assignmentId: string) {
    return studentSubmissions
      .filter((s) => s.assignment_id === assignmentId)
      .sort((a, b) => new Date(b.submitted_at).getTime() - new Date(a.submitted_at).getTime());
  }

  function handleGradeOne(subId: string) {
    const fb = feedbacks[subId];
    if (!fb?.trim()) return;
    console.log("Grade:", { submission_id: subId, feedback: fb });
    setGradedIds((prev) => new Set(prev).add(subId));
  }

  function handleGradeAll() {
    Object.entries(feedbacks)
      .filter(([id, fb]) => fb.trim() && !gradedIds.has(id))
      .forEach(([id]) => handleGradeOne(id));
  }

  const pendingCount = Object.entries(feedbacks).filter(
    ([id, fb]) => fb.trim() && !gradedIds.has(id)
  ).length;

  return (
    <PageTransition>
      <div className="space-y-6">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl md:text-3xl font-bold">
            <span className="gold-gradient-text">Chấm bài</span>
          </h1>
          <p className="mt-1 text-muted-foreground">
            {mentorUngraded.length > 0
              ? `${mentorUngraded.length} bài chưa chấm — chấm từng mô hình riêng`
              : "Tất cả bài đã được chấm!"}
          </p>
        </motion.div>

        <AnimatePresence mode="wait">
          {selectedStudent ? (
            /* ─── Student worksheet ─── */
            <motion.div
              key={selectedStudent.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="space-y-5"
            >
              <div className="flex items-center justify-between">
                <button
                  onClick={() => { setSelectedStudentId(null); setFeedbacks({}); setGradedIds(new Set()); }}
                  className="text-sm text-gold hover:underline flex items-center gap-1"
                >
                  <ArrowLeft className="h-4 w-4" /> Quay lại
                </button>
                {pendingCount > 0 && (
                  <Button onClick={handleGradeAll} className="bg-gold hover:bg-gold/90 text-black font-semibold">
                    <Send className="h-4 w-4 mr-2" /> Gửi {pendingCount} phản hồi
                  </Button>
                )}
              </div>

              {/* Student info */}
              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-gold/15 text-gold font-semibold">
                        {getInitials(selectedStudent.full_name)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-semibold text-foreground">{selectedStudent.full_name}</p>
                      <p className="text-xs text-muted-foreground">{selectedStudent.email}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Each assignment */}
              {proAssignments.map((assignment) => {
                const subs = getSubsForAssignment(assignment.id);
                const hasSubs = subs.length > 0;

                return (
                  <div key={assignment.id} className="space-y-2">
                    {/* Assignment title bar */}
                    <div className="flex items-center gap-3 px-1">
                      <div className={cn(
                        "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg font-bold text-xs",
                        hasSubs ? "bg-gold/15 text-gold" : "bg-muted text-muted-foreground"
                      )}>
                        {assignment.order_index}
                      </div>
                      <h3 className="font-semibold text-foreground text-sm">{assignment.title}</h3>
                      {!hasSubs && <span className="text-[10px] text-muted-foreground ml-auto">Chưa nộp</span>}
                    </div>

                    {hasSubs ? (
                      /* Each submission = 1 model, rendered as a row */
                      <div className="space-y-2">
                        {subs.map((sub, idx) => {
                          const isGraded = !!sub.graded_at || gradedIds.has(sub.id);
                          const justGraded = gradedIds.has(sub.id) && !sub.graded_at;

                          return (
                            <Card key={sub.id} className={cn(
                              "transition-all",
                              isGraded && "border-emerald-500/20 opacity-70"
                            )}>
                              <CardContent className="pt-4 space-y-3">
                                <div className="flex items-start gap-4">
                                  {/* Model number */}
                                  <div className={cn(
                                    "flex h-7 w-7 shrink-0 items-center justify-center rounded-md font-bold text-[10px]",
                                    isGraded ? "bg-emerald-500/15 text-emerald-500" : "bg-orange-500/15 text-orange-500"
                                  )}>
                                    #{idx + 1}
                                  </div>

                                  {/* Image thumbnails */}
                                  {sub.image_urls && sub.image_urls.length > 0 && (
                                    <div className="flex gap-1.5 shrink-0">
                                      {sub.image_urls.map((_, j) => (
                                        <div key={j} className="w-14 h-14 rounded-md bg-muted border border-border flex items-center justify-center">
                                          <ImagePlus className="h-4 w-4 text-muted-foreground" />
                                        </div>
                                      ))}
                                    </div>
                                  )}

                                  {/* Student's note */}
                                  <div className="flex-1 min-w-0">
                                    <p className="text-[10px] text-muted-foreground mb-1">
                                      {formatDate(sub.submitted_at)} · {formatRelativeTime(sub.submitted_at)}
                                    </p>
                                    <p className="text-sm text-foreground">
                                      {sub.metadata?.note || "Không có ghi chú"}
                                    </p>
                                  </div>
                                </div>

                                {/* Existing feedback */}
                                {sub.graded_at && sub.mentor_feedback && (
                                  <div className="rounded-lg bg-gold/5 border border-gold/20 p-3 ml-11">
                                    <div className="flex items-center gap-2 mb-1">
                                      <MessageSquare className="h-3 w-3 text-gold" />
                                      <span className="text-[10px] text-gold font-medium">Đã chấm</span>
                                    </div>
                                    <p className="text-sm text-foreground">{sub.mentor_feedback}</p>
                                  </div>
                                )}

                                {/* Just graded */}
                                {justGraded && (
                                  <div className="flex items-center gap-2 text-xs text-emerald-500 ml-11">
                                    <CheckCircle2 className="h-4 w-4" /> Đã gửi phản hồi
                                  </div>
                                )}

                                {/* Feedback input */}
                                {!isGraded && (
                                  <div className="flex gap-2 ml-11">
                                    <input
                                      type="text"
                                      placeholder={`Phản hồi mô hình #${idx + 1}...`}
                                      value={feedbacks[sub.id] || ""}
                                      onChange={(e) => setFeedbacks((prev) => ({ ...prev, [sub.id]: e.target.value }))}
                                      className="flex-1 rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-gold/50"
                                    />
                                    <Button
                                      size="sm"
                                      disabled={!(feedbacks[sub.id] || "").trim()}
                                      onClick={() => handleGradeOne(sub.id)}
                                      className="bg-gold hover:bg-gold/90 text-black"
                                    >
                                      <Send className="h-3.5 w-3.5" />
                                    </Button>
                                  </div>
                                )}
                              </CardContent>
                            </Card>
                          );
                        })}
                      </div>
                    ) : (
                      <Card className="opacity-40">
                        <CardContent className="py-6 text-center">
                          <Circle className="h-5 w-5 text-muted-foreground mx-auto mb-1" />
                          <p className="text-xs text-muted-foreground">Học viên chưa nộp bài này</p>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                );
              })}

              {/* Bottom grade all */}
              {pendingCount > 0 && (
                <div className="sticky bottom-4 z-10">
                  <Button
                    onClick={handleGradeAll}
                    className="w-full bg-gold hover:bg-gold/90 text-black font-semibold py-5 shadow-lg gold-glow"
                  >
                    <Send className="h-4 w-4 mr-2" />
                    Gửi tất cả {pendingCount} phản hồi
                  </Button>
                </div>
              )}
            </motion.div>
          ) : (
            /* ─── Student list ─── */
            <motion.div
              key="list"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-3"
            >
              {mentorUngraded.length === 0 && (
                <Card>
                  <CardContent className="py-12 text-center">
                    <FileCheck className="h-12 w-12 text-emerald-500/40 mx-auto mb-3" />
                    <p className="text-muted-foreground">Tuyệt vời! Không có bài nào cần chấm</p>
                  </CardContent>
                </Card>
              )}

              {studentsWithUngraded.map((student) => {
                const count = mentorUngraded.filter((s) => s.user_id === student.id).length;
                return (
                  <motion.div
                    key={student.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    whileHover={{ x: 4 }}
                    className="cursor-pointer"
                    onClick={() => setSelectedStudentId(student.id)}
                  >
                    <Card className="hover:border-gold/40 transition-all">
                      <CardContent className="py-4">
                        <div className="flex items-center gap-4">
                          <Avatar className="h-10 w-10">
                            <AvatarFallback className="bg-gold/15 text-gold font-semibold">
                              {getInitials(student.full_name)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <p className="font-semibold text-foreground">{student.full_name}</p>
                            <p className="text-xs text-muted-foreground">{student.email}</p>
                          </div>
                          <Badge className="bg-orange-500/15 text-orange-700 dark:text-orange-300">
                            {count} mô hình chờ chấm
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}

              {/* Students done */}
              {students.filter((s) => !studentsWithUngraded.includes(s)).length > 0 && (
                <>
                  <p className="text-xs text-muted-foreground pt-4">Đã chấm xong</p>
                  {students.filter((s) => !studentsWithUngraded.includes(s)).map((student) => (
                    <motion.div
                      key={student.id}
                      className="cursor-pointer"
                      onClick={() => setSelectedStudentId(student.id)}
                    >
                      <Card className="opacity-50 hover:opacity-100 hover:border-gold/40 transition-all">
                        <CardContent className="py-4">
                          <div className="flex items-center gap-4">
                            <Avatar className="h-10 w-10">
                              <AvatarFallback className="bg-gold/15 text-gold font-semibold">
                                {getInitials(student.full_name)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <p className="font-semibold text-foreground">{student.full_name}</p>
                            </div>
                            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </PageTransition>
  );
}
