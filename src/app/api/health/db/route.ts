import { prisma } from "src/server/db/client";
import { NextResponse } from "next/server";

export async function GET() {
  await prisma.$queryRaw`SELECT 1`;
  return NextResponse.json({ status: "ok" });
}