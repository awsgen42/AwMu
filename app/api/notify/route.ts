import { NextResponse } from "next/server";
import admin from "firebase-admin";

if (!admin.apps.length) {
  const sa = JSON.parse(
    Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_B64 || "", "base64").toString()
  );
  admin.initializeApp({ credential: admin.credential.cert(sa) });
}

export async function POST(req: Request) {
  try {
    const { toUids, title, body, chatId } = await req.json();
    if (!Array.isArray(toUids) || toUids.length === 0) {
      return NextResponse.json({ sent: 0 });
    }

    const db = admin.firestore();
    const tokens: string[] = [];
    for (const uid of toUids.slice(0, 50)) {
      const snap = await db.collection("users").doc(uid).get();
      const t = snap.data()?.fcmToken;
      if (t) tokens.push(t);
    }
    if (!tokens.length) return NextResponse.json({ sent: 0 });

    const res = await admin.messaging().sendEachForMulticast({
      tokens,
      notification: { title: title || "AwMu", body: body || "New message" },
      data: { chatId: chatId || "" },
    });
    return NextResponse.json({ sent: res.successCount });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
