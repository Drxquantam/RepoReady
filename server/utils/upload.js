import 'dotenv/config';
import multer from 'multer';

const maxUploadMb = Number(process.env.MAX_UPLOAD_MB || 25);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: maxUploadMb * 1024 * 1024,
  },
  fileFilter: (_req, file, cb) => {
    if (!file.originalname.toLowerCase().endsWith('.zip')) {
      return cb(Object.assign(new Error('Only .zip project uploads are supported'), { status: 400 }));
    }
    cb(null, true);
  },
});

export default upload;
