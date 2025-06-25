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

  // Fetch coordinates for both locations
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

// === Show map with pins and line ===
function showMap(pickupCoords, destCoords) {
  loading.style.display = 'none';

  const map = L.map('map').setView(pickupCoords, 6);

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors'
  }).addTo(map);

  const pickupMarker = L.marker(pickupCoords).addTo(map).bindPopup("Pickup Location").openPopup();
  const destMarker = L.marker(destCoords).addTo(map).bindPopup("Destination");

  // Draw a polyline
  const route = L.polyline([pickupCoords, destCoords], {
    color: 'blue',
    weight: 4,
    opacity: 0.7,
    dashArray: '10,10'
  }).addTo(map);

  // Zoom map to fit both markers
  map.fitBounds(route.getBounds());

  // 👇 Next step: animate bus along `route.getLatLngs()`
}
