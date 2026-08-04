const path = require("path");
const fs = require("fs");
const cloudinary = require("../config/cloudinary");

const STORAGE_DRIVER = process.env.STORAGE_DRIVER || "local";

// Ensure local uploads folder exists
const uploadsDir = path.join(__dirname, "../../uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

/**
 * Upload a file either locally or to Cloudinary
 * @param {Object} file - multer file object (memory storage recommended)
 * @returns {Promise<string>} - public URL or local path
 */
const upload = async (file) => {
  if (!file) {
    throw new Error("No file provided");
  }

  if (STORAGE_DRIVER === "cloudinary") {
    return uploadToCloudinary(file);
  }

  return uploadToLocal(file);
};

/**
 * Local disk storage (development)
 */
const uploadToLocal = async (file) => {
  const uniqueName = `${Date.now()}-${file.originalname.replace(/\s+/g, "-")}`;
  const filePath = path.join(uploadsDir, uniqueName);

  // Support both memoryStorage and diskStorage
  if (file.buffer) {
    fs.writeFileSync(filePath, file.buffer);
  } else if (file.path) {
    // Already saved by multer diskStorage
    return `/uploads/${path.basename(file.path)}`;
  } else {
    throw new Error("Invalid file object");
  }

  return `/uploads/${uniqueName}`;
};

/**
 * Cloudinary storage (production)
 */
const uploadToCloudinary = async (file) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: "univote",
        resource_type: "image",
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result.secure_url);
      },
    );

    if (file.buffer) {
      stream.end(file.buffer);
    } else if (file.path) {
      // If disk storage was used, read file then upload
      const fileStream = fs.createReadStream(file.path);
      fileStream.pipe(stream);
    } else {
      reject(new Error("Invalid file object for Cloudinary upload"));
    }
  });
};

module.exports = {
  upload,
};
