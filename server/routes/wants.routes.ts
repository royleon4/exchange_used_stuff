import { Router } from "express";
import { and, eq, isNull } from "drizzle-orm";
import { posts } from "../../shared/schema.js";
import { getOrCreateAnonymousId } from "../anonymous-id.js";
import { optionalAuth } from "../auth.js";
import { db } from "../db.js";
import { AppError } from "../middleware/error-handler.js";
import { addPostWant, removePostWant } from "../services/wants.service.js";

const router = Router();

async function requireVisiblePost(postId: number): Promise<{ authorId: number }> {
  if (!Number.isInteger(postId) || postId <= 0) {
    throw new AppError(400, "INVALID_POST_ID", "貼文編號不正確");
  }

  const [post] = await db
    .select({ authorId: posts.authorId })
    .from(posts)
    .where(
      and(
        eq(posts.id, postId),
        eq(posts.moderationStatus, "visible"),
        isNull(posts.deletedAt),
      ),
    )
    .limit(1);

  if (!post) throw new AppError(404, "POST_NOT_FOUND", "找不到這篇貼文");
  return post;
}

router.post("/:id/want", optionalAuth, async (req, res) => {
  const postId = Number(req.params.id);
  const post = await requireVisiblePost(postId);

  if (req.user?.id === post.authorId) {
    throw new AppError(403, "OWN_POST_WANT_NOT_ALLOWED", "不能對自己發布的物品按「我想要」");
  }

  const result = await addPostWant({
    postId,
    userId: req.user?.id,
    anonId: getOrCreateAnonymousId(req, res),
  });

  res.status(201).json(result);
});

router.delete("/:id/want", optionalAuth, async (req, res) => {
  const postId = Number(req.params.id);
  await requireVisiblePost(postId);

  const result = await removePostWant({
    postId,
    userId: req.user?.id,
    anonId: getOrCreateAnonymousId(req, res),
  });

  res.json(result);
});

export default router;
