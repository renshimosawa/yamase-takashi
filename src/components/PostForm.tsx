"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";

export type PostFormProps = {
  onSubmitted: () => Promise<void> | void;
  isLoading: boolean;
  error: string | null;
  onClose: () => void;
};

export type PostFormState = {
  intensity: number;
  emoji: string;
  description: string;
};

const initialFormState: PostFormState = {
  intensity: 0,
  emoji: "",
  description: "",
};

async function getCurrentPosition(): Promise<GeolocationPosition | null> {
  if (typeof window === "undefined" || !navigator.geolocation) {
    return null;
  }

  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (position) => resolve(position),
      () => resolve(null),
      {
        enableHighAccuracy: false,
        timeout: 5000,
        maximumAge: 60_000,
      }
    );
  });
}

export default function PostForm({
  onSubmitted,
  isLoading,
  error,
  onClose,
}: PostFormProps) {
  const { data: session, status } = useSession();
  const [form, setForm] = useState<PostFormState>(initialFormState);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (status !== "authenticated") {
      setForm(initialFormState);
      setMessage(null);
    }
  }, [status]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!form.description.trim()) {
      setMessage("自由入力欄を入力してください。");
      return;
    }

    setIsSubmitting(true);
    setMessage(null);

    try {
      const position = await getCurrentPosition();

      const response = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          description: form.description,
          intensity: form.intensity,
          emoji: form.emoji || null,
          latitude: position?.coords.latitude ?? null,
          longitude: position?.coords.longitude ?? null,
        }),
      });

      if (!response.ok) {
        const data = (await response.json()) as { error?: string };
        throw new Error(data.error ?? "投稿に失敗しました。");
      }

      setForm(initialFormState);
      setMessage("投稿しました。");
      await onSubmitted();
      onClose();
    } catch (err) {
      console.error("Failed to submit post", err);
      setMessage(err instanceof Error ? err.message : "投稿に失敗しました。");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (status !== "authenticated" || !session?.user) {
    return (
      <p className="text-xs text-white/70">
        投稿機能を利用するには Google でログインしてください。
      </p>
    );
  }

  return (
    <form className="flex flex-col gap-3" onSubmit={handleSubmit}>
      <label className="text-xs uppercase tracking-[0.2em] text-white/60">
        においレベル (0〜3)
      </label>
      <input
        type="range"
        min={0}
        max={3}
        step={1}
        value={form.intensity}
        onChange={(event) =>
          setForm((prev) => ({
            ...prev,
            intensity: Number(event.target.value),
          }))
        }
        className="accent-white"
      />
      <div className="flex items-center justify-between text-xs text-white/70">
        <span>0</span>
        <span>1</span>
        <span>2</span>
        <span>3</span>
      </div>

      <label className="text-xs uppercase tracking-[0.2em] text-white/60">
        絵文字 (1文字)
      </label>
      <input
        type="text"
        value={form.emoji}
        onChange={(event) => {
          const value = event.target.value;
          const chars = [...value];
          setForm((prev) => ({ ...prev, emoji: chars.slice(0, 1).join("") }));
        }}
        placeholder="🙂"
        className="rounded-xl border border-white/10 bg-white/10 px-3 py-2 text-base text-white shadow-inner outline-none transition focus:border-white/30 focus:bg-black/20"
      />

      <label className="text-xs uppercase tracking-[0.2em] text-white/60">
        自由入力 (50文字以内)
      </label>
      <textarea
        value={form.description}
        onChange={(event) =>
          setForm((prev) => ({
            ...prev,
            description: event.target.value.slice(0, 50),
          }))
        }
        placeholder="周辺の状況を入力"
        rows={4}
        className="h-28 w-full resize-none rounded-xl border border-white/10 bg-white/10 p-3 text-sm text-white shadow-inner outline-none transition focus:border-white/30 focus:bg-black/20"
      />

      <div className="flex flex-wrap items-center justify-between gap-3">
        {message && <span className="text-xs text-white/80">{message}</span>}
        {error && <span className="text-xs text-red-300">{error}</span>}
        <button
          type="submit"
          disabled={isSubmitting || isLoading}
          className="ml-auto rounded-full bg-white px-4 py-2 text-sm font-semibold text-black transition hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting || isLoading ? "送信中..." : "投稿する"}
        </button>
      </div>
    </form>
  );
}
