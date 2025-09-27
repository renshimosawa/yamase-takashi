"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useState } from "react";

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
      <header className="pointer-events-none absolute left-1/2 top-8 z-[1000] w-full max-w-3xl -translate-x-1/2 rounded-lg bg-black/40 p-6 text-white shadow-lg backdrop-blur">
        <h1 className="text-3xl font-bold">やませ たかし</h1>
        <p className="mt-2 text-base">
          OpenStreetMap で現在地を可視化しています。
        </p>
        <p className="mt-4 text-sm font-medium" aria-live="polite">
          {headline}
        </p>
      </header>
    </div>
  );
}
