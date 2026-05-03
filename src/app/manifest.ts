import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "ヤマセ君の知らせ",
    short_name: "ヤマセ君",
    description:
      "ヤマセ君情報を共有しよう。あなたが今いる所のにおいは、ほやですか？ドッグフードですか？",
    lang: "ja-JP",
    id: "/",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#ffffff",
    orientation: "portrait-primary",
    categories: ["social", "weather", "lifestyle"],
    icons: [
      {
        src: "/favicon/web-app-manifest-192x192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/favicon/web-app-manifest-512x512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
    shortcuts: [
      {
        name: "投稿する",
        short_name: "投稿",
        url: "/",
        description: "ヤマセ君報告をすばやく投稿",
      },
    ],
  };
}
