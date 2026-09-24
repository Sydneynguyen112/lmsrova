"use client";

import { useEffect, useRef, useState } from "react";
import { AlertTriangle } from "lucide-react";

const LIBRARY_ID = process.env.NEXT_PUBLIC_BUNNY_LIBRARY_ID || "637951";
const FLUSH_INTERVAL_MS = 30_000; // đẩy giây xem lên DB mỗi 30s
// Quá ngần này giây mà iframe Bunny chưa hé răng (không một message player.js nào)
// thì coi như trình phát bị chặn → hiện bảng hướng dẫn thay cho ô trắng trơn.
// Đo thực tế Bunny lên hình trong ~5s; để 15s cho khách mạng yếu khỏi bị báo nhầm.
const STUCK_AFTER_MS = 15_000;
// Trình phát dự phòng: file MP4 Bunny sinh sẵn cho mọi video (hasMP4Fallback), phát bằng thẻ
// <video> của trình duyệt — không cần script player của Bunny nên chặn quảng cáo / Cốc Cốc /
// cache hỏng không làm chết được. CDN chặn theo referrer nên link lấy ra ngoài trang bị 403.
const CDN_HOSTNAME = process.env.NEXT_PUBLIC_BUNNY_CDN_HOSTNAME || "vz-bf774635-eca.b-cdn.net";
const FALLBACK_RESOLUTIONS = ["720p", "480p", "360p"];

/**
 * loading = đang tải · ready = trình phát Bunny đã sống ·
 * fallback = Bunny im lặng quá lâu → đã tự đổi sang phát MP4 trực tiếp ·
 * stuck = cả MP4 cũng không phát được → hiện bảng hướng dẫn
 */
type PlayerStatus = "loading" | "ready" | "fallback" | "stuck";

/** Cầu nối để thẻ <video> dự phòng đổ sự kiện vào cùng bộ đếm giây xem với Bunny. */
interface Tracker {
  play: () => void;
  pause: () => void;
  ended: () => void;
  time: (seconds: number, duration: number) => void;
}

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
  // Đang phát dự phòng thì bỏ qua Bunny nếu nó tỉnh muộn (không giật về iframe giữa chừng).
  const fallbackRef = useRef(false);
  const trackerRef = useRef<Tracker | null>(null);
  const [fallbackIndex, setFallbackIndex] = useState(0);

  // Khung nhúng có tải xong không (sự kiện load của iframe). Tách biệt hẳn với
  // chuyện trình phát có chạy không — hai thứ này hỏng vì hai lý do khác nhau.
  const [frameLoaded, setFrameLoaded] = useState(false);
  // Tự thử với tới máy chủ file của Bunny, để bảng báo SỰ THẬT ĐO ĐƯỢC thay vì đoán.
  const [reach, setReach] = useState<"chua-thu" | "dang-thu" | "toi-duoc" | "bi-chan">("chua-thu");
  // Cờ "đã bắn phép thử" — dùng ref chứ không dùng state để không kéo effect chạy lại.
  const probeStartedRef = useRef(false);

  useEffect(() => {
    // Đổi bài → iframe mới, đếm lại từ đầu.
    aliveRef.current = false;
    fallbackRef.current = false;
    setStatus("loading");
    setFallbackIndex(0);

    /** Bất kỳ message player.js nào cũng chứng minh script trình phát đã chạy. */
    function markAlive() {
      if (aliveRef.current || fallbackRef.current) return;
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

    trackerRef.current = {
      play() {
        state.playing = true;
      },
      pause() {
        state.playing = false;
        flush();
      },
      ended() {
        state.playing = false;
        flush();
        onEndedRef.current?.();
      },
      time(seconds, duration) {
        state.position = seconds;
        if (!state.durationReported && duration > 0 && Number.isFinite(duration)) {
          state.durationReported = true;
          onDurationRef.current?.(duration);
        }
      },
    };

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
    // Trước đây: hiện bảng hướng dẫn bắt học viên tự gỡ. Giờ tự đổi sang MP4 trực tiếp, học viên
    // chỉ thấy video lên hình; bảng hướng dẫn chỉ còn khi MP4 cũng hỏng.
    const stuckTimer = window.setTimeout(() => {
      if (!aliveRef.current) {
        fallbackRef.current = true;
        setStatus("fallback");
      }
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
  const fallback = status === "fallback";
  const fallbackSrc = `https://${CDN_HOSTNAME}/${playbackId}/play_${FALLBACK_RESOLUTIONS[fallbackIndex]}.mp4`;

  // Khi bí, tự thử tải MỘT file tĩnh của Bunny. Không JavaScript, không trình
  // phát, không iframe — chỉ đo xem mạng của người xem có với tới Bunny không.
  // KHÔNG đưa `reach` vào phụ thuộc: setReach("dang-thu") sẽ làm effect chạy lại
  // và cleanup huỷ luôn cái fetch vừa bắn — kết quả kẹt "đang thử" mãi.
  useEffect(() => {
    if (!stuck || probeStartedRef.current) return;
    probeStartedRef.current = true;
    setReach("dang-thu");
    let huy = false;
    const bo = new AbortController();
    const hetGio = window.setTimeout(() => bo.abort(), 8000);
    fetch("https://assets.mediadelivery.net/plyr/3.7.8.4-bn/plyr.css", {
      cache: "no-store",
      signal: bo.signal,
    })
      .then((r) => !huy && setReach(r.ok ? "toi-duoc" : "bi-chan"))
      .catch(() => !huy && setReach("bi-chan"))
      .finally(() => clearTimeout(hetGio));
    return () => {
      huy = true;
      bo.abort();
      clearTimeout(hetGio);
    };
  }, [stuck]);

  // Đổi bài thì đo lại từ đầu.
  useEffect(() => {
    setFrameLoaded(false);
    setReach("chua-thu");
    probeStartedRef.current = false;
  }, [playbackId]);

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
      {/* Dự phòng: gỡ hẳn iframe Bunny (khỏi phát chồng nếu nó tỉnh muộn), phát MP4 bằng <video>. */}
      {fallback && (
        <video
          key={fallbackSrc}
          src={fallbackSrc}
          controls
          playsInline
          preload="metadata"
          controlsList="nodownload"
          onContextMenu={(e) => e.preventDefault()}
          onLoadedMetadata={(e) => {
            const v = e.currentTarget;
            trackerRef.current?.time(v.currentTime, v.duration);
            const at = startAtRef.current;
            if (at && at > 3 && v.currentTime < 3) v.currentTime = Math.floor(at);
          }}
          onPlay={() => trackerRef.current?.play()}
          onPause={() => trackerRef.current?.pause()}
          onEnded={() => trackerRef.current?.ended()}
          onTimeUpdate={(e) => trackerRef.current?.time(e.currentTarget.currentTime, e.currentTarget.duration)}
          onError={() => {
            // Độ phân giải này hỏng → thử bản thấp hơn; hết bản thì mới báo học viên.
            if (fallbackIndex < FALLBACK_RESOLUTIONS.length - 1) setFallbackIndex(fallbackIndex + 1);
            else setStatus("stuck");
          }}
          style={{ position: "absolute", top: 0, left: 0, height: "100%", width: "100%", background: "black" }}
          title={title || "Video Player"}
        />
      )}

      {!fallback && (
      <iframe
        ref={iframeRef}
        src={embedUrl}
        // KHÔNG dùng loading="lazy": khung video luôn nằm ngay đầu trang bài học,
        // lazy chẳng tiết kiệm được gì mà chỉ làm trình duyệt hoãn tải trình phát.
        loading="eager"
        onLoad={() => setFrameLoaded(true)}
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
      )}

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
            {reach === "bi-chan" ? (
              <>
                <p className="text-xs text-white/70">
                  Video trên hệ thống vẫn bình thường, nhưng máy bạn không tải được file
                  của trình phát. Thường là do chặn quảng cáo, phần mềm diệt virus, hoặc
                  mạng. Thử lần lượt:
                </p>
                <ol className="list-decimal space-y-0.5 pl-4 text-xs text-white/80">
                  <li>
                    Nhấn <span className="font-semibold text-white">Ctrl + Shift + R</span> để
                    tải lại, bỏ qua bộ nhớ tạm.
                  </li>
                  <li>Tắt tiện ích chặn quảng cáo, tắt VPN, tắt lọc web của phần mềm diệt virus.</li>
                  <li>Đổi DNS máy sang 8.8.8.8, hoặc thử mạng khác (4G điện thoại).</li>
                </ol>
              </>
            ) : (
              <>
                <p className="text-xs text-white/70">
                  {reach === "toi-duoc"
                    ? "Mạng của bạn vẫn tới được máy chủ video bình thường, nên đây không phải lỗi mạng. Trình phát khởi động không xong. Thử:"
                    : "Trình phát khởi động không xong. Thử:"}
                </p>
                <ol className="list-decimal space-y-0.5 pl-4 text-xs text-white/80">
                  <li>Bấm “Tải lại trang”.</li>
                  <li>Bấm “Mở ở tab mới” để xem video ngay, không cần chờ.</li>
                  <li>Nếu vẫn không được, chụp màn hình cả khung này gửi ROVA.</li>
                </ol>
              </>
            )}

            {/* Dòng dữ kiện: để ảnh chụp màn hình của học viên tự nói lên nguyên nhân,
                khỏi phải hỏi qua hỏi lại. */}
            <p className="text-[11px] text-white/40">
              Chẩn đoán: khung nhúng {frameLoaded ? "đã tải" : "chưa tải"} · máy chủ file{" "}
              {reach === "toi-duoc"
                ? "tới được"
                : reach === "bi-chan"
                  ? "KHÔNG tới được"
                  : "đang thử"}
            </p>
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
