"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useState } from "react";
import { useSession, signIn, signOut } from "next-auth/react";

import { fetchHachinoheForecast } from "@/lib/weather";

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

  const headline = useMemo(() => {
    if (isLoading) {
      return "天気情報を取得中...";
    }

    if (error) {
      return `天気情報の取得に失敗しました: ${error}`;
    }

    if (!forecast) {
      return "天気情報が利用できません。";
    }

    const { weather, maxTemperature, minTemperature, wind } = forecast;
    const temperatures = [
      `最高 ${formatTemperature(maxTemperature)}`,
      `最低 ${formatTemperature(minTemperature)}`,
    ].join(" / ");
    const windArrow = getWindDirectionArrow(wind);

    return `今日の天気: ${weather}｜気温: ${temperatures}｜風向き: ${wind}${
      windArrow ? ` ${windArrow}` : ""
    }`;
  }, [error, forecast, isLoading]);

  return (
    <div className="font-sans relative h-screen w-screen overflow-hidden">
      <div className="absolute inset-0">
        <OpenStreetMap />
      </div>
      <nav className="absolute left-1/2 bottom-6 z-[1000] w-[calc(100%-2rem)] max-w-4xl -translate-x-1/2 rounded-2xl bg-black/60 text-white shadow-lg backdrop-blur">
        <div
          className="flex flex-col gap-2 px-6 py-4 text-sm"
          aria-live="polite"
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="text-base font-semibold">{headline}</span>
            <UserActions session={session} status={status} />
          </div>
        </div>
      </nav>
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

  if (isLoading) {
    return <span className="text-white/70">認証確認中...</span>;
  }

  if (!isAuthenticated) {
    return (
      <button
        type="button"
        onClick={() => signIn("google")}
        className="rounded-full bg-white/10 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/20"
      >
        Google でログイン
      </button>
    );
  }

  const displayName = session.user?.name ?? session.user?.email ?? "ユーザー";

  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-xs">
        <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-sm font-semibold uppercase">
          {displayName.charAt(0)}
        </span>
        <span className="max-w-[12rem] truncate font-medium">
          {displayName}
        </span>
      </div>
      <button
        type="button"
        onClick={() => signOut({ callbackUrl: "/" })}
        className="rounded-full bg-white/10 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/20"
      >
        ログアウト
      </button>
    </div>
  );
}
