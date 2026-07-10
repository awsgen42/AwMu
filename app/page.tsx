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
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence,
} from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { validUsername, cleanUsername, isAvailable, claimUsername } from "@/lib/username";
import { LogoMark } from "@/components/Logo";

const Icon = ({ d }: { d: React.ReactNode }) => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--muted)] shrink-0">
    {d}
  </svg>
);

export default function Home() {
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [shake, setShake] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [verifySent, setVerifySent] = useState(false);

  const failFeedback = () => {
    setShake(true);
    if (navigator.vibrate) navigator.vibrate([40, 60, 40]);
    setTimeout(() => setShake(false), 500);
  };
  const router = useRouter();

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      if (u && !verifySent) router.replace("/chats");
    });
    return () => unsub();
  }, [router, verifySent]);

  const forgotPassword = async () => {
    setError("");
    setInfo("");
    if (!email.trim()) {
      setError("Enter your email first, then tap Forgot Password");
      return;
    }
    setResetLoading(true);
    try {
      await sendPasswordResetEmail(auth, email.trim());
      setInfo("Password reset link sent — check your inbox/spam folder ✉️");
    } catch (err: any) {
      setError(err.message);
      failFeedback();
    }
    setResetLoading(false);
  };

  const handleSubmit = async () => {
    setError("");
    setInfo("");
    setLoading(true);
    try {
      await setPersistence(auth, remember ? browserLocalPersistence : browserSessionPersistence);

      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
        setSuccess(true);
        setLoading(false);
        return; // redirect onAuthStateChanged karega
      } else {
        const uname = cleanUsername(username);
        if (!validUsername(uname)) {
          setError("Username: 3-20 chars, letters/numbers/underscore only");
          failFeedback();
          setLoading(false);
          return;
        }
        if (!(await isAvailable(uname))) {
          setError(`@${uname} is already taken — try another one`);
          failFeedback();
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
        setLoading(false);
        setVerifySent(true);
        return; // verify screen dikhao — auto-redirect onAuthStateChanged rok nahi sakta, isliye screen overlay
      }
    } catch (err: any) {
      setError(err.message);
      failFeedback();
      setLoading(false);
    }
  };

  if (verifySent) {
    return (
      <main
        className="min-h-screen flex items-center justify-center p-6"
        style={{
          background:
            "radial-gradient(1200px 700px at 15% 10%, rgba(0,136,204,0.14), transparent 55%), radial-gradient(1000px 600px at 90% 90%, rgba(0,176,255,0.12), transparent 55%), var(--bg)",
        }}
      >
        <div className="w-full max-w-[400px] bg-[var(--card)]/90 backdrop-blur rounded-[28px] p-8 shadow-[0_20px_60px_rgba(26,35,126,0.1)] modal-spring text-center">
          <div className="w-16 h-16 rounded-2xl bg-[var(--active)] mx-auto mb-5 flex items-center justify-center icon-pop">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#0088cc" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <rect width="20" height="16" x="2" y="4" rx="2" /><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
            </svg>
          </div>
          <h1 className="text-[22px] font-bold text-[var(--text)] mb-2 row-in">Check your email</h1>
          <p className="text-[13.5px] text-[var(--text2)] leading-relaxed mb-2 row-in" style={{ animationDelay: "0.1s" }}>
            We sent a verification link to
          </p>
          <p className="text-[14px] font-semibold text-[#0088cc] mb-6 row-in" style={{ animationDelay: "0.15s" }}>
            {email}
          </p>
          <p className="text-[12px] text-[var(--muted)] mb-6 row-in" style={{ animationDelay: "0.2s" }}>
            Tap the link in the email, then continue. Check spam if you don't see it.
          </p>
          <button
            onClick={() => router.replace("/chats")}
            className="w-full py-3.5 rounded-full text-white text-[14.5px] font-semibold ripple row-in"
            style={{
              animationDelay: "0.25s",
              background: "linear-gradient(135deg, #00a2e8, #0066b3)",
              boxShadow: "0 8px 24px rgba(0,136,204,0.35)",
            }}
          >
            Continue to AwMu
          </button>
          <p className="text-[11px] text-[var(--muted)] mt-4 row-in" style={{ animationDelay: "0.3s" }}>
            You can verify later — a reminder will appear in the app.
          </p>
        </div>
      </main>
    );
  }

  const inputCls =
    "flex items-center gap-3 w-full px-5 py-3.5 rounded-full border border-[var(--outline)] bg-[var(--card)] focus-within:border-[#0088cc] focus-within:ring-2 focus-within:ring-[#0088cc]/15 transition";

  return (
    <main
      className="min-h-screen flex items-center justify-center p-6"
      style={{
        background:
          "radial-gradient(1200px 700px at 15% 10%, rgba(0,136,204,0.14), transparent 55%), radial-gradient(1000px 600px at 90% 90%, rgba(0,176,255,0.12), transparent 55%), var(--bg)",
      }}
    >
      <div className={`w-full max-w-[400px] bg-[var(--card)]/90 backdrop-blur rounded-[28px] p-8 shadow-[0_20px_60px_rgba(26,35,126,0.1)] fade-up ${shake ? "card-shake" : ""}`}>
        {/* Logo tile */}
        <div className="flex justify-center mb-5">
          <div className="bg-[var(--card)] rounded-2xl p-3 shadow-[0_8px_24px_rgba(0,136,204,0.15)] avatar-pop">
            <LogoMark size={44} />
          </div>
        </div>

        <h1 className="text-[26px] font-bold tracking-tight text-center text-[var(--text)] mb-1 title-in">
          {isLogin ? "Welcome Back" : "Create Account"}
        </h1>
        <p className="text-[var(--muted)] text-center text-[13px] mb-8 row-in" style={{ animationDelay: "0.1s" }}>
          {isLogin ? "Log in to continue your journey" : "Join AwMu — it takes a minute"}
        </p>

        <div key={isLogin ? "login" : "signup"} className="space-y-3.5 form-swap">
          {!isLogin && (
            <>
              <div className={inputCls}>
                <Icon d={<><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></>} />
                <input
                  type="text"
                  placeholder="Your name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="flex-1 bg-transparent outline-none text-sm text-[var(--text)] placeholder-[var(--muted)] min-w-0"
                />
              </div>
              <div className={inputCls}>
                <span className="text-[var(--muted)] text-sm font-medium">@</span>
                <input
                  type="text"
                  placeholder="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))}
                  maxLength={20}
                  className="flex-1 bg-transparent outline-none text-sm text-[var(--text)] placeholder-[var(--muted)] min-w-0"
                />
              </div>
            </>
          )}

          <div className={inputCls}>
            <Icon d={<><rect width="20" height="16" x="2" y="4" rx="2" /><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" /></>} />
            <input
              type="email"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="flex-1 bg-transparent outline-none text-sm text-[var(--text)] placeholder-[var(--muted)] min-w-0"
            />
          </div>

          <div className={inputCls}>
            <Icon d={<><rect width="18" height="11" x="3" y="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></>} />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
              className="flex-1 bg-transparent outline-none text-sm text-[var(--text)] placeholder-[var(--muted)] min-w-0"
            />
          </div>
        </div>

        {isLogin && (
          <div className="flex items-center justify-between mt-4">
            <button
              onClick={() => setRemember(!remember)}
              className="flex items-center gap-2 text-[13px] text-[var(--text2)]"
            >
              <span className={`w-[18px] h-[18px] rounded-md border-2 flex items-center justify-center transition ${
                remember ? "bg-[#0088cc] border-[#0088cc]" : "border-[var(--outline)]"
              }`}>
                {remember && (
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
                )}
              </span>
              Remember me
            </button>
            <button onClick={forgotPassword} disabled={resetLoading} className="text-[13px] font-medium text-[#0088cc] flex items-center gap-1.5">
              {resetLoading && (
                <span className="w-3 h-3 border-[1.5px] border-[#0088cc]/40 border-t-[#0088cc] rounded-full animate-spin" />
              )}
              Forgot Password?
            </button>
          </div>
        )}

        {error && <p className="text-[#ba1a1a] text-xs mt-4 err-in">{error}</p>}
        {info && <p className="text-[#0088cc] text-xs mt-4 err-in">{info}</p>}

        <button
          onClick={handleSubmit}
          disabled={loading || success}
          className={`w-full mt-6 py-3.5 rounded-full text-white text-[14.5px] font-semibold flex items-center justify-center gap-2 ripple active:scale-[0.98] transition-all duration-300 ${
            loading ? "btn-loading" : ""
          } ${success ? "success-pop" : ""}`}
          style={{
            background: success
              ? "linear-gradient(135deg, #00c853, #00963e)"
              : "linear-gradient(135deg, #00a2e8, #0066b3)",
            boxShadow: success
              ? "0 8px 24px rgba(0,200,83,0.4)"
              : "0 8px 24px rgba(0,136,204,0.35)",
          }}
        >
          {success ? (
            <>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 6 9 17l-5-5" className="check-draw" />
              </svg>
              {isLogin ? "Welcome!" : "Account created!"}
            </>
          ) : loading ? (
            <>
              <span className="w-[18px] h-[18px] border-2 border-white/40 border-t-white rounded-full animate-spin" />
              {isLogin ? "Signing in..." : "Creating account..."}
            </>
          ) : (
            <>
              {isLogin ? "Sign In" : "Sign Up"}
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14" /><path d="m12 5 7 7-7 7" />
              </svg>
            </>
          )}
        </button>

        <p className="text-center text-[13px] text-[var(--text2)] mt-7">
          {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
          <button
            onClick={() => { setIsLogin(!isLogin); setError(""); setInfo(""); }}
            className="font-semibold text-[#0088cc]"
          >
            {isLogin ? "Create Account" : "Sign In"}
          </button>
        </p>
      </div>
    </main>
  );
}
