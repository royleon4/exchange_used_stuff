import path from "node:path";
import { fileURLToPath } from "node:url";
import cookieParser from "cookie-parser";
import express from "express";
import helmet from "helmet";
import authRoutes from "./routes/auth.routes.js";
import wantRoutes from "./routes/wants.routes.js";
import postRoutes from "./routes/posts.routes.js";
import commentRoutes from "./routes/comments.routes.js";
import uploadRoutes from "./routes/upload.routes.js";
import mediaRoutes from "./routes/media.routes.js";
import meRoutes from "./routes/me.routes.js";
import adminRoutes from "./routes/admin.routes.js";
import siteRoutes from "./routes/site.routes.js";
import { ensureInitialData } from "./bootstrap.js";
import { errorHandler } from "./middleware/error-handler.js";

const app = express();
const isProduction = process.env.NODE_ENV === "production";
const port = Number(isProduction ? process.env.PORT ?? 5000 : process.env.API_PORT ?? 3001);

app.set("trust proxy", 1);
app.use(
  helmet({
    contentSecurityPolicy: isProduction ? undefined : false,
    crossOriginResourcePolicy: { policy: "same-site" },
  }),
);
app.use(express.json({ limit: "1mb" }));
app.use(cookieParser());

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, service: "exchange-used-stuff" });
});

app.use("/api/auth", authRoutes);
app.use("/api/posts", wantRoutes);
app.use("/api/posts", postRoutes);
app.use("/api", commentRoutes);
app.use("/api/uploads", uploadRoutes);
app.use("/api/media", mediaRoutes);
app.use("/api/me", meRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/site", siteRoutes);

if (isProduction) {
  const currentDir = path.dirname(fileURLToPath(import.meta.url));
  const publicDir = path.resolve(currentDir, "../dist/public");
  app.use(express.static(publicDir));
  app.get("/{*splat}", (_req, res) => {
    res.sendFile(path.join(publicDir, "index.html"));
  });
}

app.use(errorHandler);

async function start(): Promise<void> {
  await ensureInitialData();
  app.listen(port, () => {
    console.log(`[server] listening on http://localhost:${port}`);
  });
}

start().catch((error) => {
  console.error("[server] startup failed", error);
  process.exitCode = 1;
});
