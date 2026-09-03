"use client";

// Hai thẻ cạnh nhau trên trang nhà (một lần fetch, trả fragment 2 Card):
// 1. "Chuỗi học của bạn" — ngọn lửa + dải 7 ngày, KHÔNG link đi đâu (của mình, ngắm tại chỗ)
// 2. "Cộng đồng" — hạng tuần + tin mới + CTA mời sang màn Cộng đồng
// Luật hiển thị (biên bản chốt logic): chỉ trạng thái dương, KHÔNG đếm ngược, KHÔNG dọa mất chuỗi.
import { useState, useEffect } from "react";
import Link from "next/link";
import { Flame, Trophy, Users, ArrowRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { getMyPulse, feedText, timeAgoVi, type MyPulse } from "@/lib/api-social";

const DAY_NAMES = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];

interface Props {
  userId: string;
}

export function PulseCard({ userId }: Props) {
  const [pulse, setPulse] = useState<MyPulse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    getMyPulse(userId).then((p) => {
      if (!cancelled) {
        setPulse(p);
        setLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [userId]);

  const streak = pulse?.streak ?? 0;
  const week = pulse?.week;
  const recent = pulse?.recent ?? [];
  const last7 = pulse?.last7 ?? [];

  return (
    <>
      {/* ── Thẻ 1: Chuỗi học của bạn ── */}
      <Card className="border-gold/20 h-full">
        <CardContent className="py-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Flame className="h-5 w-5 text-orange-500" />
              <h3 className="font-semibold text-foreground">Chuỗi học của bạn</h3>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-2xl font-extrabold text-orange-500">{streak}</span>
              <span className="text-xs text-muted-foreground">ngày</span>
            </div>
          </div>

          {loading ? (
            <p className="text-sm text-muted-foreground">Đang tải...</p>
          ) : (
            <>
              {last7.length > 0 && (
                <div className="flex items-center justify-between gap-1">
                  {last7.map((d) => {
                    const date = new Date(`${d.day}T00:00:00`);
                    return (
                      <div key={d.day} className="flex flex-col items-center gap-1.5">
                        <span className="text-[10px] text-muted-foreground">
                          {DAY_NAMES[date.getDay()]}
                        </span>
                        <div
                          className={cn(
                            "w-8 h-8 rounded-lg flex items-center justify-center text-xs font-medium transition-colors",
                            d.active
                              ? "bg-orange-500/20 text-orange-500 border border-orange-500/30"
                              : "bg-muted/30 text-muted-foreground/40"
                          )}
                        >
                          {d.active ? <Flame className="h-3.5 w-3.5" /> : date.getDate()}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
              <p className="text-xs text-muted-foreground">
                {streak > 0
                  ? "Nghỉ một hôm không sao, đừng nghỉ hai hôm liền nhé."
                  : "Hôm nay là ngày đẹp để bắt đầu chuỗi học mới."}
              </p>
            </>
          )}
        </CardContent>
      </Card>

      {/* ── Thẻ 2: Cộng đồng ── */}
      <Card className="border-gold/20 h-full">
        <CardContent className="py-5 space-y-4">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-gold" />
            <h3 className="font-semibold text-foreground">Cộng đồng</h3>
          </div>

          {loading ? (
            <p className="text-sm text-muted-foreground">Đang tải...</p>
          ) : (
            <>
              <div className="flex items-center gap-2">
                <Trophy className="h-4 w-4 text-gold shrink-0" />
                <p className="text-sm text-foreground">
                  {week?.rank ? (
                    <>
                      Bạn đang hạng{" "}
                      <span className="font-bold text-gold">
                        {week.rank}/{week.total}
                      </span>{" "}
                      tuần này · {week.points} điểm
                    </>
                  ) : (
                    "Học một bài là có tên trên bảng tuần này ngay"
                  )}
                </p>
              </div>

              {recent.length > 0 && (
                <div className="space-y-1.5 pt-2 border-t border-border">
                  {recent.slice(0, 2).map((item, i) => (
                    <p key={i} className="text-xs text-muted-foreground line-clamp-1">
                      <span className="font-medium text-foreground">{item.name}</span>{" "}
                      {feedText(item)}
                      {item.journey_day ? ` · ngày thứ ${item.journey_day}` : ""}
                      {" · "}
                      {timeAgoVi(item.created_at)}
                    </p>
                  ))}
                </div>
              )}

              <Link
                href="/student/community"
                className="inline-flex items-center gap-1.5 text-sm font-medium text-gold hover:underline"
              >
                Xem bảng xếp hạng tuần này, biết đâu đang có tên bạn
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </>
          )}
        </CardContent>
      </Card>
    </>
  );
}
