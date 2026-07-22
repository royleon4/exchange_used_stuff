import { Router } from "express";
import { and, eq } from "drizzle-orm";
import { comments, posts, users } from "../../shared/schema.js";
import { commentSchema } from "../../shared/validation.js";
import { requireAuth } from "../auth.js";
import { db } from "../db.js";
import { AppError } from "../middleware/error-handler.js";

const router = Router();

router.get("/posts/:postId/comments", async (req, res) => {
  const postId = Number(req.params.postId);
  const rows = await db
    .select({
      id: comments.id,
      body: comments.body,
      authorId: comments.authorId,
      authorNickname: users.nickname,
      createdAt: comments.createdAt,
      updatedAt: comments.updatedAt,
    })
    .from(comments)
    .innerJoin(users, eq(users.id, comments.authorId))
    .where(and(eq(comments.postId, postId), eq(comments.moderationStatus, "visible")))
    .orderBy(comments.createdAt);
  res.json({ comments: rows });
});

router.post("/posts/:postId/comments", requireAuth, async (req, res) => {
  const postId = Number(req.params.postId);
  const input = commentSchema.parse(req.body);
  const [post] = await db.select().from(posts).where(eq(posts.id, postId)).limit(1);
  if (!post || post.deletedAt) throw new AppError(404, "POST_NOT_FOUND", "找不到這篇貼文");
  if (!post.commentsEnabled) throw new AppError(409, "COMMENTS_CLOSED", "發文者已關閉新留言");

  const [comment] = await db
    .insert(comments)
    .values({ postId, authorId: req.user!.id, body: input.body })
    .returning();
  res.status(201).json({ comment });
});

router.patch("/comments/:commentId", requireAuth, async (req, res) => {
  const id = Number(req.params.commentId);
  const input = commentSchema.parse(req.body);
  const [comment] = await db.select().from(comments).where(eq(comments.id, id)).limit(1);
  if (!comment || comment.deletedAt) throw new AppError(404, "COMMENT_NOT_FOUND", "找不到留言");
  if (comment.authorId !== req.user!.id && req.user!.role !== "admin") {
    throw new AppError(403, "FORBIDDEN", "只能修改自己的留言");
  }
  const [updated] = await db
    .update(comments)
    .set({ body: input.body, updatedAt: new Date() })
    .where(eq(comments.id, id))
    .returning();
  res.json({ comment: updated });
});

router.delete("/comments/:commentId", requireAuth, async (req, res) => {
  const id = Number(req.params.commentId);
  const [comment] = await db.select().from(comments).where(eq(comments.id, id)).limit(1);
  if (!comment || comment.deletedAt) throw new AppError(404, "COMMENT_NOT_FOUND", "找不到留言");
  const [post] = await db.select({ authorId: posts.authorId }).from(posts).where(eq(posts.id, comment.postId)).limit(1);
  const canDelete = comment.authorId === req.user!.id || post?.authorId === req.user!.id || req.user!.role === "admin";
  if (!canDelete) throw new AppError(403, "FORBIDDEN", "沒有權限刪除這則留言");

  await db
    .update(comments)
    .set({ moderationStatus: "deleted", deletedAt: new Date(), updatedAt: new Date() })
    .where(eq(comments.id, id));
  res.status(204).end();
});

export default router;
