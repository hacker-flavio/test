const express = require("express");
require("dotenv").config();
const mongoose = require("mongoose");
const app = express();
const uuid = require("uuid");
const cors = require("cors");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const dburl = process.env.DBURL;
// const session = require("cookie-session");
const session = require("express-session");
var MongoDBStore = require("connect-mongodb-session")(session);

const port = 4000;
app.use(express.json());
// app.use(
//   cors({
//     origin: ["*"],
//     methods: ["GET", "POST"],
//     credentials: true,
//     maxAge: 86400, // cache for one day
//   })
// );
// Allow CORS from any origin (*)
// Allow CORS from your Chrome extension's origin
app.use(
  cors({
    origin: ["http://localhost:3000"],
    credentials: true, // Don't forget to enable credentials
  })
);

mongoose.connect(dburl, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
const mdb = mongoose.connection;
mdb.on("error", (error) => console.error(error));
mdb.once("open", () => console.log("Connected to Mongoose"));

var store = new MongoDBStore({
  uri: dburl,
  collection: "mySessions",
});

store.on("error", function (error) {
  console.error("Session store error:", error);
});

app.use(
  session({
    name: "pain",
    secret: "mySecret", // Replace with your own secret key
    resave: false,
    saveUninitialized: true,
    store: store,
    cookie: {
      maxAge: 24 * 60 * 10 * 1000, // Session duration in milliseconds (5 minutes)
    },
  })
);

// Destroy all sessions when the server starts
store.clear((error) => {
  if (error) {
    console.error("Error clearing sessions:", error);
  } else {
    console.log("All sessions destroyed.");
  }
});

const { Configuration, OpenAIApi } = require("openai");
const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

const axios = require("axios");

// Set the OpenAI API endpoint.
const config = {
  headers: {
    "Content-Type": "application/json",
    Authorization: "Bearer " + process.env.OPENAI_API_KEY,
  },
};

const { exec } = require("child_process");

const Snoowrap = require("snoowrap");

const client = new Snoowrap({
  userAgent: "myBotFH v1.0",
  clientId: process.env.clientId,
  clientSecret: process.env.clientSecret,
  username: process.env.user,
  password: process.env.password,
});

async function fetchTopMemes(req, subReddit) {
  console.log(client.username);
  // console.log(subReddit);
  if (!subReddit) {
    subReddit = "dankmemes";
  }

  //dankmemes
  const subreddit = await client.getSubreddit(subReddit);
  const topPosts = await subreddit.getTop({ time: "day", limit: 20 });
  // const topPosts = await subreddit.getNew({ limit: 20 });
  console.log("fetching...");

  const memes = topPosts.map((post) => ({
    title: post.title,
    url: post.url,
    id: post.id,
  }));

  // req.session.memes = memes;
  req.session.memes = {
    data: memes,
    clearAfter: Date.now() + 5 * 60 * 1000, // Set to clear after 1 minute
  };

  // console.log(req.session);

  return memes;
}

app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  // res.setHeader(
  //   "Access-Control-Allow-Origin",
  //   `chrome-extension://jjoicfpbcklniccpchgngaibfnjbjkfb`
  // );
  res.setHeader("Access-Control-Allow-Origin", `*`);
  next(); // call next() to move on to the next middleware or route handler
});

const saveVideo = require("./routes/saveVideo");
app.use("/saveVideo", saveVideo);

// Middleware to clear session data if it's expired
const clearSessionData = (req, res, next) => {
  if (req.session.memes && req.session.memes.clearAfter <= Date.now()) {
    // Clear the session data
    req.session.memes = null; // You can set it to null or delete it as needed
    console.log("Memes cleared from session after 1 minute.");
  }
  next();
};

app.get("/memes", clearSessionData, (req, res) => {
  // console.log(req.session);
  let subReddit = req.query.subReddit; // Read the 'subReddit' query parameter

  if (!subReddit) {
    console.log("no sub reddit value");
  }
  console.log(req.session);
  if (req.session.memes) {
    console.log("fetching memes from session");
    return res.status(200).json({ memes: req.session.memes.data });
  }

  fetchTopMemes(req, subReddit).then((memes) => {
    // req.session.memes = memes;

    res.status(200).json({ memes: memes });
  });
});

let chatHistory = [];

app.get("/getSession", (req, res) => {
  console.log(req.session);
  res.send(req.session);
});

app.post("/test", async (req, res) => {
  let userInput = req.body.data.userInput;
  console.log(req.body.data.userInput);

  const GPT4Message = { role: "user", content: userInput };
  const GPT4 = async (message) => {
    // Create a new message object with the user input

    // Add the new message to the chat history
    if (chatHistory.length < 20) {
      // If the chat history is not at the size limit, add the new message to the end
      chatHistory.push(message);
    } else {
      // If the chat history is at the size limit, remove the oldest item and add the new message to the end
      chatHistory.shift();
      chatHistory.push(message);
    }

    const response = await openai.createChatCompletion({
      // You need early access to GPT-4, otherwise use "gpt-3.5-turbo"
      model: "gpt-4",
      messages: chatHistory,
    });
    const responseObject = response.data.choices[0].message;

    // Add the response message to the chat history
    if (chatHistory.length < 20) {
      // If the chat history is not at the size limit, add the response message to the end
      chatHistory.push(responseObject);
    } else {
      // If the chat history is at the size limit, remove the oldest item and add the response message to the end
      chatHistory.shift();
      chatHistory.push(responseObject);
    }

    console.log(response.data.choices[0].message);
    return response.data.choices[0].message.content;
  };

  const response = await GPT4(GPT4Message);
  console.log(response);
  res.send(chatHistory);
  console.log(chatHistory);
});

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

app.post("/openFile", async (req, res) => {
  let filePath = req.body.data.filePath;
  console.log(req.body.data.filePath);
  openFileInChrome(filePath);
  res.send("success");
});

const applescript = require("applescript");

app.get("/volume", async (req, res) => {
  let app = req.query.app;
  console.log(app);
  const volume = 50;

  const script = `
    tell application "Google Chrome"
      set volume output volume ${volume}
    end tell
  `;

  applescript.execString(script, (err, result) => {
    if (err) {
      console.error(err);
      return;
    }
    console.log(`Volume set to ${volume} for ${app}`);
  });
  // Use the value of 'app' to control the volume of the corresponding app
  res.send("success");
});

app.post("/takeScreenShot", async (req, res) => {
  takeScreenShot();
  res.send("success");
});

//here

// Set up Multer to handle file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    cb(
      null,
      file.fieldname + "-" + Date.now() + path.extname(file.originalname)
    );
  },
});
const upload = multer({ storage });

// Set up the POST route to handle image uploads
app.post("/api/upload", upload.single("image"), (req, res) => {
  // Get the file data from the request
  const file = req.file;

  // If no file was received, send an error response
  if (!file) {
    return res.status(400).send("No file uploaded");
  }
  console.log("File saved successfully");
  // Send a success response
  res.status(200).send("File uploaded successfully");
});

app.get("/testing", async (req, res) => {
  console.log("/testing route has been requested");
  res.json({ message: "hello world from backend server, this is pain" });
});

app.get("/simulate-request", (req, res) => {
  console.log("simulate-request was requested");
  res.status(200).json({ message: "simulate-request success" });
});
app.get("/simulate-response", (req, res) => {
  console.log("simulate-response was requested");
  res.status(200).json({ message: "simulate-response success" });
});

app.get("/reactMessage", (req, res) => {
  console.log("simulate-response was requested from react chrome extension");
  res
    .status(200)
    .json({ message: "simulate-response success from server port 4000" });
});

app.get("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error("Error destroying session:", err);
    } else {
      console.log("Session destroyed successfully");
      // Redirect or respond as needed after session is cleared
      res.redirect("/");
    }
  });
});

const API_URL = process.env.CANVAS_API_URL;
const API_KEY = process.env.CANVAS_API_KEY;
const COURSE_ID = "28813";

const axiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    Authorization: `Bearer ${API_KEY}`,
  },
});

function getAllAssignments(courseId, groupId, page = 1, assignments = []) {
  return axiosInstance
    .get(
      `courses/${courseId}/assignment_groups/${groupId}/assignments?page=${page}`
    )
    .then((response) => {
      const newAssignments = response.data;
      assignments.push(...newAssignments);

      // Check if there are more pages
      const nextPageUrl = getNextPageUrl(response.headers.link);

      if (nextPageUrl) {
        // Recursively fetch the next page
        return getAllAssignments(courseId, groupId, page + 1, assignments);
      } else {
        // No more pages, return the aggregated assignments
        return assignments;
      }
    });
}

function getNextPageUrl(linkHeader) {
  const links = linkHeader.split(", ");
  for (const link of links) {
    const [url, rel] = link.split("; ");
    if (rel.includes("next")) {
      return url.slice(1, -1); // Remove angle brackets around URL
    }
  }
  return null;
}

app.get("/getTasks", async (req, res) => {
  try {
    const assignments = await getAllAssignments(COURSE_ID, 75241);
    //console.log(assignments);
    res.status(200).json({ message: assignments });
  } catch (error) {
    // Handle errors appropriately
    console.error(error);
    res.status(500).json({ error: "An error occurred" });
  }
});

// function getCourseAssignments() {
//   return new Promise((resolve, reject) => {
//     axiosInstance
//       .get(`courses/${COURSE_ID}/assignment_groups`)
//       .then((response) => {
//         const assignments_groups = response.data;

//         resolve(assignments_groups);
//       })
//       .catch((err) => {
//         console.error(err.message);
//         reject(err);
//       });
//   });
// }
function getCourseAssignments(id) {
  return new Promise((resolve, reject) => {
    axiosInstance
      .get(`courses/${id}/assignment_groups`)
      .then((response) => {
        const assignments_groups = response.data;

        resolve(assignments_groups);
      })
      .catch((err) => {
        console.error(err.message);
        reject(err);
      });
  });
}

app.get("/getCourseAssignments", (req, res) => {
  getCourseAssignments()
    .then((assignmentList) => {
      //console.log(assignmentList);
      res.status(200).json({ message: assignmentList });
    })
    .catch((error) => {
      // Handle errors appropriately
      console.error(error);
      res.status(500).json({ error: "An error occurred" });
    });
});

app.get("/courses", async (req, res) => {
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader(
    "Access-Control-Allow-Origin",
    `chrome-extension://${process.env.CHROME_EXTENSION_THREE_ID}`
  );
  try {
    // Define the end date filter
    const endDateFilter = "2023-12-10T07:00:00Z"; // Adjust this to your desired end date

    // Define the parameters to filter courses
    const params = {
      enrollment_state: "active", // Only active courses
    };
    if (req.session.courses) {
      console.log("fetching courses from session");
      return res.status(200).json({ courses: req.session.courses });
    }
    axiosInstance
      .get(`courses`, { params })
      .then(async (response) => {
        // Filter courses based on the end date
        const filteredCourses = response.data.filter((course) => {
          const endDate = new Date(course.end_at);

          // Check if the course ends after the specified date
          return endDate >= new Date(endDateFilter);
        });
        console.log("fetching courses from canvas");
        // console.log(filteredCourses);
        const filteredCoursesData = filteredCourses.map((course) => {
          const { id, name, start_at, end_at } = course;
          return { id, name, start_at, end_at };
        });

        for (let i = 0; i < filteredCoursesData.length; i++) {
          const course = filteredCoursesData[i].id;
          console.log(course);
          const assignments = await getCourseAssignments(course);
          filteredCoursesData[i].assignments = assignments;

          for (let j = 0; j < assignments.length; j++) {
            const assignment = assignments[j].id;
            const submissions = await getAllAssignments(course, assignment);
            assignments[j].submissions = submissions;
          }
          // const tasks = await getAllAssignments(course, 75241);
          //course.assignments = assignments;
        }

        // await getCourseGroups(filteredCoursesData);
        req.session.courses = filteredCoursesData;
        return res.status(200).json({ courses: filteredCoursesData });
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

app.post("/generatePromp", async (req, res) => {
  const prompt = req.body.data.prompt;
  console.log(prompt);

  const data = {
    model: "text-davinci-003",

    // model: "text-curie-001",
    //make up something a reply to the following message in a dumb, funny, cringy, controverisal, unethical way
    prompt: `message: ${prompt} , respond in a  dumb, funny, horny, cringy, controverisal, way as an another user reading this message`,
    //prompt: `message: ${prompt} , respond in a sad, suicidal, depressed, emo, pesemistic, controverisal, unethical way way as an another user reading this message`,
    //  prompt: `message: ${prompt} , respond in a  dumb, pissed, angray, mad, controverisal, way as an another user reading this message`,

    max_tokens: 324,
    temperature: 0.5,
  };

  axios
    .post("https://api.openai.com/v1/completions", data, config)
    .then((response) => {
      console.log(response.data);
      res.send(response.data.choices[0].text);
    })
    .catch((error) => {
      console.error(error);
    });
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
