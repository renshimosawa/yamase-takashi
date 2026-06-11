"use client";

export const dynamic = "force-dynamic";

import dynamicImport from "next/dynamic";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { Session } from "next-auth";
import { getSession } from "next-auth/react";

import { fetchCurrentWeather, fetchHachinoheForecast } from "@/lib/weather";
import Header from "@/components/Header";
import IosPwaGuideBanner from "@/components/IosPwaGuideBanner";
import FloatingPostButton from "@/components/FloatingPostButton";
import PostDetailSheet from "@/components/PostDetailSheet";
import WeatherCircle from "@/components/WeatherCircle";
import WindArrow, { degreesToCompass } from "@/components/WindArrow";
import RefreshButton from "@/components/RefreshButton";
import type { MapPost, MapPostGroup } from "@/components/OpenStreetMap";
import AverageIntensityIndicator from "@/components/AverageIntensityIndicator";

const OpenStreetMap = dynamicImport(
  () => import("@/components/OpenStreetMap"),
  {
    ssr: false,
  },
);

type TodayForecast = {
  weather: string;
  maxTemperature: string | null;
  minTemperature: string | null;
  wind: string;
};

const DOMAIN_NOTICE_DISMISSED_KEY = "domain_notice_dismissed_v1";

// AMeDAS自動観測天気（weather値）に対応する絵文字
const AMEDAS_WEATHER_EMOJI: Record<string, string> = {
  晴れ: "☀️",
  くもり: "☁️",
  煙霧: "🌫️",
  霧: "🌫️",
  降水: "🌧️",
  霧雨: "🌦️",
  着氷性の霧雨: "🌧️",
  雨: "🌧️",
  着氷性の雨: "🌧️",
  みぞれ: "🌨️",
  雪: "❄️",
  凍雨: "🌨️",
  霧雪: "🌨️",
  しゅう雨: "🌦️",
  しゅう雪: "🌨️",
  ひょう: "🧊",
  雷: "⛈️",
};

// 天気文字列を絵文字に変換。
// AMeDASのweather値は完全一致、予報（tsukumijima）の複合文字列は部分一致で判定。
const weatherToEmoji = (weather: string): string => {
  const exact = AMEDAS_WEATHER_EMOJI[weather];
  if (exact) return exact;

  const has = (...keys: string[]) => keys.some((k) => weather.includes(k));

  // 荒天・特殊現象を優先
  if (has("雷")) return "⛈️";
  if (has("ひょう", "雹")) return "🧊";
  if (has("みぞれ")) return "🌨️";
  if (has("雪")) return has("晴") ? "🌨️" : "❄️";
  if (has("霧雨")) return "🌦️";
  if (has("霧", "もや", "煙霧")) return "🌫️";

  // 雨（晴との組み合わせで通り雨・一時雨を表現）
  if (has("大雨", "豪雨", "暴風雨")) return "🌧️";
  if (has("雨", "降水")) return has("晴") ? "🌦️" : "🌧️";

  // 晴れ・曇りの組み合わせ
  if (has("晴") && has("曇", "くもり")) return "⛅";
  if (has("曇", "くもり")) return "☁️";
  if (has("快晴", "晴")) return "☀️";

  return "⛅";
};

export default function Home() {
  const [session, setSession] = useState<Session | null>(null);
  const [authStatus, setAuthStatus] = useState<
    "loading" | "authenticated" | "unauthenticated"
  >("loading");
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
          err instanceof Error ? err.message : "天気情報の取得に失敗しました。",
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

  useEffect(() => {
    let isMounted = true;

    const loadSession = async () => {
      try {
        const sessionData = await getSession();
        if (!isMounted) return;

        if (sessionData) {
          setSession(sessionData);
          setAuthStatus("authenticated");
        } else {
          setSession(null);
          setAuthStatus("unauthenticated");
        }
      } catch (error) {
        if (!isMounted) return;
        console.error("[auth] Failed to load session", error);
        setSession(null);
        setAuthStatus("unauthenticated");
      }
    };

    void loadSession();

    return () => {
      isMounted = false;
    };
  }, []);

  const [currentTemp, setCurrentTemp] = useState<number | null>(null);
  const [currentWindDir, setCurrentWindDir] = useState<number | null>(null);
  const [currentWindSpeed, setCurrentWindSpeed] = useState<number | null>(null);
  const [currentWeather, setCurrentWeather] = useState<string | null>(null);
  const [isLoadingTemp, setIsLoadingTemp] = useState(true);
  const [tempError, setTempError] = useState<string | null>(null);

  useEffect(() => {
    const loadCurrentWeather = async () => {
      try {
        const weather = await fetchCurrentWeather(40.5086, 141.482);
        setCurrentTemp(weather.temperature);
        setCurrentWindDir(weather.windDirection);
        setCurrentWindSpeed(weather.windSpeed);
        setCurrentWeather(weather.weather);
      } catch (err) {
        setTempError(
          err instanceof Error ? err.message : "気温の取得に失敗しました。",
        );
      } finally {
        setIsLoadingTemp(false);
      }
    };

    void loadCurrentWeather();
  }, []);

  const weatherCard = useMemo(() => {
    if (isLoading) {
      return {
        weather: "⛅",
        temperatureLabel: "--",
        temperatureTooltip: "気温を取得中...",
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
        tooltip: error ? `エラー: ${error}` : "天気情報が利用できません。",
      } as const;
    }

    return {
      weather: weatherToEmoji(currentWeather ?? forecast.weather),
      temperatureLabel:
        currentTemp !== null
          ? `${currentTemp.toFixed(1)}℃`
          : isLoadingTemp
            ? "取得中..."
            : (tempError ?? "--"),
      temperatureTooltip:
        currentTemp !== null
          ? `現在気温: ${currentTemp.toFixed(1)}℃`
          : (tempError ?? "気温の取得に失敗しました。"),
      tooltip: `天気: ${currentWeather ?? forecast.weather}\n風向き: ${forecast.wind}`,
    } as const;
  }, [
    error,
    forecast,
    isLoading,
    currentTemp,
    currentWeather,
    isLoadingTemp,
    tempError,
  ]);

  const [posts, setPosts] = useState<MapPost[]>([]);
  const [isLoadingPosts, setIsLoadingPosts] = useState(false);
  const [postError, setPostError] = useState<string | null>(null);
  const [selectedGroup, setSelectedGroup] = useState<MapPostGroup | null>(null);
  const [indicatorRefreshToken, setIndicatorRefreshToken] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showDomainNotice, setShowDomainNotice] = useState(false);
  const [followUserRequestToken, setFollowUserRequestToken] = useState(0);
  const [hasGeolocationFix, setHasGeolocationFix] = useState(false);

  useEffect(() => {
    const dismissed = localStorage.getItem(DOMAIN_NOTICE_DISMISSED_KEY);
    setShowDomainNotice(dismissed !== "1");
  }, []);

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
      setIndicatorRefreshToken((prev) => prev + 1);
    } catch (error) {
      console.error("Failed to fetch posts", error);
      setPostError(
        error instanceof Error ? error.message : "投稿の取得に失敗しました。",
      );
    } finally {
      setIsLoadingPosts(false);
    }
  }, []);

  useEffect(() => {
    void fetchPosts();
  }, [fetchPosts]);

  const refreshAllData = useCallback(async () => {
    setIsRefreshing(true);
    try {
      // 天気情報を更新
      const forecastData = await fetchHachinoheForecast();
      const today = forecastData.forecasts[0];
      setForecast({
        weather: today?.detail.weather ?? today?.telop ?? "--",
        maxTemperature: today?.temperature.max.celsius ?? null,
        minTemperature: today?.temperature.min.celsius ?? null,
        wind: today?.detail.wind ?? "--",
      });

      // 現在の気温・風向を更新
      try {
        const weather = await fetchCurrentWeather(40.5086, 141.482);
        setCurrentTemp(weather.temperature);
        setCurrentWindDir(weather.windDirection);
        setCurrentWindSpeed(weather.windSpeed);
        setCurrentWeather(weather.weather);
        setTempError(null);
      } catch (err) {
        setTempError(
          err instanceof Error ? err.message : "気温の取得に失敗しました。",
        );
      }

      // 投稿データを更新
      await fetchPosts();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "データの更新に失敗しました。",
      );
    } finally {
      setIsRefreshing(false);
    }
  }, [fetchPosts]);

  return (
    <div className="font-sans relative min-h-[100svh] w-screen overflow-hidden">
      <div className="absolute inset-0">
        <OpenStreetMap
          posts={posts}
          onMarkerSelect={setSelectedGroup}
          followUserRequestToken={followUserRequestToken}
          onGeolocationFixChange={setHasGeolocationFix}
        />
      </div>
      <Header session={session} status={authStatus} />

      <IosPwaGuideBanner />
      <aside className="pointer-events-none absolute left-6 top-48 z-[1000] flex flex-col gap-4">
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
          icon={
            <span className="flex flex-col items-center justify-center leading-none">
              <WindArrow degrees={currentWindDir} size={22} />
              {currentWindSpeed !== null && (
                <span className="mt-0.5 text-[9px] font-medium text-white/90">
                  {currentWindSpeed.toFixed(1)}m/s
                </span>
              )}
            </span>
          }
          label="風"
          tooltip={
            currentWindDir !== null
              ? `風向: ${degreesToCompass(currentWindDir)}（${Math.round(currentWindDir)}°）${currentWindSpeed !== null ? `\n風速: ${currentWindSpeed.toFixed(1)}m/s` : ""}${forecast?.wind ? `\n予報: ${forecast.wind}` : ""}`
              : (forecast?.wind ?? weatherCard.tooltip)
          }
        />
      </aside>
      <div className="pointer-events-auto absolute right-6 top-48 z-[1000] flex flex-col gap-2">
        {hasGeolocationFix && (
          <button
            type="button"
            onClick={() => {
              setFollowUserRequestToken((prev) => prev + 1);
            }}
            className="rounded-full bg-white/90 backdrop-blur-sm border border-gray-200 p-3 shadow-lg hover:shadow-xl transition-all duration-200 active:scale-95 transform"
            aria-label="現在地に戻る"
            title="現在地に戻る"
          >
            <svg
              className="w-5 h-5 text-gray-700"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
          </button>
        )}
        <RefreshButton onRefresh={refreshAllData} isLoading={isRefreshing} />
      </div>
      <div className="w-full pointer-events-auto absolute bottom-8 left-0 z-[4000] px-4">
        <FloatingPostButton
          onSubmitted={fetchPosts}
          isLoading={isLoadingPosts}
          error={postError}
          session={session}
          status={authStatus}
        />
      </div>
      <AverageIntensityIndicator
        refreshToken={indicatorRefreshToken}
        className="absolute bottom-4 right-0 z-[1000]"
      />
      <PostDetailSheet
        group={selectedGroup}
        onClose={() => setSelectedGroup(null)}
      />
    </div>
  );
}
