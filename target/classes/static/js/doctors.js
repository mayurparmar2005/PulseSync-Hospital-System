// js/doctors.js - Logic for the Find a Doctor page

let allDoctors = [];
let activeSpec = null;

async function loadDoctors() {
    const container = document.getElementById('doctorList');
    const pillsEl = document.getElementById('filterPills');

    try {
        const response = await fetch('/api/doctors');
        allDoctors = await response.json();

        // Build unique specialization pills
        const specs = [...new Set(allDoctors.map(d => d.specialization).filter(Boolean))];
        specs.forEach(spec => {
            const pill = document.createElement('span');
            pill.className = 'pill';
            pill.textContent = spec;
            pill.onclick = function () { filterBy(spec, this); };
            pillsEl.appendChild(pill);
        });

        // Check URL for pre-filled search (from index.html search box)
        const urlParams = new URLSearchParams(window.location.search);
        const q = urlParams.get('q');
        if (q) {
            document.getElementById('searchInput').value = q;
        }

        applyFilters();

    } catch (err) {
        container.innerHTML = '<p style="color:#e63946; text-align:center;">Could not load doctors. Is the server running?</p>';
    }
}

function filterBy(spec, el) {
    activeSpec = spec;
    document.querySelectorAll('.pill').forEach(p => p.classList.remove('active'));
    el.classList.add('active');
    applyFilters();
}

function applyFilters() {
    const q = document.getElementById('searchInput').value.toLowerCase().trim();
    const filtered = allDoctors.filter(d => {
        const matchSpec = !activeSpec || d.specialization === activeSpec;
        const matchSearch = !q ||
            (d.fullName || '').toLowerCase().includes(q) ||
            (d.specialization || '').toLowerCase().includes(q);
        return matchSpec && matchSearch;
    });
    renderDoctors(filtered);
}

function clearSearch() {
    document.getElementById('searchInput').value = '';
    applyFilters();
}

function renderDoctors(doctors) {
    const container = document.getElementById('doctorList');

    if (doctors.length === 0) {
        container.innerHTML = '<div class="no-results"><p style="font-size:2rem;">🔍</p><p>No doctors found. Try a different search.</p></div>';
        return;
    }

    container.innerHTML = doctors.map(doc => {
        const statusClass = doc.doctorStatus === 'AVAILABLE' ? 'status-available'
            : doc.doctorStatus === 'BREAK' ? 'status-break'
                : 'status-offline';
        const statusLabel = doc.doctorStatus === 'AVAILABLE' ? '🟢 Active'
            : doc.doctorStatus === 'BREAK' ? '☕ On Break'
                : '🔴 Offline';
        return `
            <div class="doc-card">
                <div class="doc-avatar">👨‍⚕️</div>
                <div class="doc-name">${doc.fullName}</div>
                <div class="doc-spec">${doc.specialization || 'General Doctor'}</div>

                <span class="status-badge ${statusClass}">${statusLabel}</span>

                <div class="stars-display" id="stars-${doc.id}">
                    ${[1, 2, 3, 4, 5].map(s => `
                        <span class="star ${s <= Math.round(doc.rating) ? 'filled' : ''}"
                              onclick="submitRating('${doc.id}', ${s})"
                              title="Rate ${s} star">★</span>
                    `).join('')}
                </div>
                <div class="rating-text" id="ratingText-${doc.id}">
                    ${doc.rating.toFixed(1)} / 5 &nbsp;(${doc.reviewCount} reviews)
                </div>

                <a href="login.html" class="btn-book">📅 Book Queue</a>
            </div>
        `;
    }).join('');
}

async function submitRating(doctorId, stars) {
    // Visual feedback: disable stars while submitting
    const starsEl = document.getElementById('stars-' + doctorId);
    const textEl = document.getElementById('ratingText-' + doctorId);
    starsEl.style.pointerEvents = 'none';
    textEl.innerText = 'Submitting...';

    try {
        const res = await fetch(`/api/doctors/${doctorId}/rate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ stars })
        });
        const result = await res.json();

        if (result.status === 'success') {
            // Update stars display
            const starSpans = starsEl.querySelectorAll('.star');
            starSpans.forEach((s, i) => {
                s.classList.toggle('filled', i < stars);
            });
            textEl.innerHTML = `<span class="rating-submitted">✅ Thanks! New avg: ${result.newRating}/5</span>`;
            // Update local data
            const doc = allDoctors.find(d => d.id === doctorId);
            if (doc) { doc.rating = result.newRating; doc.reviewCount = result.count; }
        } else {
            textEl.innerText = 'Error. Try again.';
        }
    } catch (e) {
        textEl.innerText = 'Server error.';
    } finally {
        setTimeout(() => { starsEl.style.pointerEvents = 'auto'; }, 2000);
    }
}

document.addEventListener("DOMContentLoaded", loadDoctors);