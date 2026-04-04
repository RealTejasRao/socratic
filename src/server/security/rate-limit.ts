type RateLimitBucket = {
  windowStartMs: number;
  windowMs: number;
  count: number;
};

export type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  retryAfterSec: number;
  resetAfterSec: number;
  limit: number;
};

const buckets = new Map<string, RateLimitBucket>();
let lastPruneMs = 0;
let lastUpstashWarningMs = 0;

function shouldUseUpstash() {
  return Boolean(
    process.env["UPSTASH_REDIS_REST_URL"] &&
    process.env["UPSTASH_REDIS_REST_TOKEN"],
  );
}

function coerceNumber(value: unknown, fallback: number) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string") {
    const parsed = Number.parseFloat(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return fallback;
}

function buildRateLimitKey(params: {
  scope: string;
  userId: string;
  ip: string | undefined;
}) {
  const normalizedScope = params.scope.trim();
  const normalizedUserId = params.userId.trim();
  const normalizedIp = params.ip?.trim();

  if (normalizedIp) {
    return `rl:${normalizedScope}:${normalizedUserId}:ip:${normalizedIp}`;
  }

  return `rl:${normalizedScope}:${normalizedUserId}`;
}

function maybeWarnUpstashFallback(error: unknown) {
  const nowMs = Date.now();

  if (nowMs - lastUpstashWarningMs < 60_000) {
    return;
  }

  lastUpstashWarningMs = nowMs;
  const message =
    error instanceof Error ? error.message : "Unknown Upstash error";
  console.warn(`[rate-limit] Falling back to in-memory limiter: ${message}`);
}

function extractPipelineCell(payload: unknown, index: number) {
  if (Array.isArray(payload)) {
    return payload[index];
  }

  if (!payload || typeof payload !== "object") {
    return undefined;
  }

  const asRecord = payload as Record<string, unknown>;
  const rootResult =
    ("result" in asRecord ? asRecord["result"] : undefined) ??
    ("results" in asRecord ? asRecord["results"] : undefined);

  if (!Array.isArray(rootResult)) {
    return undefined;
  }

  const cell = rootResult[index];

  if (cell && typeof cell === "object" && "result" in (cell as object)) {
    return (cell as Record<string, unknown>)["result"];
  }

  return cell;
}

async function consumeWithUpstash(params: {
  scope: string;
  userId: string;
  ip: string | undefined;
  limit: number;
  windowMs: number;
}) {
  const url = process.env["UPSTASH_REDIS_REST_URL"];
  const token = process.env["UPSTASH_REDIS_REST_TOKEN"];

  if (!url || !token) {
    throw new Error("Upstash not configured");
  }

  const windowMs = Math.max(1000, Math.floor(params.windowMs));
  const key = buildRateLimitKey({
    scope: params.scope,
    userId: params.userId,
    ip: params.ip,
  });
  const body = JSON.stringify([
    ["INCR", key],
    ["PEXPIRE", key, windowMs, "NX"],
    ["PTTL", key],
  ]);

  const response = await fetch(`${url}/pipeline`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body,
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Upstash rate limit failed with status ${response.status}`);
  }

  const payload = (await response.json()) as unknown;
  const count = Math.max(
    1,
    Math.floor(coerceNumber(extractPipelineCell(payload, 0), 1)),
  );
  const pttlMsRaw = Math.floor(
    coerceNumber(extractPipelineCell(payload, 2), windowMs),
  );
  let pttlMs = pttlMsRaw;

  if (pttlMs <= 0) {
    const repairResponse = await fetch(`${url}/pipeline`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify([
        ["PEXPIRE", key, windowMs],
        ["PTTL", key],
      ]),
      cache: "no-store",
    });

    if (repairResponse.ok) {
      const repairPayload = (await repairResponse.json()) as unknown;
      const repairedTtl = Math.floor(
        coerceNumber(extractPipelineCell(repairPayload, 1), windowMs),
      );
      pttlMs = repairedTtl > 0 ? repairedTtl : windowMs;
    } else {
      pttlMs = windowMs;
    }
  }

  if (pttlMs <= 0) {
    pttlMs = windowMs;
  }

  const resetAfterSec = Math.ceil(pttlMs / 1000);

  if (count > params.limit) {
    return {
      allowed: false,
      remaining: 0,
      retryAfterSec: resetAfterSec,
      resetAfterSec,
      limit: params.limit,
    } satisfies RateLimitResult;
  }

  return {
    allowed: true,
    remaining: Math.max(params.limit - count, 0),
    retryAfterSec: 0,
    resetAfterSec,
    limit: params.limit,
  } satisfies RateLimitResult;
}

function pruneInMemoryBuckets(nowMs: number) {
  if (nowMs - lastPruneMs < 5 * 60 * 1000) {
    return;
  }

  lastPruneMs = nowMs;

  for (const [key, bucket] of buckets.entries()) {
    if (nowMs - bucket.windowStartMs > bucket.windowMs * 2) {
      buckets.delete(key);
    }
  }
}

function consumeWithInMemoryFallback(params: {
  scope: string;
  userId: string;
  ip: string | undefined;
  limit: number;
  windowMs: number;
  nowMs?: number;
}) {
  const nowMs = params.nowMs ?? Date.now();
  const key = buildRateLimitKey({
    scope: params.scope,
    userId: params.userId,
    ip: params.ip,
  });
  const existing = buckets.get(key);
  const windowMs = Math.max(1000, Math.floor(params.windowMs));

  pruneInMemoryBuckets(nowMs);

  if (!existing || nowMs - existing.windowStartMs >= windowMs) {
    buckets.set(key, {
      windowStartMs: nowMs,
      windowMs,
      count: 1,
    });

    return {
      allowed: true,
      remaining: Math.max(params.limit - 1, 0),
      retryAfterSec: 0,
      resetAfterSec: Math.ceil(windowMs / 1000),
      limit: params.limit,
    } satisfies RateLimitResult;
  }

  if (existing.count >= params.limit) {
    const retryAfterMs = Math.max(
      0,
      windowMs - (nowMs - existing.windowStartMs),
    );
    const retryAfterSec = Math.ceil(retryAfterMs / 1000);

    return {
      allowed: false,
      remaining: 0,
      retryAfterSec,
      resetAfterSec: retryAfterSec,
      limit: params.limit,
    } satisfies RateLimitResult;
  }

  existing.count += 1;
  const retryAfterMs = Math.max(0, windowMs - (nowMs - existing.windowStartMs));

  return {
    allowed: true,
    remaining: Math.max(params.limit - existing.count, 0),
    retryAfterSec: 0,
    resetAfterSec: Math.ceil(retryAfterMs / 1000),
    limit: params.limit,
  } satisfies RateLimitResult;
}

export function getRequestIp(request: Request) {
  const xForwardedFor = request.headers.get("x-forwarded-for");

  if (xForwardedFor) {
    const [first] = xForwardedFor
      .split(",")
      .map((part) => part.trim())
      .filter(Boolean);

    if (first) {
      return first;
    }
  }

  const realIp = request.headers.get("x-real-ip");
  if (realIp?.trim()) {
    return realIp.trim();
  }

  const cfConnectingIp = request.headers.get("cf-connecting-ip");
  if (cfConnectingIp?.trim()) {
    return cfConnectingIp.trim();
  }

  return undefined;
}

export async function consumeUserRateLimit(params: {
  scope: string;
  userId: string;
  ip: string | undefined;
  limit: number;
  windowMs: number;
  nowMs?: number;
}): Promise<RateLimitResult> {
  if (shouldUseUpstash()) {
    try {
      return await consumeWithUpstash({
        scope: params.scope,
        userId: params.userId,
        ip: params.ip,
        limit: params.limit,
        windowMs: params.windowMs,
      });
    } catch (error) {
      // Fall back gracefully so temporary Redis issues do not block normal users.
      maybeWarnUpstashFallback(error);
    }
  }

  return consumeWithInMemoryFallback({
    scope: params.scope,
    userId: params.userId,
    ip: params.ip,
    limit: params.limit,
    windowMs: params.windowMs,
    ...(params.nowMs !== undefined ? { nowMs: params.nowMs } : {}),
  });
}

export function createRateLimitHeaders(result: RateLimitResult) {
  const headers: Record<string, string> = {
    "X-RateLimit-Limit": String(result.limit),
    "X-RateLimit-Remaining": String(result.remaining),
    "X-RateLimit-Reset": String(result.resetAfterSec),
  };

  if (result.retryAfterSec > 0) {
    headers["Retry-After"] = String(result.retryAfterSec);
  }

  return headers;
}
