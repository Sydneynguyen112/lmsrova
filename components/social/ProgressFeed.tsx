"use client";

// "Đoàn người cùng đi" — dòng tin máy viết 100%, chỉ tin vui.
// Không nút đăng bài, không like, không comment (biên bản chốt logic).
import { Flag, GraduationCap, Award, Megaphone, type LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { TIER_LABELS } from "@/lib/social-config";
import { feedText, timeAgoVi, type FeedItem, type FeedEventType } from "@/lib/api-social";

const EVENT_ICONS: Record<FeedEventType, { icon: LucideIcon; className: string }> = {
  stage_completed: { icon: Flag, className: "text-emerald-500" },
  graduated: { icon: GraduationCap, className: "text-gold" },
  badge_earned: { icon: Award, className: "text-amber-500" },
};

interface Props {
  items: FeedItem[];
}

export function ProgressFeed({ items }: Props) {
  return (
    <Card className="border-gold/20">
      <CardContent className="py-5 space-y-1">
        <div className="flex items-center gap-2 pb-3">
          <Megaphone className="h-5 w-5 text-gold" />
          <h3 className="font-semibold text-foreground">Đoàn người cùng đi</h3>
        </div>

        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">
            Đoàn của bạn đang khởi động, tin tiến bộ sẽ xuất hiện ở đây.
          </p>
        ) : (
          items.map((item, i) => {
            const { icon: Icon, className } = EVENT_ICONS[item.event_type];
            return (
              <div
                key={i}
                className="flex items-start gap-3 py-2.5 border-t border-border first:border-t-0"
              >
                <Avatar className="h-8 w-8 shrink-0">
                  <AvatarImage src={item.avatar_url || undefined} />
                  <AvatarFallback className="text-xs">{item.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-foreground">
                    <span className="font-medium">{item.name}</span>
                    {item.tier !== "pro" && (
                      <Badge
                        variant="outline"
                        className="ml-1.5 border-gold/40 text-gold text-[10px] px-1.5 py-0 align-middle"
                      >
                        {TIER_LABELS[item.tier]}
                      </Badge>
                    )}{" "}
                    {feedText(item)}
                    {item.journey_day ? (
                      <span className="text-gold font-medium"> · ngày thứ {item.journey_day}</span>
                    ) : null}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">{timeAgoVi(item.created_at)}</p>
                </div>
                <Icon className={`h-4 w-4 shrink-0 mt-1 ${className}`} />
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}
