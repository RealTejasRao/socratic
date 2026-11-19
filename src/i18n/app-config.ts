import type { AppCopy } from "@/src/i18n/app";
import {
  DEBATE_DURATION_OPTIONS,
  DEBATE_TONE_OPTIONS,
  type DebateDurationPreset,
  type DebateTone,
} from "@/src/lib/debate";
import {
  ROLEPLAY_PHILOSOPHERS,
  type RoleplayCharacterProfile,
  type RoleplayFlair,
  type RoleplayPhilosopherId,
} from "@/src/lib/roleplay";
import {
  SOCRATIC_TONE_OPTIONS,
  type SocraticTone,
} from "@/src/lib/socratic";
import { CHAT_FONT_SIZE_OPTIONS } from "@/src/lib/chat-display";
import { socraticPlans, BILLINGSDK_PLAN_IDS } from "@/src/lib/billingsdk-config";
import { PLAN_LIMITS } from "@/src/lib/billing";

export function getLocalizedBillingPlans(copy: AppCopy) {
  return socraticPlans.map((plan) => {
    const free = plan.id === BILLINGSDK_PLAN_IDS.FREE;
    const labels = free ? copy.billingUi.plans.free
      : plan.id === BILLINGSDK_PLAN_IDS.PREMIUM_ANNUAL ? copy.billingUi.plans.annual
      : copy.billingUi.plans.monthly;
    const features = free ? copy.billingUi.plans.free.features : copy.billingUi.plans.premiumFeatures;
    return {
      ...plan,
      title: labels.title,
      description: labels.description,
      buttonText: labels.button,
      ...(plan.badge ? { badge: copy.billingUi.plans.annual.badge } : {}),
      features: plan.features.map((feature, index) => ({
        ...feature,
        name: (features[index] ?? feature.name).replace("{count}", String(PLAN_LIMITS.FREE_DAILY_MESSAGES)),
      })),
    };
  });
}

export function getLocalizedChatFontSizeOptions(copy: AppCopy) {
  return CHAT_FONT_SIZE_OPTIONS.map((option) => ({
    ...option,
    ...(copy.config.chatFontSizes[option.value] ?? {}),
  }));
}

export function getLocalizedSocraticToneOptions(copy: AppCopy) {
  return SOCRATIC_TONE_OPTIONS.map((option) => ({
    ...option,
    ...(copy.config.socraticTones[option.value] ?? {}),
  }));
}

export function getLocalizedSocraticToneMeta(
  tone: SocraticTone,
  copy: AppCopy,
) {
  return (
    getLocalizedSocraticToneOptions(copy).find(
      (option) => option.value === tone,
    ) ?? getLocalizedSocraticToneOptions(copy)[0]
  );
}

export function getLocalizedDebateToneOptions(copy: AppCopy) {
  return DEBATE_TONE_OPTIONS.map((option) => ({
    ...option,
    ...(copy.config.debateTones[option.value] ?? {}),
  }));
}

export function getLocalizedDebateToneMeta(tone: DebateTone, copy: AppCopy) {
  return (
    getLocalizedDebateToneOptions(copy).find(
      (option) => option.value === tone,
    ) ?? getLocalizedDebateToneOptions(copy)[0]!
  );
}

export function getLocalizedDebateDurationOptions(copy: AppCopy) {
  return DEBATE_DURATION_OPTIONS.map((option) => ({
    ...option,
    ...(copy.config.debateDurations[option.value] ?? {}),
  }));
}

export function getLocalizedDebateDurationMeta(
  duration: DebateDurationPreset,
  copy: AppCopy,
) {
  return (
    getLocalizedDebateDurationOptions(copy).find(
      (option) => option.value === duration,
    ) ?? getLocalizedDebateDurationOptions(copy)[2]!
  );
}

export function getLocalizedRoleplayFlair(
  flair: RoleplayFlair | "All" | string,
  copy: AppCopy,
) {
  return copy.config.roleplayFlairs[
    flair as keyof typeof copy.config.roleplayFlairs
  ] ?? flair;
}

export function getLocalizedRoleplayPhilosopher<
  T extends RoleplayCharacterProfile,
>(philosopher: T, copy: AppCopy): T {
  const localized =
    copy.config.roleplayPhilosophers[
      philosopher.id as keyof typeof copy.config.roleplayPhilosophers
    ];

  if (!localized) {
    return philosopher;
  }

  return {
    ...philosopher,
    name: copy.philosopherNames[philosopher.id as keyof typeof copy.philosopherNames] ?? philosopher.name,
    expertise: localized.expertise,
    shortDescription: localized.shortDescription,
    bestFor: localized.bestFor,
    starterPrompts: [...localized.starterPrompts],
    voicePreview: localized.voicePreview,
  };
}

export function getLocalizedRoleplayPhilosophers(copy: AppCopy) {
  return ROLEPLAY_PHILOSOPHERS.map((philosopher) =>
    getLocalizedRoleplayPhilosopher(philosopher, copy),
  );
}

export function getLocalizedRoleplayPhilosopherById(
  id: RoleplayPhilosopherId,
  copy: AppCopy,
) {
  const philosopher = ROLEPLAY_PHILOSOPHERS.find((item) => item.id === id);
  return philosopher
    ? getLocalizedRoleplayPhilosopher(philosopher, copy)
    : undefined;
}
