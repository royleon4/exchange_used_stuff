import type { ErrorRequestHandler } from "express";
import { ZodError } from "zod";

export class AppError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
  ) {
    super(message);
  }
}

export const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
  if (error instanceof ZodError) {
    res.status(400).json({
      error: {
        code: "VALIDATION_ERROR",
        message: "請檢查輸入內容",
        fields: error.flatten().fieldErrors,
      },
    });
    return;
  }

  if (error instanceof AppError) {
    res.status(error.status).json({
      error: { code: error.code, message: error.message },
    });
    return;
  }

  console.error("[server] unhandled error", error);
  res.status(500).json({
    error: { code: "INTERNAL_ERROR", message: "系統暫時無法處理，請稍後再試" },
  });
};
