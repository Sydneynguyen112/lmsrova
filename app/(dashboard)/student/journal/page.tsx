"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { NotebookPen, Construction } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useCurrentUser } from "@/lib/auth";
import { LockedFeature } from "@/components/shared/LockedFeature";
import { PageTransition } from "@/components/shared/PageTransition";
import { Card, CardContent } from "@/components/ui/card";

export default function StudentJournalPage() {
  const currentUser = useCurrentUser("student");
  const [hasEnrollment, setHasEnrollment] = useState<boolean | null>(null);

  useEffect(() => {
    if (!currentUser) return;
    async function check() {
      const { data } = await supabase
        .from("enrollments")
        .select("id")
        .eq("user_id", currentUser!.id)
        .limit(1);
      setHasEnrollment((data ?? []).length > 0);
    }
    check();
  }, [currentUser]);

  if (!currentUser || hasEnrollment === null) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-muted-foreground">Đang tải...</div>
      </div>
    );
  }

  if (!hasEnrollment) {
    return (
      <LockedFeature
        title="Nhật ký giao dịch"
        description="Tính năng nhật ký giao dịch sẽ được mở khi bạn đăng ký khoá học."
      />
    );
  }

  return (
    <PageTransition>
      <div className="p-6 space-y-6 max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-2xl font-bold gold-gradient-text">Nhật ký giao dịch</h1>
          <p className="text-muted-foreground mt-1">
            Ghi chép và phân tích các lệnh giao dịch của bạn.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="border-gold/20">
            <CardContent className="py-16 text-center space-y-4">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
                className="w-20 h-20 rounded-full bg-gold/10 border-2 border-gold/30 flex items-center justify-center mx-auto"
              >
                <Construction className="h-8 w-8 text-gold" />
              </motion.div>
              <div>
                <h2 className="text-xl font-bold text-foreground">Coming Soon</h2>
                <p className="text-muted-foreground mt-2 max-w-md mx-auto">
                  Tính năng Nhật ký giao dịch đang được phát triển. Bạn sẽ có thể ghi chép lệnh,
                  phân tích winrate, theo dõi PnL và rút ra bài học từ mỗi giao dịch.
                </p>
              </div>
              <div className="inline-flex items-center gap-2 rounded-full bg-gold/10 px-4 py-2">
                <NotebookPen className="h-4 w-4 text-gold" />
                <span className="text-sm font-medium text-gold">Sắp ra mắt</span>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </PageTransition>
  );
}
