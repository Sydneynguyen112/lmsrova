"use client";

import { useEffect, useRef } from "react";

const LIBRARY_ID = process.env.NEXT_PUBLIC_BUNNY_LIBRARY_ID || "637951";
const FLUSH_INTERVAL_MS = 30_000; // đẩy giây xem lên DB mỗi 30s

interface VideoPlayerProps {
  playbackId: string; // Bunny Stream Video GUID
  title?: string;
  onEnded?: () => void;
  /** Giây resume — player seek tới đây khi sẵn sàng (xem tiếp từ chỗ dừng) */
  startAt?: number;
  /** Gọi 1 lần khi biết thời lượng thật từ metadata video (backfill lessons.duration_sec) */
  onDuration?: (durationSec: number) => void;
  /**
   * Giây xem THẬT cộng dồn (chỉ đếm khi đang play + tab visible; tua KHÔNG cộng).
   * Gọi mỗi 30s + khi pause / ẩn tab / rời trang / unmount.
   */
  onFlush?: (addedSeconds: number, positionSec: number) => void;
}

// Bunny Stream embed nói chuyện qua giao thức player.js (postMessage JSON string).
export function VideoPlayer({
  playbackId,
  title,
  onEnded,
  startAt,
  onDuration,
  onFlush,
}: VideoPlayerProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const onEndedRef = useRef(onEnded);
  onEndedRef.current = onEnded;
  const onFlushRef = useRef(onFlush);
  onFlushRef.current = onFlush;
  const onDurationRef = useRef(onDuration);
  onDurationRef.current = onDuration;
  const startAtRef = useRef(startAt);
  startAtRef.current = startAt;

  useEffect(() => {
    const state = {
      playing: false,
      position: 0,
      accumulated: 0, // giây xem thật chưa flush
      ready: false,
      durationReported: false,
      resumed: false,
    };

    function post(method: string, value?: unknown) {
      iframeRef.current?.contentWindow?.postMessage(
        JSON.stringify({ context: "player.js", version: "0.0.11", method, value }),
        "*"
      );
    }

    function subscribe() {
      for (const ev of ["play", "pause", "ended", "timeupdate"]) {
        post("addEventListener", ev);
      }
    }

    function resume() {
      const at = startAtRef.current;
      if (!state.resumed && at && at > 3) {
        state.resumed = true;
        post("setCurrentTime", Math.floor(at));
      }
    }

    function flush() {
      const added = state.accumulated;
      state.accumulated = 0;
      if (added > 0) onFlushRef.current?.(added, state.position);
    }

    function handleMessage(e: MessageEvent) {
      if (typeof e.data !== "string") return;
      let msg: { context?: string; event?: string; value?: unknown };
      try {
        msg = JSON.parse(e.data);
      } catch {
        return; // không phải JSON — bỏ qua
      }
      if (!msg || typeof msg !== "object") return;

      // Format event cũ của Bunny (giữ tương thích ngược)
      if (msg.event === "videoEnded") {
        flush();
        onEndedRef.current?.();
        return;
      }
      if (msg.context !== "player.js") return;

      switch (msg.event) {
        case "ready":
          if (!state.ready) {
            state.ready = true;
            subscribe();
            resume();
          }
          break;
        case "play":
          state.playing = true;
          // Lỡ event "ready" (iframe load trước khi listener gắn) → resume ở lần play
          // đầu tiên, chỉ khi người xem chưa tự tua đi đâu.
          if (!state.resumed && state.position < 3) resume();
          state.resumed = true;
          break;
        case "pause":
          state.playing = false;
          flush();
          break;
        case "ended":
          state.playing = false;
          flush();
          onEndedRef.current?.();
          break;
        case "timeupdate": {
          const v = msg.value as { seconds?: number; duration?: number } | undefined;
          if (typeof v?.seconds === "number") state.position = v.seconds;
          if (!state.durationReported && typeof v?.duration === "number" && v.duration > 0) {
            state.durationReported = true;
            onDurationRef.current?.(v.duration);
          }
          break;
        }
      }
    }

    // Đếm giây THẬT: mỗi giây trôi qua khi đang play + tab visible. Seek không đụng
    // vào bộ đếm này nên tua nhanh không cộng giây.
    const tick = window.setInterval(() => {
      if (state.playing && document.visibilityState === "visible") state.accumulated += 1;
    }, 1000);
    const flushTimer = window.setInterval(flush, FLUSH_INTERVAL_MS);

    function handleVisibility() {
      if (document.visibilityState === "hidden") flush();
    }

    window.addEventListener("message", handleMessage);
    document.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("pagehide", flush);

    // Bunny gửi "ready" khi player load; phòng trường hợp lỡ event, chủ động
    // đăng ký listener vài lần trong 15s đầu (addEventListener gọi lại vô hại).
    const bootstrap = window.setInterval(() => {
      if (state.ready) clearInterval(bootstrap);
      else subscribe();
    }, 1000);
    const bootstrapStop = window.setTimeout(() => clearInterval(bootstrap), 15_000);

    return () => {
      clearInterval(tick);
      clearInterval(flushTimer);
      clearInterval(bootstrap);
      clearTimeout(bootstrapStop);
      window.removeEventListener("message", handleMessage);
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("pagehide", flush);
      flush(); // flush lần cuối khi unmount / đổi bài
    };
  }, [playbackId]);

  const embedUrl = `https://iframe.mediadelivery.net/embed/${LIBRARY_ID}/${playbackId}?autoplay=false&loop=false&muted=false&preload=true&responsive=true`;

  return (
    <div
      style={{ position: "relative", paddingTop: "56.25%", borderRadius: "0.75rem", overflow: "hidden" }}
    >
      <iframe
        ref={iframeRef}
        src={embedUrl}
        loading="lazy"
        style={{
          border: "none",
          position: "absolute",
          top: 0,
          left: 0,
          height: "100%",
          width: "100%",
        }}
        allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture"
        allowFullScreen
        title={title || "Video Player"}
      />
    </div>
  );
}

export function VideoPlaceholder({ title }: { title?: string }) {
  return (
    <div
      className="w-full bg-muted rounded-xl flex flex-col items-center justify-center text-muted-foreground"
      style={{ aspectRatio: "16/9" }}
    >
      <svg className="h-12 w-12 mb-2 opacity-40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <polygon points="5 3 19 12 5 21 5 3" />
      </svg>
      <p className="text-sm">{title || "Video sẽ sớm được cập nhật"}</p>
    </div>
  );
}
