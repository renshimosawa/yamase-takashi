"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useState } from "react";

type AverageIntensityIndicatorProps = {
  refreshToken?: number;
  className?: string;
};

export default function AverageIntensityIndicator({
  refreshToken = 0,
  className,
}: AverageIntensityIndicatorProps) {
  const [averageIntensity, setAverageIntensity] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAverageIntensity = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/intensity", {
        method: "GET",
        cache: "no-store",
      });

      if (!response.ok) {
        const data = (await response.json()) as { error?: string };
        throw new Error(data.error ?? "強度情報の取得に失敗しました。");
      }

      const data = (await response.json()) as { average: number | null };
      setAverageIntensity(data.average);
    } catch (err) {
      console.error("Failed to fetch intensity average", err);
      setError(
        err instanceof Error ? err.message : "強度情報の取得に失敗しました。"
      );
      setAverageIntensity(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchAverageIntensity();
  }, [fetchAverageIntensity, refreshToken]);

  const intensityImageSrc = useMemo(() => {
    if (averageIntensity === null) {
      return "/yamasekun/yamase_00.png";
    }

    if (averageIntensity < 1) {
      return "/yamasekun/yamase_00.png";
    }

    if (averageIntensity < 1.8) {
      return "/yamasekun/yamase_01.png";
    }

    if (averageIntensity < 2.5) {
      return "/yamasekun/yamase_02.png";
    }

    return "/yamasekun/yamase_03.png";
  }, [averageIntensity]);

  const intensityStatusLabel = useMemo(() => {
    if (error) {
      return error;
    }

    if (isLoading) {
      return "強度情報を取得中...";
    }

    if (averageIntensity === null) {
      return "本日の投稿がまだありません";
    }

    return `本日の平均強度: ${averageIntensity.toFixed(2)}`;
  }, [averageIntensity, error, isLoading]);

  const containerClassName = [
    "pointer-events-none flex flex-col items-center gap-2 text-right text-white",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={containerClassName}>
      <span className="rounded-full bg-black/60 px-3 py-1 text-xs font-medium backdrop-blur">
        {intensityStatusLabel}
      </span>
      <Image
        src={intensityImageSrc}
        alt="ヤマセくんの平均強度ステータス"
        width={180}
        height={180}
        priority
        className="select-none drop-shadow-[0_4px_12px_rgba(0,0,0,0.4)]"
      />
    </div>
  );
}
