"use client";
import OfflineBar from "@/components/OfflineBar";
import VerifyBanner from "@/components/VerifyBanner";
import { initNotifications } from "@/lib/notifications";
import { LogoFull } from "@/components/Logo";

import { MessageIcon, SearchIcon, UsersIcon, SettingsIcon } from "@/components/Icons";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { auth, db } from "@/lib/firebase";
import { startPresence } from "@/lib/presence";
import { onAuthStateChanged, signOut } from "firebase/auth";
import {
  doc, getDoc, setDoc, serverTimestamp,
  collection, onSnapshot, query, where,
} from "firebase/firestore";

export default function ChatList({ activeChatId }: { activeChatId?: string }) {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [chats, setChats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "unread">("all");

  useEffect(() => {
    let cleanups: (() => void)[] = [];

    const unsub = onAuthStateChanged(auth, async (u) => {
      cleanups.forEach((fn) => fn());
      cleanups = [];

      if (!u) {
        router.replace("/");
        return;
      }
      setUser(u);
      cleanups.push(startPresence(u.uid));
      initNotifications(u.uid);

      const ref = doc(db, "users", u.uid);
      const snap = await getDoc(ref);
      if (!snap.exists()) {
        await setDoc(ref, {
          displayName: u.email?.split("@")[0] || "User",
          email: u.email,
          photoURL: "",
          bio: "Hey! I'm using AwMu",
          online: true,
          lastSeen: serverTimestamp(),
          createdAt: serverTimestamp(),
        });
      }

      cleanups.push(
        onSnapshot(collection(db, "users"), (qs) => {
          const list: any[] = [];
          qs.forEach((d) => list.push({ uid: d.id, ...d.data() }));
          setUsers(list);
        }, () => {})
      );

      const q = query(
        collection(db, "chats"),
        where("participants", "array-contains", u.uid)
      );
      cleanups.push(
        onSnapshot(q, (qs) => {
          const list: any[] = [];
          qs.forEach((d) => list.push({ id: d.id, ...d.data() }));
          list.sort((a, b) => {
            const ta = a.lastMessage?.timestamp?.toMillis?.() || 0;
            const tb = b.lastMessage?.timestamp?.toMillis?.() || 0;
            return tb - ta;
          });
          setChats(list);
          setLoading(false);
        }, () => {})
      );
    });

    return () => {
      cleanups.forEach((fn) => fn());
      unsub();
    };
  }, [router]);

  const chatDisplay = (chat: any) => {
    if (chat.isGroup) {
      return { name: chat.name || "Group", isGroup: true, online: false };
    }
    const other = getOther(chat);
    return { name: other?.displayName || "...", isGroup: false, online: !!other?.online };
  };

  const getOther = (chat: any) => {
    const otherUid = chat.participants.find((p: string) => p !== user?.uid);
    return users.find((x) => x.uid === otherUid);
  };

  const openChat = async (otherUid: string) => {
    const chatId = [user.uid, otherUid].sort().join("_");
    const chatRef = doc(db, "chats", chatId);
    const chatSnap = await getDoc(chatRef);
    if (!chatSnap.exists()) {
      await setDoc(chatRef, {
        participants: [user.uid, otherUid],
        lastMessage: null,
        unread: { [user.uid]: 0, [otherUid]: 0 },
        typing: {},
        createdAt: serverTimestamp(),
      });
    }
    router.push(`/chats/${chatId}`);
  };

  const formatTime = (ts: any) => {
    if (!ts?.toDate) return "";
    const d = ts.toDate();
    const today = new Date();
    if (d.toDateString() === today.toDateString()) {
      return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
    }
    return d.toLocaleDateString("en-US", { day: "numeric", month: "short" });
  };


  const visibleChats = chats.filter((c) => {
    const other = getOther(c);
    const dispName = c.isGroup ? c.name : other?.displayName;
    const matchesSearch = !search || dispName?.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filter === "all" || (c.unread?.[user?.uid] || 0) > 0;
    return matchesSearch && matchesFilter;
  });


  if (loading) {
    return (
      <div className="h-full flex items-center justify-center bg-[var(--bg)]">
        <p className="text-[var(--muted)] text-sm">Loading...</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-[var(--bg)]">
      <OfflineBar />
      <VerifyBanner />
      <header className="px-4 pt-4 pb-3 bg-[var(--card)] border-b border-[var(--border)] shrink-0">
        <div className="flex items-center justify-between mb-3">
          <div className="mr-auto"><LogoFull size={30} /></div>
          <button
            onClick={() => router.push("/contacts")}
            className="text-xl w-9 h-9 rounded-[10px] border border-[var(--outline)] flex items-center justify-center mr-2"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--heading)]">
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><line x1="19" x2="19" y1="8" y2="14" /><line x1="22" x2="16" y1="11" y2="11" />
            </svg>
          </button>
          <button
            onClick={() => router.push("/new-group")}
            className="text-xl w-9 h-9 rounded-[10px] border border-[var(--outline)] flex items-center justify-center mr-2"
          >
            <UsersIcon size={18} className="text-[var(--heading)]" />
          </button>
          <button
            onClick={() => router.push("/settings")}
            className="text-xl w-9 h-9 rounded-[10px] border border-[var(--outline)] flex items-center justify-center"
          >
            <SettingsIcon size={18} className="text-[var(--heading)]" />
          </button>
        </div>

        <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-[var(--surface)] mb-3">
          <SearchIcon size={16} className="text-[var(--muted)] shrink-0" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search"
            className="flex-1 bg-transparent outline-none text-sm text-[var(--text)] placeholder-[var(--muted)] min-w-0"
          />
        </div>

        <div className="flex gap-2">
          {(["all", "unread"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-1.5 rounded-full text-xs font-medium border transition ${
                filter === f
                  ? "bg-[#0088cc] text-white border-[#0088cc]"
                  : "bg-[var(--card)] text-[var(--text2)] border-[var(--outline)]"
              }`}
            >
              {f === "all" ? "All" : "Unread"}
            </button>
          ))}
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-2 py-2">
        {visibleChats.length === 0 && (
          <div className="text-center py-12 px-4">
            <p className="text-[var(--muted)] text-sm">Abhi koi chat nahi</p>
            <button
              onClick={() => router.push("/contacts")}
              className="mt-3 px-5 py-2 rounded-[10px] bg-[#0088cc] text-white text-xs font-medium"
            >
              Find contacts
            </button>
          </div>
        )}
        {visibleChats.map((c) => {
          const other = getOther(c);
          const disp = chatDisplay(c);
          const unreadCount = c.unread?.[user?.uid] || 0;
          const mine = c.lastMessage?.senderId === user?.uid;
          const active = c.id === activeChatId;
          return (
            <div
              key={c.id}
              onClick={() => router.push(`/chats/${c.id}`)}
              style={{ animationDelay: `${Math.min(visibleChats.indexOf(c) * 35, 300)}ms` }}
              className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition mb-1 border list-in ${
                active
                  ? "bg-[var(--active)] border-l-[3px] border-l-[#0088cc] border-y-transparent border-r-transparent"
                  : "bg-[var(--card)] border-transparent hover:border-[var(--border)] active:bg-[var(--surface2)]"
              }`}
            >
              <div className="relative w-12 h-12 shrink-0">
                {!disp.isGroup && getOther(c)?.photoURL ? (
                  <img src={getOther(c).photoURL} alt="" className="w-12 h-12 rounded-full object-cover" />
                ) : (
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center font-semibold text-lg text-white ${disp.isGroup ? "bg-[#4c56af]" : "bg-[#007bb9]"}`}>
                    {disp.isGroup ? <UsersIcon size={20} /> : disp.name?.[0]?.toUpperCase() || "?"}
                  </div>
                )}
                {disp.online && (
                  <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-green-500 border-2 border-[var(--card)]" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-center">
                  <p className="font-semibold text-[15px] text-[var(--text)] truncate">{disp.name}</p>
                  <p className={`text-[11px] shrink-0 ml-2 ${unreadCount ? "text-[#00b0ff] font-medium" : "text-[var(--muted)]"}`}>
                    {formatTime(c.lastMessage?.timestamp)}
                  </p>
                </div>
                <div className="flex justify-between items-center">
                  <p className="text-[13px] text-[var(--text2)] truncate">
                    {c.typing?.[getOther(c)?.uid || ""] ? (
                      <span className="text-[#0088cc]">typing...</span>
                    ) : c.lastMessage ? (
                      `${mine ? "You: " : ""}${c.lastMessage.text}`
                    ) : (
                      "Start chatting"
                    )}
                  </p>
                  {unreadCount > 0 && (
                    <span className="ml-2 shrink-0 min-w-5 h-5 px-1.5 rounded-full bg-[#00b0ff] text-white text-[10px] font-bold flex items-center justify-center">
                      {unreadCount}
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        </div>
    </div>
  );
}
