"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { auth, db } from "@/lib/firebase";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  sendEmailVerification,
  sendPasswordResetEmail,
} from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { validUsername, cleanUsername, isAvailable, claimUsername } from "@/lib/username";
import { LogoMark } from "@/components/Logo";

export default function Home() {
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      if (u) router.replace("/chats");
    });
    return () => unsub();
  }, [router]);

  const forgotPassword = async () => {
    setError("");
    setInfo("");
    if (!email.trim()) {
      setError("Pehle email likho, phir Forgot password dabao");
      return;
    }
    try {
      await sendPasswordResetEmail(auth, email.trim());
      setInfo("Password reset link email pe bhej di — inbox/spam check karo ✉️");
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleSubmit = async () => {
    setError("");
    setInfo("");
    setLoading(true);
    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        const uname = cleanUsername(username);
        if (!validUsername(uname)) {
          setError("Username: 3-20 chars, sirf letters/numbers/underscore");
          setLoading(false);
          return;
        }
        if (!(await isAvailable(uname))) {
          setError(`@${uname} pehle se liya hua hai — koi aur try karo`);
          setLoading(false);
          return;
        }
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        sendEmailVerification(cred.user).catch(() => {});
        await setDoc(doc(db, "users", cred.user.uid), {
          displayName: name || email.split("@")[0],
          username: uname,
          email: email,
          photoURL: "",
          bio: "Hey! I'm using AwMu",
          online: true,
          lastSeen: serverTimestamp(),
          createdAt: serverTimestamp(),
        });
        await claimUsername(cred.user.uid, uname, null).catch(() => {});
      }
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[var(--surface)] flex items-center justify-center p-6">
      <div className="w-full max-w-sm bg-[var(--card)] rounded-2xl p-8 shadow-[0_4px_12px_rgba(26,35,126,0.05)]">
        <div className="flex justify-center mb-3">
          <LogoMark size={64} />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-center text-[var(--heading)] mb-1">
          Aw<span className="text-[#0088cc]">Mu</span>
        </h1>
        <p className="text-[var(--muted)] text-center text-sm mb-8">
          {isLogin ? "Welcome back" : "Create your account"}
        </p>

        {!isLogin && (
          <>
            <input
              type="text"
              placeholder="Your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full mb-3 px-4 py-3 rounded-xl bg-[var(--surface)] text-[var(--text)] placeholder-[var(--muted)] outline-none focus:ring-2 focus:ring-[#0088cc] text-sm"
            />
            <div className="relative mb-3">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--muted)] text-sm">@</span>
              <input
                type="text"
                placeholder="username"
                value={username}
                onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))}
                maxLength={20}
                className="w-full pl-9 pr-4 py-3 rounded-xl bg-[var(--surface)] text-[var(--text)] placeholder-[var(--muted)] outline-none focus:ring-2 focus:ring-[#0088cc] text-sm"
              />
            </div>
          </>
        )}

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full mb-3 px-4 py-3 rounded-xl bg-[var(--surface)] text-[var(--text)] placeholder-[var(--muted)] outline-none focus:ring-2 focus:ring-[#0088cc] text-sm"
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full mb-2 px-4 py-3 rounded-xl bg-[var(--surface)] text-[var(--text)] placeholder-[var(--muted)] outline-none focus:ring-2 focus:ring-[#0088cc] text-sm"
        />

        {isLogin && (
          <p
            onClick={forgotPassword}
            className="text-[var(--muted)] text-xs text-right mb-4 cursor-pointer hover:text-[#0088cc]"
          >
            Forgot password?
          </p>
        )}
        {!isLogin && <div className="mb-2" />}

        {error && <p className="text-[#ba1a1a] text-xs mb-3">{error}</p>}
        {info && <p className="text-[#0088cc] text-xs mb-3">{info}</p>}

        <button
          onClick={handleSubmit}
          disabled={loading}
          className="w-full py-3 rounded-[10px] bg-[#0088cc] text-white font-medium disabled:opacity-50 active:bg-[#006193] transition send-tap"
        >
          {loading ? "..." : isLogin ? "Login" : "Sign Up"}
        </button>

        <p
          onClick={() => { setIsLogin(!isLogin); setError(""); setInfo(""); }}
          className="text-[#0088cc] text-sm text-center mt-5 cursor-pointer font-medium"
        >
          {isLogin ? "Naya account banao →" : "← Already have account? Login"}
        </p>
      </div>
    </main>
  );
}
