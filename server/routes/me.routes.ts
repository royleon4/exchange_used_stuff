import { Router } from "express";
import { and, eq } from "drizzle-orm";
import { users } from "../../shared/schema.js";
import { nicknameSchema } from "../../shared/validation.js";
import { requireAuth } from "../auth.js";
import { db, pool } from "../db.js";

const router = Router();
router.use(requireAuth);

router.get("/posts", async (req, res) => {
  const result = await pool.query(
    `SELECT p.*, COUNT(DISTINCT pw.user_id)::int AS want_count,
      COUNT(DISTINCT pi.id)::int AS image_count,
      MIN(pi.id) FILTER (WHERE pi.sort_order = 0) AS cover_image_id
     FROM posts p
     LEFT JOIN post_wants pw ON pw.post_id = p.id
     LEFT JOIN post_images pi ON pi.post_id = p.id
     WHERE p.author_id = $1 AND p.deleted_at IS NULL
     GROUP BY p.id
     ORDER BY p.created_at DESC`,
    [req.user!.id],
  );
  res.json({ posts: result.rows });
});

router.get("/wants", async (req, res) => {
  const result = await pool.query(
    `SELECT p.*, u.nickname AS author_nickname,
      COUNT(DISTINCT pw_all.user_id)::int AS want_count,
      COUNT(DISTINCT pi.id)::int AS image_count,
      MIN(pi.id) FILTER (WHERE pi.sort_order = 0) AS cover_image_id
     FROM post_wants mine
     JOIN posts p ON p.id = mine.post_id
     JOIN users u ON u.id = p.author_id
     LEFT JOIN post_wants pw_all ON pw_all.post_id = p.id
     LEFT JOIN post_images pi ON pi.post_id = p.id
     WHERE mine.user_id = $1 AND p.deleted_at IS NULL AND p.moderation_status = 'visible'
     GROUP BY p.id, u.nickname, mine.created_at
     ORDER BY mine.created_at DESC`,
    [req.user!.id],
  );
  res.json({ posts: result.rows });
});

router.patch("/profile", async (req, res) => {
  const nickname = nicknameSchema.parse(req.body.nickname);
  const [user] = await db
    .update(users)
    .set({ nickname, updatedAt: new Date() })
    .where(and(eq(users.id, req.user!.id), eq(users.isActive, true)))
    .returning({ id: users.id, nickname: users.nickname, role: users.role });
  res.json({ user });
});

export default router;
