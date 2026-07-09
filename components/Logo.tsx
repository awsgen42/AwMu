"use client";

export function LogoMark({ size = 36 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      <rect width="48" height="48" rx="12" fill="url(#awmu-g)" />
      <path
        d="M14 32 L21.5 15 a1.8 1.8 0 0 1 3.3 0 L30 26"
        stroke="white"
        strokeWidth="3.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <path
        d="M24.5 30 c0 -4 8 -4 8 0 c0 3 -3.5 4.5 -8 8 v-8z"
        fill="#8df0ff"
        opacity="0.95"
      />
      <defs>
        <linearGradient id="awmu-g" x1="0" y1="0" x2="48" y2="48">
          <stop stopColor="#00a2e8" />
          <stop offset="1" stopColor="#006193" />
        </linearGradient>
      </defs>
    </svg>
  );
}

export function LogoFull({ size = 30 }: { size?: number }) {
  return (
    <div className="flex items-center gap-2.5 select-none">
      <LogoMark size={size} />
      <span
        className="font-bold tracking-tight text-[var(--heading)]"
        style={{ fontSize: size * 0.62 }}
      >
        Aw<span className="text-[#0088cc]">Mu</span>
      </span>
    </div>
  );
}
