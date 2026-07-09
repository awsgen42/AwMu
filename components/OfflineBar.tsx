"use client";

import { useEffect, useState } from "react";

export default function OfflineBar() {
  const [offline, setOffline] = useState(false);
  const [backOnline, setBackOnline] = useState(false);

  useEffect(() => {
    setOffline(!navigator.onLine);
    const goOff = () => { setOffline(true); setBackOnline(false); };
    const goOn = () => {
      setOffline(false);
      setBackOnline(true);
      setTimeout(() => setBackOnline(false), 2500);
    };
    window.addEventListener("offline", goOff);
    window.addEventListener("online", goOn);
    return () => {
      window.removeEventListener("offline", goOff);
      window.removeEventListener("online", goOn);
    };
  }, []);

  if (!offline && !backOnline) return null;

  return (
    <div
      className={`text-center text-[11px] font-medium py-1.5 transition ${
        offline ? "bg-[#5d4037] text-[#ffd9c4]" : "bg-[#00c853]/15 text-[#00963e]"
      }`}
    >
      {offline
        ? "📴 Offline — messages connection wapis aane pe khud send honge"
        : "✓ Wapis online — sync ho raha hai"}
    </div>
  );
}
