"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import {
  doc, getDoc, setDoc, onSnapshot, serverTimestamp, updateDoc,
  collection, addDoc, query, orderBy, limit, getDocs,
} from "firebase/firestore";
import { removeContact, setBlocked, setFavorite, sendRequest } from "@/lib/contacts";
import { askConfirm } from "@/components/ConfirmModal";
import {
  ArrowLeftIcon, MessageIcon, SearchIcon, StarIcon, BlockIcon, UserMinusIcon, VerifiedIcon,
} from "@/components/Icons";
import SharedMedia from "@/components/SharedMedia";
import { ProfileSkeleton } from "@/components/Skeletons";

export default function ProfilePage() {
  const router = useRouter();
  const params = useParams();
  const uid = params.uid as string;

  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [contact, setContact] = useState<any>(null);
  const [chatDoc, setChatDoc] = useState<any>(null);
  const [mediaPreview, setMediaPreview] = useState<any[]>([]);
  const [mediaCount, setMediaCount] = useState(0);
  const [showFullMedia, setShowFullMedia] = useState(false);
  const [msg, setMsg] = useState("");

  const chatId = user ? [user.uid, uid].sort().join("_") : "";

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

      const cid = [u.uid, uid].sort().join("_");
      cleanups.push(
        onSnapshot(doc(db, "chats", cid), (snap) => {
          setChatDoc(snap.exists() ? snap.data() : null);
        }, () => {})
      );

      // Media preview — recent 4
      (async () => {
        try {
          const qs = await getDocs(
            query(collection(db, "chats", cid, "messages"), orderBy("timestamp", "desc"), limit(200))
          );
          const media: any[] = [];
          qs.forEach((d) => {
            const m = d.data() as any;
            if (!m.deleted && (m.type === "image" || m.type === "video")) media.push({ id: d.id, ...m });
          });
          setMediaCount(media.length);
          setMediaPreview(media.slice(0, 4));
        } catch {}
      })();
    });

    return () => {
      cleanups.forEach((fn) => fn());
      unsub();
    };
  }, [uid, router]);

  const openChat = async () => {
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

  const toggleMute = async () => {
    if (!chatDoc) return;
    const cur = !!chatDoc.mutedBy?.includes(user.uid);
    const list = chatDoc.mutedBy || [];
    await updateDoc(doc(db, "chats", chatId), {
      mutedBy: cur ? list.filter((x: string) => x !== user.uid) : [...list, user.uid],
    }).catch(() => {});
  };

  const reportUser = async () => {
    const reason = prompt("Reason for report (spam, harassment, fake account...):");
    if (!reason?.trim()) return;
    await addDoc(collection(db, "reports"), {
      reportedUid: uid,
      reportedBy: user.uid,
      reason: reason.trim(),
      createdAt: serverTimestamp(),
    }).catch(() => {});
    alert("Report submitted. Thank you.");
  };

  const formatLastSeen = (ts: any) => {
    if (!ts?.toDate) return "";
    const d = ts.toDate();
    const today = new Date();
    const time = d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
    if (d.toDateString() === today.toDateString()) return `last seen today at ${time}`;
    return `last seen ${d.toLocaleDateString("en-US", { day: "numeric", month: "short" })}`;
  };

  const isContact = contact && !contact.blocked;
  const isBlocked = contact?.blocked;
  const isMuted = !!chatDoc?.mutedBy?.includes(user?.uid);
  const starredCount = 0; // SharedMedia me detail

  const Tile = ({ icon, label, onClick, active }: any) => (
    <button
      onClick={onClick}
      className={`flex-1 flex flex-col items-center gap-2 py-4 rounded-2xl border transition active:scale-[0.97] ${
        active
          ? "border-[#f5a623] text-[#f5a623]"
          : "border-[var(--outline)] text-[#0088cc]"
      }`}
    >
      {icon}
      <span className="text-[12.5px] font-medium">{label}</span>
    </button>
  );

  const Row = ({ icon, title, subtitle, onClick, right, danger, delay = 0 }: any) => (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-4 px-5 py-4 text-left active:bg-[var(--surface)] transition list-in ${
        danger ? "text-[#ba1a1a]" : "text-[var(--text)]"
      }`}
      style={{ animationDelay: `${delay}ms` }}
    >
      <span className="w-9 flex items-center justify-center shrink-0 text-[var(--text2)]">{icon}</span>
      <span className="flex-1 min-w-0">
        <span className="block text-[15px] leading-tight">{title}</span>
        {subtitle && <span className="block text-[12px] text-[var(--muted)] mt-0.5">{subtitle}</span>}
      </span>
      {right}
    </button>
  );

  if (!profile) {
    return (
      <main style={{ height: "100dvh", overflowY: "auto", overscrollBehavior: "contain" }} className="bg-[var(--bg)]">
        <ProfileSkeleton />
      </main>
    );
  }

  return (
    <main style={{ height: "100dvh", overflowY: "auto", overscrollBehavior: "contain" }} className="bg-[var(--bg)] pb-10">
      {/* Floating header */}
      <div className="flex items-center justify-between px-4 py-3 sticky top-0 z-10 bg-[var(--bg)]/80 backdrop-blur">
        <button onClick={() => router.back()} className="w-9 h-9 rounded-full flex items-center justify-center text-[var(--heading)] active:bg-[var(--surface)] back-slide">
          <ArrowLeftIcon size={22} />
        </button>
      </div>

      {/* Hero — centered avatar */}
      <div className="flex flex-col items-center px-6 -mt-2 fade-up">
        {profile.photoURL ? (
          <img src={profile.photoURL} alt="" className="w-32 h-32 rounded-full object-cover avatar-pop" />
        ) : (
          <div className="w-32 h-32 rounded-full bg-gradient-to-br from-[#00a2e8] to-[#006193] flex items-center justify-center font-bold text-5xl text-white avatar-pop">
            {profile.displayName?.[0]?.toUpperCase() || "?"}
          </div>
        )}
        <p className="font-bold text-[24px] text-[var(--text)] mt-4 flex items-center gap-2 title-in">
          {profile.displayName}
          {profile.verified && <VerifiedIcon size={19} />}
        </p>
        <p className="text-[15px] text-[var(--muted)] mt-0.5 row-in" style={{ animationDelay: "0.1s" }}>
          @{profile.username || "—"}
        </p>
        <p className="text-[12px] text-[var(--muted)] mt-1 row-in" style={{ animationDelay: "0.15s" }}>
          {profile.online && !profile.privacy?.hideOnline
            ? "online"
            : profile.privacy?.hideLastSeen
            ? ""
            : formatLastSeen(profile.lastSeen)}
        </p>
        {profile.bio && (
          <p className="text-[13.5px] text-[var(--text2)] text-center mt-3 max-w-[300px] row-in" style={{ animationDelay: "0.2s" }}>
            {profile.bio}
          </p>
        )}
        {msg && <p className="text-xs text-[#0088cc] mt-2">{msg}</p>}

        {/* Action tiles */}
        {isContact ? (
          <div className="flex gap-3 w-full max-w-[400px] mt-6 row-in" style={{ animationDelay: "0.25s" }}>
            <Tile icon={<MessageIcon size={20} />} label="Message" onClick={openChat} />
            <Tile icon={<SearchIcon size={20} />} label="Search" onClick={() => router.push(`/search?chat=${chatId}`)} />
            <Tile
              icon={<StarIcon size={20} filled={contact?.favorite} />}
              label={contact?.favorite ? "Favorited" : "Favorite"}
              active={contact?.favorite}
              onClick={() => {
                setContact({ ...contact, favorite: !contact.favorite });
                setFavorite(user.uid, uid, !contact.favorite);
              }}
            />
          </div>
        ) : isBlocked ? (
          <button
            onClick={() => setBlocked(user.uid, uid, false)}
            className="mt-6 px-8 py-3 rounded-full border border-[var(--outline)] text-[var(--text2)] text-sm font-medium"
          >
            Unblock
          </button>
        ) : (
          <button
            onClick={async () => {
              try {
                await sendRequest(user.uid, uid);
                setMsg("Request sent ✓");
              } catch (e: any) {
                setMsg(e.message);
              }
            }}
            className="mt-6 px-8 py-3 rounded-full text-white text-sm font-semibold ripple"
            style={{ background: "linear-gradient(135deg, #00a2e8, #006193)", boxShadow: "0 6px 18px rgba(0,136,204,0.35)" }}
          >
            Add Contact
          </button>
        )}
      </div>

      {/* Media preview strip */}
      {isContact && mediaCount > 0 && !showFullMedia && (
        <div className="mt-8 px-5 fade-up">
          <button
            onClick={() => setShowFullMedia(true)}
            className="w-full flex items-center justify-between mb-3"
          >
            <span className="text-[14px] text-[var(--text2)]">Media, links, and docs</span>
            <span className="text-[13px] text-[var(--muted)] flex items-center gap-1">
              {mediaCount} <span>›</span>
            </span>
          </button>
          <div className="flex gap-2 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
            {mediaPreview.map((m) => (
              <div key={m.id} className="w-24 h-24 rounded-xl overflow-hidden bg-[var(--surface)] shrink-0">
                {m.type === "image" ? (
                  <img src={m.image} alt="" loading="lazy" className="w-full h-full object-cover" />
                ) : (
                  <video src={m.video} preload="metadata" className="w-full h-full object-cover" />
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Full media gallery */}
      {isContact && showFullMedia && (
        <div className="mt-6 px-4">
          <SharedMedia chatId={chatId} myUid={user.uid} />
        </div>
      )}

      {/* Rows */}
      {isContact && (
        <div className="bg-[var(--card)] mt-8 border-y border-[var(--border)]">
          <Row
            icon={<StarIcon size={19} />}
            title="Starred messages"
            right={<span className="text-[var(--muted)]">›</span>}
            delay={40}
            onClick={() => setShowFullMedia(true)}
          />
          <Row
            icon={
              <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" /><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
              </svg>
            }
            title={isMuted ? "Unmute notifications" : "Mute notifications"}
            subtitle={isMuted ? "Muted" : undefined}
            delay={70}
            onClick={toggleMute}
          />
        </div>
      )}

      <div className="bg-[var(--card)] mt-3 border-y border-[var(--border)]">
        {isContact && (
          <>
            <Row
              icon={<BlockIcon size={19} />}
              title={`Block ${profile.displayName}`}
              danger
              delay={100}
              onClick={async () => {
                const ok = await askConfirm({ title: "Block", message: `Block ${profile.displayName}? They won't be able to message you.`, confirmText: "Block", danger: true });
                if (ok) setBlocked(user.uid, uid, true);
              }}
            />
            <Row
              icon={<UserMinusIcon size={19} />}
              title="Remove contact"
              danger
              delay={130}
              onClick={async () => {
                const ok = await askConfirm({ message: "Remove contact?", danger: true, confirmText: "Remove" });
                if (ok) {
                  removeContact(user.uid, uid);
                  router.push("/contacts");
                }
              }}
            />
          </>
        )}
        <Row
          icon={
            <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" /><line x1="4" x2="4" y1="22" y2="15" />
            </svg>
          }
          title={`Report ${profile.displayName}`}
          danger
          delay={160}
          onClick={reportUser}
        />
      </div>
    </main>
  );
}
