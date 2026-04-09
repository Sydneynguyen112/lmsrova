"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { FileCheck, Image as ImageIcon, Send, ChevronDown, ChevronUp } from "lucide-react";
import {
  users,
  assignments,
  getUngradedSubmissions,
  getStudentsByMentor,
} from "@/lib/mock-data";
import { formatRelativeTime } from "@/lib/utils";
import { useCurrentUser } from "@/lib/auth";
import { PageTransition } from "@/components/shared/PageTransition";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
};

const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

export default function MentorSubmissionsPage() {
  const currentUser = useCurrentUser("mentor");
  const [openFormId, setOpenFormId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState("");

  if (!currentUser) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-muted-foreground">Đang tải...</div>
      </div>
    );
  }

  const students = getStudentsByMentor(currentUser.id);
  const mentorStudentIds = new Set(students.map((s) => s.id));
  const ungradedSubmissions = getUngradedSubmissions().filter((s) =>
    mentorStudentIds.has(s.user_id)
  );

  const handleSubmitFeedback = (submissionId: string) => {
    if (!feedback.trim()) return;
    console.log("Grading submission:", submissionId, "Feedback:", feedback);
    setFeedback("");
    setOpenFormId(null);
  };

  return (
    <PageTransition>
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="space-y-6"
    >
      <motion.div variants={item}>
        <h1 className="text-2xl md:text-3xl font-bold">
          <span className="gold-gradient-text">Bài nộp chưa chấm</span>
        </h1>
        <p className="mt-1 text-muted-foreground">
          Chấm bài và gửi phản hồi cho học viên
        </p>
      </motion.div>

      {ungradedSubmissions.length === 0 ? (
        <motion.div variants={item}>
          <Card>
            <CardContent className="py-12 text-center">
              <FileCheck className="h-12 w-12 text-green-400 mx-auto mb-3" />
              <p className="text-muted-foreground">
                Tuyệt vời! Không có bài nào cần chấm
              </p>
            </CardContent>
          </Card>
        </motion.div>
      ) : (
        <div className="space-y-4">
          {ungradedSubmissions.map((submission) => {
            const student = users.find((u) => u.id === submission.user_id);
            const assignment = assignments.find(
              (a) => a.id === submission.assignment_id
            );
            const isOpen = openFormId === submission.id;

            return (
              <motion.div key={submission.id} variants={item}>
                <Card>
                  <CardContent className="pt-4 space-y-4">
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="space-y-1">
                        <p className="font-semibold text-foreground">
                          {student?.full_name || "Học viên"}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {assignment?.title || "Bài tập"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Nộp: {formatRelativeTime(submission.submitted_at)}
                        </p>
                      </div>
                      <Badge
                        variant="outline"
                        className="bg-yellow-500/20 text-yellow-300 border-yellow-500/30 self-start"
                      >
                        Chưa chấm
                      </Badge>
                    </div>

                    {/* Image thumbnails */}
                    {submission.image_urls && submission.image_urls.length > 0 && (
                      <div className="flex gap-2 flex-wrap">
                        {submission.image_urls.map((url, idx) => (
                          <div
                            key={idx}
                            className="w-20 h-20 rounded-lg bg-muted/50 border border-border/50 flex items-center justify-center overflow-hidden"
                          >
                            <ImageIcon className="h-6 w-6 text-muted-foreground" />
                          </div>
                        ))}
                        <span className="self-end text-xs text-muted-foreground">
                          {submission.image_urls.length} ảnh đính kèm
                        </span>
                      </div>
                    )}

                    {/* Student note */}
                    {submission.metadata?.note && (
                      <div className="rounded-lg bg-muted/30 border border-border/30 p-3">
                        <p className="text-xs text-muted-foreground mb-1">
                          Ghi chú của học viên:
                        </p>
                        <p className="text-sm text-foreground">
                          {submission.metadata.note}
                        </p>
                      </div>
                    )}

                    {/* Toggle feedback form */}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setOpenFormId(isOpen ? null : submission.id);
                        setFeedback("");
                      }}
                      className={
                        isOpen
                          ? "border-gold/50 text-gold"
                          : "border-gold/30 text-gold hover:bg-gold/10"
                      }
                    >
                      {isOpen ? (
                        <>
                          <ChevronUp className="h-4 w-4 mr-1" /> Đóng
                        </>
                      ) : (
                        <>
                          <FileCheck className="h-4 w-4 mr-1" /> Chấm bài
                        </>
                      )}
                    </Button>

                    {/* Inline feedback form */}
                    {isOpen && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="space-y-3 border-t border-border/30 pt-4"
                      >
                        <textarea
                          placeholder="Nhập nhận xét và phản hồi cho học viên..."
                          value={feedback}
                          onChange={(e) => setFeedback(e.target.value)}
                          rows={4}
                          className="w-full rounded-lg border border-border/50 bg-muted/20 p-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-gold/50 resize-none"
                        />
                        <div className="flex justify-end">
                          <Button
                            onClick={() =>
                              handleSubmitFeedback(submission.id)
                            }
                            disabled={!feedback.trim()}
                            className="bg-gold hover:bg-gold/90 text-black"
                          >
                            <Send className="h-4 w-4 mr-1" />
                            Gửi phản hồi
                          </Button>
                        </div>
                      </motion.div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}
    </motion.div>
    </PageTransition>
  );
}
