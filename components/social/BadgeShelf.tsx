"use client";

// Tủ huy hiệu — đã có hiện màu, chưa có hiện bóng mờ kèm tên (luôn thấy đích kế tiếp).
// compact: 1 hàng cuộn ngang cho trang nhà; bản đầy đủ dạng lưới cho hồ sơ.
import { useState, useEffect } from "react";
import { Flag, GraduationCap, Medal, Trophy, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { getMyBadges, type MyBadge } from "@/lib/api-social";

const KIND_ICONS: Record<MyBadge["kind"], LucideIcon> = {
  stage: Flag,
  graduation: GraduationCap,
  tier: Medal,
  weekly: Trophy,
};

interface Props {
  userId: string;
  compact?: boolean;
}

export function BadgeShelf({ userId, compact = false }: Props) {
  const [badges, setBadges] = useState<MyBadge[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    getMyBadges(userId).then((b) => {
      if (!cancelled) {
        setBadges(b);
        setLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [userId]);

  if (loading) {
    return <p className="text-sm text-muted-foreground">Đang tải tủ huy hiệu...</p>;
  }
  if (badges.length === 0) return null;

  const earnedCount = badges.filter((b) => b.earned).length;

  return (
    <Card className="border-gold/20">
      <CardContent className="py-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Medal className="h-5 w-5 text-gold" />
            <h3 className="font-semibold text-foreground">Tủ huy hiệu</h3>
          </div>
          <span className="text-xs text-muted-foreground">
            {earnedCount}/{badges.length} huy hiệu
          </span>
        </div>
        <div
          className={cn(
            compact
              ? "flex gap-4 overflow-x-auto pb-1"
              : "grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4"
          )}
        >
          {badges.map((badge) => {
            const Icon = KIND_ICONS[badge.kind];
            return (
              <div
                key={badge.id}
                className={cn(
                  "flex flex-col items-center text-center gap-1.5",
                  compact && "shrink-0 w-20",
                  !badge.earned && "opacity-40"
                )}
              >
                <div
                  className={cn(
                    "w-11 h-11 rounded-full flex items-center justify-center",
                    badge.earned
                      ? "bg-gold/15 border border-gold/40 text-gold"
                      : "bg-muted/30 border border-dashed border-border text-muted-foreground"
                  )}
                >
                  <Icon className="h-5 w-5" />
                </div>
                <p className="text-[11px] leading-tight text-foreground line-clamp-2">
                  {badge.title}
                  {badge.earned && badge.times > 1 ? ` ×${badge.times}` : ""}
                </p>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
