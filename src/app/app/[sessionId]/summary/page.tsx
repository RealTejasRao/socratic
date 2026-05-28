import { auth } from "@clerk/nextjs/server";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  Activity,
  ArrowLeft,
  Crown,
  Dumbbell,
  Gauge,
  ShieldAlert,
  ShieldCheck,
  Swords,
} from "lucide-react";
import { prisma } from "src/server/db/client";
import { ROUTES } from "src/lib/routes";
import { getDebateDurationMeta, getDebateToneMeta } from "src/lib/debate";
import { getOrCreateDebateDashboard } from "src/server/debate/service";
import { DebateMomentumChart } from "./DebateMomentumChart";

interface Props {
  params: Promise<{ sessionId: string }>;
}

function SectionLabel({
  icon,
  children,
}: {
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="summary-section-kicker inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-slate-500">
      {icon}
      {children}
    </div>
  );
}

function normalizeBullets(items: string[], fallback: string) {
  return [...items, fallback, fallback, fallback]
    .filter((item) => item.trim())
    .slice(0, 3);
}

function StatCard({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="summary-stat-card rounded-lg border border-slate-200 px-4 py-4 transition hover:-translate-y-0.5 hover:border-slate-300">
      <p className="summary-section-kicker text-[10px] uppercase tracking-[0.16em] text-slate-500">
        {label}
      </p>
      <div className="summary-body mt-3 text-[15px] leading-7 text-slate-800">
        {value}
      </div>
    </div>
  );
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
  const winner = session.debateWinner ?? "DRAW";
  const winnerTone =
    winner === "USER"
      ? "border-emerald-200 bg-emerald-50 text-emerald-800"
      : winner === "ASSISTANT"
        ? "border-red-200 bg-red-50 text-red-800"
        : "border-slate-200 bg-slate-100 text-slate-800";
  const strengths = normalizeBullets(
    dashboard.userStrengths,
    "No specific transcript-backed strength was available for this slot.",
  );
  const weaknesses = normalizeBullets(
    dashboard.userWeaknesses,
    "No specific transcript-backed weakness was available for this slot.",
  );
  const roundsWon = dashboard.roundsWon ?? null;
  const roundsLost = dashboard.roundsLost ?? null;
  const roundsContested = dashboard.roundsContested ?? null;
  const roundRecord =
    roundsWon === null && roundsLost === null && roundsContested === null
      ? "Not available"
      : `${roundsWon ?? 0} won / ${roundsLost ?? 0} lost / ${
          roundsContested ?? 0
        } contested`;

  return (
    <div className="summary-page mx-auto w-full max-w-[1080px] px-4 py-6 md:px-8 md:py-10">
      <div className="mb-6 flex items-center justify-between gap-3">
        <Link
          href={`/app/${session.id}`}
          className="summary-back-link inline-flex items-center gap-2 rounded-full border border-slate-200 px-3 py-2 text-[12px] text-slate-700 transition hover:border-slate-300 hover:text-slate-950"
        >
          <ArrowLeft size={14} />
          Back to debate
        </Link>
        <p className="summary-generated text-[11px] text-slate-500">
          Generated {new Date(dashboard.generatedAt).toLocaleString()}
        </p>
      </div>

      <header className="summary-hero border-b border-slate-200 pb-7">
        <SectionLabel icon={<Swords size={12} />}>
          Post-Match Report
        </SectionLabel>
        <h1 className="summary-title mt-4 max-w-[860px] text-[34px] leading-[1.02] tracking-[-0.055em] text-slate-950 [font-family:Georgia,serif] md:text-[48px]">
          {session.debateTopic}
        </h1>
        <div className="mt-5 flex flex-wrap gap-2 text-[11px] text-slate-700">
          <span className="summary-meta-pill rounded-full border border-slate-200 px-3 py-1.5">
            {toneMeta.label}
          </span>
          <span className="summary-meta-pill rounded-full border border-slate-200 px-3 py-1.5">
            {durationMeta.label}
          </span>
          <span className="summary-meta-pill rounded-full border border-slate-200 px-3 py-1.5">
            You: {session.userDebateSide}
          </span>
          <span className="summary-meta-pill rounded-full border border-slate-200 px-3 py-1.5">
            AI: {session.aiDebateSide}
          </span>
        </div>
      </header>

      <section
        id="verdict"
        className="summary-section border-b border-slate-200 py-8"
      >
        <div className="summary-verdict-card rounded-lg border border-slate-200 px-5 py-5 md:px-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <SectionLabel icon={<Crown size={14} />}>Verdict</SectionLabel>
            <span
              className={`summary-verdict-badge rounded-full border px-4 py-2 text-[13px] font-semibold tracking-[0.16em] ${winnerTone}`}
            >
              {winner}
            </span>
          </div>
          <p className="summary-body mt-4 max-w-[760px] text-[16px] leading-8 text-slate-800 [font-family:Georgia,serif]">
            {session.debateVerdictSummary ||
              "The debate ended, but the verdict summary was not available."}
          </p>
        </div>
      </section>

      <section
        id="momentum"
        className="summary-section border-b border-slate-200 py-8"
      >
        <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
          <div>
            <SectionLabel icon={<Activity size={14} />}>Momentum</SectionLabel>
            <h2 className="summary-section-title mt-3 text-[26px] leading-[1.06] tracking-[-0.04em] text-slate-950 [font-family:Georgia,serif] md:text-[32px]">
              Round-by-round control
            </h2>
          </div>
          <p className="summary-note max-w-[320px] text-[12px] leading-6 text-slate-500">
            Positive scores favor USER. Negative scores favor ASSISTANT.
          </p>
        </div>
        <DebateMomentumChart data={dashboard.momentumScores ?? []} />
      </section>

      <section
        id="stats"
        className="summary-section grid gap-3 border-b border-slate-200 py-8 md:grid-cols-4"
      >
        <StatCard label="Rounds Won / Lost / Contested" value={roundRecord} />
        <StatCard
          label="Rhetorical Style"
          value={dashboard.rhetoricalStyle || "Not available"}
        />
        <StatCard
          label="Strongest Moment"
          value={dashboard.strongestMoment || "Not available"}
        />
        <StatCard
          label="Weakest Moment"
          value={dashboard.weakestMoment || "Not available"}
        />
      </section>

      <section
        id="feedback"
        className="summary-section border-b border-slate-200 py-8"
      >
        <SectionLabel icon={<Gauge size={14} />}>
          What to keep, what to fix
        </SectionLabel>
        <div className="mt-6 grid gap-8 lg:grid-cols-2">
          <div>
            <h2 className="summary-subheading text-[15px] font-medium uppercase tracking-[0.12em] text-emerald-700">
              Keep
            </h2>
            <ul className="summary-list mt-4 space-y-4 text-[14px] leading-7 text-slate-800">
              {strengths.map((item, index) => (
                <li key={`${item}-${index}`} className="relative pl-5">
                  <span className="absolute left-0 top-[0.72em] h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h2 className="summary-subheading text-[15px] font-medium uppercase tracking-[0.12em] text-amber-700">
              Fix
            </h2>
            <ul className="summary-list mt-4 space-y-4 text-[14px] leading-7 text-slate-800">
              {weaknesses.map((item, index) => (
                <li key={`${item}-${index}`} className="relative pl-5">
                  <span className="absolute left-0 top-[0.72em] h-1.5 w-1.5 rounded-full bg-amber-500" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section
        id="drill"
        className="summary-section border-b border-slate-200 py-8"
      >
        <div className="summary-drill-callout rounded-lg border border-slate-200 px-5 py-5 md:px-6">
          <SectionLabel icon={<Dumbbell size={14} />}>
            Your next practice.
          </SectionLabel>
          <p className="summary-body mt-4 max-w-[820px] text-[20px] leading-9 text-slate-900 [font-family:Georgia,serif]">
            {dashboard.drillForNextTime ||
              "Before your next debate, practice stating one premise clearly and defending it against the strongest objection before adding a new claim."}
          </p>
        </div>
      </section>

      <section id="how-to-use" className="summary-section py-8">
        <SectionLabel icon={<ShieldCheck size={14} />}>
          How to use this debrief
        </SectionLabel>
        <div className="summary-note mt-4 space-y-2 text-[13px] leading-7 text-slate-600">
          <p>Read the verdict, then check where the momentum changed.</p>
          <p>Practice the drill once before starting another debate.</p>
        </div>
        <div className="summary-note mt-6 flex items-center gap-2 text-[12px] text-slate-500">
          <ShieldAlert size={13} />
          Scores are a guide to pressure and control, not a substitute for the
          transcript.
        </div>
      </section>
    </div>
  );
}
