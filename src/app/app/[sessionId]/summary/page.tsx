import { auth } from "@clerk/nextjs/server";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  ArrowLeft,
  BarChart3,
  CircleAlert,
  CircleCheck,
  Clock3,
  Crown,
  Minus,
  ShieldAlert,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { prisma } from "src/server/db/client";
import { ROUTES } from "src/lib/routes";
import { getDebateDurationMeta, getDebateToneMeta } from "src/lib/debate";
import { getOrCreateDebateDashboard } from "src/server/debate/service";
import { DebateMomentumChart } from "./DebateMomentumChart";

interface Props {
  params: Promise<{ sessionId: string }>;
}

function normalizeBullets(items: string[], fallback: string) {
  return [...items, fallback, fallback, fallback]
    .filter((item) => item.trim())
    .slice(0, 3);
}

function RatioBar({
  won,
  lost,
  contested,
}: {
  won: number;
  lost: number;
  contested: number;
}) {
  const total = Math.max(won + lost + contested, 1);
  const wonWidth = `${(won / total) * 100}%`;
  const lostWidth = `${(lost / total) * 100}%`;
  const contestedWidth = `${(contested / total) * 100}%`;

  return (
    <div className="summary-ratio">
      <div className="flex h-2 overflow-hidden rounded-full bg-[#ebe8df]">
        <span className="bg-[#397367]" style={{ width: wonWidth }} />
        <span className="bg-[#b8453b]" style={{ width: lostWidth }} />
        <span className="bg-[#b87333]" style={{ width: contestedWidth }} />
      </div>
      <div className="mt-3 grid grid-cols-3 gap-2 text-[12px] text-[#666a63]">
        <span>
          <strong className="text-[#285f53]">{won}</strong> won
        </span>
        <span>
          <strong className="text-[#a33c32]">{lost}</strong> lost
        </span>
        <span>
          <strong className="text-[#955b25]">{contested}</strong> contested
        </span>
      </div>
    </div>
  );
}

function FeedbackTable({
  strengths,
  weaknesses,
}: {
  strengths: string[];
  weaknesses: string[];
}) {
  const rows = strengths.map((strength, index) => ({
    strength,
    weakness: weaknesses[index] ?? "No specific transcript-backed weakness was available.",
  }));

  return (
    <div className="summary-feedback-table overflow-x-auto border border-[#ddd8cd] bg-[#fffdf8]">
      <table className="w-full min-w-[780px] border-collapse text-left">
        <thead>
          <tr className="border-b border-[#d8d4ca] bg-[#f7f4ed] text-[16px] font-semibold text-[#555a54]">
            <th className="w-1/2 px-6 py-5">
              <span className="inline-flex items-center gap-2 text-[#285f53]">
                <CircleCheck size={19} />
                Strengths
              </span>
            </th>
            <th className="w-1/2 border-l border-[#d8d4ca] px-6 py-5">
              <span className="inline-flex items-center gap-2 text-[#a33c32]">
                <CircleAlert size={19} />
                Weaknesses
              </span>
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr
              key={`${row.strength}-${index}`}
              className="border-b border-[#e3e1d8] align-top last:border-b-0"
            >
              <td className="border-r border-[#d8d4ca] px-6 py-6 text-[15px] leading-7 text-[#243f36]">
                {row.strength}
              </td>
              <td className="px-6 py-6 text-[15px] leading-7 text-[#55302c]">
                {row.weakness}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
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
  const winnerLabel =
    winner === "USER" ? "You won" : winner === "ASSISTANT" ? "AI won" : "Draw";
  const winnerClass =
    winner === "USER"
      ? "text-[#285f53]"
      : winner === "ASSISTANT"
        ? "text-[#8f3d34]"
        : "text-[#3f4340]";
  const resultAccent =
    winner === "USER"
      ? "from-[#397367] to-[#63ccca]"
      : winner === "ASSISTANT"
        ? "from-[#b8453b] to-[#e07768]"
        : "from-[#71756d] to-[#b8b3a8]";
  const resultIcon =
    winner === "USER" ? (
      <TrendingUp size={17} />
    ) : winner === "ASSISTANT" ? (
      <TrendingDown size={17} />
    ) : (
      <Minus size={17} />
    );
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
  const wonCount = roundsWon ?? 0;
  const lostCount = roundsLost ?? 0;
  const contestedCount = roundsContested ?? 0;

  return (
    <div className="summary-page min-h-screen bg-[#fefefc] text-[#20211f]">
      <header className="summary-topbar sticky top-0 z-20 border-b border-[#e3e1d8] bg-[#fefefc]/90 px-4 py-3 backdrop-blur md:px-6">
        <div className="mx-auto flex max-w-[1480px] items-center justify-between gap-4">
          <Link
            href={`/app/${session.id}`}
            className="summary-back-link inline-flex items-center gap-2 rounded-md px-2 py-1.5 text-[13px] font-medium text-[#30342f] transition hover:bg-[#f2f0e9]"
          >
            <ArrowLeft size={15} />
            Back to debate
          </Link>
          <div className="summary-generated hidden items-center gap-2 text-[13px] text-[#666a63] sm:flex">
            <Clock3 size={14} />
            {new Date(dashboard.generatedAt).toLocaleString()}
          </div>
        </div>
      </header>

      <main>
        <section className="summary-graph-stage min-h-[calc(100svh-57px)] border-b border-[#e3e1d8] px-4 py-5 md:px-6 md:py-6">
          <div className="mx-auto grid h-full max-w-[1480px] grid-rows-[auto_1fr_auto] gap-5">
            <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
              <div>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-[14px] font-medium text-[#555a54]">
                  <span>Post-match report</span>
                  <span className="h-1 w-1 rounded-full bg-[#b8b3a8]" />
                  <span>{toneMeta.label}</span>
                  <span className="h-1 w-1 rounded-full bg-[#b8b3a8]" />
                  <span>{durationMeta.label}</span>
                </div>
                <h1 className="summary-title mt-3 max-w-[980px] text-[28px] font-normal leading-tight text-[#171916] [font-family:Georgia,serif] md:text-[40px]">
                  {session.debateTopic}
                </h1>
                <div className="mt-5 h-1.5 max-w-[460px] overflow-hidden rounded-full bg-[#ebe8df]">
                  <div
                    className={`h-full w-2/3 rounded-full bg-gradient-to-r ${resultAccent}`}
                  />
                </div>
              </div>

              <dl className="summary-result-grid grid grid-cols-2 gap-5 border-t border-[#e3e1d8] pt-4 text-[14px] xl:self-center xl:border-t-0 xl:pt-0">
                <div>
                  <dt className="summary-note text-[13px] font-medium text-[#666a63]">
                    You argued
                  </dt>
                  <dd className="summary-body mt-2 text-[17px] font-semibold leading-7 text-[#20211f]">
                    {session.userDebateSide}
                  </dd>
                </div>
                <div>
                  <dt className="summary-note text-[13px] font-medium text-[#666a63]">
                    AI argued
                  </dt>
                  <dd className="summary-body mt-2 text-[17px] font-semibold leading-7 text-[#20211f]">
                    {session.aiDebateSide}
                  </dd>
                </div>
              </dl>
            </div>

            <div className="summary-chart-wrap min-h-[520px]">
              <DebateMomentumChart
                data={dashboard.momentumScores ?? []}
                className="h-full min-h-[520px] w-full"
              />
            </div>

            <div className="summary-chart-note flex flex-wrap items-center justify-between gap-3 border-t border-[#e3e1d8] pt-4 text-[13px] text-[#666a63]">
              <p>Positive scores favor you. Negative scores favor the AI.</p>
              <p>Scores estimate pressure and control; the transcript is the source of truth.</p>
            </div>
          </div>
        </section>

        <section className="summary-verdict border-b border-[#e3e1d8] px-4 py-10 md:px-6">
          <div className="mx-auto grid max-w-[1480px] gap-7 lg:grid-cols-[310px_minmax(0,1fr)]">
            <div>
              <h2 className="summary-section-heading text-[34px] leading-none text-[#171916] [font-family:Georgia,serif] md:text-[44px]">
                Verdict
              </h2>
              <div className={`mt-5 h-1.5 w-32 rounded-full bg-gradient-to-r ${resultAccent}`} />
              <p className={`mt-5 inline-flex items-center gap-2 text-[15px] font-semibold ${winnerClass}`}>
                {resultIcon}
                {winnerLabel}
              </p>
            </div>
            <div className="border-l-4 border-[#2c3a4b] bg-[#f7f4ed] px-6 py-6">
              <p className="summary-body max-w-[980px] text-[22px] leading-10 text-[#20211f]">
                {session.debateVerdictSummary ||
                  "The debate ended, but the verdict summary was not available."}
              </p>
            </div>
          </div>
        </section>

        <section className="summary-metrics border-b border-[#e3e1d8] px-4 py-10 md:px-6">
          <div className="mx-auto max-w-[1480px]">
            <div className="mb-7 border-t border-[#d8d4ca] pt-8">
              <h2 className="summary-section-heading text-[34px] leading-none text-[#171916] [font-family:Georgia,serif] md:text-[44px]">
                Match analysis
              </h2>
            </div>

            <div className="border border-[#ddd8cd] bg-[#fffdf8]">
              <div className="border-b border-[#ddd8cd] bg-[#fbfaf6] p-6">
                <div className="mb-6 flex items-center gap-2 text-[18px] font-semibold text-[#20211f]">
                  <BarChart3 size={20} />
                  Round distribution
                </div>
                <RatioBar
                  won={wonCount}
                  lost={lostCount}
                  contested={contestedCount}
                />
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[700px] border-collapse text-left">
                  <tbody className="divide-y divide-[#ddd8cd]">
                    <tr>
                      <th className="w-[230px] bg-[#fbfaf6] px-6 py-5 text-[14px] font-semibold text-[#555a54]">
                        Rhetorical style
                      </th>
                      <td className="border-l border-[#ddd8cd] px-6 py-5 text-[18px] font-semibold text-[#20211f]">
                        {dashboard.rhetoricalStyle || "Not available"}
                      </td>
                    </tr>
                    <tr>
                      <th className="w-[230px] bg-[#fbfaf6] px-6 py-5 text-[14px] font-semibold text-[#285f53]">
                        Strongest moment
                      </th>
                      <td className="border-l border-[#c8ded4] bg-[#eef7f2] px-6 py-6 text-[17px] font-semibold leading-8 text-[#243f36]">
                        {dashboard.strongestMoment || "Not available"}
                      </td>
                    </tr>
                    <tr>
                      <th className="w-[230px] bg-[#fbfaf6] px-6 py-5 text-[14px] font-semibold text-[#a33c32]">
                        Weakest moment
                      </th>
                      <td className="border-l border-[#efcfc9] bg-[#fff0ee] px-6 py-6 text-[17px] font-semibold leading-8 text-[#55302c]">
                        {dashboard.weakestMoment || "Not available"}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </section>

        <section className="summary-feedback border-b border-[#e3e1d8] px-4 py-10 md:px-6">
          <div className="mx-auto max-w-[1480px]">
            <div className="mb-7 grid gap-4 lg:grid-cols-[minmax(0,1fr)_420px] lg:items-end">
              <div>
                <h2 className="summary-section-heading text-[34px] leading-none text-[#171916] [font-family:Georgia,serif] md:text-[44px]">
                  Strengths and weaknesses
                </h2>
              </div>
              <p className="summary-note border-l-2 border-[#d8d4ca] pl-4 text-[14px] leading-6 text-[#666a63]">
                Paired evidence from the debate, not generic advice.
              </p>
            </div>
            <FeedbackTable strengths={strengths} weaknesses={weaknesses} />
          </div>
        </section>

        <section className="summary-practice px-4 py-10 md:px-6">
          <div className="mx-auto max-w-[1480px] border border-[#d8d4ca] bg-[#fffdf8] px-6 py-6 shadow-[0_16px_36px_rgba(44,58,75,0.06)] md:px-8 md:py-7">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:gap-8">
              <div className="flex min-w-[280px] items-center gap-3">
                <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-[#d6a43b]/35 bg-[#fff7df] text-[#b98216] shadow-[0_0_0_6px_rgba(214,164,59,0.08)] motion-safe:animate-pulse">
                  <Crown size={21} />
                </span>
                <div>
                  <h2 className="summary-section-heading text-[28px] font-normal leading-tight text-[#171916] [font-family:Georgia,serif] md:text-[34px]">
                    Your Next Practice
                  </h2>
                  <p className="mt-2 text-[13px] leading-5 text-[#666a63]">
                    Highest leverage drill before your next debate.
                  </p>
                </div>
              </div>
              <div className="border-t border-[#e3e1d8] pt-5 lg:border-l lg:border-t-0 lg:pl-8 lg:pt-0">
                <p className="summary-body max-w-[980px] text-[20px] leading-8 text-[#20211f] md:text-[22px] md:leading-9">
                  {dashboard.drillForNextTime ||
                    "Before your next debate, practice stating one premise clearly and defending it against the strongest objection before adding a new claim."}
                </p>
                <p className="summary-note mt-5 flex max-w-[820px] items-start gap-3 text-[14px] leading-7 text-[#555a54]">
                  <ShieldAlert className="mt-1 shrink-0" size={16} />
                  Use this after the graph: identify the exchange where momentum
                  shifted, then practice the drill against that exact weakness.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
