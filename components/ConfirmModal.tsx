"use client";

import { useEffect, useState } from "react";

type ConfirmOptions = {
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  danger?: boolean;
};

let openConfirm: ((opts: ConfirmOptions) => Promise<boolean>) | null = null;

export function askConfirm(opts: ConfirmOptions): Promise<boolean> {
  if (openConfirm) return openConfirm(opts);
  return Promise.resolve(window.confirm(opts.message));
}

export default function ConfirmModalHost() {
  const [opts, setOpts] = useState<ConfirmOptions | null>(null);
  const [resolver, setResolver] = useState<((v: boolean) => void) | null>(null);
  const [closing, setClosing] = useState(false);

  useEffect(() => {
    openConfirm = (o: ConfirmOptions) =>
      new Promise<boolean>((resolve) => {
        setClosing(false);
        setOpts(o);
        setResolver(() => resolve);
      });
    return () => { openConfirm = null; };
  }, []);

  const close = (result: boolean) => {
    setClosing(true);
    setTimeout(() => {
      resolver?.(result);
      setOpts(null);
      setResolver(null);
      setClosing(false);
    }, 180);
  };

  if (!opts) return null;

  const accent = opts.danger ? "#ba1a1a" : "#0088cc";

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-6"
      onClick={() => close(false)}
    >
      {/* Backdrop */}
      <div
        className={`absolute inset-0 bg-black/50 ${closing ? "backdrop-out" : "backdrop-in"}`}
        style={{ backdropFilter: "blur(4px)" }}
      />

      {/* Modal */}
      <div
        onClick={(e) => e.stopPropagation()}
        className={`relative w-full max-w-[340px] bg-[var(--card)] rounded-[28px] p-6 pt-7 shadow-[0_24px_70px_rgba(0,0,0,0.4)] ${
          closing ? "modal-out" : "modal-spring"
        }`}
      >
        {/* Accent glow line upar */}
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-16 h-1 rounded-b-full opacity-80"
          style={{ background: accent }}
        />

        {/* Icon with pop + ring */}
        <div
          className="w-14 h-14 rounded-2xl mx-auto mb-4 flex items-center justify-center icon-pop icon-ring"
          style={{
            background: opts.danger ? "rgba(186,26,26,0.1)" : "var(--active)",
            ["--ring-c" as any]: opts.danger ? "rgba(186,26,26,0.25)" : "rgba(0,136,204,0.25)",
          }}
        >
          {opts.danger ? (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={accent} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" /><line x1="10" x2="10" y1="11" y2="17" /><line x1="14" x2="14" y1="11" y2="17" />
            </svg>
          ) : (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={accent} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" /><path d="M12 16v-4" /><path d="M12 8h.01" />
            </svg>
          )}
        </div>

        {/* Text — staggered */}
        {opts.title && (
          <p className="text-center font-bold text-[17px] text-[var(--text)] mb-1.5 row-in" style={{ animationDelay: "0.15s" }}>
            {opts.title}
          </p>
        )}
        <p
          className="text-center text-[13.5px] text-[var(--text2)] leading-relaxed mb-6 row-in"
          style={{ animationDelay: "0.2s" }}
        >
          {opts.message}
        </p>

        {/* Buttons — staggered */}
        <div className="flex gap-3 row-in" style={{ animationDelay: "0.27s" }}>
          <button
            onClick={() => close(false)}
            className="flex-1 py-3.5 rounded-2xl bg-[var(--surface)] text-[var(--text2)] text-sm font-semibold ripple-soft ripple active:scale-[0.97] transition-transform"
          >
            {opts.cancelText || "Cancel"}
          </button>
          <button
            onClick={() => close(true)}
            className="flex-1 py-3.5 rounded-2xl text-white text-sm font-semibold ripple active:scale-[0.97] transition-transform"
            style={{
              background: opts.danger
                ? "linear-gradient(135deg, #d32f2f, #9a0f0f)"
                : "linear-gradient(135deg, #00a2e8, #006193)",
              boxShadow: opts.danger
                ? "0 6px 18px rgba(186,26,26,0.35)"
                : "0 6px 18px rgba(0,136,204,0.35)",
            }}
          >
            {opts.confirmText || "OK"}
          </button>
        </div>
      </div>
    </div>
  );
}
