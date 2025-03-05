const multer = require("multer");
const path = require("path");
const fs = require("fs");

const dir = "public/attachments/";

if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, dir); // Set the upload destination
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + path.extname(file.originalname);
    console.log("Generated filename:", uniqueSuffix);
    cb(null, uniqueSuffix);
  },
});

const fileFilter = (req, file, cb) => {
  if (!file) {
    cb(null, true);
    return;
  }
  //   if (file.mimetype.startsWith("image/")) {
  //     cb(null, true); // Allow all image types
  //   } else {
  //     cb(new Error("Invalid file type, only images are allowed"), false); // Reject non-image uploads
  //   }
  cb(null, true); // Allow all file types
};

// Multer middleware for handling image uploads
module.exports.set = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 }, // Limit file size to 10 MB
});
