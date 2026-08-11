"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Map, ClipboardList, ListTodo, CheckCircle2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { VideoPlayer } from "@/components/shared/VideoPlayer";
import { useCurrentUser } from "@/lib/auth";
import {
  ONBOARDING_VIDEO_WATCH_RATIO,
  flushOnboardingVideoProgress,
  getOnboardingVideoSetting,
  markOnboardingVideoWatched,
} from "@/lib/api-onboarding-video";

const benefits = [
  {
    icon: Map,
    text: "Nắm lộ trình 10 chặng và biết từng khu vực trong LMS dùng để làm gì",
  },
  {
    icon: ClipboardList,
    text: "Hiểu vì sao cần làm form khảo sát đầu vào — bài test \"khám bệnh\" + mục tiêu cam kết của chính bạn → hệ thống gợi ý lộ trình học phù hợp",
  },
  {
    icon: ListTodo,
    text: "Biết cách dùng todolist hằng ngày để mỗi lần mở LMS là biết ngay hôm nay làm gì",
  },
];

export default function OnboardingVideoPage() {
  const router = useRouter();
  const currentUser = useCurrentUser("student");

  // ?rewatch=1 — chế độ xem lại tự do (từ trang Hồ sơ), không chặn, không redirect
  const [rewatch] = useState(
    () =>
      typeof window !== "undefined" &&
      new URLSearchParams(window.location.search).has("rewatch")
  );

  const [videoId, setVideoId] = useState<string | null>(null);
  const [settingLoaded, setSettingLoaded] = useState(false);

  const [watchedSec, setWatchedSec] = useState(0);
  const [durationSec, setDurationSec] = useState(0);
  const [ended, setEnded] = useState(false);
  const [unlocked, setUnlocked] = useState(false);
  const seededRef = useRef(false); // đã nạp giây xem từ profile chưa
  const markedRef = useRef(false); // đã ghi watched_at chưa (tránh ghi lặp)

  useEffect(() => {
    getOnboardingVideoSetting().then((s) => {
      setVideoId(s.video_id);
      setSettingLoaded(true);
    });
  }, []);

  // Nạp tiến độ đã xem từ profile (1 lần)
  useEffect(() => {
    if (!currentUser || seededRef.current) return;
    seededRef.current = true;
    setWatchedSec(currentUser.onboarding_video_seconds || 0);
    if (currentUser.onboarding_video_watched_at) setUnlocked(true);
  }, [currentUser]);

  // Quyết định ai phải ở lại trang này, ai đi tiếp
  useEffect(() => {
    if (!currentUser || !settingLoaded || rewatch) return;
    if (currentUser.role !== "student") {
      // Khu quản trị đã dời sang app riêng
      window.location.href = "https://rova-ops.vercel.app";
      return;
    }
    // Học viên cũ (đã làm khảo sát trước khi có tính năng) — miễn xem
    if (currentUser.onboarding_survey) {
      router.replace("/student");
      return;
    }
    // Chưa cấu hình video hoặc đã xem xong → vào thẳng form khảo sát
    if (!videoId || currentUser.onboarding_video_watched_at) {
      router.replace("/onboarding");
    }
  }, [currentUser, settingLoaded, videoId, rewatch, router]);

  // Mở khóa khi: video chạy đến hết + tổng giây xem thật đủ 80% thời lượng
  useEffect(() => {
    if (unlocked || rewatch || !ended || !durationSec || !currentUser) return;
    if (watchedSec >= durationSec * ONBOARDING_VIDEO_WATCH_RATIO) {
      setUnlocked(true);
      if (!markedRef.current) {
        markedRef.current = true;
        markOnboardingVideoWatched(currentUser.id);
      }
    }
  }, [ended, watchedSec, durationSec, unlocked, rewatch, currentUser]);

  const handleFlush = (addedSeconds: number, positionSec: number) => {
    if (!currentUser) return;
    flushOnboardingVideoProgress(currentUser.id, addedSeconds, positionSec).then(
      (total) => setWatchedSec(total)
    );
  };

  const percent = durationSec
    ? Math.min(100, Math.round((watchedSec / durationSec) * 100))
    : 0;
  const endedButNotEnough =
    ended && !unlocked && durationSec > 0 && !rewatch;

  if (!currentUser || !settingLoaded || (!videoId && !rewatch)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-2 border-gold border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-10 px-4">
      <motion.div
        className="max-w-3xl mx-auto space-y-6"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold">
            {rewatch ? (
              <>Xem lại video <span className="gold-gradient-text">hướng dẫn bắt đầu</span></>
            ) : (
              <>Trước khi bắt đầu — <span className="gold-gradient-text">video hướng dẫn</span> (dưới 10 phút)</>
            )}
          </h1>
          <p className="text-muted-foreground text-sm">
            Xem hết video này, bạn sẽ đi trọn 20 ngày mà không phải hỏi đường lần nào.
          </p>
        </div>

        <Card className="border-gold/20">
          <CardContent className="py-4 space-y-2.5">
            {benefits.map((b, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gold/10">
                  <b.icon className="h-4 w-4 text-gold" />
                </div>
                <p className="text-sm text-foreground leading-relaxed pt-1">{b.text}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        {videoId ? (
          <VideoPlayer
            playbackId={videoId}
            title="Video hướng dẫn bắt đầu"
            startAt={currentUser.onboarding_video_position || 0}
            onDuration={(d) => setDurationSec(d)}
            onFlush={handleFlush}
            onEnded={() => setEnded(true)}
          />
        ) : (
          <Card className="border-dashed">
            <CardContent className="py-10 text-center text-sm text-muted-foreground">
              Video hướng dẫn chưa được cấu hình.
            </CardContent>
          </Card>
        )}

        {!rewatch && (
          <div className="space-y-3">
            {endedButNotEnough && (
              <div className="flex items-start gap-2 rounded-lg border border-orange-500/30 bg-orange-500/10 px-4 py-3">
                <AlertTriangle className="h-4 w-4 text-orange-500 shrink-0 mt-0.5" />
                <p className="text-sm text-orange-500">
                  Có vẻ bạn đã tua qua khá nhiều đoạn. Hãy xem lại các phần đã bỏ
                  qua — nút Tiếp tục sẽ tự mở khi bạn xem đủ.
                </p>
              </div>
            )}
            <Button
              className="w-full"
              size="lg"
              disabled={!unlocked}
              onClick={() => router.push("/onboarding")}
            >
              {unlocked ? (
                <>
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Tiếp tục — làm khảo sát đầu vào
                </>
              ) : (
                <>Xem hết video để tiếp tục{durationSec > 0 ? ` (đã xem ${percent}%)` : ""}</>
              )}
            </Button>
          </div>
        )}

        {rewatch && (
          <Button variant="outline" className="w-full" onClick={() => router.push("/student/profile")}>
            Quay lại Hồ sơ
          </Button>
        )}
      </motion.div>
    </div>
  );
}
