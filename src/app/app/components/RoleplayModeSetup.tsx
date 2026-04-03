import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, ScrollText } from "lucide-react";
import { resolveOptimizedCloudinaryPublicAsset } from "@/src/lib/cloudinary-public-assets";
import {
  ROLEPLAY_PHILOSOPHERS,
  type RoleplayPhilosopherId,
} from "src/lib/roleplay";

interface Props {
  onChatNow: (philosopherId: RoleplayPhilosopherId) => void;
}

export default function RoleplayModeSetup({ onChatNow }: Props) {
  function handleStartRoleplay(philosopherId: RoleplayPhilosopherId) {
    onChatNow(philosopherId);
  }

  return (
    <div className="app-roleplay-setup mx-auto w-full max-w-[1180px] px-0 pb-2">
      <div className="mx-auto max-w-[760px] text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[10px] uppercase tracking-[0.22em] text-slate-500">
          <ScrollText size={12} />
          Roleplay
        </div>
        <h2 className="app-roleplay-heading mt-3 text-[26px] leading-[1] tracking-[-0.05em] text-slate-950 [font-family:Georgia,serif] md:text-[32px]">
          Choose who you want to think with.
        </h2>
        <p className="app-roleplay-muted mt-3 text-[12px] leading-6 text-slate-500">
          Four philosophers. Four distinct traditions. Pick one, open the
          conversation, and keep the exchange inside that thinker&apos;s school.
        </p>
      </div>

      <div className="mt-7 grid gap-5 xl:grid-cols-4">
        {ROLEPLAY_PHILOSOPHERS.map((philosopher) => {
          return (
            <article
              key={philosopher.id}
              className="app-roleplay-card overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-[0_16px_40px_rgba(15,23,42,0.08)]"
            >
              <div className="app-roleplay-image-wrap relative aspect-[5/4] overflow-hidden bg-[#f5f3ee]">
                <Image
                  src={resolveOptimizedCloudinaryPublicAsset(
                    philosopher.imagePath,
                    {
                      width: 800,
                      height: 640,
                      crop: "fill",
                      quality: "auto",
                    },
                  )}
                  alt={philosopher.name}
                  fill
                  sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 25vw"
                  className="object-cover"
                  priority
                />
              </div>

              <div className="px-4 pb-4 pt-3">
                <h3 className="app-roleplay-heading text-[22px] leading-[0.98] tracking-[-0.04em] text-slate-950 [font-family:Georgia,serif]">
                  {philosopher.name}
                </h3>
                <p className="app-roleplay-muted mt-2 min-h-[44px] text-[12px] leading-5 text-slate-600">
                  {philosopher.tradition}
                </p>

                <div className="mt-4 flex flex-col gap-2">
                  <Link
                    href={philosopher.wikipediaUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="app-roleplay-secondary-btn inline-flex items-center justify-center gap-2 rounded-full border border-slate-300 px-3.5 py-2 text-[11px] text-slate-700 transition hover:bg-slate-50 hover:text-slate-950"
                  >
                    Learn more
                    <ArrowUpRight size={14} />
                  </Link>

                  <button
                    type="button"
                    onClick={() => void handleStartRoleplay(philosopher.id)}
                    className="app-roleplay-primary-btn inline-flex items-center justify-center gap-2 rounded-full bg-slate-950 px-3.5 py-2 text-[11px] text-white transition hover:bg-black disabled:opacity-60"
                  >
                    Chat now
                  </button>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
