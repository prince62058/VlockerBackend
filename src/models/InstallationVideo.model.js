const mongoose = require("mongoose");

const installationVideoSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    videoPath: {
      type: String,
      required: true,
    },
    thumbnail: {
      type: String,  
      required: false,
    },
    channelName: {
      type: String,
      default: "Channel Name",
    },
    views: {
      type: Number,
      default: 0,
    },
    uploadedAt: {
      type: Date,
      default: Date.now,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("InstallationVideo", installationVideoSchema);
