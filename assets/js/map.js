/* ============================================================
   map.js - Exhibition Map
   Handles: room panel population, slide-in/out, keyboard close.
   Relies on items.json rooms object keyed by room number string.
   ============================================================ */

let itemsData_map = null;

fetch('data/items-bilingual.json')
  .then(r => r.json())
  .then(data => {
    itemsData_map = data;
    attachRoomHandlers();
  })
  .catch(err => console.error('Failed to load items-bilingual.json', err));


function attachRoomHandlers() {
  // Expose global for any inline onclick attributes (backwards compat)
  window.goToRoom = showRoom;

  // Attach click to every room cell and the entrance row
  document.querySelectorAll('.room-cell, .map-row.entrance').forEach(el => {
    el.style.cursor = 'pointer';
    el.addEventListener('click', () => {
      let roomNum = null;

      // Prefer data-room attribute
      if (el.dataset.room !== undefined) {
        roomNum = Number(el.dataset.room);
      } else {
        // Fallback: parse room number from .room-number text
        const rn = el.querySelector('.room-number');
        if (rn) {
          const m = rn.textContent.match(/\d+/);
          if (m) roomNum = Number(m[0]);
        } else {
          roomNum = 0; // entrance
        }
      }

      if (roomNum !== null) showRoom(roomNum);
    });
  });

  // Panel close button
  const closeBtn = document.getElementById('room-close');
  if (closeBtn) closeBtn.addEventListener('click', closeRoomPanel);

  // Keyboard close
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') closeRoomPanel();
  });
}


function showRoom(num) {
  const panel = document.getElementById('room-panel');
  const titleEl = document.getElementById('room-title');
  const listEl = document.getElementById('room-list');
  if (!itemsData_map || !panel) return;

  const roomKey = String(num);
  const ids = (itemsData_map.rooms && itemsData_map.rooms[roomKey]) || [];

  // Panel title
  titleEl.textContent = num === 0 ? 'Entrance Hall - Highlights' : `Room ${num}`;

  // Clear previous content
  listEl.innerHTML = '';

  if (ids.length === 0) {
    listEl.innerHTML = '<p class="muted">No artworks listed for this room.</p>';
  } else {
    ids.forEach(id => {
      const art = itemsData_map.items && itemsData_map.items[id];
      if (!art) return;

      // Pick best short description
      const localizedDescriptions = getDescriptionStore(art.descriptions);
      const desc = localizedDescriptions
        ? (localizedDescriptions.short_intro_adult
            || localizedDescriptions.short_intro_young
            || localizedDescriptions.medium_avg_adult
            || Object.values(localizedDescriptions).find(value => typeof value === 'string')
            || '')
        : '';
      const excerpt = desc
        ? (desc.length > 120 ? desc.slice(0, 117) + '…' : desc)
        : '';

      const item = document.createElement('article');
      item.className = 'room-item';

      item.innerHTML = `
        <a href="item.html?id=${encodeURIComponent(id)}" class="room-link">
          <img src="${escHtml(art.image)}" alt="${escHtml(art.title)}" loading="lazy">
          <div class="room-meta">
            <strong>${escHtml(art.title)}</strong>
            <div class="muted">${escHtml(art.creator)}</div>
            <div class="muted">${escHtml(art.date)}</div>
            ${excerpt ? `<p class="muted" style="margin:4px 0 0;font-size:0.82rem;line-height:1.4">${escHtml(excerpt)}</p>` : ''}
            <div style="margin-top:8px;display:flex;gap:8px;flex-wrap:wrap;">
              <a href="item.html?id=${encodeURIComponent(id)}" 
                 style="font-size:0.8rem;font-weight:600;opacity:0.7;text-decoration:none;color:inherit">
                View artwork →
              </a>
              <a href="item.html?id=${encodeURIComponent(id)}&n=timeline"
                 style="font-size:0.8rem;font-weight:600;opacity:0.7;text-decoration:none;color:inherit">
                Open in Timeline →
              </a>
            </div>
          </div>
        </a>
      `;

      listEl.appendChild(item);
    });
  }

  // Show panel
  panel.setAttribute('aria-hidden', 'false');
  panel.classList.add('show');

  // Scroll panel to top
  panel.scrollTop = 0;
}


function closeRoomPanel() {
  const panel = document.getElementById('room-panel');
  if (!panel) return;
  panel.setAttribute('aria-hidden', 'true');
  panel.classList.remove('show');
}


function escHtml(s) {
  return String(s || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function getDescriptionStore(descriptions) {
  if (!descriptions || typeof descriptions !== 'object') return null;
  if (typeof descriptions.short_intro_adult === 'string') return descriptions;

  const htmlLang = (document.documentElement.lang || '').toLowerCase();
  if (htmlLang.startsWith('it') && descriptions.it) return descriptions.it;
  return descriptions.en  || descriptions.it  || null;
}