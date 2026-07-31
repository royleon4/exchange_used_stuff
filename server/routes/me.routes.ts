import { Router } from "express";
import rateLimit from "express-rate-limit";
import { and, eq } from "drizzle-orm";
import { users } from "../../shared/schema.js";
import { changePasswordSchema, profileUpdateSchema } from "../../shared/validation.js";
import { hashPassword, requireAuth, setSessionCookie, verifyPassword } from "../auth.js";
import { db, pool } from "../db.js";
import { AppError } from "../middleware/error-handler.js";
import { serializePostCard, type PostCardRow } from "../post-card.js";

const router = Router();
router.use(requireAuth);

const passwordLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
});

router.get("/posts", async (req, res) => {
  const result = await pool.query<PostCardRow>(
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
      false AS current_user_wants,
      p.created_at,
      p.updated_at
     FROM posts p
     JOIN users u ON u.id = p.author_id
     LEFT JOIN post_wants pw ON pw.post_id = p.id
     LEFT JOIN post_images pi ON pi.post_id = p.id
     LEFT JOIN comments c ON c.post_id = p.id
     WHERE p.author_id = $1 AND p.deleted_at IS NULL
     GROUP BY p.id, u.nickname
     ORDER BY p.created_at DESC`,
    [req.user!.id],
  );
  res.json({ posts: result.rows.map(serializePostCard) });
});

router.get("/wants", async (req, res) => {
  const result = await pool.query<PostCardRow>(
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
      COUNT(DISTINCT pw_all.id)::text AS want_count,
      COUNT(DISTINCT c.id) FILTER (WHERE c.moderation_status = 'visible')::text AS comment_count,
      true AS current_user_wants,
      p.created_at,
      p.updated_at
     FROM posts p
     JOIN users u ON u.id = p.author_id
     LEFT JOIN post_wants pw_all ON pw_all.post_id = p.id
     LEFT JOIN post_images pi ON pi.post_id = p.id
     LEFT JOIN comments c ON c.post_id = p.id
     WHERE EXISTS (
       SELECT 1 FROM post_wants mine
       WHERE mine.post_id = p.id AND mine.user_id = $1
     )
       AND p.deleted_at IS NULL
       AND p.moderation_status = 'visible'
     GROUP BY p.id, u.nickname
     ORDER BY (
       SELECT MAX(mine.created_at) FROM post_wants mine
       WHERE mine.post_id = p.id AND mine.user_id = $1
     ) DESC`,
    [req.user!.id],
  );
  res.json({ posts: result.rows.map(serializePostCard) });
});

router.patch("/profile", async (req, res) => {
  const input = profileUpdateSchema.parse(req.body);
  const [user] = await db
    .update(users)
    .set({ nickname: input.nickname, updatedAt: new Date() })
    .where(and(eq(users.id, req.user!.id), eq(users.isActive, true)))
    .returning({ id: users.id, nickname: users.nickname, role: users.role });

  if (!user) throw new AppError(403, "ACCOUNT_DISABLED", "這個帳號目前無法使用");
  setSessionCookie(res, user);
  res.json({ user });
});

router.patch("/password", passwordLimiter, async (req, res) => {
  const input = changePasswordSchema.parse(req.body);
  const [user] = await db
    .select({
      id: users.id,
      passwordHash: users.passwordHash,
      isActive: users.isActive,
    })
    .from(users)
    .where(eq(users.id, req.user!.id))
    .limit(1);

  if (!user || !user.isActive) {
    throw new AppError(403, "ACCOUNT_DISABLED", "這個帳號目前無法使用");
  }
  if (!(await verifyPassword(input.currentPassword, user.passwordHash))) {
    throw new AppError(400, "CURRENT_PASSWORD_INCORRECT", "目前密碼不正確");
  }

  await db
    .update(users)
    .set({ passwordHash: await hashPassword(input.newPassword), updatedAt: new Date() })
    .where(eq(users.id, user.id));

  res.status(204).end();
});

export default router;
