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
    background_color: "#0f172a",
    theme_color: "#ff5e62",
    orientation: "portrait-primary",
    categories: ["social", "weather", "lifestyle"],
    icons: [
      {
        src: "/favicon.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/yamasekun_base.png",
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
