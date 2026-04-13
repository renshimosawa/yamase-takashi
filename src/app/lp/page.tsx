import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "LP | ヤマセ君の知らせ",
  description: "ヤマセ君の知らせのランディングページです。",
  openGraph: {
    title: "LP | ヤマセ君の知らせ",
    description: "ヤマセ君の知らせのランディングページです。",
    url: "https://yamasekun-no-shirase.vercel.app/lp/",
    type: "website",
  },
  alternates: {
    canonical: "https://yamasekun-no-shirase.vercel.app/lp/",
  },
};

export default function LandingPage() {
  return (
    <main className="mx-auto flex min-h-[100svh] w-full max-w-4xl flex-col items-center justify-center px-6 py-20 text-center">
      <h1 className="text-3xl font-bold tracking-tight sm:text-5xl">
        ヤマセ君の知らせ
      </h1>
      <p className="mt-4 text-base text-gray-700 sm:text-lg">
        青森の「ヤマセ」の気配をみんなで共有するサービスです。
      </p>
    </main>
  );
}
