// js/doctor.js - Merged Logic for the New OPD Console

// 1. Unified Authentication Check
const doctorUser = JSON.parse(localStorage.getItem('doctorUser') || '{}');
const doctorName = doctorUser.fullName || localStorage.getItem('doctorName');
const doctorId = doctorUser.id || localStorage.getItem('doctorId');

let currentStatus = 'OFFLINE'; 
let currentToken = null;
let currentPatientMobile = null;

// Guard check
document.addEventListener("DOMContentLoaded", () => {
    if (!doctorName) {
        window.location.href = 'login.html';
        return;
    }
    
    // Set the doctor's name in the top bar
    document.querySelector('.welcome-msg').innerHTML = `Dr. ${doctorName} <span class="u-text-muted">| OPD Console</span>`;
    
    updateStatusUI('OFFLINE');
    fetchQueue(); 
    setInterval(fetchQueue, 5000); // Poll every 5s for live updates
});

// --- STATUS LOGIC ---
async function setStatus(status) {
    currentStatus = status;
    updateStatusUI(status);
    
    // Optional: If you have a status endpoint, keep this. If not, it just updates UI.
    if(doctorId) {
        try {
            await fetch(`/api/doctors/${doctorId}/status`, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({ status: status })
            });
        } catch (e) { console.error("Status error", e); }
    }
    fetchQueue();
}

function updateStatusUI(status) {
    document.querySelectorAll('.status-btn').forEach(b => b.classList.remove('active'));
    if(status === 'AVAILABLE' || status === 'ACTIVE') document.querySelector('.btn-online').classList.add('active');
    if(status === 'BREAK') document.querySelector('.btn-break').classList.add('active');
    if(status === 'OFFLINE') document.querySelector('.btn-offline').classList.add('active');
}

// Attach event listeners to status buttons
document.querySelector('.btn-online').addEventListener('click', () => setStatus('ACTIVE'));
document.querySelector('.btn-break').addEventListener('click', () => setStatus('BREAK'));
document.querySelector('.btn-offline').addEventListener('click', () => setStatus('OFFLINE'));


// --- QUEUE FETCH LOGIC ---
async function fetchQueue() {
    if (currentStatus === 'OFFLINE') {
        document.getElementById('doctorQueueList').innerHTML = '<li style="padding: 15px; color: #666;">You are offline.</li>';
        clearDisplay();
        return;
    }

    try {
        const response = await fetch('/api/appointments/live?doctor=' + encodeURIComponent(doctorName));
        const queue = await response.json();

        // Update the header count
        const headerCount = document.querySelector('.queue-header p');
        if(headerCount) headerCount.innerText = `${queue.length} Waiting`;

        const listEl = document.getElementById('doctorQueueList');
        listEl.innerHTML = '';

        if (queue.length > 0) {
            const p = queue[0]; // Currently serving

            // Inject data into the main workspace
            document.getElementById('displayName').innerText = p.patientName;
            document.getElementById('displayToken').innerText = "Token #" + p.tokenNumber;
            document.getElementById('displaySymptoms').innerText = p.symptoms;
            document.getElementById('displayMobile').innerText = "+91 " + p.patientMobile;
            
            document.getElementById('vitalsBox').style.display = 'flex';
            document.getElementById('activePatientCard').style.opacity = '1';

            currentToken = p.tokenNumber;
            
            // 🚨 LOAD PATIENT HISTORY ONLY IF IT'S A NEW PATIENT
            if (currentPatientMobile !== p.patientMobile) {
                currentPatientMobile = p.patientMobile;
                loadPatientHistory(p.patientMobile);
            }

            // Populate the smart queue sidebar
            queue.forEach((appt, index) => {
                const isCurrent = index === 0;
                listEl.innerHTML += `
                    <li style="${isCurrent ? 'background: #e3f2fd; border-left: 4px solid #0056b3;' : 'cursor: pointer;'}">
                        <strong style="${isCurrent ? 'color: #0056b3;' : ''}">#${appt.tokenNumber} ${appt.patientName}</strong>
                        <p class="u-text-small" style="margin-top: 5px;"><strong>C/O:</strong> ${appt.symptoms || 'Not specified'}</p>
                    </li>
                `;
            });
        } else {
            clearDisplay();
            listEl.innerHTML = '<li style="padding: 15px; color: #666;">Queue is empty. Take a break! ☕</li>';
        }
    } catch (e) {
        console.error("Error fetching queue:", e);
    }
}

// --- FETCH PATIENT HISTORY ---
async function loadPatientHistory(mobile) {
    const container = document.getElementById('patientHistoryList');
    if (!container) return; 
    
    container.innerHTML = '<p class="u-text-muted">Loading history...</p>';
    
    try {
        const response = await fetch('/api/appointments/mine?mobile=' + encodeURIComponent(mobile));
        const history = await response.json();

        const pastVisits = history.filter(h => h.status === 'COMPLETED');

        if (pastVisits.length === 0) {
            container.innerHTML = '<p class="u-text-muted" style="margin-top: 10px;">No past visits found. New patient.</p>';
            return;
        }

        container.innerHTML = pastVisits.map(v => `
            <div class="history-item">
                <div class="history-date">📅 ${v.date || 'Previous Visit'}</div>
                <div class="history-details">
                    <strong>Dr. ${v.doctorName}</strong>
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
    document.getElementById('vitalsBox').style.display = 'none';
    
    // Dim the workspace
    document.getElementById('activePatientCard').style.opacity = '0.5';
    
    currentToken = null;
    currentPatientMobile = null;
    
    const historyContainer = document.getElementById('patientHistoryList');
    if(historyContainer) historyContainer.innerHTML = '<p class="u-text-muted">Waiting for patient data...</p>';
}

// --- OPD ACTIONS ---
async function swapPatient() {
    if(!currentToken) return;
    if(!confirm(`Patient not responding?\n\nThis will move Token #${currentToken} behind the next patient.`)) return;
    try {
        const response = await fetch('/api/appointments/swap/' + currentToken, { method: 'POST' });
        const result = await response.json();
        if(result.status === 'success') { fetchQueue(); } 
        else { alert("⚠️ " + result.message); }
    } catch (e) { console.error(e); }
}

async function completeVisit() {
    if(!currentToken) return;
    const notes = document.getElementById('prescriptionBox').value.trim();
    if (!notes && !confirm("⚠️ Prescription is empty. Are you sure you want to finish?")) return;

    try {
        await fetch('/api/appointments/complete/' + currentToken, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ doctorName: doctorName, prescription: notes })
        });

        document.getElementById('prescriptionBox').value = "";
        alert("✅ Visit Completed. Calling Next Patient...");
        fetchQueue();
    } catch (e) {
        alert("Server error while saving prescription.");
    }
}