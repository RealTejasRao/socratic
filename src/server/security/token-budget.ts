import { prisma } from "src/server/db/client";

export type UserTokenBudgetResult = {
  allowed: boolean;
  used: number;
  limit: number;
  remaining: number;
  windowHours: number;
};

function readPositiveIntEnv(name: string, fallback: number) {
  const raw = process.env[name];
  if (!raw) return fallback;

  const parsed = Number.parseInt(raw, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback;
  }

  return parsed;
}

export async function getUserTokenBudget(params: {
  userId: string;
  now?: Date;
  windowHours?: number;
  tokenLimit?: number;
}): Promise<UserTokenBudgetResult> {
  const now = params.now ?? new Date();
  const windowHours =
    params.windowHours ??
    readPositiveIntEnv("AI_TOKEN_BUDGET_WINDOW_HOURS", 24);
  const tokenLimit =
    params.tokenLimit ?? readPositiveIntEnv("AI_USER_TOKEN_BUDGET", 200_000);
  const windowStart = new Date(now.getTime() - windowHours * 60 * 60 * 1000);

  const aggregate = await prisma.message.aggregate({
    _sum: {
      tokenIn: true,
      tokenOut: true,
    },
    where: {
      createdAt: { gte: windowStart },
      session: {
        userId: params.userId,
      },
    },
  });

  const used =
    (aggregate._sum.tokenIn ?? 0) + (aggregate._sum.tokenOut ?? 0);
  const remaining = Math.max(tokenLimit - used, 0);

  return {
    allowed: used < tokenLimit,
    used,
    limit: tokenLimit,
    remaining,
    windowHours,
  };
}

