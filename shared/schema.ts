import {
  boolean,
  index,
  integer,
  pgEnum,
  pgTable,
  primaryKey,
  serial,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

export const userRoleEnum = pgEnum("user_role", ["user", "admin"]);
export const itemStatusEnum = pgEnum("item_status", [
  "considering",
  "bringing",
  "not_bringing",
  "closed",
]);
export const moderationStatusEnum = pgEnum("moderation_status", [
  "visible",
  "hidden",
  "deleted",
]);
export const cleanupStatusEnum = pgEnum("cleanup_status", [
  "pending",
  "completed",
  "failed",
]);

export const users = pgTable(
  "users",
  {
    id: serial("id").primaryKey(),
    username: text("username").notNull(),
    passwordHash: text("password_hash").notNull(),
    nickname: text("nickname").notNull(),
    role: userRoleEnum("role").notNull().default("user"),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [uniqueIndex("users_username_unique").on(table.username)],
);

export const posts = pgTable(
  "posts",
  {
    id: serial("id").primaryKey(),
    authorId: integer("author_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    description: text("description").notNull(),
    commentsEnabled: boolean("comments_enabled").notNull().default(true),
    itemStatus: itemStatusEnum("item_status").notNull().default("considering"),
    moderationStatus: moderationStatusEnum("moderation_status")
      .notNull()
      .default("visible"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (table) => [
    index("posts_created_at_idx").on(table.createdAt),
    index("posts_author_id_idx").on(table.authorId),
    index("posts_item_status_idx").on(table.itemStatus),
    index("posts_moderation_status_idx").on(table.moderationStatus),
  ],
);

export const postImages = pgTable(
  "post_images",
  {
    id: serial("id").primaryKey(),
    postId: integer("post_id").references(() => posts.id, { onDelete: "cascade" }),
    ownerId: integer("owner_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    driveFileId: text("drive_file_id").notNull(),
    mimeType: text("mime_type").notNull(),
    sizeBytes: integer("size_bytes").notNull(),
    width: integer("width").notNull(),
    height: integer("height").notNull(),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("post_images_drive_file_id_unique").on(table.driveFileId),
    index("post_images_post_order_idx").on(table.postId, table.sortOrder),
    index("post_images_owner_id_idx").on(table.ownerId),
  ],
);

export const postWants = pgTable(
  "post_wants",
  {
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    postId: integer("post_id")
      .notNull()
      .references(() => posts.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    primaryKey({ columns: [table.userId, table.postId] }),
    index("post_wants_post_id_idx").on(table.postId),
    index("post_wants_created_at_idx").on(table.createdAt),
  ],
);

export const comments = pgTable(
  "comments",
  {
    id: serial("id").primaryKey(),
    postId: integer("post_id")
      .notNull()
      .references(() => posts.id, { onDelete: "cascade" }),
    authorId: integer("author_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    body: text("body").notNull(),
    moderationStatus: moderationStatusEnum("moderation_status")
      .notNull()
      .default("visible"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (table) => [
    index("comments_post_created_idx").on(table.postId, table.createdAt),
    index("comments_author_id_idx").on(table.authorId),
  ],
);

export const siteSettings = pgTable("site_settings", {
  id: serial("id").primaryKey(),
  siteTitle: text("site_title").notNull().default("Excel & Min 二手物品需求牆"),
  announcement: text("announcement").notNull().default(""),
  registrationOpen: boolean("registration_open").notNull().default(true),
  defaultCommentsEnabled: boolean("default_comments_enabled").notNull().default(true),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const imageCleanupJobs = pgTable("image_cleanup_jobs", {
  id: serial("id").primaryKey(),
  driveFileId: text("drive_file_id").notNull(),
  reason: text("reason").notNull(),
  attempts: integer("attempts").notNull().default(0),
  lastError: text("last_error").notNull().default(""),
  status: cleanupStatusEnum("status").notNull().default("pending"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export type User = typeof users.$inferSelect;
export type Post = typeof posts.$inferSelect;
export type PostImage = typeof postImages.$inferSelect;
export type Comment = typeof comments.$inferSelect;
