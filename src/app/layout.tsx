import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import ClickPulse from "@/src/components/ClickPulse";
import "./globals.css";

const THEME_INIT_SCRIPT = `(() => {
  try {
    const savedTheme = localStorage.getItem("socratic:theme");
    const useDark = savedTheme ? savedTheme === "dark" : true;
    document.documentElement.classList.toggle("app-dark", useDark);
  } catch {}
})();`;

export const metadata: Metadata = {
  title: "Socratic AI- Your Personal AI for Philosophy",
  description: "Question-first Socratic dialogue system",
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
          <ClickPulse />
          {children}
        </ClerkProvider>
      </body>
    </html>
  );
}
