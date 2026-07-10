"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Shortcuts() {
  const router = useRouter();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const inInput = ["INPUT", "TEXTAREA"].includes((e.target as HTMLElement)?.tagName);

      // Ctrl/Cmd + K — search
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        router.push("/search");
      }
      // Ctrl/Cmd + , — settings
      if ((e.ctrlKey || e.metaKey) && e.key === ",") {
        e.preventDefault();
        router.push("/settings");
      }
      // Esc — back to chats (input me na ho to)
      if (e.key === "Escape" && !inInput) {
        router.push("/chats");
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [router]);

  return null;
}
