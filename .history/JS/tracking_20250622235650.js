// DEVELOPED AND DESIGNED BY ME : CHRISTIAN TREASURE

console.log("Tracking JS loaded!");

window.addEventListener('DOMContentLoaded', () => {
    const code = sessionStorage.getItem("trackingCode");
    console.log("Code from sessionStorage:", code);

    if (!code) {
        showNotFound();
        return;
    }

    setTimeout(() => {
        firebase.database().ref("deliveries/" + code).once("value")
            .then(snapshot => {
                const data = snapshot.val();

                if (data) {
                    // Sender Info
                    setText('senderName', data.senderName);
                    setText('senderPhone', data.senderPhone);
                    setText('senderEmail', data.senderEmail);
                    setText('senderLocation', data.senderLocation);

                    // Receiver Info
                    setText('receiverName', data.receiverName);
                    setText('receiverPhone', data.receiverPhone);
                    setText('receiverEmail', data.receiverEmail);
                    setText('receiverAddress', data.receiverAddress);

                    // Package Info
                    setText('sentTime', formatDateTime(data.sentTime));
                    setText('pickupTime', formatDateTime(data.pickupTime));
                    setText('pickupLoc', data.pickupLoc);
                    setText('currentLoc', data.currentLoc);
                    setText('destination', data.destination);
                    setText('weight', data.weight);
                    setText('condition', data.condition);
                    setText('selected', data.selected);

                    document.getElementById('loadingSection').classList.add('hidden');
                    document.getElementById('resultSection').classList.remove('hidden');
                } else {
                    showNotFound();
                }
            })
            .catch(error => {
                console.error("Firebase error:", error);
                showNotFound();
            });
    }, 2500);
});

function showNotFound() {
    document.getElementById('loadingSection').classList.add('hidden');
    document.getElementById('notFound').classList.remove('hidden');
}

function setText(id, value) {
    const el = document.getElementById(id);
    if (el) el.textContent = value || "N/A";
}

function formatDateTime(value) {
    const date = new Date(value);
    return isNaN(date) ? value : date.toLocaleString();
}

let bus = null;
let paused = false;

function startMapTracking() {
  document.getElementById('mapTrackingSection').classList.remove('hidden');
  bus = document.getElementById('bus');
}

function pauseBus() {
  if (bus) bus.style.animationPlayState = 'paused';
}

function playBus() {
  if (bus) bus.style.animationPlayState = 'running';
}
