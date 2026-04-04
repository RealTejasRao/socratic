import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
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
    <div className="app-roleplay-setup mx-auto w-full max-w-245 px-0 pb-1">
      <div className="mx-auto max-w-155 text-center">
        <h2 className="app-roleplay-heading text-[21px] leading-none tracking-[-0.04em] text-slate-950 font-[Georgia,serif] md:text-[25px]">
          Choose who you want to think with.
        </h2>
        <p className="app-roleplay-muted mt-2 text-[11px] leading-5 text-slate-500">
          Four philosophers. Four distinct traditions. Pick one, open the
          conversation, and keep the exchange inside that thinker&apos;s school.
        </p>
      </div>

      <div className="mt-5 grid justify-items-center gap-5 xl:grid-cols-4">
        {ROLEPLAY_PHILOSOPHERS.map((philosopher) => {
          return (
            <article
              key={philosopher.id}
              className="app-roleplay-card w-full max-w-56 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_12px_30px_rgba(15,23,42,0.07)]"
            >
              <div className="app-roleplay-image-wrap relative aspect-6/5 overflow-hidden bg-[#f5f3ee]">
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

              <div className="px-3 pb-3 pt-2.5">
                <h3 className="app-roleplay-heading text-[17px] leading-[1.02] tracking-[0.01em] text-slate-950 font-[Georgia,serif]">
                  {philosopher.name}
                </h3>
                <p className="app-roleplay-muted mt-1.5 min-h-9 text-[11px] leading-4 text-slate-600">
                  {philosopher.tradition}
                </p>

                <div className="mt-3 flex flex-col gap-1.5">
                  <Link
                    href={philosopher.wikipediaUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="app-roleplay-secondary-btn inline-flex items-center justify-center gap-1.5 rounded-full px-3 py-1.5 text-[10px] text-slate-700 transition hover:bg-slate-50 hover:text-slate-950"
                  >
                    Learn more
                    <ArrowUpRight size={12} />
                  </Link>

                  <button
                    type="button"
                    onClick={() => void handleStartRoleplay(philosopher.id)}
                    className="app-roleplay-primary-btn inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-full bg-slate-950 px-3 py-1.5 text-[10px] text-white transition hover:bg-black disabled:cursor-not-allowed disabled:opacity-60"
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
