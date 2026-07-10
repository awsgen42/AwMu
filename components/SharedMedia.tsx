"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, query, orderBy, limit, getDocs } from "firebase/firestore";
import VoiceBubble from "@/components/VoiceBubble";

export default function SharedMedia({
  chatId,
  myUid,
}: {
  chatId: string;
  myUid: string;
}) {
  const [tab, setTab] = useState<"media" | "voice" | "links" | "starred">("media");
  const [msgs, setMsgs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewImage, setViewImage] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const qs = await getDocs(
          query(
            collection(db, "chats", chatId, "messages"),
            orderBy("timestamp", "desc"),
            limit(500)
          )
        );
        const list: any[] = [];
        qs.forEach((d) => {
          const m = { id: d.id, ...d.data() } as any;
          if (!m.deleted) list.push(m);
        });
        setMsgs(list);
      } catch {}
      setLoading(false);
    })();
  }, [chatId]);

  const extractLinks = (text: string) =>
    (text || "").match(/https?:\/\/[^\s]+/g) || [];

  const media = msgs.filter((m) => m.type === "image" || m.type === "video");
  const voice = msgs.filter((m) => m.type === "voice");
  const links = msgs.flatMap((m) =>
    m.type === "text" ? extractLinks(m.text).map((url) => ({ url, id: m.id + url })) : []
  );
  const starred = msgs.filter((m) => m.starredBy?.includes(myUid));

  const TABS = [
    { key: "media", label: "Media", count: media.length },
    { key: "voice", label: "Voice", count: voice.length },
    { key: "links", label: "Links", count: links.length },
    { key: "starred", label: "Starred", count: starred.length },
  ] as const;

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <span className="w-5 h-5 border-2 border-[#0088cc]/30 border-t-[#0088cc] rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="bg-[var(--card)] rounded-2xl border border-[var(--border)] overflow-hidden mt-4 fade-up">
      {/* Tabs */}
      <div className="flex border-b border-[var(--border)]">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex-1 py-3 text-[12px] font-medium transition ${
              tab === t.key
                ? "text-[#0088cc] border-b-2 border-[#0088cc]"
                : "text-[var(--muted)]"
            }`}
          >
            {t.label}
            {t.count > 0 && <span className="ml-1 opacity-60">({t.count})</span>}
          </button>
        ))}
      </div>

      <div className="p-3 min-h-[120px]">
        {/* MEDIA GRID */}
        {tab === "media" &&
          (media.length === 0 ? (
            <Empty text="No photos or videos" />
          ) : (
            <div className="grid grid-cols-3 gap-1.5">
              {media.map((m) => (
                <div
                  key={m.id}
                  className="relative aspect-square rounded-lg overflow-hidden bg-[var(--surface)] cursor-pointer active:opacity-80"
                  onClick={() => m.type === "image" && setViewImage(m.image)}
                >
                  {m.type === "image" ? (
                    <img src={m.image} alt="" loading="lazy" className="w-full h-full object-cover" />
                  ) : (
                    <>
                      <video src={m.video} preload="metadata" className="w-full h-full object-cover" />
                      <span className="absolute inset-0 flex items-center justify-center bg-black/25">
                        <span className="w-8 h-8 rounded-full bg-black/50 flex items-center justify-center">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="white" className="ml-0.5">
                            <path d="M8 5.5a1 1 0 0 1 1.54-.84l10 6.5a1 1 0 0 1 0 1.68l-10 6.5A1 1 0 0 1 8 18.5v-13z" />
                          </svg>
                        </span>
                      </span>
                    </>
                  )}
                </div>
              ))}
            </div>
          ))}

        {/* VOICE LIST */}
        {tab === "voice" &&
          (voice.length === 0 ? (
            <Empty text="No voice messages" />
          ) : (
            <div className="space-y-2">
              {voice.map((m) => (
                <div key={m.id} className="bg-[var(--surface)] rounded-xl px-3 py-1">
                  <VoiceBubble src={m.audio} duration={m.duration || 0} mine={false} msgId={m.id} />
                </div>
              ))}
            </div>
          ))}

        {/* LINKS */}
        {tab === "links" &&
          (links.length === 0 ? (
            <Empty text="No links shared" />
          ) : (
            <div className="space-y-2">
              {links.map((l) => (
                <a
                  key={l.id}
                  href={l.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block bg-[var(--surface)] rounded-xl px-4 py-3 active:bg-[var(--surface2)]"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-9 h-9 rounded-lg bg-[var(--active)] flex items-center justify-center shrink-0">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0088cc" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                        <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                      </svg>
                    </span>
                    <div className="min-w-0">
                      <p className="text-[13px] text-[#0088cc] truncate">{l.url}</p>
                      <p className="text-[11px] text-[var(--muted)] truncate">{new URL(l.url).hostname}</p>
                    </div>
                  </div>
                </a>
              ))}
            </div>
          ))}

        {/* STARRED */}
        {tab === "starred" &&
          (starred.length === 0 ? (
            <Empty text="No starred messages — long-press a message and tap ★" />
          ) : (
            <div className="space-y-2">
              {starred.map((m) => (
                <div key={m.id} className="bg-[var(--surface)] rounded-xl px-4 py-3">
                  <div className="flex items-start gap-2">
                    <span className="text-[#f5a623] text-sm shrink-0">★</span>
                    <div className="min-w-0 flex-1">
                      {m.type === "image" ? (
                        <img src={m.image} alt="" className="rounded-lg max-h-32 cursor-pointer" onClick={() => setViewImage(m.image)} />
                      ) : m.type === "voice" ? (
                        <VoiceBubble src={m.audio} duration={m.duration || 0} mine={false} msgId={m.id} />
                      ) : m.type === "sticker" ? (
                        <p className="text-4xl">{m.sticker}</p>
                      ) : (
                        <p className="text-[13px] text-[var(--text)] break-words">{m.text}</p>
                      )}
                      <p className="text-[10px] text-[var(--muted)] mt-1">
                        {m.timestamp?.toDate?.()?.toLocaleDateString("en-US", { day: "numeric", month: "short" }) || ""}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ))}
      </div>

      {/* Fullscreen viewer */}
      {viewImage && (
        <div
          onClick={() => setViewImage(null)}
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4 viewer-in"
        >
          <img src={viewImage} alt="" className="max-w-full max-h-full rounded-lg viewer-img" />
        </div>
      )}
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return <p className="text-center text-[12px] text-[var(--muted)] py-8">{text}</p>;
}
