"use client";

import { ArrowLeftIcon, CheckIcon } from "@/components/Icons";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import {
  collection, onSnapshot, addDoc, serverTimestamp,
} from "firebase/firestore";

export default function NewGroupPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [groupName, setGroupName] = useState("");
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      if (!u) {
        router.replace("/");
        return;
      }
      setUser(u);
      onSnapshot(collection(db, "users", u.uid, "contacts"), (cqs) => {
        const contactUids: string[] = [];
        cqs.forEach((d) => {
          if (!d.data().blocked) contactUids.push(d.id);
        });
        onSnapshot(collection(db, "users"), (qs) => {
          const list: any[] = [];
          qs.forEach((d) => {
            if (contactUids.includes(d.id)) list.push({ uid: d.id, ...d.data() });
          });
          setUsers(list);
        });
      });
    });
    return () => unsub();
  }, [router]);

  const toggle = (uid: string) => {
    setSelected((s) =>
      s.includes(uid) ? s.filter((x) => x !== uid) : [...s, uid]
    );
  };

  const createGroup = async () => {
    if (!groupName.trim() || selected.length < 1 || !user) return;
    setCreating(true);

    const participants = [user.uid, ...selected];
    const unread: any = {};
    participants.forEach((p) => (unread[p] = 0));

    const ref = await addDoc(collection(db, "chats"), {
      isGroup: true,
      name: groupName.trim(),
      participants,
      admins: [user.uid],
      createdBy: user.uid,
      lastMessage: null,
      unread,
      typing: {},
      createdAt: serverTimestamp(),
    });

    router.replace(`/chats/${ref.id}`);
  };

  return (
    <main className="min-h-screen bg-[var(--bg)]">
      <header className="flex items-center gap-3 px-4 py-3 bg-[var(--card)] border-b border-[var(--border)] sticky top-0 z-10 head-down">
        <button onClick={() => router.push("/chats")} className="text-[var(--heading)] p-1"><ArrowLeftIcon size={22} /></button>
        <h1 className="text-lg font-semibold text-[var(--heading)]">New Group</h1>
      </header>

      <div className="max-w-[600px] mx-auto p-4 fade-up">
        <div className="bg-[var(--card)] rounded-2xl p-5 border border-[var(--border)] mb-4">
          <label className="text-[11px] uppercase tracking-widest text-[var(--muted)] font-medium">Group name</label>
          <input
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
            maxLength={40}
            placeholder="e.g. Family, Friends, Trading Squad..."
            className="w-full mt-1 px-4 py-3 rounded-xl bg-[var(--surface)] text-[var(--text)] placeholder-[var(--muted)] outline-none focus:ring-2 focus:ring-[#0088cc] text-sm"
          />
        </div>

        <p className="text-[var(--muted)] text-[11px] uppercase tracking-widest mb-2 px-1 font-medium">
          Add members ({selected.length} selected)
        </p>

        <div className="bg-[var(--card)] rounded-2xl border border-[var(--border)] overflow-hidden mb-4">
          {users.length === 0 && (
            <p className="text-[var(--muted)] text-sm text-center py-8">Add contacts first — groups are made from your contacts</p>
          )}
          {users.map((x) => {
            const isSel = selected.includes(x.uid);
            return (
              <div
                key={x.uid}
                onClick={() => toggle(x.uid)}
                className="flex items-center gap-3 px-4 py-3 border-b border-[var(--border)] last:border-0 cursor-pointer active:bg-[var(--surface)]"
              >
                {x.photoURL ? (
                  <img src={x.photoURL} alt="" className="w-11 h-11 rounded-full object-cover shrink-0" />
                ) : (
                  <div className="w-11 h-11 rounded-full bg-[#007bb9] flex items-center justify-center font-semibold text-white shrink-0">
                    {x.displayName?.[0]?.toUpperCase() || "?"}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-[15px] text-[var(--text)] truncate">{x.displayName}</p>
                  <p className="text-[13px] text-[var(--text2)] truncate">{x.bio}</p>
                </div>
                <div
                  className={`w-6 h-6 rounded-md border-2 flex items-center justify-center shrink-0 transition ${
                    isSel ? "bg-[#0088cc] border-[#0088cc]" : "border-[var(--outline)]"
                  }`}
                >
                  {isSel && <CheckIcon size={14} className="text-white" strokeWidth={3} />}
                </div>
              </div>
            );
          })}
        </div>

        <button
          onClick={createGroup}
          disabled={creating || !groupName.trim() || selected.length < 1}
          className="w-full py-3 rounded-[10px] bg-[#0088cc] text-white font-medium disabled:opacity-40 active:bg-[#006193] transition send-tap"
        >
          {creating ? "Creating..." : `Create Group ${selected.length > 0 ? `(${selected.length + 1} members)` : ""}`}
        </button>
      </div>
    </main>
  );
}
