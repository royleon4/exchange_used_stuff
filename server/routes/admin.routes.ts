import { Router } from "express";
import { and, eq, isNull, ne } from "drizzle-orm";
import { comments, imageCleanupJobs, postImages, posts, siteSettings, users } from "../../shared/schema.js";
import {
  adminPostUpdateSchema,
  adminSiteSettingsSchema,
  adminUserUpdateSchema,
  moderationStatusSchema,
} from "../../shared/validation.js";
import { hashPassword, requireAdmin } from "../auth.js";
import { db, pool } from "../db.js";
import { AppError } from "../middleware/error-handler.js";

const router = Router();
router.use(requireAdmin);

function positiveId(value: string): number {
  const id = Number(value);
  if (!Number.isInteger(id) || id <= 0) throw new AppError(400, "INVALID_ID", "編號格式不正確");
  return id;
}

function serializeSettings(settings: typeof siteSettings.$inferSelect) {
  return {
    ...settings,
    homeHeroImageUrl: settings.homeHeroImageId
      ? `/api/media/${settings.homeHeroImageId}?v=${settings.updatedAt.getTime()}`
      : null,
    updatedAt: settings.updatedAt.toISOString(),
  };
}

async function loadSettings() {
  const [existing] = await db.select().from(siteSettings).limit(1);
  if (existing) return existing;

  const [created] = await db.insert(siteSettings).values({}).returning();
  if (!created) throw new AppError(500, "SETTINGS_CREATE_FAILED", "無法建立站台設定");
  return created;
}

router.get("/users", async (_req, res) => {
  const result = await pool.query<{
    id: number;
    username: string;
    nickname: string;
    role: "user" | "admin";
    is_active: boolean;
    created_at: Date;
    post_count: string;
    comment_count: string;
    want_count: string;
  }>(
    `SELECT
      u.id,
      u.username,
      u.nickname,
      u.role,
      u.is_active,
      u.created_at,
      COUNT(DISTINCT p.id)::text AS post_count,
      COUNT(DISTINCT c.id)::text AS comment_count,
      COUNT(DISTINCT pw.id)::text AS want_count
     FROM users u
     LEFT JOIN posts p ON p.author_id = u.id AND p.deleted_at IS NULL
     LEFT JOIN comments c ON c.author_id = u.id AND c.deleted_at IS NULL
     LEFT JOIN post_wants pw ON pw.user_id = u.id
     GROUP BY u.id
     ORDER BY u.created_at DESC`,
  );

  res.json({
    users: result.rows.map((row) => ({
      id: row.id,
      username: row.username,
      nickname: row.nickname,
      role: row.role,
      isActive: row.is_active,
      createdAt: row.created_at.toISOString(),
      postCount: Number(row.post_count),
      commentCount: Number(row.comment_count),
      wantCount: Number(row.want_count),
    })),
  });
});

router.patch("/users/:id", async (req, res) => {
  const id = positiveId(req.params.id);
  const input = adminUserUpdateSchema.parse(req.body);
  const [target] = await db.select().from(users).where(eq(users.id, id)).limit(1);
  if (!target) throw new AppError(404, "USER_NOT_FOUND", "找不到會員");

  const wouldRemoveAdmin = target.role === "admin" && (input.role === "user" || input.isActive === false);
  if (wouldRemoveAdmin) {
    const [otherAdmin] = await db
      .select({ id: users.id })
      .from(users)
      .where(and(eq(users.role, "admin"), eq(users.isActive, true), ne(users.id, id)))
      .limit(1);
    if (!otherAdmin) throw new AppError(400, "LAST_ADMIN", "至少需要保留一位有效管理員");
  }

  if (id === req.user!.id && (input.role === "user" || input.isActive === false)) {
    throw new AppError(400, "CANNOT_LOCK_SELF", "不能停用或移除自己的管理員權限");
  }

  const changes: {
    nickname?: string;
    role?: "user" | "admin";
    isActive?: boolean;
    passwordHash?: string;
    updatedAt: Date;
  } = { updatedAt: new Date() };
  if (input.nickname !== undefined) changes.nickname = input.nickname;
  if (input.role !== undefined) changes.role = input.role;
  if (input.isActive !== undefined) changes.isActive = input.isActive;
  if (input.newPassword !== undefined) changes.passwordHash = await hashPassword(input.newPassword);

  const [user] = await db
    .update(users)
    .set(changes)
    .where(eq(users.id, id))
    .returning({
      id: users.id,
      username: users.username,
      nickname: users.nickname,
      role: users.role,
      isActive: users.isActive,
      createdAt: users.createdAt,
    });

  res.json({ user });
});

router.get("/posts", async (_req, res) => {
  const result = await pool.query<{
    id: number;
    author_id: number;
    author_nickname: string;
    title: string;
    description: string;
    item_status: "considering" | "bringing" | "not_bringing" | "closed";
    comments_enabled: boolean;
    moderation_status: "visible" | "hidden" | "deleted";
    cover_image_id: number | null;
    want_count: string;
    comment_count: string;
    created_at: Date;
    updated_at: Date;
    deleted_at: Date | null;
  }>(
    `SELECT
      p.id,
      p.author_id,
      u.nickname AS author_nickname,
      p.title,
      p.description,
      p.item_status,
      p.comments_enabled,
      p.moderation_status,
      MIN(pi.id) FILTER (WHERE pi.sort_order = 0) AS cover_image_id,
      COUNT(DISTINCT pw.id)::text AS want_count,
      COUNT(DISTINCT c.id)::text AS comment_count,
      p.created_at,
      p.updated_at,
      p.deleted_at
     FROM posts p
     JOIN users u ON u.id = p.author_id
     LEFT JOIN post_images pi ON pi.post_id = p.id
     LEFT JOIN post_wants pw ON pw.post_id = p.id
     LEFT JOIN comments c ON c.post_id = p.id
     GROUP BY p.id, u.nickname
     ORDER BY p.created_at DESC`,
  );

  res.json({
    posts: result.rows.map((row) => ({
      id: row.id,
      authorId: row.author_id,
      authorNickname: row.author_nickname,
      title: row.title,
      description: row.description,
      itemStatus: row.item_status,
      commentsEnabled: row.comments_enabled,
      moderationStatus: row.moderation_status,
      coverImageId: row.cover_image_id,
      wantCount: Number(row.want_count),
      commentCount: Number(row.comment_count),
      createdAt: row.created_at.toISOString(),
      updatedAt: row.updated_at.toISOString(),
      deletedAt: row.deleted_at?.toISOString() ?? null,
    })),
  });
});

router.patch("/posts/:id", async (req, res) => {
  const id = positiveId(req.params.id);
  const input = adminPostUpdateSchema.parse(req.body);

  if (input.moderationStatus === "deleted") {
    const deleted = await db.transaction(async (tx) => {
      const [target] = await tx.select({ id: posts.id }).from(posts).where(eq(posts.id, id)).limit(1);
      if (!target) return null;

      const images = await tx
        .select({ driveFileId: postImages.driveFileId })
        .from(postImages)
        .where(eq(postImages.postId, id));

      if (images.length > 0) {
        await tx.insert(imageCleanupJobs).values(
          images.map((image) => ({
            driveFileId: image.driveFileId,
            reason: `admin_deleted_post:${id}`,
          })),
        );
      }

      const [removed] = await tx.delete(posts).where(eq(posts.id, id)).returning({ id: posts.id });
      return removed ?? null;
    });

    if (!deleted) throw new AppError(404, "POST_NOT_FOUND", "找不到貼文");
    res.json({ deleted: true, id: deleted.id });
    return;
  }

  const changes: {
    title?: string;
    description?: string;
    itemStatus?: "considering" | "bringing" | "not_bringing" | "closed";
    commentsEnabled?: boolean;
    moderationStatus?: "visible" | "hidden";
    deletedAt?: null;
    updatedAt: Date;
  } = { updatedAt: new Date() };

  if (input.title !== undefined) changes.title = input.title;
  if (input.description !== undefined) changes.description = input.description;
  if (input.itemStatus !== undefined) changes.itemStatus = input.itemStatus;
  if (input.commentsEnabled !== undefined) changes.commentsEnabled = input.commentsEnabled;
  if (input.moderationStatus !== undefined) {
    changes.moderationStatus = input.moderationStatus;
    changes.deletedAt = null;
  }

  const [post] = await db.update(posts).set(changes).where(eq(posts.id, id)).returning();
  if (!post) throw new AppError(404, "POST_NOT_FOUND", "找不到貼文");
  res.json({ post });
});

router.get("/comments", async (_req, res) => {
  const result = await pool.query<{
    id: number;
    post_id: number;
    post_title: string;
    author_nickname: string;
    body: string;
    moderation_status: "visible" | "hidden" | "deleted";
    created_at: Date;
  }>(
    `SELECT
      c.id,
      c.post_id,
      p.title AS post_title,
      u.nickname AS author_nickname,
      c.body,
      c.moderation_status,
      c.created_at
     FROM comments c
     JOIN posts p ON p.id = c.post_id
     JOIN users u ON u.id = c.author_id
     ORDER BY c.created_at DESC
     LIMIT 300`,
  );
  res.json({
    comments: result.rows.map((row) => ({
      id: row.id,
      postId: row.post_id,
      postTitle: row.post_title,
      authorNickname: row.author_nickname,
      body: row.body,
      moderationStatus: row.moderation_status,
      createdAt: row.created_at.toISOString(),
    })),
  });
});

router.patch("/comments/:id/moderation", async (req, res) => {
  const id = positiveId(req.params.id);
  const status = moderationStatusSchema.parse(req.body.status);
  const [comment] = await db
    .update(comments)
    .set({
      moderationStatus: status,
      deletedAt: status === "deleted" ? new Date() : null,
      updatedAt: new Date(),
    })
    .where(eq(comments.id, id))
    .returning();
  if (!comment) throw new AppError(404, "COMMENT_NOT_FOUND", "找不到留言");
  res.json({ comment });
});

router.get("/settings", async (_req, res) => {
  const settings = await loadSettings();
  res.json({ settings: serializeSettings(settings) });
});

router.patch("/settings", async (req, res) => {
  const input = adminSiteSettingsSchema.parse(req.body);
  const current = await loadSettings();

  const heroImageChanged =
    input.homeHeroImageId !== undefined && input.homeHeroImageId !== current.homeHeroImageId;

  if (heroImageChanged && typeof input.homeHeroImageId === "number") {
    const [candidate] = await db
      .select({ id: postImages.id })
      .from(postImages)
      .where(
        and(
          eq(postImages.id, input.homeHeroImageId),
          eq(postImages.ownerId, req.user!.id),
          isNull(postImages.postId),
        ),
      )
      .limit(1);
    if (!candidate) {
      throw new AppError(400, "INVALID_HOME_IMAGE", "找不到可使用的首頁圖片");
    }
  }

  const previousHeroImageId = current.homeHeroImageId;
  const [settings] = await db
    .update(siteSettings)
    .set({ ...input, updatedAt: new Date() })
    .where(eq(siteSettings.id, current.id))
    .returning();
  if (!settings) throw new AppError(500, "SETTINGS_UPDATE_FAILED", "無法更新站台設定");

  if (heroImageChanged && previousHeroImageId) {
    const [previousImage] = await db
      .select({ driveFileId: postImages.driveFileId })
      .from(postImages)
      .where(eq(postImages.id, previousHeroImageId))
      .limit(1);

    if (previousImage) {
      await db.insert(imageCleanupJobs).values({
        driveFileId: previousImage.driveFileId,
        reason: typeof input.homeHeroImageId === "number" ? "homepage_hero_replaced" : "homepage_hero_removed",
      });
      await db.delete(postImages).where(eq(postImages.id, previousHeroImageId));
    }
  }

  res.json({ settings: serializeSettings(settings) });
});

export default router;
