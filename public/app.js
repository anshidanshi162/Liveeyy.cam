const socket = io();


let cameraStream = null;

let currentLocation = null;


/* =========================================
   OPEN LIVE PANEL
========================================= */

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


/* =========================================
   CAMERA
========================================= */

async function startCamera() {

    try {

        cameraStream =
            await navigator.mediaDevices
                .getUserMedia({

                    video: true,

                    audio: true

                });


        document
            .getElementById("cameraPreview")
            .srcObject = cameraStream;


    } catch (error) {

        console.error(error);

        alert(
            "Camera permission is required."
        );

    }

}


/* =========================================
   LOCATION
========================================= */

function getLocation() {

    const text =
        document.getElementById(
            "locationText"
        );


    if (!navigator.geolocation) {

        text.innerText =
            "Location not supported.";

        return;

    }


    text.innerText =
        "Getting location...";


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

            text.innerText =
                "Location permission denied.";

        },

        {

            enableHighAccuracy: true,

            timeout: 10000

        }

    );

}


/* =========================================
   CREATE THUMBNAIL
========================================= */

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
        "image/jpeg"
    );

}


/* =========================================
   GO LIVE
========================================= */

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
        document.getElementById(
            "streamTitle"
        ).value.trim();


    if (!title) {

        alert(
            "Enter a stream title."
        );

        return;

    }


    const thumbnail =
        createThumbnail();


    /*
        Send stream information
        to backend.
    */

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


    closeLivePanel();


    alert(
        "You are now LIVE!"
    );

}


/* =========================================
   RECEIVE EXISTING STREAMS
========================================= */

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


/* =========================================
   RECEIVE NEW STREAM
========================================= */

socket.on(

    "newStream",

    stream => {

        createStreamMarker(
            stream
        );

    }

);


/* =========================================
   CREATE MAP MARKER
========================================= */

function createStreamMarker(stream) {

    /*
        This converts latitude/longitude
        into a visual position for this
        simple prototype.

        For production, replace this with
        Leaflet / Google Maps / Mapbox.
    */

    const x =
        ((stream.longitude + 180) / 360) * 100;


    const y =
        ((90 - stream.latitude) / 180) * 100;


    const marker =
        document.createElement(
            "div"
        );


    marker.className =
        "stream-marker";


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
            📍 LIVE
        </div>

    `;


    marker.onclick = function() {

        openStream(
            stream
        );

    };


    document
        .getElementById("map")
        .appendChild(marker);

}


/* =========================================
   OPEN STREAM
========================================= */

function openStream(stream) {

    const video =
        document.getElementById(
            "remoteVideo"
        );


    /*
        At this stage this shows the
        stream thumbnail.

        Real WebRTC video will be attached
        here in the next version.
    */

    video.src =
        stream.thumbnail;


    document
        .getElementById(
            "videoTitle"
        )
        .innerText =
            stream.title;


    document
        .getElementById(
            "videoLocation"
        )
        .innerText =
            `📍 ${stream.latitude.toFixed(5)},
             ${stream.longitude.toFixed(5)}`;


    document
        .getElementById(
            "videoWindow"
        )
        .classList.remove(
            "hidden"
        );

}


/* =========================================
   CLOSE VIDEO
========================================= */

function closeVideo() {

    const video =
        document.getElementById(
            "remoteVideo"
        );


    video.pause();

    video.src = "";


    document
        .getElementById(
            "videoWindow"
        )
        .classList.add(
            "hidden"
        );

}


/* =========================================
   CLOSE LIVE PANEL
========================================= */

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


/* =========================================
   STREAM REMOVED
========================================= */

socket.on(

    "streamRemoved",

    socketId => {

        /*
            In the next version we'll give
            each marker its socket ID and
            remove it from the map here.
        */

        console.log(
            "Stream ended:",
            socketId
        );

    }

);
