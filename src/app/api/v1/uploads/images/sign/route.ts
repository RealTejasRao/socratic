import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { createCloudinaryUploadSignature } from "src/server/cloudinary";
import {
  consumeDailyImageUploadQuota,
  getUserBillingStateByClerkId,
} from "src/server/billing/access";
import {
  consumeUserRateLimit,
  createRateLimitHeaders,
  getRequestIp,
} from "src/server/security/rate-limit";

const DEFAULT_UPLOAD_FOLDER = "socratic/chat-images";

export async function POST(req: Request) {
  const { userId: clerkUserId } = await auth();

  if (!clerkUserId) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const rateLimit = await consumeUserRateLimit({
    scope: "uploads:images:sign",
    userId: clerkUserId,
    ip: getRequestIp(req),
    limit: 120,
    windowMs: 60_000,
  });

  if (!rateLimit.allowed) {
    return new NextResponse(
      "Too many upload requests. Please wait a moment and try again.",
      {
        status: 429,
        headers: createRateLimitHeaders(rateLimit),
      },
    );
  }

  const billing = await getUserBillingStateByClerkId(clerkUserId);
  if (!billing) {
    return new NextResponse("User not found in DB", { status: 404 });
  }

  const quota = await consumeDailyImageUploadQuota({
    userId: billing.userId,
    billing,
  });

  if (!quota.allowed) {
    return NextResponse.json(
      {
        reason:
          "Daily free image upload limit reached. Upgrade to Socratic+ for unlimited image uploads.",
        dailyLimit: quota.limit,
        used: quota.used,
        resetsAt: quota.resetsAt?.toISOString() ?? null,
      },
      { status: 402 },
    );
  }

  const timestamp = Math.floor(Date.now() / 1000);
  const folder =
    process.env["CLOUDINARY_UPLOAD_FOLDER"] ?? DEFAULT_UPLOAD_FOLDER;

  try {
    const signed = createCloudinaryUploadSignature({
      timestamp,
      folder,
    });

    return NextResponse.json({
      cloudName: signed.cloudName,
      apiKey: signed.apiKey,
      timestamp,
      folder,
      signature: signed.signature,
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Failed to sign Cloudinary upload";
    return new NextResponse(message, { status: 500 });
  }
}
