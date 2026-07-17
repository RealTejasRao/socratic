"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { ROUTES } from "@/src/lib/routes";

type MarketingStandaloneBackLinkProps = {
  className: string;
};

export function MarketingStandaloneBackLink({
  className,
}: MarketingStandaloneBackLinkProps) {
  const router = useRouter();

  function handleBack() {
    if (window.history.length > 1) {
      router.back();
      return;
    }

    router.push(ROUTES.APP_ROLEPLAY);
  }

  return (
    <button
      type="button"
      onClick={handleBack}
      className={className}
      aria-label="Go back"
    >
      <ArrowLeft size={16} />
      <span>Back</span>
    </button>
  );
}
