import crypto from "node:crypto";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import process from "node:process";

const DEFAULT_MODEL = "gpt-4o-mini";
const DEFAULT_BATCH_SIZE = 35;
const SOURCE_LOCALE = "en";
const TARGET_LOCALES = ["it", "fr", "de", "pt-BR"];
const LOCALE_NAMES = {
  it: "Italian",
  fr: "French",
  de: "German",
  "pt-BR": "Brazilian Portuguese",
};
const MESSAGE_ROOT = path.join(process.cwd(), "src", "i18n", "messages");
const PAGE_FILES = {
  home: "home.json",
  pricing: "pricing.json",
  billing: "billing.json",
  blog: "blog.json",
  app: "app.json",
};
const PAGE_CONTENT_TYPES = {
  home: "ui",
  pricing: "ui",
  billing: "ui",
  blog: "blog",
  app: "ui",
};

function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    all: false,
    dryRun: false,
    force: false,
    markCurrent: false,
    locales: [],
    model: process.env["OPENAI_TRANSLATION_MODEL"] || DEFAULT_MODEL,
    batchSize: Number.parseInt(
      process.env["OPENAI_TRANSLATION_BATCH_SIZE"] || String(DEFAULT_BATCH_SIZE),
      10,
    ),
    page: "home",
  };

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];

    if (arg === "--all") {
      options.all = true;
      continue;
    }

    if (arg === "--dry-run") {
      options.dryRun = true;
      continue;
    }

    if (arg === "--force") {
      options.force = true;
      continue;
    }

    if (arg === "--mark-current") {
      options.markCurrent = true;
      continue;
    }

    if (arg === "--locale") {
      const value = args[index + 1];
      if (!value) {
        throw new Error("--locale requires a locale code.");
      }
      options.locales.push(value);
      index += 1;
      continue;
    }

    if (arg === "--model") {
      const value = args[index + 1];
      if (!value) {
        throw new Error("--model requires a model name.");
      }
      options.model = value;
      index += 1;
      continue;
    }

    if (arg === "--page") {
      const value = args[index + 1];
      if (!value) {
        throw new Error("--page requires one of: home, pricing, billing, blog, app.");
      }
      options.page = value;
      index += 1;
      continue;
    }

    if (arg === "--batch-size") {
      const value = args[index + 1];
      if (!value) {
        throw new Error("--batch-size requires a positive integer.");
      }
      options.batchSize = Number.parseInt(value, 10);
      index += 1;
      continue;
    }

    throw new Error(`Unknown argument: ${arg}`);
  }

  if (options.all && options.locales.length > 0) {
    throw new Error("Use either --all or --locale, not both.");
  }

  if (!options.all && options.locales.length === 0) {
    options.all = true;
  }

  const locales = options.all ? TARGET_LOCALES : options.locales;
  if (!Number.isInteger(options.batchSize) || options.batchSize < 1) {
    throw new Error("--batch-size must be a positive integer.");
  }

  for (const locale of locales) {
    if (!TARGET_LOCALES.includes(locale)) {
      throw new Error(`Unsupported locale: ${locale}`);
    }
  }

  if (!Object.hasOwn(PAGE_FILES, options.page)) {
    throw new Error(`Unsupported page: ${options.page}`);
  }

  return { ...options, locales };
}

async function loadEnvFile(filePath) {
  try {
    const raw = await fs.readFile(filePath, "utf8");
    for (const line of raw.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) {
        continue;
      }

      const separatorIndex = trimmed.indexOf("=");
      if (separatorIndex < 0) {
        continue;
      }

      const key = trimmed.slice(0, separatorIndex).trim();
      let value = trimmed.slice(separatorIndex + 1).trim();
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }

      if (key && process.env[key] === undefined) {
        process.env[key] = value;
      }
    }
  } catch (error) {
    if (error?.code !== "ENOENT") {
      throw error;
    }
  }
}

async function loadLocalEnv() {
  await loadEnvFile(path.join(process.cwd(), ".env.local"));
  await loadEnvFile(path.join(process.cwd(), ".env"));
}

async function readJson(filePath, fallback = null) {
  try {
    return JSON.parse(await fs.readFile(filePath, "utf8"));
  } catch (error) {
    if (error?.code === "ENOENT" && fallback !== null) {
      return fallback;
    }
    throw error;
  }
}

async function writeJson(filePath, value) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function hashString(value) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function flattenStrings(value, prefix = "", output = {}) {
  if (typeof value === "string") {
    output[prefix] = value;
    return output;
  }

  if (Array.isArray(value)) {
    value.forEach((item, index) => {
      flattenStrings(item, prefix ? `${prefix}.${index}` : String(index), output);
    });
    return output;
  }

  if (value && typeof value === "object") {
    for (const [key, item] of Object.entries(value)) {
      flattenStrings(item, prefix ? `${prefix}.${key}` : key, output);
    }
  }

  return output;
}

function chunkObject(value, size) {
  const entries = Object.entries(value);
  const chunks = [];

  for (let index = 0; index < entries.length; index += size) {
    chunks.push(Object.fromEntries(entries.slice(index, index + size)));
  }

  return chunks;
}

function getAtPath(value, dottedPath) {
  return dottedPath.split(".").reduce((current, segment) => {
    if (current === undefined || current === null) {
      return undefined;
    }
    return current[segment];
  }, value);
}

function isTranslatablePath(dottedPath) {
  return !dottedPath.endsWith(".id") && !dottedPath.endsWith(".sourceLabel");
}

function syncStructure(source, current, translations, prefix = "") {
  if (typeof source === "string") {
    const translated = translations[prefix];
    if (typeof translated === "string") {
      return translated;
    }

    return typeof current === "string" ? current : source;
  }

  if (Array.isArray(source)) {
    return source.map((item, index) =>
      syncStructure(
        item,
        Array.isArray(current) ? current[index] : undefined,
        translations,
        prefix ? `${prefix}.${index}` : String(index),
      ),
    );
  }

  if (source && typeof source === "object") {
    return Object.fromEntries(
      Object.entries(source).map(([key, item]) => [
        key,
        syncStructure(
          item,
          current && typeof current === "object" ? current[key] : undefined,
          translations,
          prefix ? `${prefix}.${key}` : key,
        ),
      ]),
    );
  }

  return source;
}

function getChangedStrings(sourceStrings, currentTarget, stateForLocale, force) {
  const changed = {};

  for (const [stringPath, sourceValue] of Object.entries(sourceStrings)) {
    if (!isTranslatablePath(stringPath)) {
      continue;
    }

    const sourceHash = hashString(sourceValue);
    const targetValue = getAtPath(currentTarget, stringPath);
    const stateEntry = stateForLocale?.[stringPath];
    const isMissing = typeof targetValue !== "string" || targetValue.length === 0;
    const sourceChanged = stateEntry?.sourceHash !== sourceHash;

    if (force || isMissing || sourceChanged) {
      changed[stringPath] = sourceValue;
    }
  }

  return changed;
}

function extractJsonObject(text) {
  try {
    return JSON.parse(text);
  } catch {}

  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced?.[1]) {
    return JSON.parse(fenced[1]);
  }

  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start >= 0 && end > start) {
    return JSON.parse(text.slice(start, end + 1));
  }

  throw new Error("OpenAI response did not contain valid JSON.");
}

function flattenArrayTranslations(value) {
  if (!Array.isArray(value)) {
    return {};
  }

  const output = {};
  for (const item of value) {
    if (!item || typeof item !== "object") {
      continue;
    }

    const key =
      typeof item.key === "string"
        ? item.key
        : typeof item.path === "string"
          ? item.path
          : typeof item.id === "string"
            ? item.id
            : null;
    const text =
      typeof item.text === "string"
        ? item.text
        : typeof item.translation === "string"
          ? item.translation
          : typeof item.value === "string"
            ? item.value
            : null;

    if (key && text) {
      output[key] = text;
    }
  }

  return output;
}

function flattenTranslationCandidate(value) {
  if (Array.isArray(value)) {
    return flattenArrayTranslations(value);
  }

  if (value && typeof value === "object") {
    return flattenStrings(value);
  }

  return {};
}

function getTranslationCandidates(parsed) {
  const candidates = [parsed];

  if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
    for (const key of [
      "translations",
      "translated",
      "translatedStrings",
      "localized",
      "localizedStrings",
      "result",
      "output",
      "data",
    ]) {
      if (parsed[key] !== undefined) {
        candidates.push(parsed[key]);
      }
    }
  }

  return candidates;
}

async function writeTranslationDebug({ page, locale, strings, rawContent, parsed }) {
  const debugPath = path.join(
    os.tmpdir(),
    `socratic-${page}-translation-${locale}-${Date.now()}.json`,
  );

  await fs.writeFile(
    debugPath,
    `${JSON.stringify({ locale, expectedKeys: Object.keys(strings), rawContent, parsed }, null, 2)}\n`,
    "utf8",
  );

  return debugPath;
}

function getSystemPrompt(page) {
  const sharedInstructions = [
    "Return only a flat JSON object whose keys exactly match the input keys.",
    "Example output shape: {\"hero.signedOutCta\":\"translated text\"}.",
    "Translate into the requested target language.",
    "Never use em dashes (U+2014). Use commas, colons, semicolons, parentheses, or a simple hyphen instead.",
    "Preserve placeholders exactly, including {count}.",
    "Preserve every URL exactly, byte-for-byte. Never translate URL paths, slugs, domains, query strings, anchors, or file paths.",
    "Preserve the brand name Socratic AI exactly.",
    "Do not add, remove, rename, or reorder keys.",
    "Do not summarize. Do not explain.",
  ];

  if (PAGE_CONTENT_TYPES[page] === "blog") {
    return [
      "You are translating Socratic AI long-form philosophy blog content.",
      ...sharedInstructions,
      "Preserve all Markdown syntax exactly, including headings, lists, links, tables, blockquotes, code fences, inline code, frontmatter-style values, and image references.",
      "Preserve the argument structure, sequence of claims, nuance, uncertainty, and philosophical distinctions.",
      "Do not simplify the reasoning. Do not add examples. Do not remove caveats. Do not make the prose more generic.",
      "Preserve proper nouns, philosopher names, book titles, technical terms, and SEO keywords unless a standard target-language rendering is clearly natural.",
      "Keep the authorial voice reflective, precise, intellectually serious, and readable for native speakers.",
      "Prefer natural target-language phrasing over literal word-for-word translation, but never change the meaning.",
    ].join(" ");
  }

  return [
    `You are translating Socratic AI ${page} UI copy.`,
    ...sharedInstructions,
    "Keep the tone sharp, reflective, philosophical, and natural.",
  ].join(" ");
}

function removeEmDashes(value) {
  return value.replace(/\u2014/g, "-");
}

async function translateStrings({ apiKey, model, page, locale, strings }) {
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      temperature: 0.2,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: getSystemPrompt(page),
        },
        {
          role: "user",
          content: JSON.stringify({
            targetLocale: locale,
            targetLanguage: LOCALE_NAMES[locale],
            strings,
          }),
        },
      ],
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenAI translation failed (${response.status}): ${errorText}`);
  }

  const payload = await response.json();
  const content = payload?.choices?.[0]?.message?.content;
  if (typeof content !== "string") {
    throw new Error("OpenAI translation response did not include message content.");
  }

  const parsed = extractJsonObject(content);
  const expectedKeys = Object.keys(strings);

  for (const candidate of getTranslationCandidates(parsed)) {
    const parsedStrings = flattenTranslationCandidate(candidate);
    const normalizedTranslations = {};
    const missingKeys = expectedKeys.filter(
      (key) => typeof parsedStrings[key] !== "string",
    );

    if (missingKeys.length === 0) {
      for (const key of expectedKeys) {
        normalizedTranslations[key] = removeEmDashes(parsedStrings[key]);
      }

      return normalizedTranslations;
    }
  }

  const debugPath = await writeTranslationDebug({
    page,
    locale,
    strings,
    rawContent: content,
    parsed,
  });
  const firstMissingKey = expectedKeys.find((key) => {
    const flattened = flattenStrings(parsed);
    return typeof flattened[key] !== "string";
  });

  throw new Error(
    `OpenAI response is missing translated string for ${firstMissingKey ?? expectedKeys[0]}. Debug saved to ${debugPath}`,
  );
}

function updateStateForLocale(state, locale, sourceStrings, translatedTarget) {
  state[locale] = state[locale] || {};

  for (const [stringPath, sourceValue] of Object.entries(sourceStrings)) {
    const targetValue = getAtPath(translatedTarget, stringPath);
    if (typeof targetValue !== "string") {
      continue;
    }

    state[locale][stringPath] = {
      sourceHash: hashString(sourceValue),
      targetHash: hashString(targetValue),
    };
  }
}

async function main() {
  const options = parseArgs();
  await loadLocalEnv();

  const apiKey = process.env["OPENAI_API_KEY"];
  if (!apiKey && !options.dryRun && !options.markCurrent) {
    throw new Error("OPENAI_API_KEY is required. Add it to .env.local or your shell.");
  }

  const messageFile = PAGE_FILES[options.page];
  const stateFile = path.join(MESSAGE_ROOT, `.${options.page}-translation-state.json`);
  const sourcePath = path.join(MESSAGE_ROOT, SOURCE_LOCALE, messageFile);
  const source = await readJson(sourcePath);
  const sourceStrings = flattenStrings(source);
  const state = await readJson(stateFile, {});
  let stateChanged = false;

  for (const locale of options.locales) {
    const targetPath = path.join(MESSAGE_ROOT, locale, messageFile);
    const currentTarget = await readJson(targetPath, {});

    if (options.markCurrent) {
      updateStateForLocale(state, locale, sourceStrings, currentTarget);
      stateChanged = true;
      console.log(`${locale}: marked current translations as baseline`);
      continue;
    }

    const changedStrings = getChangedStrings(
      sourceStrings,
      currentTarget,
      state[locale] || {},
      options.force,
    );
    const changedCount = Object.keys(changedStrings).length;

    if (changedCount === 0) {
      console.log(`${locale}: no changes`);
      continue;
    }

    console.log(
      `${locale}: translating ${changedCount} string${changedCount === 1 ? "" : "s"} with ${options.model}`,
    );

    if (options.dryRun) {
      for (const key of Object.keys(changedStrings)) {
        console.log(`  ${key}`);
      }
      continue;
    }

    const translations = {};
    const batches = chunkObject(changedStrings, options.batchSize);

    for (let index = 0; index < batches.length; index += 1) {
      const batch = batches[index];
      console.log(
        `${locale}: batch ${index + 1}/${batches.length} (${Object.keys(batch).length} strings)`,
      );
      Object.assign(
        translations,
        await translateStrings({
          apiKey,
          model: options.model,
          page: options.page,
          locale,
          strings: batch,
        }),
      );
    }

    const nextTarget = syncStructure(source, currentTarget, translations);

    await writeJson(targetPath, nextTarget);
    updateStateForLocale(state, locale, sourceStrings, nextTarget);
    await writeJson(stateFile, state);
    stateChanged = false;
    console.log(`${locale}: wrote ${path.relative(process.cwd(), targetPath)}`);
  }

  if (stateChanged) {
    await writeJson(stateFile, state);
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
