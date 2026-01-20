import { useEffect, useState, useRef } from "react";
import {
  connectSocket,
  joinRoom,
  sendMessage,
  onMessage,
  startTyping,
  onChatHistory,
  stopTyping,
  onUserTyping,
  onUserStopTyping,
  onOnlineUsers,
} from "@chat/shared";

function App() {

  const hasJoinedRef = useRef(false);

  const [username, setUsername] = useState("");
  const [room, setRoom] = useState("");
  const [joined, setJoined] = useState(false);

  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);

  const [typingUser, setTypingUser] = useState("");
  const [onlineUsers, setOnlineUsers] = useState([]);

  useEffect(() => {
    connectSocket();
  
    onChatHistory((history) => {
      setMessages(history);
    });
    
    const handleMessage = (data) => {
      setMessages((prev) => [...prev, data]);
    };
  
    const handleTyping = ({ username }) => {
      setTypingUser(username);
    };
  
    const handleStopTyping = () => {
      setTypingUser("");
    };
  
    const handleOnlineUsers = (users) => {
      setOnlineUsers(users);
    };
  
    onMessage(handleMessage);
    onUserTyping(handleTyping);
    onUserStopTyping(handleStopTyping);
    onOnlineUsers(handleOnlineUsers);
  }, []);
  
  

  const handleJoin = () => {
    if (!username || !room) return;
  
    // 🔐 Prevent double join (React StrictMode safe)
    if (hasJoinedRef.current) return;
    hasJoinedRef.current = true;
  
    joinRoom(username, room);
    setJoined(true);
  };
  

  const handleSend = () => {
    if (!message.trim()) return;
    sendMessage(message, username, room);
    setMessage("");
    stopTyping();
  };

  // 👉 JOIN SCREEN
  if (!joined) {
    return (
      <div style={{ padding: 20 }}>
        <h2>Join Chat</h2>
        <input
          placeholder="Username"
          onChange={(e) => setUsername(e.target.value)}
        />
        <input
          placeholder="Room"
          onChange={(e) => setRoom(e.target.value)}
        />
        <button onClick={handleJoin}>Join</button>
      </div>
    );
  }

  // 👉 CHAT SCREEN
  return (
    <div style={{ padding: 20 }}>
      <h2>💬 Room: {room}</h2>

      <h4>Online Users</h4>
      <ul>
        {onlineUsers.map((user) => (
          <li key={user}>{user}</li>
        ))}
      </ul>

      <div style={{ height: 300, overflowY: "auto", border: "1px solid #ccc" }}>
        {messages.map((msg, i) => (
          <div key={i}>
            <b>{msg.username || "System"}:</b> {msg.message}
          </div>
        ))}
      </div>

      {typingUser && (
        <p style={{ fontStyle: "italic" }}>
          {typingUser} is typing...
        </p>
      )}

      <input
        value={message}
        onChange={(e) => {
          setMessage(e.target.value);
          startTyping();

          clearTimeout(window.__typingTimer);
          window.__typingTimer = setTimeout(() => {
            stopTyping();
          }, 1000);
        }}
        placeholder="Type a message"
      />

      <button onClick={handleSend}>Send</button>
    </div>
  );
}

export default App;
