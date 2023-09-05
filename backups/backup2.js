const express = require("express");
require("dotenv").config();
const app = express();

// console.log("API_URL:", process.env.CANVAS_API_URL);
// console.log("API_KEY:", process.env.CANVAS_API_KEY);

// const { CanvasApi } = require("canvas-api");

// const API_URL = process.env.CANVAS_API_URL;
// const API_KEY = process.env.CANVAS_API_KEY;
// const COURSE_ID = "26789";

// curl -H "Authorization: Bearer 1101~9NqSISybPgz0UUelMn2XCBnVOJCMUKMKOiVWouK51oxher0Td1BhYyfuMwAKBKGu" https://ucmerced.instructure.com/api/v1/courses/26789/assignments

// console.log("API_URL:", process.env.CANVAS_API_URL);
// console.log("API_KEY:", process.env.CANVAS_API_KEY);

// const canvas = new CanvasApi(API_URL, API_KEY);

// const path = require("path");
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

  // const { exec } = require("child_process");

  // // Execute an AppleScript command to get the bounds of the frontmost window
  // exec(
  //   'osascript -e "tell application \\"System Events\\" to get the bounds of the front window" | tr "," " "',
  //   (error, stdout, stderr) => {
  //     if (error) {
  //       console.error(`Error: ${error.message}`);
  //       return;
  //     }
  //     if (stderr) {
  //       console.error(`stderr: ${stderr}`);
  //       return;
  //     }
  //     // Parse the bounds of the window from the output of the AppleScript command
  //     const [x, y, width, height] = stdout.trim().split(" ").map(Number);

  //     // Capture a screenshot of the window using the screencapture command
  //     exec(
  //       `screencapture -l "$(osascript -e 'tell application \\"System Events\\" to get id of window 1 where position is {${x}, ${y}}')" -R${x},${y},${width},${height} screenshot.png`,
  //       (error, stdout, stderr) => {
  //         if (error) {
  //           console.error(`Error: ${error.message}`);
  //           return;
  //         }
  //         if (stderr) {
  //           console.error(`stderr: ${stderr}`);
  //           return;
  //         }
  //         console.log(`Screenshot saved to screenshot.png`);
  //       }
  //     );
  //   }
  // );
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

  // const completion = await openai.createChatCompletion({
  //   model: "gpt-3.5-turbo",
  //   messages: [{ role: "user", content: userInput }],
  // });
  // console.log(completion.data.choices[0].message);
  // const message = completion.data.choices[0].message;
  // res.send(message.content);

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

  //   const completion = await openai.createChatCompletion({
  //     model: "gpt-3.5-turbo",
  //     messages: [{ role: "user", content: userInput }],
  //   });
  //   console.log(completion.data.choices[0].message);
  //   const message = completion.data.choices[0].message;
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

  //   const completion = await openai.createChatCompletion({
  //     model: "gpt-3.5-turbo",
  //     messages: [{ role: "user", content: userInput }],
  //   });
  //   console.log(completion.data.choices[0].message);
  //   const message = completion.data.choices[0].message;
  res.send("success");
});

// const API_URL = "https://ucmerced.instructure.com/api/v1/";
// const API_TOKEN =
//   "1101~9NqSISybPgz0UUelMn2XCBnVOJCMUKMKOiVWouK51oxher0Td1BhYyfuMwAKBKGu";
// const canvas = require("canvas-api");

// const API_URL = process.env.CANVAS_API_URL;
// const API_KEY = process.env.CANVAS_API_KEY;
// console.log(API_URL, API_KEY); // Add this line to print out the values of API_URL and API_KEY
// const COURSE_ID = "26789";

// function getCourseAssignments() {
// const canvas = new Canvas(API_KEY, API_URL);
// canvas
//   .getAssignments(COURSE_ID)
//   .then((assignments) => {
//     const assignmentList = assignments.map((assignment) => {
//       return {
//         name: assignment.name,
//         dueDate: assignment.due_at,
//       };
//     });
//     console.log("Assignments:", assignmentList);
//   })
//   .catch((err) => {
//     console.error(err);
//   });
// }
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
  axiosInstance
    .get(`courses/${COURSE_ID}/assignment_groups`)
    .then((response) => {
      const assignments_groups = response.data;

      console.log("Assignments groups:", assignments_groups);
      // return assignmentList;
    })
    .catch((err) => {
      console.error(err.message);
    });
  // axiosInstance
  //   .get(`courses/${COURSE_ID}/assignments`)
  //   .then((response) => {
  //     const assignments = response.data;
  //     const assignmentList = assignments.map((assignment) => {
  //       return {
  //         name: assignment.name,
  //         dueDate: assignment.due_at,
  //       };
  //     });
  //     console.log("Assignments:", assignmentList);
  //     // return assignmentList;
  //   })
  //   .catch((err) => {
  //     console.error(err.message);
  //   });
  const ASSIGNMENT_GROUP_NAME = "Written Assignments"; // replace with the name of your assignment group
  axiosInstance
    .get(`courses/${COURSE_ID}/assignment_groups/69364/assignments`)
    .then((response) => {
      console.log(response.data);
      const json = JSON.stringify(response.data, null, 2);
      // Write the JSON string to a file
      fs.writeFile("output.txt", json, (err) => {
        if (err) {
          console.error(err);
          return;
        }
        console.log("JSON data written to output.txt");
      });
      // const assignmentGroups = response.data;
      // const targetGroup = assignmentGroups.find(
      //   (group) => group.name === ASSIGNMENT_GROUP_NAME
      // );
      // if (targetGroup) {
      //   const assignmentGroupId = targetGroup.id;
      //   console.log(
      //     `Assignment group ID for "${ASSIGNMENT_GROUP_NAME}" is ${assignmentGroupId}`
      //   );
      // } else {
      //   console.log(
      //     `No assignment group found with name "${ASSIGNMENT_GROUP_NAME}"`
      //   );
      // }
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
  // let assignmentList = getCourseAssignments();

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
  const topPosts = await subreddit.getTop({ time: "day", limit: 10 });

  const memes = topPosts.map((post) => ({
    title: post.title,
    url: post.url,
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

  fetchTopMemes().then((memes) => {
    res.status(200).json({ memes: memes });
  });
});
// fetchTopMemes().then((memes) => {
//   console.log(memes);
// });

app.get("/simulate-request", (req, res) => {
  console.log("simulate-request was requested");
  res.status(200).json({ message: "simulate-request success" });
});
app.get("/simulateResponse", (req, res) => {
  console.log("simulate-response was requested");
  res.status(200).json({ message: "simulate-response success" });
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
