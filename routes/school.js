const express = require("express");
const router = express.Router();
const axios = require("axios");
const API_URL = process.env.CANVAS_API_URL;
const API_KEY = process.env.CANVAS_API_KEY;

const axiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    Authorization: `Bearer ${API_KEY}`,
  },
});

router.get("/courses", async (req, res) => {
  try {
    // Define the end date filter
    const endDateFilter = "2023-12-10T07:00:00Z"; // Adjust this to your desired end date

    // Define the parameters to filter courses
    const params = {
      enrollment_state: "active", // Only active courses
    };

    axiosInstance
      .get(`courses`, { params })
      .then((response) => {
        // Filter courses based on the end date
        const filteredCourses = response.data.filter((course) => {
          const endDate = new Date(course.end_at);

          // Check if the course ends after the specified date
          return endDate >= new Date(endDateFilter);
        });
        console.log(req.session);
        // console.log(filteredCourses);
        return res.status(200).json(filteredCourses);
      })
      .catch((err) => {
        console.error(err.message);
        return res.status(500).json({ error: "Error fetching courses" });
      });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
