import { auth } from "@clerk/nextjs/server";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  ArrowLeft,
  Crown,
  ScrollText,
  ShieldAlert,
  ShieldCheck,
  Swords,
} from "lucide-react";
import { prisma } from "src/server/db/client";
import { ROUTES } from "src/lib/routes";
import { getDebateDurationMeta, getDebateToneMeta } from "src/lib/debate";
import { getOrCreateDebateDashboard } from "src/server/debate/service";

interface Props {
  params: Promise<{ sessionId: string }>;
}

function SectionHeading({
  icon,
  eyebrow,
  title,
  body,
}: {
  icon: React.ReactNode;
  eyebrow: string;
  title: string;
  body?: string;
}) {
  return (
    <div className="max-w-[760px]">
      <div className="summary-section-kicker inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-slate-500">
        {icon}
        {eyebrow}
      </div>
      <h2 className="summary-section-title mt-3 text-[26px] leading-[1.06] tracking-[-0.04em] text-slate-950 [font-family:Georgia,serif] md:text-[32px]">
        {title}
      </h2>
      {body && (
        <p className="summary-section-copy mt-3 text-[14px] leading-7 text-slate-600">
          {body}
        </p>
      )}
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
  const winnerLabel =
    session.debateWinner === "USER"
      ? "You"
      : session.debateWinner === "ASSISTANT"
        ? "Socratic AI"
        : "Draw";

  return (
    <div className="summary-page mx-auto w-full max-w-[960px] px-4 py-6 md:px-8 md:py-10">
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

      <header className="summary-hero border-b border-slate-200 pb-8">
        <div className="summary-kicker inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.2em] text-slate-500">
          <Swords size={12} />
          Debate Review
        </div>
        <h1 className="summary-title mt-4 max-w-[820px] text-[34px] leading-[1.02] tracking-[-0.055em] text-slate-950 [font-family:Georgia,serif] md:text-[48px]">
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
        className="summary-section mt-10 border-b border-slate-200 pb-10"
      >
        <SectionHeading
          icon={<Crown size={14} />}
          eyebrow="Verdict"
          title={`Winner: ${winnerLabel}`}
          body="This is the short version of how the debate ended and why the final decision landed where it did."
        />
        <div className="mt-6 max-w-[780px] space-y-5">
          <p className="summary-body text-[16px] leading-8 text-slate-800 [font-family:Georgia,serif]">
            {session.debateVerdictSummary}
          </p>
          <p className="summary-note text-[13px] leading-7 text-slate-600">
            Treat this verdict like a performance review, not a label. The useful
            question is which moves made your case more persuasive, and which
            habits made it easier to attack.
          </p>
        </div>
      </section>

      <section
        id="debate-story"
        className="summary-section mt-10 border-b border-slate-200 pb-10"
      >
        <SectionHeading
          icon={<ScrollText size={14} />}
          eyebrow="What Happened"
          title="A readable account of the exchange"
          body="This section gives you the shape of the debate without forcing you through the full transcript again."
        />
        <div className="mt-6 grid gap-10 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
          <div className="space-y-6">
            <div>
              <h3 className="summary-subheading text-[15px] font-medium uppercase tracking-[0.12em] text-slate-500">
                Debate Summary
              </h3>
              <p className="summary-body mt-3 text-[16px] leading-8 text-slate-800 [font-family:Georgia,serif]">
                {session.debateSummary}
              </p>
            </div>

            <div>
              <h3 className="summary-subheading text-[15px] font-medium uppercase tracking-[0.12em] text-slate-500">
                Your Position
              </h3>
              <p className="summary-body mt-3 text-[15px] leading-8 text-slate-800 [font-family:Georgia,serif]">
                {dashboard.userBeliefsSummary}
              </p>
            </div>
          </div>

          <div>
            <h3 className="summary-subheading text-[15px] font-medium uppercase tracking-[0.12em] text-slate-500">
              The Model&apos;s Case
            </h3>
            <p className="summary-body mt-3 text-[15px] leading-8 text-slate-800 [font-family:Georgia,serif]">
              {dashboard.assistantCaseSummary}
            </p>
          </div>
        </div>
      </section>

      <section
        id="feedback"
        className="summary-section mt-10 border-b border-slate-200 pb-10"
      >
        <SectionHeading
          icon={<ShieldCheck size={14} />}
          eyebrow="Feedback"
          title="What to keep, what to fix"
          body="Good feedback should tell you exactly what worked, exactly what failed, and exactly what to practice next."
        />

        <div className="mt-8 grid gap-10 lg:grid-cols-2">
          <div>
            <h3 className="summary-subheading text-[15px] font-medium uppercase tracking-[0.12em] text-emerald-700">
              Where you were strong
            </h3>
            <ul className="summary-list mt-4 space-y-4 text-[14px] leading-7 text-slate-800">
              {dashboard.userStrengths.map((item) => (
                <li key={item} className="relative pl-5">
                  <span className="absolute left-0 top-[0.72em] h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="summary-subheading text-[15px] font-medium uppercase tracking-[0.12em] text-amber-700">
              Where your case weakened
            </h3>
            <ul className="summary-list mt-4 space-y-4 text-[14px] leading-7 text-slate-800">
              {dashboard.userWeaknesses.map((item) => (
                <li key={item} className="relative pl-5">
                  <span className="absolute left-0 top-[0.72em] h-1.5 w-1.5 rounded-full bg-amber-500" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section id="next-steps" className="summary-section mt-10 pb-8">
        <SectionHeading
          icon={<ShieldAlert size={14} />}
          eyebrow="How To Improve"
          title="How do you become better from here?"
          body="The goal is not to memorize a script. It is to sharpen the habits that make your case clearer, harder to attack, and easier to defend under pressure."
        />

        <div className="mt-8 max-w-[820px] space-y-5">
          {dashboard.improvementSuggestions.map((item) => (
            <p
              key={item}
              className="summary-advice text-[15px] leading-8 text-slate-800 [font-family:Georgia,serif]"
            >
              {item}
            </p>
          ))}
        </div>

        <details className="summary-details mt-10 border-t border-slate-200 pt-6">
          <summary className="cursor-pointer list-none text-[14px] font-medium text-slate-900">
            How to use this summary well
          </summary>
          <div className="mt-4 max-w-[760px] space-y-4 text-[14px] leading-7 text-slate-700">
            <p>
              Re-read the verdict first, then compare it against the strengths
              and weaknesses. The goal is to notice patterns, not isolated
              moments.
            </p>
            <p>
              Before your next debate, pick one strength to lean into harder and
              one weakness to actively correct. That is usually more useful than
              trying to fix everything at once.
            </p>
          </div>
        </details>
      </section>
    </div>
  );
}
