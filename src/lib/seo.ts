import type { Metadata } from "next";

const SITE_URL = "https://www.usesocratic.com";
const SITE_NAME = "Socratic AI";
const DEFAULT_OG_IMAGE = "/home/hero.webp";

export const seoConfig = {
  siteUrl: SITE_URL,
  siteName: SITE_NAME,
  applicationName: SITE_NAME,
  defaultTitle: "Socratic AI | Philosophy, Critical Thinking & Deep Conversations",
  titleTemplate: "Socratic AI | %s",
  defaultDescription:
    "Socratic AI: An AI thinking partner for philosophy, critical thinking, and deep conversation. Built on Socratic dialogue, it challenges your reasoning, sharpens your arguments, and helps you think more clearly.",
  category: "education",
  keywords: [
    "Socratic AI",
    "Socratic AI philosophy",
    "Socratic AI critical thinking",
    "Socratic AI strategy",
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
    instagram: "https://www.instagram.com/usesocraticai/",
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
  follow?: boolean;
  ogImage?: string;
};

export function createPageMetadata({
  title,
  description,
  path,
  keywords,
  index = true,
  follow = index,
  ogImage = DEFAULT_OG_IMAGE,
}: PageMetadataInput): Metadata {
  const canonical = absoluteUrl(path);
  const fullTitle = title.startsWith("Socratic AI")
    ? title
    : title.includes("Socratic AI")
      ? title
      : `Socratic AI | ${title}`;

  return {
    title: { absolute: fullTitle },
    description,
    keywords: keywords ?? [...seoConfig.keywords],
    alternates: { canonical },
    robots: {
      index,
      follow,
      noarchive: !index,
      nocache: !index,
      googleBot: {
        index,
        follow,
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
  "@id": absoluteUrl("/#organization"),
  name: seoConfig.siteName,
  url: seoConfig.siteUrl,
  logo: absoluteUrl("/brand/Logo_Dark.png"),
  sameAs: [seoConfig.social.x, seoConfig.social.linkedin, seoConfig.social.instagram],
};

export const websiteSchema = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  "@id": absoluteUrl("/#website"),
  name: seoConfig.siteName,
  url: seoConfig.siteUrl,
  description: seoConfig.defaultDescription,
  publisher: {
    "@id": absoluteUrl("/#organization"),
  },
  potentialAction: {
    "@type": "SearchAction",
    target: {
      "@type": "EntryPoint",
      urlTemplate: `${seoConfig.siteUrl}/blog?query={search_term_string}`,
    },
    "query-input": "required name=search_term_string",
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

export function createBlogPostingSchema(post: {
  slug: string;
  title: string;
  description: string;
  category: string;
  author: string;
  coverImagePath: string;
  publishedAt: string;
  updatedAt: string;
}) {
  const url = absoluteUrl(`/blog/${post.slug}`);
  const imageUrl = absoluteUrl(post.coverImagePath);

  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "@id": `${url}#blogposting`,
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": url,
    },
    headline: post.title,
    description: post.description,
    image: [imageUrl],
    url,
    datePublished: post.publishedAt,
    dateModified: post.updatedAt,
    author: {
      "@type": "Organization",
      name: post.author,
      url: seoConfig.siteUrl,
    },
    publisher: {
      "@id": absoluteUrl("/#organization"),
    },
    isPartOf: {
      "@id": absoluteUrl("/#website"),
    },
    articleSection: post.category,
    inLanguage: "en",
  };
}
