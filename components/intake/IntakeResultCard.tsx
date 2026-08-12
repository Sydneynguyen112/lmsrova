"use client";

// Thẻ tóm tắt kết quả bài test đầu vào trên Dashboard — bấm vào mở tờ kết quả đầy đủ.
import { useEffect, useState } from "react";
import Link from "next/link";
import { Stethoscope, ChevronRight } from "lucide-react";
import { getIntakeResult } from "@/lib/api-intake";
import type { StudentVisibleResult } from "@/lib/intake-scoring";
import { Card, CardContent } from "@/components/ui/card";
import { CLASSIFICATION_LABELS } from "@/lib/intake-content";

export function IntakeResultCard({ userId }: { userId: string }) {
  const [visible, setVisible] = useState<StudentVisibleResult | null>(null);

  useEffect(() => {
    let cancelled = false;
    getIntakeResult(userId).then((row) => {
      if (!cancelled) setVisible(row?.student_visible ?? null);
    });
    return () => {
      cancelled = true;
    };
  }, [userId]);

  if (!visible) return null;

  return (
    <Link href="/student/intake-result">
      <Card className="border-gold/20 transition-colors hover:border-gold/50">
        <CardContent className="flex items-center gap-4 py-5">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gold/10">
            <Stethoscope className="h-5 w-5 text-gold" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs text-muted-foreground">Kết quả bài test đầu vào</p>
            <p className="font-semibold text-foreground truncate">
              {visible.personality.label}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Trình độ:{" "}
              {CLASSIFICATION_LABELS[visible.classification] || visible.classification}
            </p>
          </div>
          <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground" />
        </CardContent>
      </Card>
    </Link>
  );
}
