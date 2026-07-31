import type { ItemStatus } from "../../../shared/types";

export const POST_STATUS_TRANSLATION_KEYS = {
  considering: "statusConsidering",
  bringing: "statusBringing",
  not_bringing: "statusNotBringing",
  closed: "statusClosed",
} as const satisfies Record<ItemStatus, string>;

export type SupportedLocale = "zh-TW" | "en-US";

export function localeForLanguage(language: "zh" | "en"): SupportedLocale {
  return language === "zh" ? "zh-TW" : "en-US";
}

export function formatTaiwanPostTimestamp(value: string): string {
  const parts = new Intl.DateTimeFormat("zh-TW", {
    timeZone: "Asia/Taipei",
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date(value));
  const part = (type: Intl.DateTimeFormatPartTypes) => parts.find((item) => item.type === type)?.value ?? "";
  return `${part("month")}/${part("day")} ${part("hour")}:${part("minute")}`;
}

export function formatTaiwanDate(value: string, locale: SupportedLocale): string {
  return new Intl.DateTimeFormat(locale, {
    timeZone: "Asia/Taipei",
    year: "numeric",
    month: "numeric",
    day: "numeric",
  }).format(new Date(value));
}

export function formatTaiwanDateTime(value: string, locale: SupportedLocale): string {
  return new Intl.DateTimeFormat(locale, {
    timeZone: "Asia/Taipei",
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(new Date(value));
}
