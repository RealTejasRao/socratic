import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const SOURCE_LOCALE = "en";
const TARGET_LOCALES = ["it", "fr", "de", "pt-BR"];
const EXTENDED_TARGET_LOCALES = [...TARGET_LOCALES, "ru", "ar"];
const EXTENDED_PAGES = new Set(["home", "pricing", "billing", "blog"]);
const MESSAGE_ROOT = path.join(process.cwd(), "src", "i18n", "messages");
const PAGE_FILES = {
  home: "home.json",
  pricing: "pricing.json",
  billing: "billing.json",
  blog: "blog.json",
  app: "app.json",
};

function parseArgs() {
  const args = process.argv.slice(2);
  const options = { page: "home" };

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];

    if (arg === "--page") {
      const value = args[index + 1];
      if (!value) {
        throw new Error("--page requires one of: home, pricing, billing, blog, app.");
      }
      options.page = value;
      index += 1;
      continue;
    }

    throw new Error(`Unknown argument: ${arg}`);
  }

  if (!Object.hasOwn(PAGE_FILES, options.page)) {
    throw new Error(`Unsupported page: ${options.page}`);
  }

  return options;
}

async function readJson(filePath) {
  return JSON.parse(await fs.readFile(filePath, "utf8"));
}

function collectPlaceholders(value) {
  return Array.from(value.matchAll(/\{[a-zA-Z0-9_]+\}/g)).map((match) => match[0]).sort();
}

function isLikelyTranslatable(value) {
  return /[a-zA-Z]{4,}/.test(value) && !/^[A-Z][a-z]+$/.test(value);
}

function shouldWarnOnIdenticalString(prefix) {
  if (prefix.endsWith(".id")) {
    return false;
  }

  if (prefix.endsWith(".sourceLabel")) {
    return false;
  }

  if (prefix.endsWith(".highlightedTerm")) {
    return false;
  }

  if (
    prefix.endsWith(".titleProduct") ||
    prefix.endsWith(".product") ||
    prefix.endsWith(".brand") ||
    prefix === "plans.premium.title" ||
    prefix.endsWith(".plans.premium.title")
  ) {
    return false;
  }

  const allowedSameLabels = new Set([
    "nav.home",
    "nav.blog",
    "contact.email",
    "contact.emailPlaceholder",
    "footer.home",
    "footer.blog",
    "footer.account",
    "footer.privacyPolicy",
    "footer.cookiePolicy",
  ]);

  return !allowedSameLabels.has(prefix);
}

function validateShape(source, target, locale, issues, warnings, prefix = "") {
  if (typeof source === "string") {
    if (typeof target !== "string") {
      issues.push(`${locale}:${prefix} is missing or not a string`);
      return;
    }

    if (!target.trim()) {
      issues.push(`${locale}:${prefix} is empty`);
      return;
    }

    const sourcePlaceholders = collectPlaceholders(source).join(",");
    const targetPlaceholders = collectPlaceholders(target).join(",");
    if (sourcePlaceholders !== targetPlaceholders) {
      issues.push(
        `${locale}:${prefix} placeholder mismatch (${sourcePlaceholders || "none"} -> ${targetPlaceholders || "none"})`,
      );
    }

    if (target.includes("\u2014")) {
      issues.push(`${locale}:${prefix} contains an em dash`);
    }

    if (source.includes("Socratic AI") && !target.includes("Socratic AI")) {
      issues.push(`${locale}:${prefix} changed or removed Socratic AI brand name`);
    }

    for (const brand of ["Socratic Plus", "Socratic +", "Socratic+"]) {
      if (source.includes(brand) && !target.includes(brand)) {
        issues.push(`${locale}:${prefix} changed or removed ${brand} product name`);
      }
    }

    if (
      target === source &&
      !["Socratic AI", "Socratic Plus", "Socratic +", "Socratic+"].includes(source) &&
      shouldWarnOnIdenticalString(prefix) &&
      isLikelyTranslatable(source)
    ) {
      warnings.push(`${locale}:${prefix} is identical to English`);
    }

    return;
  }

  if (Array.isArray(source)) {
    if (!Array.isArray(target)) {
      issues.push(`${locale}:${prefix} should be an array`);
      return;
    }

    if (source.length !== target.length) {
      issues.push(`${locale}:${prefix} array length mismatch (${source.length} -> ${target.length})`);
    }

    source.forEach((item, index) => {
      validateShape(item, target[index], locale, issues, warnings, prefix ? `${prefix}.${index}` : String(index));
    });
    return;
  }

  if (source && typeof source === "object") {
    if (!target || typeof target !== "object" || Array.isArray(target)) {
      issues.push(`${locale}:${prefix || "<root>"} should be an object`);
      return;
    }

    for (const key of Object.keys(source)) {
      validateShape(
        source[key],
        target[key],
        locale,
        issues,
        warnings,
        prefix ? `${prefix}.${key}` : key,
      );
    }

    for (const key of Object.keys(target)) {
      if (!(key in source)) {
        warnings.push(`${locale}:${prefix ? `${prefix}.` : ""}${key} is extra`);
      }
    }
  }
}

async function main() {
  const options = parseArgs();
  const messageFile = PAGE_FILES[options.page];
  const source = await readJson(path.join(MESSAGE_ROOT, SOURCE_LOCALE, messageFile));
  const issues = [];
  const warnings = [];

  const targetLocales = EXTENDED_PAGES.has(options.page) ? EXTENDED_TARGET_LOCALES : TARGET_LOCALES;
  for (const locale of targetLocales) {
    const target = await readJson(path.join(MESSAGE_ROOT, locale, messageFile));
    validateShape(source, target, locale, issues, warnings);
    if (options.page === "home" && ["ru", "ar"].includes(locale)) {
      const highlightedGroups = [
        [target.features.headingText, target.features.highlightedTerms],
        [target.security.message, [target.security.highlightedTerm]],
        [target.useCases.headingText, [target.useCases.highlightedWord]],
        [target.contact.heading, target.contact.highlightedTerms],
      ];
      for (const [text, terms] of highlightedGroups) {
        for (const term of terms) {
          if (!text.includes(term)) issues.push(`${locale}: highlighted term "${term}" is absent from its heading or message`);
        }
      }
      for (const [text, first, second] of [
        [target.useCases.headingText, target.useCases.mobileFirstLine, target.useCases.mobileSecondLine],
        [target.contact.heading, target.contact.mobileFirstLine, target.contact.mobileSecondLine],
      ]) {
        if (!text.startsWith(first) || text.indexOf(second) < first.length) {
          issues.push(`${locale}: mobile heading lines do not match the full heading`);
        }
      }
    }
  }

  for (const warning of warnings) {
    console.warn(`Warning: ${warning}`);
  }

  if (issues.length > 0) {
    for (const issue of issues) {
      console.error(`Error: ${issue}`);
    }
    process.exit(1);
  }

  console.log(`Validated ${options.page} translations for ${targetLocales.join(", ")}.`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
