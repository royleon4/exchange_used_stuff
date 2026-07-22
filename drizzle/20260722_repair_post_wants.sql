LOCK TABLE post_wants IN ACCESS EXCLUSIVE MODE;

-- A row must belong to either a signed-in user or an anonymous browser, never both.
UPDATE post_wants
SET anon_id = NULL
WHERE user_id IS NOT NULL AND anon_id IS NOT NULL;

DELETE FROM post_wants
WHERE user_id IS NULL AND anon_id IS NULL;

-- Keep the oldest signed-in-user want for each post.
DELETE FROM post_wants
WHERE id IN (
  SELECT id
  FROM (
    SELECT
      id,
      ROW_NUMBER() OVER (
        PARTITION BY user_id, post_id
        ORDER BY created_at ASC, id ASC
      ) AS duplicate_number
    FROM post_wants
    WHERE user_id IS NOT NULL
  ) duplicates
  WHERE duplicate_number > 1
);

-- Keep the oldest anonymous-browser want for each post.
DELETE FROM post_wants
WHERE id IN (
  SELECT id
  FROM (
    SELECT
      id,
      ROW_NUMBER() OVER (
        PARTITION BY anon_id, post_id
        ORDER BY created_at ASC, id ASC
      ) AS duplicate_number
    FROM post_wants
    WHERE anon_id IS NOT NULL
  ) duplicates
  WHERE duplicate_number > 1
);

ALTER TABLE post_wants
  DROP CONSTRAINT IF EXISTS post_wants_actor_check;

ALTER TABLE post_wants
  ADD CONSTRAINT post_wants_actor_check
  CHECK (num_nonnulls(user_id, anon_id) = 1);

DROP INDEX IF EXISTS post_wants_user_post_unique;
DROP INDEX IF EXISTS post_wants_anon_post_unique;

CREATE UNIQUE INDEX post_wants_user_post_unique
  ON post_wants (user_id, post_id)
  WHERE user_id IS NOT NULL;

CREATE UNIQUE INDEX post_wants_anon_post_unique
  ON post_wants (anon_id, post_id)
  WHERE anon_id IS NOT NULL;
