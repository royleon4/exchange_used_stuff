import { Router } from "express";
import { eq } from "drizzle-orm";
import { comments, posts, siteSettings, users } from "../../shared/schema.js";
import { requireAdmin } from "../auth.js";
import { db } from "../db.js";
import { AppError } from "../middleware/error-handler.js";

const router = Router();
router.use(requireAdmin);

router.get("/users", async (_req, res) => {
  const rows = await db
    .select({
      id: users.id,
      username: users.username,
      nickname: users.nickname,
      role: users.role,
      isActive: users.isActive,
      createdAt: users.createdAt,
    })
    .from(users)
    .orderBy(users.createdAt);
  res.json({ users: rows });
});

router.patch("/users/:id/status", async (req, res) => {
  const id = Number(req.params.id);
  const isActive = req.body.isActive;
  if (typeof isActive !== "boolean") throw new AppError(400, "VALIDATION_ERROR", "狀態格式不正確");
  const [user] = await db
    .update(users)
    .set({ isActive, updatedAt: new Date() })
    .where(eq(users.id, id))
    .returning({ id: users.id, nickname: users.nickname, isActive: users.isActive });
  if (!user) throw new AppError(404, "USER_NOT_FOUND", "找不到會員");
  res.json({ user });
});

router.patch("/posts/:id/moderation", async (req, res) => {
  const status = req.body.status;
  if (!(["visible", "hidden", "deleted"] as const).includes(status)) {
    throw new AppError(400, "VALIDATION_ERROR", "貼文狀態不正確");
  }
  const [post] = await db
    .update(posts)
    .set({ moderationStatus: status, updatedAt: new Date() })
    .where(eq(posts.id, Number(req.params.id)))
    .returning();
  if (!post) throw new AppError(404, "POST_NOT_FOUND", "找不到貼文");
  res.json({ post });
});

router.patch("/comments/:id/moderation", async (req, res) => {
  const status = req.body.status;
  if (!(["visible", "hidden", "deleted"] as const).includes(status)) {
    throw new AppError(400, "VALIDATION_ERROR", "留言狀態不正確");
  }
  const [comment] = await db
    .update(comments)
    .set({ moderationStatus: status, updatedAt: new Date() })
    .where(eq(comments.id, Number(req.params.id)))
    .returning();
  if (!comment) throw new AppError(404, "COMMENT_NOT_FOUND", "找不到留言");
  res.json({ comment });
});

router.get("/settings", async (_req, res) => {
  const [settings] = await db.select().from(siteSettings).limit(1);
  res.json({ settings });
});

router.patch("/settings", async (req, res) => {
  const [current] = await db.select().from(siteSettings).limit(1);
  const values = {
    siteTitle: typeof req.body.siteTitle === "string" ? req.body.siteTitle.slice(0, 80) : current?.siteTitle,
    announcement: typeof req.body.announcement === "string" ? req.body.announcement.slice(0, 500) : current?.announcement,
    registrationOpen: typeof req.body.registrationOpen === "boolean" ? req.body.registrationOpen : current?.registrationOpen,
    defaultCommentsEnabled:
      typeof req.body.defaultCommentsEnabled === "boolean"
        ? req.body.defaultCommentsEnabled
        : current?.defaultCommentsEnabled,
    updatedAt: new Date(),
  };

  const [settings] = current
    ? await db.update(siteSettings).set(values).where(eq(siteSettings.id, current.id)).returning()
    : await db
        .insert(siteSettings)
        .values({ ...values, siteTitle: values.siteTitle ?? "Excel & Min 二手物品需求牆" })
        .returning();
  res.json({ settings });
});

export default router;
