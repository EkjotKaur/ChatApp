const express = require('express');
const http = require('http');
const socket = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socket(server, {
  cors: {
    origin: "*"
  }
});

const {addUser, removeUser, getUser, getUsersInRoom} = require('./user');

const route = require('./routes');

app.use(route)

// app.use('*', (req, res, next) => {
//   res.header('Access-Control-Allow-Origin', '*');
//   next();
// })

io.on('connection', (socket) => {
  console.log("Connected!");

  socket.on('join', ({name, room}, callback) => {
    // console.log(name, room);
    const {error, user} = addUser({id: socket.id, name, room});

    if(error) return callback(error);


    socket.emit('message', {user: 'admin', text: `${user.name}, welcome to the room ${user.room}`});
    socket.broadcast.to(user.room).emit('message', {user: 'admin', text: `${user.name}, has joined`});

    socket.join(user.room);

    io.to(user.room).emit('roomData', {room: user.room, users: getUsersInRoom(user.room)})

    callback();

  })

  socket.on('sendMessage', (message, callback) => {
    const user = getUser(socket.id);

    io.to(user.room).emit('message', {user: user.name, text: message});
    io.to(user.room).emit('roomData', {room: user.room, users: getUsersInRoom(user.room)});

    callback();
  })

  socket.on('disconnect', () => {
    console.log("User has left!");

    const user = removeUser(socket.id);

    if(user){
      io.to(user.name).emit('message', {user: 'admin', text: `${user.name} has left`})
    }

  })
})

// app.get('/', (req, res) => {
//   res.send("HELLO WORLD!")
// })

server.listen(5000, () => console.log("Server running"));