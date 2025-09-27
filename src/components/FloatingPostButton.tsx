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
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="flex h-16 w-16 items-center justify-center rounded-full bg-white text-base font-semibold text-black shadow-xl transition hover:bg-white/90"
        aria-label="投稿する"
      >
        投稿
      </button>
      {isOpen && (
        <div
          className="absolute bottom-20 right-0 w-80 rounded-2xl bg-black/80 p-6 text-white shadow-2xl backdrop-blur"
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
