const socket = io();

let cameraStream = null;
let currentLocation = null;
let isLive = false;

const rtcConfiguration = {
    iceServers: [
        {
            urls: "stun:stun.l.google.com:19302"
        }
    ]
};

const streamerPeers = {};
const viewerPeers = {};

/*
|--------------------------------------------------------------------------
| ICE CANDIDATE QUEUES
|--------------------------------------------------------------------------
*/

const pendingIceCandidates = {};


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
            await navigator.mediaDevices.getUserMedia({
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

        const preview =
            document.getElementById("cameraPreview");

        preview.srcObject = cameraStream;

        preview.muted = true;

        await preview.play();

    } catch (error) {

        console.error(
            "Camera error:",
            error
        );

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
        document.getElementById("locationText");

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

            console.error(
                "Location error:",
                error
            );

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
| THUMBNAIL
|--------------------------------------------------------------------------
*/

function createThumbnail() {

    const video =
        document.getElementById(
            "cameraPreview"
        );

    const canvas =
        document.createElement("canvas");

    canvas.width = 320;
    canvas.height = 180;

    const context =
        canvas.getContext("2d");

    context.drawImage(
        video,
        0,
        0,
        320,
        180
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

    socket.emit(
        "startLive",
        {
            title: title,

            latitude:
                currentLocation.latitude,

            longitude:
                currentLocation.longitude,

            thumbnail: thumbnail
        }
    );

    document
        .getElementById("startLiveButton")
        .innerText = "🔴 LIVE";

    document
        .getElementById("startLiveButton")
        .disabled = true;

    const endButton =
        document.getElementById(
            "endLiveButton"
        );

    if (endButton) {
        endButton.style.display = "block";
    }

    closeLivePanel();

    openOwnLiveVideo();
}


/*
|--------------------------------------------------------------------------
| SHOW OWN VIDEO
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

    video.playsInline = true;

    video.play().catch(() => {});

    document
        .getElementById("videoTitle")
        .innerText =
            "🔴 You are LIVE";

    document
        .getElementById("videoLocation")
        .innerText =
            "📍 Your public location";

    document
        .getElementById("videoWindow")
        .classList.remove("hidden");
}


/*
|--------------------------------------------------------------------------
| EXISTING STREAMS
|--------------------------------------------------------------------------
*/

socket.on(
    "existingStreams",
    streams => {

        Object.values(streams)
            .forEach(stream => {

                createStreamMarker(stream);

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

        createStreamMarker(stream);

    }
);


/*
|--------------------------------------------------------------------------
| CREATE STREAM MARKER
|--------------------------------------------------------------------------
*/

function createStreamMarker(stream) {

    if (
        document.querySelector(
            `[data-stream-id="${stream.id}"]`
        )
    ) {

        return;
    }

    const marker =
        document.createElement("div");

    marker.className =
        "stream-marker";

    marker.dataset.streamId =
        stream.id;

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

    marker.onclick = () => {

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

    console.log(
        "Watching stream:",
        stream.id
    );

    openVideoWindow(
        stream.title,
        stream.latitude,
        stream.longitude
    );

    socket.emit(
        "watchStream",
        {
            streamerId: stream.id
        }
    );
}


/*
|--------------------------------------------------------------------------
| VIDEO WINDOW
|--------------------------------------------------------------------------
*/

function openVideoWindow(
    title,
    latitude,
    longitude
) {

    document
        .getElementById("videoTitle")
        .innerText = title;

    document
        .getElementById("videoLocation")
        .innerText =
            `📍 ${latitude.toFixed(5)},
${longitude.toFixed(5)}`;

    document
        .getElementById("videoWindow")
        .classList.remove("hidden");
}


/*
|--------------------------------------------------------------------------
| STREAMER RECEIVES VIEWER
|--------------------------------------------------------------------------
*/

socket.on(
    "viewerJoined",
    async ({ viewerId }) => {

        console.log(
            "VIEWER JOINED:",
            viewerId
        );

        if (!cameraStream) {

            console.error(
                "No camera stream available."
            );

            return;
        }

        /*
        Close old connection if viewer
        reconnects.
        */

        if (streamerPeers[viewerId]) {

            streamerPeers[viewerId].close();

        }

        const peer =
            new RTCPeerConnection(
                rtcConfiguration
            );

        streamerPeers[viewerId] =
            peer;

        /*
        Add camera and microphone.
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
        ICE candidates.
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
        Connection state debugging.
        */

        peer.onconnectionstatechange =
            () => {

                console.log(
                    "Streamer connection:",
                    viewerId,
                    peer.connectionState
                );

            };

        /*
        Create offer.
        */

        try {

            const offer =
                await peer.createOffer();

            await peer.setLocalDescription(
                offer
            );

            console.log(
                "Sending offer to:",
                viewerId
            );

            socket.emit(
                "webrtc-offer",
                {
                    viewerId: viewerId,

                    offer:
                        peer.localDescription
                }
            );

        } catch (error) {

            console.error(
                "Offer error:",
                error
            );

        }

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
            "OFFER RECEIVED FROM:",
            streamerId
        );

        /*
        Create viewer peer.
        */

        const peer =
            new RTCPeerConnection(
                rtcConfiguration
            );

        viewerPeers[streamerId] =
            peer;

        /*
        Receive remote video.
        */

        peer.ontrack =
            event => {

                console.log(
                    "REMOTE TRACK RECEIVED"
                );

                const video =
                    document.getElementById(
                        "remoteVideo"
                    );

                if (
                    event.streams &&
                    event.streams[0]
                ) {

                    video.srcObject =
                        event.streams[0];

                    video.muted = false;

                    video.playsInline = true;

                    video.controls = true;

                    video.play()
                        .then(() => {

                            console.log(
                                "REMOTE VIDEO PLAYING"
                            );

                        })
                        .catch(error => {

                            console.error(
                                "Video play error:",
                                error
                            );

                        });
                }

            };

        /*
        ICE candidates.
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
        Connection debugging.
        */

        peer.onconnectionstatechange =
            () => {

                console.log(
                    "Viewer connection:",
                    peer.connectionState
                );

            };

        /*
        Set remote offer.
        */

        try {

            await peer.setRemoteDescription(
                new RTCSessionDescription(
                    offer
                )
            );

            /*
            Add any ICE candidates that
            arrived before the offer.
            */

            await flushIceCandidates(
                streamerId,
                peer
            );

            /*
            Create answer.
            */

            const answer =
                await peer.createAnswer();

            await peer.setLocalDescription(
                answer
            );

            console.log(
                "Sending answer to:",
                streamerId
            );

            socket.emit(
                "webrtc-answer",
                {
                    streamerId:
                        streamerId,

                    answer:
                        peer.localDescription
                }
            );

        } catch (error) {

            console.error(
                "Viewer WebRTC error:",
                error
            );

        }

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

        console.log(
            "ANSWER RECEIVED FROM:",
            viewerId
        );

        const peer =
            streamerPeers[viewerId];

        if (!peer) {

            console.error(
                "Streamer peer not found:",
                viewerId
            );

            return;
        }

        try {

            await peer.setRemoteDescription(
                new RTCSessionDescription(
                    answer
                )
            );

            /*
            Flush ICE candidates that
            arrived early.
            */

            await flushIceCandidates(
                viewerId,
                peer
            );

        } catch (error) {

            console.error(
                "Answer error:",
                error
            );

        }

    }
);


/*
|--------------------------------------------------------------------------
| ICE CANDIDATE RECEIVED
|--------------------------------------------------------------------------
*/

socket.on(
    "ice-candidate",
    async ({
        senderId,
        candidate
    }) => {

        if (!candidate) {
            return;
        }

        /*
        Determine which peer this belongs to.
        */

        let peer =
            streamerPeers[senderId];

        if (!peer) {

            peer =
                viewerPeers[senderId];

        }

        /*
        If peer doesn't exist yet,
        save candidate.
        */

        if (!peer) {

            if (!pendingIceCandidates[senderId]) {

                pendingIceCandidates[senderId] = [];

            }

            pendingIceCandidates[senderId]
                .push(candidate);

            console.log(
                "ICE candidate queued:",
                senderId
            );

            return;
        }

        /*
        If remote description isn't ready,
        queue it.
        */

        if (
            !peer.remoteDescription ||
            !peer.remoteDescription.type
        ) {

            if (!pendingIceCandidates[senderId]) {

                pendingIceCandidates[senderId] = [];

            }

            pendingIceCandidates[senderId]
                .push(candidate);

            console.log(
                "ICE candidate waiting for remote description"
            );

            return;
        }

        try {

            await peer.addIceCandidate(
                new RTCIceCandidate(
                    candidate
                )
            );

        } catch (error) {

            console.error(
                "ICE candidate error:",
                error
            );

        }

    }
);


/*
|--------------------------------------------------------------------------
| FLUSH ICE CANDIDATES
|--------------------------------------------------------------------------
*/

async function flushIceCandidates(
    peerId,
    peer
) {

    const candidates =
        pendingIceCandidates[peerId];

    if (!candidates) {
        return;
    }

    console.log(
        "Flushing ICE:",
        candidates.length
    );

    for (
        const candidate of candidates
    ) {

        try {

            await peer.addIceCandidate(
                new RTCIceCandidate(
                    candidate
                )
            );

        } catch (error) {

            console.error(
                "Queued ICE error:",
                error
            );

        }

    }

    delete pendingIceCandidates[
        peerId
    ];
}


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

        if (
            viewerPeers[socketId]
        ) {

            viewerPeers[socketId]
                .close();

            delete viewerPeers[
                socketId
            ];

        }

        const video =
            document.getElementById(
                "remoteVideo"
            );

        /*
        Don't clear our own camera.
        */

        if (
            video.srcObject !==
            cameraStream
        ) {

            video.srcObject = null;

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

    if (
        video.srcObject !==
        cameraStream
    ) {

        video.srcObject = null;

    }

    video.pause();

    document
        .getElementById("videoWindow")
        .classList.add("hidden");
}


/*
|--------------------------------------------------------------------------
| STOP LIVE
|--------------------------------------------------------------------------
*/

function stopLive() {

    if (!isLive) {
        return;
    }

    isLive = false;

    socket.emit("stopLive");

    Object.values(
        streamerPeers
    ).forEach(peer => {

        peer.close();

    });

    Object.keys(
        streamerPeers
    ).forEach(id => {

        delete streamerPeers[id];

    });

    if (cameraStream) {

        cameraStream
            .getTracks()
            .forEach(track => {

                track.stop();

            });

        cameraStream = null;
    }

    const button =
        document.getElementById(
            "startLiveButton"
        );

    button.innerText =
        "🔴 Start Live";

    button.disabled =
        false;

    const endButton =
        document.getElementById(
            "endLiveButton"
        );

    if (endButton) {

        endButton.style.display =
            "none";

    }

    closeVideo();
}


/*
|--------------------------------------------------------------------------
| CLOSE LIVE PANEL
|--------------------------------------------------------------------------
*/

function closeLivePanel() {

    document
        .getElementById("livePanel")
        .classList.add("hidden");

    document
        .getElementById("overlay")
        .classList.add("hidden");
}
