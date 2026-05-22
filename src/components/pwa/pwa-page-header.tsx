"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

type PwaPageHeaderProps = {
  title: string;
  theme?: "light" | "dark";
};

export function PwaPageHeader({
  title,
  theme = "light",
}: PwaPageHeaderProps) {
  const router = useRouter();

  const handleBack = () => {
    if (window.history.length > 1) {
      router.back();
      return;
    }

    router.push("/");
  };

  return (
    <header
      className={`sticky top-0 z-20 flex h-14 items-center justify-center px-4 backdrop-blur-md ${
        theme === "dark"
          ? "border-b border-white/10 bg-black/92"
          : "border-b border-black/10 bg-white/92"
      }`}
    >
      <button
        type="button"
        onClick={handleBack}
        aria-label="Go back"
        className={`absolute left-3 inline-flex h-10 w-10 items-center justify-center rounded-full transition-colors ${
          theme === "dark"
            ? "text-white/84 hover:bg-white/8"
            : "text-black/80 hover:bg-black/6"
        }`}
      >
        <ArrowLeft size={19} />
      </button>
      <h1
        className={`text-[1.02rem] font-semibold tracking-[0.01em] ${
          theme === "dark" ? "text-white/92" : "text-black/86"
        }`}
      >
        {title}
      </h1>
    </header>
  );
}
