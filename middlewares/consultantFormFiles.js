const multer = require('multer');
const fs = require('fs');
const path = require('path');


const imageDir = 'public/images/';
const audioDir = 'public/audios/';


const ensureDirExists = (dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
};

const fileFilter = (req, file, cb) => {
  if (file.fieldname === 'profilePhoto') {

    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed for profilePhoto'), false);
    }
  } else if (file.fieldname === 'voiceNote') {

    if (file.mimetype.startsWith('audio/')) {
      cb(null, true);
    } else {
      cb(new Error('Only audio files are allowed for voiceNote'), false);
    }
  } else {
    cb(new Error('Invalid field'), false);
  }
};

// Multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (file.fieldname === 'profilePhoto') {
      ensureDirExists(imageDir); // Check and create image directory
      cb(null, imageDir);
    } else if (file.fieldname === 'voiceNote') {
      ensureDirExists(audioDir); // Check and create audio directory
      cb(null, audioDir);
    }
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});


const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // Limit file size to 10MB
  }
});


module.exports.uploadFilesMiddleware = upload.fields([
  { name: 'profilePhoto', maxCount: 1 },
  { name: 'voiceNote', maxCount: 1 }
]);

