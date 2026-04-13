"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Star,
  Users,
  FileCheck,
  AlertTriangle,
} from "lucide-react";
import {
  users,
  assignments,
  mentorReviews,
  getStudentsByMentor,
  getUngradedSubmissions,
  getAvgRating,
} from "@/lib/mock-data";
import { formatDate, formatRelativeTime, cn } from "@/lib/utils";
import { PageTransition } from "@/components/shared/PageTransition";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
};

const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={`h-3.5 w-3.5 ${
            i < rating
              ? "fill-yellow-400 text-yellow-400"
              : "fill-none text-muted-foreground/30"
          }`}
        />
      ))}
    </div>
  );
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

type Tab = "overview" | "ungraded" | "reviews";

export default function AdminMentorsPage() {
  const mentors = users.filter((u) => u.role === "mentor");
  const [selectedMentorId, setSelectedMentorId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>("overview");

  const selectedMentor = mentors.find((m) => m.id === selectedMentorId);

  // Data for selected mentor
  const mentorStudents = selectedMentorId
    ? getStudentsByMentor(selectedMentorId)
    : [];
  const mentorStudentIds = new Set(mentorStudents.map((s) => s.id));
  const mentorUngraded = selectedMentorId
    ? getUngradedSubmissions().filter((s) => mentorStudentIds.has(s.user_id))
    : [];
  const mentorReviewsList = selectedMentorId
    ? [...mentorReviews]
        .filter((r) => r.mentor_id === selectedMentorId)
        .sort(
          (a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        )
    : [];

  const tabs: { key: Tab; label: string; count?: number }[] = [
    { key: "overview", label: "Tổng quan" },
    { key: "ungraded", label: "Bài chưa chấm", count: mentorUngraded.length },
    { key: "reviews", label: "Đánh giá", count: mentorReviewsList.length },
  ];

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
            <span className="gold-gradient-text">Quản lý Mentor</span>
          </h1>
          <p className="mt-1 text-muted-foreground">
            Chọn mentor để xem chi tiết hoạt động
          </p>
        </motion.div>

        {/* Mentor cards */}
        <motion.div
          variants={item}
          className="grid grid-cols-1 sm:grid-cols-2 gap-4"
        >
          {mentors.map((mentor) => {
            const avg = getAvgRating(mentor.id);
            const studentCount = getStudentsByMentor(mentor.id).length;
            const studentIds = new Set(
              getStudentsByMentor(mentor.id).map((s) => s.id)
            );
            const ungradedCount = getUngradedSubmissions().filter((s) =>
              studentIds.has(s.user_id)
            ).length;
            const reviewCount = mentorReviews.filter(
              (r) => r.mentor_id === mentor.id
            ).length;
            const isSelected = selectedMentorId === mentor.id;

            return (
              <Card
                key={mentor.id}
                className={cn(
                  "cursor-pointer transition-all",
                  isSelected
                    ? "ring-2 ring-gold gold-border-glow"
                    : "hover:border-gold/40"
                )}
                onClick={() => {
                  setSelectedMentorId(isSelected ? null : mentor.id);
                  setActiveTab("overview");
                }}
              >
                <CardContent className="pt-4 space-y-4">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-12 w-12">
                      <AvatarFallback className="bg-gold/15 text-gold font-semibold">
                        {getInitials(mentor.full_name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="font-semibold text-foreground">
                        {mentor.full_name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {mentor.email}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-3xl font-bold text-gold">{avg}</p>
                      <StarRating rating={Math.round(avg)} />
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Users className="h-3.5 w-3.5" /> {studentCount} học viên
                    </span>
                    <span className="flex items-center gap-1">
                      <FileCheck className="h-3.5 w-3.5" /> {ungradedCount} chưa
                      chấm
                    </span>
                    <span className="flex items-center gap-1">
                      <Star className="h-3.5 w-3.5" /> {reviewCount} đánh giá
                    </span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </motion.div>

        {/* Detail panel for selected mentor */}
        <AnimatePresence mode="wait">
          {selectedMentor && (
            <motion.div
              key={selectedMentor.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.3 }}
              className="space-y-4"
            >
              {/* Tabs */}
              <div className="flex items-center gap-1 border-b border-border pb-1">
                {tabs.map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={cn(
                      "px-4 py-2 text-sm font-medium rounded-t-lg transition-colors",
                      activeTab === tab.key
                        ? "text-gold border-b-2 border-gold"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {tab.label}
                    {tab.count !== undefined && (
                      <span className="ml-1.5 text-xs text-muted-foreground">
                        ({tab.count})
                      </span>
                    )}
                  </button>
                ))}
              </div>

              {/* Tab: Overview */}
              {activeTab === "overview" && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="grid grid-cols-1 sm:grid-cols-3 gap-4"
                >
                  <Card>
                    <CardContent className="pt-4 flex items-center gap-4">
                      <div className="rounded-lg bg-gold/10 p-3">
                        <Users className="h-5 w-5 text-gold" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Học viên</p>
                        <p className="text-2xl font-bold text-foreground">
                          {mentorStudents.length}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-4 flex items-center gap-4">
                      <div className="rounded-lg bg-red-500/10 p-3">
                        <AlertTriangle className="h-5 w-5 text-red-500" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">
                          Bài chưa chấm
                        </p>
                        <p className="text-2xl font-bold text-foreground">
                          {mentorUngraded.length}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-4 flex items-center gap-4">
                      <div className="rounded-lg bg-yellow-500/10 p-3">
                        <Star className="h-5 w-5 text-yellow-500" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">
                          Rating TB
                        </p>
                        <p className="text-2xl font-bold text-foreground">
                          {getAvgRating(selectedMentor.id)}/5
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}

              {/* Tab: Ungraded submissions */}
              {activeTab === "ungraded" && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="space-y-3"
                >
                  {mentorUngraded.length === 0 ? (
                    <Card>
                      <CardContent className="py-10 text-center">
                        <FileCheck className="h-10 w-10 text-emerald-500/40 mx-auto mb-3" />
                        <p className="text-muted-foreground">
                          Không có bài nào cần chấm
                        </p>
                      </CardContent>
                    </Card>
                  ) : (
                    mentorUngraded.map((submission, i) => {
                      const student = users.find(
                        (u) => u.id === submission.user_id
                      );
                      const assignment = assignments.find(
                        (a) => a.id === submission.assignment_id
                      );

                      return (
                        <motion.div
                          key={submission.id}
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.25, delay: i * 0.05 }}
                        >
                          <Card>
                            <CardContent className="pt-4">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <Avatar className="h-8 w-8">
                                    <AvatarFallback className="bg-gold/15 text-gold text-xs">
                                      {student
                                        ? getInitials(student.full_name)
                                        : "?"}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div>
                                    <p className="font-medium text-foreground text-sm">
                                      {student?.full_name ?? "Học viên"}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                      {assignment?.title ?? "Bài tập"}
                                    </p>
                                  </div>
                                </div>
                                <div className="text-right flex items-center gap-3">
                                  <p className="text-xs text-muted-foreground">
                                    {formatRelativeTime(submission.submitted_at)}
                                  </p>
                                  <Badge
                                    variant="outline"
                                    className="bg-orange-500/15 text-orange-700 dark:text-orange-300 border-orange-500/30"
                                  >
                                    Chưa chấm
                                  </Badge>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        </motion.div>
                      );
                    })
                  )}
                </motion.div>
              )}

              {/* Tab: Reviews */}
              {activeTab === "reviews" && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="space-y-3"
                >
                  {mentorReviewsList.length === 0 ? (
                    <Card>
                      <CardContent className="py-10 text-center">
                        <Star className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
                        <p className="text-muted-foreground">
                          Chưa có đánh giá nào
                        </p>
                      </CardContent>
                    </Card>
                  ) : (
                    mentorReviewsList.map((review, i) => {
                      const student = users.find(
                        (u) => u.id === review.student_id
                      );

                      return (
                        <motion.div
                          key={review.id}
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.25, delay: i * 0.05 }}
                        >
                          <Card>
                            <CardContent className="pt-4">
                              <div className="flex items-start gap-4">
                                <Avatar className="h-9 w-9 shrink-0">
                                  <AvatarFallback className="bg-gold/15 text-gold text-xs font-semibold">
                                    {student
                                      ? getInitials(student.full_name)
                                      : "?"}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="flex-1 min-w-0 space-y-1">
                                  <div className="flex items-center justify-between gap-2">
                                    <p className="font-medium text-foreground">
                                      {student?.full_name ?? "Học viên"}
                                    </p>
                                    <p className="text-xs text-muted-foreground whitespace-nowrap">
                                      {formatDate(review.created_at)}
                                    </p>
                                  </div>
                                  <StarRating rating={review.rating} />
                                  <p className="text-sm text-muted-foreground leading-relaxed">
                                    {review.feedback}
                                  </p>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        </motion.div>
                      );
                    })
                  )}
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Empty state */}
        {!selectedMentorId && (
          <motion.div variants={item}>
            <Card>
              <CardContent className="py-12 text-center">
                <Users className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-muted-foreground">
                  Chọn một mentor ở trên để xem chi tiết
                </p>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </motion.div>
    </PageTransition>
  );
}
