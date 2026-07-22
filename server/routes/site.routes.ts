import { Router } from "express";
import { siteSettings } from "../../shared/schema.js";
import { db } from "../db.js";

const router = Router();

router.get("/settings", async (_req, res) => {
  let [settings] = await db.select().from(siteSettings).limit(1);
  if (!settings) [settings] = await db.insert(siteSettings).values({}).returning();

  res.json({
    settings: {
      siteTitle: settings.siteTitle,
      homeTitleStartZh: settings.homeTitleStartZh,
      homeTitleAccentZh: settings.homeTitleAccentZh,
      homeDescriptionZh: settings.homeDescriptionZh,
      homeTitleStartEn: settings.homeTitleStartEn,
      homeTitleAccentEn: settings.homeTitleAccentEn,
      homeDescriptionEn: settings.homeDescriptionEn,
      announcement: settings.announcement,
      announcementEn: settings.announcementEn,
      announcementEnabled: settings.announcementEnabled,
      registrationOpen: settings.registrationOpen,
      defaultCommentsEnabled: settings.defaultCommentsEnabled,
      updatedAt: settings.updatedAt.toISOString(),
    },
  });
});

export default router;
