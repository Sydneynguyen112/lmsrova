"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Compass,
  PlayCircle,
  ClipboardCheck,
  Upload,
  Hourglass,
  GraduationCap,
  ArrowRight,
  Zap,
  Footprints,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import type { Profile } from "@/lib/auth";
import { loadStudentUnlockData } from "@/lib/api-student";
import {
  buildDailyTodo,
  saveLearningPace,
  suggestPace,
  PACE_INFO,
  type DailyTodoResult,
  type LearningPace,
  type TodoItem,
} from "@/lib/daily-todo";

const KIND_ICON: Record<TodoItem["kind"], typeof PlayCircle> = {
  watch: PlayCircle,
  quiz: ClipboardCheck,
  assignment: Upload,
  waiting: Hourglass,
  graduation: GraduationCap,
};

export function DailyTodoCard({ user, courseId }: { user: Profile; courseId: string }) {
  const [pace, setPace] = useState<LearningPace | null>(
    (user.learning_pace as LearningPace | null) || null
  );
  const [todo, setTodo] = useState<DailyTodoResult | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!pace) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    loadStudentUnlockData(user.id, courseId).then((data) => {
      if (!cancelled) {
        setTodo(buildDailyTodo(data, courseId, pace));
        setLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [user.id, courseId, pace]);

  const choosePace = (p: LearningPace) => {
    setPace(p);
    // Lưu nền — lỗi (vd chưa chạy SQL) không chặn dùng thử trong phiên này
    saveLearningPace(user.id, p).catch(() => {});
  };

  // ── Màn chọn nhịp (lần đầu) ──
  if (!pace) {
    const suggested = suggestPace(user.classification);
    return (
      <Card className="border-gold/30">
        <CardContent className="py-5 space-y-4">
          <div className="flex items-center gap-2">
            <Compass className="h-5 w-5 text-gold" />
            <h3 className="font-semibold">Chọn nhịp học của bạn</h3>
          </div>
          <p className="text-sm text-muted-foreground">
            Bạn cầm lái — hệ thống sẽ gợi ý việc mỗi ngày theo nhịp bạn chọn.
            Đổi lại lúc nào cũng được.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {(Object.keys(PACE_INFO) as LearningPace[]).map((p) => {
              const Icon = p === "fast" ? Zap : Footprints;
              return (
                <button
                  key={p}
                  onClick={() => choosePace(p)}
                  className={cn(
                    "rounded-lg border p-4 text-left transition-colors hover:border-gold/60",
                    p === suggested ? "border-gold/50 bg-gold/5" : "border-border"
                  )}
                >
                  <div className="flex items-center gap-2 font-semibold text-sm">
                    <Icon className="h-4 w-4 text-gold" />
                    {PACE_INFO[p].label}
                    {p === suggested && (
                      <span className="text-[10px] font-medium text-gold bg-gold/10 rounded-full px-2 py-0.5">
                        Gợi ý cho bạn
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1.5">{PACE_INFO[p].desc}</p>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (loading || !todo) {
    return (
      <Card className="border-gold/30">
        <CardContent className="py-8 flex justify-center">
          <div className="w-6 h-6 border-2 border-gold border-t-transparent rounded-full animate-spin" />
        </CardContent>
      </Card>
    );
  }

  const [primary, ...rest] = todo.items;
  const otherPace: LearningPace = pace === "fast" ? "steady" : "fast";

  return (
    <Card className="border-gold/30">
      <CardContent className="py-5 space-y-4">
        {/* Chặng hiện tại + thanh tiến độ */}
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <Compass className="h-5 w-5 text-gold shrink-0" />
              <h3 className="font-semibold truncate">
                {todo.stageTitle
                  ? `Chặng ${todo.stageDone + 1}/${todo.stageTotal} — ${todo.stageTitle}`
                  : "Bạn đã hoàn thành lộ trình 🎉"}
              </h3>
            </div>
            <span className="text-xs text-muted-foreground shrink-0">
              {todo.stageDone}/{todo.stageTotal} chặng
            </span>
          </div>
          <Progress value={(todo.stageDone / Math.max(1, todo.stageTotal)) * 100} />
        </div>

        {/* MỘT việc kế tiếp */}
        {primary ? (
          <Link href={primary.href} className="block">
            <Button className="w-full justify-between h-auto py-3" size="lg">
              <span className="flex items-center gap-2 min-w-0">
                {(() => {
                  const Icon = KIND_ICON[primary.kind];
                  return <Icon className="h-5 w-5 shrink-0" />;
                })()}
                <span className="text-left min-w-0">
                  <span className="block font-semibold truncate">{primary.title}</span>
                  <span className="block text-xs font-normal opacity-80">{primary.detail}</span>
                </span>
              </span>
              <ArrowRight className="h-4 w-4 shrink-0" />
            </Button>
          </Link>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-2">
            {todo.stageTitle
              ? "Hôm nay không còn việc nào chờ bạn — quay lại vào ngày mai nhé!"
              : "Chúc mừng bạn đã đi hết 10 chặng!"}
          </p>
        )}

        {/* Các việc tiếp theo trong ngày */}
        {rest.length > 0 && (
          <div className="space-y-1.5">
            {rest.map((item, i) => {
              const Icon = KIND_ICON[item.kind];
              return (
                <Link
                  key={i}
                  href={item.href}
                  className="flex items-center gap-2.5 rounded-lg border border-border px-3 py-2 hover:border-gold/40 transition-colors"
                >
                  <Icon className="h-4 w-4 text-gold shrink-0" />
                  <span className="text-sm truncate">{item.title}</span>
                  <span className="text-xs text-muted-foreground ml-auto shrink-0">
                    {item.detail}
                  </span>
                </Link>
              );
            })}
          </div>
        )}

        {/* Nhịp học */}
        <p className="text-xs text-muted-foreground">
          Nhịp: <span className="text-gold font-medium">{PACE_INFO[pace].label}</span>
          {" · "}
          <button className="underline hover:text-foreground" onClick={() => choosePace(otherPace)}>
            đổi sang {PACE_INFO[otherPace].label}
          </button>
        </p>
      </CardContent>
    </Card>
  );
}
