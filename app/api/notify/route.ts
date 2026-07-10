import { NextResponse } from "next/server";
import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getMessaging } from "firebase-admin/messaging";

function getAdminApp() {
  if (getApps().length) return getApps()[0];
  const sa = JSON.parse(
    Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_B64 || "", "base64").toString()
  );
  return initializeApp({ credential: cert(sa) });
}

export async function POST(req: Request) {
  try {
    const app = getAdminApp();
    const { toUids, title, body, chatId } = await req.json();
    if (!Array.isArray(toUids) || toUids.length === 0) {
      return NextResponse.json({ sent: 0 });
    }

    const db = getFirestore(app);
    const tokens: string[] = [];
    for (const uid of toUids.slice(0, 50)) {
      const snap = await db.collection("users").doc(uid).get();
      const t = snap.data()?.fcmToken;
      if (t) tokens.push(t);
    }
    if (!tokens.length) return NextResponse.json({ sent: 0 });

    const res = await getMessaging(app).sendEachForMulticast({
      tokens,
      notification: { title: title || "AwMu", body: body || "New message" },
      data: { chatId: chatId || "" },
    });
    return NextResponse.json({ sent: res.successCount });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
