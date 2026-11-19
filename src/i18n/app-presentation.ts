import { Inter, Noto_Sans_Arabic, Noto_Serif } from "next/font/google";
import { LOCALE_DIRECTIONS, type AppLocale } from "./locales";
import styles from "./app-presentation.module.css";

const russianBody = Inter({ subsets: ["latin", "cyrillic"], weight: ["400", "500", "600", "700"], display: "swap", preload: false });
const russianHeading = Noto_Serif({ subsets: ["cyrillic"], weight: "400", display: "swap", preload: false });
const arabic = Noto_Sans_Arabic({ subsets: ["arabic"], weight: ["400", "500", "600", "700"], display: "swap", preload: false });

export function getAppLocalePresentation(locale: AppLocale) {
  const dir = LOCALE_DIRECTIONS[locale];
  const international = locale === "ru" || locale === "ar";
  return {
    lang: locale,
    dir,
    className: international ? `${styles["international"]} ${dir === "rtl" ? styles["rtl"] : ""}` : "",
    style: international ? {
      fontFamily: locale === "ar" ? arabic.style.fontFamily : russianBody.style.fontFamily,
      "--app-body-font": locale === "ar" ? arabic.style.fontFamily : russianBody.style.fontFamily,
      "--app-heading-font": locale === "ar" ? arabic.style.fontFamily : russianHeading.style.fontFamily,
    } : undefined,
  };
}
