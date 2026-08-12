"use client";

// Xem lại tờ kết quả bài test đầu vào — dùng chung màn kết quả với lúc vừa làm xong.
import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useCurrentUser } from "@/lib/auth";
import { getIntakeResult } from "@/lib/api-intake";
import type { StudentVisibleResult } from "@/lib/intake-scoring";
import { PageTransition } from "@/components/shared/PageTransition";
import { EmptyState } from "@/components/shared/EmptyState";
import { IntakeResultScreen } from "@/components/intake/IntakeResultScreen";
import { Button } from "@/components/ui/button";

export default function IntakeResultPage() {
  const currentUser = useCurrentUser("student");
  const [visible, setVisible] = useState<StudentVisibleResult | null>(null);
  const [computedAt, setComputedAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser) return;
    let cancelled = false;
    getIntakeResult(currentUser.id).then((row) => {
      if (cancelled) return;
      setVisible(row?.student_visible ?? null);
      setComputedAt(row?.computed_at ?? null);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [currentUser]);

  if (!currentUser || loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-muted-foreground">Đang tải...</div>
      </div>
    );
  }

  return (
    <PageTransition>
      <div className="max-w-2xl mx-auto space-y-5 p-6">
        <Link href="/student">
          <Button variant="ghost" size="sm" className="-ml-2">
            <ArrowLeft className="h-4 w-4 mr-1.5" />
            Về Dashboard
          </Button>
        </Link>

        {visible ? (
          <>
            <IntakeResultScreen visible={visible} />
            {computedAt && (
              <p className="text-center text-xs text-muted-foreground">
                Làm ngày {new Date(computedAt).toLocaleDateString("vi-VN")}
              </p>
            )}
          </>
        ) : (
          <EmptyState
            title="Chưa có kết quả"
            description="Bạn chưa làm bài test đầu vào, hoặc kết quả được nhập tay từ đợt cũ nên không có bản chi tiết."
          />
        )}
      </div>
    </PageTransition>
  );
}
