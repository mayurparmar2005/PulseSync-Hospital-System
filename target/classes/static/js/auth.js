// js/auth.js - Logic for Login and Cryptographic OTP Verification

// ─── TAB SWITCHER ──────────────────────────────────────────
function switchTab(role) {
    const isPatient = role === 'patient';
    document.getElementById('patient-form').classList.toggle('u-hidden', !isPatient);
    document.getElementById('doctor-form').classList.toggle('u-hidden', isPatient);
    
    document.getElementById('tab-patient').classList.toggle('active', isPatient);
    document.getElementById('tab-doctor').classList.toggle('active', !isPatient);

    clearError('patientErrorStep1');
    clearError('patientErrorStep2');
    clearError('doctorError');
}

// ─── PATIENT: SECURE OTP STATE VARIABLES ───────────────────
let currentMobile = "";
let secureSignature = "";
let otpExpiryTime = 0;

// ─── PATIENT STEP 1: REQUEST OTP ───────────────────────────
async function requestOtp(event) {
    event.preventDefault();
    const mobileInput = document.getElementById('pMobile').value.trim();
    const btn = document.getElementById('btnRequestOtp');

    clearError('patientErrorStep1');
    btn.disabled = true;
    btn.innerText = 'Generating Secure Token...';

    try {
        const response = await fetch('/api/auth/request-otp', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ mobile: mobileInput })
        });
        
        const result = await response.json();

        if (result.status === 'success') {
            // Save state in memory (not localStorage, for security)
            currentMobile = mobileInput;
            secureSignature = result.signature;
            otpExpiryTime = result.expiryTime;

            // Update UI
            document.getElementById('displayMobile').innerText = "+91 " + currentMobile;
            document.getElementById('otp-request-step').classList.add('u-hidden');
            document.getElementById('otp-verify-step').classList.remove('u-hidden');
            document.getElementById('pOtp').focus();
        } else {
            showError('patientErrorStep1', result.message || 'Failed to send OTP.');
        }
    } catch (error) {
        showError('patientErrorStep1', 'Server offline. Cannot connect.');
    } finally {
        btn.disabled = false;
        btn.innerText = 'Send Secure OTP';
    }
}

// ─── PATIENT STEP 2: VERIFY OTP ────────────────────────────
async function verifyOtp(event) {
    event.preventDefault();
    const otpInput = document.getElementById('pOtp').value.trim();
    const btn = document.getElementById('btnVerifyOtp');

    clearError('patientErrorStep2');
    btn.disabled = true;
    btn.innerText = 'Verifying Signature...';

    try {
        const response = await fetch('/api/auth/verify-otp', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                mobile: currentMobile,
                otp: otpInput,
                signature: secureSignature,
                expiryTime: otpExpiryTime
            })
        });

        const result = await response.json();

        if (result.status === 'success') {
            // Success! Store user data and redirect
            localStorage.setItem('patientName', result.name);
            localStorage.setItem('patientMobile', result.mobile);
            
            if (result.isNewUser) {
                alert(`Welcome to PulseSync!\nA new ABHA Health Profile has been created for you.`);
            }
            window.location.href = 'p_dashboard.html';
        } else {
            showError('patientErrorStep2', result.message || 'Invalid OTP code.');
        }
    } catch (error) {
        showError('patientErrorStep2', 'Verification server unreachable.');
    } finally {
        btn.disabled = false;
        btn.innerText = 'Verify & Login';
    }
}

function resetToStep1() {
    document.getElementById('otp-verify-step').classList.add('u-hidden');
    document.getElementById('otp-request-step').classList.remove('u-hidden');
    document.getElementById('pOtp').value = "";
    clearError('patientErrorStep1');
    clearError('patientErrorStep2');
}

// ─── DOCTOR LOGIN (PASSWORD) ───────────────────────────────
async function handleDoctorLogin(event) {
    event.preventDefault();
    const email = document.getElementById('dEmail').value.trim();
    const password = document.getElementById('dPassword').value;
    const btn = document.getElementById('doctorSubmitBtn');

    clearError('doctorError');
    btn.disabled = true;
    btn.innerText = 'Authenticating...';

    try {
        const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ identifier: email, password: password })
        });
        const result = await response.json();

        if (result.status === 'success' && result.role === 'doctor') {
            localStorage.setItem('doctorName', result.name);
            localStorage.setItem('doctorId', result.user.id);
            localStorage.setItem('doctorStatus', result.user.doctorStatus || 'OFFLINE');
            window.location.href = 'd_dashboard.html';
        } else {
            showError('doctorError', 'Access Denied. Invalid credentials or not a doctor.');
        }
    } catch (error) {
        showError('doctorError', 'Authentication server unreachable.');
    } finally {
        btn.disabled = false;
        btn.innerText = 'Secure Login';
    }
}

// ─── UTILS ─────────────────────────────────────────────────
function showError(id, msg) {
    const el = document.getElementById(id);
    if(el) { el.innerText = '⚠️ ' + msg; el.style.display = 'block'; }
}

function clearError(id) {
    const el = document.getElementById(id);
    if(el) { el.innerText = ''; el.style.display = 'none'; }
}