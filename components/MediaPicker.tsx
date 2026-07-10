"use client";

import { useEffect, useState, useRef } from "react";
import { auth, db } from "@/lib/firebase";
import { collection, onSnapshot, addDoc, deleteDoc, doc, serverTimestamp } from "firebase/firestore";
import { compressImage } from "@/lib/imageUtils";

const GIPHY_KEY = process.env.NEXT_PUBLIC_GIPHY_KEY || "";
const GIPHY = "https://api.giphy.com/v1";

const EMOJI_CATS = [
  { icon: "😀", list: "😀😃😄😁😆😅😂🤣🥲😊😇🙂🙃😉😌😍🥰😘😗😙😚😋😛😝😜🤪🤨🧐🤓😎🥸🤩🥳😏😒😞😔😟😕🙁😣😖😫😩🥺😢😭😤😠😡🤬🤯😳🥵🥶😱😨😰😥😓🫣🤗🫡🤔🫢🤭🤫🤥😶😐😑😬🫠🙄😯😦😧😮😲🥱😴🤤😪😮‍💨😵🤐🥴🤢🤮🤧😷🤒🤕🤑🤠😈👿" },
  { icon: "❤️", list: "❤️🧡💛💚💙💜🖤🤍🤎💔❤️‍🔥❤️‍🩹💕💞💓💗💖💘💝💟♥️🫶💋👄" },
  { icon: "👋", list: "👋🤚🖐️✋🖖👌🤌🤏✌️🤞🫰🤟🤘🤙👈👉👆🖕👇☝️🫵👍👎✊👊🤛🤜👏🙌🫶👐🤲🤝🙏✍️💪🦾" },
  { icon: "🐶", list: "🐶🐱🐭🐹🐰🦊🐻🐼🐻‍❄️🐨🐯🦁🐮🐷🐸🐵🙈🙉🙊🐒🐔🐧🐦🐤🦆🦅🦉🦇🐺🐗🐴🦄🐝🪱🐛🦋🐌🐞🐜🪰🪲🪳🦟🦗🕷️🐢🐍🦎🦖🦕🐙🦑🦐🦞🦀🐡🐠🐟🐬🐳🐋🦈🐊" },
  { icon: "🍔", list: "🍏🍎🍐🍊🍋🍌🍉🍇🍓🫐🍈🍒🍑🥭🍍🥥🥝🍅🍆🥑🥦🥬🥒🌶️🫑🌽🥕🫒🧄🧅🥔🍠🥐🥯🍞🥖🥨🧀🥚🍳🧈🥞🧇🥓🥩🍗🍖🦴🌭🍔🍟🍕🫓🥪🌮🌯🫔🥙🧆🥘🍲🫕🥣🥗🍿🧂🥫🍱🍘🍙🍚🍛🍜🍝🍢🍣🍤🍥🥮🍡🥟🥠🥡🦪🍦🍧🍨🍩🍪🎂🍰🧁🥧🍫🍬🍭🍮🍯" },
  { icon: "⚽", list: "⚽🏀🏈⚾🥎🎾🏐🏉🥏🎱🪀🏓🏸🏒🏑🥍🏏🪃🥅⛳🪁🏹🎣🤿🥊🥋🎽🛹🛼🛷⛸️🥌🎿⛷️🏂🪂🏋️🤼🤸⛹️🤺🤾🏌️🏇🧘🏄🏊🤽🚣🧗🚵🚴🏆🥇🥈🥉🏅🎖️🏵️🎗️🎫🎟️🎪🤹🎭🩰🎨🎬🎤🎧🎼🎹🥁🪘🎷🎺🪗🎸🪕🎻🎲♟️🎯🎳🎮🎰🧩" },
];

export default function MediaPicker({
  onEmoji,
  onGif,
  onSticker,
}: {
  onEmoji: (e: string) => void;
  onGif: (url: string) => void;
  onSticker: (url: string) => void;
  onCreateSticker?: () => void;
}) {
  const [tab, setTab] = useState<"emoji" | "gif" | "sticker">("emoji");
  const [emojiCat, setEmojiCat] = useState(0);
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [myStickers, setMyStickers] = useState<any[]>([]);
  const [toast, setToast] = useState("");
  const debounce = useRef<any>(null);
  const pressTimer = useRef<any>(null);
  const photoRef = useRef<HTMLInputElement>(null);

  // My stickers — Firestore se
  useEffect(() => {
    const u = auth.currentUser;
    if (!u) return;
    const unsub = onSnapshot(collection(db, "users", u.uid, "stickers"), (qs) => {
      const list: any[] = [];
      qs.forEach((d) => list.push({ id: d.id, ...d.data() }));
      list.sort((a, b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0));
      setMyStickers(list);
    }, () => {});
    return () => unsub();
  }, []);

  const showToast = (t: string) => {
    setToast(t);
    setTimeout(() => setToast(""), 1600);
  };

  const saveSticker = async (url: string) => {
    const u = auth.currentUser;
    if (!u) return;
    if (myStickers.some((st) => st.url === url)) {
      showToast("Already in your pack");
      return;
    }
    await addDoc(collection(db, "users", u.uid, "stickers"), {
      url,
      createdAt: serverTimestamp(),
    }).catch(() => {});
    if (navigator.vibrate) navigator.vibrate(20);
    showToast("Saved to My Stickers ✓");
  };

  const removeSticker = async (id: string) => {
    const u = auth.currentUser;
    if (!u) return;
    await deleteDoc(doc(db, "users", u.uid, "stickers", id)).catch(() => {});
    showToast("Removed");
  };

  const photoSticker = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    try {
      const dataUrl = await compressImage(file, 300);
      await saveSticker(dataUrl);
    } catch (err: any) {
      showToast(err.message);
    }
  };

  const fetchGiphy = async (type: "gif" | "sticker", term: string) => {
    if (!GIPHY_KEY) return;
    setLoading(true);
    try {
      const kind = type === "sticker" ? "stickers" : "gifs";
      const url = term
        ? `${GIPHY}/${kind}/search?api_key=${GIPHY_KEY}&q=${encodeURIComponent(term)}&limit=48&rating=g`
        : `${GIPHY}/${kind}/trending?api_key=${GIPHY_KEY}&limit=48&rating=g`;
      const res = await fetch(url);
      const data = await res.json();
      setResults(data.data || []);
    } catch {}
    setLoading(false);
  };

  useEffect(() => {
    if (tab === "gif" || tab === "sticker") {
      fetchGiphy(tab, search);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  const onSearchChange = (v: string) => {
    setSearch(v);
    clearTimeout(debounce.current);
    if (tab !== "emoji") {
      debounce.current = setTimeout(() => fetchGiphy(tab as any, v), 400);
    }
  };

  const gifUrl = (r: any) => r.images?.fixed_width?.url || r.images?.original?.url;

  return (
    <div className="bg-[var(--card)] border-t border-[var(--border)] panel-up relative" style={{ height: 330 }}>
      {toast && (
        <div className="absolute top-2 left-1/2 -translate-x-1/2 z-20 px-4 py-1.5 rounded-full bg-[var(--heading)] text-[var(--card)] text-[11px] font-medium react-pop">
          {toast}
        </div>
      )}

      <div className="flex items-center gap-3 px-4 pt-3 pb-2">
        <div className="flex-1 flex items-center gap-2 px-3.5 py-2 rounded-full bg-[var(--surface)]">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="text-[var(--muted)] shrink-0">
            <circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" />
          </svg>
          <input
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={tab === "emoji" ? "Search emoji" : tab === "gif" ? "Search GIFs" : "Search stickers"}
            className="flex-1 bg-transparent outline-none text-[13px] text-[var(--text)] placeholder-[var(--muted)] min-w-0"
          />
        </div>
        <div className="flex rounded-full border border-[var(--outline)] overflow-hidden">
          {([
            { k: "emoji", label: "😊" },
            { k: "gif", label: "GIF" },
            { k: "sticker", label: "🏷️" },
          ] as const).map((t) => (
            <button
              key={t.k}
              onClick={() => { setTab(t.k); setSearch(""); setResults([]); }}
              className={`px-4 py-1.5 text-[12px] font-bold transition ${
                tab === t.k ? "bg-[var(--active)] text-[#0088cc]" : "text-[var(--muted)]"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-y-auto px-3 pb-3" style={{ height: 258 }}>
        {tab === "emoji" && (
          <>
            <div className="flex gap-1 mb-2 sticky top-0 bg-[var(--card)] py-1 z-10">
              {EMOJI_CATS.map((c, i) => (
                <button
                  key={i}
                  onClick={() => setEmojiCat(i)}
                  className={`px-3 py-1 rounded-full text-base transition ${
                    emojiCat === i ? "bg-[var(--active)] scale-110" : "opacity-50"
                  }`}
                >
                  {c.icon}
                </button>
              ))}
            </div>
            <div className="grid grid-cols-8 gap-0.5">
              {[...EMOJI_CATS[emojiCat].list].filter((e) => e.trim()).map((e, i) => (
                <button
                  key={i}
                  onClick={() => onEmoji(e)}
                  className="text-[22px] p-1.5 rounded-lg active:bg-[var(--surface)] active:scale-125 transition"
                >
                  {e}
                </button>
              ))}
            </div>
          </>
        )}

        {(tab === "gif" || tab === "sticker") && (
          <>
            {!GIPHY_KEY && (
              <p className="text-center text-[12px] text-[var(--muted)] py-8 px-4">
                GIF/Sticker search needs a GIPHY API key.
              </p>
            )}

            {/* MY STICKERS — sticker tab me sabse upar */}
            {tab === "sticker" && (
              <div className="mb-3">
                <div className="flex items-center justify-between mb-2 px-1">
                  <p className="text-[11px] font-semibold text-[var(--muted)] uppercase tracking-wider">
                    My Stickers ({myStickers.length})
                  </p>
                  <input ref={photoRef} type="file" accept="image/*" onChange={photoSticker} className="hidden" />
                  <button
                    onClick={() => photoRef.current?.click()}
                    className="flex items-center gap-1.5 text-[11px] font-semibold text-[#0088cc]"
                  >
                    <span className="w-5 h-5 rounded-full bg-[#0088cc] flex items-center justify-center">
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
                    </span>
                    From photo
                  </button>
                </div>
                {myStickers.length === 0 ? (
                  <p className="text-[11px] text-[var(--muted)] px-1 mb-2">
                    Long-press any sticker below to save it here
                  </p>
                ) : (
                  <div className="grid grid-cols-4 gap-1.5">
                    {myStickers.map((st) => (
                      <button
                        key={st.id}
                        onClick={() => onSticker(st.url)}
                        onTouchStart={() => {
                          pressTimer.current = setTimeout(() => {
                            if (confirm("Remove from My Stickers?")) removeSticker(st.id);
                          }, 600);
                        }}
                        onTouchEnd={() => clearTimeout(pressTimer.current)}
                        onTouchMove={() => clearTimeout(pressTimer.current)}
                        className="aspect-square rounded-lg overflow-hidden bg-[var(--surface)] active:scale-95 transition"
                      >
                        <img src={st.url} alt="" loading="lazy" className="w-full h-full object-contain" />
                      </button>
                    ))}
                  </div>
                )}
                <div className="h-px bg-[var(--border)] mt-3" />
              </div>
            )}

            {loading && (
              <div className="flex justify-center py-8">
                <span className="w-5 h-5 border-2 border-[#0088cc]/30 border-t-[#0088cc] rounded-full animate-spin" />
              </div>
            )}
            {!loading && GIPHY_KEY && (
              <div className="columns-3 gap-1.5">
                {results.map((r) => {
                  const url = gifUrl(r);
                  if (!url) return null;
                  return (
                    <button
                      key={r.id}
                      onClick={() => (tab === "gif" ? onGif(url) : onSticker(url))}
                      onTouchStart={() => {
                        if (tab !== "sticker") return;
                        pressTimer.current = setTimeout(() => saveSticker(url), 600);
                      }}
                      onTouchEnd={() => clearTimeout(pressTimer.current)}
                      onTouchMove={() => clearTimeout(pressTimer.current)}
                      className="w-full mb-1.5 rounded-lg overflow-hidden active:opacity-70 active:scale-95 transition break-inside-avoid"
                    >
                      <img src={url} alt="" loading="lazy" className="w-full" />
                    </button>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
