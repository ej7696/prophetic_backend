const multer = require("multer");
const path = require("path");
const fs = require("fs");

const dir = "public/images/"; // Directory where images will be stored

// Check if the directory exists, if not, create it
if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir, { recursive: true });
}

// Configure the multer storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, dir); // Set the upload destination
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + path.extname(file.originalname); // Use timestamp to create a unique filename
    console.log("Generated filename:", uniqueSuffix);
    cb(null, uniqueSuffix); // Store the file with the generated name
  },
});

// Filter for allowed image file types (allow all image types)
const fileFilter = (req, file, cb) => {
  if (!file) {
    cb(null, true);
    return;
  }
  if (file.mimetype.startsWith("image/")) {
    cb(null, true); // Allow all image types
  } else {
    cb(new Error("Invalid file type, only images are allowed"), false); // Reject non-image uploads
  }
};

// Multer middleware for handling image uploads
module.exports.upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 }, // Limit file size to 10 MB
});
