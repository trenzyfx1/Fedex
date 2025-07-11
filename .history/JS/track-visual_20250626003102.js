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

if (!code) alert("No tracking code provided.");

const loading = document.getElementById('loading');

// === Fetch delivery info from Firebase ===
db.ref("deliveries/" + code).once('value').then(async (snapshot) => {
    const data = snapshot.val();
    if (!data) return alert("Tracking data not found.");

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

    if (data.results?.length > 0) {
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

    const blinkingIcon = L.divIcon({ className: "blinking-dot", iconSize: [16, 16] });
    const pointer = L.marker(pickupCoords, { icon: blinkingIcon }).addTo(map);

    const totalSeconds = 1 * 6300;
    const deliveryRef = db.ref("deliveries/" + code);

    deliveryRef.once("value").then(snap => {
        let data = snap.val();
        let startTime = data.startTime || Date.now();
        if (!data.startTime) deliveryRef.update({ startTime });

        movePointer(startTime, pickupCoords, destCoords, pointer, totalSeconds);
    });
}

function movePointer(startTime, pickupCoords, destCoords, pointer, totalSeconds) {
    const latStep = (destCoords[0] - pickupCoords[0]) / totalSeconds;
    const lngStep = (destCoords[1] - pickupCoords[1]) / totalSeconds;

    function tick() {
        const deliveryRef = db.ref("deliveries/" + code);

        deliveryRef.once("value").then(snap => {
            const data = snap.val();
            const paused = data.trackingPaused || false;
            const elapsedBeforePause = data.elapsedBeforePause || 0;
            const resumeAt = data.resumeAt || startTime;
            const now = Date.now();

            let elapsed = paused
                ? elapsedBeforePause
                : elapsedBeforePause + Math.floor((now - resumeAt) / 1000);

            if (elapsed >= totalSeconds) {
                pointer.setLatLng(destCoords);
                updateCountdown(0, paused);
                return;
            }

            const newLat = pickupCoords[0] + latStep * elapsed;
            const newLng = pickupCoords[1] + lngStep * elapsed;
            pointer.setLatLng([newLat, newLng]);

            updateCountdown(totalSeconds - elapsed, paused);
            setTimeout(tick, 1000);
        });
    }

    tick();
}

// === Countdown Display ===
function updateCountdown(seconds, paused = false) {
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

    if (paused) {
        countdown.innerText = "⏸️ Paused";
    } else if (seconds <= 0) {
        countdown.innerText = "Delivered ✅";
    } else {
        const hrs = Math.floor(seconds / 3600);
        const mins = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        countdown.innerText = `ETA: ${hrs}h ${mins}m ${secs}s`;
    }
}

// 🔐 Admin passcode
const adminPasscode = "Secure123";

// 🎛️ Admin button logic
document.getElementById("adminButton").addEventListener("click", () => {
    const input = prompt("Enter admin passcode:");
    if (input === adminPasscode) {
        document.getElementById("controlPanel").style.display = "block";
    } else {
        alert("❌ Incorrect passcode!");
    }
});

// ⏯️ Pause / Resume toggle
function toggleTracking() {
    const ref = db.ref("deliveries/" + code);

    ref.once("value").then(snap => {
        const data = snap.val();
        const isPaused = data.trackingPaused || false;

        if (!isPaused) {
            // Pausing
            const now = Date.now();
            const resumeAt = data.resumeAt || data.startTime;
            const elapsedBeforePause = (data.elapsedBeforePause || 0) + Math.floor((now - resumeAt) / 1000);

            ref.update({
                trackingPaused: true,
                pausedAt: now,
                elapsedBeforePause: elapsedBeforePause
            }).then(() => {
                alert("⏸️ Tracking Paused");
            });
        } else {
            // Resuming
            const resumeAt = Date.now();
            ref.update({
                trackingPaused: false,
                resumeAt: resumeAt
            }).then(() => {
                alert("▶️ Tracking Resumed");
            });
        }
    });
}
