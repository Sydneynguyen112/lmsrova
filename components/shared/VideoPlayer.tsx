"use client";

import { useEffect, useRef, useState } from "react";
import { AlertTriangle } from "lucide-react";

const LIBRARY_ID = process.env.NEXT_PUBLIC_BUNNY_LIBRARY_ID || "637951";
const FLUSH_INTERVAL_MS = 30_000; // đẩy giây xem lên DB mỗi 30s
// Quá ngần này giây mà iframe Bunny chưa hé răng (không một message player.js nào)
// thì coi như trình phát bị chặn → hiện bảng hướng dẫn thay cho ô trắng trơn.
// Đo thực tế Bunny lên hình trong ~5s; để 15s cho khách mạng yếu khỏi bị báo nhầm.
const STUCK_AFTER_MS = 15_000;

/** loading = đang tải · ready = trình phát đã sống · stuck = quá lâu chưa thấy gì */
type PlayerStatus = "loading" | "ready" | "stuck";

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

  const [status, setStatus] = useState<PlayerStatus>("loading");
  // Ref song song với state để handleMessage khỏi phải re-render mỗi timeupdate.
  const aliveRef = useRef(false);

  useEffect(() => {
    // Đổi bài → iframe mới, đếm lại từ đầu.
    aliveRef.current = false;
    setStatus("loading");

    /** Bất kỳ message player.js nào cũng chứng minh script trình phát đã chạy. */
    function markAlive() {
      if (aliveRef.current) return;
      aliveRef.current = true;
      setStatus("ready");
    }

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
      // Chỉ nghe iframe của CHÍNH mình. Không có dòng này thì mọi VideoPlayer trên
      // trang cùng ăn chung message của nhau (và bất kỳ ai postMessage cũng lọt).
      if (e.source !== iframeRef.current?.contentWindow) return;
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
        markAlive();
        flush();
        onEndedRef.current?.();
        return;
      }
      if (msg.context !== "player.js") return;
      markAlive();

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
      else {
        subscribe();
        // Thăm dò: player.js trả lời getPaused → biết trình phát còn sống kể cả
        // khi ta lỡ mất event "ready". Player không hỗ trợ thì lờ đi, vô hại.
        post("getPaused");
      }
    }, 1000);
    const bootstrapStop = window.setTimeout(() => clearInterval(bootstrap), 15_000);

    // Im lặng quá lâu = trình phát bị chặn (chặn quảng cáo, lá chắn Brave, DNS
    // lọc, cache hỏng...). Đổi ô trắng thành bảng hướng dẫn tự khắc phục.
    const stuckTimer = window.setTimeout(() => {
      if (!aliveRef.current) setStatus("stuck");
    }, STUCK_AFTER_MS);

    return () => {
      clearInterval(tick);
      clearInterval(flushTimer);
      clearInterval(bootstrap);
      clearTimeout(bootstrapStop);
      clearTimeout(stuckTimer);
      window.removeEventListener("message", handleMessage);
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("pagehide", flush);
      flush(); // flush lần cuối khi unmount / đổi bài
    };
  }, [playbackId]);

  const embedUrl = `https://iframe.mediadelivery.net/embed/${LIBRARY_ID}/${playbackId}?autoplay=false&loop=false&muted=false&preload=true&responsive=true`;

  const stuck = status === "stuck";

  return (
    <div
      className="bg-black"
      style={{
        position: "relative",
        // Bình thường giữ khung 16:9. Khi bí thì bỏ, để bảng hướng dẫn tự giãn cao
        // theo nội dung — khung 16:9 trên điện thoại quá thấp, sẽ cắt mất nút bấm.
        paddingTop: stuck ? undefined : "56.25%",
        borderRadius: "0.75rem",
        overflow: "hidden",
      }}
    >
      <iframe
        ref={iframeRef}
        src={embedUrl}
        // KHÔNG dùng loading="lazy": khung video luôn nằm ngay đầu trang bài học,
        // lazy chẳng tiết kiệm được gì mà chỉ làm trình duyệt hoãn tải trình phát.
        loading="eager"
        style={{
          border: "none",
          position: "absolute",
          top: 0,
          left: 0,
          height: "100%",
          width: "100%",
          // Giấu chứ KHÔNG gỡ khỏi cây DOM: bấm "Đóng" là hiện lại ngay, không tải lại.
          visibility: stuck ? "hidden" : "visible",
        }}
        allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture"
        allowFullScreen
        title={title || "Video Player"}
      />

      {/* Đang tải: che ô trắng của Bunny bằng nền đen + vòng xoay */}
      {status === "loading" && (
        <div
          className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black"
          aria-live="polite"
        >
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-gold border-t-transparent" />
          <p className="text-sm text-white/60">Đang tải video…</p>
        </div>
      )}

      {/* Quá 15s chưa thấy trình phát: hướng dẫn khách tự gỡ. Đây là khối theo dòng
          chảy (không absolute) nên nó quyết định chiều cao khung, không bao giờ bị cắt. */}
      {stuck && (
        <div className="relative bg-neutral-950 px-4 py-3 text-white">
          {/* Cỡ chữ cố định, KHÔNG dùng sm:/md: — breakpoint Tailwind căn theo khung
              nhìn, còn khung video có thể hẹp ngay trên màn hình rộng → tràn nút. */}
          <div className="mx-auto max-w-sm space-y-2">
            <div className="flex items-center gap-1.5">
              <AlertTriangle className="h-4 w-4 shrink-0 text-gold" />
              <p className="text-sm font-semibold">Video vẫn chưa lên hình</p>
            </div>
            <p className="text-xs text-white/70">
              Video trên hệ thống vẫn bình thường. Trình duyệt hoặc mạng của bạn đang chặn
              trình phát. Thử lần lượt:
            </p>
            <ol className="list-decimal space-y-0.5 pl-4 text-xs text-white/80">
              <li>
                Nhấn <span className="font-semibold text-white">Ctrl + Shift + R</span> để
                tải lại, bỏ qua bộ nhớ tạm.
              </li>
              <li>Tắt chặn quảng cáo, hoặc lá chắn Shields của Brave.</li>
              <li>Mở bằng Chrome hoặc Edge.</li>
            </ol>
            <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="rounded-md bg-gold px-2.5 py-1 text-xs font-semibold text-black hover:bg-gold/90"
              >
                Tải lại trang
              </button>
              <a
                href={embedUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-md border border-white/25 px-2.5 py-1 text-xs hover:bg-white/10"
              >
                Mở ở tab mới
              </a>
              <button
                type="button"
                onClick={() => setStatus("ready")}
                className="rounded-md px-2 py-1 text-xs text-white/60 hover:text-white"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
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
