import { doc, getDoc, setDoc, deleteDoc, updateDoc } from "firebase/firestore";
import { db } from "./firebase";

// Format: 3-20 chars, sirf a-z, 0-9, underscore
export function validUsername(u) {
  return /^[a-z0-9_]{3,20}$/.test(u);
}

export function cleanUsername(u) {
  return (u || "").toLowerCase().trim().replace("@", "");
}

export async function isAvailable(uname) {
  const snap = await getDoc(doc(db, "usernames", uname));
  return !snap.exists();
}

// Username claim karo (purana chhoro agar tha)
export async function claimUsername(uid, newUname, oldUname) {
  await setDoc(doc(db, "usernames", newUname), { uid });
  await updateDoc(doc(db, "users", uid), { username: newUname });
  if (oldUname && oldUname !== newUname) {
    await deleteDoc(doc(db, "usernames", oldUname)).catch(() => {});
  }
}

// Username se user dhoondo
export async function findByUsername(uname) {
  const snap = await getDoc(doc(db, "usernames", cleanUsername(uname)));
  if (!snap.exists()) return null;
  const uid = snap.data().uid;
  const userSnap = await getDoc(doc(db, "users", uid));
  return userSnap.exists() ? { uid, ...userSnap.data() } : null;
}
