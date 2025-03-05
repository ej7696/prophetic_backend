const multer = require('multer');
const path = require('path');
const fs = require('fs');

const dir = 'public/videos/';

if (!fs.existsSync(dir)){
    fs.mkdirSync(dir, { recursive: true });
}


const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, dir); 
  },
  filename: function (req, file, cb) {
    console.log("Date.now() + path.extname(file.originalname)",Date.now() + path.extname(file.originalname))
    cb(null, Date.now() + path.extname(file.originalname)); 
    
  }
});


const fileFilter = (req, file, cb) => {
    if (!file) {
        cb(null, true);
        return;
    }
  const allowedTypes = ['video/mp4'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type'), false);
  }
};


module.exports.upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 20 * 1024 * 1024 }  
}).single('videoFile');


