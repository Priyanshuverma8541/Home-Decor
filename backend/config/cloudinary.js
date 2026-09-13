const cloudinary   = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const multer = require("multer");
const fs = require("fs");
const path = require("path");

const cloudinaryEnabled = Boolean(process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET);

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const cloudinaryStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder:         process.env.CLOUDINARY_FOLDER || "savitri-livings",
    allowed_formats: ["jpg", "jpeg", "png", "webp"],
    transformation: [{ width: 800, height: 800, crop: "limit", quality: "auto" }],
  },
});

const localStorage = multer.diskStorage({
  destination: (_req, _file, callback) => {
    const directory = path.join(__dirname, "..", "public", "uploads");
    fs.mkdirSync(directory, { recursive: true });
    callback(null, directory);
  },
  filename: (_req, file, callback) => callback(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(file.originalname).toLowerCase()}`),
});
const upload = multer({ storage: cloudinaryEnabled ? cloudinaryStorage : localStorage, limits: { fileSize: 5 * 1024 * 1024 } });
const uploadedFileUrl = (file) => cloudinaryEnabled ? file.path : `/uploads/${file.filename}`;

module.exports = { cloudinary, upload, uploadedFileUrl };
