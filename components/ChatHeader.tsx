"use client";

import { useState } from "react";
import { ArrowLeftIcon, UsersIcon, TrashIcon, CheckIcon, XIcon } from "@/components/Icons";

function TypingDots() {
  return (
    <span className="inline-flex items-center gap-[3px] ml-1">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="w-[4px] h-[4px] rounded-full bg-[#0088cc] dot-bounce"
          style={{ animationDelay: `${i * 150}ms` }}
        />
      ))}
    </span>
  );
}

export default function ChatHeader({
  isGroup,
  otherUid,
  title,
  subtitle,
  photoURL,
  online,
  typing,
  onBack,
  selectMode,
  selectedCount,
  totalCount,
  onStartSelect,
  onCancelSelect,
  onSelectAll,
  onDeleteSelected,
  onDeleteAll,
}: {
  isGroup: boolean;
  otherUid?: string;
  title: string;
  subtitle: string;
  photoURL?: string;
  online?: boolean;
  typing?: boolean;
  onBack: () => void;
  selectMode: boolean;
  selectedCount: number;
  totalCount: number;
  onStartSelect: () => void;
  onCancelSelect: () => void;
  onSelectAll: () => void;
  onDeleteSelected: () => void;
  onDeleteAll: () => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);

  // ===== Select mode header =====
  if (selectMode) {
    return (
      <header className="flex items-center gap-3 px-4 h-[60px] bg-[var(--card)]/85 backdrop-blur-xl border-b border-[var(--border)] select-in">
        <button
          onClick={onCancelSelect}
          className="w-9 h-9 rounded-full flex items-center justify-center text-[var(--heading)] active:bg-[var(--surface)]"
        >
          <XIcon size={20} />
        </button>
        <div className="flex-1">
          <p key={selectedCount} className="font-semibold text-[var(--heading)] leading-tight count-bounce inline-block">{selectedCount}</p>
          <p className="text-[11px] text-[var(--muted)] leading-tight">selected</p>
        </div>
        <button
          onClick={onSelectAll}
          className="text-xs font-medium text-[#0088cc] bg-[var(--active)] rounded-full px-3.5 py-2"
        >
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

  // ===== Normal header =====
  return (
    <header className="flex items-center gap-1.5 px-2.5 h-[60px] bg-[var(--card)]/85 backdrop-blur-xl border-b border-[var(--border)] head-down relative z-10">
      <button
        onClick={onBack}
        className="w-9 h-9 rounded-full flex items-center justify-center text-[var(--heading)] active:bg-[var(--surface)] shrink-0 back-slide"
      >
        <ArrowLeftIcon size={21} />
      </button>

      <div
        onClick={() => { if (!isGroup && otherUid) window.location.href = `/profile/${otherUid}`; }}
        className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer rounded-2xl pl-1 pr-2 py-1.5 active:bg-[var(--surface)] transition"
      >
        {/* Avatar with online ring */}
        <div className="relative shrink-0 avatar-pop">
          <div
            className={`w-[42px] h-[42px] rounded-full p-[2px] ${online && !isGroup ? "ring-pulse " : ""}${
              online && !isGroup
                ? "bg-gradient-to-tr from-[#00c853] to-[#00e676]"
                : "bg-transparent"
            }`}
          >
            {!isGroup && photoURL ? (
              <img
                src={photoURL}
                alt=""
                className="w-full h-full rounded-full object-cover border-2 border-[var(--card)]"
              />
            ) : (
              <div
                className={`w-full h-full rounded-full flex items-center justify-center font-semibold text-white border-2 border-[var(--card)] ${
                  isGroup
                    ? "bg-gradient-to-br from-[#4c56af] to-[#27308a]"
                    : "bg-gradient-to-br from-[#00a2e8] to-[#006193]"
                }`}
              >
                {isGroup ? <UsersIcon size={17} /> : title?.[0]?.toUpperCase() || "?"}
              </div>
            )}
          </div>
        </div>

        <div className="min-w-0">
          <p className="font-semibold text-[15px] leading-tight text-[var(--heading)] truncate title-in">
            {title}
          </p>
          <p
            key={typing ? "typing" : online ? "online" : "offline"}
            className={`text-[12px] leading-tight truncate sub-swap ${
              typing ? "text-[#0088cc] font-medium" : online && !isGroup ? "text-[#00c853]" : "text-[var(--muted)]"
            }`}
          >
            {subtitle}
            {typing && <TypingDots />}
          </p>
        </div>
      </div>

      {/* ⋮ menu */}
      <button
        onClick={(e) => { e.stopPropagation(); setMenuOpen((m) => !m); }}
        className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 transition ${
          menuOpen ? "bg-[var(--surface)] text-[var(--heading)]" : "text-[var(--text2)] active:bg-[var(--surface)]"
        }`}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
          <circle cx="12" cy="5" r="1.9" /><circle cx="12" cy="12" r="1.9" /><circle cx="12" cy="19" r="1.9" />
        </svg>
      </button>

      {menuOpen && (
        <>
          <div className="fixed inset-0 z-20" onClick={() => setMenuOpen(false)} />
          <div className="absolute right-3 top-[54px] bg-[var(--card)] rounded-2xl border border-[var(--border)] shadow-[0_12px_32px_rgba(26,35,126,0.16)] z-30 py-2 w-56 react-pop origin-top-right overflow-hidden">
            <button
              onClick={() => { setMenuOpen(false); onStartSelect(); }}
              className="w-full text-left px-4 py-3 text-[13.5px] text-[var(--text)] hover:bg-[var(--surface)] active:bg-[var(--surface2)] flex items-center gap-3 transition menu-item"
              style={{ animationDelay: "40ms" }}
            >
              <span className="w-8 h-8 rounded-lg bg-[var(--active)] flex items-center justify-center shrink-0">
                <CheckIcon size={15} className="text-[#0088cc]" />
              </span>
              Select messages
            </button>
            <div className="h-px bg-[var(--border)] mx-4 my-1" />
            <button
              onClick={() => { setMenuOpen(false); onDeleteAll(); }}
              className="w-full text-left px-4 py-3 text-[13.5px] text-[#ba1a1a] hover:bg-[var(--surface)] active:bg-[var(--surface2)] flex items-center gap-3 transition menu-item"
              style={{ animationDelay: "90ms" }}
            >
              <span className="w-8 h-8 rounded-lg bg-[#ba1a1a]/10 flex items-center justify-center shrink-0">
                <TrashIcon size={15} className="text-[#ba1a1a]" />
              </span>
              Delete all messages
            </button>
          </div>
        </>
      )}
    </header>
  );
}
