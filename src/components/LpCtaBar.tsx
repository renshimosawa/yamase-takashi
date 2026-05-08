"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export default function LpCtaBar({
  heroRef,
}: {
  heroRef: React.RefObject<HTMLDivElement | null>;
}) {
  const [heroGone, setHeroGone] = useState(false);
  const [bottomVisible, setBottomVisible] = useState(false);

  useEffect(() => {
    const hero = heroRef.current;
    if (!hero) return;

    const heroObserver = new IntersectionObserver(
      ([entry]) => setHeroGone(!entry.isIntersecting),
      { threshold: 0 },
    );
    heroObserver.observe(hero);

    const bottom = document.getElementById("lp-bottom-cta");
    const bottomObserver = bottom
      ? new IntersectionObserver(
          ([entry]) => setBottomVisible(entry.isIntersecting),
          { threshold: 0 },
        )
      : null;
    if (bottom && bottomObserver) bottomObserver.observe(bottom);

    return () => {
      heroObserver.disconnect();
      bottomObserver?.disconnect();
    };
  }, [heroRef]);

  const visible = heroGone && !bottomVisible;

  return (
    <div
      className={`fixed bottom-0 left-0 right-0 z-50 transition-transform duration-300 ${
        visible ? "translate-y-0" : "translate-y-full"
      }`}
    >
      <div className="bg-white/90 backdrop-blur-md border-t border-slate-200 px-4 py-3 flex items-center justify-between gap-4">
        <p className="text-sm font-bold text-slate-700 hidden sm:block">
          八戸発・無料で今すぐ使えます
        </p>
        <Link
          href="/"
          className="w-full sm:w-auto flex-shrink-0 inline-flex items-center justify-center bg-cyan-700 text-white font-black py-3 px-8 rounded-full hover:bg-cyan-600 transition-colors duration-200 text-sm shadow-md"
        >
          ヤマセ君と暮らす
        </Link>
      </div>
    </div>
  );
}
