import { getApps } from "firebase/app";
import { getMessaging, getToken, isSupported } from "firebase/messaging";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "./firebase";

export async function initNotifications(uid) {
  try {
    if (typeof window === "undefined") return;
    if (!(await isSupported())) return;
    if (Notification.permission === "denied") return;

    const perm = await Notification.requestPermission();
    if (perm !== "granted") return;

    const reg = await navigator.serviceWorker.register("/firebase-messaging-sw.js");
    const messaging = getMessaging(getApps()[0]);
    const token = await getToken(messaging, {
      vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
      serviceWorkerRegistration: reg,
    });
    if (token) {
      await updateDoc(doc(db, "users", uid), { fcmToken: token });
    }
  } catch (e) {
    console.log("Notifications init failed:", e);
  }
}
