"use client";

import { MessageIcon } from "@/components/Icons";

import ChatList from "@/components/ChatList";

export default function ChatsPage() {
  return (
    <main className="h-screen flex bg-[var(--bg)]">
      <div className="w-full lg:w-[360px] lg:border-r lg:border-[var(--border)] shrink-0 h-full">
        <ChatList />
      </div>
      <div className="hidden lg:flex flex-1 items-center justify-center flex-col gap-3 fade-up">
        <div className="w-16 h-16 rounded-2xl bg-[var(--surface2)] flex items-center justify-center">
          <MessageIcon size={30} className="text-[var(--muted)]" />
        </div>
        <p className="text-[var(--muted)] text-sm">Select a chat to start messaging</p>
      </div>
    </main>
  );
}
