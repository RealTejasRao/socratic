import { auth } from "@clerk/nextjs/server";
import type DodoPayments from "dodopayments";
import { NextResponse } from "next/server";
import { prisma } from "src/server/db/client";
import { getDodoClient } from "src/server/billing/dodo-client";
import { getAmbassadorSupportDiscount } from "src/lib/billing";
import { ROUTES } from "src/lib/routes";

type CheckoutPlan = "monthly" | "annual";

function resolveProductId(plan: CheckoutPlan) {
  if (plan === "annual") {
    return process.env["DODO_PRODUCT_ANNUAL"];
  }
  return process.env["DODO_PRODUCT_MONTHLY"];
}

function getConfiguredProductIds(currentProductId: string) {
  return Array.from(
    new Set(
      [
        process.env["DODO_PRODUCT_MONTHLY"],
        process.env["DODO_PRODUCT_ANNUAL"],
        currentProductId,
      ].filter((value): value is string => Boolean(value)),
    ),
  );
}

async function ensureAmbassadorSupportDiscount(
  dodo: DodoPayments,
  productIds: string[],
  discount: ReturnType<typeof getAmbassadorSupportDiscount>,
) {
  try {
    const existingDiscount = await dodo.discounts.retrieveByCode(
      discount.code,
    );
    const isMissingProductRestriction =
      existingDiscount.restricted_to.length > 0 &&
      productIds.some(
        (productId) => !existingDiscount.restricted_to.includes(productId),
      );

    if (
      existingDiscount.type !== "percentage" ||
      existingDiscount.amount !== discount.basisPoints ||
      isMissingProductRestriction
    ) {
      await dodo.discounts.update(existingDiscount.discount_id, {
        type: "percentage",
        amount: discount.basisPoints,
        restricted_to: productIds,
        preserve_on_plan_change: true,
        metadata: {
          source: "socratic_ambassador_support",
          percent: String(discount.percent),
        },
      });
    }
  } catch {
    try {
      await dodo.discounts.create({
        code: discount.code,
        name: `Ambassador Support ${discount.percent}%`,
        type: "percentage",
        amount: discount.basisPoints,
        restricted_to: productIds,
        preserve_on_plan_change: true,
        metadata: {
          source: "socratic_ambassador_support",
          percent: String(discount.percent),
        },
      });
    } catch {
      const existingDiscount = await dodo.discounts.retrieveByCode(discount.code);
      if (
        existingDiscount.type !== "percentage" ||
        existingDiscount.amount !== discount.basisPoints
      ) {
        throw new Error("Ambassador discount could not be configured.");
      }
    }
  }
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
      referralCodeSubmissions: {
        orderBy: { createdAt: "asc" },
        take: 1,
        select: {
          ambassadorCodeId: true,
          code: true,
          ambassadorCode: {
            select: {
              normalizedCode: true,
              displayName: true,
            },
          },
        },
      },
    },
  });

  if (!dbUser) {
    return new NextResponse("User not found", { status: 404 });
  }

  const origin = new URL(req.url).origin;
  const returnUrl = `${origin}${ROUTES.APP_BILLING}?welcome=1`;
  const cancelUrl = `${origin}/pricing?checkout=cancelled`;

  const dodo = getDodoClient();
  const referralSupport = dbUser.referralCodeSubmissions[0] ?? null;
  const ambassadorDiscount = referralSupport
    ? getAmbassadorSupportDiscount(
        referralSupport.ambassadorCode?.normalizedCode ?? referralSupport.code,
      )
    : null;
  if (ambassadorDiscount) {
    await ensureAmbassadorSupportDiscount(
      dodo,
      getConfiguredProductIds(productId),
      ambassadorDiscount,
    );
  }

  const checkoutMetadata = {
    appUserId: dbUser.id,
    clerkUserId: dbUser.clerkUserId,
    plan,
    ...(referralSupport && ambassadorDiscount
      ? {
          ambassadorDiscountCode: ambassadorDiscount.code,
          ambassadorDiscountPercent: String(ambassadorDiscount.percent),
          ambassadorCodeId: referralSupport.ambassadorCodeId ?? "",
          ambassadorCode:
            referralSupport.ambassadorCode?.normalizedCode ??
            referralSupport.code.toUpperCase(),
          ambassadorDisplayName:
            referralSupport.ambassadorCode?.displayName ??
            referralSupport.code,
        }
      : {}),
  };

  const customerPayload = dbUser.dodoCustomerId
    ? { customer_id: dbUser.dodoCustomerId }
    : dbUser.email
      ? {
          email: dbUser.email,
          metadata: checkoutMetadata,
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
    ...(ambassadorDiscount
      ? { discount_codes: [ambassadorDiscount.code] }
      : {}),
    metadata: checkoutMetadata,
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
