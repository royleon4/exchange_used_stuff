import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

const databaseAvailable = Boolean(process.env.DATABASE_URL);
const describeDatabase = databaseAvailable ? describe.sequential : describe.skip;

type PoolType = typeof import("../server/db.js")["pool"];
type WantService = typeof import("../server/services/wants.service.js");
type PostService = typeof import("../server/services/posts.service.js");

let pool: PoolType;
let wants: WantService;
let postsService: PostService;
let ownerUserId = 0;
let userId = 0;
let postId = 0;

describeDatabase("database-backed post and want integrity", () => {
  beforeAll(async () => {
    ({ pool } = await import("../server/db.js"));
    wants = await import("../server/services/wants.service.js");
    postsService = await import("../server/services/posts.service.js");
  });

  beforeEach(async () => {
    await pool.query(
      "TRUNCATE TABLE image_cleanup_jobs, post_wants, comments, post_images, posts, users RESTART IDENTITY CASCADE",
    );

    const users = await pool.query<{ id: number; username: string }>(
      `INSERT INTO users (username, password_hash, nickname)
       VALUES
         ('want-test-owner', 'test-hash', 'Post Owner'),
         ('want-test-user', 'test-hash', 'Want Tester')
       RETURNING id, username`,
    );
    ownerUserId = users.rows.find((row) => row.username === "want-test-owner")!.id;
    userId = users.rows.find((row) => row.username === "want-test-user")!.id;

    const post = await pool.query<{ id: number }>(
      `INSERT INTO posts (author_id, title, description)
       VALUES ($1, '測試物品標題', '')
       RETURNING id`,
      [ownerUserId],
    );
    postId = post.rows[0]!.id;
  });

  afterAll(async () => {
    if (pool) await pool.end();
  });

  it("keeps one row for concurrent signed-in requests", async () => {
    await Promise.all(
      Array.from({ length: 10 }, () =>
        wants.addPostWant({ postId, userId, anonId: "browser-user" }),
      ),
    );

    const rows = await pool.query<{ count: string }>(
      "SELECT COUNT(*)::text AS count FROM post_wants WHERE post_id = $1",
      [postId],
    );
    expect(Number(rows.rows[0]!.count)).toBe(1);
  });

  it("keeps one row for concurrent anonymous requests", async () => {
    await Promise.all(
      Array.from({ length: 10 }, () =>
        wants.addPostWant({ postId, anonId: "anonymous-browser" }),
      ),
    );

    const rows = await pool.query<{ count: string }>(
      "SELECT COUNT(*)::text AS count FROM post_wants WHERE post_id = $1",
      [postId],
    );
    expect(Number(rows.rows[0]!.count)).toBe(1);
  });

  it("removes both member and browser records when cancelling", async () => {
    await pool.query(
      `INSERT INTO post_wants (user_id, post_id) VALUES ($1, $2)`,
      [userId, postId],
    );
    await pool.query(
      `INSERT INTO post_wants (anon_id, post_id) VALUES ($1, $2)`,
      ["same-browser", postId],
    );

    const result = await wants.removePostWant({
      postId,
      userId,
      anonId: "same-browser",
    });

    expect(result).toEqual({ wanted: false, wantCount: 0 });
  });

  it("claims anonymous wants without duplicating existing wants or claiming the user's own post", async () => {
    const ownPost = await pool.query<{ id: number }>(
      `INSERT INTO posts (author_id, title, description)
       VALUES ($1, '自己的測試物品', '')
       RETURNING id`,
      [userId],
    );
    const ownPostId = ownPost.rows[0]!.id;

    await pool.query(
      `INSERT INTO post_wants (user_id, post_id)
       VALUES ($1, $2), ($1, $3)`,
      [userId, postId, ownPostId],
    );
    await pool.query(
      `INSERT INTO post_wants (anon_id, post_id)
       VALUES ($1, $2), ($1, $3)`,
      ["claim-browser", postId, ownPostId],
    );

    await wants.claimAnonymousWants(userId, "claim-browser");

    const memberRows = await pool.query<{ count: string }>(
      "SELECT COUNT(*)::text AS count FROM post_wants WHERE user_id = $1",
      [userId],
    );
    const anonymousRows = await pool.query<{ count: string }>(
      "SELECT COUNT(*)::text AS count FROM post_wants WHERE anon_id = $1",
      ["claim-browser"],
    );
    const ownPostRows = await pool.query<{ count: string }>(
      "SELECT COUNT(*)::text AS count FROM post_wants WHERE post_id = $1",
      [ownPostId],
    );

    expect(Number(memberRows.rows[0]!.count)).toBe(1);
    expect(Number(anonymousRows.rows[0]!.count)).toBe(0);
    expect(Number(ownPostRows.rows[0]!.count)).toBe(0);
  });

  it("removes an old member want on the user's own post without an anonymous cookie", async () => {
    const ownPost = await pool.query<{ id: number }>(
      `INSERT INTO posts (author_id, title, description)
       VALUES ($1, '舊資料中的自己的物品', '')
       RETURNING id`,
      [userId],
    );
    const ownPostId = ownPost.rows[0]!.id;

    await pool.query(
      "INSERT INTO post_wants (user_id, post_id) VALUES ($1, $2)",
      [userId, ownPostId],
    );

    await wants.claimAnonymousWants(userId);

    const rows = await pool.query<{ count: string }>(
      "SELECT COUNT(*)::text AS count FROM post_wants WHERE post_id = $1",
      [ownPostId],
    );
    expect(Number(rows.rows[0]!.count)).toBe(0);
  });

  it("updates a member's post content and attached images in one transaction", async () => {
    const images = await pool.query<{ id: number; drive_file_id: string }>(
      `INSERT INTO post_images
         (post_id, owner_id, drive_file_id, mime_type, size_bytes, width, height, sort_order)
       VALUES
         ($1, $2, 'existing-cover', 'image/webp', 100, 800, 600, 0),
         ($1, $2, 'existing-remove', 'image/webp', 100, 800, 600, 1),
         (NULL, $2, 'new-upload', 'image/webp', 100, 800, 600, 0)
       RETURNING id, drive_file_id`,
      [postId, ownerUserId],
    );
    const firstImageId = images.rows.find((row) => row.drive_file_id === "existing-cover")!.id;
    const removedImageId = images.rows.find((row) => row.drive_file_id === "existing-remove")!.id;
    const newImageId = images.rows.find((row) => row.drive_file_id === "new-upload")!.id;

    const updated = await postsService.updatePostForActor({
      postId,
      actor: { id: ownerUserId, nickname: "Post Owner", role: "user" },
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

  it("rejects another user's image without changing the post", async () => {
    const images = await pool.query<{ id: number; drive_file_id: string }>(
      `INSERT INTO post_images
         (post_id, owner_id, drive_file_id, mime_type, size_bytes, width, height, sort_order)
       VALUES
         ($1, $2, 'owner-image', 'image/webp', 100, 800, 600, 0),
         (NULL, $3, 'foreign-image', 'image/webp', 100, 800, 600, 0)
       RETURNING id, drive_file_id`,
      [postId, ownerUserId, userId],
    );
    const ownerImageId = images.rows.find((row) => row.drive_file_id === "owner-image")!.id;
    const foreignImageId = images.rows.find((row) => row.drive_file_id === "foreign-image")!.id;

    await expect(
      postsService.updatePostForActor({
        postId,
        actor: { id: ownerUserId, nickname: "Post Owner", role: "user" },
        changes: {
          title: "不應該被儲存的標題",
          imageIds: [ownerImageId, foreignImageId],
        },
      }),
    ).rejects.toMatchObject({ code: "INVALID_IMAGES" });

    const post = await pool.query<{ title: string }>("SELECT title FROM posts WHERE id = $1", [postId]);
    expect(post.rows[0]!.title).toBe("測試物品標題");
  });

  it("does not allow another member to edit the post", async () => {
    await expect(
      postsService.updatePostForActor({
        postId,
        actor: { id: userId, nickname: "Want Tester", role: "user" },
        changes: { title: "其他人修改的標題" },
      }),
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
  });
});
