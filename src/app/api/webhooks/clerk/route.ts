import { headers } from "next/headers";
import { Webhook } from "svix";
import { NextResponse } from "next/server";
import { prisma } from "src/server/db/client";

export async function POST(req: Request) {
  const WEBHOOK_SECRET = process.env["CLERK_WEBHOOK_SECRET"];

  if (!WEBHOOK_SECRET) {
    throw new Error("CLERK_WEBHOOK_SECRET is not set");
  }

  const headerPayload = await headers();
  const svixId = headerPayload.get("svix-id");
  const svixTimestamp = headerPayload.get("svix-timestamp");
  const svixSignature = headerPayload.get("svix-signature");

  if (!svixId || !svixTimestamp || !svixSignature) {
    return new NextResponse("Missing svix headers", { status: 400 });
  }

  const payload = await req.text();
  const body = payload;

  const wh = new Webhook(WEBHOOK_SECRET);

  let evt: any;

  try {
    evt = wh.verify(body, {
      "svix-id": svixId,
      "svix-timestamp": svixTimestamp,
      "svix-signature": svixSignature
    });
  } catch (err) {
    console.error("Webhook verification failed:", err);
    return new NextResponse("Invalid signature", { status: 400 });
  }

  const eventType = evt.type;

  if (eventType === "user.created" || eventType === "user.updated") {
    const { id, email_addresses } = evt.data;

    const primaryEmail =
      email_addresses?.find((e: any) => e.id === evt.data.primary_email_address_id)?.email_address ??
      email_addresses?.[0]?.email_address ??
      null;

    await prisma.user.upsert({
      where: { clerkUserId: id },
      update: {
        email: primaryEmail
      },
      create: {
        clerkUserId: id,
        email: primaryEmail
      }
    });
  }

  if (eventType==='user.deleted'){
    const {id}=evt.data;

    await prisma.user.delete({
        where:{clerkUserId:id}
    });
  }




  return NextResponse.json({ received: true });
}