/* ============================================================
   narratives.js - Narratives page
   Ensures each narrative card's Start button links to the
   correct first item of the narrative sequence from items.json.
   ============================================================ */

fetch('data/items.json')
  .then(r => r.json())
  .then(data => renderNarratives(data))
  .catch(err => console.error('Failed to load narratives data:', err));


function renderNarratives(data) {
  const narratives = data.narratives || {};

  document.querySelectorAll('.narrative-card').forEach(card => {
    const link = card.querySelector('a.narrative-btn');
    if (!link) return;

    // Determine narrative key from the ?n= param in the href
    let nkey = null;
    try {
      const url = new URL(link.href, window.location.href);
      nkey = url.searchParams.get('n');
    } catch (e) {
      return;
    }

    const list = Array.isArray(narratives[nkey]) ? narratives[nkey] : [];
    if (list.length === 0) return;

    // Always point to the first item in the narrative
    const firstId = list[0];
    link.href = `item.html?id=${encodeURIComponent(firstId)}&n=${encodeURIComponent(nkey)}`;
  });
}
