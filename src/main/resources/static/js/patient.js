// js/patient.js - Logic for Patient Dashboard

const patientName   = localStorage.getItem('patientName');
const patientMobile = localStorage.getItem('patientMobile');

document.addEventListener("DOMContentLoaded", () => {
    // Guard: redirect to login if not logged in
    if (!patientName) {
        window.location.href = 'login.html';
        return;
    }

    // Set display name and avatar
    document.getElementById('navPatientName').innerText = patientName || 'Patient';
    document.getElementById('settingName').value        = patientName || '--';
    document.getElementById('settingMobile').value      = patientMobile || '--';

    const initials = (patientName || 'P').split(' ').map(w => w[0]).join('').toUpperCase().substring(0, 2);
    document.getElementById('navAvatar').innerText = initials;

    // Set QR code for this patient
    if (patientMobile) {
        document.getElementById('qrImage').src = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=PulseSync-${patientMobile}`;
    }

    // Load data on page load
    loadQueueStatus();
    loadHistory();
    loadPatientSettings();

    // Auto-refresh queue every 5 seconds
    setInterval(loadQueueStatus, 5000);
});

// ─── SECTION SWITCH ──────────────────────────────────────
function showSection(sectionId, clickedEl) {
    document.querySelectorAll('.content-section').forEach(s => s.classList.add('u-hidden'));
    document.getElementById(sectionId).classList.remove('u-hidden');
    document.querySelectorAll('#nav-list li').forEach(li => li.classList.remove('active'));
    if (clickedEl) clickedEl.classList.add('active');
}

// ─── FETCH REAL QUEUE STATUS ─────────────────────────────
async function loadQueueStatus() {
    if (!patientMobile) {
        document.getElementById('loadingMsg').innerText = '⚠️ Mobile not saved. Please log in again.';
        return;
    }

    try {
        const res  = await fetch(`/api/appointments/mine?mobile=${encodeURIComponent(patientMobile)}`);
        const appts = await res.json();

        const today = new Date().toISOString().split('T')[0];
        const todayAppt = appts.find(a => a.date === today && a.status === 'WAITING');
        const completedToday = appts.find(a => a.date === today && a.status === 'COMPLETED');

        document.getElementById('loadingMsg').classList.add('u-hidden');

        if (todayAppt) {
            const qRes  = await fetch(`/api/appointments/live?doctor=${encodeURIComponent(todayAppt.doctorName)}`);
            const queue = await qRes.json();

            const myPos  = queue.findIndex(a => a.tokenNumber === todayAppt.tokenNumber);
            const ahead  = myPos === -1 ? 0 : myPos; 
            const running = queue.length > 0 ? queue[0].tokenNumber : '--';

            document.getElementById('queueInfo').classList.remove('u-hidden');
            document.getElementById('noApptMsg').classList.add('u-hidden');
            document.getElementById('myToken').innerText      = '#' + todayAppt.tokenNumber;
            document.getElementById('myDoctorName').innerText = todayAppt.doctorName;
            document.getElementById('myDoctorSpec').innerText = todayAppt.doctorSpecialization || 'OPD';
            document.getElementById('current-token').innerText= running !== '--' ? '#' + running : '--';

            const waitMins = ahead * 8;
            const waitText = ahead === 0 ? '🎉 You\'re Next!' : `${ahead} patient(s) • ~${waitMins} min wait`;
            document.getElementById('patientsAhead').innerText = waitText;

            if (myPos === 0) {
                document.getElementById('statusMsg').innerText = '🔔 Please enter the doctor\'s room!';
                document.getElementById('statusMsg').style.color = '#28a745';
            } else {
                document.getElementById('statusMsg').innerText = '';
            }

            const totalInQueue = queue.length;
            const pct = totalInQueue > 0 ? Math.max(0, ((totalInQueue - ahead) / totalInQueue) * 100) : 0;
            document.getElementById('progressBarContainer').style.display = 'block';
            document.getElementById('progressFill').style.width = pct + '%';

        } else if (completedToday) {
            document.getElementById('queueInfo').classList.add('u-hidden');
            const msgBox = document.getElementById('noApptMsg');
            msgBox.classList.remove('u-hidden');
            msgBox.innerHTML = `
                <p>✅ Your appointment with <strong>${completedToday.doctorName}</strong> is completed.</p>
                <p class="u-text-small u-text-muted u-mt-10">Thank you for visiting PulseSync.</p>`;
        } else {
            document.getElementById('queueInfo').classList.add('u-hidden');
            document.getElementById('noApptMsg').classList.remove('u-hidden');
        }

    } catch (err) {
        console.error('Queue fetch error:', err);
        document.getElementById('loadingMsg').innerText = '⚠️ Could not connect to server.';
    }
}

// ─── FETCH VISIT HISTORY ──────────────────────────────────
async function loadHistory() {
    if (!patientMobile) return;
    try {
        const res   = await fetch(`/api/appointments/mine?mobile=${encodeURIComponent(patientMobile)}`);
        const appts = await res.json();
        
        const histList  = document.getElementById('historyList');
        const allList   = document.getElementById('allAppointmentsList');
        const completed = appts.filter(a => a.status === 'COMPLETED');

        if (completed.length === 0) {
            histList.innerHTML = '<p class="u-text-muted">No past visits found.</p>';
        } else {
            histList.innerHTML = completed.map(a => `
                <div class="record-item">
                    <div class="record-date">${formatDateGlobal(a.date)}</div>
                    <div class="record-info">
                        <h4>${a.symptoms || 'General Consultation'}</h4>
                        <p>${a.doctorName} (${a.doctorSpecialization || 'OPD'}) • Token #${a.tokenNumber}</p>
                        ${a.prescription ? `<p style="color:#0056b3; font-size:0.85rem; margin-top:4px;">📝 <em>${a.prescription}</em></p>` : ''}
                    </div>
                    <span style="color:#28a745; font-weight:bold;">✅ Done</span>
                </div>`).join('');
        }

        if (appts.length === 0) {
            allList.innerHTML = '<p class="u-text-muted">No appointments found.</p>';
        } else {
            allList.innerHTML = appts.map(a => `
                <div class="record-item">
                    <div class="record-date">${formatDateGlobal(a.date)}</div>
                    <div class="record-info">
                        <h4>${a.symptoms || 'General'} — ${a.doctorName}</h4>
                        <p>Token #${a.tokenNumber}</p>
                    </div>
                    <span style="color:${a.status === 'COMPLETED' ? '#28a745' : '#ffc107'}; font-weight:bold;">
                        ${a.status === 'COMPLETED' ? '✅ Done' : '⏳ Waiting'}
                    </span>
                </div>`).join('');
        }
    } catch (err) { console.error('History fetch error:', err); }
}

// ─── FETCH PATIENT PROFILE ───────────────────────────────
async function loadPatientSettings() {
    if (!patientMobile) return;
    try {
        const res  = await fetch(`/api/patients?mobile=${encodeURIComponent(patientMobile)}`);
        const data = await res.json();
        if (data.status === 'success') {
            document.getElementById('settingName').value      = data.name   || '--';
            document.getElementById('settingMobile').value    = data.mobile || '--';
            document.getElementById('settingAbha').value      = data.abhaId || 'Not Assigned';
            const age    = data.age    ? data.age + ' yrs'   : '--';
            const gender = data.gender ? ' / ' + data.gender : '';
            document.getElementById('settingAgeGender').value = age + gender;
        }
    } catch (err) { console.error('Settings fetch error:', err); }
}

// ─── HELPERS ──────────────────────────────────────────────
function openQRModal()  { document.getElementById('qr-modal').style.display  = 'flex'; }
function closeQRModal() { document.getElementById('qr-modal').style.display  = 'none'; }
window.onclick = e => { if (e.target === document.getElementById('qr-modal')) closeQRModal(); };

function logout() {
    localStorage.removeItem('patientName');
    localStorage.removeItem('patientMobile');
    window.location.href = 'login.html';
}