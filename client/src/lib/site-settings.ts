import { useQuery } from "@tanstack/react-query";
import type { PublicSiteSettings } from "../../../shared/types";
import { api } from "./api";

export const fallbackSiteSettings: PublicSiteSettings = {
  siteTitle: "Excel & Min 二手物品需求牆",
  homeTitleStartZh: "讓好物在婚禮這天，",
  homeTitleAccentZh: "遇見下一個喜歡它的人。",
  homeDescriptionZh: "先把你可能帶來的二手物品放上來，看看有沒有賓客感興趣。有人按「我想要」，你就能更安心地決定要不要把它帶到現場。",
  homeTitleStartEn: "Let a well-loved item",
  homeTitleAccentEn: "find its next admirer at our wedding.",
  homeDescriptionEn: "Share an item you may bring and see whether other guests are interested. When someone taps “I want it,” you can decide with more confidence whether to bring it along.",
  homeHeroImageId: null,
  homeHeroImageUrl: null,
  announcement: "",
  announcementEn: "",
  announcementEnabled: false,
  registrationOpen: true,
  defaultCommentsEnabled: true,
  updatedAt: new Date(0).toISOString(),
};

export function useSiteSettings() {
  return useQuery({
    queryKey: ["site-settings"],
    queryFn: () => api<{ settings: PublicSiteSettings }>("/api/site/settings"),
    staleTime: 60_000,
  });
}
