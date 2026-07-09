"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import {
  collection, onSnapshot, query, where, doc, getDoc, setDoc, serverTimestamp,
} from "firebase/firestore";
import { findByUsername, cleanUsername } from "@/lib/username";
import { sendRequest, acceptRequest, declineRequest, removeContact, setBlocked, setFavorite } from "@/lib/contacts";
import { ArrowLeftIcon, SearchIcon, CheckIcon, XIcon, StarIcon, BlockIcon, UserMinusIcon, UnlockIcon, VerifiedIcon } from "@/components/Icons";

export default function ContactsPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [tab, setTab] = useState<"contacts" | "requests">("contacts");
  const [search, setSearch] = useState("");
  const [searchResult, setSearchResult] = useState<any>(null);
  const [searchMsg, setSearchMsg] = useState("");
  const [searching, setSearching] = useState(false);
  const [incoming, setIncoming] = useState<any[]>([]);
  const [outgoing, setOutgoing] = useState<any[]>([]);
  const [contacts, setContacts] = useState<any[]>([]);
  const [profiles, setProfiles] = useState<any>({});
  const [menuFor, setMenuFor] = useState<string | null>(null);

  useEffect(() => {
    let cleanups: (() => void)[] = [];

    const unsub = onAuthStateChanged(auth, (u) => {
      cleanups.forEach((fn) => fn());
      cleanups = [];
      if (!u) {
        router.replace("/");
        return;
      }
      setUser(u);

      // Sab profiles (naam/photo dikhane ke liye)
      cleanups.push(
        onSnapshot(collection(db, "users"), (qs) => {
          const map: any = {};
          qs.forEach((d) => (map[d.id] = { uid: d.id, ...d.data() }));
          setProfiles(map);
        }, () => {})
      );

      // Meri contact list
      cleanups.push(
        onSnapshot(collection(db, "users", u.uid, "contacts"), (qs) => {
          const list: any[] = [];
          qs.forEach((d) => list.push({ uid: d.id, ...d.data() }));
          setContacts(list);
        }, () => {})
      );

      // Incoming requests
      cleanups.push(
        onSnapshot(query(collection(db, "requests"), where("to", "==", u.uid)), (qs) => {
          const list: any[] = [];
          qs.forEach((d) => list.push({ id: d.id, ...d.data() }));
          setIncoming(list);
        }, () => {})
      );

      // Outgoing requests
      cleanups.push(
        onSnapshot(query(collection(db, "requests"), where("from", "==", u.uid)), (qs) => {
          const list: any[] = [];
          qs.forEach((d) => list.push({ id: d.id, ...d.data() }));
          setOutgoing(list);
        }, () => {})
      );
    });

    return () => {
      cleanups.forEach((fn) => fn());
      unsub();
    };
  }, [router]);

  const doSearch = async () => {
    setSearchMsg("");
    setSearchResult(null);
    const uname = cleanUsername(search);
    if (!uname) return;
    setSearching(true);
    const found = await findByUsername(uname);
    setSearching(false);
    if (!found) {
      setSearchMsg(`@${uname} nahi mila`);
    } else if (found.uid === user?.uid) {
      setSearchMsg("Yeh to aap khud ho 😄");
    } else {
      setSearchResult(found);
    }
  };

  const request = async (toUid: string) => {
    try {
      await sendRequest(user.uid, toUid);
      setSearchMsg("Request bhej di ✓");
      setSearchResult(null);
      setSearch("");
    } catch (e: any) {
      setSearchMsg(e.message);
    }
  };

  const openChat = async (otherUid: string) => {
    const chatId = [user.uid, otherUid].sort().join("_");
    const ref = doc(db, "chats", chatId);
    const snap = await getDoc(ref);
    if (!snap.exists()) {
      await setDoc(ref, {
        participants: [user.uid, otherUid],
        lastMessage: null,
        unread: { [user.uid]: 0, [otherUid]: 0 },
        typing: {},
        createdAt: serverTimestamp(),
      });
    }
    router.push(`/chats/${chatId}`);
  };

  const isContact = (uid: string) => contacts.some((c) => c.uid === uid && !c.blocked);
  const P = (uid: string) => profiles[uid] || {};

  const Avatar = ({ uid, size = 12 }: { uid: string; size?: number }) => {
    const p = P(uid);
    return p.photoURL ? (
      <img src={p.photoURL} alt="" className={`w-${size} h-${size} rounded-full object-cover shrink-0`} style={{ width: size * 4, height: size * 4 }} />
    ) : (
      <div className="rounded-full bg-[#007bb9] flex items-center justify-center font-semibold text-white shrink-0" style={{ width: size * 4, height: size * 4 }}>
        {p.displayName?.[0]?.toUpperCase() || "?"}
      </div>
    );
  };

  return (
    <main className="min-h-screen bg-[var(--bg)]">
      <header className="px-4 pt-4 pb-3 bg-[var(--card)] border-b border-[var(--border)] sticky top-0 z-10 head-down">
        <div className="flex items-center gap-3 mb-3">
          <button onClick={() => router.push("/chats")} className="text-[var(--heading)] p-1">
            <ArrowLeftIcon size={22} />
          </button>
          <h1 className="text-lg font-semibold text-[var(--heading)]">Contacts</h1>
        </div>

        {/* Search by username */}
        <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-[var(--surface)] mb-3">
          <span className="text-[var(--muted)] text-sm">@</span>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))}
            onKeyDown={(e) => e.key === "Enter" && doSearch()}
            placeholder="Search by username"
            className="flex-1 bg-transparent outline-none text-sm text-[var(--text)] placeholder-[var(--muted)] min-w-0"
          />
          <button onClick={doSearch} className="text-[#0088cc]">
            {searching ? (
              <span className="block w-4 h-4 border-2 border-[#0088cc]/40 border-t-[#0088cc] rounded-full animate-spin" />
            ) : (
              <SearchIcon size={17} />
            )}
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2">
          <button
            onClick={() => setTab("contacts")}
            className={`px-4 py-1.5 rounded-full text-xs font-medium border transition ${
              tab === "contacts" ? "bg-[#0088cc] text-white border-[#0088cc]" : "bg-[var(--card)] text-[var(--text2)] border-[var(--outline)]"
            }`}
          >
            My Contacts
          </button>
          <button
            onClick={() => setTab("requests")}
            className={`px-4 py-1.5 rounded-full text-xs font-medium border transition relative ${
              tab === "requests" ? "bg-[#0088cc] text-white border-[#0088cc]" : "bg-[var(--card)] text-[var(--text2)] border-[var(--outline)]"
            }`}
          >
            Requests
            {incoming.length > 0 && (
              <span className="absolute -top-1.5 -right-1.5 min-w-4 h-4 px-1 rounded-full bg-[#00b0ff] text-white text-[9px] font-bold flex items-center justify-center">
                {incoming.length}
              </span>
            )}
          </button>
        </div>
      </header>

      <div className="max-w-[600px] mx-auto p-4 fade-up">
        {/* Search result / message */}
        {searchMsg && <p className="text-xs text-[var(--muted)] mb-3 px-1">{searchMsg}</p>}
        {searchResult && (
          <div className="flex items-center gap-3 p-3 rounded-xl bg-[var(--card)] border border-[var(--border)] mb-4">
            <Avatar uid={searchResult.uid} />
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-[15px] text-[var(--text)] truncate">{searchResult.displayName}</p>
              <p className="text-[12px] text-[#0088cc]">@{searchResult.username}</p>
            </div>
            {isContact(searchResult.uid) ? (
              <button onClick={() => openChat(searchResult.uid)} className="px-4 py-1.5 rounded-[10px] bg-[#0088cc] text-white text-xs font-medium">
                Message
              </button>
            ) : (
              <button onClick={() => request(searchResult.uid)} className="px-4 py-1.5 rounded-[10px] bg-[#0088cc] text-white text-xs font-medium">
                Add Contact
              </button>
            )}
          </div>
        )}

        {tab === "requests" ? (
          <>
            <p className="text-[var(--muted)] text-[11px] uppercase tracking-widest mb-2 px-1 font-medium">
              Incoming ({incoming.length})
            </p>
            {incoming.length === 0 && <p className="text-[var(--muted)] text-sm px-1 mb-4">Koi incoming request nahi</p>}
            {incoming.map((r) => (
              <div key={r.id} className="flex items-center gap-3 p-3 rounded-xl bg-[var(--card)] border border-[var(--border)] mb-2">
                <Avatar uid={r.from} />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-[15px] text-[var(--text)] truncate">{P(r.from).displayName || "..."}</p>
                  <p className="text-[12px] text-[#0088cc]">@{P(r.from).username || "..."}</p>
                </div>
                <button
                  onClick={() => acceptRequest(r.from, r.to)}
                  className="w-9 h-9 rounded-full bg-[#0088cc] flex items-center justify-center"
                >
                  <CheckIcon size={16} className="text-white" strokeWidth={3} />
                </button>
                <button
                  onClick={() => declineRequest(r.from, r.to)}
                  className="w-9 h-9 rounded-full bg-[var(--surface2)] flex items-center justify-center"
                >
                  <XIcon size={16} className="text-[var(--text2)]" />
                </button>
              </div>
            ))}

            <p className="text-[var(--muted)] text-[11px] uppercase tracking-widest mt-6 mb-2 px-1 font-medium">
              Outgoing ({outgoing.length})
            </p>
            {outgoing.length === 0 && <p className="text-[var(--muted)] text-sm px-1">Koi outgoing request nahi</p>}
            {outgoing.map((r) => (
              <div key={r.id} className="flex items-center gap-3 p-3 rounded-xl bg-[var(--card)] border border-[var(--border)] mb-2">
                <Avatar uid={r.to} />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-[15px] text-[var(--text)] truncate">{P(r.to).displayName || "..."}</p>
                  <p className="text-[12px] text-[#0088cc]">@{P(r.to).username || "..."}</p>
                </div>
                <button
                  onClick={() => declineRequest(r.from, r.to)}
                  className="px-3 py-1.5 rounded-[10px] border border-[var(--outline)] text-[var(--text2)] text-xs font-medium"
                >
                  Cancel
                </button>
              </div>
            ))}
          </>
        ) : (
          <>
            {(() => {
              const active = contacts.filter((c) => !c.blocked);
              const favs = active.filter((c) => c.favorite);
              const others = active.filter((c) => !c.favorite);
              const blocked = contacts.filter((c) => c.blocked);

              const Card = ({ c }: { c: any }) => (
                <div className="relative">
                  <div
                    onClick={() => openChat(c.uid)}
                    className="flex items-center gap-3 p-3 rounded-xl bg-[var(--card)] border border-transparent hover:border-[var(--border)] active:bg-[var(--surface2)] mb-1 cursor-pointer transition"
                  >
                    <div className="relative">
                      <Avatar uid={c.uid} />
                      {P(c.uid).online && (
                        <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-green-500 border-2 border-[var(--card)]" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-[15px] text-[var(--text)] truncate flex items-center gap-1.5">
                        {P(c.uid).displayName || "..."}
                        {c.favorite && <StarIcon size={13} filled className="text-[#f5a623]" />}
                        {P(c.uid).verified && <VerifiedIcon size={14} />}
                      </p>
                      <p className="text-[12px] text-[#0088cc]">@{P(c.uid).username || "..."}</p>
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); setMenuFor(menuFor === c.uid ? null : c.uid); }}
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-[var(--muted)]"
                    >
                      <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="5" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="12" cy="19" r="2"/></svg>
                    </button>
                  </div>

                  {menuFor === c.uid && (
                    <>
                      <div className="fixed inset-0 z-20" onClick={() => setMenuFor(null)} />
                      <div className="absolute right-2 top-14 bg-[var(--card)] rounded-xl border border-[var(--border)] shadow-[0_8px_24px_rgba(26,35,126,0.15)] z-30 py-1.5 w-44 react-pop origin-top-right">
                        <button
                          onClick={() => { setFavorite(user.uid, c.uid, !c.favorite); setMenuFor(null); }}
                          className="w-full text-left px-4 py-2.5 text-sm text-[var(--text)] hover:bg-[var(--surface)]"
                        >
                          <span className="flex items-center gap-2.5">
                            <StarIcon size={15} filled={c.favorite} className={c.favorite ? "text-[#f5a623]" : "text-[var(--text2)]"} />
                            {c.favorite ? "Unfavorite" : "Favorite"}
                          </span>
                        </button>
                        <button
                          onClick={() => { setBlocked(user.uid, c.uid, true); setMenuFor(null); }}
                          className="w-full text-left px-4 py-2.5 text-sm text-[var(--text)] hover:bg-[var(--surface)]"
                        >
                          <span className="flex items-center gap-2.5">
                            <BlockIcon size={15} className="text-[var(--text2)]" />
                            Block
                          </span>
                        </button>
                        <button
                          onClick={() => { if (confirm("Remove contact?")) removeContact(user.uid, c.uid); setMenuFor(null); }}
                          className="w-full text-left px-4 py-2.5 text-sm text-[#ba1a1a] hover:bg-[var(--surface)]"
                        >
                          <span className="flex items-center gap-2.5">
                            <UserMinusIcon size={15} />
                            Remove
                          </span>
                        </button>
                      </div>
                    </>
                  )}
                </div>
              );

              return (
                <>
                  {active.length === 0 && blocked.length === 0 && (
                    <div className="text-center py-10">
                      <p className="text-[var(--muted)] text-sm">Abhi koi contact nahi</p>
                      <p className="text-[var(--muted)] text-xs mt-1">Upar @username se search karke request bhejo</p>
                    </div>
                  )}

                  {favs.length > 0 && (
                    <>
                      <p className="text-[var(--muted)] text-[11px] uppercase tracking-widest mb-2 px-1 font-medium">Favorites</p>
                      {favs.map((c) => <Card key={c.uid} c={c} />)}
                    </>
                  )}

                  {others.length > 0 && (
                    <>
                      <p className="text-[var(--muted)] text-[11px] uppercase tracking-widest mt-4 mb-2 px-1 font-medium">All Contacts</p>
                      {others.map((c) => <Card key={c.uid} c={c} />)}
                    </>
                  )}

                  {blocked.length > 0 && (
                    <>
                      <p className="text-[var(--muted)] text-[11px] uppercase tracking-widest mt-4 mb-2 px-1 font-medium">Blocked</p>
                      {blocked.map((c) => (
                        <div key={c.uid} className="flex items-center gap-3 p-3 rounded-xl bg-[var(--card)] border border-[var(--border)] mb-1 opacity-60">
                          <Avatar uid={c.uid} />
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-[15px] text-[var(--text)] truncate">{P(c.uid).displayName || "..."}</p>
                            <p className="text-[12px] text-[var(--muted)]">@{P(c.uid).username || "..."}</p>
                          </div>
                          <button
                            onClick={() => setBlocked(user.uid, c.uid, false)}
                            className="px-3 py-1.5 rounded-[10px] border border-[var(--outline)] text-[var(--text2)] text-xs font-medium"
                          >
                            Unblock
                          </button>
                        </div>
                      ))}
                    </>
                  )}
                </>
              );
            })()}
          </>
        )}
      </div>
    </main>
  );
}
