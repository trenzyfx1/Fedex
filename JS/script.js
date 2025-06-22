// DEVELOPED AND DESIGNED BY ME : CHRISTIAN TREASURE

const hamburger = document.getElementById('hamburger');
const navbar = document.getElementById('navbar');

hamburger.onclick = () => {
    navbar.classList.toggle('show');
};

function startTracking() {
    const input = document.getElementById("trackingInput").value;
    if (input.trim() !== "") {
        alert("Tracking " + input);
    }
}

function unlockAdmin() {
    const pass = prompt("Enter Admin Access Code:");
    if (pass === "Secure123") {
        window.location.href = "admin.html";
    } else {
        alert("Wrong pass! Access denied.");
    }
}

function startTracking() {
    const code = document.getElementById('trackingInput').value.trim();
    if (!code) {
        alert("Please enter a tracking ID.");
        return;
    }
    sessionStorage.setItem("trackingCode", code);
    window.location.href = "tracking.html";
}