import { doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { db } from "./firebase";

export function startPresence(uid) {
  const ref = doc(db, "users", uid);

  const setOnline = () =>
    updateDoc(ref, { online: true, lastSeen: serverTimestamp() }).catch(() => {});
  const setOffline = () =>
    updateDoc(ref, { online: false, lastSeen: serverTimestamp() }).catch(() => {});

  setOnline();

  // App background/foreground detect karo
  const onVisibility = () => {
    if (document.visibilityState === "visible") setOnline();
    else setOffline();
  };
  document.addEventListener("visibilitychange", onVisibility);
  window.addEventListener("pagehide", setOffline);

  return () => {
    document.removeEventListener("visibilitychange", onVisibility);
    window.removeEventListener("pagehide", setOffline);
    setOffline();
  };
}
