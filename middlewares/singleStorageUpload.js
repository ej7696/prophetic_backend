const multer = require("multer");
const path = require("path");
const { slugify } = require("transliteration");
const fs = require("fs"); // Import fs module

const fileFilter = require("./utils/LocalfileFilter");

const singleStorageUpload = ({
  entity,
  fileType = "default",
  uploadFieldName = "file",
  fieldName = "file",
}) => {
  const diskStorage = multer.diskStorage({
    destination: function (req, file, cb) {
      const dir = `public/uploads/${entity}`; // Define the upload directory

      // Check if the directory exists
      fs.access(dir, fs.constants.F_OK, (err) => {
        if (err) {
          // Directory does not exist, create it
          fs.mkdir(dir, { recursive: true }, (mkdirErr) => {
            if (mkdirErr) {
              return cb(mkdirErr); // Pass the error to the callback if folder creation fails
            }
            cb(null, dir); // Call the callback with the directory
          });
        } else {
          cb(null, dir); // Directory exists, call the callback with the directory
        }
      });
    },
    filename: function (req, file, cb) {
      try {
        // Check if the file exists and is not empty
        if (!file) {
          // If no file, allow empty and set file path accordingly
          req.upload = {
            fileName: null,
            fieldExt: null,
            entity: entity,
            fieldName: fieldName,
            fileType: fileType,
            filePath: null,
          };

          req.body[fieldName] = null; // Update the body field to null
          return cb(null, null); // Call the callback with null for filename
        }

        // Fetching the file extension of the uploaded file
        let fileExtension = path.extname(file.originalname);
        let uniqueFileID = Math.random().toString(36).slice(2, 7); // Generates unique ID of length 5

        let originalname = "";
        if (req.body.seotitle) {
          originalname = slugify(req.body.seotitle.toLowerCase()); // Convert any language to English characters
        } else {
          originalname = slugify(file.originalname.split(".")[0].toLowerCase()); // Convert any language to English characters
        }

        let _fileName = `${originalname}-${uniqueFileID}${fileExtension}`;

        const filePath = `public/uploads/${entity}/${_fileName}`;
        // Saving file name and extension in request upload object
        req.upload = {
          fileName: _fileName,
          fieldExt: fileExtension,
          entity: entity,
          fieldName: fieldName,
          fileType: fileType,
          filePath: filePath,
        };

        req.body[fieldName] = filePath;

        cb(null, _fileName);
      } catch (error) {
        cb(error); // Pass the error to the callback
      }
    },
  });

  let filterType = fileFilter(fileType);

  const multerStorage = multer({
    storage: diskStorage,
    fileFilter: filterType,
  }).single(uploadFieldName);
  return multerStorage;
};

module.exports = singleStorageUpload;
