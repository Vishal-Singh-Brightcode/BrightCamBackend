const socketIo = require("socket.io");
export let io;
const meetingRooms = {};

export let connectedUsers = {};
export let participants = [];

export const intitializeSocketConnection = (server) => {
  io = socketIo(server, {
    cors: {
      origin: "*",
    },
  });

  // Socket.IO event handling
  io.on("connection", (socket) => {
    socket.on("joining-call", (data, greet) => {
      console.log("joinee data => ", data);
      const { meetingId, meetingPasscode, hostId, joineeId } = data;

      console.log(`${joineeId} has joined the call`);

      socket.join(meetingId);

      socket.join(joineeId);

      io.to(meetingId).emit("someone-got-connected", data);

      greet(`Hello ${joineeId}`);
    });

    socket.on("reconnect", (data) => {
      console.log(socket.user, " got re-connected");
    });

    // Handle "offer" event from the client
    socket.on("offer", (data) => {
      const { to, from, offer, meetingDetails } = data;
      console.log("meetingDetails when getting offer ==> ", meetingDetails);
      if (meetingDetails) {
        const { meetingId } = meetingDetails;

        io.to(meetingId).emit("offer", { to, from, offer, meetingDetails });
        console.log("Got an offer from ", from, " for ", to);
      }
    });

    // Handle "answer" event from the client
    socket.on("call-answered", (data) => {
      const { to, from, answer, meetingDetails } = data;
      if (meetingDetails) {
        const { meetingId } = meetingDetails;

        io.to(meetingId).emit("answer", { to, from, answer, meetingDetails });
        console.log("Got an answer from ", from, " for ", to);
      }
    });

    // Handle "candidate" event from the client
    socket.on("ice-candidate", (data) => {
      const { to, from, iceCandidate, meetingDetails } = data;

      if (meetingDetails) {
        const { meetingId } = meetingDetails;
        io.to(meetingId).emit("ice-candidate", {
          to,
          from,
          iceCandidate,
          meetingDetails,
        });
        // console.log(`Got candidate from ${from} for ${to}`);
      }
    });

    socket.on("send-msg", (data) => {
      const { to, from, msg, meetingDetails } = data;
      const { meetingId } = meetingDetails;

      io.to(meetingId).emit("message", data);
      console.log("Got ", msg, " from ", from, " for ", to);
    });

    socket.on("iam-sharing-screen", (data) => {
      const { meetingId } = data.meetingDetails;
      io.to(meetingId).emit("user-sharing-screen", data);
    });

    socket.on("i-have-stopped-sharing-screen", (data) => {
      const { meetingId } = data.meetingDetails;
      io.to(meetingId).emit("user-stopped-sharing-screen", data);
    });

    socket.on("raise-hand", (data) => {
      const { to, from, meetingDetails } = data;
      const { meetingId } = meetingDetails;

      io.to(meetingId).emit("hand-raised", data);
      console.log(`${from} raised hand`);
    });

    socket.on("mute-all", (data) => {
      console.log("Mute all triggered", data);
      const { meetingDetails } = data;
      const { meetingId } = meetingDetails;
      io.to(meetingId).emit("mute", data);
    });
    socket.on("unmute-all", (data) => {
      console.log("UnMute all triggered", data);
      const { meetingDetails } = data;
      const { meetingId } = meetingDetails;
      io.to(meetingId).emit("unmute", data);
    });
    socket.on("hide-all", (data) => {
      console.log("Hide all triggered", data);
      const { meetingDetails } = data;
      const { meetingId } = meetingDetails;
      io.to(meetingId).emit("hide", data);
    });
    socket.on("unhide-all", (data) => {
      console.log("Unhide all triggered", data);
      const { meetingDetails } = data;
      const { meetingId } = meetingDetails;
      io.to(meetingId).emit("unhide", data);
    });
    socket.on("allow-screen-sharing", (data) => {
      console.log("allow-screen-sharing", data);
      const { meetingDetails } = data;
      const { meetingId } = meetingDetails;
      io.to(meetingId).emit("allow-screen-sharing", data);
    });
    socket.on("disallow-screen-sharing", (data) => {
      console.log("disallow-screen-sharing", data);
      const { meetingDetails } = data;
      const { meetingId } = meetingDetails;
      io.to(meetingId).emit("disallow-screen-sharing", data);
    });
    socket.on("allow-chatting", (data) => {
      console.log("allow-chatting", data);
      const { meetingDetails } = data;
      const { meetingId } = meetingDetails;
      io.to(meetingId).emit("allow-chatting", data);
    });
    socket.on("disallow-chatting", (data) => {
      console.log("disallow-chatting", data);
      const { meetingDetails } = data;
      const { meetingId } = meetingDetails;
      io.to(meetingId).emit("disallow-chatting", data);
    });
    socket.on("hands-down-all", (data) => {
      console.log("Hands down all", data);
      const { meetingDetails } = data;
      const { meetingId } = meetingDetails;
      io.to(meetingId).emit("hands-down-all", data);
    });

    socket.on("mute", (data) => {
      console.log("Mute  triggered", data);
      const { recipient, meetingDetails } = data;
      const { meetingId } = meetingDetails;
      io.to(recipient).emit("mute", data);
    });
    socket.on("unmute", (data) => {
      console.log("UnMute  triggered", data);
      const { recipient, meetingDetails } = data;
      const { meetingId } = meetingDetails;
      io.to(recipient).emit("unmute", data);
    });
    socket.on("hide", (data) => {
      console.log("Hide  triggered", data);
      const { recipient, meetingDetails } = data;
      const { meetingId } = meetingDetails;
      io.to(recipient).emit("hide", data);
    });
    socket.on("unhide", (data) => {
      console.log("Unhide  triggered", data);
      const { recipient, meetingDetails } = data;
      const { meetingId } = meetingDetails;
      io.to(recipient).emit("unhide", data);
    });
    socket.on("make-host", (data) => {
      console.log("Make host triggered", data);
    });
    socket.on("make-co-host", (data) => {
      console.log("Make co-host triggered", data);
    });
  });
};
