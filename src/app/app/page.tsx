import { auth } from "@clerk/nextjs/server";
import ChatContainer from "./components/ChatContainer";
import { getUserBillingStateByClerkId } from "src/server/billing/access";
import { BILLING_KEYS, PLAN_LIMITS } from "src/lib/billing";
import { prisma } from "src/server/db/client";

function getUtcDayStart(now: Date) {
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}

export default async function AppHomePage() {
  const { userId: clerkUserId } = await auth();
  const billing = clerkUserId
    ? await getUserBillingStateByClerkId(clerkUserId)
    : null;

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
      sessionMeta={{ mode: "SOCRATIC" }}
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
