// Add/Update this in patient.js

function showSection(sectionId, clickedEl) {
    // Hide all sections
    document.querySelectorAll('.content-section').forEach(s => s.classList.add('u-hidden'));
    
    // Show target section
    const target = document.getElementById(sectionId);
    if(target) target.classList.remove('u-hidden');

    // Handle Bottom Nav active states
    document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
    
    // If clicked from bottom nav
    if (clickedEl && clickedEl.classList.contains('nav-item')) {
        clickedEl.classList.add('active');
    } else {
        // If triggered from profile avatar or other links, find the matching nav item
        const navItems = document.querySelectorAll('.nav-item');
        if (sectionId === 'home') navItems[0].classList.add('active');
        if (sectionId === 'records') navItems[1].classList.add('active');
        if (sectionId === 'settings') navItems[2].classList.add('active');
    }
}

// In loadPatientSettings(), make sure to update the header ABHA badge too
async function loadPatientSettings() {
    if (!patientMobile) return;
    try {
        const res  = await fetch(`/api/patients?mobile=${encodeURIComponent(patientMobile)}`);
        const data = await res.json();
        if (data.status === 'success') {
            document.getElementById('settingName').innerText      = data.name   || '--';
            document.getElementById('settingMobile').innerText    = data.mobile || '--';
            document.getElementById('settingAbha').innerText      = data.abhaId || 'Not Assigned';
            document.getElementById('settingAbhaHeader').innerText = data.abhaId || '----';
        }
    } catch (err) { console.error('Settings fetch error:', err); }
}
