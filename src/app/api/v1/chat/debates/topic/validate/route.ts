import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { DEBATE_TOPIC_MAX_CHARS } from "src/lib/debate";
import {
  consumeUserRateLimit,
  createRateLimitHeaders,
  getRequestIp,
} from "src/server/security/rate-limit";
import { validateDebateTopic } from "src/server/debate/service";

export async function POST(req: Request) {
  const { userId } = await auth();

  if (!userId) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const rateLimit = await consumeUserRateLimit({
    scope: "debate:topic:validate",
    userId,
    ip: getRequestIp(req),
    limit: 60,
    windowMs: 60_000,
  });

  if (!rateLimit.allowed) {
    return NextResponse.json(
      {
        isValid: false,
        normalizedTopic: "",
        reason:
          "Too many validation requests. Please wait a moment and try again.",
      },
      {
        status: 429,
        headers: createRateLimitHeaders(rateLimit),
      },
    );
  }

  const body = await req.json();
  const topic = typeof body?.topic === "string" ? body.topic : "";

  if (topic.length > DEBATE_TOPIC_MAX_CHARS) {
    return NextResponse.json(
      {
        isValid: false,
        normalizedTopic: "",
        reason: `Keep the topic under ${DEBATE_TOPIC_MAX_CHARS} characters.`,
      },
      { status: 400 },
    );
  }

  const result = await validateDebateTopic(topic);

  return NextResponse.json(result);
}
