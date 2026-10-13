import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import ts from "typescript";

export const SOURCE_LOCALE = "en";
export const TARGET_LOCALES = ["it", "fr", "de", "pt-BR"];
export const LOCALE_NAMES = {
  it: "Italian",
  fr: "French",
  de: "German",
  "pt-BR": "Brazilian Portuguese",
};

export const BLOG_POSTS_SOURCE_PATH = path.join(
  process.cwd(),
  "src",
  "server",
  "blog",
  "posts.ts",
);
export const BLOG_CONTENT_ROOT = path.join(process.cwd(), "public", "blog", "content");
export const BLOG_POST_TRANSLATION_STATE_PATH = path.join(
  process.cwd(),
  "src",
  "i18n",
  "messages",
  ".blog-post-translation-state.json",
);

export async function loadEnvFile(filePath) {
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

export async function loadLocalEnv() {
  await loadEnvFile(path.join(process.cwd(), ".env.local"));
  await loadEnvFile(path.join(process.cwd(), ".env"));
}

export async function readJson(filePath, fallback = null) {
  try {
    return JSON.parse(await fs.readFile(filePath, "utf8"));
  } catch (error) {
    if (error?.code === "ENOENT" && fallback !== null) {
      return fallback;
    }
    throw error;
  }
}

export async function writeJson(filePath, value) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

export function hashString(value) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function getStringProperty(objectLiteral, propertyName) {
  const property = objectLiteral.properties.find((item) => {
    if (!ts.isPropertyAssignment(item)) {
      return false;
    }

    const name = item.name;
    return ts.isIdentifier(name) && name.text === propertyName;
  });

  if (!property || !ts.isPropertyAssignment(property)) {
    return null;
  }

  const initializer = property.initializer;
  if (
    ts.isStringLiteral(initializer) ||
    ts.isNoSubstitutionTemplateLiteral(initializer)
  ) {
    return initializer.text;
  }

  return null;
}

export async function readBlogPostManifest() {
  const sourceText = await fs.readFile(BLOG_POSTS_SOURCE_PATH, "utf8");
  const sourceFile = ts.createSourceFile(
    BLOG_POSTS_SOURCE_PATH,
    sourceText,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TS,
  );
  let blogPostsArray = null;

  function visit(node) {
    if (
      ts.isVariableDeclaration(node) &&
      ts.isIdentifier(node.name) &&
      node.name.text === "BLOG_POSTS" &&
      node.initializer &&
      ts.isArrayLiteralExpression(node.initializer)
    ) {
      blogPostsArray = node.initializer;
      return;
    }

    ts.forEachChild(node, visit);
  }

  visit(sourceFile);

  if (!blogPostsArray) {
    throw new Error("Could not find BLOG_POSTS array in src/server/blog/posts.ts.");
  }

  return blogPostsArray.elements
    .filter(ts.isObjectLiteralExpression)
    .map((entry) => ({
      slug: getStringProperty(entry, "slug"),
      title: getStringProperty(entry, "title"),
      category: getStringProperty(entry, "category"),
      author: getStringProperty(entry, "author"),
      excerpt: getStringProperty(entry, "excerpt"),
      contentFilePath: getStringProperty(entry, "contentFilePath"),
    }))
    .filter((entry) => entry.slug && entry.contentFilePath);
}

export function normalizeContentFilePath(filePath) {
  const normalized = filePath.replaceAll("\\", "/");
  if (path.isAbsolute(normalized)) {
    return path.relative(process.cwd(), normalized).replaceAll("\\", "/");
  }

  return normalized.replace(/^\.?\//, "");
}

export function getSourceContentPath(post) {
  return path.join(process.cwd(), normalizeContentFilePath(post.contentFilePath));
}

export function getTranslatedContentPath(post, locale) {
  return path.join(BLOG_CONTENT_ROOT, locale, path.basename(post.contentFilePath));
}

export function selectBlogPosts(posts, { slugs = [], files = [] }) {
  const normalizedFiles = new Set(files.map(normalizeContentFilePath));

  return posts.filter((post) => {
    const slugMatches = slugs.length === 0 || slugs.includes(post.slug);
    const fileMatches =
      normalizedFiles.size === 0 ||
      normalizedFiles.has(normalizeContentFilePath(post.contentFilePath));
    return slugMatches && fileMatches;
  });
}
