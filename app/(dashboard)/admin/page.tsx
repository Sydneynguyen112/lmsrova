"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import {
  users,
  courses,
  enrollments,
  getAtRiskStudents,
  getUngradedSubmissions,
  getModulesByCourse,
  getLessonsByModule,
} from "@/lib/mock-data";
import { cn, formatPrice, formatDate, formatRelativeTime } from "@/lib/utils";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { PageTransition } from "@/components/shared/PageTransition";

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.4, ease: "easeOut" as const },
  }),
};

function getInitials(name: string) {
  return name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export default function AdminDashboardPage() {
  const totalUsers = users.length;
  const totalEnrollments = enrollments.length;
  const ungradedCount = getUngradedSubmissions().length;
  const atRiskStudents = getAtRiskStudents();

  // Estimated revenue: sum of (course price * enrollment count for that course)
  // Skip courses with non-numeric price (e.g. "Nhận tư vấn")
  const estimatedRevenue = useMemo(() => {
    return courses.reduce((total, course) => {
      if (typeof course.price !== "number") return total;
      const count = enrollments.filter((e) => e.course_id === course.id).length;
      return total + course.price * count;
    }, 0);
  }, []);

  // Enrollment distribution by course
  const enrollmentDistribution = useMemo(() => {
    return courses.map((course) => {
      const count = enrollments.filter((e) => e.course_id === course.id).length;
      return { title: course.title, count };
    });
  }, []);

  const maxEnrollment = Math.max(...enrollmentDistribution.map((d) => d.count), 1);

  // Recent users — last 5 sorted by created_at desc
  const recentUsers = useMemo(() => {
    return [...users]
      .sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )
      .slice(0, 5);
  }, []);

  const stats = [
    { label: "Tổng Users", value: totalUsers.toString() },
    { label: "Tổng Enrollments", value: totalEnrollments.toString() },
    { label: "Doanh thu ước tính", value: formatPrice(estimatedRevenue) },
    { label: "Bài chưa chấm", value: ungradedCount.toString() },
  ];

  return (
    <PageTransition>
    <div className="space-y-8">
      {/* Page Title */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <h1 className="text-2xl font-bold gold-gradient-text">
          Admin Dashboard
        </h1>
        <p className="text-muted-foreground mt-1">
          Tổng quan hệ thống ROVA LMS
        </p>
      </motion.div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            custom={i}
            variants={fadeUp}
            initial="hidden"
            animate="visible"
          >
            <Card className="gold-border-glow">
              <CardHeader>
                <CardDescription>{stat.label}</CardDescription>
                <CardTitle className="text-2xl text-gold">
                  {stat.value}
                </CardTitle>
              </CardHeader>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Enrollment Distribution Bar Chart */}
      <motion.div
        custom={4}
        variants={fadeUp}
        initial="hidden"
        animate="visible"
      >
        <Card>
          <CardHeader>
            <CardTitle>Phân bố Enrollment theo khoá</CardTitle>
            <CardDescription>
              Số lượng đăng ký cho mỗi khoá học
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {enrollmentDistribution.map((item) => (
                <div key={item.title} className="space-y-1.5">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-foreground truncate max-w-[70%]">
                      {item.title}
                    </span>
                    <span className="text-gold font-medium">
                      {item.count} enrollments
                    </span>
                  </div>
                  <div className="h-3 w-full rounded-full bg-muted overflow-hidden">
                    <motion.div
                      className="h-full rounded-full bg-gradient-to-r from-gold-dark to-gold"
                      initial={{ width: 0 }}
                      animate={{
                        width: `${(item.count / maxEnrollment) * 100}%`,
                      }}
                      transition={{ duration: 0.8, ease: "easeOut", delay: 0.3 }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Recent Users Table */}
      <motion.div
        custom={5}
        variants={fadeUp}
        initial="hidden"
        animate="visible"
      >
        <Card>
          <CardHeader>
            <CardTitle>Users gần đây</CardTitle>
            <CardDescription>5 users mới nhất theo ngày tạo</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto rounded-2xl border border-gold-shadow/30">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tên</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead className="text-right">Hoạt động gần nhất</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="bg-gold-dark text-foreground text-xs">
                            {getInitials(user.full_name)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="font-medium">{user.full_name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          user.role === "admin"
                            ? "default"
                            : user.role === "mentor"
                            ? "secondary"
                            : "outline"
                        }
                      >
                        {user.role}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {user.email}
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      {formatRelativeTime(user.last_active_date)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Students At Risk */}
      <motion.div
        custom={6}
        variants={fadeUp}
        initial="hidden"
        animate="visible"
      >
        <Card className="border-destructive/30">
          <CardHeader>
            <CardTitle className="text-destructive">
              Students cần lưu ý
            </CardTitle>
            <CardDescription>
              Học viên có risk_tag &quot;at_risk&quot; hoặc &quot;watch&quot;
            </CardDescription>
          </CardHeader>
          <CardContent>
            {atRiskStudents.length === 0 ? (
              <p className="text-muted-foreground text-sm">
                Không có học viên nào cần lưu ý.
              </p>
            ) : (
              <div className="space-y-3">
                {atRiskStudents.map((student) => (
                  <div
                    key={student.id}
                    className="flex items-center justify-between rounded-lg border border-border/50 p-3"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar className="h-9 w-9">
                        <AvatarFallback className="bg-destructive/20 text-destructive text-xs">
                          {getInitials(student.full_name)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-sm">
                          {student.full_name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {student.classification ?? "N/A"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge
                        variant={
                          student.risk_tag === "at_risk"
                            ? "destructive"
                            : "secondary"
                        }
                      >
                        {student.risk_tag === "at_risk"
                          ? "Nguy cơ cao"
                          : "Theo dõi"}
                      </Badge>
                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                        {formatDate(student.last_active_date)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
    </PageTransition>
  );
}
