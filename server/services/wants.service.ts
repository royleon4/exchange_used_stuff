import type { PoolClient } from "pg";
import { pool } from "../db.js";

const WANT_LOCK_NAMESPACE = 20260722;

export type WantResult = {
  wanted: boolean;
  wantCount: number;
};

async function lockPostWant(client: PoolClient, postId: number): Promise<void> {
  await client.query("SELECT pg_advisory_xact_lock($1, $2)", [WANT_LOCK_NAMESPACE, postId]);
}

async function countPostWants(client: PoolClient, postId: number): Promise<number> {
  const count = await client.query<{ count: string }>(
    "SELECT COUNT(*)::text AS count FROM post_wants WHERE post_id = $1",
    [postId],
  );
  return Number(count.rows[0]?.count ?? 0);
}

export async function addPostWant(input: {
  postId: number;
  userId?: number;
  anonId: string;
}): Promise<WantResult> {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await lockPostWant(client, input.postId);

    if (input.userId) {
      await client.query(
        "DELETE FROM post_wants WHERE post_id = $1 AND anon_id = $2",
        [input.postId, input.anonId],
      );
      await client.query(
        `INSERT INTO post_wants (user_id, post_id)
         VALUES ($1, $2)
         ON CONFLICT (user_id, post_id) WHERE user_id IS NOT NULL DO NOTHING`,
        [input.userId, input.postId],
      );
    } else {
      await client.query(
        `INSERT INTO post_wants (anon_id, post_id)
         VALUES ($1, $2)
         ON CONFLICT (anon_id, post_id) WHERE anon_id IS NOT NULL DO NOTHING`,
        [input.anonId, input.postId],
      );
    }

    const wantCount = await countPostWants(client, input.postId);
    await client.query("COMMIT");
    return { wanted: true, wantCount };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function removePostWant(input: {
  postId: number;
  userId?: number;
  anonId: string;
}): Promise<WantResult> {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await lockPostWant(client, input.postId);

    if (input.userId) {
      await client.query(
        "DELETE FROM post_wants WHERE post_id = $1 AND (user_id = $2 OR anon_id = $3)",
        [input.postId, input.userId, input.anonId],
      );
    } else {
      await client.query(
        "DELETE FROM post_wants WHERE post_id = $1 AND anon_id = $2",
        [input.postId, input.anonId],
      );
    }

    const wantCount = await countPostWants(client, input.postId);
    await client.query("COMMIT");
    return { wanted: false, wantCount };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function claimAnonymousWants(userId: number, anonId?: string): Promise<void> {
  if (!anonId) return;

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const anonymousPosts = await client.query<{ post_id: number }>(
      "SELECT DISTINCT post_id FROM post_wants WHERE anon_id = $1 ORDER BY post_id",
      [anonId],
    );

    for (const { post_id: postId } of anonymousPosts.rows) {
      await lockPostWant(client, postId);
      await client.query(
        `INSERT INTO post_wants (user_id, post_id, created_at)
         SELECT $1, post_id, MIN(created_at)
         FROM post_wants
         WHERE anon_id = $2 AND post_id = $3
         GROUP BY post_id
         ON CONFLICT (user_id, post_id) WHERE user_id IS NOT NULL DO NOTHING`,
        [userId, anonId, postId],
      );
      await client.query(
        "DELETE FROM post_wants WHERE anon_id = $1 AND post_id = $2",
        [anonId, postId],
      );
    }

    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}
