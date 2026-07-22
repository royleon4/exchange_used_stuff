import type { NextFunction, Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { eq } from "drizzle-orm";
import type { PublicUser } from "../shared/types.js";
import { users } from "../shared/schema.js";
import { db } from "./db.js";

const COOKIE_NAME = "exchange_session";
const isProduction = process.env.NODE_ENV === "production";

function sessionSecret(): string {
  const value = process.env.SESSION_SECRET;
  if (!value) {
    if (isProduction) throw new Error("SESSION_SECRET is required in production");
    return "development-only-change-me";
  }
  return value;
}

export function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function setSessionCookie(res: Response, user: PublicUser): void {
  const token = jwt.sign(user, sessionSecret(), { expiresIn: "7d" });
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: isProduction,
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: "/",
  });
}

export function clearSessionCookie(res: Response): void {
  res.clearCookie(COOKIE_NAME, {
    httpOnly: true,
    sameSite: "lax",
    secure: isProduction,
    path: "/",
  });
}

export function readSession(req: Request): PublicUser | null {
  const token = req.cookies?.[COOKIE_NAME] as string | undefined;
  if (!token) return null;
  try {
    return jwt.verify(token, sessionSecret()) as PublicUser;
  } catch {
    return null;
  }
}

export async function resolveSessionUser(req: Request): Promise<PublicUser | null> {
  const session = readSession(req);
  if (!session) return null;

  const [user] = await db
    .select({ id: users.id, nickname: users.nickname, role: users.role, isActive: users.isActive })
    .from(users)
    .where(eq(users.id, session.id))
    .limit(1);

  if (!user?.isActive) return null;
  return { id: user.id, nickname: user.nickname, role: user.role };
}

declare global {
  namespace Express {
    interface Request {
      user?: PublicUser;
    }
  }
}

export async function optionalAuth(req: Request, _res: Response, next: NextFunction): Promise<void> {
  try {
    req.user = (await resolveSessionUser(req)) ?? undefined;
    next();
  } catch (error) {
    next(error);
  }
}

export async function requireAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = await resolveSessionUser(req);
    if (!user) {
      res.status(401).json({ error: { code: "UNAUTHORIZED", message: "請先登入" } });
      return;
    }
    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
}

export async function requireAdmin(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = await resolveSessionUser(req);
    if (!user) {
      res.status(401).json({ error: { code: "UNAUTHORIZED", message: "請先登入" } });
      return;
    }
    if (user.role !== "admin") {
      res.status(403).json({ error: { code: "FORBIDDEN", message: "沒有管理員權限" } });
      return;
    }
    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
}
