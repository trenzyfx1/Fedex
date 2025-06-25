let generatedCode = "";

function generateCode(event) {
    if (event) event.preventDefault();

    const fields = [
        'senderName', 'senderPhone', 'senderEmail', 'senderLocation',
        'receiverName', 'receiverPhone', 'receiverEmail', 'receiverAddress',
        'sentTime', 'pickupTime', 'pickupLoc', 'currentLoc', 'destination',
        'weight', 'condition', 'selected'
    ];

    let data = {};

    fields.forEach(id => {
        const input = document.getElementById(id);
        data[id] = input ? input.value.trim() : "";
    });

    document.querySelector(".code-box")?.remove();

    const btn = document.querySelector(".btn");
    btn.disabled = true;
    const originalText = btn.innerText;
    btn.innerText = "Generating...";

    setTimeout(() => {
        // Generate a random tracking code
        generatedCode = "TRK" + String(Math.floor(Math.random() * 1_000_000_000)).padStart(9, "0");

        // Save to Firebase
        firebase.database().ref("deliveries/" + generatedCode).set(data)
            .then(() => {
                showCode(generatedCode);
                btn.disabled = false;
                btn.innerText = originalText;
            })
            .catch((error) => {
                alert("❌ Failed to save tracking info.");
                console.error("Firebase error:", error);
                btn.disabled = false;
                btn.innerText = originalText;
            });
    }, 1000);
}

function showCode(code) {
    const container = document.createElement("div");
    container.className = "code-box";
    container.style.marginTop = "20px";

    container.innerHTML = `
        <p><strong>Tracking Code:</strong> <span id="theCode">${code}</span></p>
        <button onclick="copyCode(this)">Copy</button>
    `;

    document.getElementById("trackingForm").appendChild(container);
}

function copyCode(btn) {
    const codeText = document.getElementById("theCode").innerText;
    navigator.clipboard.writeText(codeText).then(() => {
        btn.innerText = "Copied!";
        setTimeout(() => {
            btn.innerText = "Copy";
        }, 2000);
    });
}

// Add this after 'set' inside the .then()
firebase.database().ref("deliveries/" + generatedCode + "/trackingPaused").set(false);
