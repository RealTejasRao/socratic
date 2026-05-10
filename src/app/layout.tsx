import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import ClickPulse from "@/src/components/ClickPulse";
import {
  absoluteUrl,
  organizationSchema,
  seoConfig,
  softwareApplicationSchema,
  websiteSchema,
} from "@/src/lib/seo";
import "./globals.css";

const THEME_INIT_SCRIPT = `(() => {
  try {
    const savedTheme = localStorage.getItem("socratic:theme");
    const useDark = savedTheme ? savedTheme === "dark" : true;
    document.documentElement.classList.toggle("app-dark", useDark);
  } catch {}
})();`;

export const metadata: Metadata = {
  metadataBase: new URL(seoConfig.siteUrl),
  applicationName: seoConfig.applicationName,
  title: {
    default: seoConfig.defaultTitle,
    template: seoConfig.titleTemplate,
  },
  description: seoConfig.defaultDescription,
  keywords: [...seoConfig.keywords],
  authors: [...seoConfig.authors],
  creator: seoConfig.creator,
  publisher: seoConfig.publisher,
  category: seoConfig.category,
  alternates: {
    canonical: absoluteUrl("/"),
  },
  robots: {
    index: true,
    follow: true,
    nocache: false,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: seoConfig.siteName,
    url: absoluteUrl("/"),
    title: seoConfig.defaultTitle,
    description: seoConfig.defaultDescription,
    images: [
      {
        url: "/home/hero.webp",
        width: 1200,
        height: 630,
        alt: "Socratic AI - AI for philosophy and strategic thinking",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: seoConfig.defaultTitle,
    description: seoConfig.defaultDescription,
    images: ["/home/hero.webp"],
  },
  icons: {
    icon: [
      { url: "/favicon/favicon.ico", sizes: "any" },
      {
        url: "/favicon/favicon.svg",
        type: "image/svg+xml",
      },
      {
        url: "/favicon/favicon-96x96.png",
        type: "image/png",
        sizes: "96x96",
      },
    ],
    apple: [
      {
        url: "/favicon/apple-touch-icon.png",
        sizes: "180x180",
        type: "image/png",
      },
    ],
    shortcut: ["/favicon/favicon.ico"],
  },
  manifest: "/favicon/site.webmanifest",
};

const structuredData = [organizationSchema, websiteSchema, softwareApplicationSchema];

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: THEME_INIT_SCRIPT,
          }}
        />
        <link rel="dns-prefetch" href="https://res.cloudinary.com" />
        <link
          rel="preconnect"
          href="https://res.cloudinary.com"
          crossOrigin="anonymous"
        />
      </head>
      <body>
        <ClerkProvider>
          {structuredData.map((schema, index) => (
            <script
              key={`ld-json-${index}`}
              type="application/ld+json"
              dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
            />
          ))}
          <ClickPulse />
          {children}
        </ClerkProvider>
      </body>
    </html>
  );
}
