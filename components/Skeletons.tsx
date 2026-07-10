"use client";

// Chat list ka skeleton — avatar + do lines, staggered
export function ChatListSkeleton() {
  return (
    <div className="px-2 py-2">
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <div
          key={i}
          className="flex items-center gap-3 p-3 mb-1 list-in"
          style={{ animationDelay: `${i * 60}ms` }}
        >
          <div className="skel skel-circle w-12 h-12 shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="flex justify-between items-center mb-2">
              <div className="skel h-3.5" style={{ width: `${45 + (i % 3) * 12}%` }} />
              <div className="skel h-2.5 w-9" />
            </div>
            <div className="skel h-3" style={{ width: `${60 + (i % 4) * 8}%` }} />
          </div>
        </div>
      ))}
    </div>
  );
}

// Chat screen ka skeleton — left/right bubbles
export function MessagesSkeleton() {
  const bubbles = [
    { mine: false, w: "55%" },
    { mine: false, w: "40%" },
    { mine: true, w: "48%" },
    { mine: false, w: "62%" },
    { mine: true, w: "35%" },
    { mine: true, w: "58%" },
    { mine: false, w: "44%" },
  ];
  return (
    <div className="flex-1 px-4 py-4 space-y-3 overflow-hidden">
      {bubbles.map((b, i) => (
        <div
          key={i}
          className={`flex ${b.mine ? "justify-end" : "justify-start"} list-in`}
          style={{ animationDelay: `${i * 55}ms` }}
        >
          <div
            className={`skel h-11 ${b.mine ? "rounded-2xl rounded-br-md" : "rounded-2xl rounded-bl-md"}`}
            style={{ width: b.w, maxWidth: "75%" }}
          />
        </div>
      ))}
    </div>
  );
}

// Contacts ka skeleton
export function ContactsSkeleton() {
  return (
    <div>
      {[0, 1, 2, 3].map((i) => (
        <div
          key={i}
          className="flex items-center gap-3 p-3 mb-1 rounded-xl bg-[var(--card)] border border-[var(--border)] list-in"
          style={{ animationDelay: `${i * 70}ms` }}
        >
          <div className="skel skel-circle w-12 h-12 shrink-0" />
          <div className="flex-1">
            <div className="skel h-3.5 w-1/2 mb-2" />
            <div className="skel h-2.5 w-1/3" />
          </div>
        </div>
      ))}
    </div>
  );
}

// Profile skeleton
export function ProfileSkeleton() {
  return (
    <div className="max-w-[500px] mx-auto p-4">
      <div className="bg-[var(--card)] rounded-2xl p-6 border border-[var(--border)] flex flex-col items-center">
        <div className="skel skel-circle w-24 h-24 mb-4" />
        <div className="skel h-4 w-32 mb-2" />
        <div className="skel h-3 w-20 mb-6" />
        <div className="skel h-11 w-full rounded-[10px]" />
      </div>
    </div>
  );
}

// Settings ka skeleton — profile header + icon rows
export function SettingsSkeleton() {
  return (
    <div>
      {/* Profile header */}
      <div className="bg-[var(--card)] border-b border-[var(--border)] px-5 py-5 flex items-center gap-4">
        <div className="skel skel-circle w-16 h-16 shrink-0" />
        <div className="flex-1">
          <div className="skel h-4 w-32 mb-2" />
          <div className="skel h-3 w-44 mb-1.5" />
          <div className="skel h-2.5 w-20" />
        </div>
      </div>

      {/* Rows */}
      <div className="bg-[var(--card)] mt-3 border-y border-[var(--border)]">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className="flex items-center gap-4 px-5 py-4 list-in"
            style={{ animationDelay: `${i * 60}ms` }}
          >
            <div className="skel skel-circle w-9 h-9 shrink-0" />
            <div className="flex-1">
              <div className="skel h-3.5 mb-1.5" style={{ width: `${30 + (i % 3) * 12}%` }} />
              <div className="skel h-2.5" style={{ width: `${50 + (i % 4) * 8}%` }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
