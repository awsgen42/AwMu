"use client";

import { useEffect, useState } from "react";

const COLORS = ["#0088cc", "#00b0ff", "#f5a623", "#e91e8c", "#00c853", "#7b2ff7", "#ff6b35"];

export default function Confetti({ onDone }: { onDone?: () => void }) {
  const [pieces] = useState(() =>
    Array.from({ length: 60 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      delay: Math.random() * 0.8,
      duration: 2 + Math.random() * 1.5,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      shape: Math.random() > 0.5 ? "50%" : "2px",
    }))
  );

  useEffect(() => {
    const t = setTimeout(() => onDone?.(), 4000);
    return () => clearTimeout(t);
  }, [onDone]);

  return (
    <>
      {pieces.map((p) => (
        <span
          key={p.id}
          className="confetti-piece"
          style={{
            left: `${p.left}%`,
            background: p.color,
            borderRadius: p.shape,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
          }}
        />
      ))}
    </>
  );
}
