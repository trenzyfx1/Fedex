// === Firebase Config ===
const firebaseConfig = {
    apiKey: "AIzaSyAm5oMFLKgo_T8JnQ67ZWr84Li_xSVMzIk",
    authDomain: "tracking-code-d451f.firebaseapp.com",
    databaseURL: "https://tracking-code-d451f-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "tracking-code-d451f",
    storageBucket: "tracking-code-d451f.appspot.com",
    messagingSenderId: "215766794609",
    appId: "1:215766794609:web:c67f12a8fc04cbe5ac36d0",
    measurementId: "G-G5Q85P2134"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.database();

// === OpenCage API Key ===
const OPENCAGE_API_KEY = "d25a4dbe398f468bb739242020e90395";

// === Get tracking code from URL ===
const urlParams = new URLSearchParams(window.location.search);
const code = urlParams.get('code');

if (!code) {
    alert("No tracking code provided.");
}

const loading = document.getElementById('loading');

// === Fetch delivery info from Firebase ===
db.ref("deliveries/" + code).once('value').then(async (snapshot) => {
    const data = snapshot.val();
    if (!data) {
        alert("Tracking data not found.");
        return;
    }

    const pickup = data.pickupLoc || "china";
    const destination = data.destination || "usa";
    const startedAt = data.trackingStartedAt || null;

    const [pickupCoords, destCoords] = await Promise.all([
        getCoordinates(pickup),
        getCoordinates(destination)
    ]);

    showMap(pickupCoords, destCoords, startedAt);

}).catch(error => {
    console.error("Firebase Error:", error);
    alert("Something went wrong.");
});

// === Convert address to coordinates ===
async function getCoordinates(address) {
    const url = `https://api.opencagedata.com/geocode/v1/json?q=${encodeURIComponent(address)}&key=${OPENCAGE_API_KEY}`;
    const res = await fetch(url);
    const data = await res.json();

    if (data.results && data.results.length > 0) {
        const { lat, lng } = data.results[0].geometry;
        return [lat, lng];
    } else {
        throw new Error("No coordinates found for " + address);
    }
}

// === Show Map and Animate Pointer ===
function showMap(pickupCoords, destCoords, startedAt) {
    loading.style.display = 'none';

    const map = L.map('map').setView(pickupCoords, 6);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);

    L.marker(pickupCoords).addTo(map).bindPopup("Pickup Location").openPopup();
    L.marker(destCoords).addTo(map).bindPopup("Destination");

    const route = L.polyline([pickupCoords, destCoords], {
        color: 'blue',
        weight: 4,
        opacity: 0.7,
        dashArray: '10,10'
    }).addTo(map);

    map.fitBounds(route.getBounds());

    // === Red Blinking Pointer ===
    const blinkingIcon = L.divIcon({
        className: "blinking-dot",
        iconSize: [16, 16]
    });

    const pointer = L.marker(pickupCoords, { icon: blinkingIcon }).addTo(map);

    const totalSeconds = 72 * 3600;

    // Get startTime from Firebase
    firebase.database().ref("deliveries/" + code + "/startTime").once("value").then(snap => {
        const startTime = snap.val();
        if (!startTime) {
            alert("Start time not found.");
            return;
        }

        const now = Date.now();
        const elapsedMs = now - startTime;
        const currentSecond = Math.floor(elapsedMs / 1000);

        startTrackingAnimation(currentSecond);
    });

    


    if (startedAt) {
        const timeElapsed = Math.floor((Date.now() - startedAt) / 1000);
        currentSecond = Math.min(timeElapsed, totalSeconds);
    }

    // === Animate Pointer ===
    const latStep = (destCoords[0] - pickupCoords[0]) / totalSeconds;
    const lngStep = (destCoords[1] - pickupCoords[1]) / totalSeconds;

    function movePointer() {
        if (currentSecond >= totalSeconds) return;

        const newLat = pickupCoords[0] + latStep * currentSecond;
        const newLng = pickupCoords[1] + lngStep * currentSecond;
        pointer.setLatLng([newLat, newLng]);

        currentSecond++;
        setTimeout(movePointer, 1000);
    }

    movePointer();

    // === Countdown Timer ===
    const countdown = document.createElement("div");
    countdown.style.position = "absolute";
    countdown.style.bottom = "10px";
    countdown.style.left = "10px";
    countdown.style.padding = "10px 20px";
    countdown.style.background = "rgba(0,0,0,0.7)";
    countdown.style.color = "#fff";
    countdown.style.fontWeight = "bold";
    countdown.style.borderRadius = "8px";
    countdown.style.zIndex = "999";
    document.body.appendChild(countdown);

   const timer = setInterval(() => {
        const remaining = totalSeconds - i;
        if (remaining <= 0) {
            countdown.innerText = "Delivered ✅";
            clearInterval(timer);
        } else if (paused) {
            countdown.innerText = "⏸️ Paused";
        } else {
            const hrs = Math.floor(remaining / 3600);
            const mins = Math.floor((remaining % 3600) / 60);
            const secs = remaining % 60;
            countdown.innerText = `ETA: ${hrs}h ${mins}m ${secs}s`;
        }
    }, 1000);
}
