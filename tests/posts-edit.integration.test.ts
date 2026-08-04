import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

const databaseAvailable = Boolean(process.env.DATABASE_URL);
const describeDatabase = databaseAvailable ? describe.sequential : describe.skip;

type PoolType = typeof import("../server/db.js")["pool"];
type PostService = typeof import("../server/services/posts.service.js");

let pool: PoolType;
let postsService: PostService;
let ownerId = 0;
let otherUserId = 0;
let postId = 0;
let firstImageId = 0;
let removedImageId = 0;
let newImageId = 0;
let foreignImageId = 0;

describeDatabase("member post editing", () => {
  beforeAll(async () => {
    ({ pool } = await import("../server/db.js"));
    postsService = await import("../server/services/posts.service.js");
  });

  beforeEach(async () => {
    await pool.query(
      "TRUNCATE TABLE image_cleanup_jobs, post_wants, comments, post_images, posts, users RESTART IDENTITY CASCADE",
    );

    const users = await pool.query<{ id: number; username: string }>(
      `INSERT INTO users (username, password_hash, nickname)
       VALUES
         ('post-edit-owner', 'test-hash', 'Post Owner'),
         ('post-edit-other', 'test-hash', 'Other User')
       RETURNING id, username`,
    );
    ownerId = users.rows.find((row) => row.username === "post-edit-owner")!.id;
    otherUserId = users.rows.find((row) => row.username === "post-edit-other")!.id;

    const post = await pool.query<{ id: number }>(
      `INSERT INTO posts (author_id, title, description, comments_enabled, item_status)
       VALUES ($1, '原本的物品標題', '原本的描述', true, 'considering')
       RETURNING id`,
      [ownerId],
    );
    postId = post.rows[0]!.id;

    const images = await pool.query<{ id: number; drive_file_id: string }>(
      `INSERT INTO post_images
         (post_id, owner_id, drive_file_id, mime_type, size_bytes, width, height, sort_order)
       VALUES
         ($1, $2, 'existing-cover', 'image/webp', 100, 800, 600, 0),
         ($1, $2, 'existing-remove', 'image/webp', 100, 800, 600, 1),
         (NULL, $2, 'new-upload', 'image/webp', 100, 800, 600, 0),
         (NULL, $3, 'foreign-upload', 'image/webp', 100, 800, 600, 0)
       RETURNING id, drive_file_id`,
      [postId, ownerId, otherUserId],
    );
    firstImageId = images.rows.find((row) => row.drive_file_id === "existing-cover")!.id;
    removedImageId = images.rows.find((row) => row.drive_file_id === "existing-remove")!.id;
    newImageId = images.rows.find((row) => row.drive_file_id === "new-upload")!.id;
    foreignImageId = images.rows.find((row) => row.drive_file_id === "foreign-upload")!.id;
  });

  afterAll(async () => {
    if (pool) await pool.end();
  });

  it("updates content and replaces the attached image set in one transaction", async () => {
    const updated = await postsService.updatePostForActor({
      postId,
      actor: { id: ownerId, nickname: "Post Owner", role: "user" },
      changes: {
        title: "更新後的物品標題",
        description: "更新後的描述",
        commentsEnabled: false,
        itemStatus: "bringing",
        imageIds: [newImageId, firstImageId],
      },
    });

    expect(updated).toMatchObject({
      id: postId,
      title: "更新後的物品標題",
      description: "更新後的描述",
      commentsEnabled: false,
      itemStatus: "bringing",
    });

    const attachedImages = await pool.query<{ id: number; post_id: number | null; sort_order: number }>(
      `SELECT id, post_id, sort_order
       FROM post_images
       WHERE post_id = $1
       ORDER BY sort_order`,
      [postId],
    );
    expect(attachedImages.rows).toEqual([
      { id: newImageId, post_id: postId, sort_order: 0 },
      { id: firstImageId, post_id: postId, sort_order: 1 },
    ]);

    const removedImage = await pool.query<{ count: string }>(
      "SELECT COUNT(*)::text AS count FROM post_images WHERE id = $1",
      [removedImageId],
    );
    expect(Number(removedImage.rows[0]!.count)).toBe(0);

    const cleanup = await pool.query<{ drive_file_id: string; reason: string }>(
      "SELECT drive_file_id, reason FROM image_cleanup_jobs",
    );
    expect(cleanup.rows).toEqual([
      { drive_file_id: "existing-remove", reason: `owner_edited_post:${postId}` },
    ]);
  });

  it("rejects an image that belongs to another user without changing the post", async () => {
    await expect(
      postsService.updatePostForActor({
        postId,
        actor: { id: ownerId, nickname: "Post Owner", role: "user" },
        changes: {
          title: "不應該被儲存的標題",
          imageIds: [firstImageId, foreignImageId],
        },
      }),
    ).rejects.toMatchObject({ code: "INVALID_IMAGES" });

    const post = await pool.query<{ title: string }>("SELECT title FROM posts WHERE id = $1", [postId]);
    expect(post.rows[0]!.title).toBe("原本的物品標題");

    const attachedImages = await pool.query<{ id: number }>(
      "SELECT id FROM post_images WHERE post_id = $1 ORDER BY sort_order",
      [postId],
    );
    expect(attachedImages.rows.map((image) => image.id)).toEqual([firstImageId, removedImageId]);
  });

  it("does not allow another member to edit the post", async () => {
    await expect(
      postsService.updatePostForActor({
        postId,
        actor: { id: otherUserId, nickname: "Other User", role: "user" },
        changes: { title: "其他人修改的標題" },
      }),
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
  });
});
