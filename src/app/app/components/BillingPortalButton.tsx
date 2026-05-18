"use client";

import { useState } from "react";
import { LoaderCircle } from "lucide-react";

export default function BillingPortalButton() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleOpenPortal() {
    setIsLoading(true);
    setError("");

    try {
      const response = await fetch("/api/v1/billing/portal", {
        method: "POST",
      });

      if (!response.ok) {
        const text = await response.text();
        setError(text || "Could not open billing portal.");
        return;
      }

      const payload = (await response.json()) as { portalUrl?: string };
      if (!payload.portalUrl) {
        setError("No portal link was returned.");
        return;
      }

      window.location.href = payload.portalUrl;
    } catch {
      setError("Could not open billing portal.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => void handleOpenPortal()}
        disabled={isLoading}
        className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-[#2e261c] bg-[#2e261c] px-4 py-2 text-[13px] text-[#f7f2e7] transition hover:bg-[#241d15] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isLoading ? (
          <LoaderCircle size={14} className="animate-spin" />
        ) : null}
        Manage subscription
      </button>
      {error ? (
        <p className="mt-2 text-[12px] text-rose-500">{error}</p>
      ) : null}
    </div>
  );
}
