const { Client } = require('pg');
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  }
});

const pgClient = new Client({
  host: process.env.PGHOST,
  user: process.env.PGUSER,
  password: process.env.PGPASSWORD,
  database: process.env.PGDATABASE,
});

pgClient.connect();

pgClient.query('LISTEN category_changes');

pgClient.on('notification', (msg) => {
  const payload = JSON.parse(msg.payload);
  io.emit('categoryChanges', payload);
});

io.on('connection', (socket) => {
  console.log('Yeni bir istemci bağlandı');

  socket.on('listenCategoryId', (categoryId) => {
    console.log(`İstemci ${categoryId} ID'sine sahip kayıtları dinliyor.`);

    pgClient.on('notification', (msg) => {
      const payload = JSON.parse(msg.payload);
      console.log(payload);
      if (payload.id === parseInt(categoryId, 10)) {
        socket.emit(`categoryChange-${categoryId}`, payload);
      }
    });
  });
});

server.listen(4000, () => {
  console.log('Socket.IO sunucusu 4000 portunda çalışıyor');
});

