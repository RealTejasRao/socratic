import { Prisma } from "@prisma/client";
import { prisma } from "src/server/db/client";
import {
  getRoleplayPhilosopherConfig,
  type RoleplayPhilosopherId,
} from "src/lib/roleplay";

const THIRTY_DAYS_MS = 1000 * 60 * 60 * 24 * 30;

export async function createRoleplaySession(params: {
  userId: string;
  philosopherId: RoleplayPhilosopherId;
}) {
  const philosopher = getRoleplayPhilosopherConfig(params.philosopherId);

  if (!philosopher) {
    throw new Error("Unknown roleplay philosopher.");
  }

  const now = new Date();
  const expiresAt = new Date(now.getTime() + THIRTY_DAYS_MS);

  return prisma.chatSession.create({
    data: {
      userId: params.userId,
      mode: "ROLEPLAY",
      title: `Talk with ${philosopher.name}`,
      expiresAt,
      lastActivityAt: now,
      roleplayMeta: {
        philosopherId: philosopher.id,
      } as Prisma.InputJsonValue,
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
      messages: {
        orderBy: { createdAt: "asc" },
        select: {
          id: true,
          role: true,
          content: true,
          attachments: true,
          createdAt: true,
        },
      },
    },
  });
}
