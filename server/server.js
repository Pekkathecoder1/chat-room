import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';

const app = express();
const server = createServer(app);

// Allow connections from your Vite frontend on localhost:5173
const io = new Server(server, {
  cors: {
    origin: 'http://localhost:5173',
    methods: ['GET', 'POST']
  }
});

io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  // 1. Join an actual Socket.io room using socket.join(room)
  socket.on('join_room', ({ username, room }) => {
    socket.join(room); // 👉 Built-in Socket.io room membership
    socket.data.username = username;
    socket.data.room = room;

    console.log(`User '${username}' (${socket.id}) joined room: '${room}'`);

    // Broadcast system message ONLY to clients in THIS room
    io.to(room).emit('message', {
      id: Date.now() + '-' + Math.random().toString(36).substring(2, 9),
      sender: 'System',
      text: `${username} joined room #${room}`,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isSystem: true
    });
  });

  // 2. Broadcast message ONLY to clients in the specified room
  socket.on('send_message', (data) => {
    console.log(`[Room: ${data.room}] [${data.sender}]: ${data.text}`);
    // io.to(data.room) ensures messages only reach members of this room
    io.to(data.room).emit('message', data);
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

const PORT = 2000;
server.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});
