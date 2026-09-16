"use client";

// Màn đầu tiên sau đăng nhập: "Khoá học bạn đã đăng ký" — học viên chọn PRO
// hay MASTER. Chỉ là khai báo; mentor/admin vẫn duyệt (gán enrollment) bên
// rova-ops. Chọn xong → /student (popup chờ duyệt); duyệt rồi OnboardingGate
// mới dẫn PRO qua video + bài test, MASTER vào thẳng.
// ?change=1 — đổi lựa chọn (từ modal chờ duyệt), không tự redirect đi.
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowRight, CheckCircle2, Circle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn, formatPrice } from "@/lib/utils";
import { supabase } from "@/lib/supabase";
import { signOut, useCurrentUserState } from "@/lib/auth";
import { COURSE_CHOICES, saveCourseChoice } from "@/lib/course-choice";

interface CourseRow {
  id: string;
  title: string;
  description: string | null;
  price: number | null;
  price_label: string | null;
}

export default function ChooseCoursePage() {
  const router = useRouter();
  const { user, status } = useCurrentUserState();
  const [changeMode] = useState(
    () =>
      typeof window !== "undefined" &&
      new URLSearchParams(window.location.search).has("change")
  );
  const [courseRows, setCourseRows] = useState<Record<string, CourseRow>>({});
  const [selected, setSelected] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (status === "signed-out") router.replace("/sign-in");
  }, [status, router]);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;

    async function init() {
      if (!user) return;
      if (user.role !== "student") {
        window.location.href = "https://rova-ops.vercel.app";
        return;
      }

      if (user.requested_course_id && !changeMode) {
        router.replace("/student");
        return;
      }

      // Học viên cũ đã được gán khoá nhưng chưa từng khai → lấy luôn khoá đó, khỏi hỏi
      if (!user.requested_course_id) {
        const { data } = await supabase
          .from("enrollments")
          .select("course_id")
          .eq("user_id", user.id)
          .in("status", ["active", "completed"])
          .limit(1);
        if (cancelled) return;
        const existing = data?.[0]?.course_id as string | undefined;
        if (existing) {
          await saveCourseChoice(user.id, existing);
          router.replace("/student");
          return;
        }
      }

      const { data: rows } = await supabase
        .from("courses")
        .select("id, title, description, price, price_label")
        .in("id", COURSE_CHOICES.map((c) => c.courseId));
      if (cancelled) return;
      const map: Record<string, CourseRow> = {};
      for (const r of (rows || []) as CourseRow[]) map[r.id] = r;
      setCourseRows(map);
      setSelected(user.requested_course_id ?? null);
      setReady(true);
    }

    init();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  async function handleContinue() {
    if (!user || !selected || saving) return;
    setSaving(true);
    setError("");
    const { error: saveError } = await saveCourseChoice(user.id, selected);
    if (saveError) {
      console.error("saveCourseChoice error:", saveError);
      setError("Chưa lưu được lựa chọn. Thử lại, vẫn lỗi thì báo ROVA.");
      setSaving(false);
      return;
    }
    router.push("/student");
  }

  async function handleSignOut() {
    await signOut();
    window.location.href = "/sign-in";
  }

  if (!ready) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <Loader2 className="h-8 w-8 animate-spin text-gold" />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="space-y-2 text-center">
        <h1 className="text-2xl font-bold gold-gradient-text">Khoá học bạn đã đăng ký</h1>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Chọn khoá bạn đã đăng ký với ROVA. Đây chỉ là bước khai báo — mentor/admin sẽ
          duyệt và mở khoá cho bạn.
        </p>
      </div>

      <div className="space-y-3">
        {COURSE_CHOICES.map((choice) => {
          const row = courseRows[choice.courseId];
          const active = selected === choice.courseId;
          // Giá: có số thì format tiền, không thì nhãn (vd "Liên hệ")
          const priceText = row?.price ? formatPrice(row.price) : row?.price_label || "Liên hệ";
          return (
            <button
              key={choice.courseId}
              type="button"
              onClick={() => setSelected(choice.courseId)}
              className={cn(
                "w-full text-left rounded-xl border p-4 transition-all",
                active
                  ? "border-gold bg-gold/10"
                  : "border-border hover:border-gold/40 bg-card"
              )}
            >
              <div className="flex items-start gap-3">
                {active ? (
                  <CheckCircle2 className="h-5 w-5 text-gold shrink-0 mt-0.5" />
                ) : (
                  <Circle className="h-5 w-5 text-muted-foreground/40 shrink-0 mt-0.5" />
                )}
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-baseline justify-between gap-3">
                    <h2 className="font-semibold text-foreground">{row?.title || choice.title}</h2>
                    <span className="shrink-0 text-sm font-semibold text-gold">{priceText}</span>
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {row?.description || choice.tagline}
                  </p>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {error && (
        <p className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-700 dark:text-red-300">
          {error}
        </p>
      )}

      <Button
        onClick={handleContinue}
        disabled={!selected || saving}
        className="bg-gold hover:bg-gold/90 text-black font-semibold py-6 rounded-xl text-base w-full"
      >
        {saving ? "Đang lưu..." : "Tiếp tục"}
        {!saving && <ArrowRight className="h-5 w-5 ml-2" />}
      </Button>

      <button
        type="button"
        onClick={handleSignOut}
        className="block w-full text-center text-xs text-muted-foreground hover:text-foreground"
      >
        Không phải tài khoản của bạn? Đăng xuất
      </button>
    </motion.div>
  );
}
