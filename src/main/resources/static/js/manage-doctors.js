// js/manage-doctors.js

// Admin Guard
if (!localStorage.getItem('adminUser')) {
    window.location.href = 'reception-login.html';
}

function doAdminLogout() {
    localStorage.removeItem('adminUser');
    window.location.href = 'index.html';
}

document.addEventListener("DOMContentLoaded", loadAdminStaffDirectory);

async function loadAdminStaffDirectory() {
    const grid = document.getElementById('adminStaffGrid');
    try {
        const response = await fetch('/api/doctors');
        const doctors = await response.json();
        
        if (doctors.length === 0) {
            grid.innerHTML = '<p class="u-text-muted">No doctors found in the system.</p>';
            return;
        }

        grid.innerHTML = doctors.map(doc => `
            <div class="staff-card">
                <h3>${doc.fullName}</h3>
                <p><strong>🩺 Spec:</strong> ${doc.specialization || 'General'}</p>
                <p><strong>📧 Email:</strong> ${doc.email}</p>
                <div style="margin-top: 10px;">
                    <span class="rating-badge">⭐ ${doc.rating ? doc.rating.toFixed(1) : '5.0'} (${doc.reviewCount || 0} Reviews)</span>
                </div>
            </div>
        `).join('');
    } catch (e) {
        grid.innerHTML = '<p style="color:red;">Failed to load staff directory.</p>';
    }
}

async function adminAddNewDoctor() {
    const name = document.getElementById('newDocName').value.trim();
    const spec = document.getElementById('newDocSpec').value.trim();
    // We will save the private clinic detail into the specialization string for now to avoid changing the DB schema today
    const clinic = document.getElementById('newDocClinic').value.trim(); 
    const finalSpec = clinic ? `${spec} | ${clinic}` : spec;
    
    const email = document.getElementById('newDocEmail').value.trim();
    const password = document.getElementById('newDocPass').value.trim();

    if (!name || !spec || !email || !password) return alert("Please fill required details.");

    try {
        const response = await fetch('/api/doctors/add', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: name, specialization: finalSpec, email: email, password: password })
        });
        
        const result = await response.json();

        if (result.status === 'success') {
            alert("✅ " + result.message);
            document.getElementById('addDoctorModal').style.display = 'none';
            // Clear inputs
            document.querySelectorAll('#addDoctorModal input').forEach(input => input.value = '');
            // Reload the grid
            loadAdminStaffDirectory();
        } else {
            alert("❌ Failed: " + result.message);
        }
    } catch (e) {
        alert("Server error while adding doctor.");
    }
}