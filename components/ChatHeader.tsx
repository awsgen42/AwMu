"use client";

import { useState } from "react";
import { ArrowLeftIcon, UsersIcon, TrashIcon, CheckIcon, XIcon } from "@/components/Icons";

export default function ChatHeader({
  isGroup,
  title,
  subtitle,
  photoURL,
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
  title: string;
  subtitle: string;
  photoURL?: string;
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

  if (selectMode) {
    return (
      <header className="flex items-center gap-3 px-4 py-3 bg-[var(--card)] border-b border-[var(--border)] head-down">
        <button onClick={onCancelSelect} className="text-[var(--heading)] p-1">
          <XIcon size={22} />
        </button>
        <p className="font-semibold text-[var(--heading)] flex-1">
          {selectedCount} selected
        </p>
        <button
          onClick={onSelectAll}
          className="text-xs font-medium text-[#0088cc] border border-[#0088cc]/40 rounded-[10px] px-3 py-1.5"
        >
          {selectedCount === totalCount ? "Unselect all" : "Select all"}
        </button>
        <button
          onClick={onDeleteSelected}
          disabled={selectedCount === 0}
          className="w-9 h-9 rounded-[10px] bg-[#ba1a1a] disabled:opacity-30 flex items-center justify-center"
        >
          <TrashIcon size={17} className="text-white" />
        </button>
      </header>
    );
  }

  return (
    <header className="flex items-center gap-3 px-4 py-2.5 bg-[var(--card)] border-b border-[var(--border)] head-down relative">
      <button onClick={onBack} className="text-[var(--heading)] p-1 -ml-1">
        <ArrowLeftIcon size={22} />
      </button>

      <div className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer rounded-xl px-1 py-1 active:bg-[var(--surface)] transition">
        {!isGroup && photoURL ? (
          <img src={photoURL} alt="" className="w-10 h-10 rounded-full object-cover shrink-0" />
        ) : (
          <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold text-white shrink-0 ${isGroup ? "bg-[#4c56af]" : "bg-[#007bb9]"}`}>
            {isGroup ? <UsersIcon size={18} /> : title?.[0]?.toUpperCase() || "?"}
          </div>
        )}
        <div className="min-w-0">
          <p className="font-semibold leading-tight text-[var(--heading)] truncate">{title}</p>
          <p className="text-xs text-[#0088cc] truncate">{subtitle}</p>
        </div>
      </div>

      {/* ⋮ menu */}
      <button
        onClick={(e) => { e.stopPropagation(); setMenuOpen((m) => !m); }}
        className="w-9 h-9 rounded-[10px] flex items-center justify-center text-[var(--text2)]"
      >
        <svg width="19" height="19" viewBox="0 0 24 24" fill="currentColor">
          <circle cx="12" cy="5" r="2" /><circle cx="12" cy="12" r="2" /><circle cx="12" cy="19" r="2" />
        </svg>
      </button>

      {menuOpen && (
        <>
          <div className="fixed inset-0 z-20" onClick={() => setMenuOpen(false)} />
          <div className="absolute right-3 top-14 bg-[var(--card)] rounded-xl border border-[var(--border)] shadow-[0_8px_24px_rgba(26,35,126,0.12)] z-30 py-1.5 w-52 react-pop origin-top-right">
            <button
              onClick={() => { setMenuOpen(false); onStartSelect(); }}
              className="w-full text-left px-4 py-2.5 text-sm text-[var(--text)] hover:bg-[var(--surface)] flex items-center gap-3"
            >
              <CheckIcon size={16} className="text-[var(--text2)]" /> Select messages
            </button>
            <button
              onClick={() => { setMenuOpen(false); onDeleteAll(); }}
              className="w-full text-left px-4 py-2.5 text-sm text-[#ba1a1a] hover:bg-[var(--surface)] flex items-center gap-3"
            >
              <TrashIcon size={16} /> Delete all messages
            </button>
          </div>
        </>
      )}
    </header>
  );
}
