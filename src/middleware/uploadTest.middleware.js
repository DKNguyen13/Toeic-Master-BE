import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Ensure uploads directory exists (for Excel files)
const uploadsDir = path.join(process.cwd(), 'uploads', 'temp');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer disk storage for Excel files
const diskStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'test-import-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// File filter: Excel for 'file' field, audio for 'audio' field
const fileFilter = (req, file, cb) => {
  if (file.fieldname === 'file') {
    // Excel file
    const allowedExtensions = ['.xlsx', '.xls'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedExtensions.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Only Excel files (.xlsx, .xls) are allowed for the "file" field'), false);
    }
  } else if (file.fieldname === 'audio') {
    // Audio file – store in memory for S3 upload
    const allowedAudioExtensions = ['.mp3', '.wav', '.m4a', '.ogg', '.aac', '.flac'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedAudioExtensions.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Only audio files (MP3, WAV, M4A, OGG, AAC, FLAC) are allowed for the "audio" field'), false);
    }
  } else {
    cb(new Error(`Unexpected field: ${file.fieldname}`), false);
  }
};

// Single Excel upload (legacy, kept for backwards compatibility)
export const uploadExcel = multer({
  storage: diskStorage,
  fileFilter: (req, file, cb) => {
    const allowedExtensions = ['.xlsx', '.xls'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedExtensions.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Only Excel files (.xlsx, .xls) are allowed'), false);
    }
  },
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});

// Mixed storage: Excel goes to disk, audio goes to memory (buffer)
// We use a custom storage that delegates based on fieldname
const mixedStorage = {
  _handleFile(req, file, cb) {
    if (file.fieldname === 'audio') {
      // Store audio in memory (buffer) for direct S3 upload
      const chunks = [];
      file.stream.on('data', (chunk) => chunks.push(chunk));
      file.stream.on('end', () => {
        file.buffer = Buffer.concat(chunks);
        cb(null, { buffer: file.buffer, size: file.buffer.length });
      });
      file.stream.on('error', cb);
    } else {
      // Store Excel on disk
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      const filename = 'test-import-' + uniqueSuffix + path.extname(file.originalname);
      const filepath = path.join(uploadsDir, filename);
      const outStream = fs.createWriteStream(filepath);
      file.stream.pipe(outStream);
      outStream.on('error', cb);
      outStream.on('finish', () => {
        cb(null, {
          destination: uploadsDir,
          filename,
          path: filepath,
          size: outStream.bytesWritten,
        });
      });
    }
  },
  _removeFile(req, file, cb) {
    if (file.path) {
      fs.unlink(file.path, cb);
    } else {
      cb(null);
    }
  },
};

// Multi-field upload: Excel (disk) + optional audio (memory)
export const uploadTestFiles = multer({
  storage: mixedStorage,
  fileFilter,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB overall
});
