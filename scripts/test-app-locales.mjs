import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import test from "node:test";
import ts from "typescript";

const root = fileURLToPath(new URL("../", import.meta.url));
const require = createRequire(import.meta.url);

// Evaluate the real locale logic with service boundaries replaced by test doubles.
function createLoader(mocks = {}) {
  const cache = new Map();
  function load(relativePath) {
    const filename = path.resolve(root, relativePath);
    if (cache.has(filename)) return cache.get(filename).exports;
    const loaded = { exports: {} };
    cache.set(filename, loaded);
    const source = fs.readFileSync(filename, "utf8");
    if (filename.endsWith(".json")) return (loaded.exports = JSON.parse(source));
    const compiled = ts.transpileModule(source, {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
    }).outputText;
    const resolve = (specifier) => {
      if (Object.hasOwn(mocks, specifier)) return mocks[specifier];
      const base = specifier.startsWith("@/") ? path.join(root, specifier.slice(2))
        : specifier.startsWith("src/") ? path.join(root, specifier)
        : specifier.startsWith(".") ? path.resolve(path.dirname(filename), specifier) : null;
      return base ? load(path.extname(base) ? base : base + ".ts") : require(specifier);
    };
    new Function("require", "module", "exports", compiled)(resolve, loaded, loaded.exports);
    return loaded.exports;
  }
  return load;
}

const load = createLoader();
const locales = load("src/i18n/locales.ts");
const { getAppCopy } = load("src/i18n/app.ts");
const config = load("src/i18n/app-config.ts");
const { ROLEPLAY_PHILOSOPHERS } = load("src/lib/roleplay.ts");
const { socraticPlans } = load("src/lib/billingsdk-config.ts");
const en = getAppCopy("en");

function flatten(value, prefix = "", entries = {}) {
  for (const [key, child] of Object.entries(value)) {
    const name = prefix ? prefix + "." + key : key;
    if (typeof child === "string") entries[name] = child;
    else flatten(child, name, entries);
  }
  return entries;
}

test("app preferences include Russian and Arabic without changing marketing or UPSC URL rules", () => {
  assert.deepEqual(locales.APP_LOCALES, ["en", "it", "fr", "de", "pt-BR", "ru", "ar"]);
  for (const locale of ["ru", "ar"]) {
    assert.equal(locales.normalizeAppLocale(locale), locale);
    assert.equal(locales.normalizeLocale(locale), "en");
    for (const route of ["/app", "/app/billing", "/app/example", "/upsc/app"]) {
      assert.equal(locales.getLocalizedPath(route, locale), route);
    }
  }
  assert.equal(locales.normalizeAppLocale(undefined), "en");
  assert.equal(locales.normalizeAppLocale("ckb"), "en");
  assert.equal(locales.LOCALE_DIRECTIONS.ar, "rtl");
  assert.equal(locales.LOCALE_DIRECTIONS.ru, "ltr");
});

for (const locale of ["ru", "ar"]) {
  test(locale + ": complete dictionaries preserve placeholders and have no em dashes", () => {
    const source = flatten(en);
    const target = flatten(getAppCopy(locale));
    const state = load("src/i18n/messages/.app-translation-state.json")[locale];
    const hash = text => crypto.createHash("sha256").update(text).digest("hex");
    assert.deepEqual(Object.keys(target).sort(), Object.keys(source).sort());
    for (const [key, text] of Object.entries(source)) {
      assert.ok(target[key].trim(), key);
      assert.ok(!target[key].includes("\u2014"), key);
      assert.deepEqual(target[key].match(/\{\w+\}/g)?.sort(), text.match(/\{\w+\}/g)?.sort(), key);
      assert.equal(state[key].sourceHash, hash(text), key);
      assert.equal(state[key].targetHash, hash(target[key]), key);
    }
  });

  test(locale + ": all philosopher profiles and starter pills are localized without changing character IDs", () => {
    const copy = getAppCopy(locale);
    const profiles = config.getLocalizedRoleplayPhilosophers(copy);
    assert.equal(profiles.length, 39);
    profiles.forEach((profile, index) => {
      const original = ROLEPLAY_PHILOSOPHERS[index];
      const { name, expertise, shortDescription, bestFor, starterPrompts, voicePreview, ...stable } = profile;
      const { name: oldName, expertise: oldExpertise, shortDescription: oldDescription,
        bestFor: oldBestFor, starterPrompts: oldPrompts, voicePreview: oldVoice, ...oldStable } = original;
      assert.deepEqual(stable, oldStable);
      assert.notEqual(name, oldName);
      assert.notEqual(expertise, oldExpertise);
      assert.notEqual(shortDescription, oldDescription);
      assert.notEqual(bestFor, oldBestFor);
      assert.notEqual(voicePreview, oldVoice);
      assert.equal(starterPrompts.length, oldPrompts.length);
      starterPrompts.forEach((prompt, i) => assert.notEqual(prompt, oldPrompts[i]));
    });
    assert.equal(profiles.find(p => p.id === "MARCUS_AURELIUS").name,
      locale === "ru" ? "Марк Аврелий" : "ماركوس أوريليوس");
    assert.equal(config.getLocalizedRoleplayFlair("Cynicism", copy), locale === "ru" ? "Кинизм" : "الكلبية");
  });

  test(locale + ": localized billing display leaves IDs, prices, currency and entitlements unchanged", () => {
    config.getLocalizedBillingPlans(getAppCopy(locale)).forEach((plan, index) => {
      const original = socraticPlans[index];
      for (const key of ["id", "type", "currency", "monthlyPrice", "yearlyPrice", "highlight"]) {
        assert.equal(plan[key], original[key]);
      }
      assert.equal(plan.features.length, original.features.length);
      plan.features.forEach((feature, i) => {
        assert.deepEqual({ ...feature, name: "" }, { ...original.features[i], name: "" });
        assert.ok(!feature.name.includes("{count}"));
      });
    });
    for (const [localize, section] of [
      ["getLocalizedChatFontSizeOptions", "chatFontSizes"],
      ["getLocalizedSocraticToneOptions", "socraticTones"],
      ["getLocalizedDebateToneOptions", "debateTones"],
      ["getLocalizedDebateDurationOptions", "debateDurations"],
    ]) {
      assert.deepEqual(config[localize](getAppCopy(locale)).map(o => o.value).sort(), Object.keys(en.config[section]).sort());
    }
  });
}

test("middleware scopes app preference and Clerk localization to philosopher app requests", async () => {
  const middleware = createLoader({
    "@clerk/nextjs/server": { clerkMiddleware: handler => handler },
    "next/server": { NextResponse: { next: options => options.request.headers } },
  })("src/middleware.ts").default;
  const original = process.env.VERCEL_TARGET_ENV;
  process.env.VERCEL_TARGET_ENV = "preview";
  try {
    for (const locale of ["ru", "ar"]) {
      for (const pathname of ["/app", "/app/example", "/app/billing"]) {
        const headers = await middleware(() => assert.fail("Unexpected auth call"), {
          nextUrl: new URL("https://www.usesocratic.com" + pathname),
          headers: new Headers(), cookies: { get: () => ({ value: locale }) },
        });
        assert.equal(headers.get("x-socratic-locale"), locale);
        assert.equal(headers.get("x-socratic-app"), "1");
      }
    }
    for (const [pathname, expected] of [["/upsc/app", "en"], ["/ar/blog", "ar"], ["/ru", "ru"], ["/application", "en"]]) {
      const headers = await middleware(() => assert.fail("Unexpected auth call"), {
        nextUrl: new URL("https://www.usesocratic.com" + pathname),
        headers: new Headers({ "x-socratic-app": "1" }), cookies: { get: () => ({ value: "ar" }) },
      });
      assert.equal(headers.get("x-socratic-locale"), expected);
      assert.equal(headers.has("x-socratic-app"), false);
    }
  } finally {
    if (original === undefined) delete process.env.VERCEL_TARGET_ENV;
    else process.env.VERCEL_TARGET_ENV = original;
  }
});

test("cookie-popup translations preserve category IDs, cookie metadata and consent defaults", () => {
  const source = fs.readFileSync(path.join(root, "src/components/cookie-consent/cookie-consent-manager.tsx"), "utf8");
  const ast = ts.createSourceFile("cookies.tsx", source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const names = ["COOKIE_CATEGORIES", "createAllAllowedPreferences", "createDeclinedPreferences"];
  const selected = ast.statements.filter(node =>
    ts.isFunctionDeclaration(node) ? names.includes(node.name?.text)
      : ts.isVariableStatement(node) && node.declarationList.declarations.some(d => names.includes(d.name.getText(ast))));
  assert.equal(selected.length, 3);
  const compiled = ts.transpileModule(selected.map(n => n.getText(ast)).join("\n"), {
    compilerOptions: { target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const { COOKIE_CONSENT_DEFAULT_PREFERENCES: defaults } = load("src/lib/cookie-consent.ts");
  const { categories, allowAll, declineAll } = new Function("COOKIE_CONSENT_DEFAULT_PREFERENCES",
    compiled + "; return { categories: COOKIE_CATEGORIES, allowAll: createAllAllowedPreferences, declineAll: createDeclinedPreferences };")(defaults);
  assert.deepEqual(declineAll(), { ...defaults, essential: true });
  for (const category of categories) {
    assert.equal(allowAll()[category.id], true);
    assert.equal(en.cookieConsent.categories[category.id].title, category.title);
    assert.equal(en.cookieConsent.categories[category.id].description, category.description);
    for (const cookie of category.cookies) {
      assert.equal(en.cookieConsent.purposes[cookie.name], cookie.purpose);
      assert.equal(en.cookieConsent.expiries[cookie.expiresIn], cookie.expiresIn);
      for (const locale of ["ru", "ar"]) {
        assert.ok(getAppCopy(locale).cookieConsent.purposes[cookie.name]);
      }
    }
  }
  assert.deepEqual(categories.map(c => c.id), ["essential", "performance", "analytics", "advertising", "social", "unclassified"]);
  assert.equal(categories[0].required, true);
});

test("app billing and pricing links preserve the selected language without changing UPSC links", () => {
  const { ROUTES } = load("src/lib/routes.ts");
  for (const component of ["AppSidebar", "AppTopBar"]) {
    const source = fs.readFileSync(path.join(root, "src/app/app/components/" + component + ".tsx"), "utf8");
    const ast = ts.createSourceFile("links.tsx", source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
    let expression;
    function find(node) {
      if (ts.isVariableDeclaration(node) && node.name.getText(ast) === "billingCtaHref") expression = node.initializer.getText(ast);
      ts.forEachChild(node, find);
    }
    find(ast);
    assert.ok(expression);
    const resolve = new Function("isPremium", "showUpscBrandGraphic", "appBasePath", "ROUTES", "getLocalizedPath", "locale", "return " + expression);
    for (const locale of ["ru", "ar"]) {
      for (const premium of [true, false]) {
        const target = premium ? ROUTES.APP_BILLING : ROUTES.PRICING;
        assert.equal(resolve(premium, false, ROUTES.APP, ROUTES, locales.getLocalizedPath, locale), locales.getLocalizedPath(target, locale));
        assert.equal(resolve(premium, true, ROUTES.UPSC_APP, ROUTES, locales.getLocalizedPath, locale), target);
      }
    }
  }
});

test("debate suggestions, validation and failure fallbacks use the selected language without database access", async () => {
  let captured;
  let response;
  let fail = false;
  const service = createLoader({
    "@prisma/client": { Prisma: {} },
    "src/server/db/client": { prisma: new Proxy({}, { get: () => assert.fail("Unexpected database access") }) },
    "src/server/ai/providers": {
      getDeepSeekAuxModel: () => "test", getDeepSeekChatModel: () => "test",
      deepseek: { chat: { completions: { create: async request => {
        captured = request;
        if (fail) throw Error("Simulated API failure");
        return { choices: [{ message: { content: JSON.stringify(response) } }] };
      } } } },
    },
  })("src/server/debate/service.ts");
  for (const locale of ["ru", "ar"]) {
    const copy = getAppCopy(locale);
    const params = { tone: "SIMPLE_CLEAR", durationPreset: "MIN_30", locale };
    response = { topics: copy.debateFallback.topics.slice(0, 3) };
    assert.deepEqual(await service.generateDebateTopicSuggestions(params), response.topics);
    assert.ok(captured.messages[0].content.includes(locale === "ru" ? "Russian" : "Modern Standard Arabic"));
    const invalid = await service.validateDebateTopic("", locale);
    assert.equal(invalid.reason, copy.debateFallback.emptyTopic);
    fail = true;
    const fallback = await service.generateDebateTopicSuggestions(params);
    assert.equal(fallback.length, 3);
    fallback.forEach(topic => assert.ok(copy.debateFallback.topics.includes(topic)));
    const opening = await service.generateDebateOpening({ ...params, topic: "test", userSide: "A", aiSide: "B" });
    assert.equal(opening, copy.debateFallback.opening.replace("{userSide}", "A").replace("{aiSide}", "B"));
    fail = false;
  }
});
