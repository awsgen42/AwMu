"use client";

import { useState } from "react";
import { auth } from "@/lib/firebase";
import { sendEmailVerification } from "firebase/auth";

export default function VerifyBanner() {
  const [sent, setSent] = useState(false);
  const [hidden, setHidden] = useState(false);

  const user = auth.currentUser;
  if (!user || user.emailVerified || hidden) return null;

  const resend = async () => {
    try {
      await sendEmailVerification(user);
      setSent(true);
    } catch {
      // Zyada bar bhejne pe Firebase thora rokta hai — koi baat nahi
      setSent(true);
    }
  };

  return (
    <div className="flex items-center gap-2 px-4 py-2.5 bg-[#fff8e6] border-b border-[#f5e2ad] text-[#7a5c00]">
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
        <rect width="20" height="16" x="2" y="4" rx="2" /><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
      </svg>
      <p className="text-xs flex-1">
        {sent ? "Verification email bhej di — inbox/spam check karo, phir app dobara kholo" : "Apni email verify karo"}
      </p>
      {!sent && (
        <button onClick={resend} className="text-xs font-semibold underline shrink-0">
          Send link
        </button>
      )}
      <button onClick={() => setHidden(true)} className="text-lg leading-none shrink-0 opacity-60">×</button>
    </div>
  );
}
