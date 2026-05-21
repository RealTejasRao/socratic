"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

type PwaPageHeaderProps = {
  title: string;
};

export function PwaPageHeader({ title }: PwaPageHeaderProps) {
  const router = useRouter();

  const handleBack = () => {
    if (window.history.length > 1) {
      router.back();
      return;
    }

    router.push("/");
  };

  return (
    <header className="sticky top-0 z-20 flex h-14 items-center justify-center border-b border-black/10 bg-white/92 px-4 backdrop-blur-md">
      <button
        type="button"
        onClick={handleBack}
        aria-label="Go back"
        className="absolute left-3 inline-flex h-10 w-10 items-center justify-center rounded-full text-black/80 transition-colors hover:bg-black/6"
      >
        <ArrowLeft size={19} />
      </button>
      <h1 className="text-[1.02rem] font-semibold tracking-[0.01em] text-black/86">
        {title}
      </h1>
    </header>
  );
}
