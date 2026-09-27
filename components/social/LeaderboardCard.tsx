"use client";

// Bảng xếp hạng dùng chung (Chăm chỉ / Bền bỉ): top 10 + dòng hạng của MÌNH.
// Luật chiều nâng: không xem danh sách đầy đủ, không hiện đáy bảng.
import type { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { TIER_LABELS } from "@/lib/social-config";
import type { Leaderboard } from "@/lib/api-social";

// Thứ tự vẽ bục (index trong top): hạng 2 — hạng 1 — hạng 3
const PODIUM_ORDER = [1, 0, 2];

const PODIUM_STYLES = [
  {
    avatar: "h-14 w-14 ring-gold",
    block: "h-24 bg-gold/20 border-gold/50",
    rank: "text-gold",
  },
  {
    avatar: "h-11 w-11 ring-amber-500/60",
    block: "h-16 bg-amber-500/10 border-amber-500/30",
    rank: "text-amber-500",
  },
  {
    avatar: "h-11 w-11 ring-amber-500/40",
    block: "h-11 bg-amber-500/5 border-amber-500/20",
    rank: "text-amber-500",
  },
];

interface Props {
  title: string;
  subtitle: string;
  icon: LucideIcon;
  unit: string; // "điểm" | "ngày"
  board: Leaderboard | null;
  emptyText: string;
}

export function LeaderboardCard({ title, subtitle, icon: Icon, unit, board, emptyText }: Props) {
  const top = board?.top ?? [];
  const me = board?.me;
  const myValue = me?.points ?? me?.days ?? 0;

  return (
    <Card className="border-gold/20 h-full flex flex-col">
      <CardContent className="py-5 flex flex-1 flex-col gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Icon className="h-5 w-5 text-gold" />
            <h3 className="font-semibold text-foreground">{title}</h3>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>
        </div>

        {top.length === 0 ? (
          <p className="flex-1 flex items-center justify-center text-sm text-muted-foreground py-4 text-center">
            {emptyText}
          </p>
        ) : (
          <div className="flex-1">
            {/* Bục 1-2-3 kiểu Kahoot: hạng 2 bên trái, hạng 1 ở giữa, hạng 3 bên phải */}
            <div className="grid grid-cols-3 items-end gap-2 pt-2 pb-3">
              {PODIUM_ORDER.map((rank) => {
                const row = top[rank];
                if (!row) return <div key={rank} />;
                const style = PODIUM_STYLES[rank];
                return (
                  <div key={rank} className="flex flex-col items-center min-w-0">
                    <Avatar className={cn("shrink-0 ring-2", style.avatar)}>
                      <AvatarImage src={row.avatar_url || undefined} />
                      <AvatarFallback className="text-sm">{row.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <p className="mt-1.5 w-full text-center text-sm font-medium text-foreground truncate">
                      {row.name}
                    </p>
                    {row.tier !== "pro" && (
                      <Badge
                        variant="outline"
                        className="border-gold/40 text-gold text-[10px] px-1.5 py-0"
                      >
                        {TIER_LABELS[row.tier]}
                      </Badge>
                    )}
                    <p className="text-xs font-semibold text-gold">
                      {row.points ?? row.days} {unit}
                    </p>
                    <div
                      className={cn(
                        "mt-1.5 w-full rounded-t-lg border border-b-0 flex items-start justify-center pt-1.5",
                        style.block
                      )}
                    >
                      <span className={cn("text-2xl font-bold", style.rank)}>{rank + 1}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {top.slice(3).map((row, i) => (
              <div
                key={i}
                className="flex items-center gap-3 py-2 border-t border-border"
              >
                <span className="w-6 text-sm font-bold text-center text-muted-foreground">
                  {i + 4}
                </span>
                <Avatar className="h-7 w-7 shrink-0">
                  <AvatarImage src={row.avatar_url || undefined} />
                  <AvatarFallback className="text-xs">{row.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <span className="flex-1 min-w-0 text-sm text-foreground truncate">
                  {row.name}
                  {row.tier !== "pro" && (
                    <Badge
                      variant="outline"
                      className="ml-1.5 border-gold/40 text-gold text-[10px] px-1.5 py-0 align-middle"
                    >
                      {TIER_LABELS[row.tier]}
                    </Badge>
                  )}
                </span>
                <span className="text-sm font-semibold text-foreground shrink-0">
                  {row.points ?? row.days} {unit}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Hàng của mình — luôn hiện, dù đứng thứ mấy */}
        <div className="mt-auto rounded-lg bg-gold/10 border border-gold/20 px-3 py-2.5 flex items-center gap-3">
          <span className="text-sm font-bold text-gold">{me?.rank ?? "—"}</span>
          <span className="flex-1 text-sm text-foreground">
            {me?.rank
              ? `Bạn đang hạng ${me.rank} trong ${me.total} người`
              : "Bạn chưa có mặt trên bảng này, bắt đầu hôm nay nhé"}
          </span>
          <span className="text-sm font-semibold text-gold shrink-0">
            {myValue} {unit}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
