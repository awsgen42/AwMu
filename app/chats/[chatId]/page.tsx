"use client";
import MediaPicker from "@/components/MediaPicker";
import { askConfirm } from "@/components/ConfirmModal";
import { askDelete } from "@/components/DeleteModal";
import { MessagesSkeleton } from "@/components/Skeletons";
import Confetti from "@/components/Confetti";
import OfflineBar from "@/components/OfflineBar";
import ChatHeader from "@/components/ChatHeader";
import VoiceBubble from "@/components/VoiceBubble";
import { ImageBubble, VideoBubble, AttachSheet } from "@/components/MediaBubble";
import { readVideo } from "@/lib/videoUtils";

import { ArrowLeftIcon, UsersIcon, SmileIcon, PaperclipIcon, MicIcon, StopIcon, SendIcon, XIcon, TrashIcon, BanIcon, LoaderIcon } from "@/components/Icons";

import { useEffect, useState, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { auth, db } from "@/lib/firebase";
import { startPresence } from "@/lib/presence";
import { compressImage } from "@/lib/imageUtils";
import { createRecorder } from "@/lib/voiceUtils";
import ChatList from "@/components/ChatList";
import { onAuthStateChanged } from "firebase/auth";
import {
  doc, getDoc, getDocs, updateDoc, serverTimestamp, increment,
  collection, addDoc, onSnapshot, query, orderBy, writeBatch,
  limitToLast, endBefore, limit,
} from "firebase/firestore";

const REACTIONS = ["❤️", "😂", "👍", "😮", "😢", "🔥"];

const EMOJI_TABS: { name: string; list: string[] }[] = [
  { name: "😊", list: ["😀","😁","😂","🤣","😊","😇","🙂","😉","😍","🥰","😘","😗","😜","🤪","😎","🤩","🥳","😏","😒","😞","😔","😟","😕","🙁","😣","😖","😫","😩","🥺","😢","😭","😤","😠","😡","🤬","🤯","😳","🥵","🥶","😱","😨","😰","😥","🤗","🤔","🤭","🤫","🤥","😶","😐","😑","😬","🙄","😯","😲","🥱","😴","🤤","😪","😷","🤒","🤕","🤢","🤮","🥴","😵","🤠","🥸","😈","👿","🤡","💩","👻","💀","👽","🤖"] },
  { name: "❤️", list: ["❤️","🧡","💛","💚","💙","💜","🖤","🤍","🤎","💔","❤️‍🔥","❤️‍🩹","💕","💞","💓","💗","💖","💘","💝","💟","♥️","💌","💋","🌹","🥀","🌺","🌸","💐","🌷","⭐","🌟","✨","💫","🌙","☀️","🔥","💥","💯","♾️"] },
  { name: "👍", list: ["👍","👎","👊","✊","🤛","🤜","👏","🙌","👐","🤲","🤝","🙏","✌️","🤞","🤟","🤘","👌","🤌","🤏","👈","👉","👆","👇","☝️","✋","🤚","🖐️","🖖","👋","🤙","💪","🦾","✍️","💅","🤳","💃","🕺","👀","👁️","🧠"] },
  { name: "🎉", list: ["🎉","🎊","🎈","🎁","🎀","🎂","🍰","🧁","🍕","🍔","🍟","🌮","🍿","🍩","🍪","🍫","🍬","🍭","☕","🍵","🥤","⚽","🏀","🏈","🎮","🎧","🎵","🎶","🎤","🎸","🥇","🏆","💎","💰","💸","🚀","✈️","🏝️","🌃","🌆"] },
];

const STICKERS = [
  "❤️‍🔥","😻","🥰","😍","💘","🌹",
  "😂","🤣","💀","🤡","😜","🤪",
  "😎","🔥","💯","🚀","⚡","💎",
  "🥺","😭","💔","🌧️","🫂","🤗",
  "👑","🏆","🥇","💪","🦾","✨",
  "🌙","⭐","🌃","🎧","🎮","🕶️",
];

export default function ChatScreen() {
  const router = useRouter();
  const params = useParams();
  const chatId = params.chatId as string;

  const [user, setUser] = useState<any>(null);
  const [otherUser, setOtherUser] = useState<any>(null);
  const [chatDoc, setChatDoc] = useState<any>(null);
  const [members, setMembers] = useState<any>({});
  const [otherUid, setOtherUid] = useState<string>("");
  const [otherTyping, setOtherTyping] = useState(false);
  const [messages, setMessages] = useState<any[]>([]);
  const [text, setText] = useState("");
  const [replyTo, setReplyTo] = useState<any>(null);
  const [reactionFor, setReactionFor] = useState<string | null>(null);
  const [showPicker, setShowPicker] = useState(false);
  const [pickerTab, setPickerTab] = useState<"emoji" | "sticker">("emoji");
  const [emojiCat, setEmojiCat] = useState(0);
  const [sendingImg, setSendingImg] = useState(false);
  const [viewImage, setViewImage] = useState<string | null>(null);
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [olderMsgs, setOlderMsgs] = useState<any[]>([]);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [noMoreOlder, setNoMoreOlder] = useState(false);
  const [confetti, setConfetti] = useState(false);
  const [msgsLoaded, setMsgsLoaded] = useState(false);
  const [stickerTab, setStickerTab] = useState(0);
  const STICKER_PACKS = [
    { name: "Love", icon: "❤️", stickers: ["❤️","💕","💖","💘","😍","🥰","😘","💋","🌹","💐","🫶","💌","👩‍❤️‍👨","💑","🌙","✨"] },
    { name: "Happy", icon: "😄", stickers: ["😄","😂","🤣","😊","🥳","🎉","🎊","🕺","💃","🙌","👏","✌️","🤩","😎","🌈","☀️"] },
    { name: "Sad", icon: "🥺", stickers: ["🥺","😢","😭","💔","😞","🙁","😔","🫂","🤧","😿","🌧️","🖤","😪","💧","🍂","🌚"] },
    { name: "Angry", icon: "😤", stickers: ["😤","😠","😡","🤬","👿","💢","🔥","⚡","🙄","😒","😑","🤨","👊","💥","🌋","😾"] },
    { name: "Fun", icon: "🤪", stickers: ["🤪","😜","🤡","👻","💩","🙈","🙉","🙊","🐸","🦄","🍕","🎮","🏆","🚀","👽","🤖"] },
    { name: "Duas", icon: "🤲", stickers: ["🤲","☪️","🕌","📿","🌙","⭐","🕋","💚","🌹","✨","🙏","☀️","🌄","🕊️","💫","🌺"] },
  ];
  const [swipeState, setSwipeState] = useState<{ id: string; dx: number; active: boolean } | null>(null);
  const lastMsgId = useRef<string>("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const [recording, setRecording] = useState(false);
  const [recSecs, setRecSecs] = useState(0);
  const typingTimer = useRef<any>(null);
  const longPressTimer = useRef<any>(null);
  const touchStartX = useRef<number>(0);
  const bottomRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const videoFileRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);
  const [showAttach, setShowAttach] = useState(false);
  const recorder = useRef<any>(null);
  const recTimer = useRef<any>(null);
  const recSecsRef = useRef<number>(0);

  useEffect(() => {
    let cleanups: (() => void)[] = [];

    const unsub = onAuthStateChanged(auth, async (u) => {
      cleanups.forEach((fn) => fn());
      cleanups = [];

      if (!u) {
        router.replace("/");
        return;
      }
      setUser(u);
      cleanups.push(startPresence(u.uid));

      const oUid = chatId.split("_").find((id) => id !== u.uid) || "";
      setOtherUid(oUid);

      if (oUid) {
        cleanups.push(
          onSnapshot(doc(db, "users", oUid), (snap) => {
            if (snap.exists()) setOtherUser(snap.data());
          }, () => {})
        );
      }

      cleanups.push(
        onSnapshot(doc(db, "chats", chatId), (snap) => {
          const d = snap.data();
          setChatDoc({ id: snap.id, ...d });
          if (d?.typing && oUid) setOtherTyping(!!d.typing[oUid]);
        }, () => {})
      );

      // Sab members ke profiles (groups + naam dikhane ke liye)
      cleanups.push(
        onSnapshot(collection(db, "users"), (qs) => {
          const map: any = {};
          qs.forEach((d) => (map[d.id] = { uid: d.id, ...d.data() }));
          setMembers(map);
        }, () => {})
      );

      updateDoc(doc(db, "chats", chatId), { [`unread.${u.uid}`]: 0 }).catch(() => {});

      const q = query(
        collection(db, "chats", chatId, "messages"),
        orderBy("timestamp", "asc"),
        limitToLast(30)
      );
      cleanups.push(
        onSnapshot(q, (qs) => {
          const list: any[] = [];
          const batch = writeBatch(db);
          let hasUnseen = false;

          qs.forEach((d) => {
            const m = { id: d.id, ...d.data() } as any;
            list.push(m);
            if (m.senderId !== u.uid && m.status !== "seen") {
              const myPrivacy = members[u.uid]?.privacy;
              if (!myPrivacy?.hideReadReceipts) {
                batch.update(d.ref, { status: "seen" });
                hasUnseen = true;
              }
            }
          });

          setMessages(list);
          setMsgsLoaded(true);

          // Confetti triggers — naya message celebration words rakhta ho
          const last = list[list.length - 1];
          if (last && last.id !== lastMsgId.current && lastMsgId.current !== "") {
            const t = (last.text || "").toLowerCase();
            if (/happy birthday|janamdin|salgirah|mubarak|congrats|congratulations|🎂|🎉|🎊/.test(t)) {
              setConfetti(true);
            }
          }
          if (last) lastMsgId.current = last.id;

          if (hasUnseen) {
            batch.commit();
            updateDoc(doc(db, "chats", chatId), { [`unread.${u.uid}`]: 0 }).catch(() => {});
          }
        }, () => {})
      );
    });

    return () => {
      cleanups.forEach((fn) => fn());
      unsub();
    };
  }, [chatId, router]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "auto" });
  }, [messages]);

  // Draft load (chat khulte hi)
  useEffect(() => {
    try {
      const d = localStorage.getItem(`awmu-draft-${chatId}`);
      if (d) setText(d);
    } catch {}
  }, [chatId]);

  const handleTyping = (val: string) => {
    setText(val);
    try {
      if (val.trim()) localStorage.setItem(`awmu-draft-${chatId}`, val);
      else localStorage.removeItem(`awmu-draft-${chatId}`);
    } catch {}
    if (!user) return;
    updateDoc(doc(db, "chats", chatId), { [`typing.${user.uid}`]: true }).catch(() => {});
    clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(() => {
      updateDoc(doc(db, "chats", chatId), { [`typing.${user.uid}`]: false }).catch(() => {});
    }, 2000);
  };

  const pushMessage = async (payload: any, previewText: string) => {
    if (!user) return;
    const reply = replyTo;
    setReplyTo(null);

    await addDoc(collection(db, "chats", chatId, "messages"), {
      senderId: user.uid,
      timestamp: serverTimestamp(),
      status: "sent",
      ...(chatDoc?.disappearing ? { expireAt: Date.now() + 24 * 60 * 60 * 1000 } : {}),
      replyTo: reply
        ? { id: reply.id, text: reply.text || reply.sticker || (reply.type === "image" ? "Photo" : reply.type === "voice" ? "🎤 Voice" : ""), senderId: reply.senderId }
        : null,
      reactions: {},
      ...payload,
    });

    const unreadUpdates: any = {};
    if (chatDoc?.isGroup) {
      (chatDoc.participants || []).forEach((p: string) => {
        if (p !== user.uid) unreadUpdates[`unread.${p}`] = increment(1);
      });
    } else {
      unreadUpdates[`unread.${otherUid}`] = increment(1);
    }

    await updateDoc(doc(db, "chats", chatId), {
      lastMessage: { text: previewText, senderId: user.uid, timestamp: serverTimestamp() },
      ...unreadUpdates,
      [`typing.${user.uid}`]: false,
    });

    const mutedList = chatDoc?.mutedBy || [];
    const recipients = (chatDoc?.isGroup
      ? (chatDoc.participants || []).filter((x: string) => x !== user.uid)
      : [otherUid]
    ).filter((x: string) => !mutedList.includes(x));
    const myName = members[user.uid]?.displayName || "New message";
    fetch("/api/notify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        toUids: recipients,
        title: chatDoc?.isGroup ? `${myName} — ${chatDoc.name}` : myName,
        body: previewText,
        chatId,
      }),
    }).catch(() => {});
  };

  const sendMessage = async () => {
    if (!text.trim()) return;
    const msgText = text.trim();
    setText("");
    clearTimeout(typingTimer.current);
    await pushMessage({ type: "text", text: msgText }, msgText);
  };

  const sendSticker = async (s: string) => {
    setShowPicker(false);
    await pushMessage({ type: "sticker", sticker: s, text: "" }, "Sticker");
  };

  const sendImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    setSendingImg(true);
    try {
      const dataUrl = await compressImage(file);
      await pushMessage({ type: "image", image: dataUrl, text: "" }, "Photo");
    } catch (err: any) {
      alert(err.message);
    }
    setSendingImg(false);
  };

  const sendVideo = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    setSendingImg(true);
    try {
      const dataUrl = await readVideo(file);
      await pushMessage({ type: "video", video: dataUrl, text: "" }, "🎬 Video");
    } catch (err: any) {
      alert(err.message);
    }
    setSendingImg(false);
  };

  const startRecording = async () => {
    try {
      recorder.current = createRecorder();
      await recorder.current.start();
      setRecording(true);
      setRecSecs(0);
      recSecsRef.current = 0;
      recTimer.current = setInterval(() => {
        recSecsRef.current += 1;
        setRecSecs(recSecsRef.current);
        if (recSecsRef.current >= 59) stopRecording();
      }, 1000);
    } catch {
      alert("Microphone permission needed — allow it in browser settings");
    }
  };

  const stopRecording = async () => {
    clearInterval(recTimer.current);
    setRecording(false);
    try {
      const dataUrl = await recorder.current.stop();
      await pushMessage(
        { type: "voice", audio: dataUrl, duration: recSecsRef.current, text: "" },
        "Voice message"
      );
    } catch (err: any) {
      alert(err.message);
    }
  };

  const cancelRecording = () => {
    clearInterval(recTimer.current);
    setRecording(false);
    recorder.current?.cancel();
  };

  const loadOlder = async () => {
    if (loadingOlder || noMoreOlder) return;
    const oldest = olderMsgs[0] || messages[0];
    if (!oldest?.timestamp) return;
    setLoadingOlder(true);

    const el = scrollRef.current;
    const prevHeight = el?.scrollHeight || 0;

    const qs = await getDocs(
      query(
        collection(db, "chats", chatId, "messages"),
        orderBy("timestamp", "asc"),
        endBefore(oldest.timestamp),
        limitToLast(30)
      )
    );
    const older: any[] = [];
    qs.forEach((d) => older.push({ id: d.id, ...d.data() }));

    if (older.length < 30) setNoMoreOlder(true);
    setOlderMsgs((prev) => [...older, ...prev]);
    setLoadingOlder(false);

    // Scroll position barkarar rakho (jump na ho)
    requestAnimationFrame(() => {
      if (el) el.scrollTop = el.scrollHeight - prevHeight;
    });
  };

  const onScroll = () => {
    const el = scrollRef.current;
    if (el && el.scrollTop < 80) loadOlder();
  };

  const toggleSelect = (msgId: string) => {
    setSelectedIds((ids) =>
      ids.includes(msgId) ? ids.filter((i) => i !== msgId) : [...ids, msgId]
    );
  };

  const bulkDelete = async (ids: string[]) => {
    if (ids.length === 0) return;
    if (!await askConfirm({ message: `Delete ${ids.length} message${ids.length > 1 ? "s" : ""} for everyone?`, danger: true, confirmText: "Yes" })) return;
    // Firestore batch limit 500 — chunks me karo
    for (let i = 0; i < ids.length; i += 400) {
      const chunk = ids.slice(i, i + 400);
      const batch = writeBatch(db);
      chunk.forEach((id) => {
        batch.update(doc(db, "chats", chatId, "messages", id), {
          deleted: true, text: "", image: null, audio: null, video: null, sticker: null, reactions: {},
        });
      });
      await batch.commit();
    }
    setSelectMode(false);
    setSelectedIds([]);
  };

  const deleteForEveryone = async (msgId: string, isMine: boolean) => {
    setReactionFor(null);
    const choice = await askDelete({ canDeleteForEveryone: isMine });
    if (choice === "cancel") return;

    if (choice === "everyone") {
      await updateDoc(doc(db, "chats", chatId, "messages", msgId), {
        deleted: true, text: "", image: null, audio: null, video: null, sticker: null, reactions: {},
      });
    } else {
      // Delete for me — sirf mere liye hide (deletedFor array)
      const msg = messages.find((m) => m.id === msgId) || olderMsgs.find((m) => m.id === msgId);
      const list = msg?.deletedFor || [];
      await updateDoc(doc(db, "chats", chatId, "messages", msgId), {
        deletedFor: [...list, user.uid],
      });
    }
  };

  const toggleMute = async () => {
    if (!user) return;
    const cur = !!chatDoc?.mutedBy?.includes(user.uid);
    const list = chatDoc?.mutedBy || [];
    await updateDoc(doc(db, "chats", chatId), {
      mutedBy: cur ? list.filter((x: string) => x !== user.uid) : [...list, user.uid],
    }).catch(() => {});
  };

  const toggleDisappearing = async () => {
    const cur = !!chatDoc?.disappearing;
    const ok = await askConfirm({
      title: "Disappearing messages",
      message: cur
        ? "Turn off? New messages will be permanent."
        : "Turn on? New messages will auto-delete after 24 hours (for everyone).",
      confirmText: cur ? "Turn off" : "Turn on",
    });
    if (!ok) return;
    await updateDoc(doc(db, "chats", chatId), { disappearing: !cur }).catch(() => {});
  };

  const importRef = useRef<HTMLInputElement>(null);

  const importChat = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    e.target.value = "";
    const textContent = await file.text();
    const lines = textContent.split("\n").filter((l) => /^\[.+\] (Me|.+): /.test(l));
    if (!lines.length) {
      alert("No messages found — use an AwMu-exported .txt file");
      return;
    }
    const ok = await askConfirm({
      title: "Import chat",
      message: `${lines.length} messages found. Import them into this chat? (They'll appear as new messages from you, prefixed with the original sender)`,
      confirmText: "Import",
    });
    if (!ok) return;

    let count = 0;
    for (const line of lines.slice(0, 200)) {
      const m = line.match(/^\[(.+?)\] (.+?): (.*)$/);
      if (!m) continue;
      const content = `[${m[1]}] ${m[2]}: ${m[3]}`;
      await addDoc(collection(db, "chats", chatId, "messages"), {
        senderId: user.uid,
        text: content,
        type: "text",
        timestamp: serverTimestamp(),
        status: "sent",
        imported: true,
        reactions: {},
      });
      count++;
    }
    alert(`Imported ${count} messages ✓`);
  };

  const sendGif = async (url: string) => {
    setShowPicker(false);
    await pushMessage({ type: "gif", gif: url }, "GIF");
  };

  const exportChat = async () => {
    const qs = await getDocs(
      query(collection(db, "chats", chatId, "messages"), orderBy("timestamp", "asc"))
    );
    const lines: string[] = [`AwMu Chat Export — ${new Date().toLocaleString()}`, ""];
    qs.forEach((d) => {
      const m = d.data() as any;
      if (m.deleted) return;
      const time = m.timestamp?.toDate?.()?.toLocaleString("en-US", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" }) || "";
      const who = m.senderId === user?.uid ? "Me" : (members[m.senderId]?.displayName || "Them");
      const content = m.type === "text" ? m.text : m.type === "image" ? "[Photo]" : m.type === "video" ? "[Video]" : m.type === "voice" ? `[Voice ${m.duration}s]` : m.type === "sticker" ? m.sticker : "";
      lines.push(`[${time}] ${who}: ${content}`);
    });
    const blob = new Blob([lines.join("\n")], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `awmu-chat-${new Date().toISOString().slice(0, 10)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const toggleStar = async (msgId: string) => {
    setReactionFor(null);
    const msg = messages.find((m) => m.id === msgId) || olderMsgs.find((m) => m.id === msgId);
    if (!msg || !user) return;
    const starred = msg.starredBy || [];
    const isStarred = starred.includes(user.uid);
    await updateDoc(doc(db, "chats", chatId, "messages", msgId), {
      starredBy: isStarred ? starred.filter((x: string) => x !== user.uid) : [...starred, user.uid],
    });
  };

  const toggleReaction = async (msgId: string, emoji: string) => {
    setReactionFor(null);
    const msg = messages.find((m) => m.id === msgId);
    if (!msg || !user) return;
    const current = msg.reactions?.[user.uid];
    await updateDoc(doc(db, "chats", chatId, "messages", msgId), {
      [`reactions.${user.uid}`]: current === emoji ? null : emoji,
    });
  };

  const onTouchStart = (m: any) => (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    longPressTimer.current = setTimeout(() => setReactionFor(m.id), 500);
  };
  const onTouchMove = (m: any) => (e: React.TouchEvent) => {
    const dx = e.touches[0].clientX - touchStartX.current;
    if (Math.abs(dx) > 10) clearTimeout(longPressTimer.current);
    // Bubble ungli ke saath — reply abhi NAHI, sirf follow (resistance ke saath)
    if (dx > 4 && !m.deleted) {
      setSwipeState({ id: m.id, dx: Math.min(dx * 0.7, 85) });
    } else if (dx < 0) {
      setSwipeState(null);
    }
  };
  const onTouchEnd = (m: any) => () => {
    clearTimeout(longPressTimer.current);
    // Chhorne pe faisla — threshold paar hua to reply + vibrate
    setSwipeState((cur) => {
      if (cur && cur.id === m.id && cur.dx > 55 && !m.deleted) {
        setReplyTo(m);
        if (navigator.vibrate) navigator.vibrate(20);
      }
      return null; // spring-back
    });
  };

  const isGroup = !!chatDoc?.isGroup;

  const SENDER_COLORS = ["#0088cc", "#4c56af", "#00838f", "#c2185b", "#7b1fa2", "#e65100", "#2e7d32", "#5d4037"];
  const senderColor = (uid: string) => {
    let h = 0;
    for (let i = 0; i < uid.length; i++) h = (h * 31 + uid.charCodeAt(i)) % 997;
    return SENDER_COLORS[h % SENDER_COLORS.length];
  };

  const memberName = (uid: string) =>
    uid === user?.uid ? "You" : members[uid]?.displayName || "...";

  const groupTypers = () => {
    if (!chatDoc?.typing) return [];
    return Object.keys(chatDoc.typing).filter(
      (k) => chatDoc.typing[k] && k !== user?.uid
    );
  };

  const senderName = (uid: string) =>
    uid === user?.uid ? "You" : otherUser?.displayName || "...";

  const formatTime = (ts: any) => {
    if (!ts?.toDate) return "";
    return ts.toDate().toLocaleTimeString("en-US", {
      hour: "numeric", minute: "2-digit", hour12: true,
    });
  };

  // Sirf emoji wala message? (1-3 emojis, koi text nahi)
  const emojiOnly = (text: string) => {
    if (!text) return null;
    const stripped = text.replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE0F}\u{200D}\u{2764}]/gu, "");
    if (stripped.trim() !== "") return null;
    const chars = [...text.trim()];
    if (chars.length === 0 || chars.length > 6) return null;
    return text.trim();
  };

  const emojiAnimClass = (e: string) => {
    if (/❤|💕|💖|💗|💘|🥰|😍/.test(e)) return "emoji-heart";
    if (/😂|🤣/.test(e)) return "emoji-laugh";
    return "emoji-big";
  };

  const formatLastSeen = (ts: any) => {
    if (!ts?.toDate) return "offline";
    const d = ts.toDate();
    const today = new Date();
    const time = d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
    if (d.toDateString() === today.toDateString()) return `last seen ${time}`;
    return `last seen ${d.toLocaleDateString("en-US", { day: "numeric", month: "short" })} ${time}`;
  };

  const dayLabel = (ts: any) => {
    if (!ts?.toDate) return "";
    const d = ts.toDate();
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);
    if (d.toDateString() === today.toDateString()) return "Today";
    if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
    return d.toLocaleDateString("en-US", { day: "numeric", month: "long", year: "numeric" });
  };

  return (
    <div className="h-screen flex bg-[var(--bg)]">
      <div className="hidden lg:block w-[360px] border-r border-[var(--border)] shrink-0 h-full">
        <ChatList activeChatId={chatId} />
      </div>
    <main className={`chat-screen bg-[var(--bg)] text-[var(--text)] flex-1 min-w-0 chat-open theme-${chatDoc?.theme || "azure"}`} onClick={() => setReactionFor(null)}>
      {/* Header */}
      <OfflineBar />
      <ChatHeader
        isGroup={isGroup}
        online={!isGroup && !!otherUser?.online && !otherUser?.privacy?.hideOnline}
        typing={isGroup ? groupTypers().length > 0 : otherTyping}
        otherUid={otherUid}
        title={isGroup ? chatDoc?.name || "Group" : otherUser?.displayName || "..."}
        subtitle={
          isGroup
            ? groupTypers().length > 0
              ? `${memberName(groupTypers()[0])} is typing...`
              : `${chatDoc?.participants?.length || 0} members`
            : otherTyping
            ? "typing..."
            : otherUser?.online && !otherUser?.privacy?.hideOnline
            ? "online"
            : otherUser?.privacy?.hideLastSeen
            ? ""
            : formatLastSeen(otherUser?.lastSeen)
        }
        photoURL={otherUser?.photoURL}
        onBack={() => router.push("/chats")}
        selectMode={selectMode}
        selectedCount={selectedIds.length}
        totalCount={messages.filter((m) => !m.deleted).length}
        onStartSelect={() => { setSelectMode(true); setSelectedIds([]); }}
        onCancelSelect={() => { setSelectMode(false); setSelectedIds([]); }}
        onSelectAll={() => {
          const all = messages.filter((m) => !m.deleted).map((m) => m.id);
          setSelectedIds(selectedIds.length === all.length ? [] : all);
        }}
        onDeleteSelected={() => bulkDelete(selectedIds)}
        onDeleteAll={() => bulkDelete(messages.filter((m) => !m.deleted).map((m) => m.id))}
        onTheme={(t) => updateDoc(doc(db, "chats", chatId), { theme: t }).catch(() => {})}
        onExport={exportChat}
        onImport={() => importRef.current?.click()}
        onSearch={() => router.push(`/search?chat=${chatId}`)}
        onViewContact={() => otherUid && router.push(`/profile/${otherUid}`)}
        onMedia={() => otherUid && router.push(`/profile/${otherUid}`)}
        muted={!!chatDoc?.mutedBy?.includes(user?.uid)}
        disappearing={!!chatDoc?.disappearing}
        onMute={toggleMute}
        onDisappearing={toggleDisappearing}
      />

      {/* Messages */}
      {!msgsLoaded ? (
        <MessagesSkeleton />
      ) : (
      <div ref={scrollRef} onScroll={onScroll} className="chat-scroll px-4 py-3 w-full max-w-[800px] mx-auto chat-doodle">
        <div className="flex justify-center my-2">
          <p className="privacy-banner rounded-xl px-4 py-2 text-[11px] text-[#b8860b] text-center max-w-[320px] leading-relaxed">
            🔒 This chat is private — only people in this chat can see messages
          </p>
        </div>
        {loadingOlder && (
          <div className="flex justify-center py-3">
            <span className="w-5 h-5 border-2 border-[#0088cc]/30 border-t-[#0088cc] rounded-full animate-spin" />
          </div>
        )}
        {noMoreOlder && olderMsgs.length > 0 && (
          <p className="text-center text-[10px] text-[var(--muted)] py-2">— Beginning of chat —</p>
        )}
        {(() => {
          const liveIds = new Set(messages.map((m) => m.id));
          return [...olderMsgs.filter((m) => !liveIds.has(m.id)), ...messages]
            .filter((m) => !m.deletedFor?.includes(user?.uid))
            .filter((m) => {
              if (m.expireAt && m.expireAt < Date.now()) {
                updateDoc(doc(db, "chats", chatId, "messages", m.id), {
                  deleted: true, text: "", image: null, audio: null, video: null, sticker: null,
                }).catch(() => {});
                return false;
              }
              return true;
            });
        })().map((m, i, allMsgs) => {
          const mine = m.senderId === user?.uid;
          const isSticker = m.type === "sticker";
          const isImage = m.type === "image";
          const isVoice = m.type === "voice";
          const isVideo = m.type === "video";
          const isDeleted = !!m.deleted;
          const reacts = Object.values(m.reactions || {}).filter(Boolean) as string[];

          const prevLabel = i > 0 ? dayLabel(allMsgs[i - 1].timestamp) : null;
          const currLabel = dayLabel(m.timestamp);
          const showDivider = currLabel && currLabel !== prevLabel;

          const samePrev = i > 0 && allMsgs[i - 1].senderId === m.senderId && !showDivider;

          return (
            <div key={m.id}>
              {showDivider && (
                <div className="flex justify-center my-3">
                  <span className="px-3 py-1 rounded-full bg-[var(--surface2)] text-[var(--text2)] text-[11px] font-medium">
                    {currLabel}
                  </span>
                </div>
              )}

              <div
                onClick={selectMode && !isDeleted ? (e) => { e.stopPropagation(); toggleSelect(m.id); } : undefined}
                className={`flex items-center gap-2 ${mine ? "justify-end" : "justify-start"} relative msg-in ${samePrev ? "mt-1" : "mt-3"} ${selectMode ? "cursor-pointer" : ""}`}
              >
                {selectMode && !isDeleted && !mine && (
                  <span className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition ${selectedIds.includes(m.id) ? "bg-[#0088cc] border-[#0088cc]" : "border-[var(--outline)]"}`}>
                    {selectedIds.includes(m.id) && <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>}
                  </span>
                )}
                <div
                  onTouchStart={selectMode ? undefined : onTouchStart(m)}
                  onTouchMove={selectMode ? undefined : onTouchMove(m)}
                  onTouchEnd={selectMode ? undefined : onTouchEnd(m)}
                  className={`relative select-none ${
                    isSticker && !isDeleted
                      ? "px-2 py-1"
                      : (isImage || isVideo) && !isDeleted
                      ? `max-w-[75%] p-1.5 rounded-2xl ${mine ? "bubble-mine" : "bg-[var(--card)] border border-[var(--border)]"}`
                      : `max-w-[75%] px-3 py-2 rounded-2xl text-[15px] leading-relaxed ${
                          mine
                            ? "bubble-mine text-white rounded-br-[4px]"
                            : "bg-[var(--card)] text-[var(--text)] border border-[var(--border)] rounded-bl-[4px]"
                        }`
                  } ${reacts.length ? "mb-3" : ""} ${!samePrev && !isSticker && !isDeleted && m.type !== "image" && m.type !== "video" ? (mine ? "tail-r" : "tail-l") : ""} swipe-bubble ${swipeState?.id === m.id ? "swiping" : ""}`}
                        style={{
                          transform: swipeState?.id === m.id ? `translateX(${swipeState.dx}px)` : undefined,
                        }}
                >
                  {isGroup && !mine && !isDeleted && (
                    <p className="text-[11px] font-semibold mb-0.5" style={{ color: senderColor(m.senderId) }}>
                      {memberName(m.senderId)}
                    </p>
                  )}

                  {m.replyTo && (
                    <div className={`mb-1.5 px-2 py-1 rounded-lg border-l-2 ${mine ? "bg-black/10 border-[var(--card)]/60" : "bg-[var(--surface)] border-[#0088cc]"}`}>
                      <p className={`text-[10px] font-medium ${mine ? "text-white/80" : "text-[#0088cc]"}`}>{senderName(m.replyTo.senderId)}</p>
                      <p className={`text-xs truncate ${mine ? "text-white/70" : "text-[var(--text2)]"}`}>{m.replyTo.text}</p>
                    </div>
                  )}

                  {m.type === "gif" && !isDeleted ? (
                    <img src={m.gif} alt="GIF" loading="lazy" className="rounded-xl max-w-[220px]" />
                  ) : isDeleted ? (
                    <p className={`italic text-[13px] flex items-center gap-1 ${mine ? "text-white/60" : "text-[var(--muted)]"}`}>
                      <BanIcon size={13} /> This message was deleted
                    </p>
                  ) : isVoice ? (
                    <VoiceBubble src={m.audio} duration={m.duration || 0} mine={mine} msgId={m.id} />
                  ) : isImage ? (
                    <ImageBubble src={m.image} mine={mine} onView={() => setViewImage(m.image)} />
                  ) : isVideo ? (
                    <VideoBubble src={m.video} mine={mine} />
                  ) : isSticker ? (
                    <p className="text-7xl leading-none drop-shadow-sm">{m.sticker}</p>
                  ) : emojiOnly(m.text) ? (
                    <p className={`text-5xl leading-tight ${emojiAnimClass(m.text)}`}>{m.text}</p>
                  ) : (
                    <p className="break-words">{m.text}</p>
                  )}

                  <p className={`text-[10px] mt-0.5 text-right ${isSticker ? "text-[var(--muted)]" : mine ? "text-white/70" : "text-[var(--muted)]"} ${isImage ? "px-1 pb-0.5" : ""}`}>
                    {m.starredBy?.includes(user?.uid) && <span className="text-[#f5a623]">★ </span>}
                    {formatTime(m.timestamp)}
                    {mine && (
                      <span className={m.status === "seen" ? (isSticker ? "text-[#00b0ff]" : "text-[#8dfcff] font-bold") : ""}>
                        {" "}{m.status === "seen" ? "✓✓" : "✓"}
                      </span>
                    )}
                  </p>

                  {reacts.length > 0 && (
                    <div className={`absolute -bottom-3 ${mine ? "right-2" : "left-2"} bg-[var(--card)] border border-[var(--outline)] rounded-full px-1.5 py-0.5 text-xs flex gap-0.5 shadow-sm`}>
                      {[...new Set(reacts)].map((r) => <span key={r}>{r}</span>)}
                    </div>
                  )}

                  {reactionFor === m.id && !isDeleted && (
                    <div
                      onClick={(e) => e.stopPropagation()}
                      className={`absolute -top-11 ${mine ? "right-0" : "left-0"} bg-[var(--card)] border border-[var(--outline)] rounded-full px-2 py-1.5 flex gap-1.5 z-20 react-pop shadow-[0_4px_12px_rgba(26,35,126,0.1)]`}
                    >
                      {REACTIONS.map((r) => (
                        <button key={r} onClick={() => toggleReaction(m.id, r)} className="text-lg active:scale-125 transition">
                          {r}
                        </button>
                      ))}
                      <button
                        onClick={() => toggleStar(m.id)}
                        className="text-lg active:scale-125 transition border-l border-[var(--border)] pl-1.5"
                      >
                        <svg width="17" height="17" viewBox="0 0 24 24" fill={m.starredBy?.includes(user?.uid) ? "#f5a623" : "none"} stroke={m.starredBy?.includes(user?.uid) ? "#f5a623" : "currentColor"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M12 3l2.7 5.5 6.1.9-4.4 4.3 1 6-5.4-2.8-5.4 2.8 1-6L3.2 9.4l6.1-.9L12 3z" />
                        </svg>
                      </button>
                      {(
                        <button
                          onClick={() => deleteForEveryone(m.id, mine)}
                          className="text-lg active:scale-125 transition border-l border-[var(--border)] pl-1.5"
                        >
                          <TrashIcon size={17} className="text-[#ba1a1a]" />
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>
      )}

      {/* Fullscreen image viewer */}
      {showAttach && (
        <AttachSheet
          onImage={() => { setShowAttach(false); fileRef.current?.click(); }}
          onVideo={() => { setShowAttach(false); videoFileRef.current?.click(); }}
          onClose={() => setShowAttach(false)}
        />
      )}

      {confetti && <Confetti onDone={() => setConfetti(false)} />}

      {viewImage && (
        <div
          onClick={() => setViewImage(null)}
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4 viewer-in"
        >
          <img src={viewImage} alt="photo" className="max-w-full max-h-full rounded-lg viewer-img" />
          <button className="absolute top-4 right-4 text-white"><XIcon size={26} /></button>
        </div>
      )}

      {/* Recording bar */}
      {recording && (
        <div className="flex items-center justify-between px-4 py-2.5 bg-[var(--card)] border-t border-[#ffdad6]">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#ba1a1a] animate-pulse" />
            <p className="text-sm text-[var(--text2)]">Recording... {recSecs}s</p>
          </div>
          <button onClick={cancelRecording} className="text-[var(--muted)] text-sm px-2">Cancel</button>
        </div>
      )}

      {/* Reply preview */}
      {replyTo && (
        <div className="flex items-center justify-between px-4 py-2 bg-[var(--card)] border-t border-[var(--border)]">
          <div className="border-l-2 border-[#0088cc] pl-2">
            <p className="text-[10px] text-[#0088cc] font-medium">{senderName(replyTo.senderId)}</p>
            <p className="text-xs text-[var(--text2)] truncate max-w-[250px]">
              {replyTo.text || replyTo.sticker || (replyTo.type === "image" ? "Photo" : "🎤 Voice")}
            </p>
          </div>
          <button onClick={() => setReplyTo(null)} className="text-[var(--muted)] px-2"><XIcon size={18} /></button>
        </div>
      )}

      {/* Emoji/Sticker Picker */}
      {showPicker && (
        <MediaPicker
          onEmoji={(e) => setText((t) => t + e)}
          onGif={sendGif}
          onSticker={sendGif}
          onCreateSticker={() => { setShowPicker(false); fileRef.current?.click(); }}
        />
      )}

      {/* Input bar */}
      <div className="bg-[var(--card)]/90 backdrop-blur border-t border-[var(--border)]">
        <div className="flex items-center gap-2 p-2.5 w-full max-w-[800px] mx-auto">
          {/* Pill: emoji + input + attach + camera */}
          <div className="flex items-center flex-1 min-w-0 bg-[var(--surface)] rounded-full pl-1.5 pr-1.5">
            <button
              onClick={(e) => { e.stopPropagation(); setShowPicker((v) => !v); }}
              className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
            >
              <SmileIcon size={22} className={showPicker ? "text-[#0088cc]" : "text-[var(--muted)]"} />
            </button>
            <input
              value={text}
              onChange={(e) => handleTyping(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
              onFocus={() => setShowPicker(false)}
              placeholder="Message"
              className="flex-1 bg-transparent outline-none text-[15px] text-[var(--text)] placeholder-[var(--muted)] min-w-0 py-2.5 px-1"
            />
            <input ref={fileRef} type="file" accept="image/*" onChange={sendImage} className="hidden" />
            <input ref={videoFileRef} type="file" accept="video/*" onChange={sendVideo} className="hidden" />
            <input ref={cameraRef} type="file" accept="image/*" capture="environment" onChange={sendImage} className="hidden" />
            <input ref={importRef} type="file" accept=".txt" onChange={importChat} className="hidden" />
            <button
              onClick={(e) => { e.stopPropagation(); setShowAttach(true); }}
              className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
            >
              {sendingImg ? (
                <LoaderIcon size={20} className="text-[#0088cc]" />
              ) : (
                <PaperclipIcon size={20} className="text-[var(--muted)]" />
              )}
            </button>
            <button
              onClick={() => cameraRef.current?.click()}
              className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--muted)]">
                <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" />
                <circle cx="12" cy="13" r="3" />
              </svg>
            </button>
          </div>

          {/* FAB — send / mic */}
          {text.trim() ? (
            <button
              onClick={sendMessage}
              className="w-12 h-12 rounded-full bubble-mine flex items-center justify-center shrink-0 text-white shadow-[0_4px_14px_rgba(0,136,204,0.4)] send-tap"
            >
              <SendIcon size={19} className="-ml-0.5 mt-0.5" />
            </button>
          ) : (
            <button
              onClick={() => (recording ? stopRecording() : startRecording())}
              className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 text-white send-tap ${
                recording
                  ? "bg-[#ba1a1a] animate-pulse shadow-[0_4px_14px_rgba(186,26,26,0.45)]"
                  : "bubble-mine shadow-[0_4px_14px_rgba(0,136,204,0.4)]"
              }`}
            >
              {recording ? <StopIcon size={20} /> : <MicIcon size={20} />}
            </button>
          )}
        </div>
      </div>
    </main>
    </div>
  );
}
