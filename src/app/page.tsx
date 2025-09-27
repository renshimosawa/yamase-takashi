"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSession, signIn, signOut } from "next-auth/react";

import { fetchCurrentTemperature, fetchHachinoheForecast } from "@/lib/weather";
import FloatingPostButton from "@/components/FloatingPostButton";
import PostDetailSheet from "@/components/PostDetailSheet";
import WeatherCircle from "@/components/WeatherCircle";
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

  const [currentTemp, setCurrentTemp] = useState<number | null>(null);
  const [isLoadingTemp, setIsLoadingTemp] = useState(true);
  const [tempError, setTempError] = useState<string | null>(null);

  useEffect(() => {
    const loadCurrentTemp = async () => {
      try {
        const temp = await fetchCurrentTemperature(40.5086, 141.482);
        setCurrentTemp(temp);
      } catch (err) {
        setTempError(
          err instanceof Error ? err.message : "気温の取得に失敗しました。"
        );
      } finally {
        setIsLoadingTemp(false);
      }
    };

    void loadCurrentTemp();
  }, []);

  const weatherCard = useMemo(() => {
    if (isLoading) {
      return {
        weather: "⛅",
        temperatureLabel: "--",
        temperatureTooltip: "気温を取得中...",
        wind: "🌀",
        tooltip: "天気情報を取得中...",
      } as const;
    }

    if (error || !forecast) {
      return {
        weather: "⚠️",
        temperatureLabel: "--",
        temperatureTooltip: error
          ? `エラー: ${error}`
          : "気温情報が利用できません。",
        wind: "🧭",
        tooltip: error ? `エラー: ${error}` : "天気情報が利用できません。",
      } as const;
    }

    const windArrow = getWindDirectionArrow(forecast.wind);

    return {
      weather: forecast.weather.includes("雨")
        ? "🌧️"
        : forecast.weather.includes("晴")
        ? "☀️"
        : "⛅",
      temperatureLabel:
        currentTemp !== null
          ? `${currentTemp.toFixed(1)}℃`
          : isLoadingTemp
          ? "取得中..."
          : tempError ?? "--",
      temperatureTooltip:
        currentTemp !== null
          ? `現在気温: ${currentTemp.toFixed(1)}℃`
          : tempError ?? "気温の取得に失敗しました。",
      wind: windArrow || "🧭",
      tooltip: `天気: ${forecast.weather}\n風向き: ${forecast.wind}`,
    } as const;
  }, [error, forecast, isLoading, currentTemp, isLoadingTemp, tempError]);

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
    <div className="font-sans relative min-h-[100svh] w-screen overflow-hidden">
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
          icon={weatherCard.temperatureLabel}
          label="気温"
          tooltip={weatherCard.temperatureTooltip}
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
