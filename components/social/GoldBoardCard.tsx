"use client";

// Bảng vàng tốt nghiệp tháng này — bức tường vinh danh, KHÔNG xếp hạng, mới nhất trước.
// "Về đích sau N ngày" chỉ hiện khi journey_day khác null (≤ khung 20 ngày, tính trong SQL).
import { GraduationCap } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { timeAgoVi, type GoldBoard } from "@/lib/api-social";

interface Props {
  gold: GoldBoard | null;
}

export function GoldBoardCard({ gold }: Props) {
  const items = gold?.items ?? [];

  return (
    <Card className="border-gold/40 bg-gradient-to-b from-gold/5 to-transparent">
      <CardContent className="py-5 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <GraduationCap className="h-5 w-5 text-gold" />
            <h3 className="font-semibold text-foreground">Bảng vàng tốt nghiệp tháng này</h3>
          </div>
          {items.length > 0 && (
            <span className="text-xs text-gold font-medium">{gold?.total_count} người về đích</span>
          )}
        </div>

        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">
            Tháng này chưa có ai về đích. Cái tên đầu tiên có thể là bạn.
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {items.map((item, i) => (
              <div
                key={i}
                className="flex items-center gap-3 rounded-lg border border-gold/20 bg-card px-3 py-2.5"
              >
                <Avatar className="h-8 w-8 shrink-0">
                  <AvatarImage src={item.avatar_url || undefined} />
                  <AvatarFallback className="text-xs">{item.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{item.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {item.journey_day ? `Về đích sau ${item.journey_day} ngày · ` : ""}
                    {timeAgoVi(item.created_at)}
                  </p>
                </div>
                <GraduationCap className="h-4 w-4 text-gold shrink-0" />
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
