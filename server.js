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
| FRONTEND
|--------------------------------------------------------------------------
*/

app.use(express.static(path.join(__dirname, "public")));


/*
|--------------------------------------------------------------------------
| LIVE STREAMS
|--------------------------------------------------------------------------
*/

const liveStreams = {};


/*
|--------------------------------------------------------------------------
| SOCKET.IO
|--------------------------------------------------------------------------
*/

io.on("connection", (socket) => {

    console.log("CONNECTED:", socket.id);


    /*
    Send all currently live streams
    to the new user.
    */

    socket.emit(
        "existingStreams",
        liveStreams
    );


    /*
    |--------------------------------------------------------------------------
    | START LIVE
    |--------------------------------------------------------------------------
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
            "START LIVE:",
            socket.id,
            data.title
        );


        /*
        Send new stream to everybody
        except streamer.
        */

        socket.broadcast.emit(
            "newStream",
            liveStreams[socket.id]
        );

    });


    /*
    |--------------------------------------------------------------------------
    | VIEWER WANTS TO WATCH
    |--------------------------------------------------------------------------
    */

    socket.on(
        "watchStream",
        ({ streamerId }) => {

            console.log(
                "VIEWER",
                socket.id,
                "wants to watch",
                streamerId
            );


            /*
            Tell the streamer that
            a viewer has joined.
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
    |--------------------------------------------------------------------------
    | WEBRTC OFFER
    |--------------------------------------------------------------------------
    */

    socket.on(
        "webrtc-offer",
        ({ viewerId, offer }) => {

            console.log(
                "OFFER:",
                socket.id,
                "->",
                viewerId
            );


            io.to(viewerId).emit(
                "webrtc-offer",
                {
                    streamerId: socket.id,
                    offer: offer
                }
            );

        }
    );


    /*
    |--------------------------------------------------------------------------
    | WEBRTC ANSWER
    |--------------------------------------------------------------------------
    */

    socket.on(
        "webrtc-answer",
        ({ streamerId, answer }) => {

            console.log(
                "ANSWER:",
                socket.id,
                "->",
                streamerId
            );


            io.to(streamerId).emit(
                "webrtc-answer",
                {
                    viewerId: socket.id,
                    answer: answer
                }
            );

        }
    );


    /*
    |--------------------------------------------------------------------------
    | ICE CANDIDATE
    |--------------------------------------------------------------------------
    */

    socket.on(
        "ice-candidate",
        ({ targetId, candidate }) => {

            io.to(targetId).emit(
                "ice-candidate",
                {
                    senderId: socket.id,
                    candidate: candidate
                }
            );

        }
    );


    /*
    |--------------------------------------------------------------------------
    | STOP LIVE
    |--------------------------------------------------------------------------
    */

    socket.on("stopLive", () => {

        removeStream(socket.id);

    });


    /*
    |--------------------------------------------------------------------------
    | DISCONNECT
    |--------------------------------------------------------------------------
    */

    socket.on("disconnect", () => {

        console.log(
            "DISCONNECTED:",
            socket.id
        );


        removeStream(socket.id);

    });


    /*
    |--------------------------------------------------------------------------
    | REMOVE STREAM
    |--------------------------------------------------------------------------
    */

    function removeStream(socketId) {

        if (!liveStreams[socketId]) {

            return;

        }


        delete liveStreams[socketId];


        /*
        Tell all connected users
        that this stream ended.
        */

        io.emit(
            "streamRemoved",
            socketId
        );


        console.log(
            "STREAM REMOVED:",
            socketId
        );

    }

});


/*
|--------------------------------------------------------------------------
| START SERVER
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
