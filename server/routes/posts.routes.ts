import { randomUUID } from "node:crypto";
import { Router } from "express";
import { and, eq, inArray, isNull } from "drizzle-orm";
import { postImages, posts, postWants } from "../../shared/schema.js";
import { createPostSchema, updatePostSchema } from "../../shared/validation.js";
import { optionalAuth, requireAuth } from "../auth.js";
import { db, pool } from "../db.js";
import { AppError } from "../middleware/error-handler.js";

const ANON_COOKIE = "anon_id";
const isProduction = process.env.NODE_ENV === "production";

function getOrCreateAnonId(req: import("express").Request, res: import("express").Response): string {
  const existing = req.cookies?.[ANON_COOKIE] as string | undefined;
  if (existing) return existing;
  const id = randomUUID();
  res.cookie(ANON_COOKIE, id, {
    httpOnly: true,
    sameSite: "lax",
    secure: isProduction,
    maxAge: 365 * 24 * 60 * 60 * 1000,
    path: "/",
  });
  return id;
}

const router = Router();

type PostRow = {
  id: number;
  author_id: number;
  title: string;
  description: string;
  author_nickname: string;
  item_status: "considering" | "bringing" | "not_bringing" | "closed";
  comments_enabled: boolean;
  image_count: string;
  image_ids: number[];
  cover_image_id: number | null;
  want_count: string;
  comment_count: string;
  current_user_wants: boolean;
  created_at: Date;
  updated_at: Date;
};

function serializePost(row: PostRow) {
  return {
    id: row.id,
    authorId: row.author_id,
    title: row.title,
    description: row.description,
    authorNickname: row.author_nickname,
    itemStatus: row.item_status,
    commentsEnabled: row.comments_enabled,
    imageCount: Number(row.image_count),
    imageIds: row.image_ids ?? [],
    coverImageId: row.cover_image_id,
    wantCount: Number(row.want_count),
    commentCount: Number(row.comment_count),
    currentUserWants: row.current_user_wants,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
  };
}

router.get("/", optionalAuth, async (req, res) => {
  const sort = String(req.query.sort ?? "latest");
  const page = Math.max(1, Number(req.query.page) || 1);
  const pageSize = Math.min(30, Math.max(1, Number(req.query.pageSize) || 12));
  const offset = (page - 1) * pageSize;
  const orderBy =
    sort === "oldest"
      ? "p.created_at ASC"
      : sort === "wanted"
        ? "want_count DESC, p.created_at DESC"
        : "p.created_at DESC";

  const userId = req.user?.id ?? null;
  const anonId = getOrCreateAnonId(req, res);
  const result = await pool.query<PostRow>(
    `SELECT
      p.id,
      p.author_id,
      p.title,
      p.description,
      u.nickname AS author_nickname,
      p.item_status,
      p.comments_enabled,
      COUNT(DISTINCT pi.id)::text AS image_count,
      COALESCE(
        (SELECT ARRAY_AGG(pi2.id ORDER BY pi2.sort_order, pi2.id)
         FROM post_images pi2
         WHERE pi2.post_id = p.id),
        ARRAY[]::integer[]
      ) AS image_ids,
      MIN(pi.id) FILTER (WHERE pi.sort_order = 0) AS cover_image_id,
      COUNT(DISTINCT pw.id)::text AS want_count,
      COUNT(DISTINCT c.id) FILTER (WHERE c.moderation_status = 'visible')::text AS comment_count,
      COALESCE(BOOL_OR(pw.user_id = $1 OR pw.anon_id = $2), false) AS current_user_wants,
      p.created_at,
      p.updated_at
    FROM posts p
    JOIN users u ON u.id = p.author_id
    LEFT JOIN post_images pi ON pi.post_id = p.id
    LEFT JOIN post_wants pw ON pw.post_id = p.id
    LEFT JOIN comments c ON c.post_id = p.id
    WHERE p.moderation_status = 'visible' AND p.deleted_at IS NULL
    GROUP BY p.id, u.nickname
    ORDER BY ${orderBy}
    LIMIT $3 OFFSET $4`,
    [userId, anonId, pageSize, offset],
  );

  const countResult = await pool.query<{ count: string }>(
    "SELECT COUNT(*)::text AS count FROM posts WHERE moderation_status = 'visible' AND deleted_at IS NULL",
  );

  res.json({
    posts: result.rows.map(serializePost),
    pagination: {
      page,
      pageSize,
      total: Number(countResult.rows[0]?.count ?? 0),
    },
  });
});

router.get("/:id", optionalAuth, async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) throw new AppError(400, "INVALID_POST_ID", "貼文編號不正確");

  const anonId = getOrCreateAnonId(req, res);
  const result = await pool.query<PostRow>(
    `SELECT
      p.id,
      p.author_id,
      p.title,
      p.description,
      u.nickname AS author_nickname,
      p.item_status,
      p.comments_enabled,
      COUNT(DISTINCT pi.id)::text AS image_count,
      COALESCE(
        (SELECT ARRAY_AGG(pi2.id ORDER BY pi2.sort_order, pi2.id)
         FROM post_images pi2
         WHERE pi2.post_id = p.id),
        ARRAY[]::integer[]
      ) AS image_ids,
      MIN(pi.id) FILTER (WHERE pi.sort_order = 0) AS cover_image_id,
      COUNT(DISTINCT pw.id)::text AS want_count,
      COUNT(DISTINCT c.id) FILTER (WHERE c.moderation_status = 'visible')::text AS comment_count,
      COALESCE(BOOL_OR(pw.user_id = $2 OR pw.anon_id = $3), false) AS current_user_wants,
      p.created_at,
      p.updated_at
    FROM posts p
    JOIN users u ON u.id = p.author_id
    LEFT JOIN post_images pi ON pi.post_id = p.id
    LEFT JOIN post_wants pw ON pw.post_id = p.id
    LEFT JOIN comments c ON c.post_id = p.id
    WHERE p.id = $1 AND p.moderation_status = 'visible' AND p.deleted_at IS NULL
    GROUP BY p.id, u.nickname`,
    [id, req.user?.id ?? null, anonId],
  );
  const row = result.rows[0];
  if (!row) throw new AppError(404, "POST_NOT_FOUND", "找不到這篇貼文");

  const images = await db
    .select({
      id: postImages.id,
      width: postImages.width,
      height: postImages.height,
      sortOrder: postImages.sortOrder,
    })
    .from(postImages)
    .where(eq(postImages.postId, id))
    .orderBy(postImages.sortOrder);

  res.json({
    post: {
      ...serializePost(row),
      isOwner: req.user?.id === row.author_id,
      images: images.map((image) => ({ ...image, url: `/api/media/${image.id}` })),
    },
  });
});

router.post("/", requireAuth, async (req, res) => {
  const input = createPostSchema.parse(req.body);

  const post = await db.transaction(async (tx) => {
    const ownedImages = await tx
      .select({ id: postImages.id })
      .from(postImages)
      .where(
        and(
          eq(postImages.ownerId, req.user!.id),
          isNull(postImages.postId),
          inArray(postImages.id, input.imageIds),
        ),
      );
    if (ownedImages.length !== input.imageIds.length) {
      throw new AppError(400, "INVALID_IMAGES", "部分圖片不存在、已被使用，或不屬於你");
    }

    const [created] = await tx
      .insert(posts)
      .values({
        authorId: req.user!.id,
        title: input.title,
        description: input.description,
        commentsEnabled: input.commentsEnabled,
        itemStatus: input.itemStatus,
      })
      .returning();

    for (const [sortOrder, imageId] of input.imageIds.entries()) {
      await tx
        .update(postImages)
        .set({ postId: created.id, sortOrder })
        .where(and(eq(postImages.id, imageId), eq(postImages.ownerId, req.user!.id)));
    }

    return created;
  });

  res.status(201).json({ post });
});

router.patch("/:id", requireAuth, async (req, res) => {
  const id = Number(req.params.id);
  const input = updatePostSchema.parse(req.body);
  const [existing] = await db.select().from(posts).where(eq(posts.id, id)).limit(1);
  if (!existing || existing.deletedAt) throw new AppError(404, "POST_NOT_FOUND", "找不到這篇貼文");
  if (existing.authorId !== req.user!.id && req.user!.role !== "admin") {
    throw new AppError(403, "FORBIDDEN", "只能修改自己的貼文");
  }

  const { imageIds: _imageIds, ...changes } = input;
  const [updated] = await db
    .update(posts)
    .set({ ...changes, updatedAt: new Date() })
    .where(eq(posts.id, id))
    .returning();
  res.json({ post: updated });
});

router.delete("/:id", requireAuth, async (req, res) => {
  const id = Number(req.params.id);
  const [existing] = await db.select().from(posts).where(eq(posts.id, id)).limit(1);
  if (!existing || existing.deletedAt) throw new AppError(404, "POST_NOT_FOUND", "找不到這篇貼文");
  if (existing.authorId !== req.user!.id && req.user!.role !== "admin") {
    throw new AppError(403, "FORBIDDEN", "只能刪除自己的貼文");
  }

  await db
    .update(posts)
    .set({ moderationStatus: "deleted", deletedAt: new Date(), updatedAt: new Date() })
    .where(eq(posts.id, id));
  res.status(204).end();
});

router.post("/:id/want", optionalAuth, async (req, res) => {
  const postId = Number(req.params.id);
  const [post] = await db.select({ id: posts.id }).from(posts).where(eq(posts.id, postId)).limit(1);
  if (!post) throw new AppError(404, "POST_NOT_FOUND", "找不到這篇貼文");

  const anonId = getOrCreateAnonId(req, res);
  if (req.user) {
    await db.insert(postWants).values({ userId: req.user.id, postId }).onConflictDoNothing();
  } else {
    await pool.query(
      "INSERT INTO post_wants (anon_id, post_id) VALUES ($1, $2) ON CONFLICT DO NOTHING",
      [anonId, postId],
    );
  }
  res.status(201).json({ wanted: true });
});

router.delete("/:id/want", optionalAuth, async (req, res) => {
  const postId = Number(req.params.id);
  const anonId = getOrCreateAnonId(req, res);
  if (req.user) {
    await db.delete(postWants).where(and(eq(postWants.userId, req.user.id), eq(postWants.postId, postId)));
  } else {
    await pool.query(
      "DELETE FROM post_wants WHERE anon_id = $1 AND post_id = $2",
      [anonId, postId],
    );
  }
  res.status(204).end();
});

export default router;