"use client";

import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { useClerk, useUser } from "@clerk/nextjs";
import {
  ChevronRight,
  Instagram,
  Linkedin,
  Mail,
  UserRound,
  Youtube,
} from "lucide-react";
import { PwaPageHeader } from "@/src/components/pwa/pwa-page-header";
import type { BillingStateResponse } from "@/src/types/billing";

type BillingViewState = {
  isPremium: boolean;
  tierLabel: "Free" | "Socratic+";
};

type SettingRowProps = {
  label: string;
  right?: string;
  href?: string;
  onClick?: () => void;
  showChevron?: boolean;
  leftSlot?: ReactNode;
};

function XIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4.5 w-4.5 fill-current" aria-hidden="true">
      <path d="M18.9 2H21l-6.55 7.49L22 22h-5.94l-4.65-7.6L4.76 22H2.64l7.01-8.01L2 2h6.09l4.2 6.92L18.9 2Zm-1.04 18h1.64L7.2 3.9H5.44Z" />
    </svg>
  );
}

function SettingRow({
  label,
  right,
  href,
  onClick,
  showChevron = Boolean(href || onClick),
  leftSlot,
}: SettingRowProps) {
  const content = (
    <div className="flex min-h-12 items-center justify-between rounded-xl px-1 py-0.5 text-[0.96rem] text-white/86 transition-colors hover:bg-white/[0.04]">
      <span className="inline-flex items-center gap-3">
        {leftSlot}
        <span>{label}</span>
      </span>
      <span className="inline-flex items-center gap-2 text-[0.88rem] text-white/52">
        {right ? <span>{right}</span> : null}
        {showChevron ? <ChevronRight size={17} /> : null}
      </span>
    </div>
  );

  if (href) {
    return (
      <a
        href={href}
        target={href.startsWith("http") ? "_blank" : undefined}
        rel={href.startsWith("http") ? "noreferrer noopener" : undefined}
        className="block"
      >
        {content}
      </a>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full text-left"
      aria-label={label}
    >
      {content}
    </button>
  );
}

export function SettingsAppClient() {
  const clerk = useClerk();
  const { user, isSignedIn } = useUser();
  const [billingState, setBillingState] = useState<BillingViewState>({
    isPremium: false,
    tierLabel: "Free",
  });

  useEffect(() => {
    if (!isSignedIn) {
      return;
    }

    let cancelled = false;

    const loadBillingState = async () => {
      try {
        const response = await fetch("/api/v1/billing/state", {
          method: "GET",
        });

        if (!response.ok) {
          return;
        }

        const payload = (await response.json()) as BillingStateResponse;
        if (!cancelled) {
          setBillingState({
            isPremium: payload.isPremium,
            tierLabel: payload.tierLabel,
          });
        }
      } catch {
        if (!cancelled) {
          setBillingState({
            isPremium: false,
            tierLabel: "Free",
          });
        }
      }
    };

    void loadBillingState();

    return () => {
      cancelled = true;
    };
  }, [isSignedIn]);

  const name =
    user?.fullName ??
    user?.firstName ??
    user?.username ??
    (isSignedIn ? "Socratic user" : "Guest");
  const email =
    user?.primaryEmailAddress?.emailAddress ??
    user?.emailAddresses?.[0]?.emailAddress ??
    "Sign in to view your email";
  const appUrl =
    typeof window !== "undefined" ? window.location.origin : "https://usesocratic.com";

  const inviteMessage = useMemo(
    () =>
      "I found Socratic AI and it actually makes you think. It challenges your ideas instead of just agreeing with everything. Try it with me:",
    [],
  );

  const shareInvite = async () => {
    const shareText = `${inviteMessage} ${appUrl}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: "Socratic AI",
          text: inviteMessage,
          url: appUrl,
        });
        return;
      } catch {
        return;
      }
    }

    try {
      await navigator.clipboard.writeText(shareText);
    } catch {
      // no-op fallback
    }
  };

  const effectiveBillingState = isSignedIn
    ? billingState
    : {
        isPremium: false,
        tierLabel: "Free" as const,
      };

  const planLabel = effectiveBillingState.isPremium
    ? `${effectiveBillingState.tierLabel} 🙂`
    : `${effectiveBillingState.tierLabel} 🙁`;

  const socialLinks = [
    {
      label: "Instagram",
    href: "https://www.instagram.com/usesocraticai/",
      icon: <Instagram size={18} className="text-[#ff4d8d]" />,
    },
    {
      label: "YouTube",
      href: "https://www.youtube.com/@useSocraticAI",
      icon: <Youtube size={18} className="text-[#ff2f2f]" />,
    },
    {
      label: "LinkedIn",
      href: "https://www.linkedin.com/company/usesocratic/",
      icon: <Linkedin size={18} className="text-[#0a66c2]" />,
    },
    {
      label: "X",
      href: "https://x.com/useSocraticAI",
      icon: <XIcon />,
    },
  ] as const;

  return (
    <main className="min-h-svh bg-[#050609] text-white">
      <PwaPageHeader title="Settings" theme="dark" />
      <section className="mx-auto flex w-full max-w-120 flex-col gap-4 px-4 py-4 pb-[calc(5.8rem+env(safe-area-inset-bottom))]">
        {!effectiveBillingState.isPremium ? (
          <div className="rounded-2xl border border-[#6d4d1f] bg-[linear-gradient(140deg,#201307_0%,#2b1a0a_56%,#191106_100%)] px-4.5 py-4">
            <p className="text-[1.02rem] font-semibold text-[#e5be66]">
              Get Socratic+
            </p>
            <p className="mt-1 text-[0.86rem] leading-relaxed text-[#cfb077]/88">
              Unlimited messages, Debate Mode, premium tones, and full access.
            </p>
            <a
              href="/pricing"
              className="mt-3 inline-flex min-h-10 items-center justify-center rounded-full border border-[#e2c27d] bg-[#e2c27d] px-5 text-[0.83rem] font-semibold tracking-[0.03em] text-[#201406]"
            >
              Upgrade
            </a>
          </div>
        ) : (
          <div className="rounded-2xl border border-[#3f3322] bg-[#151009] px-4.5 py-4">
            <p className="text-[1rem] font-semibold text-[#e7c270]">
              Socratic+ active
            </p>
            <p className="mt-1 text-[0.84rem] leading-relaxed text-[#c8b281]/75">
              Premium features are unlocked for your account.
            </p>
          </div>
        )}

        <div className="rounded-2xl border border-white/10 bg-[#0b0d12] px-4 py-3">
          <p className="text-[0.74rem] font-semibold tracking-[0.08em] text-white/45 uppercase">
            Account
          </p>
          {isSignedIn ? (
            <button
              type="button"
              onClick={() => clerk.openUserProfile()}
              className="mt-3 flex w-full items-center gap-3.5 rounded-2xl px-1 py-1 text-left transition-colors hover:bg-white/[0.04]"
              aria-label="Open account settings"
            >
              <div className="inline-flex h-13.5 w-13.5 items-center justify-center rounded-full border border-white/12">
                {user?.imageUrl ? (
                  <div
                    className="h-12 w-12 rounded-full bg-cover bg-center"
                    style={{ backgroundImage: `url("${user.imageUrl}")` }}
                    aria-hidden="true"
                  />
                ) : (
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/[0.03] text-white/66">
                    <UserRound size={21} />
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[0.98rem] font-semibold text-white/88">
                  {name}
                </p>
                <p className="truncate text-[0.82rem] text-white/56">{email}</p>
              </div>
              <ChevronRight size={18} className="shrink-0 text-white/44" />
            </button>
          ) : (
            <div className="mt-3 flex items-center gap-3.5">
              <div className="flex h-13.5 w-13.5 items-center justify-center rounded-full border border-white/12 bg-white/[0.03] text-white/66">
                <UserRound size={23} />
              </div>
              <div className="min-w-0">
                <p className="truncate text-[0.98rem] font-semibold text-white/88">
                  {name}
                </p>
                <p className="truncate text-[0.82rem] text-white/56">{email}</p>
              </div>
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-white/10 bg-[#0b0d12] px-4 py-2">
          <SettingRow label="Invite a Friend" onClick={() => void shareInvite()} />
          <SettingRow label="Current Plan" right={planLabel} showChevron={false} />
          <SettingRow label="Blog" href="/blog" />
          <SettingRow label="About" href="/blog/what-is-socratic-ai" />
        </div>

        <div className="h-px bg-white/10" />

        <div className="rounded-2xl border border-white/10 bg-[#0b0d12] px-4 py-3">
          <p className="text-[0.74rem] font-semibold tracking-[0.08em] text-white/45 uppercase">
            Connect With Us
          </p>
          <div className="mt-3">
            {socialLinks.map((link) => (
              <SettingRow
                key={link.label}
                label={link.label}
                href={link.href}
                leftSlot={
                  <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/[0.04] text-white">
                    {link.icon}
                  </span>
                }
              />
            ))}
          </div>
        </div>

        <div className="h-px bg-white/10" />

        <div className="rounded-2xl border border-white/10 bg-[#0b0d12] px-4 py-2">
          <p className="px-1 py-2 text-[0.74rem] font-semibold tracking-[0.08em] text-white/45 uppercase">
            Legal
          </p>
          <SettingRow label="Privacy Policy" href="/privacy-policy" />
          <SettingRow label="Terms of Service" href="/terms" />
          <SettingRow
            label="Contact Us"
            href="mailto:contact@usesocratic.com"
            leftSlot={
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/[0.04] text-white/78">
                <Mail size={17} />
              </span>
            }
          />
        </div>

        <p className="pb-3 text-center text-[0.72rem] text-white/34">
          © 2026 Socratic AI
        </p>
      </section>
    </main>
  );
}
