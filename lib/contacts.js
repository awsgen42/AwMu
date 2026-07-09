import {
  doc, getDoc, setDoc, deleteDoc, updateDoc, serverTimestamp,
} from "firebase/firestore";
import { db } from "./firebase";

const reqId = (from, to) => `${from}_${to}`;

// Request bhejo
export async function sendRequest(fromUid, toUid) {
  if (fromUid === toUid) throw new Error("Khud ko request nahi bhej sakte 😄");

  // Pehle se contact?
  const c = await getDoc(doc(db, "users", fromUid, "contacts", toUid));
  if (c.exists() && !c.data().blocked) throw new Error("Yeh pehle se aapke contacts me hai");

  // Pehle se request pending?
  const r1 = await getDoc(doc(db, "requests", reqId(fromUid, toUid)));
  if (r1.exists()) throw new Error("Request pehle se bheji hui hai");
  const r2 = await getDoc(doc(db, "requests", reqId(toUid, fromUid)));
  if (r2.exists()) throw new Error("Is user ki request aapke paas pending hai — Requests page se accept karo!");

  await setDoc(doc(db, "requests", reqId(fromUid, toUid)), {
    from: fromUid,
    to: toUid,
    createdAt: serverTimestamp(),
  });
}

// Accept — dono taraf contact entry + request delete
export async function acceptRequest(fromUid, toUid) {
  await setDoc(doc(db, "users", toUid, "contacts", fromUid), {
    addedAt: serverTimestamp(), favorite: false, blocked: false,
  });
  await setDoc(doc(db, "users", fromUid, "contacts", toUid), {
    addedAt: serverTimestamp(), favorite: false, blocked: false,
  });
  await deleteDoc(doc(db, "requests", reqId(fromUid, toUid)));
}

// Decline ya Cancel — sirf request delete
export async function declineRequest(fromUid, toUid) {
  await deleteDoc(doc(db, "requests", reqId(fromUid, toUid)));
}

// Contact hatao (dono taraf se)
export async function removeContact(myUid, otherUid) {
  await deleteDoc(doc(db, "users", myUid, "contacts", otherUid));
  await deleteDoc(doc(db, "users", otherUid, "contacts", myUid)).catch(() => {});
}

// Block/Unblock (apni taraf entry rakhte hue flag)
export async function setBlocked(myUid, otherUid, blocked) {
  await setDoc(doc(db, "users", myUid, "contacts", otherUid), {
    blocked, favorite: false,
    ...(blocked ? {} : { addedAt: serverTimestamp() }),
  }, { merge: true });
}

// Favorite toggle
export async function setFavorite(myUid, otherUid, favorite) {
  await updateDoc(doc(db, "users", myUid, "contacts", otherUid), { favorite });
}
