import { describe, expect, it } from "vitest";
import {
  formatTaiwanPostTimestamp,
  localeForLanguage,
  POST_STATUS_TRANSLATION_KEYS,
} from "../client/src/lib/post-presentation.js";

describe("post presentation helpers", () => {
  it("formats an ISO timestamp in Taiwan time", () => {
    expect(formatTaiwanPostTimestamp("2026-07-31T14:05:00.000Z")).toBe("7/31 22:05");
  });

  it("handles a Taiwan date rollover", () => {
    expect(formatTaiwanPostTimestamp("2026-01-01T16:05:00.000Z")).toBe("1/2 00:05");
  });

  it("keeps language locales and item status labels explicit", () => {
    expect(localeForLanguage("zh")).toBe("zh-TW");
    expect(localeForLanguage("en")).toBe("en-US");
    expect(Object.keys(POST_STATUS_TRANSLATION_KEYS)).toEqual([
      "considering",
      "bringing",
      "not_bringing",
      "closed",
    ]);
  });
});
