type AnalyticsMessage = {
  createdAt: Date;
  validationScore: number | null;
  latencyMs: number | null;
  tokenIn: number | null;
  tokenOut: number | null;
  model: string | null;
  validationFlags: unknown;
};

function asFlagArray(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string");
}

export function extractPromptVersion(model: string | null) {
  if (!model) return "unknown";
  const match = model.match(/\(([^()]+)\)\s*$/);
  return match?.[1]?.trim() ?? "unknown";
}

function average(values: number[]) {
  if (!values.length) return null;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

export function buildAnalyticsSnapshot(messages: AnalyticsMessage[]) {
  const scored = messages.filter((m) => m.validationScore !== null);
  const scoreValues = scored.map((m) => m.validationScore as number);
  const latencyValues = messages
    .map((m) => m.latencyMs)
    .filter((value): value is number => value !== null);
  const tokenInValues = messages
    .map((m) => m.tokenIn)
    .filter((value): value is number => value !== null);
  const tokenOutValues = messages
    .map((m) => m.tokenOut)
    .filter((value): value is number => value !== null);

  const flagCounts = new Map<string, number>();
  for (const message of messages) {
    for (const flag of asFlagArray(message.validationFlags)) {
      flagCounts.set(flag, (flagCounts.get(flag) ?? 0) + 1);
    }
  }

  const byPromptVersion = new Map<
    string,
    {
      count: number;
      scoreValues: number[];
      latencyValues: number[];
      tokenInValues: number[];
      tokenOutValues: number[];
    }
  >();

  for (const message of messages) {
    const promptVersion = extractPromptVersion(message.model);
    const bucket = byPromptVersion.get(promptVersion) ?? {
      count: 0,
      scoreValues: [],
      latencyValues: [],
      tokenInValues: [],
      tokenOutValues: [],
    };

    bucket.count += 1;
    if (message.validationScore !== null) {
      bucket.scoreValues.push(message.validationScore);
    }
    if (message.latencyMs !== null) {
      bucket.latencyValues.push(message.latencyMs);
    }
    if (message.tokenIn !== null) {
      bucket.tokenInValues.push(message.tokenIn);
    }
    if (message.tokenOut !== null) {
      bucket.tokenOutValues.push(message.tokenOut);
    }
    byPromptVersion.set(promptVersion, bucket);
  }

  return {
    totalResponses: messages.length,
    withValidation: scored.length,
    avgValidationScore: average(scoreValues),
    avgLatencyMs: average(latencyValues),
    avgTokenIn: average(tokenInValues),
    avgTokenOut: average(tokenOutValues),
    flags: [...flagCounts.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([flag, count]) => ({ flag, count })),
    byPromptVersion: [...byPromptVersion.entries()]
      .map(([promptVersion, bucket]) => ({
        promptVersion,
        count: bucket.count,
        avgValidationScore: average(bucket.scoreValues),
        avgLatencyMs: average(bucket.latencyValues),
        avgTokenIn: average(bucket.tokenInValues),
        avgTokenOut: average(bucket.tokenOutValues),
      }))
      .sort((a, b) => b.count - a.count),
  };
}

export function filterSinceDays(messages: AnalyticsMessage[], days: number) {
  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
  return messages.filter((message) => message.createdAt.getTime() >= cutoff);
}
