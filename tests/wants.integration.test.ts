import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

const databaseAvailable = Boolean(process.env.DATABASE_URL);
const describeDatabase = databaseAvailable ? describe.sequential : describe.skip;

type PoolType = typeof import("../server/db.js")["pool"];
type WantService = typeof import("../server/services/wants.service.js");

let pool: PoolType;
let wants: WantService;
let userId = 0;
let postId = 0;

describeDatabase("post want database integrity", () => {
  beforeAll(async () => {
    ({ pool } = await import("../server/db.js"));
    wants = await import("../server/services/wants.service.js");
  });

  beforeEach(async () => {
    await pool.query("TRUNCATE TABLE post_wants, comments, post_images, posts, users RESTART IDENTITY CASCADE");

    const user = await pool.query<{ id: number }>(
      `INSERT INTO users (username, password_hash, nickname)
       VALUES ('want-test-user', 'test-hash', 'Want Tester')
       RETURNING id`,
    );
    userId = user.rows[0]!.id;

    const post = await pool.query<{ id: number }>(
      `INSERT INTO posts (author_id, title, description)
       VALUES ($1, '測試物品標題', '')
       RETURNING id`,
      [userId],
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

  it("claims anonymous wants without duplicating existing member wants", async () => {
    const secondPost = await pool.query<{ id: number }>(
      `INSERT INTO posts (author_id, title, description)
       VALUES ($1, '第二個測試物品', '')
       RETURNING id`,
      [userId],
    );

    await pool.query(
      "INSERT INTO post_wants (user_id, post_id) VALUES ($1, $2)",
      [userId, postId],
    );
    await pool.query(
      `INSERT INTO post_wants (anon_id, post_id)
       VALUES ($1, $2), ($1, $3)`,
      ["claim-browser", postId, secondPost.rows[0]!.id],
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

    expect(Number(memberRows.rows[0]!.count)).toBe(2);
    expect(Number(anonymousRows.rows[0]!.count)).toBe(0);
  });
});
