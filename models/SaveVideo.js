const mongoose = require("mongoose");

const SaveVideoSchema = new mongoose.Schema({
  video: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const SaveVideo = mongoose.model("SaveVideo", SaveVideoSchema, "SaveVideos");

module.exports = SaveVideo;
