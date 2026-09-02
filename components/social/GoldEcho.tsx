"use client";

// Tiếng vọng Bảng vàng ở chặng tốt nghiệp: "tháng này N người đã về đích".
// Ẩn hoàn toàn khi chưa ai tốt nghiệp (không hiện "0 người").
import { useState, useEffect } from "react";
import { Sparkles } from "lucide-react";
import { getGoldBoard, type GoldBoard } from "@/lib/api-social";

export function GoldEcho() {
  const [gold, setGold] = useState<GoldBoard | null>(null);

  useEffect(() => {
    let cancelled = false;
    getGoldBoard().then((g) => {
      if (!cancelled) setGold(g);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  if (!gold || gold.total_count === 0) return null;

  const names = gold.items.slice(0, 3).map((i) => i.name);

  return (
    <div className="rounded-xl border border-gold/30 bg-gold/5 px-4 py-3 flex items-start gap-2.5">
      <Sparkles className="h-4 w-4 text-gold shrink-0 mt-0.5" />
      <p className="text-sm text-foreground">
        Tháng này đã có <span className="font-bold text-gold">{gold.total_count} người về đích</span>
        {names.length > 0 && (
          <span className="text-muted-foreground"> — gần nhất: {names.join(", ")}</span>
        )}
        . Bạn đang đứng trước cánh cửa cuối cùng.
      </p>
    </div>
  );
}
