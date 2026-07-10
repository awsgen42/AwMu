"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { auth, db } from "@/lib/firebase";
import { startPresence } from "@/lib/presence";
import { startSession, startAutoLogout } from "@/lib/sessions";
import { initNotifications } from "@/lib/notifications";
import { onAuthStateChanged } from "firebase/auth";
import {
  doc, getDoc, setDoc, updateDoc, serverTimestamp,
  collection, onSnapshot, query, where,
} from "firebase/firestore";
import { SearchIcon, UsersIcon } from "@/components/Icons";
import { LogoFull } from "@/components/Logo";
import VerifyBanner from "@/components/VerifyBanner";
import OfflineBar from "@/components/OfflineBar";
import { ChatListSkeleton } from "@/components/Skeletons";

export default function ChatList({ activeChatId }: { activeChatId?: string }) {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [chats, setChats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const [showArchived, setShowArchived] = useState(false);
  const [sheetFor, setSheetFor] = useState<any>(null);
  const [folders, setFolders] = useState<string[]>([]);
  const [activeFolder, setActiveFolder] = useState<string>("");

  useEffect(() => {
    try {
      setFolders(JSON.parse(localStorage.getItem("awmu-folders") || "[]"));
    } catch {}
  }, []);

  const addFolder = () => {
    const name = prompt("Folder name (e.g. Family, Work):");
    if (!name?.trim()) return;
    const next = [...folders, name.trim()].slice(0, 6);
    setFolders(next);
    try { localStorage.setItem("awmu-folders", JSON.stringify(next)); } catch {}
  };

  const assignFolder = (c: any, folder: string) => {
    const cur = c.folders?.[user?.uid];
    const next = cur === folder ? null : folder;
    setChats((prev) => prev.map((x) => (x.id === c.id ? { ...x, folders: { ...x.folders, [user.uid]: next } } : x)));
    updateDoc(doc(db, "chats", c.id), { [`folders.${user.uid}`]: next }).catch(() => {});
    setSheetFor(null);
  };
  const pressTimer = { current: null as any };

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
      cleanups.push(startSession(u.uid));
      try {
        const mins = Number(localStorage.getItem("awmu-autologout") || 0);
        if (mins) cleanups.push(startAutoLogout(mins));
      } catch {}

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
            const pa = a.pinned?.[u.uid] ? 1 : 0;
            const pb = b.pinned?.[u.uid] ? 1 : 0;
            if (pa !== pb) return pb - pa; // pinned upar
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

  const getOther = (chat: any) => {
    const otherUid = chat.participants.find((p: string) => p !== user?.uid);
    return users.find((x) => x.uid === otherUid);
  };

  const chatDisplay = (chat: any) => {
    if (chat.isGroup) {
      return { name: chat.name || "Group", isGroup: true, online: false };
    }
    const other = getOther(chat);
    return {
      name: other?.displayName || "...",
      isGroup: false,
      online: !!other?.online && !other?.privacy?.hideOnline,
    };
  };

  const togglePin = (c: any) => {
    updateDoc(doc(db, "chats", c.id), {
      [`pinned.${user.uid}`]: !c.pinned?.[user?.uid],
    }).catch(() => {});
    setSheetFor(null);
  };

  const toggleArchive = (c: any) => {
    updateDoc(doc(db, "chats", c.id), {
      [`archived.${user.uid}`]: !c.archived?.[user?.uid],
    }).catch(() => {});
    setSheetFor(null);
  };

  // Preview me media type ke liye clean SVG icon
  const PreviewIcon = ({ type }: { type: string }) => {
    const cls = "inline-block align-[-2px] mr-1 text-[var(--muted)]";
    if (type === "photo")
      return (
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={cls}>
          <rect width="18" height="18" x="3" y="3" rx="2" /><circle cx="9" cy="9" r="2" /><path d="m21 15-3.1-3.1a2 2 0 0 0-2.8 0L6 21" />
        </svg>
      );
    if (type === "video")
      return (
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={cls}>
          <path d="m16 13 5.2 3.1a.5.5 0 0 0 .8-.4V8.3a.5.5 0 0 0-.8-.4L16 11" /><rect x="2" y="6" width="14" height="12" rx="2" />
        </svg>
      );
    if (type === "voice")
      return (
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={cls}>
          <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" /><path d="M19 10v2a7 7 0 0 1-14 0v-2" /><line x1="12" x2="12" y1="19" y2="22" />
        </svg>
      );
    if (type === "sticker")
      return (
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={cls}>
          <path d="M15.5 3H5a2 2 0 0 0-2 2v14c0 1.1.9 2 2 2h14a2 2 0 0 0 2-2V8.5L15.5 3Z" /><path d="M15 3v6h6" />
        </svg>
      );
    return null;
  };

  // lastMessage text -> {icon type, clean label}
  const previewParts = (text: string) => {
    if (!text) return { type: "", label: "" };
    const t = text;
    if (/^(📷 )?Photo$/.test(t)) return { type: "photo", label: "Photo" };
    if (/^(🎥 )?Video$/.test(t)) return { type: "video", label: "Video" };
    if (/^(🎤 )?Voice message$/.test(t)) return { type: "voice", label: "Voice message" };
    if (/^🎟️?\s?Sticker$/.test(t) || t === "Sticker") return { type: "sticker", label: "Sticker" };
    if (/^🎟️\s?/.test(t)) return { type: "sticker", label: "Sticker" };
    return { type: "", label: t };
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

  const archivedChats = chats.filter((c) => c.archived?.[user?.uid]);
  const visibleChats = chats.filter((c) => {
    if (!!c.archived?.[user?.uid] !== showArchived) return false;
    const other = getOther(c);
    const dispName = c.isGroup ? c.name : other?.displayName;
    const matchesSearch = !search || dispName?.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filter === "all" || (c.unread?.[user?.uid] || 0) > 0;
    const matchesFolder = !activeFolder || c.folders?.[user?.uid] === activeFolder;
    return matchesSearch && matchesFilter && matchesFolder;
  });

  if (loading) {
    return (
      <div className="h-full flex flex-col bg-[var(--bg)]">
        <div className="px-4 pt-4 pb-3 bg-[var(--card)] border-b border-[var(--border)]">
          <div className="skel h-7 w-24 mb-3" />
          <div className="skel h-10 w-full rounded-full mb-3" />
          <div className="flex gap-2">
            <div className="skel h-7 w-14 rounded-full" />
            <div className="skel h-7 w-16 rounded-full" />
          </div>
        </div>
        <ChatListSkeleton />
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
            onClick={() => router.push("/new-group")}
            className="w-9 h-9 rounded-full flex items-center justify-center text-[var(--heading)] active:bg-[var(--surface)]"
          >
            <UsersIcon size={19} />
          </button>
        </div>

        <div
          onClick={() => router.push("/search")}
          className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-[var(--surface)] mb-3 cursor-pointer"
        >
          <SearchIcon size={16} className="text-[var(--muted)] shrink-0" />
          <span className="text-sm text-[var(--muted)]">Search...</span>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-0.5" style={{ scrollbarWidth: "none" }}>
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
          {folders.map((fl) => (
            <button
              key={fl}
              onClick={() => setActiveFolder(activeFolder === fl ? "" : fl)}
              className={`px-4 py-1.5 rounded-full text-xs font-medium border transition whitespace-nowrap ${
                activeFolder === fl
                  ? "bg-[#4c56af] text-white border-[#4c56af]"
                  : "bg-[var(--card)] text-[var(--text2)] border-[var(--outline)]"
              }`}
            >
              📁 {fl}
            </button>
          ))}
          <button
            onClick={addFolder}
            className="px-3 py-1.5 rounded-full text-xs font-medium border border-dashed border-[var(--outline)] text-[var(--muted)] whitespace-nowrap"
          >
            + Folder
          </button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-2 py-2 pb-24">
        {!showArchived && archivedChats.length > 0 && (
          <button
            onClick={() => setShowArchived(true)}
            className="w-full flex items-center gap-3 p-3 rounded-xl text-[var(--muted)] active:bg-[var(--surface2)] mb-1"
          >
            <span className="w-12 h-12 rounded-full bg-[var(--surface2)] flex items-center justify-center">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect width="20" height="5" x="2" y="3" rx="1" /><path d="M4 8v11a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8" /><path d="M10 12h4" />
              </svg>
            </span>
            <span className="text-sm font-medium">Archived</span>
            <span className="ml-auto text-xs">{archivedChats.length}</span>
          </button>
        )}
        {showArchived && (
          <button
            onClick={() => setShowArchived(false)}
            className="w-full text-left px-3 py-2 text-xs text-[#0088cc] font-medium mb-1"
          >
            ← Back to chats
          </button>
        )}

        {visibleChats.length === 0 && (
          <div className="text-center py-12 px-4">
            <p className="text-[var(--muted)] text-sm">No chats yet</p>
            <button
              onClick={() => router.push("/contacts")}
              className="mt-3 px-5 py-2 rounded-[10px] bg-[#0088cc] text-white text-xs font-medium"
            >
              Find contacts
            </button>
          </div>
        )}

        {visibleChats.map((c, idx) => {
          const other = getOther(c);
          const disp = chatDisplay(c);
          const unreadCount = c.unread?.[user?.uid] || 0;
          const mine = c.lastMessage?.senderId === user?.uid;
          const active = c.id === activeChatId;
          const isPinned = !!c.pinned?.[user?.uid];
          return (
            <div
              key={c.id}
              onClick={() => router.push(`/chats/${c.id}`)}
              onTouchStart={() => {
                pressTimer.current = setTimeout(() => setSheetFor(c), 550);
              }}
              onTouchMove={() => clearTimeout(pressTimer.current)}
              onTouchEnd={() => clearTimeout(pressTimer.current)}
              style={{ animationDelay: `${Math.min(idx * 35, 300)}ms` }}
              className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition mb-1 border list-in active:scale-[0.985] ${
                active
                  ? "bg-[var(--active)] border-l-[3px] border-l-[#0088cc] border-y-transparent border-r-transparent"
                  : "bg-[var(--card)] border-transparent hover:border-[var(--border)] active:bg-[var(--surface2)]"
              }`}
            >
              <div className="relative w-12 h-12 shrink-0">
                {!disp.isGroup && other?.photoURL ? (
                  <img src={other.photoURL} alt="" className="w-12 h-12 rounded-full object-cover" />
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
                  <p className={`text-[15px] truncate ${unreadCount ? "font-bold text-[var(--heading)]" : "font-semibold text-[var(--text)]"}`}>{disp.name}</p>
                  <p className={`text-[11px] shrink-0 ml-2 ${unreadCount ? "text-[#00b0ff] font-medium" : "text-[var(--muted)]"}`}>
                    {formatTime(c.lastMessage?.timestamp)}
                  </p>
                </div>
                <div className="flex justify-between items-center">
                  <p className={`text-[13px] truncate ${unreadCount ? "text-[var(--text)] font-medium" : "text-[var(--text2)]"}`}>
                    {c.typing?.[getOther(c)?.uid || ""] ? (
                      <span className="text-[#0088cc]">typing...</span>
                    ) : c.lastMessage ? (
                      (() => {
                        const pp = previewParts(c.lastMessage.text);
                        return (
                          <>
                            {mine ? "You: " : ""}
                            {pp.type && <PreviewIcon type={pp.type} />}
                            {pp.label}
                          </>
                        );
                      })()
                    ) : (
                      "Start chatting"
                    )}
                  </p>
                  <span className="flex items-center gap-1.5 ml-2 shrink-0">
                    {isPinned && (
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" className="text-[var(--muted)]">
                        <path d="M16 3a1 1 0 0 1 .7 1.7L15 6.4l1.8 5.3 2.5.9a1 1 0 0 1 .3 1.7l-3.4 3.4-4.9 4.9a1 1 0 0 1-1.4-1.4l3.4-3.4-4.2-1.5-2.4 2.4a1 1 0 1 1-1.4-1.4l2.4-2.4L6.2 9.6a1 1 0 0 1 .3-1.7l2.5-.9L10.7 5 9 4.7A1 1 0 0 1 9.3 3H16z" transform="rotate(40 12 12)" />
                      </svg>
                    )}
                    {unreadCount > 0 && (
                      <span className="min-w-5 h-5 px-1.5 rounded-full bg-[#00b0ff] text-white text-[10px] font-bold flex items-center justify-center">
                        {unreadCount}
                      </span>
                    )}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Long-press action sheet */}
      {sheetFor && (
        <div className="fixed inset-0 z-40" onClick={() => setSheetFor(null)}>
          <div className="absolute inset-0 bg-black/35 backdrop-in" style={{ backdropFilter: "blur(2px)" }} />
          <div
            onClick={(e) => e.stopPropagation()}
            className="absolute bottom-0 left-0 right-0 bg-[var(--card)] rounded-t-[28px] px-4 pt-3 pb-6 panel-up max-w-[500px] mx-auto shadow-[0_-8px_32px_rgba(0,0,0,0.18)]"
          >
            <div className="w-10 h-1 rounded-full bg-[var(--outline)] mx-auto mb-4" />
            <p className="text-center text-[15px] font-semibold text-[var(--text)] mb-4 truncate px-4">
              {chatDisplay(sheetFor).name}
            </p>

            {(() => {
              const isPinned = !!sheetFor.pinned?.[user?.uid];
              const isArchived = !!sheetFor.archived?.[user?.uid];
              const SheetRow = ({ icon, label, onClick, delay, danger }: any) => (
                <button
                  onClick={onClick}
                  className={`w-full flex items-center gap-4 px-3 py-3 rounded-2xl active:bg-[var(--surface)] transition row-in ${
                    danger ? "text-[#ba1a1a]" : "text-[var(--text)]"
                  }`}
                  style={{ animationDelay: `${delay}ms` }}
                >
                  <span className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                    danger ? "bg-[#ba1a1a]/10" : "bg-[var(--active)]"
                  }`}>
                    {icon}
                  </span>
                  <span className="text-[14.5px] font-medium">{label}</span>
                </button>
              );

              return (
                <>
                  <SheetRow
                    delay={40}
                    icon={
                      <svg width="17" height="17" viewBox="0 0 24 24" fill={isPinned ? "#0088cc" : "none"} stroke="#0088cc" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 17v5" /><path d="M9 10.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V7a1 1 0 0 1 1-1 2 2 0 0 0 0-4H8a2 2 0 0 0 0 4 1 1 0 0 1 1 1z" />
                      </svg>
                    }
                    label={isPinned ? "Unpin chat" : "Pin chat"}
                    onClick={() => togglePin(sheetFor)}
                  />
                  <SheetRow
                    delay={75}
                    icon={
                      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#0088cc" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect width="20" height="5" x="2" y="3" rx="1" /><path d="M4 8v11a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8" /><path d="M10 12h4" />
                      </svg>
                    }
                    label={isArchived ? "Unarchive chat" : "Archive chat"}
                    onClick={() => toggleArchive(sheetFor)}
                  />
                  {folders.length > 0 && (
                    <div className="px-3 py-2.5 row-in" style={{ animationDelay: "110ms" }}>
                      <p className="text-[11px] text-[var(--muted)] mb-2 font-medium ml-14">MOVE TO FOLDER</p>
                      <div className="flex gap-2 flex-wrap ml-14">
                        {folders.map((fl) => (
                          <button
                            key={fl}
                            onClick={() => assignFolder(sheetFor, fl)}
                            className={`px-3.5 py-1.5 rounded-full text-[11.5px] font-medium border transition ${
                              sheetFor.folders?.[user?.uid] === fl
                                ? "bg-[#4c56af] text-white border-[#4c56af]"
                                : "bg-[var(--card)] text-[var(--text2)] border-[var(--outline)]"
                            }`}
                          >
                            {fl}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="h-px bg-[var(--border)] mx-3 my-2" />

                  <button
                    onClick={() => setSheetFor(null)}
                    className="w-full py-3.5 rounded-2xl text-[14.5px] font-medium text-[var(--text2)] bg-[var(--surface)] row-in"
                    style={{ animationDelay: "145ms" }}
                  >
                    Cancel
                  </button>
                </>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
}
