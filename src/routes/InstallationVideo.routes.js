const express = require("express");
const { uploadVideo, uploadImage } = require("../middleware/upload.middleware");
const {
  createInstallationVideo,
  getAllInstallationVideos,
} = require("../controllers/InstallationVideo.controller");

const router = express.Router();

router.post(
  "/upload-video",
  (req, res, next) => {
 

    const upload = uploadVideo.fields([
      { name: "video", maxCount: 1 },
      { name: "thumbnail", maxCount: 1 },
      { name: "channelImage", maxCount: 1 },
    ]);
    upload(req, res, (err) => {
      if (err) return res.status(400).json({ message: err.message });
      next();
    });
  },

  createInstallationVideo
);

router.get("/", getAllInstallationVideos);

module.exports = router;
