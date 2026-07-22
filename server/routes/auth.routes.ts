import { Router } from "express";
import rateLimit from "express-rate-limit";
import { eq } from "drizzle-orm";
import { loginSchema, registerSchema } from "../../shared/validation.js";
import { siteSettings, users } from "../../shared/schema.js";
import { db } from "../db.js";
import {
  clearSessionCookie,
  hashPassword,
  optionalAuth,
  setSessionCookie,
  verifyPassword,
} from "../auth.js";
import { AppError } from "../middleware/error-handler.js";

const router = Router();
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
});

router.post("/register", authLimiter, async (req, res) => {
  const input = registerSchema.parse(req.body);
  const [settings] = await db.select({ registrationOpen: siteSettings.registrationOpen }).from(siteSettings).limit(1);
  if (settings && !settings.registrationOpen) {
    throw new AppError(403, "REGISTRATION_CLOSED", "目前暫停開放新會員註冊");
  }

  const existing = await db.select({ id: users.id }).from(users).where(eq(users.username, input.username)).limit(1);
  if (existing.length > 0) {
    throw new AppError(409, "USERNAME_TAKEN", "這個帳號已有人使用");
  }

  const [created] = await db
    .insert(users)
    .values({
      username: input.username,
      passwordHash: await hashPassword(input.password),
      nickname: input.nickname,
    })
    .returning({ id: users.id, nickname: users.nickname, role: users.role });

  setSessionCookie(res, created);
  res.status(201).json({ user: created });
});

router.post("/login", authLimiter, async (req, res) => {
  const input = loginSchema.parse(req.body);
  const [user] = await db.select().from(users).where(eq(users.username, input.username)).limit(1);

  if (!user || !(await verifyPassword(input.password, user.passwordHash))) {
    throw new AppError(401, "INVALID_CREDENTIALS", "帳號或密碼不正確");
  }
  if (!user.isActive) {
    throw new AppError(403, "ACCOUNT_DISABLED", "這個帳號目前無法使用");
  }

  const publicUser = { id: user.id, nickname: user.nickname, role: user.role };
  setSessionCookie(res, publicUser);
  res.json({ user: publicUser });
});

router.post("/logout", (_req, res) => {
  clearSessionCookie(res);
  res.status(204).end();
});

router.get("/me", optionalAuth, (req, res) => {
  res.json({ user: req.user ?? null });
});

export default router;
