"use client";

import { useRouter } from "next/navigation";
import ChatList from "@/components/ChatList";
import { MessageIcon, SettingsIcon } from "@/components/Icons";

export default function ChatsPage() {
  const router = useRouter();

  const NAV = [
    {
      key: "chats", label: "Chats", active: true, path: "/chats",
      icon: <MessageIcon size={21} />,
    },
    {
      key: "contacts", label: "Contacts", active: false, path: "/contacts",
      icon: (
        <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      ),
    },
    {
      key: "settings", label: "Settings", active: false, path: "/settings",
      icon: <SettingsIcon size={21} />,
    },
  ];

  return (
    <main className="flex bg-[var(--bg)] relative" style={{ height: "100dvh", overflow: "hidden" }}>
      <div className="w-full lg:w-[360px] lg:border-r lg:border-[var(--border)] shrink-0 h-full">
        <ChatList />
      </div>
      <div className="hidden lg:flex flex-1 items-center justify-center flex-col gap-3 fade-up">
        <div className="w-16 h-16 rounded-2xl bg-[var(--surface2)] flex items-center justify-center">
          <MessageIcon size={30} className="text-[var(--muted)]" />
        </div>
        <p className="text-[var(--muted)] text-sm">Select a chat to start messaging</p>
      </div>

      {/* FAB — new chat (mobile) */}
      <button
        onClick={() => router.push("/contacts")}
        className="lg:hidden fixed bottom-24 right-5 w-14 h-14 rounded-2xl bubble-mine text-white flex items-center justify-center shadow-[0_8px_24px_rgba(0,136,204,0.4)] send-tap z-30 avatar-pop"
        style={{ background: "linear-gradient(135deg, #00a2e8, #006193)" }}
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z" /><path d="M12 8v6" /><path d="M9 11h6" />
        </svg>
      </button>

      {/* Bottom nav (mobile) */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-[var(--card)]/92 backdrop-blur-xl border-t border-[var(--border)] flex z-30">
        {NAV.map((t) => (
          <button
            key={t.key}
            onClick={() => !t.active && router.push(t.path)}
            className="flex-1 flex flex-col items-center gap-1 pt-2.5 pb-3"
          >
            <span className={`px-5 py-1 rounded-full transition ${t.active ? "bg-[var(--active)] text-[#0088cc]" : "text-[var(--muted)]"}`}>
              {t.icon}
            </span>
            <span className={`text-[11px] font-medium ${t.active ? "text-[var(--heading)]" : "text-[var(--muted)]"}`}>
              {t.label}
            </span>
          </button>
        ))}
      </nav>
    </main>
  );
}
