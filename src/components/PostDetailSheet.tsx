"use client";

import type { MapPostGroup } from "./OpenStreetMap";

type PostDetailSheetProps = {
  group: MapPostGroup | null;
  onClose: () => void;
};

export default function PostDetailSheet({
  group,
  onClose,
}: PostDetailSheetProps) {
  if (!group) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-[1500] flex items-end justify-center px-4 pb-4">
      <div className="pointer-events-auto w-full max-w-2xl translate-y-0 rounded-t-3xl bg-black/85 p-6 text-white shadow-2xl backdrop-blur">
        <div className="mb-4 flex items-start justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-white/60">
              投稿詳細
            </p>
            <p className="text-sm text-white/50">
              緯度: {group.latitude.toFixed(6)}｜経度:{" "}
              {group.longitude.toFixed(6)}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
            aria-label="閉じる"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-5 w-5"
            >
              <path d="M18 6 6 18" />
              <path d="m6 6 12 12" />
            </svg>
          </button>
        </div>
        <ul className="max-h-72 space-y-3 overflow-y-auto pr-1">
          {group.posts.map((post) => (
            <li key={post.id} className="rounded-2xl bg-white/10 p-4">
              <div className="mb-2 flex items-center gap-3 text-sm text-white/80">
                <span className="text-xl">{post.emoji ?? "📍"}</span>
                <span className="rounded-full bg-white/20 px-2 py-0.5 text-xs">
                  Lv.{post.intensity ?? "-"}
                </span>
                {post.inserted_at && (
                  <span className="text-xs text-white/60">
                    {new Date(post.inserted_at).toLocaleString("ja-JP")}
                  </span>
                )}
              </div>
              <p className="text-sm text-white">{post.description}</p>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
