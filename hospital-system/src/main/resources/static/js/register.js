// js/register.js - Logic for Patient Self-Registration

async function handleRegister(event) {
    event.preventDefault();

    const name = document.getElementById('rName').value.trim();
    const age = document.getElementById('rAge').value;
    const gender = document.getElementById('rGender').value;
    const mobile = document.getElementById('rMobile').value.trim();
    const password = document.getElementById('rPassword').value;
    const submitBtn = document.getElementById('submitBtn');

    document.getElementById('errorMsg').style.display = 'none';
    document.getElementById('successMsg').style.display = 'none';

    submitBtn.disabled = true;
    submitBtn.innerText = 'Registering...';

    try {
        const response = await fetch('/api/patients/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, age, gender, mobile, password })
        });

        const result = await response.json();

        if (result.status === 'success') {
            document.getElementById('registerForm').reset();
            document.getElementById('successMsg').innerHTML = `✅ Registration Successful!<br>Your ABHA ID is <strong>${result.abha}</strong>. <br><br>Redirecting to login...`;
            document.getElementById('successMsg').style.display = 'block';
            
            // Automatically redirect to login page after 3 seconds
            setTimeout(() => {
                window.location.href = 'login.html';
            }, 3000);
        } else {
            document.getElementById('errorMsg').innerText = '⚠️ ' + result.message;
            document.getElementById('errorMsg').style.display = 'block';
        }
    } catch (error) {
        console.error(error);
        document.getElementById('errorMsg').innerText = '⚠️ Server connection failed.';
        document.getElementById('errorMsg').style.display = 'block';
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerText = 'Generate Health ID & Register';
    }
}