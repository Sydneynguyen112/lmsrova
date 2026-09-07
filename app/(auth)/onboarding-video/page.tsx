"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Map, ClipboardList, ListTodo, CheckCircle2, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { VideoPlayer } from "@/components/shared/VideoPlayer";
import { IntakePromptModal } from "@/components/intake/IntakePromptModal";
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
  }, [currentUser]);

  // Quyết định ai phải ở lại trang này, ai đi tiếp
  useEffect(() => {
    if (!currentUser || !settingLoaded || rewatch) return;
    if (currentUser.role !== "student") {
      // Khu quản trị đã dời sang app riêng
      window.location.href = "https://rova-ops.vercel.app";
      return;
    }
    // Không chặn theo duyệt: xem video + làm onboarding TRƯỚC khi được mở khoá học
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

  // Xem đủ 80% giây THẬT (tua nhanh không tính) mới mở đường sang bài test
  const watchedEnough =
    !!currentUser?.onboarding_video_watched_at ||
    (durationSec > 0 && watchedSec >= durationSec * ONBOARDING_VIDEO_WATCH_RATIO);

  useEffect(() => {
    if (rewatch || !watchedEnough || !currentUser) return;
    if (markedRef.current || currentUser.onboarding_video_watched_at) return;
    markedRef.current = true;
    markOnboardingVideoWatched(currentUser.id);
  }, [watchedEnough, rewatch, currentUser]);

  const handleFlush = (addedSeconds: number, positionSec: number) => {
    if (!currentUser) return;
    flushOnboardingVideoProgress(currentUser.id, addedSeconds, positionSec).then(
      (total) => setWatchedSec(total)
    );
  };

  const percent = durationSec
    ? Math.min(100, Math.round((watchedSec / durationSec) * 100))
    : 0;
  const requiredPercent = Math.round(ONBOARDING_VIDEO_WATCH_RATIO * 100);

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
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Tiến độ xem</span>
                <span className="tabular-nums">
                  {percent}% / {requiredPercent}%
                </span>
              </div>
              <div className="h-2 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full rounded-full gold-gradient transition-[width] duration-500"
                  style={{ width: `${percent}%` }}
                />
              </div>
            </div>
            <Button
              className="w-full"
              size="lg"
              disabled={!watchedEnough}
              onClick={() => router.push("/onboarding")}
            >
              {watchedEnough ? (
                <>
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Tiếp tục — làm bài test đầu vào
                </>
              ) : (
                <>
                  <Lock className="h-4 w-4 mr-2" />
                  Xem đủ {requiredPercent}% video để mở bước tiếp theo
                </>
              )}
            </Button>
            <p className="text-center text-xs text-muted-foreground">
              Tua nhanh không được tính — chỉ giây xem thật mới cộng vào tiến độ.
              Bỏ dở giữa chừng thì lần sau mở lại xem tiếp từ chỗ dừng.
            </p>
          </div>
        )}

        {!rewatch && watchedEnough && (
          <IntakePromptModal onStart={() => router.push("/onboarding")} />
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
