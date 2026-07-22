import type { NextFunction, Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import type { PublicUser } from "../shared/types.js";

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

declare global {
  namespace Express {
    interface Request {
      user?: PublicUser;
    }
  }
}

export function optionalAuth(req: Request, _res: Response, next: NextFunction): void {
  req.user = readSession(req) ?? undefined;
  next();
}

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const user = readSession(req);
  if (!user) {
    res.status(401).json({ error: { code: "UNAUTHORIZED", message: "請先登入" } });
    return;
  }
  req.user = user;
  next();
}

export function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  requireAuth(req, res, () => {
    if (req.user?.role !== "admin") {
      res.status(403).json({ error: { code: "FORBIDDEN", message: "沒有管理員權限" } });
      return;
    }
    next();
  });
}
