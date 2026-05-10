// js/reception.js - Unified Logic for Reception & Admin Dashboards

// ─── ADMIN AUTH GUARD ──────────────────────────────────────────
const adminUser = localStorage.getItem('adminUser');
const isLoginPage = window.location.pathname.includes('reception-login.html');

if (!adminUser && !isLoginPage) {
    window.location.href = 'reception-login.html';
}

function doAdminLogout() {
    localStorage.removeItem('adminUser');
    window.location.href = 'index.html';
}

document.addEventListener("DOMContentLoaded", () => {
    
    // ─── 1. RECEPTION LOGIN PAGE LOGIC ───
    const loginForm = document.getElementById('adminLoginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('adminEmail').value.trim();
            const password = document.getElementById('adminPassword').value;
            const errorBox = document.getElementById('adminError');

            try {
                const response = await fetch('/api/auth/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ identifier: email, password: password })
                });
                const result = await response.json();

                if (result.status === 'success' && result.role === 'receptionist') {
                    localStorage.setItem('adminUser', result.name);
                    window.location.href = 'rc_dashboard.html'; 
                } else {
                    errorBox.innerText = "❌ Access Denied: Invalid Credentials.";
                    errorBox.classList.remove('u-hidden');
                }
            } catch (error) {
                errorBox.innerText = "⚠️ Server Error. Check connection.";
                errorBox.classList.remove('u-hidden');
            }
        });
    }

    // ─── 2. WALK-IN REGISTRATION PAGE LOGIC (rc_dashboard) ───
    const doctorSelect = document.getElementById('doctorSelect');
    if (doctorSelect) {
        loadDoctorsForRegistration();
    }

    // ─── 3. LIVE MONITOR PAGE LOGIC ───
    if (document.getElementById('monitorList')) {
        loadMonitor();
        setInterval(loadMonitor, 5000);
    }

    // ─── 4. PATIENT RECORDS PAGE LOGIC ───
    if (document.getElementById('recordTable')) {
        loadRecords();
        document.getElementById('searchInput').addEventListener('input', applyFilters);
        document.getElementById('statusFilter').addEventListener('change', applyFilters);
    }
});

// ============================================================================
// SPECIFIC PAGE FUNCTIONS
// ============================================================================

// ─── REGISTRATION FUNCTIONS ───
async function loadDoctorsForRegistration() {
    const doctorSelect = document.getElementById('doctorSelect');
    try {
        const response = await fetch('/api/doctors');
        const doctors = await response.json();
        const exDoctorSelect = document.getElementById('exDoctorSelect'); // The new one
        const erDoctorSelect = document.getElementById('erDoctorSelect');
        if(erDoctorSelect) erDoctorSelect.innerHTML = doctorSelect.innerHTML;
        
        doctorSelect.innerHTML = '<option value="">-- Select a Doctor --</option>';
        if(exDoctorSelect) exDoctorSelect.innerHTML = '<option value="">-- Select a Doctor --</option>';

        doctors.forEach(doc => {
            const option1 = document.createElement('option');
            option1.value = doc.fullName;
            option1.dataset.spec = doc.specialization || 'General';
            option1.text = `${doc.fullName} (${doc.specialization || 'General'})`;
            doctorSelect.appendChild(option1);

            if(exDoctorSelect) {
                const option2 = option1.cloneNode(true);
                exDoctorSelect.appendChild(option2);
            }
        });
    } catch (error) {
        doctorSelect.innerHTML = '<option>Error loading list</option>';
    }
}

async function registerAndBook() {
    const name     = document.getElementById('pName').value.trim();
    const age      = document.getElementById('pAge').value;
    const gender   = document.getElementById('pGender').value;
    const mobile   = document.getElementById('pMobile').value.trim();
    const doctor   = document.getElementById('doctorSelect').value;
    const symptoms = document.getElementById('pSymptoms').value.trim();

    const selectedOption = document.getElementById('doctorSelect').selectedOptions[0];
    const doctorSpecialization = selectedOption ? selectedOption.dataset.spec || '' : '';

    if (!name || !mobile || !doctor) return alert("Please fill Name, Mobile, and Select a Doctor!");

    try {
        const regResponse = await fetch('/api/patients/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, age, gender, mobile })
        });
        const regResult = await regResponse.json();

        updateCardUI(name, age, gender, regResult.abha || "EXISTING", mobile);

        const bookResponse = await fetch('/api/appointments/book', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, mobile, doctor, symptoms, doctorSpecialization })
        });
        const bookResult = await bookResponse.json();

        if (bookResult.status === 'success') {
            document.getElementById('tokenDisplay').classList.remove('u-hidden');
            document.getElementById('bigTokenNumber').innerText = "#" + bookResult.token;
            alert(`🎉 Success!\nToken #${bookResult.token} assigned for ${doctor}.`);
        } else {
            alert("❌ Booking Failed: " + bookResult.message);
        }
    } catch (error) {
        alert("Server Error. Is the Spring Boot app running?");
    }
}

async function generateCard() {
    const name   = document.getElementById('pName').value.trim();
    const age    = document.getElementById('pAge').value;
    const gender = document.getElementById('pGender').value;
    const mobile = document.getElementById('pMobile').value.trim();

    if (!name || !mobile) return alert("Please fill in Name and Mobile to generate a card.");

    try {
        const regResponse = await fetch('/api/patients/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, age, gender, mobile })
        });
        const regResult = await regResponse.json();

        if (regResult.status === 'success') {
            updateCardUI(name, age, gender, regResult.abha, mobile);
            document.getElementById('tokenDisplay').classList.add('u-hidden');
            alert(`✅ Health Passport created!\nABHA: ${regResult.abha}\nDefault password: pulse123`);
        } else {
            updateCardUI(name, age, gender, "EXISTING", mobile);
            alert("ℹ️ " + regResult.message + "\nCard generated with existing data.");
        }
    } catch (error) {
        alert("Server Error.");
    }
}

function updateCardUI(name, age, gender, abha, mobile) {
    document.getElementById('cardName').innerText = name;
    document.getElementById('cardAge').innerText  = age;
    document.getElementById('cardGender').innerText = gender;
    document.getElementById('cardAbha').innerText = "ABHA: " + abha;
    
    const qrImg = document.getElementById('previewQR');
    if (qrImg && mobile) {
        qrImg.src = `https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=PulseSync-${mobile}`;
    }
}

// ─── LIVE MONITOR FUNCTIONS ───
async function loadMonitor() {
    const container = document.getElementById('monitorList');
    try {
        const response = await fetch('/api/dashboard/monitor');
        const data = await response.json();
        container.innerHTML = '';

        data.forEach(doc => {
            const statusColor = doc.doctorStatus === 'AVAILABLE' ? '#28a745' : doc.doctorStatus === 'BREAK' ? '#ffc107' : '#dc3545';
            const statusLabel = doc.doctorStatus === 'AVAILABLE' ? 'Active Now' : doc.doctorStatus === 'BREAK' ? 'On Break' : 'Offline';
            
            container.innerHTML += `
                <div class="doc-card" style="border-top-color: ${statusColor}">
                    <h3>${doc.doctorName}</h3>
                    <p class="u-text-grey">${doc.specialization || 'Specialist'}</p>
                    <div style="margin: 10px 0;">
                        <span class="status-dot" style="background:${statusColor}"></span>
                        <small>${statusLabel}</small>
                    </div>
                    <div class="stat-row">
                        <div style="text-align:center;">
                            <span class="big-num">#${doc.runningToken || '--'}</span>
                            <span class="label">Now Serving</span>
                        </div>
                        <div style="text-align:center;">
                            <span class="big-num">${doc.waitingCount}</span>
                            <span class="label">Waiting</span>
                        </div>
                        <div style="text-align:center;">
                            <span class="big-num">${doc.completedCount}</span>
                            <span class="label">Done</span>
                        </div>
                    </div>
                </div>`;
        });
    } catch(e) {
        container.innerHTML = '<p class="u-text-muted">Error loading monitor data.</p>';
    }
}

// ─── PATIENT RECORDS FUNCTIONS ───
let allRecords = [];

async function loadRecords() {
    try {
        const response = await fetch('/api/dashboard/patients');
        allRecords = await response.json();
        renderTable(allRecords);
    } catch(e) {
        document.getElementById('recordTable').innerHTML = '<tr><td colspan="6" class="u-text-center">Failed to load records.</td></tr>';
    }
}

function applyFilters() {
    const q      = document.getElementById('searchInput').value.toLowerCase();
    const status = document.getElementById('statusFilter').value;
    const filtered = allRecords.filter(a => {
        const matchSearch = !q ||
            (a.patientName   || '').toLowerCase().includes(q) ||
            (a.patientMobile || '').toLowerCase().includes(q) ||
            (a.doctorName    || '').toLowerCase().includes(q);
        const matchStatus = !status || a.status === status;
        return matchSearch && matchStatus;
    });
    renderTable(filtered);
}

function renderTable(data) {
    const table = document.getElementById('recordTable');
    table.innerHTML = '';
    document.getElementById('recordCount').innerText = `Showing ${data.length} record(s)`;
    
    if (data.length === 0) {
        table.innerHTML = '<tr><td colspan="7" style="text-align:center; padding: 30px; color: #888;">No matching records found.</td></tr>';
        return;
    }

    data.forEach(appt => {
        const isCompleted = appt.status === 'COMPLETED';
        const statusBadge = `
            <span style="background:${isCompleted ? '#d4edda' : '#fff3cd'}; color:${isCompleted ? '#155724' : '#856404'}; padding:5px 12px; border-radius:20px; font-size:0.85rem; font-weight:600;">
                ${isCompleted ? '✅ Completed' : '⏳ Waiting'}
            </span>`;

        // 🚨 NEW: Create the View Rx Button
        let actionBtn = '--';
        if (isCompleted) {
            // Encode the prescription safely to avoid quotes breaking the HTML
            const safeRx = encodeURIComponent(appt.prescription || 'No medicines recorded.');
            actionBtn = `<button onclick="openRxModal('${appt.patientName}', '${appt.doctorName}', '${appt.date || 'Today'}', '${appt.patientMobile}', '${safeRx}')" style="background:#0056b3; color:white; border:none; padding:6px 12px; border-radius:5px; cursor:pointer; font-weight:bold; font-size:0.85rem;">📄 View Rx</button>`;
        }

        table.innerHTML += `
            <tr>
                <td>${formatDateGlobal ? formatDateGlobal(appt.date) : appt.date || '--'}</td>
                <td>${appt.patientName}</td>
                <td>${appt.doctorName || 'General'}</td>
                <td>#${appt.tokenNumber}</td>
                <td>${appt.patientMobile}</td>
                <td>${statusBadge}</td>
                <td>${actionBtn}</td> </tr>`;
    });
}
function openRxModal(pName, dName, date, mobile, encodedRx) {
    document.getElementById('rxPatientName').innerText = pName;
    document.getElementById('rxDoctorName').innerText = dName;
    document.getElementById('rxDate').innerText = date;
    document.getElementById('rxMobile').innerText = mobile;
    document.getElementById('rxNotes').innerText = decodeURIComponent(encodedRx);
    
    document.getElementById('rxModal').style.display = 'flex';
}

function closeRxModal() {
    document.getElementById('rxModal').style.display = 'none';
}

// Close modal if clicking outside of it
window.onclick = function(event) {
    const modal = document.getElementById('rxModal');
    if (event.target === modal) {
        closeRxModal();
    }
}

// ─── TAB SWITCHING LOGIC ───
function switchRegTab(tabName) {
    const isExisting = tabName === 'existing';
    
    // Toggle UI visibility
    document.getElementById('formExisting').classList.toggle('u-hidden', !isExisting);
    document.getElementById('formNew').classList.toggle('u-hidden', isExisting);
    
    // Toggle active tab styling
    const tabExt = document.getElementById('tabExisting');
    const tabNew = document.getElementById('tabNew');
    
    if (isExisting) {
        tabExt.style.color = '#0056b3'; tabExt.style.borderBottom = '3px solid #0056b3';
        tabNew.style.color = '#888'; tabNew.style.borderBottom = 'none';
    } else {
        tabNew.style.color = '#0056b3'; tabNew.style.borderBottom = '3px solid #0056b3';
        tabExt.style.color = '#888'; tabExt.style.borderBottom = 'none';
    }
}

// ─── EXISTING PATIENT LOGIC ───
let foundPatientName = null;

async function searchPatient() {
    const mobile = document.getElementById('exMobile').value.trim();
    if (!mobile || mobile.length < 10) return alert("Please enter a valid mobile number.");

    try {
        const response = await fetch(`/api/patients?mobile=${encodeURIComponent(mobile)}`);
        const data = await response.json();

        if (data.status === 'success' && data.name) {
            foundPatientName = data.name;
            document.getElementById('exPatientDetails').classList.remove('u-hidden');
            document.getElementById('exDisplayInfo').innerText = `${data.name} (ABHA: ${data.abhaId || 'N/A'})`;
            
            // Update the ID card preview on the right
            updateCardUI(data.name, data.age || '--', data.gender || '--', data.abhaId || '--', mobile);
        } else {
            alert("❌ Patient not found. Please register them as a New Patient.");
            document.getElementById('exPatientDetails').classList.add('u-hidden');
            foundPatientName = null;
        }
    } catch (e) {
        alert("Error searching database.");
    }
}

async function bookExistingPatient() {
    const mobile = document.getElementById('exMobile').value.trim();
    const doctor = document.getElementById('exDoctorSelect').value;
    const symptoms = document.getElementById('exSymptoms').value.trim();

    if (!foundPatientName) return alert("Please search and verify the patient first!");
    if (!doctor) return alert("Please select a doctor.");

    const selectedOption = document.getElementById('exDoctorSelect').selectedOptions[0];
    const doctorSpecialization = selectedOption ? selectedOption.dataset.spec || '' : '';

    try {
        const bookResponse = await fetch('/api/appointments/book', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: foundPatientName, mobile, doctor, symptoms, doctorSpecialization })
        });
        const bookResult = await bookResponse.json();

        if (bookResult.status === 'success') {
            document.getElementById('tokenDisplay').classList.remove('u-hidden');
            document.getElementById('bigTokenNumber').innerText = "#" + bookResult.token;
            alert(`🎉 Success!\nToken #${bookResult.token} assigned for ${doctor}.`);
            
            // Clear inputs
            document.getElementById('exSymptoms').value = '';
            document.getElementById('exPatientDetails').classList.add('u-hidden');
            foundPatientName = null;
        } else {
            alert("❌ Booking Failed: " + bookResult.message);
        }
    } catch (error) {
        alert("Server Error.");
    }
}
// ─── ADD DOCTOR LOGIC ───
async function addNewDoctor() {
    const name = document.getElementById('newDocName').value.trim();
    const spec = document.getElementById('newDocSpec').value.trim();
    const email = document.getElementById('newDocEmail').value.trim();
    const password = document.getElementById('newDocPass').value.trim();

    if (!name || !spec || !email || !password) {
        return alert("Please fill in all details for the new doctor.");
    }

    try {
        const response = await fetch('/api/doctors/add', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: name, specialization: spec, email: email, password: password })
        });
        
        const result = await response.json();

        if (result.status === 'success') {
            alert("✅ " + result.message);
            // Clear inputs
            document.getElementById('newDocName').value = '';
            document.getElementById('newDocSpec').value = '';
            document.getElementById('newDocEmail').value = '';
            document.getElementById('newDocPass').value = '';
            
            // Reload the doctor dropdowns so the new doctor appears instantly!
            if (typeof loadDoctorsForRegistration === "function") {
                loadDoctorsForRegistration();
            }
        } else {
            alert("❌ Failed: " + result.message);
        }
    } catch (e) {
        alert("Server error while adding doctor.");
    }
}

// ─── EMERGENCY ER ADMIT LOGIC ───
async function admitEmergency() {
    const desc = document.getElementById('erPatientDesc').value.trim() || "UNKNOWN TRAUMA PATIENT";
    const condition = document.getElementById('erCondition').value.trim() || "CRITICAL EMERGENCY";
    const doctor = document.getElementById('erDoctorSelect').value;

    if (!doctor) return alert("Please select an ER Duty Doctor immediately.");

    const selectedOption = document.getElementById('erDoctorSelect').selectedOptions[0];
    const doctorSpecialization = selectedOption ? selectedOption.dataset.spec || '' : '';

    try {
        // We use a dummy mobile number for unidentified emergency patients
        const emergencyMobile = "EMG-" + Math.floor(Math.random() * 100000); 

        const bookResponse = await fetch('/api/appointments/book', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                name: "🚨 " + desc, 
                mobile: emergencyMobile, 
                doctor: doctor, 
                symptoms: "CRITICAL: " + condition, 
                doctorSpecialization: doctorSpecialization 
            })
        });
        
        const bookResult = await bookResponse.json();

        if (bookResult.status === 'success') {
            document.getElementById('erModal').style.display = 'none';
            alert(`🚨 CODE RED INITIATED!\n\nPatient routed to ${doctor}.\nEmergency Override Token Assigned.`);
            
            // Clear inputs
            document.getElementById('erPatientDesc').value = '';
            document.getElementById('erCondition').value = '';
            
            // Refresh monitor to show the ER patient
            if (typeof loadMonitor === "function") loadMonitor();
        } else {
            alert("❌ ER Booking Failed: " + bookResult.message);
        }
    } catch (error) {
        alert("Server Error during ER Admit.");
    }
}