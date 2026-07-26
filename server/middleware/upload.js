const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("../config/cloudinary");

// Helper to check if real Cloudinary keys exist
const isCloudinaryReady = () => {
  return (
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_CLOUD_NAME !== "demo" &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_KEY !== "1234567890" &&
    process.env.CLOUDINARY_API_SECRET &&
    process.env.CLOUDINARY_API_SECRET !== "abcdefghijklmnopqrstuvwxyz"
  );
};

// Memory storage for safe fallback when Cloudinary is unconfigured
const memoryStorage = multer.memoryStorage();

// Middleware generator that handles Cloudinary with memory storage fallback
const createUploadMiddleware = (folder, fieldName, isSingle = true) => {
  return (req, res, next) => {
    let storage;

    if (isCloudinaryReady()) {
      try {
        storage = new CloudinaryStorage({
          cloudinary,
          params: {
            folder: `hacklytics/${folder}`,
            allowed_formats: ["jpg", "jpeg", "png", "webp", "pdf"],
          },
        });
      } catch (_) {
        storage = memoryStorage;
      }
    } else {
      storage = memoryStorage;
    }

    const upload = isSingle
      ? multer({ storage }).single(fieldName)
      : multer({ storage }).array(fieldName, 10);

    upload(req, res, (err) => {
      if (err) {
        // If Cloudinary failed, retry with memoryStorage seamlessly
        const fallbackUpload = isSingle
          ? multer({ storage: memoryStorage }).single(fieldName)
          : multer({ storage: memoryStorage }).array(fieldName, 10);

        return fallbackUpload(req, res, (fallbackErr) => {
          if (fallbackErr) return next(fallbackErr);
          processMemoryFiles(req);
          next();
        });
      }

      processMemoryFiles(req);
      next();
    });
  };
};

// Convert memory storage buffer to data URI so it works as an image URL
const processMemoryFiles = (req) => {
  if (req.file && req.file.buffer) {
    const mime = req.file.mimetype || "image/png";
    const b64 = req.file.buffer.toString("base64");
    req.file.path = `data:${mime};base64,${b64}`;
    req.file.filename = `local_${Date.now()}`;
  }
  if (req.files && Array.isArray(req.files)) {
    req.files.forEach((f) => {
      if (f.buffer) {
        const mime = f.mimetype || "image/png";
        const b64 = f.buffer.toString("base64");
        f.path = `data:${mime};base64,${b64}`;
        f.filename = `local_${Date.now()}`;
      }
    });
  }
};

const uploadBanner = { single: (field) => createUploadMiddleware("banners", field, true) };
const uploadAvatar = { single: (field) => createUploadMiddleware("avatars", field, true) };
const uploadScreenshots = { array: (field) => createUploadMiddleware("screenshots", field, false) };
const uploadPdf = { single: (field) => createUploadMiddleware("pdfs", field, true) };

module.exports = { uploadBanner, uploadAvatar, uploadScreenshots, uploadPdf };
