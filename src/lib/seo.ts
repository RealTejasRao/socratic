import type { Metadata } from "next";

const SITE_URL = "https://usesocratic.com";
const SITE_NAME = "Socratic AI";
const DEFAULT_OG_IMAGE = "/home/hero.webp";

export const seoConfig = {
  siteUrl: SITE_URL,
  siteName: SITE_NAME,
  applicationName: SITE_NAME,
  defaultTitle: "Socratic AI | AI for Philosophy and Strategic Thinking",
  titleTemplate: "%s | Socratic AI",
  defaultDescription:
    "Socratic AI is an AI thinking partner for philosophy, strategy, and deep reasoning. Build clearer thought with an intelligent learning assistant.",
  category: "education",
  keywords: [
    "Socratic AI",
    "AI for philosophy",
    "ai thinking partner",
    "strategy AI",
    "philosophy AI",
    "intelligent learning assistant",
    "Socratic dialogue AI",
    "critical thinking AI",
  ],
  authors: [{ name: "Socratic AI Team", url: SITE_URL }],
  creator: "Socratic AI Team",
  publisher: "Socratic AI",
  social: {
    x: "https://x.com/useSocraticAI",
    linkedin: "https://www.linkedin.com/company/usesocratic/",
    instagram: "https://www.instagram.com/usesocratic/",
  },
} as const;

function normalizePath(path: string) {
  if (!path || path === "/") {
    return "/";
  }

  const prefixed = path.startsWith("/") ? path : `/${path}`;
  return prefixed.endsWith("/") ? prefixed.slice(0, -1) : prefixed;
}

export function absoluteUrl(path = "/") {
  return new URL(normalizePath(path), SITE_URL).toString();
}

type PageMetadataInput = {
  title: string;
  description: string;
  path: string;
  keywords?: string[];
  index?: boolean;
  ogImage?: string;
};

export function createPageMetadata({
  title,
  description,
  path,
  keywords,
  index = true,
  ogImage = DEFAULT_OG_IMAGE,
}: PageMetadataInput): Metadata {
  const canonical = absoluteUrl(path);
  const fullTitle = title.includes("Socratic AI") ? title : `${title} | Socratic AI`;

  return {
    title,
    description,
    keywords: keywords ?? [...seoConfig.keywords],
    alternates: { canonical },
    robots: {
      index,
      follow: index,
      noarchive: !index,
      nocache: !index,
      googleBot: {
        index,
        follow: index,
        "max-image-preview": index ? "large" : "none",
        "max-snippet": index ? -1 : 0,
      },
    },
    openGraph: {
      type: "website",
      url: canonical,
      siteName: seoConfig.siteName,
      title: fullTitle,
      description,
      images: [{ url: ogImage, width: 1200, height: 630, alt: fullTitle }],
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description,
      images: [ogImage],
    },
  };
}

export const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: seoConfig.siteName,
  url: seoConfig.siteUrl,
  logo: absoluteUrl("/brand/Logo_Dark.png"),
  sameAs: [seoConfig.social.x, seoConfig.social.linkedin, seoConfig.social.instagram],
};

export const websiteSchema = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: seoConfig.siteName,
  url: seoConfig.siteUrl,
  description: seoConfig.defaultDescription,
  publisher: {
    "@type": "Organization",
    name: seoConfig.siteName,
  },
  inLanguage: "en",
};

export const softwareApplicationSchema = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: seoConfig.siteName,
  applicationCategory: "EducationalApplication",
  operatingSystem: "Web",
  url: seoConfig.siteUrl,
  description: seoConfig.defaultDescription,
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
  },
  brand: {
    "@type": "Brand",
    name: seoConfig.siteName,
  },
};

export function createFaqSchema(
  entries: Array<{ question: string; answer: string }>,
) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: entries.map((entry) => ({
      "@type": "Question",
      name: entry.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: entry.answer,
      },
    })),
  };
}
