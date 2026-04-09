"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Search } from "lucide-react";
import Link from "next/link";
import {
  getStudentsByMentor,
  getEnrollmentsByUser,
  getCourseById,
} from "@/lib/mock-data";
import { formatDate } from "@/lib/utils";
import { useCurrentUser } from "@/lib/auth";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";

const classificationStyles: Record<string, string> = {
  newbie: "bg-gray-500/20 text-gray-300 border-gray-500/30",
  beginner: "bg-blue-500/20 text-blue-300 border-blue-500/30",
  intermediate: "bg-amber-500/20 text-amber-300 border-amber-500/30",
  advanced: "bg-green-500/20 text-green-300 border-green-500/30",
};

const classificationLabels: Record<string, string> = {
  newbie: "Newbie",
  beginner: "Beginner",
  intermediate: "Intermediate",
  advanced: "Advanced",
};

const riskStyles: Record<string, string> = {
  normal: "bg-green-500/20 text-green-300 border-green-500/30",
  at_risk: "bg-red-500/20 text-red-300 border-red-500/30",
  watch: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",
  churned: "bg-gray-500/20 text-gray-400 border-gray-500/30",
};

const riskLabels: Record<string, string> = {
  normal: "Bình thường",
  at_risk: "Nguy cơ",
  watch: "Theo dõi",
  churned: "Đã rời",
};

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
};

const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

export default function MentorStudentsPage() {
  const currentUser = useCurrentUser("mentor");
  const [search, setSearch] = useState("");

  if (!currentUser) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-muted-foreground">Đang tải...</div>
      </div>
    );
  }

  const students = getStudentsByMentor(currentUser.id);

  const filtered = students.filter((s) =>
    s.full_name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="space-y-6"
    >
      <motion.div variants={item}>
        <h1 className="text-2xl md:text-3xl font-bold">
          <span className="gold-gradient-text">Danh sách học viên</span>
        </h1>
        <p className="mt-1 text-muted-foreground">
          Quản lý và theo dõi tiến độ học viên của bạn
        </p>
      </motion.div>

      {/* Search */}
      <motion.div variants={item} className="max-w-sm">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Tìm kiếm học viên..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </motion.div>

      {/* Table */}
      <motion.div variants={item}>
        <Card>
          <CardContent className="pt-4">
            <div className="overflow-x-auto rounded-2xl border border-gold-shadow/30">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Học viên</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phân loại</TableHead>
                  <TableHead>Khoá học</TableHead>
                  <TableHead>Tiến độ</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead>Ngày tham gia</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <p className="text-muted-foreground">
                        Không tìm thấy học viên nào
                      </p>
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((student) => {
                    const enrollmentList = getEnrollmentsByUser(student.id);
                    const activeEnrollment = enrollmentList.find(
                      (e) => e.status === "active"
                    );
                    const progressPct = activeEnrollment
                      ? activeEnrollment.progress_pct
                      : 0;
                    const course = activeEnrollment
                      ? getCourseById(activeEnrollment.course_id)
                      : null;
                    const initials = student.full_name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .slice(-2);

                    return (
                      <TableRow key={student.id}>
                        <TableCell>
                          <Link
                            href={`/mentor/students/${student.id}`}
                            className="flex items-center gap-3 hover:opacity-80 transition-opacity"
                          >
                            <Avatar className="h-8 w-8">
                              <AvatarFallback className="bg-gold/20 text-gold text-xs">
                                {initials}
                              </AvatarFallback>
                            </Avatar>
                            <span className="font-medium text-foreground">
                              {student.full_name}
                            </span>
                          </Link>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {student.email}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={
                              classificationStyles[
                                student.classification || "newbie"
                              ]
                            }
                          >
                            {classificationLabels[
                              student.classification || "newbie"
                            ]}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {course?.title || "—"}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2 min-w-[120px]">
                            <Progress value={progressPct} className="flex-1" />
                            <span className="text-xs text-muted-foreground w-10 text-right">
                              {progressPct}%
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={
                              riskStyles[student.risk_tag || "normal"]
                            }
                          >
                            {riskLabels[student.risk_tag || "normal"]}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {formatDate(student.created_at)}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}
