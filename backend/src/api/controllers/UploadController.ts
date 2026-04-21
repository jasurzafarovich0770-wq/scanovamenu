import { Request, Response, NextFunction } from 'express';
import multer, { FileFilterCallback } from 'multer';
import { CloudinaryProvider } from '../../infrastructure/CloudinaryProvider';
import { UploadService } from '../../domain/services/UploadService';
import { AppError } from '../middleware/errorHandler';

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5MB

const fileFilter = (_req: Request, file: Express.Multer.File, cb: FileFilterCallback) => {
  if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new AppError(400, 'Faqat rasm fayllari qabul qilinadi') as any);
  }
};

export const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_SIZE_BYTES },
  fileFilter,
});

export const uploadFile = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.file) {
      return next(new AppError(400, 'Fayl yuklanmadi'));
    }

    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;

    // Cloudinary sozlangan bo'lsa — Cloudinary ga yuklash
    if (cloudName && apiKey && apiSecret) {
      try {
        const provider = new CloudinaryProvider();
        const service = new UploadService(provider);
        const url = await service.upload(req.file);
        return res.json({ success: true, url });
      } catch {
        // Cloudinary xato bo'lsa — base64 fallback
      }
    }

    // Cloudinary yo'q yoki xato — base64 sifatida qaytarish
    const base64 = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
    res.json({ success: true, url: base64 });
  } catch (err) {
    next(err);
  }
};

// Multer error handler for size limit
export const handleMulterError = (err: any, _req: Request, res: Response, next: NextFunction) => {
  if (err?.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ success: false, message: 'Fayl hajmi 5MB dan oshmasligi kerak' });
  }
  next(err);
};
