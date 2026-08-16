const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");

const app = express();
const server = http.createServer(app);

const io = new Server(server);

const PORT = process.env.PORT || 3000;


/*
|--------------------------------------------------------------------------
| Serve frontend
|--------------------------------------------------------------------------
*/

app.use(express.static(path.join(__dirname, "public")));


/*
|--------------------------------------------------------------------------
| Active live streams
|--------------------------------------------------------------------------
*/

const liveStreams = {};


/*
|--------------------------------------------------------------------------
| Socket.IO
|--------------------------------------------------------------------------
*/

io.on("connection", (socket) => {

    console.log("Connected:", socket.id);


    /*
    Send existing streams to newly connected user
    */

    socket.emit(
        "existingStreams",
        liveStreams
    );


    /*
    ----------------------------------------------------------------------
    START LIVE
    ----------------------------------------------------------------------
    */

    socket.on("startLive", (data) => {

        liveStreams[socket.id] = {

            id: socket.id,

            title: data.title,

            latitude: data.latitude,

            longitude: data.longitude,

            thumbnail: data.thumbnail

        };


        console.log(
            "LIVE:",
            socket.id,
            data.title
        );


        /*
        Tell everyone except streamer
        */

        socket.broadcast.emit(
            "newStream",
            liveStreams[socket.id]
        );

    });


    /*
    ----------------------------------------------------------------------
    STOP LIVE
    ----------------------------------------------------------------------
    */

    socket.on("stopLive", () => {

        removeStream(socket.id);

    });


    /*
    ----------------------------------------------------------------------
    WEBRTC OFFER
    ----------------------------------------------------------------------

    Streamer -> Viewer
    */

    socket.on(
        "webrtc-offer",
        ({ viewerId, offer }) => {

            io.to(viewerId).emit(
                "webrtc-offer",
                {
                    streamerId: socket.id,
                    offer
                }
            );

        }
    );


    /*
    ----------------------------------------------------------------------
    WEBRTC ANSWER
    ----------------------------------------------------------------------

    Viewer -> Streamer
    */

    socket.on(
        "webrtc-answer",
        ({ streamerId, answer }) => {

            io.to(streamerId).emit(
                "webrtc-answer",
                {
                    viewerId: socket.id,
                    answer
                }
            );

        }
    );


    /*
    ----------------------------------------------------------------------
    ICE CANDIDATE
    ----------------------------------------------------------------------

    Send ICE candidate to the other peer.
    */

    socket.on(
        "ice-candidate",
        ({ targetId, candidate }) => {

            io.to(targetId).emit(
                "ice-candidate",
                {
                    senderId: socket.id,
                    candidate
                }
            );

        }
    );


    /*
    ----------------------------------------------------------------------
    VIEWER REQUESTS STREAM
    ----------------------------------------------------------------------
    */

    socket.on(
        "watchStream",
        ({ streamerId }) => {

            /*
            Tell streamer that a new viewer
            wants to watch.
            */

            io.to(streamerId).emit(
                "viewerJoined",
                {
                    viewerId: socket.id
                }
            );

        }
    );


    /*
    ----------------------------------------------------------------------
    DISCONNECT
    ----------------------------------------------------------------------
    */

    socket.on("disconnect", () => {

        console.log(
            "Disconnected:",
            socket.id
        );

        removeStream(socket.id);

    });


    /*
    ----------------------------------------------------------------------
    REMOVE STREAM
    ----------------------------------------------------------------------
    */

    function removeStream(socketId) {

        if (!liveStreams[socketId]) {
            return;
        }


        delete liveStreams[socketId];


        io.emit(
            "streamRemoved",
            socketId
        );


        console.log(
            "Stream ended:",
            socketId
        );

    }

});


/*
|--------------------------------------------------------------------------
| Start server
|--------------------------------------------------------------------------
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
