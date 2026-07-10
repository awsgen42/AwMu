"use client";

import { useState } from "react";
import { ArrowLeftIcon, UsersIcon, TrashIcon, CheckIcon, XIcon } from "@/components/Icons";

function TypingDots() {
  return (
    <span className="inline-flex items-center gap-[3px] ml-1">
      {[0, 1, 2].map((i) => (
        <span key={i} className="w-[4px] h-[4px] rounded-full bg-[#0088cc] dot-bounce" style={{ animationDelay: `${i * 150}ms` }} />
      ))}
    </span>
  );
}

export default function ChatHeader({
  isGroup, otherUid, title, subtitle, photoURL, online, typing,
  muted, disappearing,
  onBack, onViewContact, onSearch, onMedia, onMute, onDisappearing,
  onStartSelect, onExport, onImport, onTheme, onDeleteAll,
  selectMode, selectedCount, totalCount, onCancelSelect, onSelectAll, onDeleteSelected,
}: {
  isGroup: boolean;
  otherUid?: string;
  title: string;
  subtitle: string;
  photoURL?: string;
  online?: boolean;
  typing?: boolean;
  muted?: boolean;
  disappearing?: boolean;
  onBack: () => void;
  onViewContact?: () => void;
  onSearch?: () => void;
  onMedia?: () => void;
  onMute?: () => void;
  onDisappearing?: () => void;
  onStartSelect: () => void;
  onExport?: () => void;
  onImport?: () => void;
  onTheme?: (t: string) => void;
  onDeleteAll: () => void;
  selectMode: boolean;
  selectedCount: number;
  totalCount: number;
  onCancelSelect: () => void;
  onSelectAll: () => void;
  onDeleteSelected: () => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);

  const THEMES = [
    { key: "azure", c: "#0088cc" },
    { key: "sunset", c: "#ff6b35" },
    { key: "forest", c: "#00a86b" },
    { key: "royal", c: "#7b2ff7" },
    { key: "rose", c: "#e91e8c" },
    { key: "night", c: "#00d4ff" },
  ];

  const Item = ({ label, hint, onClick, delay, danger }: any) => (
    <button
      onClick={() => { setMenuOpen(false); onClick?.(); }}
      className={`w-full text-left px-5 py-3.5 text-[14.5px] hover:bg-[var(--surface)] active:bg-[var(--surface2)] transition menu-item flex items-center justify-between ${
        danger ? "text-[#ba1a1a]" : "text-[var(--text)]"
      }`}
      style={{ animationDelay: `${delay}ms` }}
    >
      {label}
      {hint && <span className="text-[11px] text-[var(--muted)]">{hint}</span>}
    </button>
  );

  if (selectMode) {
    return (
      <header className="flex items-center gap-3 px-4 h-[60px] bg-[var(--card)]/85 backdrop-blur-xl border-b border-[var(--border)] select-in">
        <button onClick={onCancelSelect} className="w-9 h-9 rounded-full flex items-center justify-center text-[var(--heading)] active:bg-[var(--surface)]">
          <XIcon size={20} />
        </button>
        <div className="flex-1">
          <p key={selectedCount} className="font-semibold text-[var(--heading)] leading-tight count-bounce inline-block">{selectedCount}</p>
          <p className="text-[11px] text-[var(--muted)] leading-tight">selected</p>
        </div>
        <button onClick={onSelectAll} className="text-xs font-medium text-[#0088cc] bg-[var(--active)] rounded-full px-3.5 py-2">
          {selectedCount === totalCount ? "Unselect all" : "Select all"}
        </button>
        <button
          onClick={onDeleteSelected}
          disabled={selectedCount === 0}
          className="w-10 h-10 rounded-full bg-[#ba1a1a] disabled:opacity-30 flex items-center justify-center shadow-[0_2px_8px_rgba(186,26,26,0.35)] transition"
        >
          <TrashIcon size={17} className="text-white" />
        </button>
      </header>
    );
  }

  return (
    <header className="flex items-center gap-1.5 px-2.5 h-[60px] bg-[var(--card)]/85 backdrop-blur-xl border-b border-[var(--border)] head-down relative z-10">
      <button onClick={onBack} className="w-9 h-9 rounded-full flex items-center justify-center text-[var(--heading)] active:bg-[var(--surface)] shrink-0 back-slide">
        <ArrowLeftIcon size={21} />
      </button>

      <div
        onClick={() => { if (!isGroup && otherUid) onViewContact?.(); }}
        className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer rounded-2xl pl-1 pr-2 py-1.5 active:bg-[var(--surface)] transition"
      >
        <div className="relative shrink-0 avatar-pop">
          <div className={`w-[42px] h-[42px] rounded-full p-[2px] ${online && !isGroup ? "bg-gradient-to-tr from-[#00c853] to-[#00e676] ring-pulse" : "bg-transparent"}`}>
            {!isGroup && photoURL ? (
              <img src={photoURL} alt="" className="w-full h-full rounded-full object-cover border-2 border-[var(--card)]" />
            ) : (
              <div className={`w-full h-full rounded-full flex items-center justify-center font-semibold text-white border-2 border-[var(--card)] ${isGroup ? "bg-gradient-to-br from-[#4c56af] to-[#27308a]" : "bg-gradient-to-br from-[#00a2e8] to-[#006193]"}`}>
                {isGroup ? <UsersIcon size={17} /> : title?.[0]?.toUpperCase() || "?"}
              </div>
            )}
          </div>
        </div>

        <div className="min-w-0">
          <p className="font-semibold text-[15px] leading-tight text-[var(--heading)] truncate title-in flex items-center gap-1.5">
            {title}
            {muted && (
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--muted)] shrink-0">
                <path d="M6.7 6.7C4.5 8.2 3 10.4 3 13v3l-2 2h13" /><path d="M13.7 3.3A6 6 0 0 1 21 9v4l2 2" /><path d="M10 21a2 2 0 0 0 4 0" /><path d="m2 2 20 20" />
              </svg>
            )}
            {disappearing && (
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#0088cc] shrink-0">
                <circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" />
              </svg>
            )}
          </p>
          <p
            key={typing ? "typing" : online ? "online" : "offline"}
            className={`text-[12px] leading-tight truncate sub-swap ${typing ? "text-[#0088cc] font-medium" : online && !isGroup ? "text-[#00c853]" : "text-[var(--muted)]"}`}
          >
            {subtitle}
            {typing && <TypingDots />}
          </p>
        </div>
      </div>

      <button
        onClick={(e) => { e.stopPropagation(); setMenuOpen((m) => !m); }}
        className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 transition ${menuOpen ? "bg-[var(--surface)] text-[var(--heading)]" : "text-[var(--text2)] active:bg-[var(--surface)]"}`}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
          <circle cx="12" cy="5" r="1.9" /><circle cx="12" cy="12" r="1.9" /><circle cx="12" cy="19" r="1.9" />
        </svg>
      </button>

      {menuOpen && (
        <>
          <div className="fixed inset-0 z-20" onClick={() => setMenuOpen(false)} />
          <div className="absolute right-3 top-[54px] bg-[var(--card)] rounded-2xl border border-[var(--border)] shadow-[0_16px_48px_rgba(0,0,0,0.25)] z-30 py-2 w-[240px] react-pop origin-top-right overflow-hidden">
            {!isGroup && <Item label="View contact" onClick={onViewContact} delay={30} />}
            <Item label="Search" onClick={onSearch} delay={55} />
            {!isGroup && <Item label="Media, links & docs" onClick={onMedia} delay={80} />}
            <Item label={muted ? "Unmute notifications" : "Mute notifications"} onClick={onMute} delay={105} />
            <Item
              label="Disappearing messages"
              hint={disappearing ? "On · 24h" : "Off"}
              onClick={onDisappearing}
              delay={130}
            />

            <div className="h-px bg-[var(--border)] mx-4 my-1.5" />

            <Item label="Select messages" onClick={onStartSelect} delay={155} />
            <Item label="Export chat" onClick={onExport} delay={180} />
            <Item label="Import chat (.txt)" onClick={onImport} delay={195} />

            <div className="px-5 py-3 menu-item" style={{ animationDelay: "205ms" }}>
              <p className="text-[11px] text-[var(--muted)] mb-2 font-medium">Chat theme</p>
              <div className="flex gap-2">
                {THEMES.map((t) => (
                  <button
                    key={t.key}
                    onClick={() => { onTheme?.(t.key); setMenuOpen(false); }}
                    className="w-7 h-7 rounded-full border-2 border-[var(--card)] shadow active:scale-90 transition"
                    style={{ background: t.c }}
                  />
                ))}
              </div>
            </div>

            <div className="h-px bg-[var(--border)] mx-4 my-1.5" />

            <Item label="Delete all messages" onClick={onDeleteAll} delay={230} danger />
          </div>
        </>
      )}
    </header>
  );
}
