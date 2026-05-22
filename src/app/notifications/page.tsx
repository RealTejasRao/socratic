import type { Metadata } from "next";
import { BellRing } from "lucide-react";
import { StandaloneModeGate } from "@/src/components/pwa/standalone-mode-gate";
import { PwaPageHeader } from "@/src/components/pwa/pwa-page-header";
import { createPageMetadata } from "@/src/lib/seo";

export const metadata: Metadata = createPageMetadata({
  title: "Notifications",
  description: "Socratic AI notifications and announcements.",
  path: "/notifications",
  index: false,
});

export default function NotificationsPage() {
  return (
    <StandaloneModeGate
      browser={
        <main className="min-h-svh bg-[#f7f7f5] text-black">
          <PwaPageHeader title="Notifications" />
          <section className="px-4 py-10">
            <div className="mx-auto flex max-w-110 flex-col items-center rounded-3xl border border-black/10 bg-white px-6 py-12 text-center shadow-[0_16px_44px_rgba(0,0,0,0.07)]">
              <div className="inline-flex h-15 w-15 items-center justify-center rounded-full bg-[#a01717]/8 text-[#a01717]">
                <BellRing size={28} />
              </div>
              <h2 className="mt-5 text-[1.28rem] font-semibold tracking-[0.01em] text-black/88">
                Nothing here yet
              </h2>
              <p className="mt-2 max-w-72 text-[0.92rem] leading-relaxed text-black/58">
                New blog drops, product updates, and announcements will show up
                here.
              </p>
            </div>
          </section>
        </main>
      }
      standalone={
        <main className="min-h-svh bg-black text-white">
          <PwaPageHeader title="Notifications" theme="dark" />
          <section className="px-4 py-10">
            <div className="mx-auto flex max-w-110 flex-col items-center rounded-3xl border border-white/10 bg-[#060709] px-6 py-12 text-center shadow-[0_18px_52px_rgba(0,0,0,0.45)]">
              <div className="inline-flex h-15 w-15 items-center justify-center rounded-full bg-[#8b1d24]/22 text-[#ff6a72]">
                <BellRing size={28} />
              </div>
              <h2 className="mt-5 text-[1.28rem] font-semibold tracking-[0.01em] text-white/92">
                Nothing here yet
              </h2>
              <p className="mt-2 max-w-72 text-[0.92rem] leading-relaxed text-white/58">
                New blog drops, product updates, and announcements will show up
                here.
              </p>
            </div>
          </section>
        </main>
      }
    />
  );
}
