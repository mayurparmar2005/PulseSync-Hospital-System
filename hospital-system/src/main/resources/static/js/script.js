// js/index.js - Landing Page Logic

function openEmergency() {
    const confirmed = confirm(
        '🚨 MEDICAL EMERGENCY PROTOCOL ACTIVATED\n\n' +
        'Immediate Steps:\n' +
        '1️⃣ Proceed directly to the ER / Reception Desk.\n' +
        '2️⃣ PulseSync staff will scan your ID for instant admission.\n\n' +
        'Proceed to staff instructions?'
    );
    if (confirmed) window.location.href = 'reception-login.html';
}