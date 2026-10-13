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
    ) ?? getLocalizedDebateToneOptions(copy)[0]
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
    ) ?? getLocalizedDebateDurationOptions(copy)[2]
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
