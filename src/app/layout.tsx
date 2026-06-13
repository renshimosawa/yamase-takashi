import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import "./globals.scss";

import { getServerAuthSession } from "@/lib/auth";
import Providers from "@/components/Providers";

export const dynamic = "force-dynamic";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export async function generateMetadata(): Promise<Metadata> {
  const isStaging =
    (process.env.NEXT_PUBLIC_APP_ENV ?? "") === "staging" ||
    (process.env.NEXT_PUBLIC_SITE_URL ?? "").includes("stg.");

  return {
    metadataBase: new URL("https://yamasekun.jp"),
    title: "ヤマセ君の知らせ",
    description:
      "八戸のヤマセをみんなで記録・共有しよう。今いる場所のにおいは、ほやですか？ドッグフードですか？地図上でヤマセの強さや気温・風の状況をリアルタイムにチェックできる、八戸発の天気共有アプリです。",
    keywords: [
      "やませくん",
      "ヤマセ君",
      "ヤマセ君の知らせ",
      "やませ",
      "ヤマセ",
      "八戸",
      "八戸 ヤマセ",
      "八戸 天気",
    ],
    icons: {
      icon: "/favicon.ico",
      apple: isStaging ? "/yamasekun_stg.png" : "/favicon/apple-icon.png",
    },
    manifest: "/manifest.webmanifest",
    themeColor: "#ff5e62",
    robots: isStaging
      ? { index: false, follow: false }
      : { index: true, follow: true },
    alternates: {
      canonical: "https://yamasekun.jp/",
    },
    openGraph: {
      title: "ヤマセ君の知らせ",
      description:
        "ヤマセ君情報を共有しよう。あなたが今いる所のにおいは、ほやですか？ドッグフードですか？",
      url: "https://yamasekun.jp/",
      type: "website",
      images: [
        {
          url: "https://yamasekun.jp/og-image.jpg",
          width: 1200,
          height: 630,
          alt: "ヤマセ君",
        },
      ],
    },
    appleWebApp: {
      capable: true,
      statusBarStyle: "black-translucent",
      title: "ヤマセ君の知らせ",
    },
    formatDetection: {
      telephone: false,
    },
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  let session = null;
  try {
    session = await getServerAuthSession();
  } catch (error) {
    console.error("[layout] Failed to get server auth session", error);
  }

  return (
    <html lang="ja">
      <head>
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-WWTGD2MKZ2"
          strategy="beforeInteractive"
        />
        <Script id="gtag-init" strategy="beforeInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-WWTGD2MKZ2');
          `}
        </Script>
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Providers session={session}>{children}</Providers>
      </body>
    </html>
  );
}
