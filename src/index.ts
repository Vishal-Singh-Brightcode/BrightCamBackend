// server.js
import express from "express";
import https from "http";
const socketIo = require("socket.io");
import cors from "cors";
import { authRouter } from "./routes/auth/index";
import { connectToDatabase } from "./configs/dbConfig";
import bodyParser from "body-parser";
const path = require("path");
import fs from "fs/promises";
import jwtMiddleware from "./middlewares/auth";
import { userRouter } from "./routes/user/index";
import { joinCall } from "./controllers/user_utility";
import { intitializeSocketConnection } from "./services/socket-io";
import { meetingRouter } from "./routes/meeting";
import { sendPushNotification } from "./services/pushNotifications";
import schedule from "node-schedule";

const PORT = process.env.PORT || 4000;

const app = express();

app.use(express.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.use((req, res, next) => {
  console.log(
    "Url:",
    req.originalUrl,
    "\n",
    "Method:",
    req.method,
    "\n",
    "Query params:",
    req.query,
    "Params:",
    req.params,
    "\n",
    "Body:",
    req.body
  );

  next();
});

app.use(cors());

app.get("/greet-me", (req, res) => {
  const name = req.query?.name || "User";
  res.status(200).send(`Hello ${name} `);
});

app.get("/push-test", async (req, res) => {
  await sendPushNotification();
  res.status(200).send("ok");
});

app.get("/join-call/:hostId/:joineeId/:meetingId/:passcode", joinCall);

app.use(authRouter);

app.use(userRouter);

app.use(meetingRouter);
//app.use(jwtMiddleware);

//const staticFilesPath = path.join(__dirname, "public/assetLinks.json");

//app.use("/.well-known/.assetlinks.json", express.static(staticFilesPath));

const imagesPath = path.join(__dirname, "public/assets");

app.use(express.static(imagesPath));
app.use(express.static(path.join(__dirname, "public/webrtc")));

const server = https.createServer(app);

intitializeSocketConnection(server);

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  connectToDatabase();
});
