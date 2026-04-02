import { auth } from "@clerk/nextjs/server";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, Crown, ScrollText, ShieldAlert, ShieldCheck, Swords } from "lucide-react";
import { prisma } from "src/server/db/client";
import { ROUTES } from "src/lib/routes";
import { getDebateDurationMeta, getDebateToneMeta } from "src/lib/debate";
import { getOrCreateDebateDashboard } from "src/server/debate/service";

interface Props {
  params: Promise<{ sessionId: string }>;
}

export default async function DebateSummaryPage({ params }: Props) {
  const { sessionId } = await params;
  const { userId: clerkUserId } = await auth();

  if (!clerkUserId) {
    redirect(ROUTES.SIGN_IN);
  }

  const dbUser = await prisma.user.findUnique({
    where: { clerkUserId },
    select: { id: true },
  });

  if (!dbUser) {
    notFound();
  }

  const result = await getOrCreateDebateDashboard({
    sessionId,
    userId: dbUser.id,
  });

  if (!result) {
    notFound();
  }

  const { session, dashboard } = result;
  const toneMeta = getDebateToneMeta(session.debateTone!);
  const durationMeta = getDebateDurationMeta(session.debateDurationPreset!);
  const winnerLabel =
    session.debateWinner === "USER"
      ? "You"
      : session.debateWinner === "ASSISTANT"
        ? "Socratic AI"
        : "Draw";

  return (
    <div className="mx-auto w-full max-w-[1040px] px-4 py-6 md:px-8 md:py-8">
      <div className="mb-6 flex items-center justify-between gap-3">
        <Link
          href={`/app/${session.id}`}
          className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-[12px] text-slate-700 transition hover:border-slate-300 hover:text-slate-950"
        >
          <ArrowLeft size={14} />
          Back to debate
        </Link>
        <p className="text-[11px] text-slate-500">
          Generated {new Date(dashboard.generatedAt).toLocaleString()}
        </p>
      </div>

      <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_18px_50px_rgba(15,23,42,0.06)] md:p-7">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-[760px]">
            <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-slate-500">
              <Swords size={12} />
              Debate Dashboard
            </div>
            <h1 className="mt-4 text-[30px] leading-[1.02] tracking-[-0.05em] text-slate-950 [font-family:Georgia,serif] md:text-[42px]">
              {session.debateTopic}
            </h1>
            <div className="mt-4 flex flex-wrap gap-2 text-[11px] text-slate-700">
              <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5">
                {toneMeta.label}
              </span>
              <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5">
                {durationMeta.label}
              </span>
              <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5">
                You: {session.userDebateSide}
              </span>
              <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5">
                AI: {session.aiDebateSide}
              </span>
            </div>
          </div>

          <div className="rounded-[22px] border border-slate-200 bg-slate-50 px-4 py-3 text-left">
            <div className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-3 py-1 text-[10px] uppercase tracking-[0.18em] text-white">
              <Crown size={12} />
              Winner: {winnerLabel}
            </div>
            <p className="mt-3 max-w-[280px] text-[12px] leading-6 text-slate-700">
              {session.debateVerdictSummary}
            </p>
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <section className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-[0_12px_36px_rgba(15,23,42,0.04)]">
          <div className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-slate-500">
            <ScrollText size={14} />
            Debate Summary
          </div>
          <p className="mt-4 text-[15px] leading-8 text-slate-800 [font-family:Georgia,serif]">
            {session.debateSummary}
          </p>
        </section>

        <section className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-[0_12px_36px_rgba(15,23,42,0.04)]">
          <div className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-slate-500">
            <ShieldCheck size={14} />
            Your Beliefs
          </div>
          <p className="mt-4 text-[15px] leading-8 text-slate-800 [font-family:Georgia,serif]">
            {dashboard.userBeliefsSummary}
          </p>
        </section>

        <section className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-[0_12px_36px_rgba(15,23,42,0.04)] lg:col-span-2">
          <div className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-slate-500">
            <Swords size={14} />
            What The Model Argued
          </div>
          <p className="mt-4 text-[15px] leading-8 text-slate-800 [font-family:Georgia,serif]">
            {dashboard.assistantCaseSummary}
          </p>
        </section>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <section className="rounded-[24px] border border-emerald-200 bg-emerald-50/60 p-5">
          <div className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-emerald-700">
            <ShieldCheck size={14} />
            Where You Were Strong
          </div>
          <ul className="mt-4 space-y-3 text-[13px] leading-6 text-slate-800">
            {dashboard.userStrengths.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>

        <section className="rounded-[24px] border border-amber-200 bg-amber-50/70 p-5">
          <div className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-amber-700">
            <ShieldAlert size={14} />
            Where You Were Weak
          </div>
          <ul className="mt-4 space-y-3 text-[13px] leading-6 text-slate-800">
            {dashboard.userWeaknesses.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>

        <section className="rounded-[24px] border border-slate-200 bg-slate-50 p-5">
          <div className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-slate-600">
            <ScrollText size={14} />
            Suggestions To Improve
          </div>
          <ul className="mt-4 space-y-3 text-[13px] leading-6 text-slate-800">
            {dashboard.improvementSuggestions.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
