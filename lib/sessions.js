import {
  doc, setDoc, updateDoc, deleteDoc, serverTimestamp, onSnapshot,
} from "firebase/firestore";
import { db, auth } from "./firebase";
import { signOut } from "firebase/auth";

// Device ka naam pehchano
function deviceName() {
  const ua = navigator.userAgent;
  let os = "Unknown";
  if (/Android/i.test(ua)) os = "Android";
  else if (/iPhone|iPad/i.test(ua)) os = "iOS";
  else if (/Windows/i.test(ua)) os = "Windows";
  else if (/Mac/i.test(ua)) os = "Mac";
  else if (/Linux/i.test(ua)) os = "Linux";
  let browser = "Browser";
  if (/Brave/i.test(ua)) browser = "Brave";
  else if (/Chrome/i.test(ua)) browser = "Chrome";
  else if (/Firefox/i.test(ua)) browser = "Firefox";
  else if (/Safari/i.test(ua) && !/Chrome/i.test(ua)) browser = "Safari";
  return `${browser} on ${os}`;
}

// Is device ka unique id (localStorage me)
function deviceId() {
  try {
    let id = localStorage.getItem("awmu-device-id");
    if (!id) {
      id = "d" + Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
      localStorage.setItem("awmu-device-id", id);
    }
    return id;
  } catch {
    return "d-unknown";
  }
}

// Login/app-open pe session register + revoke watcher
export function startSession(uid) {
  const did = deviceId();
  const ref = doc(db, "users", uid, "sessions", did);

  setDoc(ref, {
    device: deviceName(),
    lastActive: serverTimestamp(),
    createdAt: serverTimestamp(),
    revoked: false,
  }, { merge: true }).catch(() => {});

  // Har 5 min lastActive update
  const beat = setInterval(() => {
    updateDoc(ref, { lastActive: serverTimestamp() }).catch(() => {});
  }, 5 * 60 * 1000);

  // Revoke watcher — koi doosre device se is session ko revoke kare to logout
  const unsub = onSnapshot(ref, (snap) => {
    if (snap.exists() && snap.data().revoked) {
      deleteDoc(ref).catch(() => {});
      signOut(auth);
    }
  }, () => {});

  return () => {
    clearInterval(beat);
    unsub();
  };
}

export function myDeviceId() {
  return deviceId();
}

// Auto-logout (inactivity) — Settings se on/off
export function startAutoLogout(minutes) {
  if (!minutes) return () => {};
  let timer;
  const reset = () => {
    clearTimeout(timer);
    timer = setTimeout(() => signOut(auth), minutes * 60 * 1000);
  };
  ["touchstart", "keydown", "mousemove", "click"].forEach((ev) =>
    window.addEventListener(ev, reset, { passive: true })
  );
  reset();
  return () => {
    clearTimeout(timer);
    ["touchstart", "keydown", "mousemove", "click"].forEach((ev) =>
      window.removeEventListener(ev, reset)
    );
  };
}
