import crypto from "node:crypto";
import { Router } from "express";
import multer from "multer";
import sharp from "sharp";
import { postImages } from "../../shared/schema.js";
import { requireAuth } from "../auth.js";
import { db } from "../db.js";
import { uploadWebp } from "../integrations/google-drive/client.js";
import { AppError } from "../middleware/error-handler.js";

const router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024, files: 9 },
  fileFilter: (_req, file, callback) => {
    const allowed = new Set(["image/jpeg", "image/png", "image/webp"]);
    if (!allowed.has(file.mimetype)) {
      callback(new Error("UNSUPPORTED_IMAGE_TYPE"));
      return;
    }
    callback(null, true);
  },
});

router.post("/images", requireAuth, upload.array("images", 9), async (req, res) => {
  const files = req.files as Express.Multer.File[] | undefined;
  if (!files?.length) throw new AppError(400, "IMAGE_REQUIRED", "請選擇至少一張圖片");

  const uploaded: Array<{ id: number; url: string; width: number; height: number }> = [];
  for (const file of files) {
    const image = sharp(file.buffer, { failOn: "error" }).rotate();
    const metadata = await image.metadata();
    if (!metadata.width || !metadata.height) {
      throw new AppError(400, "INVALID_IMAGE", "圖片內容無法辨識");
    }

    const processed = await image
      .resize({ width: 1600, height: 1600, fit: "inside", withoutEnlargement: true })
      .webp({ quality: 82 })
      .toBuffer({ resolveWithObject: true });

    const filename = `${crypto.randomUUID()}.webp`;
    const driveFileId = await uploadWebp(processed.data, filename);
    const [record] = await db
      .insert(postImages)
      .values({
        ownerId: req.user!.id,
        driveFileId,
        mimeType: "image/webp",
        sizeBytes: processed.data.length,
        width: processed.info.width,
        height: processed.info.height,
        sortOrder: uploaded.length,
      })
      .returning({ id: postImages.id });

    uploaded.push({
      id: record.id,
      url: `/api/media/${record.id}`,
      width: processed.info.width,
      height: processed.info.height,
    });
  }

  res.status(201).json({ images: uploaded });
});

export default router;
