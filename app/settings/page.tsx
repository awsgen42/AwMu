"use client";
import { validUsername, cleanUsername, isAvailable, claimUsername } from "@/lib/username";
import { compressImage } from "@/lib/imageUtils";
import { useRef } from "react";

import { ArrowLeftIcon } from "@/components/Icons";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc, updateDoc } from "firebase/firestore";

export default function SettingsPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [uname, setUname] = useState("");
  const [origUname, setOrigUname] = useState("");
  const [unameErr, setUnameErr] = useState("");
  const [email, setEmail] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [dark, setDark] = useState(false);

  useEffect(() => {
    setDark(document.documentElement.classList.contains("dark"));
  }, []);

  const toggleTheme = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    try { localStorage.setItem("awmu-theme", next ? "dark" : "light"); } catch {}
  };
  const [photo, setPhoto] = useState("");
  const [uploading, setUploading] = useState(false);
  const photoRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (!u) {
        router.replace("/");
        return;
      }
      setUser(u);
      const snap = await getDoc(doc(db, "users", u.uid));
      if (snap.exists()) {
        const d = snap.data();
        setName(d.displayName || "");
        setBio(d.bio || "");
        setPhoto(d.photoURL || "");
        setEmail(d.email || u.email || "");
      }
      setLoading(false);
    });
    return () => unsub();
  }, [router]);

  const uploadPhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    e.target.value = "";
    setUploading(true);
    try {
      const dataUrl = await compressImage(file, 240);
      await updateDoc(doc(db, "users", user.uid), { photoURL: dataUrl });
      setPhoto(dataUrl);
    } catch (err: any) {
      alert(err.message);
    }
    setUploading(false);
  };

  const save = async () => {
    if (!user || !name.trim()) return;
    setUnameErr("");
    setSaving(true);

    const newU = cleanUsername(uname);
    if (newU !== origUname) {
      if (!validUsername(newU)) {
        setUnameErr("3-20 chars, sirf letters/numbers/underscore");
        setSaving(false);
        return;
      }
      if (!(await isAvailable(newU))) {
        setUnameErr(`@${newU} pehle se liya hua hai`);
        setSaving(false);
        return;
      }
      await claimUsername(user.uid, newU, origUname || null);
      setOrigUname(newU);
    }
    await updateDoc(doc(db, "users", user.uid), {
      displayName: name.trim(),
      bio: bio.trim() || "Hey! I'm using AwMu",
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-[var(--bg)] flex items-center justify-center">
        <p className="text-[var(--muted)] text-sm">Loading...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[var(--bg)]">
      <header className="flex items-center gap-3 px-4 py-3 bg-[var(--card)] border-b border-[var(--border)] sticky top-0 z-10 head-down">
        <button onClick={() => router.push("/chats")} className="text-[var(--heading)] p-1"><ArrowLeftIcon size={22} /></button>
        <h1 className="text-lg font-semibold text-[var(--heading)]">Settings</h1>
      </header>

      <div className="max-w-[600px] mx-auto p-4 fade-up">
        {/* Profile card */}
        <div className="bg-[var(--card)] rounded-2xl p-6 border border-[var(--border)] mb-4">
          <div className="flex flex-col items-center mb-6">
            <input ref={photoRef} type="file" accept="image/*" onChange={uploadPhoto} className="hidden" />
            <button onClick={() => photoRef.current?.click()} className="relative mb-2">
              {photo ? (
                <img src={photo} alt="" className="w-20 h-20 rounded-full object-cover" />
              ) : (
                <div className="w-20 h-20 rounded-full bg-[#007bb9] flex items-center justify-center font-bold text-3xl text-white">
                  {name?.[0]?.toUpperCase() || "?"}
                </div>
              )}
              <span className="absolute bottom-0 right-0 w-7 h-7 rounded-full bg-[#0088cc] border-2 border-[var(--card)] flex items-center justify-center">
                {uploading ? (
                  <span className="w-3.5 h-3.5 border-2 border-[var(--card)]/50 border-t-white rounded-full animate-spin" />
                ) : (
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" />
                    <circle cx="12" cy="13" r="3" />
                  </svg>
                )}
              </span>
            </button>
            <p className="text-[11px] text-[var(--muted)]">{email}</p>
          </div>

          <label className="text-[11px] uppercase tracking-widest text-[var(--muted)] font-medium">Username</label>
          <div className="relative mt-1 mb-1">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--muted)] text-sm">@</span>
            <input
              value={uname}
              onChange={(e) => setUname(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))}
              maxLength={20}
              placeholder="username"
              className="w-full pl-9 pr-4 py-3 rounded-xl bg-[var(--surface)] text-[var(--text)] placeholder-[var(--muted)] outline-none focus:ring-2 focus:ring-[#0088cc] text-sm"
            />
          </div>
          {unameErr && <p className="text-[#ba1a1a] text-xs mb-2">{unameErr}</p>}
          <div className="mb-3" />

          <label className="text-[11px] uppercase tracking-widest text-[var(--muted)] font-medium">Name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={30}
            placeholder="Your name"
            className="w-full mt-1 mb-4 px-4 py-3 rounded-xl bg-[var(--surface)] text-[var(--text)] placeholder-[var(--muted)] outline-none focus:ring-2 focus:ring-[#0088cc] text-sm"
          />

          <label className="text-[11px] uppercase tracking-widest text-[var(--muted)] font-medium">Bio</label>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            maxLength={100}
            rows={2}
            placeholder="Hey! I'm using AwMu"
            className="w-full mt-1 mb-1 px-4 py-3 rounded-xl bg-[var(--surface)] text-[var(--text)] placeholder-[var(--muted)] outline-none focus:ring-2 focus:ring-[#0088cc] text-sm resize-none"
          />
          <p className="text-[10px] text-[var(--muted)] text-right mb-4">{bio.length}/100</p>

          <button
            onClick={save}
            disabled={saving || !name.trim()}
            className="w-full py-3 rounded-[10px] bg-[#0088cc] text-white font-medium disabled:opacity-50 active:bg-[#006193] transition send-tap"
          >
            {saving ? "Saving..." : saved ? "Saved ✓" : "Save changes"}
          </button>
        </div>

        {/* Theme */}
        <div className="bg-[var(--card)] rounded-2xl border border-[var(--border)] overflow-hidden mb-4">
          <button
            onClick={toggleTheme}
            className="w-full px-5 py-3.5 flex justify-between items-center"
          >
            <span className="text-sm text-[var(--text)] flex items-center gap-3">
              {dark ? (
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>
              ) : (
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/></svg>
              )}
              {dark ? "Dark mode" : "Light mode"}
            </span>
            <span className={`w-11 h-6 rounded-full relative transition ${dark ? "bg-[#0088cc]" : "bg-[var(--outline)]"}`}>
              <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all ${dark ? "left-[22px]" : "left-0.5"}`} />
            </span>
          </button>
        </div>

        {/* App info */}
        <div className="bg-[var(--card)] rounded-2xl border border-[var(--border)] overflow-hidden mb-4">
          <div className="px-5 py-3.5 border-b border-[var(--border)] flex justify-between items-center">
            <span className="text-sm text-[var(--text)]">Version</span>
            <span className="text-sm text-[var(--muted)]">1.0</span>
          </div>
          <div className="px-5 py-3.5 flex justify-between items-center">
            <span className="text-sm text-[var(--text)]">Made with 💙</span>
            <span className="text-sm text-[var(--muted)]">Aw + Mu</span>
          </div>
        </div>

        <button
          onClick={() => signOut(auth).then(() => router.replace("/"))}
          className="w-full py-3 rounded-[10px] bg-[var(--card)] border border-[#ffdad6] text-[#ba1a1a] font-medium text-sm"
        >
          Logout
        </button>
      </div>
    </main>
  );
}
