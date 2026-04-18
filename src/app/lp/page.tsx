import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

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
    <main className="">
      <section className="flex justify-center items-center gap-8">
        <div className="pl-5 pt-10">
          <h1 className="text-5xl font-bold">ヤマセ君の知らせ</h1>
          <p className="text-lg font-bold mt-2">
            八戸のヤマセと暮らし、つながる。
          </p>
          <Link
            href="/register"
            className="mt-4 inline-block bg-cyan-800 text-white text-lg font-bold leading-none py-4 px-8 rounded-full hover:bg-cyan-600 duration-300"
          >
            使ってみる
          </Link>
        </div>
        <div>
          <Image src={"/yamasekun_base.png"} alt="" width={400} height={400} />
        </div>
      </section>
    </main>
  );
}
