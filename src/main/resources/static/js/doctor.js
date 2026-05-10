// js/doctor.js - Logic for the Doctor's Private OPD Console (d_dashboard.html)

const doctorName = localStorage.getItem('doctorName');
const doctorId = localStorage.getItem('doctorId');
let currentStatus = 'OFFLINE'; 
let currentToken = null;
let currentPatientMobile = null;

// Guard check
document.addEventListener("DOMContentLoaded", () => {
    if (!doctorName || !doctorId) {
        window.location.href = 'login.html';
        return;
    }
    document.getElementById('welcomeMsg').innerText = doctorName;
    updateStatusUI('OFFLINE');
    fetchQueue(); 
    setInterval(fetchQueue, 5000); // Poll every 5s
});

// --- STATUS LOGIC ---
async function setStatus(status) {
    currentStatus = status;
    updateStatusUI(status);
    try {
        await fetch(`/api/doctors/${doctorId}/status`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ status: status })
        });
        fetchQueue();
    } catch (e) { 
        console.error("Status error", e); 
    }
}

function updateStatusUI(status) {
    document.querySelectorAll('.status-btn').forEach(b => b.classList.remove('active'));
    if(status === 'AVAILABLE') document.getElementById('btn-available').classList.add('active');
    if(status === 'BREAK') document.getElementById('btn-break').classList.add('active');
    if(status === 'OFFLINE') document.getElementById('btn-offline').classList.add('active');
}

// --- QUEUE FETCH LOGIC ---
async function fetchQueue() {
    if (currentStatus === 'OFFLINE') {
        document.getElementById('queueList').innerHTML = '<li class="u-text-center u-text-muted">You are offline.</li>';
        document.getElementById('queueCount').innerText = "0 Waiting";
        clearDisplay();
        return;
    }

    try {
        const response = await fetch('/api/appointments/live?doctor=' + encodeURIComponent(doctorName));
        const queue = await response.json();

        document.getElementById('queueCount').innerText = `${queue.length} Waiting`;
        const listEl = document.getElementById('queueList');
        listEl.innerHTML = '';

        if (queue.length > 0) {
            const p = queue[0]; // Currently serving
            document.getElementById('displayName').innerText = p.patientName;
            document.getElementById('displayToken').innerText = "#" + p.tokenNumber;
            document.getElementById('displaySymptoms').innerText = p.symptoms;
            document.getElementById('displayMobile').innerText = "+91 " + p.patientMobile;
            
            document.getElementById('symptomBox').classList.remove('u-hidden');
            document.getElementById('clinicalSection').classList.remove('u-hidden');
            document.getElementById('actionSection').classList.remove('u-hidden');

            currentToken = p.tokenNumber;
            
            // 🚨 LOAD PATIENT HISTORY IF IT'S A NEW PATIENT
            if (currentPatientMobile !== p.patientMobile) {
                currentPatientMobile = p.patientMobile;
                loadPatientHistory(p.patientMobile);
            }

            // Populate remaining queue sidebar
            queue.forEach((appt, index) => {
                const isCurrent = index === 0;
                listEl.innerHTML += `
                    <li style="border-left: 4px solid ${isCurrent ? '#0056b3' : 'transparent'}; background: ${isCurrent ? '#e3f2fd' : 'white'}">
                        <strong>#${appt.tokenNumber} - ${appt.patientName}</strong><br>
                        <small class="u-text-grey">${appt.symptoms}</small>
                    </li>
                `;
            });
        } else {
            clearDisplay();
            listEl.innerHTML = '<li class="u-text-center u-text-muted">Queue is empty.</li>';
        }
    } catch (e) {
        console.error(e);
    }
}

// --- FETCH PATIENT HISTORY ---
async function loadPatientHistory(mobile) {
    const container = document.getElementById('patientHistoryList');
    if (!container) return; // Failsafe
    
    container.innerHTML = '<p class="u-text-muted">Loading history...</p>';
    
    try {
        const response = await fetch('/api/appointments/mine?mobile=' + encodeURIComponent(mobile));
        const history = await response.json();

        const pastVisits = history.filter(h => h.status === 'COMPLETED');

        if (pastVisits.length === 0) {
            container.innerHTML = '<p class="u-text-muted">No past visits found. This is a new patient.</p>';
            return;
        }

        container.innerHTML = pastVisits.map(v => `
            <div class="history-item">
                <div class="history-date">📅 ${v.date || 'Previous Visit'}</div>
                <div class="history-details">
                    <strong>Consulted: ${v.doctorName}</strong>
                    <p><em>Reason:</em> ${v.symptoms}</p>
                    <div class="prescription-text">💊 Rx: ${v.prescription || 'No medicines recorded.'}</div>
                </div>
            </div>
        `).join('');
    } catch (e) {
        container.innerHTML = '<p class="u-text-muted">⚠️ Failed to load history.</p>';
    }
}

function clearDisplay() {
    document.getElementById('displayName').innerText = "Queue Empty";
    document.getElementById('displayToken').innerText = "--";
    document.getElementById('symptomBox').classList.add('u-hidden');
    document.getElementById('clinicalSection').classList.add('u-hidden');
    document.getElementById('actionSection').classList.add('u-hidden');
    currentToken = null;
    currentPatientMobile = null;
    
    const historyContainer = document.getElementById('patientHistoryList');
    if(historyContainer) historyContainer.innerHTML = '<p class="u-text-muted">Waiting for patient data...</p>';
}

// --- OPD ACTIONS ---
async function callPatient() {
    if (!currentToken) return;
    const btn = document.querySelector('.btn-view');
    const originalText = btn.innerText;
    btn.innerText = "Calling...";
    
    try {
        const response = await fetch('/api/appointments/notify/' + currentToken, { method: 'POST' });
        const result = await response.json();
        alert(result.status === 'success' ? result.message : "Error: " + result.message);
    } catch (e) {
        alert("Failed to connect to server.");
    } finally {
        btn.innerText = originalText;
    }
}

async function swapPatient() {
    if(!confirm(`Patient not here?\n\nThis will move Token #${currentToken} BEHIND the next patient.`)) return;
    try {
        const response = await fetch('/api/appointments/swap/' + currentToken, { method: 'POST' });
        const result = await response.json();
        if(result.status === 'success') { fetchQueue(); } 
        else { alert("⚠️ " + result.message); }
    } catch (e) { console.error(e); }
}

async function completeVisit() {
    const notes = document.getElementById('prescriptionBox').value.trim();
    if (!notes && !confirm("⚠️ Prescription is empty. Are you sure you want to finish?")) return;

    await fetch('/api/appointments/complete/' + currentToken, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ doctorName: doctorName, prescription: notes })
    });

    document.getElementById('prescriptionBox').value = "";
    alert("✅ Visit Completed. Calling Next Patient...");
    fetchQueue();
}

function logout() { 
    localStorage.clear(); 
    window.location.href = 'index.html'; 
}