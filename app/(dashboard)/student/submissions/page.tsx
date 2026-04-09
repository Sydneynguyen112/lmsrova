"use client";

import { motion } from "framer-motion";
import { FileText, MessageSquare } from "lucide-react";

import {
  assignments,
  getSubmissionsByUser,
} from "@/lib/mock-data";
import { cn, formatDate, formatRelativeTime } from "@/lib/utils";
import { useCurrentUser } from "@/lib/auth";
import { EmptyState } from "@/components/shared/EmptyState";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function StudentSubmissionsPage() {
  const currentUser = useCurrentUser("student");

  if (!currentUser) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-muted-foreground">Đang tải...</div>
      </div>
    );
  }

  const submissionsList = [...getSubmissionsByUser(currentUser.id)].sort(
    (a, b) =>
      new Date(b.submitted_at).getTime() - new Date(a.submitted_at).getTime()
  );

  return (
    <div className="space-y-6 p-6">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <h1 className="text-2xl font-bold gold-gradient-text">Bài nộp của tôi</h1>
        <p className="text-muted-foreground mt-1">
          Theo dõi tình trạng bài tập đã nộp và phản hồi từ mentor.
        </p>
      </motion.div>

      <div className="space-y-4">
        {submissionsList.map((sub, index) => {
          const assignment = assignments.find((a) => a.id === sub.assignment_id);
          const isGraded = !!sub.graded_at;

          return (
            <motion.div
              key={sub.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: 0.08 * (index + 1) }}
            >
              <Card>
                <CardHeader>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gold/10">
                        <FileText className="h-4 w-4 text-gold" />
                      </div>
                      <div className="min-w-0">
                        <CardTitle className="truncate">
                          {assignment?.title || "Bài tập"}
                        </CardTitle>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Nộp lúc {formatDate(sub.submitted_at)} &middot;{" "}
                          {formatRelativeTime(sub.submitted_at)}
                        </p>
                      </div>
                    </div>
                    <Badge
                      className={cn(
                        "shrink-0",
                        isGraded
                          ? "bg-green-600 text-white"
                          : "bg-yellow-600/20 text-yellow-500"
                      )}
                    >
                      {isGraded ? "Đã chấm" : "Chờ chấm"}
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent className="space-y-3">
                  {/* Student note */}
                  {sub.metadata?.note && (
                    <div className="rounded-lg border border-gold-shadow/30 p-3">
                      <p className="text-xs text-muted-foreground mb-1 font-medium">
                        Ghi chú của bạn
                      </p>
                      <p className="text-sm text-foreground">{sub.metadata.note}</p>
                    </div>
                  )}

                  {/* Metadata tags */}
                  {(sub.metadata?.pair || sub.metadata?.timeframe) && (
                    <div className="flex flex-wrap gap-2">
                      {sub.metadata.pair && (
                        <Badge variant="outline" className="text-xs">
                          {sub.metadata.pair}
                        </Badge>
                      )}
                      {sub.metadata.timeframe && (
                        <Badge variant="outline" className="text-xs">
                          {sub.metadata.timeframe}
                        </Badge>
                      )}
                      {sub.metadata.direction && (
                        <Badge variant="outline" className="text-xs">
                          {sub.metadata.direction}
                        </Badge>
                      )}
                    </div>
                  )}

                  {/* Mentor Feedback */}
                  {isGraded && sub.mentor_feedback && (
                    <div className="rounded-lg bg-gold/5 border border-gold-shadow/30 p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <MessageSquare className="h-3.5 w-3.5 text-gold" />
                        <p className="text-xs text-gold font-medium">
                          Phản hồi từ Mentor
                        </p>
                        {sub.graded_at && (
                          <span className="text-[10px] text-muted-foreground ml-auto">
                            {formatDate(sub.graded_at)}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-foreground">
                        {sub.mentor_feedback}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {submissionsList.length === 0 && (
        <EmptyState variant="submissions" description="Bạn chưa nộp bài tập nào" />
      )}
    </div>
  );
}
