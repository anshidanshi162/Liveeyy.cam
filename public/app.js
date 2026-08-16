const socket = io();


/*
|--------------------------------------------------------------------------
| Global variables
|--------------------------------------------------------------------------
*/

let cameraStream = null;

let currentLocation = null;

let isLive = false;


/*
|--------------------------------------------------------------------------
| WebRTC
|--------------------------------------------------------------------------
*/

/*
STUN helps discover the public network address.

IMPORTANT:
For production, add a TURN server as well.
*/

const rtcConfiguration = {

    iceServers: [

        {
            urls: "stun:stun.l.google.com:19302"
        }

    ]

};


/*
Streamer:
viewerId -> RTCPeerConnection
*/

const streamerPeers = {};


/*
Viewer:
streamerId -> RTCPeerConnection
*/

const viewerPeers = {};


/*
|--------------------------------------------------------------------------
| OPEN LIVE PANEL
|--------------------------------------------------------------------------
*/

async function openLivePanel() {

    document
        .getElementById("overlay")
        .classList.remove("hidden");


    document
        .getElementById("livePanel")
        .classList.remove("hidden");


    await startCamera();

    getLocation();

}


/*
|--------------------------------------------------------------------------
| CAMERA
|--------------------------------------------------------------------------
*/

async function startCamera() {

    try {

        cameraStream =
            await navigator.mediaDevices
                .getUserMedia({

                    video: {

                        width: {
                            ideal: 1280
                        },

                        height: {
                            ideal: 720
                        }

                    },

                    audio: true

                });


        document
            .getElementById("cameraPreview")
            .srcObject = cameraStream;


    } catch (error) {

        console.error(error);

        alert(
            "Camera and microphone permission is required."
        );

    }

}


/*
|--------------------------------------------------------------------------
| LOCATION
|--------------------------------------------------------------------------
*/

function getLocation() {

    const text =
        document.getElementById(
            "locationText"
        );


    if (!navigator.geolocation) {

        text.innerText =
            "Location is not supported.";

        return;

    }


    text.innerText =
        "Getting your location...";


    navigator.geolocation.getCurrentPosition(

        position => {

            currentLocation = {

                latitude:
                    position.coords.latitude,

                longitude:
                    position.coords.longitude

            };


            text.innerText =
                `Latitude:
                ${currentLocation.latitude.toFixed(5)}

                Longitude:
                ${currentLocation.longitude.toFixed(5)}`;

        },

        error => {

            console.error(error);

            text.innerText =
                "Location permission denied.";

        },

        {

            enableHighAccuracy: true,

            timeout: 10000,

            maximumAge: 0

        }

    );

}


/*
|--------------------------------------------------------------------------
| CREATE THUMBNAIL
|--------------------------------------------------------------------------
*/

function createThumbnail() {

    const video =
        document.getElementById(
            "cameraPreview"
        );


    const canvas =
        document.createElement(
            "canvas"
        );


    canvas.width = 320;

    canvas.height = 180;


    const context =
        canvas.getContext("2d");


    context.drawImage(

        video,

        0,

        0,

        canvas.width,

        canvas.height

    );


    return canvas.toDataURL(
        "image/jpeg",
        0.7
    );

}


/*
|--------------------------------------------------------------------------
| START LIVE
|--------------------------------------------------------------------------
*/

function startLive() {

    if (!cameraStream) {

        alert(
            "Camera is not available."
        );

        return;

    }


    if (!currentLocation) {

        alert(
            "Please allow location access."
        );

        return;

    }


    const title =
        document
            .getElementById("streamTitle")
            .value
            .trim();


    if (!title) {

        alert(
            "Please enter a stream title."
        );

        return;

    }


    const thumbnail =
        createThumbnail();


    isLive = true;


    /*
    Tell server that this user is live.
    */

    socket.emit(

        "startLive",

        {

            title,

            latitude:
                currentLocation.latitude,

            longitude:
                currentLocation.longitude,

            thumbnail

        }

    );


    /*
    Change interface.
    */

    document
        .getElementById("startLiveButton")
        .innerText = "🔴 LIVE";


    document
        .getElementById("startLiveButton")
        .disabled = true;

    document
    .getElementById("endLiveButton")
    .style.display = "block";


    closeLivePanel();


    /*
    Show own live stream.
    */

    openOwnLiveVideo();

}


/*
|--------------------------------------------------------------------------
| OPEN OWN LIVE VIDEO
|--------------------------------------------------------------------------
*/

function openOwnLiveVideo() {

    const video =
        document.getElementById(
            "remoteVideo"
        );


    video.srcObject =
        cameraStream;


    video.muted = true;

    video.controls = true;


    document
        .getElementById(
            "videoTitle"
        )
        .innerText =
            "🔴 You are LIVE";


    document
        .getElementById(
            "videoLocation"
        )
        .innerText =
            "📍 Your public location";


    document
        .getElementById(
            "videoWindow"
        )
        .classList.remove(
            "hidden"
        );

}


/*
|--------------------------------------------------------------------------
| RECEIVE EXISTING STREAMS
|--------------------------------------------------------------------------
*/

socket.on(

    "existingStreams",

    streams => {

        Object.values(streams)
            .forEach(stream => {

                createStreamMarker(
                    stream
                );

            });

    }

);


/*
|--------------------------------------------------------------------------
| NEW STREAM
|--------------------------------------------------------------------------
*/

socket.on(

    "newStream",

    stream => {

        createStreamMarker(
            stream
        );

    }

);


/*
|--------------------------------------------------------------------------
| CREATE STREAM MARKER
|--------------------------------------------------------------------------
*/

function createStreamMarker(stream) {

    /*
    Don't show duplicate markers.
    */

    if (
        document.querySelector(
            `[data-stream-id="${stream.id}"]`
        )
    ) {

        return;

    }


    const marker =
        document.createElement(
            "div"
        );


    marker.className =
        "stream-marker";


    marker.dataset.streamId =
        stream.id;


    /*
    Simple latitude/longitude
    visualization.

    For a real map we will replace
    this with Leaflet.
    */

    const x =
        ((stream.longitude + 180) / 360) * 100;


    const y =
        ((90 - stream.latitude) / 180) * 100;


    marker.style.left =
        Math.max(
            5,
            Math.min(90, x)
        ) + "%";


    marker.style.top =
        Math.max(
            10,
            Math.min(85, y)
        ) + "%";


    marker.style.backgroundImage =
        `url("${stream.thumbnail}")`;


    marker.innerHTML = `

        <div class="live-dot"></div>

        <div class="location-label">
            🔴 LIVE
        </div>

    `;


    marker.onclick = function() {

        watchStream(stream);

    };


    document
        .getElementById("map")
        .appendChild(marker);

}


/*
|--------------------------------------------------------------------------
| WATCH STREAM
|--------------------------------------------------------------------------
*/

function watchStream(stream) {

    /*
    Tell streamer:
    "I want to watch."
    */

    socket.emit(

        "watchStream",

        {

            streamerId:
                stream.id

        }

    );


    /*
    Prepare viewer peer connection.

    The actual offer will arrive
    from streamer.
    */

    openVideoWindow(

        stream.title,

        stream.latitude,

        stream.longitude

    );

}


/*
|--------------------------------------------------------------------------
| OPEN VIDEO WINDOW
|--------------------------------------------------------------------------
*/

function openVideoWindow(
    title,
    latitude,
    longitude
) {

    document
        .getElementById(
            "videoTitle"
        )
        .innerText =
            title;


    document
        .getElementById(
            "videoLocation"
        )
        .innerText =
            `📍 ${latitude.toFixed(5)},
             ${longitude.toFixed(5)}`;


    document
        .getElementById(
            "videoWindow"
        )
        .classList.remove(
            "hidden"
        );

}


/*
|--------------------------------------------------------------------------
| STREAMER RECEIVES NEW VIEWER
|--------------------------------------------------------------------------
*/

socket.on(

    "viewerJoined",

    async ({ viewerId }) => {

        if (!cameraStream) {

            return;

        }


        console.log(
            "New viewer:",
            viewerId
        );


        /*
        Create a peer connection
        specifically for this viewer.
        */

        const peer =
            new RTCPeerConnection(
                rtcConfiguration
            );


        streamerPeers[viewerId] =
            peer;


        /*
        Add camera + microphone.
        */

        cameraStream
            .getTracks()
            .forEach(track => {

                peer.addTrack(
                    track,
                    cameraStream
                );

            });


        /*
        Send ICE candidates.
        */

        peer.onicecandidate =
            event => {

                if (!event.candidate) {

                    return;

                }


                socket.emit(

                    "ice-candidate",

                    {

                        targetId:
                            viewerId,

                        candidate:
                            event.candidate

                    }

                );

            };


        /*
        Create WebRTC offer.
        */

        const offer =
            await peer.createOffer();


        await peer.setLocalDescription(
            offer
        );


        /*
        Send offer to viewer.
        */

        socket.emit(

            "webrtc-offer",

            {

                viewerId,

                offer

            }

        );

    }

);


/*
|--------------------------------------------------------------------------
| VIEWER RECEIVES OFFER
|--------------------------------------------------------------------------
*/

socket.on(

    "webrtc-offer",

    async ({
        streamerId,
        offer
    }) => {

        console.log(
            "Received offer from:",
            streamerId
        );


        const peer =
            new RTCPeerConnection(
                rtcConfiguration
            );


        viewerPeers[streamerId] =
            peer;


        /*
        When remote video arrives.
        */

        peer.ontrack =
            event => {

                const video =
                    document.getElementById(
                        "remoteVideo"
                    );


                if (
                    video.srcObject !==
                    event.streams[0]
                ) {

                    video.srcObject =
                        event.streams[0];

                    video.muted = false;

                    video.play()
                        .catch(
                            () => {}
                        );

                }

            };


        /*
        Send ICE candidates
        back to streamer.
        */

        peer.onicecandidate =
            event => {

                if (!event.candidate) {

                    return;

                }


                socket.emit(

                    "ice-candidate",

                    {

                        targetId:
                            streamerId,

                        candidate:
                            event.candidate

                    }

                );

            };


        /*
        Receive streamer offer.
        */

        await peer.setRemoteDescription(
            new RTCSessionDescription(
                offer
            )
        );


        /*
        Create answer.
        */

        const answer =
            await peer.createAnswer();


        await peer.setLocalDescription(
            answer
        );


        /*
        Send answer to streamer.
        */

        socket.emit(

            "webrtc-answer",

            {

                streamerId,

                answer

            }

        );

    }

);


/*
|--------------------------------------------------------------------------
| STREAMER RECEIVES ANSWER
|--------------------------------------------------------------------------
*/

socket.on(

    "webrtc-answer",

    async ({
        viewerId,
        answer
    }) => {

        const peer =
            streamerPeers[viewerId];


        if (!peer) {

            return;

        }


        await peer.setRemoteDescription(

            new RTCSessionDescription(
                answer
            )

        );

    }

);


/*
|--------------------------------------------------------------------------
| ICE CANDIDATES
|--------------------------------------------------------------------------
*/

socket.on(

    "ice-candidate",

    async ({
        senderId,
        candidate
    }) => {

        try {

            let peer =
                streamerPeers[senderId];


            if (!peer) {

                peer =
                    viewerPeers[senderId];

            }


            if (
                peer &&
                candidate
            ) {

                await peer.addIceCandidate(

                    new RTCIceCandidate(
                        candidate
                    )

                );

            }

        } catch (error) {

            console.error(
                "ICE error:",
                error
            );

        }

    }

);


/*
|--------------------------------------------------------------------------
| STREAM REMOVED
|--------------------------------------------------------------------------
*/

socket.on(

    "streamRemoved",

    socketId => {

        const marker =
            document.querySelector(

                `[data-stream-id="${socketId}"]`

            );


        if (marker) {

            marker.remove();

        }


        /*
        Close viewer connection.
        */

        if (
            viewerPeers[socketId]
        ) {

            viewerPeers[socketId]
                .close();


            delete viewerPeers[
                socketId
            ];

        }

    }

);


/*
|--------------------------------------------------------------------------
| CLOSE VIDEO
|--------------------------------------------------------------------------
*/

function closeVideo() {

    const video =
        document.getElementById(
            "remoteVideo"
        );


    /*
    Don't stop our own camera
    just because the player closed.
    */

    if (
        video.srcObject !==
        cameraStream
    ) {

        video.srcObject = null;

    }


    video.pause();


    document
        .getElementById(
            "videoWindow"
        )
        .classList.add(
            "hidden"
        );

}


/*
|--------------------------------------------------------------------------
| END LIVE
|--------------------------------------------------------------------------
*/

function stopLive() {

    if (!isLive) {

        return;

    }


    isLive = false;


    /*
    Tell server.
    */

    socket.emit(
        "stopLive"
    );


    /*
    Close all viewer connections.
    */

    Object.values(
        streamerPeers
    )
    .forEach(peer => {

        peer.close();

    });


    for (
        const id in streamerPeers
    ) {

        delete streamerPeers[id];

    }


    /*
    Stop camera and microphone.
    */

    if (cameraStream) {

        cameraStream
            .getTracks()
            .forEach(track => {

                track.stop();

            });

        cameraStream = null;

    }


    /*
    Reset button.
    */

    const button =
        document.getElementById(
            "startLiveButton"
        );


    button.innerText =
        "🔴 Start Live";


    button.disabled =
        false;

    document
    .getElementById("endLiveButton")
    .style.display = "none";


    closeVideo();

}


/*
|--------------------------------------------------------------------------
| CLOSE LIVE PANEL
|--------------------------------------------------------------------------
*/

function closeLivePanel() {

    document
        .getElementById(
            "livePanel"
        )
        .classList.add(
            "hidden"
        );


    document
        .getElementById(
            "overlay"
        )
        .classList.add(
            "hidden"
        );

}
