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
db.ref("deliveries/" + code).once('value').then(snapshot => {
  const data = snapshot.val();
  if (!data) {
    alert("Tracking data not found.");
    return;
  }

  const pickup = data.pickupLoc || "Lagos, Nigeria";
  const destination = data.destination || "Abuja, Nigeria";

  Promise.all([
    getCoordinates(pickup),
    getCoordinates(destination)
  ]).then(coords => {
    const pickupCoords = coords[0];
    const destCoords = coords[1];
    showMap(pickupCoords, destCoords);
  }).catch(err => {
    console.error("Geocoding failed:", err);
    alert("Failed to get map locations.");
  });

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

// === Show map with pins and animate van ===
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

  // === VAN ICON ===
  const vanIcon = L.icon({
    iconUrl: './images/van-icon.png', // make sure this image exists
    iconSize: [50, 50],
    iconAnchor: [25, 25]
  });

  const van = L.marker(pickupCoords, { icon: vanIcon }).addTo(map);

  // === Animate Van ===
  const steps = 300;
  let i = 0;
  const latStep = (destCoords[0] - pickupCoords[0]) / steps;
  const lngStep = (destCoords[1] - pickupCoords[1]) / steps;

  const duration = 10000;
  const interval = duration / steps;

  function animate() {
    if (i <= steps) {
      const newLat = pickupCoords[0] + latStep * i;
      const newLng = pickupCoords[1] + lngStep * i;
      van.setLatLng([newLat, newLng]);
      i++;
      requestAnimationFrame(animate);
    }
  }

  animate();

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
  countdown.innerText = "ETA: 10s";
  document.body.appendChild(countdown);

  let secondsLeft = 10;
  const timer = setInterval(() => {
    secondsLeft--;
    if (secondsLeft <= 0) {
      countdown.innerText = "Delivered ✅";
      clearInterval(timer);
    } else {
      countdown.innerText = `ETA: ${secondsLeft}s`;
    }
  }, 1000);
}
