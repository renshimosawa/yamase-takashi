"use client";

import { useEffect, useState } from "react";
import type { Session } from "next-auth";
import PostForm from "./PostForm";

type FloatingPostButtonProps = {
  onSubmitted: () => Promise<void> | void;
  isLoading: boolean;
  error: string | null;
  session: Session | null;
  status: "loading" | "authenticated" | "unauthenticated";
};

export default function FloatingPostButton({
  onSubmitted,
  isLoading,
  error,
  session,
  status,
}: FloatingPostButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  return (
    <div className="relative w-full">
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="group relative flex items-center gap-2 px-5 py-3 justify-center rounded-full bg-gradient-to-r from-[#FF8A00] via-[#FF5E62] to-[#FF2D55] text-base font-semibold text-white shadow-[0_10px_30px_rgba(255,94,98,0.45)] transition hover:shadow-[0_12px_40px_rgba(255,94,98,0.55)] focus:outline-none focus-visible:ring-4 focus-visible:ring-[#FF5E62]/50"
        aria-label="投稿する"
      >
        <span
          className="absolute inset-0 rounded-full bg-white/20 opacity-0 transition group-hover:opacity-100"
          aria-hidden="true"
        />
        <span className="relative flex items-center gap-2">
          <svg
            className="h-5 w-5 drop-shadow-[0_3px_6px_rgba(0,0,0,0.25)]"
            viewBox="0 0 20 20"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            <path
              d="M10 4v12m6-6H4"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <span className="drop-shadow-[0_3px_6px_rgba(0,0,0,0.25)]">
            ヤマセ君報告
          </span>
        </span>
      </button>
      {isOpen && (
        <div
          className="fixed inset-0 z-[4000] flex items-end justify-center p-4 sm:items-center sm:p-8"
          role="dialog"
          aria-modal="true"
        >
          <button
            type="button"
            aria-label="モーダルを閉じる"
            onClick={() => setIsOpen(false)}
            className="absolute inset-0 cursor-pointer bg-black/70 backdrop-blur-sm transition-opacity"
          />
          <div className="relative z-10 w-full max-w-[500px] max-h-[90svh] overflow-y-auto rounded-3xl border border-white/10 bg-black/80 p-6 text-white shadow-[0_20px_60px_rgba(0,0,0,0.6)] backdrop-blur">
            <div className="mb-4 flex items-start justify-between gap-4">
              <h2 className="text-lg font-semibold">投稿を作成</h2>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="text-white/60 transition hover:text-white"
                aria-label="閉じる"
              >
                ✕
              </button>
            </div>
            <PostForm
              onSubmitted={async () => {
                await onSubmitted();
              }}
              isLoading={isLoading}
              error={error}
              onClose={() => setIsOpen(false)}
              session={session}
              status={status}
            />
          </div>
        </div>
      )}
    </div>
  );
}
