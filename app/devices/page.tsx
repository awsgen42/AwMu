"use client";
import { askConfirm } from "@/components/ConfirmModal";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { collection, onSnapshot, doc, updateDoc } from "firebase/firestore";
import { myDeviceId } from "@/lib/sessions";
import { ArrowLeftIcon } from "@/components/Icons";

export default function DevicesPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [sessions, setSessions] = useState<any[]>([]);
  const myId = typeof window !== "undefined" ? myDeviceId() : "";

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      if (!u) {
        router.replace("/");
        return;
      }
      setUser(u);
      onSnapshot(collection(db, "users", u.uid, "sessions"), (qs) => {
        const list: any[] = [];
        qs.forEach((d) => list.push({ id: d.id, ...d.data() }));
        list.sort((a, b) => (b.lastActive?.toMillis?.() || 0) - (a.lastActive?.toMillis?.() || 0));
        setSessions(list);
      }, () => {});
    });
    return () => unsub();
  }, [router]);

  const revoke = async (sessionId: string) => {
    if (!await askConfirm({ message: "Log out this device?", danger: true, confirmText: "Yes" })) return;
    await updateDoc(doc(db, "users", user.uid, "sessions", sessionId), { revoked: true });
  };

  const fmt = (ts: any) => {
    if (!ts?.toDate) return "";
    const d = ts.toDate();
    const now = Date.now();
    const diff = now - d.getTime();
    if (diff < 6 * 60 * 1000) return "Active now";
    if (diff < 60 * 60 * 1000) return `${Math.floor(diff / 60000)} min ago`;
    return d.toLocaleString("en-US", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });
  };

  return (
    <main style={{ height: "100dvh", overflowY: "auto", overscrollBehavior: "contain" }} className="bg-[var(--bg)]">
      <header className="flex items-center gap-3 px-4 py-3 bg-[var(--card)] border-b border-[var(--border)] sticky top-0 z-10 head-down">
        <button onClick={() => router.back()} className="text-[var(--heading)] p-1">
          <ArrowLeftIcon size={22} />
        </button>
        <h1 className="text-lg font-semibold text-[var(--heading)]">Devices & Sessions</h1>
      </header>

      <div className="max-w-[600px] mx-auto p-4 fade-up">
        <p className="text-[var(--muted)] text-[11px] uppercase tracking-widest mb-2 px-1 font-medium">
          Login history ({sessions.length})
        </p>

        {sessions.filter((s) => !s.revoked).map((s) => {
          const isMe = s.id === myId;
          const active = s.lastActive?.toMillis?.() > Date.now() - 6 * 60 * 1000;
          return (
            <div key={s.id} className="flex items-center gap-3 p-4 rounded-xl bg-[var(--card)] border border-[var(--border)] mb-2">
              <span className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${active ? "bg-[#00c853]/15" : "bg-[var(--surface2)]"}`}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={active ? "#00c853" : "currentColor"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--text2)]">
                  <rect width="14" height="20" x="5" y="2" rx="2" /><path d="M12 18h.01" />
                </svg>
              </span>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-[14px] text-[var(--text)] flex items-center gap-2">
                  {s.device || "Device"}
                  {isMe && <span className="text-[9px] font-bold bg-[#0088cc] text-white rounded-full px-2 py-0.5">THIS DEVICE</span>}
                </p>
                <p className={`text-[12px] ${active ? "text-[#00c853]" : "text-[var(--muted)]"}`}>
                  {fmt(s.lastActive)}
                </p>
                <p className="text-[10px] text-[var(--muted)]">
                  First login: {s.createdAt?.toDate?.()?.toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" }) || "—"}
                </p>
              </div>
              {!isMe && (
                <button
                  onClick={() => revoke(s.id)}
                  className="px-3 py-1.5 rounded-[10px] border border-[#ba1a1a]/40 text-[#ba1a1a] text-xs font-medium shrink-0"
                >
                  Logout
                </button>
              )}
            </div>
          );
        })}

        {sessions.length > 1 && (
          <button
            onClick={async () => {
              if (!await askConfirm({ message: "Log out ALL other devices?", danger: true, confirmText: "Yes" })) return;
              for (const s of sessions) {
                if (s.id !== myId && !s.revoked) {
                  await updateDoc(doc(db, "users", user.uid, "sessions", s.id), { revoked: true });
                }
              }
            }}
            className="w-full py-3 mt-2 rounded-[10px] bg-[var(--card)] border border-[#ba1a1a]/40 text-[#ba1a1a] font-medium text-sm"
          >
            Logout all other devices
          </button>
        )}
      </div>
    </main>
  );
}
