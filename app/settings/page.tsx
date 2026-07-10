"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { compressImage } from "@/lib/imageUtils";
import { validUsername, cleanUsername, isAvailable, claimUsername } from "@/lib/username";
import { askConfirm } from "@/components/ConfirmModal";
import { ArrowLeftIcon } from "@/components/Icons";
import { SettingsSkeleton } from "@/components/Skeletons";

const RowIcon = ({ children }: { children: React.ReactNode }) => (
  <span className="w-9 flex items-center justify-center shrink-0 text-[var(--text2)]">
    {children}
  </span>
);

function Row({ icon, title, subtitle, onClick, right, delay = 0, danger }: any) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-4 px-5 py-4 text-left active:bg-[var(--surface)] transition list-in ${
        danger ? "text-[#ba1a1a]" : "text-[var(--text)]"
      }`}
      style={{ animationDelay: `${delay}ms` }}
    >
      <RowIcon>{icon}</RowIcon>
      <span className="flex-1 min-w-0">
        <span className="block text-[15.5px] leading-tight">{title}</span>
        {subtitle && (
          <span className="block text-[12.5px] text-[var(--muted)] leading-tight mt-0.5 truncate">
            {subtitle}
          </span>
        )}
      </span>
      {right}
    </button>
  );
}

function Toggle({ on }: { on: boolean }) {
  return (
    <span className={`tgl w-11 h-6 rounded-full relative shrink-0 ${on ? "bg-[#0088cc]" : "bg-[var(--outline)]"}`}>
      <span
        className="tgl-knob absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-sm"
        style={{ transform: on ? "translateX(20px)" : "translateX(0)" }}
      />
    </span>
  );
}

const I = {
  privacy: <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="11" x="3" y="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>,
  chats: <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/></svg>,
  notif: <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>,
  storage: <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 1 1-9-9"/><path d="M21 3v9h-9"/></svg>,
  devices: <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect width="14" height="20" x="5" y="2" rx="2"/><path d="M12 18h.01"/></svg>,
  moon: <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>,
  logout: <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/></svg>,
  chevron: <span className="text-[var(--muted)]">›</span>,
};

export default function SettingsPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [editOpen, setEditOpen] = useState(false);
  const [openSection, setOpenSection] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [email, setEmail] = useState("");
  const [photo, setPhoto] = useState("");
  const [uname, setUname] = useState("");
  const [origUname, setOrigUname] = useState("");
  const [unameErr, setUnameErr] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [uploading, setUploading] = useState(false);
  const photoRef = useRef<HTMLInputElement>(null);

  const [dark, setDark] = useState(false);
  const [privacy, setPrivacy] = useState({ hideLastSeen: false, hideOnline: false, hideReadReceipts: false });
  const [autoLogout, setAutoLogout] = useState(0);
  const [notifStatus, setNotifStatus] = useState<string>("default");
  const [storageUsed, setStorageUsed] = useState<string>("...");

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
        setEmail(d.email || u.email || "");
        setPhoto(d.photoURL || "");
        setUname(d.username || "");
        setOrigUname(d.username || "");
        setPrivacy({ hideLastSeen: false, hideOnline: false, hideReadReceipts: false, ...(d.privacy || {}) });
      }
      setLoading(false);
    });

    setDark(document.documentElement.classList.contains("dark"));
    try { setAutoLogout(Number(localStorage.getItem("awmu-autologout") || 0)); } catch {}
    if (typeof Notification !== "undefined") setNotifStatus(Notification.permission);

    (async () => {
      try {
        if (navigator.storage?.estimate) {
          const est = await navigator.storage.estimate();
          setStorageUsed(`${((est.usage || 0) / (1024 * 1024)).toFixed(1)} MB used`);
        } else setStorageUsed("—");
      } catch { setStorageUsed("—"); }
    })();

    return () => unsub();
  }, [router]);

  const toggleTheme = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    try { localStorage.setItem("awmu-theme", next ? "dark" : "light"); } catch {}
  };

  const togglePrivacy = async (key: string) => {
    if (!user) return;
    const next = { ...privacy, [key]: !(privacy as any)[key] };
    setPrivacy(next);
    await updateDoc(doc(db, "users", user.uid), { privacy: next }).catch(() => {});
  };

  const setAutoLogoutMins = (mins: number) => {
    setAutoLogout(mins);
    try { localStorage.setItem("awmu-autologout", String(mins)); } catch {}
  };

  const askNotifications = async () => {
    if (typeof Notification === "undefined") return;
    const p = await Notification.requestPermission();
    setNotifStatus(p);
  };

  const clearCache = async () => {
    const ok = await askConfirm({
      title: "Clear local cache",
      message: "Your chats will NOT be deleted — only local cache is cleared, then the app reloads.",
      confirmText: "Clear",
      danger: true,
    });
    if (!ok) return;
    try {
      const dbs = await (indexedDB as any).databases?.() || [];
      dbs.forEach((d: any) => d.name && indexedDB.deleteDatabase(d.name));
      location.reload();
    } catch {}
  };

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
        setUnameErr("3-20 chars, letters/numbers/underscore only");
        setSaving(false);
        return;
      }
      if (!(await isAvailable(newU))) {
        setUnameErr(`@${newU} is already taken`);
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

  const inputCls =
    "w-full mt-1 mb-3 px-4 py-3 rounded-xl bg-[var(--surface)] text-[var(--text)] placeholder-[var(--muted)] outline-none focus:ring-2 focus:ring-[#0088cc] text-sm";

  if (loading) {
    return (
      <main style={{ height: "100dvh", overflowY: "auto", overscrollBehavior: "contain" }} className="bg-[var(--bg)]">
        <header className="flex items-center gap-3 px-4 py-3 bg-[var(--card)] border-b border-[var(--border)]">
          <button onClick={() => router.push("/chats")} className="text-[var(--heading)] p-1">
            <ArrowLeftIcon size={22} />
          </button>
          <h1 className="text-lg font-semibold text-[var(--heading)]">Settings</h1>
        </header>
        <SettingsSkeleton />
      </main>
    );
  }

  return (
    <main style={{ height: "100dvh", overflowY: "auto", overscrollBehavior: "contain" }} className="bg-[var(--bg)] pb-10">
      <header className="flex items-center gap-3 px-4 py-3 bg-[var(--card)] border-b border-[var(--border)] sticky top-0 z-10 head-down">
        <button onClick={() => router.push("/chats")} className="text-[var(--heading)] p-1 back-slide">
          <ArrowLeftIcon size={22} />
        </button>
        <h1 className="text-lg font-semibold text-[var(--heading)]">Settings</h1>
      </header>

      {/* ===== Profile header — WhatsApp style ===== */}
      <div className="bg-[var(--card)] border-b border-[var(--border)]">
        <button
          onClick={() => setEditOpen(!editOpen)}
          className="w-full flex items-center gap-4 px-5 py-5 active:bg-[var(--surface)] transition"
        >
          <input ref={photoRef} type="file" accept="image/*" onChange={uploadPhoto} className="hidden" />
          <span
            onClick={(e) => { e.stopPropagation(); photoRef.current?.click(); }}
            className="relative shrink-0 avatar-pop"
          >
            {photo ? (
              <img src={photo} alt="" className="w-16 h-16 rounded-full object-cover" />
            ) : (
              <span className="w-16 h-16 rounded-full bg-[#007bb9] flex items-center justify-center font-bold text-2xl text-white">
                {name?.[0]?.toUpperCase() || "?"}
              </span>
            )}
            {uploading && (
              <span className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center">
                <span className="w-4 h-4 border-2 border-white/50 border-t-white rounded-full animate-spin" />
              </span>
            )}
          </span>
          <span className="flex-1 min-w-0 text-left title-in">
            <span className="block font-semibold text-[17px] text-[var(--text)] truncate">{name}</span>
            <span className="block text-[13px] text-[var(--muted)] truncate mt-0.5">
              {bio || "Hey! I'm using AwMu"}
            </span>
            <span className="block text-[12px] text-[#0088cc] mt-0.5">@{origUname || "—"}</span>
          </span>
          <span className={`text-[var(--muted)] transition-transform ${editOpen ? "rotate-90" : ""}`}>›</span>
        </button>

        {/* Edit panel — expand */}
        {editOpen && (
          <div className="px-5 pb-5 panel-up">
            <label className="text-[11px] uppercase tracking-widest text-[var(--muted)] font-medium">Username</label>
            <div className="relative mt-1 mb-1">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--muted)] text-sm">@</span>
              <input
                value={uname}
                onChange={(e) => setUname(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))}
                maxLength={20}
                className="w-full pl-9 pr-4 py-3 rounded-xl bg-[var(--surface)] text-[var(--text)] outline-none focus:ring-2 focus:ring-[#0088cc] text-sm"
              />
            </div>
            {unameErr && <p className="text-[#ba1a1a] text-xs mb-2">{unameErr}</p>}
            <div className="mb-2" />

            <label className="text-[11px] uppercase tracking-widest text-[var(--muted)] font-medium">Name</label>
            <input value={name} onChange={(e) => setName(e.target.value)} maxLength={30} className={inputCls} />

            <label className="text-[11px] uppercase tracking-widest text-[var(--muted)] font-medium">Bio</label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              maxLength={100}
              rows={2}
              className={inputCls + " resize-none"}
            />

            <button
              onClick={save}
              disabled={saving || !name.trim()}
              className="w-full py-3 rounded-[10px] bg-[#0088cc] text-white font-medium disabled:opacity-50 ripple"
            >
              {saving ? "Saving..." : saved ? "Saved ✓" : "Save changes"}
            </button>
            <p className="text-[11px] text-[var(--muted)] text-center mt-2">{email}</p>
          </div>
        )}
      </div>

      {/* ===== Rows — WhatsApp style ===== */}
      <div className="bg-[var(--card)] mt-3 border-y border-[var(--border)]">
        <Row
          icon={I.privacy}
          title="Privacy"
          subtitle="Last seen, online status, read receipts"
          right={I.chevron}
          delay={40}
          onClick={() => setOpenSection(openSection === "privacy" ? null : "privacy")}
        />
        {openSection === "privacy" && (
          <div className="pb-2 panel-up">
            {([
              { key: "hideLastSeen", label: "Hide last seen" },
              { key: "hideOnline", label: "Hide online status" },
              { key: "hideReadReceipts", label: "Hide read receipts (✓✓)" },
            ] as const).map((row) => (
              <button
                key={row.key}
                onClick={() => togglePrivacy(row.key)}
                className="w-full pl-[72px] pr-5 py-3 flex justify-between items-center active:bg-[var(--surface)]"
              >
                <span className="text-[14px] text-[var(--text)]">{row.label}</span>
                <Toggle on={(privacy as any)[row.key]} />
              </button>
            ))}
          </div>
        )}

        <Row
          icon={I.devices}
          title="Security"
          subtitle="Devices, sessions, auto logout"
          right={I.chevron}
          delay={70}
          onClick={() => setOpenSection(openSection === "security" ? null : "security")}
        />
        {openSection === "security" && (
          <div className="pb-3 panel-up">
            <button
              onClick={() => router.push("/devices")}
              className="w-full pl-[72px] pr-5 py-3 flex justify-between items-center active:bg-[var(--surface)]"
            >
              <span className="text-[14px] text-[var(--text)]">Devices & Sessions</span>
              {I.chevron}
            </button>
            <div className="pl-[72px] pr-5 py-2">
              <p className="text-[13px] text-[var(--text)] mb-2">Auto logout (inactivity)</p>
              <div className="flex gap-2">
                {[0, 5, 15, 60].map((m) => (
                  <button
                    key={m}
                    onClick={() => setAutoLogoutMins(m)}
                    className={`px-3 py-1.5 rounded-full text-[11px] font-medium border transition ${
                      autoLogout === m ? "bg-[#0088cc] text-white border-[#0088cc]" : "bg-[var(--card)] text-[var(--text2)] border-[var(--outline)]"
                    }`}
                  >
                    {m === 0 ? "Off" : `${m}m`}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        <Row
          icon={I.chats}
          title="Chats"
          subtitle="Theme & wallpapers — via ⋮ menu inside a chat"
          delay={100}
          onClick={() => {}}
        />

        <Row
          icon={I.notif}
          title="Notifications"
          subtitle={notifStatus === "granted" ? "On" : notifStatus === "denied" ? "Blocked — allow in browser settings" : "Off — tap to enable"}
          delay={130}
          onClick={askNotifications}
          right={notifStatus === "granted" ? <span className="text-[#00c853] text-xs font-medium">✓</span> : I.chevron}
        />

        <Row
          icon={I.storage}
          title="Storage and data"
          subtitle={storageUsed}
          right={I.chevron}
          delay={160}
          onClick={() => setOpenSection(openSection === "storage" ? null : "storage")}
        />
        {openSection === "storage" && (
          <div className="pb-2 panel-up">
            <button
              onClick={clearCache}
              className="w-full pl-[72px] pr-5 py-3 text-left active:bg-[var(--surface)]"
            >
              <span className="text-[14px] text-[var(--text)]">Clear local cache</span>
              <p className="text-[11px] text-[var(--muted)]">Chats won't be deleted</p>
            </button>
          </div>
        )}

        <Row
          icon={I.moon}
          title="Dark mode"
          subtitle={dark ? "On" : "Off"}
          right={<Toggle on={dark} />}
          delay={190}
          onClick={toggleTheme}
        />
      </div>

      <div className="bg-[var(--card)] mt-3 border-y border-[var(--border)]">
        <Row
          icon={I.logout}
          title="Logout"
          delay={220}
          danger
          onClick={async () => {
            const ok = await askConfirm({ title: "Logout", message: "Log out of AwMu?", confirmText: "Logout", danger: true });
            if (ok) signOut(auth).then(() => router.replace("/"));
          }}
        />
      </div>

      <p className="text-center text-[11px] text-[var(--muted)] mt-6">
        AwMu 2.0 · Made with 💙 · Aw + Mu
      </p>
    </main>
  );
}
