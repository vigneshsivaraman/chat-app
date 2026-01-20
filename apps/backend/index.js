
require("dotenv").config();

const connectDB = require("./db");
const Message = require("./models/Message");

connectDB();


const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

const app = express();
app.use(cors());

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

// 🔥 Track online users per room
const onlineUsers = {};
// { roomName: Set([username1, username2]) }

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  // 👉 Join room
  socket.on("join_room", async ({ username, room }) => {
    try {
      socket.username = username;
      socket.room = room;
  
      socket.join(room);
  
      // ---- LOAD CHAT HISTORY FOR THIS USER ONLY ----
      const previousMessages = await Message.find({ room })
        .sort({ createdAt: 1 })
        .limit(50);
  
      // ✅ SEND HISTORY ONLY TO THE JOINING USER
      socket.emit("chat_history", previousMessages);
  
      // ---- ONLINE USERS ----
      if (!onlineUsers[room]) {
        onlineUsers[room] = new Set();
      }
  
      onlineUsers[room].add(username);
  
      io.to(room).emit("online_users", Array.from(onlineUsers[room]));
  
      // ---- SYSTEM MESSAGE (TO OTHERS ONLY) ----
      socket.to(room).emit("receive_message", {
        message: `${username} joined the chat`,
        system: true,
      });
    } catch (err) {
      console.error("❌ join_room error:", err);
    }
  });
  
  
  

  // 👉 Send message (room based)
  // socket.on("send_message", ({ message, username, room }) => {
  //   io.to(room).emit("receive_message", {
  //     message,
  //     username,
  //   });
  // });



  socket.on("send_message", async ({ message, username, room }) => {
    if (!message || !room || !username) return;
  
    const newMessage = await Message.create({
      room,
      username,
      message,
    });
  
    io.to(room).emit("receive_message", {
      message: newMessage.message,
      username: newMessage.username,
      createdAt: newMessage.createdAt,
    });
  });
  

  // 👉 Typing indicator
  socket.on("typing", () => {
    socket.to(socket.room).emit("user_typing", {
      username: socket.username,
    });
  });

  socket.on("stop_typing", () => {
    socket.to(socket.room).emit("user_stop_typing");
  });

  // 👉 Handle disconnect
  socket.on("disconnect", () => {
    const { room, username } = socket;

    if (room && onlineUsers[room]) {
      onlineUsers[room].delete(username);

      io.to(room).emit("online_users", Array.from(onlineUsers[room]));

      socket.to(room).emit("receive_message", {
        message: `${username} left the chat`,
        system: true,
      });
    }

    console.log("User disconnected:", socket.id);
  });
});

server.listen(5000, () => {
  console.log("✅ Backend running on http://localhost:5000");
});
