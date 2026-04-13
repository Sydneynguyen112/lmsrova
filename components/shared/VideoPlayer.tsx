"use client";

import MuxPlayer from "@mux/mux-player-react";

interface VideoPlayerProps {
  playbackId: string;
  title?: string;
  accentColor?: string;
  onEnded?: () => void;
}

export function VideoPlayer({
  playbackId,
  title,
  accentColor = "#CD9C20",
  onEnded,
}: VideoPlayerProps) {
  return (
    <MuxPlayer
      playbackId={playbackId}
      streamType="on-demand"
      metadata={{
        video_title: title,
        player_name: "ROVA LMS Player",
      }}
      accentColor={accentColor}
      onEnded={onEnded}
      style={{ width: "100%", aspectRatio: "16/9", borderRadius: "0.75rem" }}
    />
  );
}

/**
 * Placeholder khi chưa có video (playbackId rỗng)
 */
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
