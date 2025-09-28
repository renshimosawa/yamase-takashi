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
        className="flex items-center gap-1 px-3 py-2 justify-center rounded-full bg-white text-base font-semibold text-black shadow-xl transition hover:bg-white/90"
        aria-label="投稿する"
      >
        <svg
          className="h-5 w-5"
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
        ヤマセ君報告
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
