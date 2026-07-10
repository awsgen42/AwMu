"use client";

import { useEffect, useState } from "react";

type DeleteOptions = {
  canDeleteForEveryone: boolean; // sirf apne messages pe true
};
type DeleteResult = "everyone" | "me" | "cancel";

let openDelete: ((opts: DeleteOptions) => Promise<DeleteResult>) | null = null;

export function askDelete(opts: DeleteOptions): Promise<DeleteResult> {
  if (openDelete) return openDelete(opts);
  return Promise.resolve(window.confirm("Delete?") ? "everyone" : "cancel");
}

export default function DeleteModalHost() {
  const [opts, setOpts] = useState<DeleteOptions | null>(null);
  const [resolver, setResolver] = useState<((v: DeleteResult) => void) | null>(null);
  const [closing, setClosing] = useState(false);

  useEffect(() => {
    openDelete = (o: DeleteOptions) =>
      new Promise<DeleteResult>((resolve) => {
        setClosing(false);
        setOpts(o);
        setResolver(() => resolve);
      });
    return () => { openDelete = null; };
  }, []);

  const close = (result: DeleteResult) => {
    setClosing(true);
    setTimeout(() => {
      resolver?.(result);
      setOpts(null);
      setResolver(null);
      setClosing(false);
    }, 180);
  };

  if (!opts) return null;

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-6"
      onClick={() => close("cancel")}
    >
      <div
        className={`absolute inset-0 bg-black/50 ${closing ? "backdrop-out" : "backdrop-in"}`}
        style={{ backdropFilter: "blur(3px)" }}
      />

      <div
        onClick={(e) => e.stopPropagation()}
        className={`relative w-full max-w-[360px] bg-[var(--card)] rounded-[24px] p-6 shadow-[0_24px_70px_rgba(0,0,0,0.4)] ${
          closing ? "modal-out" : "modal-spring"
        }`}
      >
        <p className="text-[16px] font-medium text-[var(--text)] mb-8 row-in">
          Delete message?
        </p>

        <div className="flex flex-col items-end gap-1">
          {opts.canDeleteForEveryone && (
            <button
              onClick={() => close("everyone")}
              className="px-4 py-2.5 rounded-xl text-[#0088cc] text-[14.5px] font-medium active:bg-[var(--surface)] transition ripple-soft ripple row-in"
              style={{ animationDelay: "0.08s" }}
            >
              Delete for everyone
            </button>
          )}
          <button
            onClick={() => close("me")}
            className="px-4 py-2.5 rounded-xl text-[#0088cc] text-[14.5px] font-medium active:bg-[var(--surface)] transition ripple-soft ripple row-in"
            style={{ animationDelay: "0.14s" }}
          >
            Delete for me
          </button>
          <button
            onClick={() => close("cancel")}
            className="px-4 py-2.5 rounded-xl text-[#0088cc] text-[14.5px] font-medium active:bg-[var(--surface)] transition ripple-soft ripple row-in"
            style={{ animationDelay: "0.2s" }}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
