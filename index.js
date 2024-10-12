require("dotenv").config();
const express = require('express');
const path = require('path');
const app = express();
// socket io constant
const http = require('http').Server(app);
const io = require('socket.io')(http);

const cors = require("cors");
// const { Socket } = require("socket.io");

const port = process.env.PORT || 1234;

app.use(cors({ origin: "*" }));
app.use('/', express.static(path.join(__dirname, 'public')))
app.use("/api", require("./sw-api.js"));
app.use("/strike", require("./claimStrike.js"));
app.use("/telegram", require("./telegram.js"));

// Socket.io
// const connectedUsers = {};
// const room = {};

// function addUser(socketId) {
//     let loop = true;
//     let userId = 0;
//     while(loop){
//         userId = Math.floor((Math.random() * 10000) + 1); // genrating random user id
//         if(connectedUsers[userId] === undefined) loop = false
//         console.log("userId: ", userId);
//     }
//     connectedUsers[userId] = {
//         socketId: socketId,
//         tabs: []
//     };
//     return userId;
// }

// io.on('connection', (socket) => {
//     const userId = addUser(socket.id);
//     socket.emit("connected", { code: 0, data: { userId } });
//     console.log(socket.id);
//     console.log('A user connected', userId);

//     socket.on('join-room', (data) => {
//         // ....join room logic
//         io.emit('join-room', data.roomId);
//     });

//     socket.on('create-room', (data) => {
//         // ....create room logic
//         io.emit('create-room', data.roomId, data.userId, data.userType);
//     });

//     socket.on('disconnect', () => {
//         console.log('A user disconnected');   

//     });
// });

http.listen(port, () => {
    console.log(`Listening on port http://localhost:${port}`);
});
