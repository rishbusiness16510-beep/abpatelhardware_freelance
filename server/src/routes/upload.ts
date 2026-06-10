import { Router, Request, Response, NextFunction } from 'express';
import multer from 'multer';
import cloudinary from '../lib/cloudinary.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

// Configure multer to store files in memory temporarily
const storage = multer.memoryStorage();
const upload = multer({ 
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
});

// Helper to wrap cloudinary upload stream in a promise
const uploadToCloudinary = (buffer: Buffer, folder: string): Promise<any> => {
  return new Promise((resolve, reject) => {
    const writeStream = cloudinary.uploader.upload_stream(
      {
        folder,
        public_id: uuidv4(),
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );
    writeStream.end(buffer);
  });
};

// Custom middleware to handle multer errors for single upload
const singleUploadMiddleware = (req: Request, res: Response, next: NextFunction) => {
  upload.single('image')(req, res, (err: any) => {
    if (err) {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({ message: 'File is too large. Maximum size allowed is 5MB.' });
        }
        return res.status(400).json({ message: err.message });
      }
      return res.status(400).json({ message: err.message || 'File upload error' });
    }
    next();
  });
};

// Custom middleware to handle multer errors for multiple uploads
const multipleUploadMiddleware = (req: Request, res: Response, next: NextFunction) => {
  upload.array('images', 10)(req, res, (err: any) => {
    if (err) {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({ message: 'One or more files exceed the 5MB size limit.' });
        }
        if (err.code === 'LIMIT_UNEXPECTED_FILE') {
          return res.status(400).json({ message: 'Too many files uploaded. Maximum limit is 10 files.' });
        }
        return res.status(400).json({ message: err.message });
      }
      return res.status(400).json({ message: err.message || 'File upload error' });
    }
    next();
  });
};

// Single image upload
router.post('/single', authenticate, requireAdmin, singleUploadMiddleware, async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      res.status(400).json({ message: 'No image file provided' });
      return;
    }

    const folder = req.body.folder || 'abpatel-hardware/general';
    const result = await uploadToCloudinary(req.file.buffer, folder);

    res.json({
      url: result.secure_url,
      publicId: result.public_id,
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ message: 'Image upload failed' });
  }
});

// Multiple image upload (up to 10)
router.post('/multiple', authenticate, requireAdmin, multipleUploadMiddleware, async (req: Request, res: Response) => {
  try {
    if (!req.files || (req.files as Express.Multer.File[]).length === 0) {
      res.status(400).json({ message: 'No image files provided' });
      return;
    }

    const files = req.files as Express.Multer.File[];
    const folder = req.body.folder || 'abpatel-hardware/products';
    
    const uploadPromises = files.map(file => uploadToCloudinary(file.buffer, folder));
    const results = await Promise.all(uploadPromises);

    const urls = results.map(result => ({
      url: result.secure_url,
      publicId: result.public_id,
    }));

    res.json(urls);
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ message: 'Multiple image upload failed' });
  }
});

export default router;
