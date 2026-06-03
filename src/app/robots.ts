import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/lp/",
        disallow: ["/", "/api/", "/mypage/", "/feedback/"],
      },
    ],
    sitemap: "https://yamasekun.jp/sitemap.xml",
  };
}
