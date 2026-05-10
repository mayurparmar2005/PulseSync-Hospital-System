// js/laboratory.js

function fetchMyReports() {
    const mobileNumber = document.getElementById('reportMobile').value.trim();

    if (!mobileNumber || mobileNumber.length !== 10) {
        alert("Please enter a valid 10-digit mobile number to access your reports.");
        return;
    }

    // In a real flow, we pass this number to the login page so the user
    // doesn't have to type it twice, and they are prompted for their OTP.
    sessionStorage.setItem('pendingReportMobile', mobileNumber);
    
    // Redirect to the secure patient portal
    window.location.href = 'login.html';
}