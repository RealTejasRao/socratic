import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import ts from "typescript";
import { validateMarkdownPair } from "./blog-post-markdown-validation.mjs";
import { TARGET_LOCALES, LOCALE_NAMES, hashString } from "./blog-post-translation-utils.mjs";

const root = fileURLToPath(new URL("../", import.meta.url));
const require = createRequire(import.meta.url);
const cache = new Map();
const newLocales = ["ru", "ar"];
const publishedPages = ["/", "/pricing", "/billing", "/blog"];

// Load pure TypeScript modules without starting Next.js or connecting to services.
function load(relativePath) {
  const filename = path.join(root, relativePath);
  if (cache.has(filename)) return cache.get(filename).exports;
  const loadedModule = { exports: {} };
  cache.set(filename, loadedModule);
  const source = fs.readFileSync(filename, "utf8");
  if (filename.endsWith(".json")) {
    loadedModule.exports = JSON.parse(source);
    return loadedModule.exports;
  }
  const compiled = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
  }).outputText;
  const resolveImport = (specifier) => {
    if (specifier.startsWith("@/")) {
      const base = specifier.slice(2);
      return load(base.endsWith(".json") ? base : `${base}.ts`);
    }
    return require(specifier);
  };
  new Function("require", "module", "exports", compiled)(resolveImport, loadedModule, loadedModule.exports);
  return loadedModule.exports;
}

const locales = load("src/i18n/locales.ts");
const { createPricingMetadata } = load("src/i18n/pricing-metadata.ts");
const { createBillingMetadata } = load("src/i18n/billing-metadata.ts");
const { createBlogMetadata } = load("src/i18n/blog-metadata.ts");
const { getAmbassadorSupportDiscount } = load("src/lib/billing.ts");
const blogPosts = load("src/server/blog/posts.ts");
const { createBlogPostMetadata } = load("src/i18n/blog-post-metadata.ts");

test("new languages are published only on translated marketing pages", () => {
  for (const locale of newLocales) {
    for (const page of publishedPages) {
      const localizedPath = page === "/" ? `/${locale}` : `/${locale}${page}`;
      assert.ok(locales.getAvailableLocalesForPath(page).includes(locale));
      assert.equal(locales.getLocalizedPath(page, locale), localizedPath);
      assert.equal(locales.getLocaleFromPathname(localizedPath), locale);
      assert.equal(locales.getLocaleFromPathname(`${localizedPath}/`), locale);
    }
    for (const page of ["/app", "/app/billing", "/upsc"]) {
      assert.ok(!locales.getAvailableLocalesForPath(page).includes(locale));
      assert.equal(locales.getLocalizedPath(page, locale), page);
      assert.equal(locales.getLocaleFromPathname(`/${locale}${page}`), "en");
    }
    assert.equal(locales.normalizeLocale(locale), "en");
    assert.equal(locales.getLocalizedPath("/blog/example", locale), `/${locale}/blog/example`);
  }
});

test("English defaults and existing localized routes stay unchanged", () => {
  for (const page of ["/", "/pricing", "/billing", "/blog"]) {
    assert.equal(locales.getLocalizedPath(page, "en"), page);
    assert.equal(locales.getLocaleFromPathname(page), "en");
  }
  for (const locale of ["it", "fr", "de", "pt-BR"]) {
    assert.equal(locales.getLocalizedPath("/blog", locale), `/${locale}/blog`);
    assert.equal(locales.getLocaleFromPathname(`/${locale}/blog`), locale);
  }
  assert.equal(locales.getLocaleFromPathname("/zz/pricing"), "en");
  assert.equal(locales.LOCALE_DIRECTIONS.ru, "ltr");
  assert.equal(locales.LOCALE_DIRECTIONS.ar, "rtl");
});

test("removed Kurdish locale falls back to English and stays out of publication", async () => {
  assert.equal(locales.isHomeLocale("ckb"), false);
  assert.equal(locales.normalizeHomeLocale("ckb"), "en");
  assert.equal(locales.normalizeLocale("ckb"), "en");
  assert.ok(!TARGET_LOCALES.includes("ckb"));
  assert.equal(LOCALE_NAMES.ckb, undefined);
  for (const page of [...publishedPages, "/blog/example"]) {
    assert.ok(!locales.getAvailableLocalesForPath(page).includes("ckb"));
    assert.equal(locales.getLocalizedPath(page, "ckb"), page);
    assert.ok(!Object.hasOwn(locales.getLanguageAlternatesForPath(page), "ckb"));
  }
  for (const slug of blogPosts.getAllBlogSlugs()) {
    assert.ok(!blogPosts.getAvailableBlogPostLocales(slug).includes("ckb"));
  }
  const entries = await load("src/app/sitemap.ts").default();
  for (const entry of entries) {
    assert.ok(!entry.url.includes("/ckb"));
    assert.ok(!Object.hasOwn(entry.alternates?.languages ?? {}, "ckb"));
  }
});

test("pricing canonicals and reciprocal hreflang cover all seven languages", () => {
  for (const locale of locales.PRICING_LOCALES) {
    const metadata = createPricingMetadata(locale);
    const canonical = `https://www.usesocratic.com${locales.getLocalizedPath("/pricing", locale)}`;
    assert.equal(metadata.alternates.canonical, canonical);
    assert.equal(metadata.openGraph.url, canonical);
    assert.equal(metadata.openGraph.locale, locales.LOCALE_OG_LOCALES[locale]);
    assert.equal(metadata.robots.index, true);
    assert.equal(metadata.alternates.languages[locale], canonical);
    assert.equal(Object.keys(metadata.alternates.languages).length, locales.PRICING_LOCALES.length + 1);
    assert.equal(metadata.alternates.languages["x-default"], "https://www.usesocratic.com/pricing");
  }
});

test("private billing pages have localized canonicals and noindex", () => {
  for (const locale of locales.BILLING_LOCALES) {
    const metadata = createBillingMetadata(locale);
    assert.equal(metadata.alternates.canonical, `https://www.usesocratic.com${locales.getLocalizedPath("/billing", locale)}`);
    assert.equal(metadata.robots.index, false);
    assert.equal(metadata.robots.googleBot.index, false);
    assert.equal(metadata.openGraph.locale, locales.LOCALE_OG_LOCALES[locale]);
  }
});

test("sitemap publishes translated listings but not untranslated articles or private billing", async () => {
  const entries = await load("src/app/sitemap.ts").default();
  const urls = entries.map((entry) => entry.url);
  assert.equal(new Set(urls).size, urls.length);
  for (const locale of newLocales) {
    assert.ok(urls.includes(`https://www.usesocratic.com/${locale}`));
    assert.ok(urls.includes(`https://www.usesocratic.com/${locale}/pricing`));
    assert.ok(urls.includes(`https://www.usesocratic.com/${locale}/blog`));
    const translatedUrls = blogPosts.getTranslatedBlogPostSlugs(locale).map((slug) => `https://www.usesocratic.com/${locale}/blog/${slug}`).sort();
    assert.deepEqual(urls.filter((url) => url.startsWith(`https://www.usesocratic.com/${locale}/blog/`)).sort(), translatedUrls);
    assert.ok(!urls.includes(`https://www.usesocratic.com/${locale}/billing`));
  }
});

test("feature names match between pricing plans in each new language", () => {
  for (const locale of newLocales) {
    const { plans } = load(`src/i18n/messages/${locale}/pricing.json`);
    for (const [key, value] of Object.entries(plans.basic.features)) {
      if (Object.hasOwn(plans.premium.features, key)) {
        assert.equal(plans.premium.features[key], value, `${locale}:${key}`);
      }
    }
  }
});

test("Shakar remains case-insensitive at 50%, and other ambassadors remain at 10%", () => {
  for (const code of ["shakar", "SHAKAR", "ShAkAr", " shakar "]) {
    assert.equal(getAmbassadorSupportDiscount(code).percent, 50);
    assert.equal(getAmbassadorSupportDiscount(code).basisPoints, 5000);
  }
  assert.equal(getAmbassadorSupportDiscount("reem106").percent, 10);
});

test("new marketing translation baselines match the reviewed files", () => {
  const hash = (value) => crypto.createHash("sha256").update(value).digest("hex");
  const flatten = (value, prefix = "", result = {}) => {
    if (typeof value === "string") result[prefix] = value;
    else for (const [key, child] of Object.entries(value)) flatten(child, prefix ? `${prefix}.${key}` : key, result);
    return result;
  };
  for (const page of ["pricing", "billing", "blog"]) {
    const source = flatten(load(`src/i18n/messages/en/${page}.json`));
    const state = load(`src/i18n/messages/.${page}-translation-state.json`);
    for (const locale of newLocales) {
      const target = flatten(load(`src/i18n/messages/${locale}/${page}.json`));
      for (const [key, value] of Object.entries(source)) {
        assert.equal(state[locale][key].sourceHash, hash(value), `${locale}/${page}/${key}: source`);
        assert.equal(state[locale][key].targetHash, hash(target[key]), `${locale}/${page}/${key}: target`);
      }
    }
  }
});

test("blog canonicals and reciprocal hreflang cover all seven listing languages", () => {
  for (const locale of locales.BLOG_LOCALES) {
    const metadata = createBlogMetadata(locale);
    const canonical = `https://www.usesocratic.com${locales.getLocalizedPath("/blog", locale)}`;
    assert.equal(metadata.alternates.canonical, canonical);
    assert.equal(metadata.alternates.languages[locale], canonical);
    assert.equal(Object.keys(metadata.alternates.languages).length, locales.BLOG_LOCALES.length + 1);
    assert.equal(metadata.alternates.languages["x-default"], "https://www.usesocratic.com/blog");
    assert.equal(metadata.openGraph.locale, locales.LOCALE_OG_LOCALES[locale]);
    assert.equal(metadata.robots.index, true);
  }
});

test("translated blog labels preserve category identifiers and query values", () => {
  const source = load("src/i18n/messages/en/blog.json");
  for (const locale of locales.BLOG_LOCALES) {
    const translated = load(`src/i18n/messages/${locale}/blog.json`);
    assert.deepEqual(translated.categories.map(({ id, sourceLabel }) => ({ id, sourceLabel })), source.categories.map(({ id, sourceLabel }) => ({ id, sourceLabel })));
    assert.deepEqual(Object.keys(translated.sortOptions), ["newest", "oldest"]);
    assert.ok(translated.listing.readTime.includes("{minutes}"));
  }
});

test("switching listing language preserves filters, sorting, anchors, and preference", () => {
  const source = ts.createSourceFile("switcher.tsx", fs.readFileSync(path.join(root, "src/components/navigation/marketing-locale-switcher.tsx"), "utf8"), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  let handler;
  const findHandler = (node) => {
    if (ts.isVariableDeclaration(node) && node.name.getText(source) === "changeLocale") handler = node.initializer;
    ts.forEachChild(node, findHandler);
  };
  findHandler(source);
  assert.ok(handler, "language click handler must exist");
  const compiled = ts.transpileModule(`const changeLocale = ${handler.getText(source)};`, {
    compilerOptions: { target: ts.ScriptTarget.ES2022 },
  }).outputText;
  let pushedPath;
  const browserDocument = { cookie: "" };
  const scope = {
    isLoading: false, locale: "ru", path: "/blog", pathname: "/ru/blog", availableLocales: undefined,
    document: browserDocument,
    window: { location: { search: "?sort=oldest&category=philosophy", hash: "#articles" } },
    LOCALE_COOKIE_NAME: locales.LOCALE_COOKIE_NAME,
    LOCALE_COOKIE_MAX_AGE_SECONDS: locales.LOCALE_COOKIE_MAX_AGE_SECONDS,
    getLocalizedPath: locales.getLocalizedPath,
    router: { push: (value) => { pushedPath = value; }, refresh: () => {} },
    setIsOpen: () => {}, setPendingLocale: () => {}, startTransition: (action) => action(),
  };
  const changeLocale = new Function(...Object.keys(scope), `${compiled}\nreturn changeLocale;`)(...Object.values(scope));
  changeLocale("ar");
  assert.equal(pushedPath, "/ar/blog?sort=oldest&category=philosophy#articles");
  assert.ok(browserDocument.cookie.startsWith(`${locales.LOCALE_COOKIE_NAME}=ar;`));
  pushedPath = undefined;
  scope.availableLocales = ["en", "ru"];
  const limitedChange = new Function(...Object.keys(scope), `${compiled}\nreturn changeLocale;`)(...Object.values(scope));
  limitedChange("ar");
  assert.equal(pushedPath, undefined, "unpublished article languages cannot be selected");
});

test("article translations require review, validation, and matching source and target hashes", () => {
  const slug = blogPosts.getAllBlogSlugs()[0];
  const state = load("src/i18n/messages/.blog-post-translation-state.json");
  for (const locale of newLocales) {
    const entry = state[locale]?.[slug];
    if (!entry?.approved) continue;
    assert.equal(blogPosts.hasTranslatedBlogPost(slug, locale), true);
    for (const [field, invalid] of [["reviewed", false], ["validated", false], ["approved", false], ["sourceHash", "changed"], ["targetHash", "changed"]]) {
      const previous = entry[field];
      try {
        entry[field] = invalid;
        assert.equal(blogPosts.hasTranslatedBlogPost(slug, locale), false, `${locale}: ${field}`);
      } finally {
        entry[field] = previous;
      }
    }
  }
});

test("article publication survives Windows and Linux Markdown line endings", () => {
  assert.equal(hashString("# Title\r\n\r\nParagraph\r\n"), hashString("# Title\n\nParagraph\n"));
  const originalReadFileSync = fs.readFileSync;
  const state = load("src/i18n/messages/.blog-post-translation-state.json");
  try {
    for (const ending of ["\n", "\r\n"]) {
      fs.readFileSync = (filename, ...args) => {
        const value = originalReadFileSync(filename, ...args);
        if (typeof value === "string" && String(filename).endsWith(".md")) {
          return value.replace(/\r\n/g, "\n").replace(/\n/g, ending);
        }
        return value;
      };
      for (const locale of newLocales) {
        for (const [slug, entry] of Object.entries(state[locale])) {
          if (entry.approved) assert.equal(blogPosts.hasTranslatedBlogPost(slug, locale), true, `${locale}/${slug}: ${JSON.stringify(ending)}`);
        }
      }
    }
  } finally {
    fs.readFileSync = originalReadFileSync;
  }
});

test("article hreflang lists only published translations and uses self-canonicals", () => {
  for (const slug of blogPosts.getAllBlogSlugs()) {
    const available = blogPosts.getAvailableBlogPostLocales(slug);
    for (const locale of available) {
      const post = blogPosts.getBlogPostBySlug(slug, locale);
      const metadata = createBlogPostMetadata(post, locale);
      const canonical = `https://www.usesocratic.com${locales.getLocalizedPath(`/blog/${slug}`, locale)}`;
      assert.equal(metadata.alternates.canonical, canonical);
      assert.equal(metadata.alternates.languages[locale], canonical);
      assert.deepEqual(Object.keys(metadata.alternates.languages).sort(), [...available, "x-default"].sort());
      assert.equal(metadata.openGraph.locale, locales.LOCALE_OG_LOCALES[locale]);
    }
  }
  assert.deepEqual(blogPosts.getAvailableBlogPostLocales("missing-article"), []);
});

test("article validation rejects broken links, placeholders, code, headings, and em dashes", () => {
  const source = '# Source\n\nText {name} [link](https://example.com/path)\n\n## Section\n\n```js\nlet value = 1;\n```\n';
  const valid = source.replace("# Source", "# Traduzione").replace("Text", "Testo").replace("## Section", "## Sezione");
  const issues = [];
  validateMarkdownPair(source, valid, "test", issues, []);
  assert.deepEqual(issues, []);
  for (const invalid of [valid.replace("/path", "/translated"), valid.replace("{name}", "{nome}"), valid.replace("value = 1", "value = 2"), valid.replace("## Sezione", "### Sezione"), `${valid}\u2014`]) {
    const failures = [];
    validateMarkdownPair(source, invalid, "test", failures, []);
    assert.ok(failures.length > 0);
  }
});

test("article bullet lists do not depend on an English heading", () => {
  const source = ts.createSourceFile("article.tsx", fs.readFileSync(path.join(root, "src/app/blog/[slug]/page.tsx"), "utf8"), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const parser = source.statements.find((node) => ts.isFunctionDeclaration(node) && node.name?.text === "toMarkdownBlocks");
  assert.ok(parser);
  const compiled = ts.transpileModule(parser.getText(source), {
    compilerOptions: { target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const parse = new Function(`${compiled}\nreturn toMarkdownBlocks;`)();
  for (const heading of ["Key Takeaways", "Ключевые выводы", "النقاط الرئيسية"]) {
    const blocks = parse(`# Title\n\n## ${heading}\n\n- First point\n- Second point\n\nParagraph after the list.\n`);
    assert.deepEqual(blocks.find((block) => block.type === "ul")?.items, ["First point", "Second point"]);
    assert.equal(blocks.at(-1).content, "Paragraph after the list.");
  }
});
