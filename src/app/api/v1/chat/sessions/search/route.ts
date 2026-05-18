import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "src/server/db/client";
import {
  getUserBillingStateByClerkId,
  getVisibleSessionsLimit,
} from "src/server/billing/access";

function createSnippet(content: string, query: string) {
  const normalizedContent = content.replace(/\s+/g, " ").trim();
  const normalizedQuery = query.trim().toLowerCase();

  if (!normalizedContent || !normalizedQuery) {
    return normalizedContent;
  }

  const lowerContent = normalizedContent.toLowerCase();
  const matchIndex = lowerContent.indexOf(normalizedQuery);

  if (matchIndex === -1) {
    return normalizedContent.slice(0, 120);
  }

  const snippetRadius = 48;
  const start = Math.max(0, matchIndex - snippetRadius);
  const end = Math.min(
    normalizedContent.length,
    matchIndex + normalizedQuery.length + snippetRadius,
  );

  const prefix = start > 0 ? "..." : "";
  const suffix = end < normalizedContent.length ? "..." : "";

  return `${prefix}${normalizedContent.slice(start, end)}${suffix}`;
}

export async function GET(request: NextRequest) {
  const { userId: clerkUserId } = await auth();

  if (!clerkUserId) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const query = request.nextUrl.searchParams.get("q")?.trim() ?? "";

  if (!query) {
    return NextResponse.json([]);
  }

  const dbUser = await prisma.user.findUnique({
    where: { clerkUserId },
    select: { id: true },
  });

  if (!dbUser) {
    return new NextResponse("User not found in DB", { status: 404 });
  }

  const billing = await getUserBillingStateByClerkId(clerkUserId);
  const visibleSessionsLimit = getVisibleSessionsLimit({
    isPremium: billing?.isPremium ?? false,
  });

  const sessions = await prisma.chatSession.findMany({
    where: {
      userId: dbUser.id,
      OR: [
        {
          title: {
            contains: query,
            mode: "insensitive",
          },
        },
        {
          messages: {
            some: {
              content: {
                contains: query,
                mode: "insensitive",
              },
            },
          },
        },
      ],
    },
    orderBy: { lastActivityAt: "desc" },
    take: visibleSessionsLimit,
    select: {
      id: true,
      title: true,
      messages: {
        where: {
          content: {
            contains: query,
            mode: "insensitive",
          },
        },
        orderBy: { createdAt: "desc" },
        take: 1,
        select: {
          content: true,
        },
      },
    },
  });

  const results = sessions.map((session: (typeof sessions)[number]) => {
    const normalizedTitle = session.title?.trim() || "Untitled Session";
    const matchedMessage = session.messages[0]?.content?.trim() ?? null;
    const titleMatches = normalizedTitle
      .toLowerCase()
      .includes(query.toLowerCase());
    const snippetSource = matchedMessage ?? normalizedTitle;

    return {
      id: session.id,
      title: normalizedTitle,
      snippet: createSnippet(snippetSource, query),
      matchType: titleMatches ? "title" : "message",
    };
  });

  return NextResponse.json(results);
}
