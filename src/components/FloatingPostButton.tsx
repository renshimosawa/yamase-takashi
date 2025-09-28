"use client";

import { useState } from "react";
import PostForm from "./PostForm";

type FloatingPostButtonProps = {
  onSubmitted: () => Promise<void> | void;
  isLoading: boolean;
  error: string | null;
};

export default function FloatingPostButton({
  onSubmitted,
  isLoading,
  error,
}: FloatingPostButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

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
          className="absolute bottom-15 left-0 w-full max-w-[500px] rounded-2xl bg-black/80 p-6 text-white shadow-2xl backdrop-blur"
          style={{ zIndex: 1200 }}
          role="dialog"
        >
          <div className="mb-4 flex items-start justify-between">
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
            onSubmitted={onSubmitted}
            isLoading={isLoading}
            error={error}
            onClose={() => setIsOpen(false)}
          />
        </div>
      )}
    </div>
  );
}
