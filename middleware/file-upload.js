const multer = require('multer');
const { v1: uuidv1 } = require('uuid');

const MIME_TYPE_MAP = {
  // multer identify incoming file's mimetype as 'image/png',
  // so we can use this to extract file type as png, jpg, and such.
  'image/png': 'png',
  'image/jpg': 'jpg',
  'image/jpeg': 'jpeg',
};
const fileUpload = multer({
  // adjust file in byte size here.
  limits: 500000,
  // multer.diskStorage allows us to decide where to save incoming files
  // and how we want to save incoming file names.
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, 'uploads/images');
    },
    filename: (req, file, cb) => {
      const ext = MIME_TYPE_MAP[file.mimetype];
      cb(null, uuidv1() + '.' + ext);
    },
  }),
  fileFilter: (req, file, cb) => {
    // !!:: Extract data as "True/False" if there is or is not an object inside array.
    const isValid = !!MIME_TYPE_MAP[file.mimetype];
    let error = isValid ? null : new Error('Invalid file extension!');
    cb(error, isValid);
  },
});

module.exports = fileUpload;
