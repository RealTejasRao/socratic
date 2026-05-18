import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import type { DodoPayments } from "dodopayments";
import { prisma } from "src/server/db/client";
import { getDodoClient } from "src/server/billing/dodo-client";
import { syncSubscriptionFromPayload } from "src/server/billing/subscription-sync";

function toHeaderRecord(headers: Headers) {
  const record: Record<string, string> = {};
  headers.forEach((value, key) => {
    record[key.toLowerCase()] = value;
  });
  return record;
}

function extractWebhookId(headers: Record<string, string>, fallback: string) {
  const direct = headers["webhook-id"]?.trim();
  if (direct) {
    return direct;
  }

  return fallback;
}

function extractSubscriptionId(payload: unknown) {
  if (!payload || typeof payload !== "object") {
    return null;
  }

  const candidate = payload as { data?: unknown };
  if (!candidate.data || typeof candidate.data !== "object") {
    return null;
  }

  const dataRecord = candidate.data as Record<string, unknown>;
  return typeof dataRecord["subscription_id"] === "string"
    ? dataRecord["subscription_id"]
    : null;
}

async function syncBySubscriptionId(subscriptionId: string) {
  const dodo = getDodoClient();
  const subscription = await dodo.subscriptions.retrieve(subscriptionId);
  await syncSubscriptionFromPayload(subscription);
}

export async function POST(req: Request) {
  const dodo = getDodoClient();
  const rawBody = await req.text();
  const headers = toHeaderRecord(req.headers);

  let payload: Awaited<ReturnType<typeof dodo.webhooks.unwrap>>;
  try {
    payload = dodo.webhooks.unwrap(rawBody, { headers });
  } catch {
    return new NextResponse("Invalid webhook signature", { status: 401 });
  }

  const webhookId = extractWebhookId(
    headers,
    `${payload.type}:${payload.timestamp}:${payload.business_id}`,
  );
  const now = new Date();

  const webhookEvent = await prisma.billingWebhookEvent.upsert({
    where: { webhookId },
    create: {
      webhookId,
      eventType: payload.type,
      dodoBusinessId: payload.business_id,
      payload: payload as unknown as Prisma.InputJsonValue,
      processed: false,
      attemptCount: 1,
      lastAttemptAt: now,
    },
    update: {
      eventType: payload.type,
      dodoBusinessId: payload.business_id,
      payload: payload as unknown as Prisma.InputJsonValue,
      attemptCount: { increment: 1 },
      lastAttemptAt: now,
    },
  });

  if (webhookEvent.processed) {
    return NextResponse.json({ received: true, duplicate: true });
  }

  try {
    if (payload.type.startsWith("subscription.")) {
      await syncSubscriptionFromPayload(
        payload.data as DodoPayments.Subscription,
      );
    }

    if (
      payload.type === "payment.succeeded" ||
      payload.type === "payment.failed" ||
      payload.type === "payment.cancelled" ||
      payload.type === "payment.processing" ||
      payload.type === "dunning.started" ||
      payload.type === "dunning.recovered"
    ) {
      const subscriptionId = extractSubscriptionId(payload);
      if (subscriptionId) {
        await syncBySubscriptionId(subscriptionId);
      }
    }

    await prisma.billingWebhookEvent.update({
      where: { id: webhookEvent.id },
      data: {
        processed: true,
        processedAt: new Date(),
        processingError: null,
      },
    });
  } catch (error) {
    await prisma.billingWebhookEvent.update({
      where: { id: webhookEvent.id },
      data: {
        processed: false,
        processingError:
          error instanceof Error ? error.message : "Unknown webhook error",
      },
    });

    return new NextResponse("Webhook handler failed", { status: 500 });
  }

  return NextResponse.json({ received: true });
}
