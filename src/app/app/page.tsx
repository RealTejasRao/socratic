import { auth, currentUser } from "@clerk/nextjs/server";
import ChatContainer from "./components/ChatContainer";
import { getUserBillingStateByClerkId } from "src/server/billing/access";
import { BILLING_KEYS, PLAN_LIMITS } from "src/lib/billing";
import { prisma } from "src/server/db/client";
import type { SessionMode } from "src/types/chat";

function getUtcDayStart(now: Date) {
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}

type AppHomePageProps = {
  searchParams?:
    | Promise<{
        mode?: string | string[];
        topic?: string | string[];
        autosend?: string | string[];
      }>
    | {
        mode?: string | string[];
        topic?: string | string[];
        autosend?: string | string[];
      };
  defaultMode?: SessionMode;
};

function getFirstSearchParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function resolveMode(
  value: string | undefined,
  fallback: SessionMode = "ROLEPLAY",
): SessionMode {
  const normalized = value?.toLowerCase().trim();

  if (normalized === "socratic") {
    return "SOCRATIC";
  }

  if (normalized === "debate") {
    return "DEBATE";
  }

  if (normalized === "roleplay") {
    return "ROLEPLAY";
  }

  return fallback;
}

function getDisplayName(
  user: Awaited<ReturnType<typeof currentUser>>,
): string | null {
  return (
    user?.firstName?.trim() ||
    user?.fullName?.trim() ||
    user?.username?.trim() ||
    null
  );
}

export async function AppHomePageContent({
  searchParams,
  defaultMode = "ROLEPLAY",
}: AppHomePageProps) {
  const { userId: clerkUserId } = await auth();
  const [billing, clerkUser] = clerkUserId
    ? await Promise.all([getUserBillingStateByClerkId(clerkUserId), currentUser()])
    : [null, null];
  const resolvedSearchParams =
    searchParams && "then" in searchParams ? await searchParams : searchParams;
  const requestedMode = resolveMode(
    getFirstSearchParam(resolvedSearchParams?.mode),
    defaultMode,
  );
  const requestedTopic =
    getFirstSearchParam(resolvedSearchParams?.topic)?.trim() ?? "";
  const shouldAutoSend =
    getFirstSearchParam(resolvedSearchParams?.autosend) === "1";
  const initialAutoSendMessage =
    shouldAutoSend && requestedTopic ? requestedTopic.slice(0, 3000) : null;

  const now = new Date();
  const periodStart = getUtcDayStart(now);
  const [messageUsage, imageUsage] = billing
    ? await Promise.all([
        prisma.usageCounter.findUnique({
          where: {
            userId_usageKey_periodStart: {
              userId: billing.userId,
              usageKey: BILLING_KEYS.dailyMessages,
              periodStart,
            },
          },
          select: { count: true },
        }),
        prisma.usageCounter.findUnique({
          where: {
            userId_usageKey_periodStart: {
              userId: billing.userId,
              usageKey: BILLING_KEYS.dailyImageUploads,
              periodStart,
            },
          },
          select: { count: true },
        }),
      ])
    : [null, null];

  return (
    <ChatContainer
      initialMessages={[]}
      sessionMeta={{ mode: requestedMode }}
      initialAutoSendMessage={initialAutoSendMessage}
      userStorageId={clerkUserId}
      initialUserName={getDisplayName(clerkUser)}
      initialBilling={{
        isPremium: billing?.isPremium ?? false,
        usage: {
          dailyMessageLimit: billing?.isPremium
            ? Number.MAX_SAFE_INTEGER
            : PLAN_LIMITS.FREE_DAILY_MESSAGES,
          dailyMessagesUsed: messageUsage?.count ?? 0,
          dailyMessagesRemaining: billing?.isPremium
            ? null
            : Math.max(
                PLAN_LIMITS.FREE_DAILY_MESSAGES - (messageUsage?.count ?? 0),
                0,
              ),
          dailyImageUploadLimit: billing?.isPremium
            ? Number.MAX_SAFE_INTEGER
            : PLAN_LIMITS.FREE_DAILY_IMAGE_UPLOADS,
          dailyImageUploadsUsed: imageUsage?.count ?? 0,
          dailyImageUploadsRemaining: billing?.isPremium
            ? null
            : Math.max(
                PLAN_LIMITS.FREE_DAILY_IMAGE_UPLOADS - (imageUsage?.count ?? 0),
                0,
              ),
          resetsAt: null,
        },
        features: {
          debateMode: billing?.isPremium ?? false,
          detailedDebateFeedback: billing?.isPremium ?? false,
          ruthlessTone: billing?.isPremium ?? false,
          globalMemory: billing?.isPremium ?? false,
          earlyAccess: billing?.isPremium ?? false,
        },
      }}
    />
  );
}

export default async function AppHomePage({ searchParams }: AppHomePageProps) {
  return (
    <AppHomePageContent
      {...(searchParams === undefined ? {} : { searchParams })}
    />
  );
}
