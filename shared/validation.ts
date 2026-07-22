import { z } from "zod";

export const usernameSchema = z
  .string()
  .trim()
  .min(4, "帳號至少需要 4 個字元")
  .max(30, "帳號最多 30 個字元")
  .regex(/^[A-Za-z0-9_.]+$/, "帳號只能使用英文字母、數字、底線與句點")
  .transform((value) => value.toLowerCase());

export const passwordSchema = z
  .string()
  .min(8, "密碼至少需要 8 個字元")
  .max(72, "密碼最多 72 個字元");

export const nicknameSchema = z
  .string()
  .trim()
  .min(2, "暱稱至少需要 2 個字元")
  .max(20, "暱稱最多 20 個字元");

export const registerSchema = z.object({
  username: usernameSchema,
  password: passwordSchema,
  nickname: nicknameSchema,
  inviteCode: z.string().trim().optional(),
});

export const loginSchema = z.object({
  username: usernameSchema,
  password: z.string().min(1, "請輸入密碼"),
});

export const itemStatusSchema = z.enum([
  "considering",
  "bringing",
  "not_bringing",
  "closed",
]);

export const createPostSchema = z.object({
  title: z.string().trim().min(2, "標題至少 2 個字").max(40, "標題最多 40 個字"),
  description: z
    .string()
    .trim()
    .min(10, "描述至少 10 個字")
    .max(500, "描述最多 500 個字"),
  commentsEnabled: z.boolean().default(true),
  itemStatus: itemStatusSchema.default("considering"),
  imageIds: z.array(z.number().int().positive()).min(1, "至少需要 1 張圖片").max(9, "最多 9 張圖片"),
});

export const updatePostSchema = createPostSchema.partial().refine(
  (value) => Object.keys(value).length > 0,
  "至少要修改一個欄位",
);

export const commentSchema = z.object({
  body: z.string().trim().min(1, "請輸入留言").max(300, "留言最多 300 個字"),
});
