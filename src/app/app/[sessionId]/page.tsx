import { auth } from "@clerk/nextjs/server";
import { redirect, notFound } from "next/navigation";
import { prisma } from "src/server/db/client";
import { ROUTES } from "src/lib/routes";
import ChatContainer from "../components/ChatContainer";
import { serializeSessionMeta } from "src/server/chat/session-meta";
import type { ChatImageAttachment, ChatMessage } from "src/types/chat";

interface Props {
  params: Promise<{ sessionId: string }>;
}

export default async function SessionPage({ params }: Props) {
  const { sessionId } = await params;

  const { userId: clerkUserId } = await auth();

  if (!clerkUserId) {
    redirect(ROUTES.SIGN_IN);
  }

  const dbUser = await prisma.user.findUnique({
    where: { clerkUserId },
    select: { id: true },
  });

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

  const serializedMessages: ChatMessage[] = messages.map((msg) => ({
    id: msg.id,
    role: msg.role,
    content: msg.content,
    attachments: (Array.isArray(msg.attachments)
      ? (msg.attachments as unknown as ChatImageAttachment[])
      : []),
    createdAt: msg.createdAt.toISOString(),
  }));

  return (
    <ChatContainer
      initialMessages={serializedMessages}
      sessionId={session.id}
      sessionMeta={serializeSessionMeta(session)}
    />
  );
}
