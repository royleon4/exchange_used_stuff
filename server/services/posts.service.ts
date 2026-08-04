import { and, eq, inArray, isNull, or } from "drizzle-orm";
import type { ItemStatus, PublicUser } from "../../shared/types.js";
import { imageCleanupJobs, postImages, posts } from "../../shared/schema.js";
import { db } from "../db.js";
import { AppError } from "../middleware/error-handler.js";

export type PostUpdateInput = {
  title?: string;
  description?: string;
  commentsEnabled?: boolean;
  itemStatus?: ItemStatus;
  imageIds?: number[];
};

export async function updatePostForActor(input: {
  postId: number;
  actor: PublicUser;
  changes: PostUpdateInput;
}) {
  return db.transaction(async (tx) => {
    const [existing] = await tx
      .select()
      .from(posts)
      .where(eq(posts.id, input.postId))
      .limit(1);

    if (!existing || existing.deletedAt) {
      throw new AppError(404, "POST_NOT_FOUND", "找不到這篇貼文");
    }
    if (existing.authorId !== input.actor.id && input.actor.role !== "admin") {
      throw new AppError(403, "FORBIDDEN", "只能修改自己的貼文");
    }

    if (input.changes.imageIds !== undefined) {
      const imageIds = input.changes.imageIds;
      const selectedImages = await tx
        .select({
          id: postImages.id,
          ownerId: postImages.ownerId,
          postId: postImages.postId,
        })
        .from(postImages)
        .where(inArray(postImages.id, imageIds));

      const validImages = selectedImages.length === imageIds.length
        && selectedImages.every((image) =>
          image.ownerId === existing.authorId
          && (image.postId === null || image.postId === existing.id));

      if (!validImages) {
        throw new AppError(400, "INVALID_IMAGES", "部分圖片不存在、已被使用，或不屬於發文者");
      }

      const currentImages = await tx
        .select({ id: postImages.id, driveFileId: postImages.driveFileId })
        .from(postImages)
        .where(eq(postImages.postId, existing.id));
      const selectedImageIds = new Set(imageIds);
      const removedImages = currentImages.filter((image) => !selectedImageIds.has(image.id));

      if (removedImages.length > 0) {
        await tx.insert(imageCleanupJobs).values(
          removedImages.map((image) => ({
            driveFileId: image.driveFileId,
            reason: `owner_edited_post:${existing.id}`,
          })),
        );
        await tx
          .delete(postImages)
          .where(inArray(postImages.id, removedImages.map((image) => image.id)));
      }

      for (const [sortOrder, imageId] of imageIds.entries()) {
        await tx
          .update(postImages)
          .set({ postId: existing.id, sortOrder })
          .where(
            and(
              eq(postImages.id, imageId),
              eq(postImages.ownerId, existing.authorId),
              or(isNull(postImages.postId), eq(postImages.postId, existing.id)),
            ),
          );
      }
    }

    const { imageIds: _imageIds, ...editableChanges } = input.changes;
    const [updated] = await tx
      .update(posts)
      .set({ ...editableChanges, updatedAt: new Date() })
      .where(eq(posts.id, existing.id))
      .returning();

    if (!updated) throw new AppError(404, "POST_NOT_FOUND", "找不到這篇貼文");
    return updated;
  });
}
