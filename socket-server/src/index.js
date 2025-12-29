const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
require('dotenv').config({ path: '../.env' });

const app = express();
app.use(cors());

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: process.env.NEXTAUTH_URL || 'http://localhost:3000',
    methods: ['GET', 'POST'],
  },
});

const userSockets = new Map(); // userId -> socketId

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('authenticate', (userId) => {
    userSockets.set(userId, socket.id);
    socket.userId = userId;
    console.log(`User ${userId} authenticated`);
  });

  socket.on('join:penpal', (penpalId) => {
    socket.join(`penpal:${penpalId}`);
    console.log(`User ${socket.userId} joined penpal room ${penpalId}`);
  });

  socket.on('message:send', async (data) => {
    const { penpalId, content, type, recipientId } = data;
    
    // Broadcast to penpal room
    io.to(`penpal:${penpalId}`).emit('message:receive', {
      id: data.messageId,
      penpalId,
      senderId: socket.userId,
      content,
      type,
      createdAt: new Date().toISOString(),
    });

    // Send notification to recipient if online
    const recipientSocketId = userSockets.get(recipientId);
    if (recipientSocketId) {
      io.to(recipientSocketId).emit('notification:new-message', {
        from: socket.userId,
        penpalId,
      });
    }
  });

  socket.on('message:read', (data) => {
    const { penpalId, messageIds } = data;
    io.to(`penpal:${penpalId}`).emit('messages:marked-read', {
      messageIds,
      readBy: socket.userId,
    });
  });

  socket.on('typing:start', (data) => {
    const { penpalId, recipientId } = data;
    const recipientSocketId = userSockets.get(recipientId);
    if (recipientSocketId) {
      io.to(recipientSocketId).emit('typing:indicator', {
        userId: socket.userId,
        isTyping: true,
      });
    }
  });

  socket.on('typing:stop', (data) => {
    const { penpalId, recipientId } = data;
    const recipientSocketId = userSockets.get(recipientId);
    if (recipientSocketId) {
      io.to(recipientSocketId).emit('typing:indicator', {
        userId: socket.userId,
        isTyping: false,
      });
    }
  });

  socket.on('penpal:matched', (data) => {
    const { userId, penpalId } = data;
    const userSocketId = userSockets.get(userId);
    if (userSocketId) {
      io.to(userSocketId).emit('notification:matched', { penpalId });
    }
  });

  socket.on('disconnect', () => {
    if (socket.userId) {
      userSockets.delete(socket.userId);
      console.log(`User ${socket.userId} disconnected`);
    }
  });
});

const PORT = process.env.SOCKET_PORT || 3001;
httpServer.listen(PORT, () => {
  console.log(`Socket.io server running on port ${PORT}`);
});
