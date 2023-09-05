const express = require("express");
require("dotenv").config();
const app = express();
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

// app.post("/test", async (req, res) => {
//   const { userInput } = req.body;
//   console.log(userInput);

//   const completion = await openai.createChatCompletion({
//     model: "gpt-3.5-turbo",
//     messages: [{ role: "user", content: "how big is the world" }],
//   });
//   console.log(completion.data.choices[0].message);
//   const message = completion.data.choices[0].message;

//   res.setHeader(
//     "Access-Control-Allow-Origin",
//     "chrome-extension://oncdekifioignmogohajhaecbgoenljk"
//   );
//   res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
//   res.setHeader("Access-Control-Allow-Headers", "Content-Type");

//   res.send(message.content);
// });
//----------------------------------------------------------
app.post("/test", async (req, res) => {
  //   const { userInput } = req.body;
  let userInput = req.body.data.userInput;
  console.log(req.body.data.userInput);
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader(
    "Access-Control-Allow-Origin",
    "chrome-extension://oncdekifioignmogohajhaecbgoenljk"
  );

  const completion = await openai.createChatCompletion({
    model: "gpt-3.5-turbo",
    messages: [{ role: "user", content: userInput }],
  });
  console.log(completion.data.choices[0].message);
  const message = completion.data.choices[0].message;
  res.send(message.content);
});
//-----------------------------------------------------------
// app.post("/test", async (req, res) => {
//   const userInput = req.query.userInput;
//   console.log(userInput);

//   const completion = await openai.createChatCompletion({
//     model: "gpt-3.5-turbo",
//     messages: [{ role: "user", content: userInput }],
//   });
//   console.log(completion.data.choices[0].message);
//   const message = completion.data.choices[0].message;

//   res.setHeader("Access-Control-Allow-Origin", "*");
//   res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
//   res.setHeader("Access-Control-Allow-Headers", "Content-Type");

//   res.send(message.content);
// });
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});

// app.post("/test", async (req, res) => {
//   const { userInput } = req.body;
//   res.setHeader(
//     "Access-Control-Allow-Origin",
//     "chrome-extension://oncdekifioignmogohajhaecbgoenljk"
//   );

//   console.log(userInput);

//   const completion = await openai.createChatCompletion({
//     model: "gpt-3.5-turbo",
//     messages: [{ role: "user", content: "how big is the world" }],
//   });
//   console.log(completion.data.choices[0].message);
//   const message = completion.data.choices[0].message;
//   res.send(message.content);
// });
