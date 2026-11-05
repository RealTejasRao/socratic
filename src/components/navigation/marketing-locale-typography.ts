import { Inter, Noto_Sans_Arabic, Noto_Serif } from "next/font/google";
import type { CSSProperties } from "react";
import { LOCALE_DIRECTIONS, type HomeLocale } from "@/src/i18n/locales";
import styles from "./marketing-locale-typography.module.css";

const cyrillicBody = Inter({
  subsets: ["latin", "cyrillic"],
  weight: ["400", "500", "600"],
  display: "swap",
  preload: false,
});
const cyrillicHeading = Noto_Serif({
  subsets: ["cyrillic"],
  weight: "400",
  display: "swap",
  preload: false,
});
const arabic = Noto_Sans_Arabic({
  subsets: ["arabic"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
  preload: false,
});

export function getMarketingLocalePresentation(locale: HomeLocale) {
  const dir = LOCALE_DIRECTIONS[locale];
  const isRtl = dir === "rtl";
  const international = isRtl || locale === "ru";

  return {
    lang: locale,
    dir,
    className: international ? `${styles["international"]} ${isRtl ? styles["rtl"] : ""}` : "",
    style: international ? {
      "--marketing-body-font": isRtl ? arabic.style.fontFamily : cyrillicBody.style.fontFamily,
      "--marketing-heading-font": isRtl ? arabic.style.fontFamily : cyrillicHeading.style.fontFamily,
    } as CSSProperties : undefined,
  };
}
