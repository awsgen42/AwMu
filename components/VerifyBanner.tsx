"use client";

import { useEffect, useState } from "react";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged, sendEmailVerification } from "firebase/auth";

export default function VerifyBanner() {
  const [show, setShow] = useState(false);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    // Session me ek dafa dismiss ho to dobara na aaye
    try {
      if (sessionStorage.getItem("awmu-verify-dismissed")) return;
    } catch {}
    const unsub = onAuthStateChanged(auth, (u) => {
      setShow(!!u && !u.emailVerified);
    });
    return () => unsub();
  }, []);

  if (!show) return null;

  const resend = async () => {
    if (auth.currentUser) {
      await sendEmailVerification(auth.currentUser).catch(() => {});
      setSent(true);
      setTimeout(() => dismiss(), 2000);
    }
  };

  const dismiss = () => {
    setShow(false);
    try { sessionStorage.setItem("awmu-verify-dismissed", "1"); } catch {}
  };

  return (
    <div className="px-3 pt-2 head-down">
      <div className="flex items-center gap-3 px-4 py-2.5 rounded-2xl bg-[var(--active)] border border-[#0088cc]/20">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0088cc" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
          <rect width="20" height="16" x="2" y="4" rx="2" /><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
        </svg>
        <p className="flex-1 text-[12px] text-[var(--text)] leading-tight">
          {sent ? "Verification email sent ✓" : "Verify your email to secure your account"}
        </p>
        {!sent && (
          <button onClick={resend} className="text-[12px] font-semibold text-[#0088cc] shrink-0">
            Send link
          </button>
        )}
        <button onClick={dismiss} className="text-[var(--muted)] shrink-0 w-6 h-6 flex items-center justify-center">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12" /></svg>
        </button>
      </div>
    </div>
  );
}
