"use client";
import { LogoMark } from "@/components/Logo";

export default function Splash() {
  return (
    <main className="min-h-screen bg-[var(--bg)] flex flex-col items-center justify-center">
      <div className="splash-pop">
        <LogoMark size={88} />
      </div>
      <p className="mt-4 font-bold text-xl tracking-tight text-[var(--heading)] splash-fade">
        Aw<span className="text-[#0088cc]">Mu</span>
      </p>
      <div className="mt-6 flex gap-1.5 splash-fade">
        <span className="w-2 h-2 rounded-full bg-[#0088cc] dot-bounce" style={{ animationDelay: "0ms" }} />
        <span className="w-2 h-2 rounded-full bg-[#0088cc] dot-bounce" style={{ animationDelay: "150ms" }} />
        <span className="w-2 h-2 rounded-full bg-[#0088cc] dot-bounce" style={{ animationDelay: "300ms" }} />
      </div>
    </main>
  );
}
