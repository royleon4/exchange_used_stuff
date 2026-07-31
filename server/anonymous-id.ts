import { randomUUID } from "node:crypto";
import type { Request, Response } from "express";

const ANON_COOKIE_NAME = "anon_id";
const ANON_COOKIE_MAX_AGE_MS = 365 * 24 * 60 * 60 * 1000;
const isProduction = process.env.NODE_ENV === "production";

function cookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: isProduction,
    path: "/",
  };
}

export function getAnonymousId(req: Request): string | undefined {
  return req.cookies?.[ANON_COOKIE_NAME] as string | undefined;
}

export function getOrCreateAnonymousId(req: Request, res: Response): string {
  const existing = getAnonymousId(req);
  if (existing) return existing;

  const anonymousId = randomUUID();
  res.cookie(ANON_COOKIE_NAME, anonymousId, {
    ...cookieOptions(),
    maxAge: ANON_COOKIE_MAX_AGE_MS,
  });
  return anonymousId;
}

export function clearAnonymousIdCookie(res: Response): void {
  res.clearCookie(ANON_COOKIE_NAME, cookieOptions());
}
