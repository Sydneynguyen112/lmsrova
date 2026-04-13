"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Shield,
  CreditCard,
  CheckCircle2,
  Play,
  Clock,
  QrCode,
} from "lucide-react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { formatPrice, formatDuration } from "@/lib/utils";
import { useCurrentUser } from "@/lib/auth";
import { PageTransition } from "@/components/shared/PageTransition";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface Course {
  id: string;
  title: string;
  description: string;
  price: number | null;
  total_lessons: number;
  total_duration_sec: number;
}

export default function CheckoutPage() {
  const params = useParams();
  const router = useRouter();
  const courseId = params.courseId as string;
  const currentUser = useCurrentUser("student");
  const [course, setCourse] = useState<Course | null>(null);
  const [processing, setProcessing] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    supabase
      .from("courses")
      .select("*")
      .eq("id", courseId)
      .single()
      .then(({ data }) => setCourse(data as Course));
  }, [courseId]);

  if (!currentUser || !course) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-muted-foreground">Đang tải...</div>
      </div>
    );
  }

  const handlePayment = async () => {
    setProcessing(true);

    // TODO: Replace with Stripe Checkout when ready
    // For now: simulate payment + create enrollment
    await new Promise((r) => setTimeout(r, 2000));

    const { error } = await supabase.from("enrollments").insert({
      user_id: currentUser.id,
      course_id: course.id,
      status: "active",
      progress_pct: 0,
    });

    setProcessing(false);

    if (!error) {
      setSuccess(true);
    }
  };

  if (success) {
    return (
      <PageTransition>
        <div className="p-6 max-w-lg mx-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <Card className="gold-border-glow">
              <CardContent className="py-12 text-center space-y-4">
                <CheckCircle2 className="h-16 w-16 text-emerald-500 mx-auto" />
                <h2 className="text-2xl font-bold text-foreground">
                  Đăng ký thành công!
                </h2>
                <p className="text-muted-foreground">
                  Chào mừng bạn đến với <span className="text-gold font-semibold">{course.title}</span>.
                  Bắt đầu học ngay thôi!
                </p>
                <div className="flex gap-3 justify-center pt-4">
                  <Link href="/student">
                    <Button variant="outline">Dashboard</Button>
                  </Link>
                  <Link href={`/student/courses/${course.id}`}>
                    <Button className="bg-gold hover:bg-gold/90 text-black font-semibold">
                      <Play className="h-4 w-4 mr-2" /> Bắt đầu học
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <div className="p-6 max-w-2xl mx-auto space-y-6">
        <Link
          href="/student"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-gold"
        >
          <ArrowLeft className="h-4 w-4" /> Quay lại
        </Link>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-2xl font-bold">
            <span className="gold-gradient-text">Đăng ký khoá học</span>
          </h1>
        </motion.div>

        {/* Course summary */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card>
            <CardContent className="pt-5">
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 rounded-xl bg-gold/10 flex items-center justify-center shrink-0">
                  <Play className="h-7 w-7 text-gold" />
                </div>
                <div className="flex-1">
                  <h2 className="text-lg font-bold text-foreground">{course.title}</h2>
                  <p className="text-sm text-muted-foreground mt-1">{course.description}</p>
                  <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Play className="h-3.5 w-3.5" /> {course.total_lessons} bài học
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" /> {formatDuration(course.total_duration_sec)}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Payment section */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="gold-border-glow">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-gold" />
                Thanh toán
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              {/* Price breakdown */}
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{course.title}</span>
                  <span className="text-foreground font-medium">
                    {course.price ? formatPrice(course.price) : "—"}
                  </span>
                </div>
                <div className="border-t border-border pt-3 flex justify-between">
                  <span className="font-semibold text-foreground">Tổng cộng</span>
                  <span className="text-2xl font-bold text-gold">
                    {course.price ? formatPrice(course.price) : "—"}
                  </span>
                </div>
              </div>

              {/* Payment methods */}
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
                  Phương thức thanh toán
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <div className="flex items-center gap-2 p-3 rounded-lg border border-gold/30 bg-gold/5">
                    <CreditCard className="h-4 w-4 text-gold" />
                    <span className="text-sm font-medium text-foreground">Thẻ Visa/Master</span>
                  </div>
                  <div className="flex items-center gap-2 p-3 rounded-lg border border-border">
                    <QrCode className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Chuyển khoản QR</span>
                  </div>
                </div>
              </div>

              {/* Pay button */}
              <Button
                onClick={handlePayment}
                disabled={processing}
                className="w-full bg-gold hover:bg-gold/90 text-black font-semibold py-6 text-base gold-glow"
              >
                {processing ? (
                  <>
                    <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin mr-2" />
                    Đang xử lý...
                  </>
                ) : (
                  <>Thanh toán {course.price ? formatPrice(course.price) : ""}</>
                )}
              </Button>

              {/* Trust badges */}
              <div className="flex items-center justify-center gap-4 text-[10px] text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Shield className="h-3 w-3" /> Bảo mật SSL
                </span>
                <span className="flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" /> Hoàn tiền 7 ngày
                </span>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </PageTransition>
  );
}
