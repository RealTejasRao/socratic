import { NextResponse } from "next/server";
import { prisma } from "src/server/db/client";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { email?: unknown };
    const rawEmail = typeof body.email === "string" ? body.email : "";
    const email = rawEmail.trim().toLowerCase();

    if (!EMAIL_REGEX.test(email)) {
      return NextResponse.json(
        { message: "Please enter a valid email address." },
        { status: 400 },
      );
    }

    const inserted = await prisma.$queryRaw<Array<{ id: string }>>`
      INSERT INTO "EarlyAccess" ("id", "email")
      VALUES (${crypto.randomUUID()}, ${email})
      ON CONFLICT ("email") DO NOTHING
      RETURNING "id"
    `;

    if (inserted.length === 0) {
      return NextResponse.json(
        { message: "This email is already on the early access list." },
        { status: 409 },
      );
    }

    return NextResponse.json(
      { message: "Added successfully." },
      { status: 201 },
    );
  } catch {
    return NextResponse.json(
      { message: "Unable to submit right now. Please try again." },
      { status: 500 },
    );
  }
}
