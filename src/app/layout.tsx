import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
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

export const metadata: Metadata = {
  metadataBase: new URL("https://yamasekun-no-shirase.vercel.app"),
  title: "ヤマセ君の知らせ",
  description:
    "ヤマセ君情報を共有しよう。あなたが今いる所のにおいは、ほやですか？ドッグフードですか？",
  icons: {
    icon: "/favicon.png",
    apple: "/yamasekun_base.png",
  },
  manifest: "/manifest.webmanifest",
  themeColor: "#ff5e62",
  alternates: {
    canonical: "https://yamasekun-no-shirase.vercel.app/",
  },
  openGraph: {
    title: "ヤマセ君の知らせ",
    description:
      "ヤマセ君情報を共有しよう。あなたが今いる所のにおいは、ほやですか？ドッグフードですか？",
    url: "https://yamasekun-no-shirase.vercel.app/",
    type: "website",
    images: [
      {
        url: "https://yamasekun-no-shirase.vercel.app/og-image.jpg",
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
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Providers session={session}>{children}</Providers>
      </body>
    </html>
  );
}
