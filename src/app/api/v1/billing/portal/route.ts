import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "src/server/db/client";
import { getDodoClient } from "src/server/billing/dodo-client";
import { ROUTES } from "src/lib/routes";

export async function POST(req: Request) {
  const { userId: clerkUserId } = await auth();
  if (!clerkUserId) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const dbUser = await prisma.user.findUnique({
    where: { clerkUserId },
    select: {
      dodoCustomerId: true,
    },
  });

  if (!dbUser) {
    return new NextResponse("User not found", { status: 404 });
  }

  if (!dbUser.dodoCustomerId) {
    return new NextResponse("No billing customer found", { status: 400 });
  }

  const origin = new URL(req.url).origin;
  const dodo = getDodoClient();
  const portal = await dodo.customers.customerPortal.create(
    dbUser.dodoCustomerId,
    {
      return_url: `${origin}${ROUTES.APP_BILLING}`,
    },
  );

  return NextResponse.json({ portalUrl: portal.link });
}
