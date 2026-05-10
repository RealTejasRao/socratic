import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/src/lib/seo";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/homepage", "/blog"],
        disallow: [
          "/api/",
          "/app/",
          "/sign-in",
          "/sign-up",
          "/share/",
        ],
      },
    ],
    sitemap: absoluteUrl("/sitemap.xml"),
    host: "usesocratic.com",
  };
}
