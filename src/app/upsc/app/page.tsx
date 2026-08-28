import { AppHomePageContent } from "@/src/app/app/page";

type UpscAppHomePageProps = Parameters<typeof AppHomePageContent>[0];

export default async function UpscAppHomePage({
  searchParams,
}: UpscAppHomePageProps) {
  return (
    <AppHomePageContent
      {...(searchParams === undefined ? {} : { searchParams })}
      defaultMode="SOCRATIC"
    />
  );
}
