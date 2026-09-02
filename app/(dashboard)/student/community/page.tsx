"use client";

// Màn "Cộng đồng" — mọi thứ về ĐOÀN: dòng tin → 2 bảng đua → Bảng vàng.
// Thứ tự dọc có chủ đích (biên bản chốt logic 02-09-2026).
// Scope "Lớp của tôi" CHƯA render — bật khi MASTER lên LMS (RPC đã nhận p_course sẵn).
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Users, Zap, Flame } from "lucide-react";
import { useCurrentUser } from "@/lib/auth";
import {
  getFeed,
  getLeaderboardEffort,
  getLeaderboardStreak,
  getGoldBoard,
  type FeedItem,
  type Leaderboard,
  type GoldBoard,
} from "@/lib/api-social";
import { PageTransition } from "@/components/shared/PageTransition";
import { ProgressFeed } from "@/components/social/ProgressFeed";
import { LeaderboardCard } from "@/components/social/LeaderboardCard";
import { GoldBoardCard } from "@/components/social/GoldBoardCard";

export default function CommunityPage() {
  const currentUser = useCurrentUser("student");
  const [feed, setFeed] = useState<FeedItem[]>([]);
  const [effortBoard, setEffortBoard] = useState<Leaderboard | null>(null);
  const [streakBoard, setStreakBoard] = useState<Leaderboard | null>(null);
  const [gold, setGold] = useState<GoldBoard | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser) return;
    let cancelled = false;

    async function load() {
      const userId = currentUser!.id;
      const [f, e, s, g] = await Promise.all([
        getFeed(20),
        getLeaderboardEffort(userId),
        getLeaderboardStreak(userId),
        getGoldBoard(),
      ]);
      if (cancelled) return;
      setFeed(f);
      setEffortBoard(e);
      setStreakBoard(s);
      setGold(g);
      setLoading(false);
    }

    load();
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
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Users className="h-6 w-6 text-gold" />
            <span className="gold-gradient-text">Cộng đồng</span>
          </h1>
          <p className="text-muted-foreground mt-1">
            Những người đang đi cùng bạn trên hành trình này.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
        >
          <ProgressFeed items={feed} />
        </motion.div>

        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 gap-4"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <LeaderboardCard
            title="Chăm chỉ tuần này"
            subtitle="Điểm học tập trong tuần, làm mới 0h thứ Hai"
            icon={Zap}
            unit="điểm"
            board={effortBoard}
            emptyText="Tuần mới vừa bắt đầu, bảng đang chờ những cái tên đầu tiên."
          />
          <LeaderboardCard
            title="Bền bỉ"
            subtitle="Chuỗi ngày học đều đang giữ, nghỉ một hôm không sao"
            icon={Flame}
            unit="ngày"
            board={streakBoard}
            emptyText="Chưa ai giữ chuỗi. Học hôm nay là bạn dẫn đầu ngay."
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <GoldBoardCard gold={gold} />
        </motion.div>
      </div>
    </PageTransition>
  );
}
