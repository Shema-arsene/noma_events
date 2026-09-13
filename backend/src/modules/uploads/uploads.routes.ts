import path from "node:path";
import fs from "node:fs";
import { Router } from "express";
import multer from "multer";
import { nanoid } from "nanoid";
import { UserRole } from "../../types";
import { requireAuth, requireRole } from "../../middleware/auth";
import { asyncHandler } from "../../common/asyncHandler";
import { sendSuccess } from "../../common/response";
import { BadRequestError } from "../../common/errors";
import { env } from "../../config/env";

const uploadsDir = path.resolve(__dirname, "../../../public/uploads");
fs.mkdirSync(uploadsDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${nanoid(16)}${ext}`);
  },
});

const ALLOWED_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

const upload = multer({
  storage,
  limits: { fileSize: 8 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
      cb(new BadRequestError("Format d'image non supporté (jpg, png, webp, gif uniquement)"));
      return;
    }
    cb(null, true);
  },
});

const router = Router();

router.post(
  "/",
  requireAuth(),
  requireRole(UserRole.ORGANIZER, UserRole.ADMIN, UserRole.SUPER_ADMIN),
  upload.single("file"),
  asyncHandler(async (req, res) => {
    if (!req.file) throw new BadRequestError("Aucun fichier fourni");
    const url = `${env.API_URL}/uploads/${req.file.filename}`;
    sendSuccess(res, { url }, 201);
  }),
);

export default router;
