

const multer = require("multer");
const { S3Client } = require("@aws-sdk/client-s3");
const multerS3 = require("multer-s3");
require("dotenv").config();


const s3 = new S3Client({
  region: process.env.LINODE_OBJECT_STORAGE_REGION || "in-maa-1",
  endpoint: process.env.LINODE_OBJECT_STORAGE_ENDPOINT || "https://in-maa-1.linodeobjects.com",
  credentials: {
    accessKeyId: process.env.LINODE_OBJECT_STORAGE_ACCESS_KEY_ID,
    secretAccessKey: process.env.LINODE_OBJECT_STORAGE_SECRET_ACCESS_KEY,
  },
  forcePathStyle: true,
});

const generateFileName = (file) => {
  const timestamp = Date.now();
  const ext = file.originalname.split(".").pop();
  return `${process.env.BUCKET_FOLDER_PATH}${file.fieldname}-${timestamp}.${ext}`;
};

// const fileFilter = (req, file, cb) => {
//   const allowedVideos = ["video/mp4", "video/mkv", "video/webm", "video/avi"];
//   const allowedImages = ["image/jpeg", "image/png", "image/jpg", "image/webp"];

//   if (
//     allowedVideos.includes(file.mimetype) ||
//     allowedImages.includes(file.mimetype)
//   ) {
//     cb(null, true);
//   } else {
//     cb(new Error("Invalid file type. Only images or videos allowed."), false);
//   }
// };
const multerFilter = (req, file, cb) => {
  cb(null, true);
};

const s3Storage = multerS3({
  s3: s3,
  bucket: process.env.LINODE_OBJECT_BUCKET || "leadkart",
  acl: "public-read",
  contentType: multerS3.AUTO_CONTENT_TYPE,
  metadata: (req, file, cb) => cb(null, { fieldName: file.fieldname }),
  key: (req, file, cb) => {
    cb(null, generateFileName(file));
  },
});


const uploadVideo = multer({
  storage: s3Storage,
  fileFilter: multerFilter,
  limits: { fileSize: 500 * 1024 * 1024 },
});

const uploadImage = multer({
  storage: s3Storage,
  fileFilter: multerFilter,
  limits: { fileSize: 30 * 1024 * 1024 },
});

module.exports = { uploadVideo, uploadImage };
