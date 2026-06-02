import type { Metadata } from "next";
import Image from "next/image";
import { SignUp } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { LoadGate } from "@/src/components/ui/load-gate";
import { resolveOptimizedCloudinaryPublicAsset } from "@/src/lib/cloudinary-public-assets";
import { ROUTES } from "@/src/lib/routes";
import { createPageMetadata, seoConfig } from "@/src/lib/seo";

export const metadata: Metadata = createPageMetadata({
  title: "Sign Up",
  description: "Create your Socratic AI account.",
  path: "/sign-up",
  index: false,
});

export default async function SignUpPage() {
  const { userId } = await auth();

  if (userId) {
    redirect(ROUTES.APP);
  }

  const appRedirectUrl = `${seoConfig.siteUrl}${ROUTES.APP}`;
  const signInUrl = `${seoConfig.siteUrl}${ROUTES.SIGN_IN}`;

  const clerkGlassAppearance = {
    elements: {
      rootBox: "auth-card-rise w-full justify-center",
      cardBox: "shadow-none",
      card: "w-full max-w-[440px] border border-white/22 bg-[#04070d]/92 text-white shadow-[0_28px_90px_rgba(0,0,0,0.56)] backdrop-blur-[28px] backdrop-saturate-140 supports-[backdrop-filter]:bg-[#04070d]/92",
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
        "border border-white/22 bg-[#04070d]/92 text-white shadow-[0_28px_90px_rgba(0,0,0,0.56)] backdrop-blur-[28px] backdrop-saturate-140",
    },
    variables: {
      colorPrimary: "#bfecff",
      colorText: "#ffffff",
      colorTextSecondary: "rgba(255,255,255,0.68)",
      colorBackground: "rgba(4,7,13,0.92)",
      colorInputBackground: "rgba(255,255,255,0.08)",
      colorInputText: "#ffffff",
      colorNeutral: "rgba(255,255,255,0.78)",
      colorDanger: "#ff9a9a",
      borderRadius: "1rem",
    },
  };

  return (
    <LoadGate fallbackClassName="min-h-svh w-screen bg-white">
      <main className="auth-page-fade relative min-h-svh w-screen overflow-hidden bg-white text-[#0f1720] lg:h-svh">
        <div className="absolute inset-0 bg-white" />
        <div className="absolute inset-0 bg-[radial-gradient(circle,rgba(0,0,0,0.34)_0.64px,transparent_0.86px)] bg-size-[37px_37px]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle,rgba(0,0,0,0.24)_0.56px,transparent_0.8px)] bg-size-[59px_59px] bg-position-[17px_9px]" />
        <div className="signup-stars-layer-a absolute inset-0 bg-[radial-gradient(circle,rgba(0,0,0,0.95)_1.02px,transparent_1.3px)] bg-size-[54px_54px] bg-position-[11px_19px]" />
        <div className="signup-stars-layer-b absolute inset-0 bg-[radial-gradient(circle,rgba(0,0,0,0.9)_0.94px,transparent_1.22px)] bg-size-[69px_69px] bg-position-[33px_9px]" />
        <div className="signup-stars-layer-c absolute inset-0 bg-[radial-gradient(circle,rgba(0,0,0,0.82)_0.84px,transparent_1.08px)] bg-size-[87px_87px] bg-position-[23px_37px]" />
        <div className="signup-stars-layer-d absolute inset-0 bg-[radial-gradient(circle,rgba(0,0,0,0.78)_0.78px,transparent_1.04px)] bg-size-[112px_112px] bg-position-[49px_26px]" />
        <div className="relative z-10 grid min-h-svh grid-cols-1 lg:h-svh lg:grid-cols-2">
          <section className="relative z-20 flex items-center justify-center px-4 py-6 lg:px-10 lg:py-8">
            <div className="auth-sign-up-zoom w-full max-w-md">
              <SignUp
                appearance={clerkGlassAppearance}
                fallbackRedirectUrl={appRedirectUrl}
                forceRedirectUrl={appRedirectUrl}
                oauthFlow="redirect"
                signInUrl={signInUrl}
              />
            </div>
          </section>

          <section className="relative hidden overflow-visible bg-transparent lg:block">
            <div className="absolute inset-x-0 bottom-0 z-0 flex justify-center -translate-x-20">
              <Image
                src={resolveOptimizedCloudinaryPublicAsset(
                  "/media/Socrates_component.png",
                  {
                    width: 2000,
                    crop: "limit",
                  },
                )}
                alt="Socrates illustration for the Socratic AI sign-up page"
                width={1050}
                height={1050}
                priority
                className="pointer-events-none block h-auto w-[250%] max-w-490 object-contain"
              />
            </div>
          </section>
        </div>
      </main>
    </LoadGate>
  );
}
