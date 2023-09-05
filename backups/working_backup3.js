//working code using node-cache
const express = require("express");
require("dotenv").config();
const app = express();

const NodeCache = require("node-cache");

const cache = new NodeCache({ stdTTL: 60 * 60 }); // cache for 1 hour

const cors = require("cors");
const port = 4000;
app.use(express.json());
app.use(
  cors({
    origin: ["http://localhost:4000"],
    methods: ["GET", "POST"],
    credentials: true,
    maxAge: 86400, // cache for one day
  })
);
app.use(express.json());

const { Configuration, OpenAIApi } = require("openai");
const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

const { exec } = require("child_process");

function openFileInChrome(filePath) {
  const command = `open -a "Google Chrome" ${filePath}`;
  exec(command, (error, stdout, stderr) => {
    if (error) {
      console.error(`Error: ${error.message}`);
      return;
    }
    if (stderr) {
      console.error(`Error: ${stderr}`);
      return;
    }
    console.log(`File opened successfully in Chrome`);
  });
}

function generateRandomString() {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < 10; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

function takeScreenShot() {
  const randomString = generateRandomString();

  // Execute an AppleScript command to take a screenshot of the entire screen
  exec(
    `screencapture -T0 -x ~/Desktop/${randomString}.png`,
    (error, stdout, stderr) => {
      if (error) {
        console.error(`Error: ${error.message}`);
        return;
      }
      if (stderr) {
        console.error(`stderr: ${stderr}`);
        return;
      }
      console.log(`Screenshot saved to screenshot.png`);
    }
  );
}

app.post("/test", async (req, res) => {
  let userInput = req.body.data.userInput;
  console.log(req.body.data.userInput);
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader(
    "Access-Control-Allow-Origin",
    `chrome-extension://${process.env.CHROME_EXTENSION_ID}`
  );

  const GPT4Message = [{ role: "user", content: userInput }];

  let GPT4 = async (message) => {
    const response = await openai.createChatCompletion({
      // You need early access to GPT-4, otherwise use "gpt-3.5-turbo"
      model: "gpt-4",
      messages: message,
    });

    return response.data.choices[0].message.content;
  };

  const response = await GPT4(GPT4Message);
  console.log(response);
  res.send(response);
});

app.post("/openFile", async (req, res) => {
  let filePath = req.body.data.filePath;
  console.log(req.body.data.filePath);
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader(
    "Access-Control-Allow-Origin",
    `chrome-extension://${process.env.CHROME_EXTENSION_ID}`
  );

  openFileInChrome(filePath);

  res.send("success");
});

app.post("/takeScreenShot", async (req, res) => {
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader(
    "Access-Control-Allow-Origin",
    `chrome-extension://${process.env.CHROME_EXTENSION_ID}`
  );

  takeScreenShot();

  res.send("success");
});

const axios = require("axios");

const API_URL = process.env.CANVAS_API_URL;
const API_KEY = process.env.CANVAS_API_KEY;
const COURSE_ID = "26789";

const axiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    Authorization: `Bearer ${API_KEY}`,
  },
});

const fs = require("fs");

function getCourseAssignments() {
  // get the assignment groups for that course using the COURSE_ID
  axiosInstance
    .get(`courses/${COURSE_ID}/assignment_groups`)
    .then((response) => {
      const assignments_groups = response.data;

      // console.log("Assignments groups:", assignments_groups);
      // return assignmentList;
    })
    .catch((err) => {
      console.error(err.message);
    });

  const ASSIGNMENT_GROUP_NAME = "Written Assignments"; // replace with the name of your assignment group
  //fetch the assignments
  axiosInstance
    .get(`courses/${COURSE_ID}/assignment_groups/69364/assignments`)
    .then((response) => {
      // console.log(response.data);
      const json = JSON.stringify(response.data, null, 2);
      // Write the JSON string to a file
      fs.writeFile("output.txt", json, (err) => {
        if (err) {
          console.error(err);
          return;
        }
        console.log("JSON data written to output.txt");
      });
    })
    .catch((err) => {
      console.error(err.message);
    });
}

app.get("/getCourseAssignments", async (req, res) => {
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader(
    "Access-Control-Allow-Origin",
    `chrome-extension://${process.env.CHROME_EXTENSION_TWO_ID}`
  );

  getCourseAssignments();

  res.status(200).json({ message: "success" });
});

const Snoowrap = require("snoowrap");

const client = new Snoowrap({
  userAgent: "myBotFH v1.0",
  clientId: process.env.clientId,
  clientSecret: process.env.clientSecret,
  username: process.env.username,
  password: process.env.password,
});

async function fetchTopMemes() {
  const subreddit = await client.getSubreddit("memes");
  const topPosts = await subreddit.getTop({ time: "day", limit: 3 });

  console.log("fetching...");

  const memes = topPosts.map((post) => ({
    title: post.title,
    url: post.url,
    id: post.id,
  }));

  return memes;
}

app.get("/memes", (req, res) => {
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader(
    "Access-Control-Allow-Origin",
    `chrome-extension://${process.env.CHROME_EXTENSION_TWO_ID}`
  );

  const cachedMemes = cache.get("memes");
  if (cachedMemes) {
    console.log("retrieving from cache");
    return res.status(200).json({ memes: cachedMemes });
  }

  fetchTopMemes().then((memes) => {
    cache.set("memes", memes);
    res.status(200).json({ memes: memes });
  });
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
