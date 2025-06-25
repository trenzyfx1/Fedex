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

    const pickup = data.pickupLoc || "China";
    const destination = data.destination || "USA";

    const [pickupCoords, destCoords] = await Promise.all([
        getCoordinates(pickup),
        getCoordinates(destination)
    ]);

    showMap(pickupCoords, destCoords);

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
function showMap(pickupCoords, destCoords) {
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

    // === Blinking Red Pointer ===
    const blinkingIcon = L.divIcon({
        className: "blinking-dot",
        iconSize: [16, 16]
    });

    const pointer = L.marker(pickupCoords, { icon: blinkingIcon }).addTo(map);

    // Total travel time in seconds
    const totalSeconds = 72 * 3600;

    // Check or set tracking start time
    const deliveryRef = firebase.database().ref("deliveries/" + code);
    deliveryRef.once("value").then(snap => {
        const delivery = snap.val();
        let startTime = delivery.startTime;

        if (!startTime) {
            startTime = Date.now();
            deliveryRef.update({ startTime });
        }

        startTracking(startTime, pickupCoords, destCoords, pointer, totalSeconds);
    });
}

function startTracking(startTime, pickupCoords, destCoords, pointer, totalSeconds) {
    const latStep = (destCoords[0] - pickupCoords[0]) / totalSeconds;
    const lngStep = (destCoords[1] - pickupCoords[1]) / totalSeconds;

    function movePointer() {
        const now = Date.now();
        const elapsed = Math.floor((now - startTime) / 1000);
        const remaining = totalSeconds - elapsed;

        if (elapsed >= totalSeconds) {
            pointer.setLatLng(destCoords);
            updateCountdown(0);
            return;
        }

        // 🛑 CHECK if paused from Firebase
        firebase.database().ref("deliveries/" + code + "/trackingPaused").once("value")
            .then(snap => {
                const isPaused = snap.val();
                if (!isPaused) {
                    const newLat = pickupCoords[0] + latStep * elapsed;
                    const newLng = pickupCoords[1] + lngStep * elapsed;
                    pointer.setLatLng([newLat, newLng]);
                }

                updateCountdown(remaining);
                setTimeout(movePointer, 1000);
            });
    }

    movePointer();
}

// === Countdown Display ===
function updateCountdown(seconds) {
    let countdown = document.getElementById("countdown");
    if (!countdown) {
        countdown = document.createElement("div");
        countdown.id = "countdown";
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
    }

    if (seconds <= 0) {
        countdown.innerText = "Delivered ✅";
    } else {
        const hrs = Math.floor(seconds / 3600);
        const mins = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        countdown.innerText = `ETA: ${hrs}h ${mins}m ${secs}s`;
    }
}

// 🔑 Secret passcode
const adminPasscode = "";

// 🔘 Hidden Admin Button
document.getElementById("adminButton").addEventListener("click", () => {
    const input = prompt("Enter admin passcode:");
    if (input === adminPasscode) {TREZ2025
        document.getElementById("controlPanel").style.display = "block";
    } else {
        alert("❌ Incorrect passcode!");
    }
});

// ⏯️ Pause / Play control
function toggleTracking() {
    const ref = firebase.database().ref("deliveries/" + code + "/trackingPaused");

    ref.once("value").then(snap => {
        const current = snap.val() || false;
        ref.set(!current).then(() => {
            alert(`Tracking ${!current ? "paused" : "resumed"} successfully ✅`);
        });
    });
}
