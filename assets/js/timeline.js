fetch("data/items.json")
    .then(res => res.json())
    .then(data => buildTimeline(data));

function buildTimeline(data) {
    const items = data.items || {};
    const order = (data.narratives && data.narratives.timeline) || Object.keys(items);

    const timeline = document.getElementById("timeline");
    timeline.innerHTML = "";

    let leftSide = true;

    order.forEach(id => {
        const art = items[id];
        if (!art) return; // skip missing

        const side = leftSide ? "left" : "right";
        leftSide = !leftSide;

        const card = document.createElement("div");
        card.className = `timeline-item ${side}`;

        card.innerHTML = `
            <img class="timeline-img" src="${art.image}" alt="${escapeHtml(art.title)}">
            <div class="timeline-card">
                <h3>${escapeHtml(art.date)}</h3>
                <strong>${escapeHtml(art.title)}</strong>
                <div class="muted">${escapeHtml(art.creator)}</div>
                <a class="btn" href="item.html?id=${encodeURIComponent(id)}">Read more</a>
            </div>
        `;

        timeline.appendChild(card);
    });

    // IntersectionObserver for reveal animations
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('in-view');
            }
        });
    }, { threshold: 0.15 });

    document.querySelectorAll('.timeline-item').forEach(el => {
        // set initial hidden state
        el.classList.add('hidden');
        observer.observe(el);
    });
}

// small helpers
function extractYear(str) {
    const match = String(str).match(/\d+/);
    return match ? parseInt(match[0]) : 99999;
}

function escapeHtml(s) {
    return String(s)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

// Extract numeric year for sorting
function extractYear(str) {
    const match = str.match(/\d+/);
    return match ? parseInt(match[0]) : 99999;
}
