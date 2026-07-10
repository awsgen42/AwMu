"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import {
  collection, query, where, orderBy, limit, getDocs, onSnapshot,
} from "firebase/firestore";
import { ArrowLeftIcon, SearchIcon } from "@/components/Icons";

function SearchInner() {
  const router = useRouter();
  const sp = useSearchParams();
  const chatFilter = sp.get("chat") || ""; // chat ke andar search

  const [user, setUser] = useState<any>(null);
  const [profiles, setProfiles] = useState<any>({});
  const [term, setTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | "text" | "image" | "video" | "voice">("all");
  const [senderFilter, setSenderFilter] = useState<"all" | "me" | "them">("all");
  const [dateFrom, setDateFrom] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [searched, setSearched] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      if (!u) {
        router.replace("/");
        return;
      }
      setUser(u);
      onSnapshot(collection(db, "users"), (qs) => {
        const map: any = {};
        qs.forEach((d) => (map[d.id] = { uid: d.id, ...d.data() }));
        setProfiles(map);
      }, () => {});
    });
    return () => unsub();
  }, [router]);

  const doSearch = async () => {
    if (!user) return;
    setSearching(true);
    setSearched(true);
    const found: any[] = [];

    // Kaunsi chats scan karni hain
    let chatIds: { id: string; label: string }[] = [];
    if (chatFilter) {
      chatIds = [{ id: chatFilter, label: "" }];
    } else {
      const cqs = await getDocs(
        query(collection(db, "chats"), where("participants", "array-contains", user.uid))
      );
      cqs.forEach((d) => {
        const c = d.data();
        const otherUid = c.isGroup ? null : c.participants.find((p: string) => p !== user.uid);
        chatIds.push({
          id: d.id,
          label: c.isGroup ? c.name || "Group" : profiles[otherUid]?.displayName || "Chat",
        });
      });
    }

    const termLower = term.toLowerCase();
    const fromTs = dateFrom ? new Date(dateFrom).getTime() : 0;

    for (const chat of chatIds.slice(0, 20)) {
      const mqs = await getDocs(
        query(
          collection(db, "chats", chat.id, "messages"),
          orderBy("timestamp", "desc"),
          limit(300)
        )
      );
      mqs.forEach((d) => {
        const m = { id: d.id, chatId: chat.id, chatLabel: chat.label, ...d.data() } as any;
        if (m.deleted) return;

        // Type filter
        if (typeFilter !== "all" && m.type !== typeFilter) return;
        // Sender filter
        if (senderFilter === "me" && m.senderId !== user.uid) return;
        if (senderFilter === "them" && m.senderId === user.uid) return;
        // Date filter
        const ts = m.timestamp?.toMillis?.() || 0;
        if (fromTs && ts < fromTs) return;
        // Text term (sirf text messages pe; media pe term optional)
        if (termLower) {
          if (m.type !== "text") return;
          if (!(m.text || "").toLowerCase().includes(termLower)) return;
        }

        found.push(m);
      });
    }

    found.sort((a, b) => (b.timestamp?.toMillis?.() || 0) - (a.timestamp?.toMillis?.() || 0));
    setResults(found.slice(0, 100));
    setSearching(false);
  };

  const fmtDate = (ts: any) =>
    ts?.toDate?.()?.toLocaleString("en-US", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" }) || "";

  const highlight = (text: string) => {
    if (!term) return text;
    const i = text.toLowerCase().indexOf(term.toLowerCase());
    if (i === -1) return text;
    return (
      <>
        {text.slice(Math.max(0, i - 30) === 0 ? 0 : i - 30, i)}
        <mark className="bg-[#f5a623]/40 text-inherit rounded px-0.5">{text.slice(i, i + term.length)}</mark>
        {text.slice(i + term.length, i + term.length + 60)}
      </>
    );
  };

  const CHIPS_TYPE = [
    { k: "all", l: "All" }, { k: "text", l: "Text" }, { k: "image", l: "📷 Photos" },
    { k: "video", l: "🎥 Videos" }, { k: "voice", l: "🎤 Voice" },
  ] as const;
  const CHIPS_SENDER = [
    { k: "all", l: "Anyone" }, { k: "me", l: "Me" }, { k: "them", l: "Them" },
  ] as const;

  return (
    <main style={{ height: "100dvh", overflowY: "auto", overscrollBehavior: "contain" }} className="bg-[var(--bg)]">
      <header className="px-4 pt-4 pb-3 bg-[var(--card)] border-b border-[var(--border)] sticky top-0 z-10 head-down">
        <div className="flex items-center gap-3 mb-3">
          <button onClick={() => router.back()} className="text-[var(--heading)] p-1">
            <ArrowLeftIcon size={22} />
          </button>
          <h1 className="text-lg font-semibold text-[var(--heading)]">
            {chatFilter ? "Search in chat" : "Search"}
          </h1>
        </div>

        <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-[var(--surface)] mb-3">
          <SearchIcon size={16} className="text-[var(--muted)] shrink-0" />
          <input
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && doSearch()}
            placeholder="Search messages..."
            autoFocus
            className="flex-1 bg-transparent outline-none text-sm text-[var(--text)] placeholder-[var(--muted)] min-w-0"
          />
          <button onClick={doSearch} className="text-xs font-medium text-white bg-[#0088cc] rounded-lg px-3 py-1.5">
            {searching ? "..." : "Search"}
          </button>
        </div>

        {/* Filters */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 mb-2" style={{ scrollbarWidth: "none" }}>
          {CHIPS_TYPE.map((c) => (
            <button
              key={c.k}
              onClick={() => setTypeFilter(c.k)}
              className={`px-3 py-1.5 rounded-full text-[11px] font-medium border whitespace-nowrap transition ${
                typeFilter === c.k ? "bg-[#0088cc] text-white border-[#0088cc]" : "bg-[var(--card)] text-[var(--text2)] border-[var(--outline)]"
              }`}
            >
              {c.l}
            </button>
          ))}
        </div>
        <div className="flex gap-1.5 items-center flex-wrap">
          {CHIPS_SENDER.map((c) => (
            <button
              key={c.k}
              onClick={() => setSenderFilter(c.k)}
              className={`px-3 py-1.5 rounded-full text-[11px] font-medium border transition ${
                senderFilter === c.k ? "bg-[#4c56af] text-white border-[#4c56af]" : "bg-[var(--card)] text-[var(--text2)] border-[var(--outline)]"
              }`}
            >
              {c.l}
            </button>
          ))}
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="px-3 py-1.5 rounded-full text-[11px] bg-[var(--card)] text-[var(--text2)] border border-[var(--outline)] outline-none"
          />
          {dateFrom && (
            <button onClick={() => setDateFrom("")} className="text-[11px] text-[var(--muted)]">✕</button>
          )}
        </div>
      </header>

      <div className="max-w-[600px] mx-auto p-4 fade-up">
        {!searched && (
          <p className="text-center text-[12px] text-[var(--muted)] py-10">
            Type a term or pick a filter, then tap Search.<br />
            To find media, leave the term empty and use the 📷/🎥/🎤 filters.
          </p>
        )}
        {searched && !searching && results.length === 0 && (
          <p className="text-center text-[12px] text-[var(--muted)] py-10">Kuch not found 🔍</p>
        )}
        {searching && (
          <div className="flex justify-center py-10">
            <span className="w-6 h-6 border-2 border-[#0088cc]/30 border-t-[#0088cc] rounded-full animate-spin" />
          </div>
        )}

        {results.map((m) => (
          <div
            key={m.chatId + m.id}
            onClick={() => router.push(`/chats/${m.chatId}`)}
            className="bg-[var(--card)] rounded-xl border border-[var(--border)] p-3 mb-2 cursor-pointer active:bg-[var(--surface2)]"
          >
            <div className="flex justify-between items-center mb-1">
              <p className="text-[11px] font-medium text-[#0088cc]">
                {m.senderId === user?.uid ? "Me" : profiles[m.senderId]?.displayName || "..."}
                {m.chatLabel && <span className="text-[var(--muted)]"> · {m.chatLabel}</span>}
              </p>
              <p className="text-[10px] text-[var(--muted)]">{fmtDate(m.timestamp)}</p>
            </div>
            {m.type === "text" ? (
              <p className="text-[13px] text-[var(--text)] break-words">{highlight(m.text)}</p>
            ) : m.type === "image" ? (
              <img src={m.image} alt="" loading="lazy" className="rounded-lg max-h-32" />
            ) : m.type === "video" ? (
              <p className="text-[13px] text-[var(--text2)]">🎥 Video</p>
            ) : m.type === "voice" ? (
              <p className="text-[13px] text-[var(--text2)]">🎤 Voice · {m.duration}s</p>
            ) : (
              <p className="text-2xl">{m.sticker}</p>
            )}
          </div>
        ))}
      </div>
    </main>
  );
}

export default function SearchPage() {
  return (
    <Suspense>
      <SearchInner />
    </Suspense>
  );
}
