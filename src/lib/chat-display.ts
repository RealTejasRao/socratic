export const CHAT_FONT_SIZE_OPTIONS = [
  { value: "SMALL", label: "Small" },
  { value: "MEDIUM", label: "Medium" },
  { value: "LARGE", label: "Large" },
] as const;

export type ChatFontSize = (typeof CHAT_FONT_SIZE_OPTIONS)[number]["value"];

export function isChatFontSize(value: unknown): value is ChatFontSize {
  return CHAT_FONT_SIZE_OPTIONS.some((option) => option.value === value);
}
