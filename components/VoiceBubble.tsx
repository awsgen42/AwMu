"use client";

import { useEffect, useRef, useState } from "react";

// Message id se fixed "random" waveform banata hai (har message ka apna pattern, reload pe same)
function makeBars(seed: string, count = 27) {
  const bars: number[] = [];
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  for (let i = 0; i < count; i++) {
    h = (h * 1103515245 + 12345) >>> 0;
    bars.push(6 + (h % 17)); // 6px - 22px
  }
  return bars;
}

export default function VoiceBubble({
  src,
  duration,
  mine,
  msgId,
}: {
  src: string;
  duration: number;
  mine: boolean;
  msgId: string;
}) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0); // 0..1
  const [remaining, setRemaining] = useState(duration);
  const bars = useRef(makeBars(msgId)).current;

  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;

    const onTime = () => {
      const d = a.duration && isFinite(a.duration) ? a.duration : duration || 1;
      setProgress(a.currentTime / d);
      setRemaining(Math.max(0, Math.ceil(d - a.currentTime)));
    };
    const onEnd = () => {
      setPlaying(false);
      setProgress(0);
      setRemaining(duration);
    };
    const onPause = () => setPlaying(false);
    const onPlay = () => setPlaying(true);

    a.addEventListener("timeupdate", onTime);
    a.addEventListener("ended", onEnd);
    a.addEventListener("pause", onPause);
    a.addEventListener("play", onPlay);
    return () => {
      a.removeEventListener("timeupdate", onTime);
      a.removeEventListener("ended", onEnd);
      a.removeEventListener("pause", onPause);
      a.removeEventListener("play", onPlay);
    };
  }, [duration]);

  const toggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    const a = audioRef.current;
    if (!a) return;
    if (playing) a.pause();
    else {
      // Doosri chalti hui voice notes rok do
      document.querySelectorAll("audio").forEach((el) => {
        if (el !== a) el.pause();
      });
      a.play();
    }
  };

  const seek = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    const a = audioRef.current;
    if (!a) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const frac = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
    const d = a.duration && isFinite(a.duration) ? a.duration : duration || 1;
    a.currentTime = frac * d;
    setProgress(frac);
  };

  const fmt = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  const activeCount = Math.round(progress * bars.length);

  return (
    <div className="flex items-center gap-2.5 py-1 min-w-[200px]">
      <audio ref={audioRef} src={src} preload="metadata" />

      {/* Play/Pause */}
      <button
        onClick={toggle}
        className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
          mine ? "bg-[var(--card)]/25" : "bg-[#0088cc]"
        }`}
      >
        {playing ? (
          <svg width="15" height="15" viewBox="0 0 24 24" fill="white">
            <rect x="6" y="5" width="4" height="14" rx="1.5" />
            <rect x="14" y="5" width="4" height="14" rx="1.5" />
          </svg>
        ) : (
          <svg width="15" height="15" viewBox="0 0 24 24" fill="white" className="ml-0.5">
            <path d="M8 5.5a1 1 0 0 1 1.54-.84l10 6.5a1 1 0 0 1 0 1.68l-10 6.5A1 1 0 0 1 8 18.5v-13z" />
          </svg>
        )}
      </button>

      {/* Waveform */}
      <div
        onClick={seek}
        className="flex items-center gap-[2.5px] h-8 cursor-pointer flex-1"
      >
        {bars.map((h, i) => (
          <span
            key={i}
            className="rounded-full transition-colors duration-150"
            style={{
              width: "3px",
              height: `${h}px`,
              background: mine
                ? i < activeCount ? "#ffffff" : "rgba(255,255,255,0.4)"
                : i < activeCount ? "#0088cc" : "var(--outline)",
            }}
          />
        ))}
      </div>

      {/* Time */}
      <span className={`text-[11px] tabular-nums shrink-0 ${mine ? "text-white/80" : "text-[var(--muted)]"}`}>
        {fmt(playing || progress > 0 ? remaining : duration)}
      </span>
    </div>
  );
}
