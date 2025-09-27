"use client";

import dynamic from "next/dynamic";

const OpenStreetMap = dynamic(() => import("@/components/OpenStreetMap"), {
  ssr: false,
});

export default function Home() {
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
      </header>
    </div>
  );
}
