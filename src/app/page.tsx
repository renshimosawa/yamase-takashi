"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSession, signIn, signOut } from "next-auth/react";

import { fetchHachinoheForecast } from "@/lib/weather";
import type { MapPost, MapPostGroup } from "@/components/OpenStreetMap";

const OpenStreetMap = dynamic(() => import("@/components/OpenStreetMap"), {
  ssr: false,
});

type TodayForecast = {
  weather: string;
  maxTemperature: string | null;
  minTemperature: string | null;
  wind: string;
};

const formatTemperature = (value: string | null) =>
  value !== null && value !== "" ? `${value}℃` : "--";

const getWindDirectionArrow = (wind: string | null) => {
  if (!wind) return "";

  const directionOrder = [
    { keyword: "北東", arrow: "↙️" },
    { keyword: "南東", arrow: "↖️" },
    { keyword: "北西", arrow: "↘️" },
    { keyword: "南西", arrow: "↗️" },
    { keyword: "北", arrow: "⬇️" },
    { keyword: "南", arrow: "⬆️" },
    { keyword: "東", arrow: "⬅️" },
    { keyword: "西", arrow: "➡️" },
  ];

  const matched = directionOrder.find(({ keyword }) => wind.includes(keyword));

  return matched?.arrow ?? "🧭";
};

export default function Home() {
  const { data: session, status } = useSession();
  const [forecast, setForecast] = useState<TodayForecast | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const loadForecast = async () => {
      try {
        const data = await fetchHachinoheForecast();
        if (!isMounted) return;

        const today = data.forecasts[0];
        setForecast({
          weather: today?.detail.weather ?? today?.telop ?? "--",
          maxTemperature: today?.temperature.max.celsius ?? null,
          minTemperature: today?.temperature.min.celsius ?? null,
          wind: today?.detail.wind ?? "--",
        });
      } catch (err) {
        if (!isMounted) return;
        setError(
          err instanceof Error ? err.message : "天気情報の取得に失敗しました。"
        );
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadForecast();

    return () => {
      isMounted = false;
    };
  }, []);

  const weatherCard = useMemo(() => {
    if (isLoading) {
      return {
        weather: "⛅",
        temperature: "--",
        wind: "🌀",
        tooltip: "天気情報を取得中...",
      } as const;
    }

    if (error || !forecast) {
      return {
        weather: "⚠️",
        temperature: "--",
        wind: "🧭",
        tooltip: error ? `エラー: ${error}` : "天気情報が利用できません。",
      } as const;
    }

    const windArrow = getWindDirectionArrow(forecast.wind);
    const temperature = `${formatTemperature(
      forecast.maxTemperature
    )} / ${formatTemperature(forecast.minTemperature)}`;

    return {
      weather: forecast.weather.includes("雨")
        ? "🌧️"
        : forecast.weather.includes("晴")
        ? "☀️"
        : "⛅",
      temperature,
      wind: windArrow || "🧭",
      tooltip: `天気: ${forecast.weather}\n最高: ${formatTemperature(
        forecast.maxTemperature
      )}\n最低: ${formatTemperature(forecast.minTemperature)}\n風向き: ${
        forecast.wind
      }`,
    } as const;
  }, [error, forecast, isLoading]);

  const [posts, setPosts] = useState<MapPost[]>([]);
  const [isLoadingPosts, setIsLoadingPosts] = useState(false);
  const [postError, setPostError] = useState<string | null>(null);
  const [selectedGroup, setSelectedGroup] = useState<MapPostGroup | null>(null);

  const fetchPosts = useCallback(async () => {
    setIsLoadingPosts(true);
    setPostError(null);
    try {
      const response = await fetch("/api/posts", {
        method: "GET",
        cache: "no-store",
      });

      if (!response.ok) {
        const data = (await response.json()) as { error?: string };
        throw new Error(data.error ?? "投稿の取得に失敗しました。");
      }

      const data = (await response.json()) as { posts: MapPost[] };
      setPosts(data.posts ?? []);
    } catch (error) {
      console.error("Failed to fetch posts", error);
      setPostError(
        error instanceof Error ? error.message : "投稿の取得に失敗しました。"
      );
    } finally {
      setIsLoadingPosts(false);
    }
  }, []);

  useEffect(() => {
    void fetchPosts();
  }, [fetchPosts]);

  return (
    <div className="font-sans relative h-screen w-screen overflow-hidden">
      <div className="absolute inset-0">
        <OpenStreetMap posts={posts} onMarkerSelect={setSelectedGroup} />
      </div>
      <aside className="pointer-events-none absolute left-6 top-6 z-[1000] flex flex-col gap-4">
        <WeatherCircle
          icon={weatherCard.weather}
          label="天気"
          tooltip={weatherCard.tooltip}
        />
        <WeatherCircle
          icon={weatherCard.temperature}
          label="気温"
          tooltip={`最高/最低気温: ${weatherCard.temperature}`}
        />
        <WeatherCircle
          icon={weatherCard.wind}
          label="風向"
          tooltip={forecast?.wind ?? weatherCard.tooltip}
        />
      </aside>
      <div className="pointer-events-auto absolute right-6 top-6 z-[1000]">
        <UserActions session={session} status={status} />
      </div>
      <div className="pointer-events-auto absolute bottom-8 right-8 z-[1000]">
        <FloatingPostButton
          onSubmitted={fetchPosts}
          isLoading={isLoadingPosts}
          error={postError}
        />
      </div>
      <PostDetailSheet
        group={selectedGroup}
        onClose={() => setSelectedGroup(null)}
      />
    </div>
  );
}

type PostFormProps = {
  onSubmitted: () => Promise<void> | void;
  isLoading: boolean;
  error: string | null;
  onClose: () => void;
};

type PostFormState = {
  intensity: number;
  emoji: string;
  description: string;
};

const initialFormState: PostFormState = {
  intensity: 0,
  emoji: "",
  description: "",
};

function PostForm({ onSubmitted, isLoading, error, onClose }: PostFormProps) {
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
    } catch (error) {
      console.error("Failed to submit post", error);
      setMessage(
        error instanceof Error ? error.message : "投稿に失敗しました。"
      );
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

type FloatingPostButtonProps = {
  onSubmitted: () => Promise<void> | void;
  isLoading: boolean;
  error: string | null;
};

function FloatingPostButton({
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

type PostDetailSheetProps = {
  group: MapPostGroup | null;
  onClose: () => void;
};

function PostDetailSheet({ group, onClose }: PostDetailSheetProps) {
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
            className="rounded-full bg-white/10 px-3 py-1 text-sm text-white transition hover:bg-white/20"
          >
            閉じる
          </button>
        </div>
        <ul className="space-y-3">
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

type WeatherCircleProps = {
  icon: string;
  label: string;
  tooltip: string;
};

function WeatherCircle({ icon, label, tooltip }: WeatherCircleProps) {
  return (
    <div
      className="flex h-16 w-16 flex-col items-center justify-center gap-1 rounded-full bg-black/70 text-white shadow-lg backdrop-blur"
      title={tooltip}
    >
      <span className="text-2xl">{icon}</span>
      <span className="text-[10px] tracking-[0.2em] uppercase text-white/70">
        {label}
      </span>
    </div>
  );
}

function getCurrentPosition(): Promise<GeolocationPosition | null> {
  if (typeof window === "undefined" || !navigator.geolocation) {
    return Promise.resolve(null);
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

type UserActionsProps = {
  session: ReturnType<typeof useSession>["data"];
  status: ReturnType<typeof useSession>["status"];
};

function UserActions({ session, status }: UserActionsProps) {
  const isLoading = status === "loading";
  const isAuthenticated = status === "authenticated" && session?.user;
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!isMenuOpen) {
      return;
    }

    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isMenuOpen]);

  if (isLoading) {
    return <span className="text-white/70">認証確認中...</span>;
  }

  if (!isAuthenticated) {
    return (
      <button
        type="button"
        onClick={() => signIn("google")}
        className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-black transition hover:bg-white/90"
      >
        Google でログイン
      </button>
    );
  }

  const displayName = session.user?.name ?? session.user?.email ?? "ユーザー";

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        onClick={() => setIsMenuOpen((prev) => !prev)}
        className="flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-black shadow-lg transition hover:bg-white/90"
        aria-haspopup="true"
        aria-expanded={isMenuOpen}
      >
        <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-black/10 text-sm font-semibold uppercase">
          {displayName.charAt(0)}
        </span>
        <span className="max-w-[12rem] truncate">{displayName}</span>
      </button>
      {isMenuOpen && (
        <div className="absolute right-0 mt-3 w-48 rounded-xl bg-black/80 p-3 text-white shadow-xl backdrop-blur">
          <button
            type="button"
            onClick={() => {
              setIsMenuOpen(false);
              void signOut({ callbackUrl: "/" });
            }}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition hover:bg-white/10"
          >
            🚪 ログアウト
          </button>
        </div>
      )}
    </div>
  );
}
