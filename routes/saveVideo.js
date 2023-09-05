const express = require("express");
const router = express.Router();
const SaveVideo = require("../models/SaveVideo");

router.get("/", async (req, res) => {
  try {
    const receivedData = {
      url: req.query.url,
    };

    console.log(receivedData);

    // Create a new task using the Task model and the prompt
    const saveVideo = new SaveVideo({ video: receivedData.url });

    // Save the task to the database
    await saveVideo.save();

    return res.status(201).json({ message: "Task created successfully" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// router.get("/getVideos", async (req, res) => {
//   try {
//     // Retrieve all videos from the database
//     const videos = await SaveVideo.find({});

//     // Create a single object containing all videos
//     const videoObject = {
//       videos: videos.map((video) => video.video),
//     };

//     return res.status(200).json(videoObject);
//   } catch (error) {
//     console.error(error);
//     return res.status(500).json({ error: "Internal server error" });
//   }
// });
router.get("/getVideos", async (req, res) => {
  try {
    // Retrieve all videos from the database
    const videos = await SaveVideo.find({});

    // Reverse the order of the videos
    const reversedVideos = videos.reverse();

    // Create a single object containing all videos
    const videoObject = {
      videos: reversedVideos.map((video) => video.video),
    };

    return res.status(200).json(videoObject);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
