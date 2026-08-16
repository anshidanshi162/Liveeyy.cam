const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");

const app = express();

const server = http.createServer(app);

const io = new Server(server);

const PORT = process.env.PORT || 3000;


/* Serve frontend */

app.use(express.static(path.join(__dirname, "public")));


/*
    Store currently active streams.

    Example:

    {
        socketId: {
            title: "...",
            latitude: 10.52,
            longitude: 76.21
        }
    }
*/

const liveStreams = {};


/* User connects */

io.on("connection", (socket) => {

    console.log("User connected:", socket.id);


    /*
        Send currently active streams
        to the new user.
    */

    socket.emit(
        "existingStreams",
        liveStreams
    );


    /*
        User starts streaming
    */

    socket.on("startLive", (streamData) => {

        liveStreams[socket.id] = {

            id: socket.id,

            title: streamData.title,

            latitude: streamData.latitude,

            longitude: streamData.longitude,

            thumbnail: streamData.thumbnail

        };


        /*
            Tell all other users
            about the new stream.
        */

        socket.broadcast.emit(
            "newStream",
            liveStreams[socket.id]
        );


        console.log(
            "Stream started:",
            liveStreams[socket.id]
        );

    });


    /*
        User stops streaming
    */

    socket.on("stopLive", () => {

        removeStream(socket.id);

    });


    /*
        User disconnects
    */

    socket.on("disconnect", () => {

        removeStream(socket.id);

        console.log(
            "User disconnected:",
            socket.id
        );

    });


    function removeStream(socketId) {

        if (!liveStreams[socketId]) {
            return;
        }


        delete liveStreams[socketId];


        io.emit(
            "streamRemoved",
            socketId
        );

    }

});


/*
    Start server

    IMPORTANT:
    Render requires 0.0.0.0
*/

server.listen(
    PORT,
    "0.0.0.0",
    () => {

        console.log(
            `LiveMap running on port ${PORT}`
        );

    }
);
