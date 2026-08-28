import { DebateSummaryPageContent } from "@/src/app/app/[sessionId]/summary/page";
import { ROUTES } from "@/src/lib/routes";

interface Props {
  params: Promise<{ sessionId: string }>;
}

export default async function UpscDebateSummaryPage({ params }: Props) {
  return (
    <DebateSummaryPageContent
      params={params}
      appBasePath={ROUTES.UPSC_APP}
    />
  );
}
