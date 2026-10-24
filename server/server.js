import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Message } from './models/message.js';

dotenv.config();

const app = express();
const server = createServer(app);

// 1. Connect to MongoDB Atlas
const MONGO_URI =
  process.env.MONGO_URI ||
  'mongodb+srv://itzmeherehddb_db_user:Al7oWG4cT6y48feO@cluster0.fwlawxv.mongodb.net/chat-app?appName=Cluster0';
mongoose
  .connect(MONGO_URI)
  .then(() => console.log('✅ Connected to MongoDB successfully!'))
  .catch((err) => console.error('❌ MongoDB connection error:', err));

// 2. Allow connections from your Vite frontend on localhost:5173
const io = new Server(server, {
  cors: {
    origin: 'http://localhost:5173',
    methods: ['GET', 'POST']
  }
});

io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  // 1. Join room: subscribes socket, loads history from MongoDB, announces arrival
  socket.on('join_room', async ({ username, room }) => {
    socket.join(room);
    socket.data.username = username;
    socket.data.room = room;

    console.log(`User '${username}' (${socket.id}) joined room: '${room}'`);

    try {
      // Fetch the last 50 messages for this room from MongoDB
      const history = await Message.find({ room }).sort({ createdAt: 1 }).limit(50);
      // Send chat history ONLY to the user who just joined
      socket.emit('load_history', history);
    } catch (err) {
      console.error('Error fetching chat history from MongoDB:', err);
    }

    // Broadcast system arrival message to everyone in this room
    io.to(room).emit('message', {
      id: Date.now() + '-' + Math.random().toString(36).substring(2, 9),
      sender: 'System',
      text: `${username} joined room #${room}`,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isSystem: true
    });
  });

  // 2. Send message: broadcasts immediately to the room, then saves to MongoDB
  socket.on('send_message', async (data) => {
    console.log(`[#${data.room}] [${data.sender}]: ${data.text}`);

    // Broadcast immediately so UI updates without any database delay
    io.to(data.room).emit('message', data);

    // Save to MongoDB in background
    try {
      await Message.create({
        sender: data.sender,
        room: data.room,
        text: data.text,
        time: data.time
      });
      console.log('✅ Message saved to MongoDB');
    } catch (err) {
      console.error('❌ Error saving message to MongoDB:', err.message);
    }
  });

  // 3. User disconnects
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    if (socket.data.username && socket.data.room) {
      io.to(socket.data.room).emit('message', {
        id: Date.now() + '-' + Math.random().toString(36).substring(2, 9),
        sender: 'System',
        text: `${socket.data.username} left room #${socket.data.room}`,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isSystem: true
      });
    }
  });
});

const PORT = process.env.PORT || 2000;
server.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});
