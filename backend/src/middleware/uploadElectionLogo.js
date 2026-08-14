const multer = require("multer");

// ===============================
// IMAGE UPLOAD
// ===============================

const imageStorage = multer.memoryStorage();

const upload = multer({
  storage: imageStorage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype && file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed"), false);
    }
  },
});

// ===============================
// CSV UPLOAD
// ===============================

const csvStorage = multer.memoryStorage();

const csvUpload = multer({
  storage: csvStorage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
  fileFilter: (req, file, cb) => {
    const isCsv =
      file.mimetype === "text/csv" ||
      file.mimetype === "application/csv" ||
      file.mimetype === "application/vnd.ms-excel" ||
      file.originalname.toLowerCase().endsWith(".csv");

    if (isCsv) {
      cb(null, true);
    } else {
      cb(new Error("Only CSV files are allowed"), false);
    }
  },
});

module.exports = {
  upload,
  csvUpload,
};
