import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "src/server/db/client";
import { getDodoClient } from "src/server/billing/dodo-client";
import { ROUTES } from "src/lib/routes";

type CheckoutPlan = "monthly" | "annual";

function resolveProductId(plan: CheckoutPlan) {
  if (plan === "annual") {
    return process.env["DODO_PRODUCT_ANNUAL"];
  }
  return process.env["DODO_PRODUCT_MONTHLY"];
}

export async function POST(req: Request) {
  const { userId: clerkUserId } = await auth();
  if (!clerkUserId) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const body = (await req.json().catch(() => null)) as
    | {
        plan?: CheckoutPlan;
      }
    | null;
  const plan = body?.plan;

  if (plan !== "monthly" && plan !== "annual") {
    return new NextResponse("Invalid plan", { status: 400 });
  }

  const productId = resolveProductId(plan);
  if (!productId) {
    return new NextResponse("Plan product ID is not configured", {
      status: 500,
    });
  }

  const dbUser = await prisma.user.findUnique({
    where: { clerkUserId },
    select: {
      id: true,
      clerkUserId: true,
      email: true,
      dodoCustomerId: true,
    },
  });

  if (!dbUser) {
    return new NextResponse("User not found", { status: 404 });
  }

  const origin = new URL(req.url).origin;
  const returnUrl = `${origin}${ROUTES.APP_BILLING}?welcome=1`;
  const cancelUrl = `${origin}/pricing?checkout=cancelled`;

  const dodo = getDodoClient();

  const customerPayload = dbUser.dodoCustomerId
    ? { customer_id: dbUser.dodoCustomerId }
    : dbUser.email
      ? {
          email: dbUser.email,
          metadata: {
            appUserId: dbUser.id,
            clerkUserId: dbUser.clerkUserId,
          },
        }
      : null;

  if (!customerPayload) {
    return new NextResponse("User email is required to start checkout", {
      status: 400,
    });
  }

  const checkout = await dodo.checkoutSessions.create({
    product_cart: [{ product_id: productId, quantity: 1 }],
    customer: customerPayload,
    return_url: returnUrl,
    cancel_url: cancelUrl,
    metadata: {
      appUserId: dbUser.id,
      clerkUserId: dbUser.clerkUserId,
      plan,
    },
    customization: {
      theme: "dark",
    },
  });

  if (!checkout.checkout_url) {
    return new NextResponse("Checkout URL was not returned", { status: 500 });
  }

  return NextResponse.json({
    checkoutUrl: checkout.checkout_url,
    sessionId: checkout.session_id,
  });
}
