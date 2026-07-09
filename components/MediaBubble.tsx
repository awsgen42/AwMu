"use client";

import { useRef, useState } from "react";

export function ImageBubble({
  src,
  mine,
  onView,
}: {
  src: string;
  mine: boolean;
  onView: () => void;
}) {
  const [loaded, setLoaded] = useState(false);
  return (
    <div className="relative rounded-xl overflow-hidden" style={{ minWidth: 140, minHeight: loaded ? 0 : 140 }}>
      {!loaded && (
        <div className="absolute inset-0 bg-black/10 flex items-center justify-center">
          <div className="w-7 h-7 border-2 border-[var(--card)]/40 border-t-white rounded-full animate-spin" />
        </div>
      )}
      <img
        src={src}
        alt="photo"
        onLoad={() => setLoaded(true)}
        onClick={(e) => { e.stopPropagation(); onView(); }}
        className="max-w-full block cursor-pointer active:opacity-90 transition"
        style={{ maxHeight: "320px" }}
      />
    </div>
  );
}

export function VideoBubble({ src, mine }: { src: string; mine: boolean }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);

  const toggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    const v = videoRef.current;
    if (!v) return;
    if (playing) {
      v.pause();
      setPlaying(false);
    } else {
      document.querySelectorAll("video, audio").forEach((el: any) => {
        if (el !== v) el.pause();
      });
      v.play();
      setPlaying(true);
    }
  };

  return (
    <div className="relative rounded-xl overflow-hidden" style={{ minWidth: 160 }}>
      <video
        ref={videoRef}
        src={src}
        onEnded={() => setPlaying(false)}
        onPause={() => setPlaying(false)}
        onClick={toggle}
        playsInline
        className="max-w-full block cursor-pointer"
        style={{ maxHeight: "320px" }}
      />
      {!playing && (
        <button
          onClick={toggle}
          className="absolute inset-0 flex items-center justify-center bg-black/25"
        >
          <span className="w-14 h-14 rounded-full bg-black/50 backdrop-blur flex items-center justify-center">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="white" className="ml-1">
              <path d="M8 5.5a1 1 0 0 1 1.54-.84l10 6.5a1 1 0 0 1 0 1.68l-10 6.5A1 1 0 0 1 8 18.5v-13z" />
            </svg>
          </span>
        </button>
      )}
    </div>
  );
}

export function AttachSheet({
  onImage,
  onVideo,
  onClose,
}: {
  onImage: () => void;
  onVideo: () => void;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-40" onClick={onClose}>
      <div className="absolute inset-0 bg-black/20 viewer-in" />
      <div
        onClick={(e) => e.stopPropagation()}
        className="absolute bottom-0 left-0 right-0 bg-[var(--card)] rounded-t-3xl p-5 panel-up max-w-[500px] mx-auto"
      >
        <div className="w-10 h-1 rounded-full bg-[var(--surface2)] mx-auto mb-5" />
        <div className="flex justify-center gap-8 pb-3">
          <button onClick={onImage} className="flex flex-col items-center gap-2">
            <span className="w-14 h-14 rounded-2xl bg-[var(--active)] flex items-center justify-center">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#0088cc" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect width="18" height="18" x="3" y="3" rx="3" />
                <circle cx="9" cy="9" r="2" />
                <path d="m21 15-3.1-3.1a2 2 0 0 0-2.8 0L6 21" />
              </svg>
            </span>
            <span className="text-xs font-medium text-[var(--text2)]">Photo</span>
          </button>
          <button onClick={onVideo} className="flex flex-col items-center gap-2">
            <span className="w-14 h-14 rounded-2xl bg-[var(--active)] flex items-center justify-center">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#4c56af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="m16 13 5.2 3.1a.5.5 0 0 0 .8-.4V8.3a.5.5 0 0 0-.8-.4L16 11" />
                <rect x="2" y="6" width="14" height="12" rx="3" />
              </svg>
            </span>
            <span className="text-xs font-medium text-[var(--text2)]">Video</span>
          </button>
        </div>
      </div>
    </div>
  );
}
