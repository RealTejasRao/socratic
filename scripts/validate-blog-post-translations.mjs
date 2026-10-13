import fs from "node:fs/promises";
import process from "node:process";
import {
  TARGET_LOCALES,
  getSourceContentPath,
  getTranslatedContentPath,
  readBlogPostManifest,
  selectBlogPosts,
} from "./blog-post-translation-utils.mjs";

function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    all: false,
    allowMissing: false,
    locales: [],
    slugs: [],
    files: [],
  };

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];

    if (arg === "--all") {
      options.all = true;
      continue;
    }

    if (arg === "--allow-missing") {
      options.allowMissing = true;
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

  return { ...options, locales };
}

function collectMarkdownLinks(value) {
  return Array.from(value.matchAll(/!?\[[^\]]*]\(([^)\s]+)(?:\s+"[^"]*")?\)/g))
    .map((match) => match[1])
    .sort();
}

function collectUrls(value) {
  return Array.from(value.matchAll(/https?:\/\/[^\s)"'<>]+/g))
    .map((match) => match[0].replace(/[.,;:]$/, ""))
    .sort();
}

function collectImagePaths(value) {
  return Array.from(value.matchAll(/\/blog\/[^\s)"'<>]+/g))
    .map((match) => match[0])
    .sort();
}

function collectHeadingLevels(value) {
  return value
    .split(/\r?\n/)
    .filter((line) => /^#{1,6}\s+/.test(line))
    .map((line) => line.match(/^#+/)?.[0].length ?? 0);
}

function countCodeFenceMarkers(value) {
  return Array.from(value.matchAll(/^```/gm)).length;
}

function compareArrays(label, source, target, issues, context) {
  if (source.length !== target.length) {
    issues.push(
      `${context}: ${label} count mismatch (${source.length} -> ${target.length})`,
    );
    return;
  }

  for (let index = 0; index < source.length; index += 1) {
    if (source[index] !== target[index]) {
      issues.push(`${context}: ${label} changed at index ${index} (${source[index]} -> ${target[index]})`);
    }
  }
}

function validateMarkdownPair(source, target, context, issues, warnings) {
  if (!target.trim()) {
    issues.push(`${context}: translated markdown is empty`);
    return;
  }

  compareArrays(
    "markdown link targets",
    collectMarkdownLinks(source),
    collectMarkdownLinks(target),
    issues,
    context,
  );
  compareArrays("URLs", collectUrls(source), collectUrls(target), issues, context);
  compareArrays(
    "blog image paths",
    collectImagePaths(source),
    collectImagePaths(target),
    issues,
    context,
  );
  compareArrays(
    "heading levels",
    collectHeadingLevels(source),
    collectHeadingLevels(target),
    issues,
    context,
  );

  const sourceFenceCount = countCodeFenceMarkers(source);
  const targetFenceCount = countCodeFenceMarkers(target);
  if (sourceFenceCount !== targetFenceCount) {
    issues.push(
      `${context}: code fence marker count mismatch (${sourceFenceCount} -> ${targetFenceCount})`,
    );
  }

  if (source.trim() === target.trim()) {
    warnings.push(`${context}: translation is identical to English`);
  }

  if (target.includes("\u2014")) {
    issues.push(`${context}: translated markdown contains an em dash`);
  }
}

async function main() {
  const options = parseArgs();
  const manifest = await readBlogPostManifest();
  const posts = selectBlogPosts(manifest, options);
  if (posts.length === 0) {
    throw new Error("No blog posts matched the provided --slug/--file filters.");
  }

  const issues = [];
  const warnings = [];

  for (const locale of options.locales) {
    for (const post of posts) {
      const sourcePath = getSourceContentPath(post);
      const targetPath = getTranslatedContentPath(post, locale);
      const source = await fs.readFile(sourcePath, "utf8");
      const target = await fs.readFile(targetPath, "utf8").catch((error) => {
        if (error?.code === "ENOENT" && options.allowMissing) {
          warnings.push(`${locale}/${post.slug}: missing translated file`);
          return null;
        }
        throw error;
      });

      if (target === null) {
        continue;
      }

      validateMarkdownPair(source, target, `${locale}/${post.slug}`, issues, warnings);
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

  console.log(
    `Validated blog post translations for ${options.locales.join(", ")} (${posts.length} post${posts.length === 1 ? "" : "s"}).`,
  );
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
