// Firebase Config
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

// Initialize Firebase (make sure Firebase SDKs are loaded in your HTML!)
firebase.initializeApp(firebaseConfig);
const db = firebase.database();

// Get tracking code from URL (e.g. ?code=TRK123456789)
const urlParams = new URLSearchParams(window.location.search);
const code = urlParams.get('code');

if (!code) {
    alert("❌ No tracking code provided in the URL.");
} else {
    // Fetch data from Firebase (MAKE SURE you use the correct node: deliveries/code)
    db.ref("deliveries/" + code).once('value')
        .then(snapshot => {
            const data = snapshot.val();

            if (!data) {
                alert("❌ Tracking data not found in Firebase.");
                return;
            }

            document.getElementById('loading')?.style.display = 'none';

            // Use fallback locations if any are missing
            const pickup = data.pickupLoc || "Lagos, Nigeria";
            const destination = data.destination || "Abuja, Nigeria";

            // Call your map logic with locations
            showMap(pickup, destination);
        })
        .catch(error => {
            console.error("Firebase error:", error);
            alert("⚠️ Error fetching tracking data.");
        });
}
