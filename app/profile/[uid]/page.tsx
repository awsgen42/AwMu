"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import {
  doc, getDoc, setDoc, onSnapshot, serverTimestamp,
} from "firebase/firestore";
import { removeContact, setBlocked, setFavorite, sendRequest } from "@/lib/contacts";
import {
  ArrowLeftIcon, MessageIcon, StarIcon, BlockIcon, UserMinusIcon, VerifiedIcon,
} from "@/components/Icons";

export default function ProfilePage() {
  const router = useRouter();
  const params = useParams();
  const uid = params.uid as string;

  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [contact, setContact] = useState<any>(null);
  const [msg, setMsg] = useState("");

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

      cleanups.push(
        onSnapshot(doc(db, "users", uid), (snap) => {
          if (snap.exists()) setProfile({ uid: snap.id, ...snap.data() });
        }, () => {})
      );

      cleanups.push(
        onSnapshot(doc(db, "users", u.uid, "contacts", uid), (snap) => {
          setContact(snap.exists() ? snap.data() : null);
        }, () => {})
      );
    });

    return () => {
      cleanups.forEach((fn) => fn());
      unsub();
    };
  }, [uid, router]);

  const openChat = async () => {
    const chatId = [user.uid, uid].sort().join("_");
    const ref = doc(db, "chats", chatId);
    const snap = await getDoc(ref);
    if (!snap.exists()) {
      await setDoc(ref, {
        participants: [user.uid, uid],
        lastMessage: null,
        unread: { [user.uid]: 0, [uid]: 0 },
        typing: {},
        createdAt: serverTimestamp(),
      });
    }
    router.push(`/chats/${chatId}`);
  };

  const formatLastSeen = (ts: any) => {
    if (!ts?.toDate) return "";
    const d = ts.toDate();
    const today = new Date();
    const time = d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
    if (d.toDateString() === today.toDateString()) return `last seen ${time}`;
    return `last seen ${d.toLocaleDateString("en-US", { day: "numeric", month: "short" })}`;
  };

  const isContact = contact && !contact.blocked;
  const isBlocked = contact?.blocked;

  if (!profile) {
    return (
      <main className="min-h-screen bg-[var(--bg)] flex items-center justify-center">
        <p className="text-[var(--muted)] text-sm">Loading...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[var(--bg)]">
      <header className="flex items-center gap-3 px-4 py-3 bg-[var(--card)] border-b border-[var(--border)] sticky top-0 z-10 head-down">
        <button onClick={() => router.back()} className="text-[var(--heading)] p-1">
          <ArrowLeftIcon size={22} />
        </button>
        <h1 className="text-lg font-semibold text-[var(--heading)]">Profile</h1>
      </header>

      <div className="max-w-[500px] mx-auto p-4 fade-up">
        <div className="bg-[var(--card)] rounded-2xl p-6 border border-[var(--border)] mb-4 flex flex-col items-center">
          {profile.photoURL ? (
            <img src={profile.photoURL} alt="" className="w-24 h-24 rounded-full object-cover mb-3" />
          ) : (
            <div className="w-24 h-24 rounded-full bg-[#007bb9] flex items-center justify-center font-bold text-4xl text-white mb-3">
              {profile.displayName?.[0]?.toUpperCase() || "?"}
            </div>
          )}

          <p className="font-bold text-xl text-[var(--text)] flex items-center gap-1.5">
            {profile.displayName}
            {profile.verified && <VerifiedIcon size={17} />}
          </p>
          <p className="text-sm text-[#0088cc] mb-1">@{profile.username || "—"}</p>
          <p className="text-xs text-[var(--muted)]">
            {profile.online ? "online" : formatLastSeen(profile.lastSeen)}
          </p>

          {profile.bio && (
            <p className="text-sm text-[var(--text2)] text-center mt-4 px-4">{profile.bio}</p>
          )}

          {msg && <p className="text-xs text-[#0088cc] mt-3">{msg}</p>}

          <div className="flex gap-3 mt-6 w-full">
            {isContact ? (
              <>
                <button
                  onClick={openChat}
                  className="flex-1 py-3 rounded-[10px] bg-[#0088cc] text-white text-sm font-medium flex items-center justify-center gap-2 send-tap"
                >
                  <MessageIcon size={16} /> Message
                </button>
                <button
                  onClick={() => setFavorite(user.uid, uid, !contact.favorite)}
                  className={`w-12 rounded-[10px] border flex items-center justify-center ${
                    contact.favorite ? "border-[#f5a623] text-[#f5a623]" : "border-[var(--outline)] text-[var(--text2)]"
                  }`}
                >
                  <StarIcon size={17} filled={contact.favorite} />
                </button>
              </>
            ) : isBlocked ? (
              <button
                onClick={() => setBlocked(user.uid, uid, false)}
                className="flex-1 py-3 rounded-[10px] border border-[var(--outline)] text-[var(--text2)] text-sm font-medium"
              >
                Unblock
              </button>
            ) : (
              <button
                onClick={async () => {
                  try {
                    await sendRequest(user.uid, uid);
                    setMsg("Request bhej di ✓");
                  } catch (e: any) {
                    setMsg(e.message);
                  }
                }}
                className="flex-1 py-3 rounded-[10px] bg-[#0088cc] text-white text-sm font-medium send-tap"
              >
                Add Contact
              </button>
            )}
          </div>
        </div>

        {isContact && (
          <div className="bg-[var(--card)] rounded-2xl border border-[var(--border)] overflow-hidden">
            <button
              onClick={() => setBlocked(user.uid, uid, true)}
              className="w-full px-5 py-3.5 text-left text-sm text-[var(--text)] hover:bg-[var(--surface)] flex items-center gap-3 border-b border-[var(--border)]"
            >
              <BlockIcon size={16} className="text-[var(--text2)]" /> Block
            </button>
            <button
              onClick={() => {
                if (confirm("Remove contact?")) {
                  removeContact(user.uid, uid);
                  router.push("/contacts");
                }
              }}
              className="w-full px-5 py-3.5 text-left text-sm text-[#ba1a1a] hover:bg-[var(--surface)] flex items-center gap-3"
            >
              <UserMinusIcon size={16} /> Remove contact
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
