import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { validateDebateTopic } from "src/server/debate/service";

export async function POST(req: Request) {
  const { userId } = await auth();

  if (!userId) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const body = await req.json();
  const topic = typeof body?.topic === "string" ? body.topic : "";
  const result = await validateDebateTopic(topic);

  return NextResponse.json(result);
}
