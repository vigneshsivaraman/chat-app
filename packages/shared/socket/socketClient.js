import { io } from "socket.io-client";

let socket = null;
let hasJoined = false;

/**
 * Create ONE socket instance only
 */
export const connectSocket = () => {
  if (!socket) {
    socket = io("http://localhost:5000", {
      transports: ["websocket"],
    });

    socket.on("connect", () => {
      console.log("✅ Socket connected:", socket.id);
    });
  }

  return socket;
};

/**
 * Join room ONLY ONCE per browser tab
 */
let joinedRoom = null;

export const joinRoom = (username, room) => {
  if (!socket) return;

  // allow rejoin after refresh, but prevent duplicate same-room joins
  if (joinedRoom === room) return;

  joinedRoom = room;
  socket.emit("join_room", { username, room });
};


/**
 * Send message
 */
export const sendMessage = (message, username, room) => {
  if (!socket) return;
  socket.emit("send_message", { message, username, room });
};

/**
 * ---- Event listeners (safe) ----
 * We remove the listener before adding it again
 * This prevents duplicates in React StrictMode
 */

export const onMessage = (callback) => {
  if (!socket) return;
  socket.off("receive_message");
  socket.on("receive_message", callback);
};

// --- typing indicator ---
export const startTyping = () => {
  if (!socket) return;
  socket.emit("typing");
};

export const stopTyping = () => {
  if (!socket) return;
  socket.emit("stop_typing");
};

export const onUserTyping = (callback) => {
  if (!socket) return;
  socket.off("user_typing");
  socket.on("user_typing", callback);
};

export const onUserStopTyping = (callback) => {
  if (!socket) return;
  socket.off("user_stop_typing");
  socket.on("user_stop_typing", callback);
};

// --- online users ---
export const onOnlineUsers = (callback) => {
  if (!socket) return;
  socket.off("online_users");
  socket.on("online_users", callback);
};


export const onChatHistory = (callback) => {
  if (!socket) return;
  socket.off("chat_history");
  socket.on("chat_history", callback);
};
