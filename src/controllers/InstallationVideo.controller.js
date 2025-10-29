const InstallationVideo = require("../models/InstallationVideo.model.js");

const createInstallationVideo = async (req, res) => {
  try {
    const { title, description, channelName } = req.body;

    if (!title) {
      return res
        .status(400)
        .json({ success: false, message: "Title is required" });
    }

    if (!req.files || !req.files.video) {
      return res
        .status(400)
        .json({ success: false, message: "Please upload a video file" });
    }

    const videoFile = req.files.video[0];
    const thumbnailFile = req.files.thumbnail ? req.files.thumbnail[0] : null;

    const videoPath = videoFile.location;
    const thumbnailPath = thumbnailFile ? thumbnailFile.location : null;

    const newVideo = new InstallationVideo({
      title,
      description,
      channelName,
      videoPath,
      thumbnail: thumbnailPath,
      createdBy: req.userId || null,
    });

    await newVideo.save();

    res.status(201).json({
      success: true,
      message: "Video uploaded successfully",
      data: newVideo,
    });
  } catch (error) {
    console.error("Error uploading video:", error);
    res
      .status(500)
      .json({ success: false, message: "Server error", error: error.message });
  }
};

const getAllInstallationVideos = async (req, res) => {
  try {
    const videos = await InstallationVideo.find().sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      message: "Videos fetched successfully",
      count: videos.length,
      data: videos,
    });
  } catch (error) {
    console.error("Error fetching videos:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

module.exports = { createInstallationVideo, getAllInstallationVideos };
