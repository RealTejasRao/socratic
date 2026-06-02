import "server-only";

import { currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/src/server/db/client";

export async function ensureUserForClerkId(clerkUserId: string) {
  const existingUser = await prisma.user.findUnique({
    where: { clerkUserId },
    select: { id: true, email: true },
  });

  if (existingUser) {
    return existingUser;
  }

  const clerkUser = await currentUser();
  const primaryEmail =
    clerkUser?.primaryEmailAddress?.emailAddress ??
    clerkUser?.emailAddresses[0]?.emailAddress ??
    null;

  return prisma.user.upsert({
    where: { clerkUserId },
    update: primaryEmail ? { email: primaryEmail } : {},
    create: {
      clerkUserId,
      email: primaryEmail,
    },
    select: { id: true, email: true },
  });
}
