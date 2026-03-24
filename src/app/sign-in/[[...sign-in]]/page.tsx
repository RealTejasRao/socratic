import Image from "next/image";
import { SignIn } from "@clerk/nextjs";
import { LoadGate } from "@/src/components/ui/load-gate";

export default function SignInPage() {
  const nietzscheImageScale = 0.8; // 1 = 100% of right panel width
  const nietzscheImageMaxWidthPx = 1960;
  const nietzscheImageOffsetXPx = -80;

  const clerkGlassAppearance = {
    elements: {
      rootBox: "auth-card-rise w-full justify-center",
      cardBox: "shadow-none",
      card: "w-full max-w-[440px] border border-white/16 bg-[#0b1320]/52 text-white shadow-[0_28px_90px_rgba(0,0,0,0.52)] backdrop-blur-[28px] backdrop-saturate-150 supports-[backdrop-filter]:bg-[#0b1320]/52",
      headerTitle: "text-white",
      headerSubtitle: "text-white/70",
      socialButtonsBlockButton:
        "border border-white/22 bg-white/8 text-white shadow-none backdrop-blur-md transition hover:bg-white/14 hover:text-white",
      socialButtonsBlockButtonText: "text-white",
      dividerLine: "bg-white/12",
      dividerText: "text-white/42",
      formFieldLabel: "text-white/74",
      formFieldInput:
        "border border-white/18 bg-white/8 text-white placeholder:text-white/34 backdrop-blur-md focus:border-white/28 focus:bg-white/12 focus:ring-0",
      formButtonPrimary:
        "!border-0 !bg-white !text-[#08111a] shadow-none transition hover:!bg-[#d4f2ff]",
      formButtonPrimaryText: "!text-[#08111a]",
      footerActionText: "text-white/58",
      footerActionLink: "text-white hover:text-white",
      identityPreviewText: "text-white",
      formResendCodeLink: "text-white hover:text-white",
      modalBackdrop: "bg-black/34 backdrop-blur-[2px]",
      modalContent:
        "border border-white/16 bg-[#0b1320]/52 text-white shadow-[0_28px_90px_rgba(0,0,0,0.52)] backdrop-blur-[28px] backdrop-saturate-150",
    },
    variables: {
      colorPrimary: "#bfecff",
      colorText: "#ffffff",
      colorTextSecondary: "rgba(255,255,255,0.68)",
      colorBackground: "rgba(11,19,32,0.52)",
      colorInputBackground: "rgba(255,255,255,0.08)",
      colorInputText: "#ffffff",
      colorNeutral: "rgba(255,255,255,0.78)",
      colorDanger: "#ff9a9a",
      borderRadius: "1rem",
    },
  };

  return (
    <LoadGate fallbackClassName="min-h-svh w-screen bg-black">
      <main className="auth-page-fade relative min-h-svh w-screen overflow-hidden bg-black text-[#0f1720] lg:h-svh">
        <div className="absolute inset-0 bg-black" />
        <div className="absolute inset-0 bg-[radial-gradient(circle,rgba(255,255,255,0.9)_0.78px,transparent_1.04px)] bg-size-[42px_42px]" />
        <div className="auth-stars-layer-a absolute inset-0 bg-[radial-gradient(circle,rgba(255,255,255,0.98)_1px,transparent_1.26px)] bg-size-[60px_60px] bg-position-[14px_20px]" />
        <div className="auth-stars-layer-b absolute inset-0 bg-[radial-gradient(circle,rgba(255,255,255,0.9)_0.92px,transparent_1.2px)] bg-size-[74px_74px] bg-position-[30px_10px]" />
        <div className="relative z-10 grid min-h-svh grid-cols-1 lg:h-svh lg:grid-cols-2">
          <section className="flex items-center justify-center px-4 py-6 lg:px-10 lg:py-8">
            <div className="auth-sign-up-zoom w-full max-w-md">
              <SignIn appearance={clerkGlassAppearance} />
            </div>
          </section>

          <section className="relative hidden overflow-hidden bg-transparent lg:block">
            <div
              className="absolute inset-x-0 bottom-0 flex justify-center"
              style={{ transform: `translateX(${nietzscheImageOffsetXPx}px)` }}
            >
              <Image
                src="/media/nietzsche_component2.png"
                alt="Nietzsche component"
                width={1050}
                height={1050}
                priority
                className="pointer-events-none block h-auto object-contain"
                style={{
                  width: `${nietzscheImageScale * 100}%`,
                  maxWidth: `${nietzscheImageMaxWidthPx}px`,
                }}
              />
            </div>
          </section>
        </div>
      </main>
    </LoadGate>
  );
}
