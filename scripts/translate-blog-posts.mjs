import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import {
  BLOG_POST_TRANSLATION_STATE_PATH,
  LOCALE_NAMES,
  TARGET_LOCALES,
  getSourceContentPath,
  getTranslatedContentPath,
  hashString,
  loadLocalEnv,
  readBlogPostManifest,
  readJson,
  selectBlogPosts,
  writeJson,
} from "./blog-post-translation-utils.mjs";

const DEFAULT_MODEL = "gpt-4o-mini";
const DEFAULT_REQUEST_TIMEOUT_MS = 300_000;
const DEFAULT_MAX_RETRIES = 3;

function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    all: false,
    dryRun: false,
    force: false,
    markCurrent: false,
    review: false,
    locales: [],
    slugs: [],
    files: [],
    model: process.env["OPENAI_BLOG_TRANSLATION_MODEL"] ||
      process.env["OPENAI_TRANSLATION_MODEL"] ||
      DEFAULT_MODEL,
    requestTimeoutMs: Number.parseInt(
      process.env["OPENAI_BLOG_TRANSLATION_TIMEOUT_MS"] ||
        String(DEFAULT_REQUEST_TIMEOUT_MS),
      10,
    ),
    maxRetries: Number.parseInt(
      process.env["OPENAI_BLOG_TRANSLATION_MAX_RETRIES"] ||
        String(DEFAULT_MAX_RETRIES),
      10,
    ),
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

    if (arg === "--review") {
      options.review = true;
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

    if (arg === "--slug") {
      const value = args[index + 1];
      if (!value) {
        throw new Error("--slug requires a blog post slug.");
      }
      options.slugs.push(value);
      index += 1;
      continue;
    }

    if (arg === "--file") {
      const value = args[index + 1];
      if (!value) {
        throw new Error("--file requires a markdown file path.");
      }
      options.files.push(value);
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

    if (arg === "--request-timeout-ms") {
      const value = args[index + 1];
      if (!value) {
        throw new Error("--request-timeout-ms requires a positive integer.");
      }
      options.requestTimeoutMs = Number.parseInt(value, 10);
      index += 1;
      continue;
    }

    if (arg === "--max-retries") {
      const value = args[index + 1];
      if (!value) {
        throw new Error("--max-retries requires a non-negative integer.");
      }
      options.maxRetries = Number.parseInt(value, 10);
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
  for (const locale of locales) {
    if (!TARGET_LOCALES.includes(locale)) {
      throw new Error(`Unsupported locale: ${locale}`);
    }
  }

  if (!Number.isInteger(options.requestTimeoutMs) || options.requestTimeoutMs < 1) {
    throw new Error("--request-timeout-ms must be a positive integer.");
  }

  if (!Number.isInteger(options.maxRetries) || options.maxRetries < 0) {
    throw new Error("--max-retries must be a non-negative integer.");
  }

  return { ...options, locales };
}

function getTranslatePrompt() {
  return [
    "You are translating a complete Socratic AI philosophy blog post.",
    "Before translating, silently read the whole article and understand its thesis, argument structure, authorial voice, rhetorical movement, and philosophical distinctions.",
    "Translate the article into the requested target language as a serious native-language essay, not as a mechanical sentence-by-sentence rendering.",
    "Use your judgment: choose natural phrasing when literal translation sounds awkward, but preserve the meaning, argument, emphasis, and tone.",
    "Preserve the author's voice, intellectual seriousness, rhetorical force, and pacing.",
    "Preserve philosophical precision. Use standard target-language philosophical terms where they exist; if a term is commonly left in English or Latin/Greek, keep it.",
    "Do not simplify the reasoning. Do not add examples. Do not remove caveats. Do not add claims the author did not make.",
    "Preserve Markdown structure exactly: heading levels, paragraph breaks, lists, blockquotes, tables, code fences, inline code, links, image references, and HTML.",
    "Preserve URLs, URL paths, slugs, image paths, file names, citations, proper nouns, book titles, philosopher names, dates, and numbers exactly. Never translate URL paths, slugs, domains, query strings, anchors, or file paths.",
    "Never use em dashes (U+2014). Use commas, colons, semicolons, parentheses, or a simple hyphen instead.",
    "Return only JSON in this exact shape: {\"markdown\":\"translated markdown\"}.",
  ].join(" ");
}

function getReviewPrompt() {
  return [
    "You are reviewing a translated Socratic AI philosophy blog post against its English source.",
    "Read the full source and the full translated draft before making changes.",
    "Correct only issues that harm meaning, philosophical precision, authorial tone, naturalness, or Markdown integrity.",
    "Do not rewrite for its own sake. Do not add or remove ideas. Preserve all Markdown structure, links, URLs, URL paths, slugs, image paths, code, names, dates, and numbers exactly.",
    "Never use em dashes (U+2014). Replace any em dash with commas, colons, semicolons, parentheses, or a simple hyphen.",
    "Return only JSON in this exact shape: {\"markdown\":\"corrected translated markdown\"}.",
  ].join(" ");
}

function removeEmDashes(value) {
  return value.replace(/\u2014/g, "-");
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

function delay(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

async function callOpenAi({
  apiKey,
  model,
  systemPrompt,
  userPayload,
  requestTimeoutMs,
  maxRetries,
}) {
  let lastError = null;

  for (let attempt = 0; attempt <= maxRetries; attempt += 1) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), requestTimeoutMs);

    try {
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        signal: controller.signal,
        body: JSON.stringify({
          model,
          temperature: 0.25,
          response_format: { type: "json_object" },
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: JSON.stringify(userPayload) },
          ],
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`OpenAI request failed (${response.status}): ${errorText}`);
      }

      const payload = await response.json();
      const content = payload?.choices?.[0]?.message?.content;
      if (typeof content !== "string") {
        throw new Error("OpenAI response did not include message content.");
      }

      const parsed = extractJsonObject(content);
      if (typeof parsed.markdown !== "string" || !parsed.markdown.trim()) {
        throw new Error("OpenAI response is missing non-empty markdown.");
      }

      return removeEmDashes(parsed.markdown);
    } catch (error) {
      lastError = error;
      if (attempt >= maxRetries) {
        break;
      }

      const waitMs = Math.min(2 ** attempt * 1500, 10_000);
      console.warn(
        `OpenAI request failed (${error instanceof Error ? error.message : error}); retrying in ${waitMs}ms`,
      );
      await delay(waitMs);
    } finally {
      clearTimeout(timeout);
    }
  }

  throw lastError instanceof Error ? lastError : new Error(String(lastError));
}

async function translatePost({
  apiKey,
  model,
  locale,
  post,
  sourceMarkdown,
  review,
  requestTimeoutMs,
  maxRetries,
}) {
  const translatedMarkdown = await callOpenAi({
    apiKey,
    model,
    systemPrompt: getTranslatePrompt(),
    requestTimeoutMs,
    maxRetries,
    userPayload: {
      targetLocale: locale,
      targetLanguage: LOCALE_NAMES[locale],
      post: {
        slug: post.slug,
        title: post.title,
        category: post.category,
        author: post.author,
        excerpt: post.excerpt,
      },
      markdown: sourceMarkdown,
    },
  });

  if (!review) {
    return translatedMarkdown;
  }

  return callOpenAi({
    apiKey,
    model,
    systemPrompt: getReviewPrompt(),
    requestTimeoutMs,
    maxRetries,
    userPayload: {
      targetLocale: locale,
      targetLanguage: LOCALE_NAMES[locale],
      post: {
        slug: post.slug,
        title: post.title,
        category: post.category,
        author: post.author,
      },
      sourceMarkdown,
      translatedDraftMarkdown: translatedMarkdown,
    },
  });
}

function updateStateForPost(state, locale, post, sourceMarkdown, translatedMarkdown, options) {
  state[locale] = state[locale] || {};
  state[locale][post.slug] = {
    contentFilePath: post.contentFilePath,
    sourceHash: hashString(sourceMarkdown),
    targetHash: hashString(translatedMarkdown),
    model: options.model,
    reviewed: options.review,
    updatedAt: new Date().toISOString(),
  };
}

async function main() {
  const options = parseArgs();
  await loadLocalEnv();

  const apiKey = process.env["OPENAI_API_KEY"];
  if (!apiKey && !options.dryRun && !options.markCurrent) {
    throw new Error("OPENAI_API_KEY is required. Add it to .env.local or your shell.");
  }

  const manifest = await readBlogPostManifest();
  const posts = selectBlogPosts(manifest, options);
  if (posts.length === 0) {
    throw new Error("No blog posts matched the provided --slug/--file filters.");
  }

  const state = await readJson(BLOG_POST_TRANSLATION_STATE_PATH, {});
  let stateChanged = false;

  for (const locale of options.locales) {
    for (const post of posts) {
      const sourcePath = getSourceContentPath(post);
      const targetPath = getTranslatedContentPath(post, locale);
      const sourceMarkdown = await fs.readFile(sourcePath, "utf8");
      const existingTarget = await fs
        .readFile(targetPath, "utf8")
        .catch((error) => {
          if (error?.code === "ENOENT") {
            return "";
          }
          throw error;
        });
      const stateEntry = state[locale]?.[post.slug];
      const sourceHash = hashString(sourceMarkdown);
      const sourceChanged = stateEntry?.sourceHash !== sourceHash;
      const isMissing = !existingTarget.trim();

      if (options.markCurrent) {
        if (!existingTarget.trim()) {
          console.log(`${locale}/${post.slug}: no translated file to mark`);
          continue;
        }
        updateStateForPost(state, locale, post, sourceMarkdown, existingTarget, options);
        stateChanged = true;
        console.log(`${locale}/${post.slug}: marked current translation as baseline`);
        continue;
      }

      if (!options.force && !sourceChanged && !isMissing) {
        console.log(`${locale}/${post.slug}: no changes`);
        continue;
      }

      console.log(
        `${locale}/${post.slug}: translating with ${options.model}${options.review ? " + review" : ""}`,
      );

      if (options.dryRun) {
        console.log(`  ${path.relative(process.cwd(), sourcePath)} -> ${path.relative(process.cwd(), targetPath)}`);
        continue;
      }

      const translatedMarkdown = await translatePost({
        apiKey,
        model: options.model,
        locale,
        post,
        sourceMarkdown,
        review: options.review,
        requestTimeoutMs: options.requestTimeoutMs,
        maxRetries: options.maxRetries,
      });

      await fs.mkdir(path.dirname(targetPath), { recursive: true });
      await fs.writeFile(targetPath, translatedMarkdown.trimEnd() + "\n", "utf8");
      updateStateForPost(state, locale, post, sourceMarkdown, translatedMarkdown, options);
      await writeJson(BLOG_POST_TRANSLATION_STATE_PATH, state);
      stateChanged = false;
      console.log(`${locale}/${post.slug}: wrote ${path.relative(process.cwd(), targetPath)}`);
    }
  }

  if (stateChanged) {
    await writeJson(BLOG_POST_TRANSLATION_STATE_PATH, state);
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
