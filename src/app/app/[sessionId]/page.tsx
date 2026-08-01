import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect, notFound } from "next/navigation";
import { prisma } from "src/server/db/client";
import { ROUTES } from "src/lib/routes";
import ChatContainer from "../components/ChatContainer";
import { serializeSessionMeta } from "src/server/chat/session-meta";
import type { ChatImageAttachment, ChatMessage } from "src/types/chat";
import { BILLING_KEYS, PLAN_LIMITS } from "src/lib/billing";
import { getUserBillingStateByUserId } from "src/server/billing/access";

interface Props {
  params: Promise<{ sessionId: string }>;
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

export default async function SessionPage({ params }: Props) {
  const { sessionId } = await params;

  const { userId: clerkUserId } = await auth();

  if (!clerkUserId) {
    redirect(ROUTES.SIGN_IN);
  }

  const [dbUser, clerkUser] = await Promise.all([
    prisma.user.findUnique({
      where: { clerkUserId },
      select: { id: true },
    }),
    currentUser(),
  ]);

  if (!dbUser) {
    notFound();
  }

  const session = await prisma.chatSession.findFirst({
    where: {
      id: sessionId,
      userId: dbUser.id,
    },
    select: {
      id: true,
      title: true,
      mode: true,
      status: true,
      debateTone: true,
      debateDurationPreset: true,
      debateHasTimer: true,
      debateTopic: true,
      debateTopicSource: true,
      userDebateSide: true,
      aiDebateSide: true,
      debateStatus: true,
      debateStartedAt: true,
      debateEndedAt: true,
      debateWinner: true,
      debateVerdictSummary: true,
      debateSummary: true,
      roleplayMeta: true,
    },
  });

  if (!session) {
    notFound();
  }

  const messages = await prisma.message.findMany({
    where: { sessionId: session.id },
    orderBy: { createdAt: "asc" },
  });

  const billing = await getUserBillingStateByUserId(dbUser.id);
  const periodStart = new Date(
    Date.UTC(
      new Date().getUTCFullYear(),
      new Date().getUTCMonth(),
      new Date().getUTCDate(),
    ),
  );
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

  const serializedMessages: ChatMessage[] = messages.map(
    (msg: (typeof messages)[number]) => ({
      id: msg.id,
      role: msg.role,
      content: msg.content,
      attachments: Array.isArray(msg.attachments)
        ? (msg.attachments as unknown as ChatImageAttachment[])
        : [],
      createdAt: msg.createdAt.toISOString(),
    }),
  );

  return (
    <ChatContainer
      initialMessages={serializedMessages}
      sessionId={session.id}
      sessionMeta={serializeSessionMeta(session)}
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
