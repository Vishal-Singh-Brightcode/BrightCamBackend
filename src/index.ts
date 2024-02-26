// server.js
import express from 'express';
import http from 'http';
const socketIo = require('socket.io');
import cors from 'cors';
import { authRouter } from './routes/auth/index'
import { connectToDatabase } from './configs/dbConfig';
import bodyParser from 'body-parser';

const PORT = process.env.PORT || 4000;

const app = express();

app.use(express.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.use((req, res, next) => {
  console.log("Url:", req.originalUrl, '\n', "Method:", req.method, '\n', "Query params:", req.query, "Params:", req.params, '\n', "Body:", req.body);
  next();
});

app.use(cors());

connectToDatabase();

app.use(authRouter);

const server = http.createServer(app);
const io = socketIo(server);

const users: any = {};

io.on('connection', (socket: any) => {
  console.log('a user connected');

  socket.on('join', (userId: any) => {
    console.log("User with id ", userId, " joined the chat");
    users[userId] = socket.id;
  });

  socket.on('send_message', ({ senderId, receiverId, message }: { senderId: string, receiverId: string, message: string }) => {
    const receiverSocketId = users[receiverId];
    io.to(receiverSocketId).emit('receive_message', {
      senderId,
      message,
    });
  });

  socket.on('disconnect', () => {
    console.log('user disconnected');
  })
});

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
