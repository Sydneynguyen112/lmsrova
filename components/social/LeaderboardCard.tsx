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
    <Card className="border-gold/20 h-full">
      <CardContent className="py-5 space-y-3">
        <div>
          <div className="flex items-center gap-2">
            <Icon className="h-5 w-5 text-gold" />
            <h3 className="font-semibold text-foreground">{title}</h3>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>
        </div>

        {top.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">{emptyText}</p>
        ) : (
          <div>
            {top.map((row, i) => (
              <div
                key={i}
                className="flex items-center gap-3 py-2 border-t border-border first:border-t-0"
              >
                <span
                  className={cn(
                    "w-6 text-sm font-bold text-center",
                    i === 0 ? "text-gold" : i < 3 ? "text-amber-500" : "text-muted-foreground"
                  )}
                >
                  {i + 1}
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
        <div className="rounded-lg bg-gold/10 border border-gold/20 px-3 py-2.5 flex items-center gap-3">
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
