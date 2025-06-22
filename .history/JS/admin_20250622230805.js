// DEVELOPED AND DESIGNED BY ME : CHRISTIAN TREASURE
<!-- Firebase SDKs (CDN-based for vanilla JS projects) -->
<script src="https://www.gstatic.com/firebasejs/9.22.1/firebase-app-compat.js"></script>
<script src="https://www.gstatic.com/firebasejs/9.22.1/firebase-database-compat.js"></script>

<script>
  // Your Firebase config (no changes here)
  const firebaseConfig = {
    apiKey: "AIzaSyAJdVGin4DZyvTtmTg6WnhAendyBGEm2gs",
    authDomain: "my-portfolio-8ce7d.firebaseapp.com",
    databaseURL: "https://my-portfolio-8ce7d-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "my-portfolio-8ce7d",
    storageBucket: "my-portfolio-8ce7d.firebasestorage.app",
    messagingSenderId: "1042582859597",
    appId: "1:1042582859597:web:42e61808d161c24100d104",
    measurementId: "G-N3X8L94E7X"
  };

  // Initialize Firebase
  firebase.initializeApp(firebaseConfig);
  const database = firebase.database();
</script>
