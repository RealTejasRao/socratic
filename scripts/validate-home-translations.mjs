import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const SOURCE_LOCALE = "en";
const TARGET_LOCALES = ["it", "fr", "de", "pt-BR"];
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

    if (
      target === source &&
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

  for (const locale of TARGET_LOCALES) {
    const target = await readJson(path.join(MESSAGE_ROOT, locale, messageFile));
    validateShape(source, target, locale, issues, warnings);
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

  console.log(`Validated ${options.page} translations for ${TARGET_LOCALES.join(", ")}.`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
