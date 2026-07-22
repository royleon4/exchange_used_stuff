import { Router } from "express";
import { eq } from "drizzle-orm";
import { postImages } from "../../shared/schema.js";
import { db } from "../db.js";
import { downloadFile } from "../integrations/google-drive/client.js";
import { AppError } from "../middleware/error-handler.js";

const router = Router();

router.get("/:imageId", async (req, res) => {
  const imageId = Number(req.params.imageId);
  if (!Number.isInteger(imageId) || imageId <= 0) {
    throw new AppError(400, "INVALID_IMAGE_ID", "圖片編號不正確");
  }

  const [image] = await db.select().from(postImages).where(eq(postImages.id, imageId)).limit(1);
  if (!image) throw new AppError(404, "IMAGE_NOT_FOUND", "找不到圖片");

  const driveResponse = await downloadFile(image.driveFileId);
  res.setHeader("Content-Type", image.mimeType);
  res.setHeader("Cache-Control", "public, max-age=86400");
  driveResponse.data.on("error", (error) => res.destroy(error));
  driveResponse.data.pipe(res);
});

export default router;
