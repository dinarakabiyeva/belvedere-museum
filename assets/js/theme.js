// Load saved theme or default to classic
let currentTheme = localStorage.getItem("theme") || "classic";
setTheme(currentTheme);

document.getElementById("theme-toggle").addEventListener("click", () => {
  currentTheme = currentTheme === "classic" ? "modern" : "classic";
  setTheme(currentTheme);
  localStorage.setItem("theme", currentTheme);
});

function setTheme(name) {
  // remove any existing theme stylesheet
  const old = document.getElementById("theme-style");
  if (old) old.remove();

  // add new theme stylesheet
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.id = "theme-style";

  if (name === "classic") {
    link.href = "assets/css/theme-classic.css";
  } else {
    link.href = "assets/css/theme-modern.css";
  }

  document.head.appendChild(link);
}

// keep a body class for components that rely on light/dark CSS variables
function applyBodyTheme(name) {
  if (name === 'classic' || name === 'light') {
    document.body.classList.remove('dark');
    document.body.classList.add('light');
  } else {
    document.body.classList.remove('light');
    document.body.classList.add('dark');
  }
}

// apply on load
applyBodyTheme(currentTheme);

// ensure setTheme updates body classes too
const originalSetTheme = setTheme;
setTheme = function(name) {
  originalSetTheme(name);
  applyBodyTheme(name);
};

// ===== Mobile navigation toggle =====
const navToggle = document.getElementById("nav-toggle");
const nav = document.getElementById("main-nav");
if (navToggle && nav) {
  navToggle.addEventListener("click", () => {
    const expanded = navToggle.getAttribute("aria-expanded") === "true";
    document.body.classList.toggle("nav-open", !expanded);
    navToggle.setAttribute("aria-expanded", String(!expanded));
  });

  // Close nav when a link is clicked (mobile)
  nav.querySelectorAll("a").forEach(a => a.addEventListener("click", () => {
    document.body.classList.remove("nav-open");
    navToggle.setAttribute("aria-expanded", "false");
  }));

  // Close on ESC
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      document.body.classList.remove("nav-open");
      navToggle.setAttribute("aria-expanded", "false");
    }
  });
}

// Ensure item pages show a uniform image shape next to metadata (runs on narratives/map/item pages)
(function () {
  function applyItemLayout() {
    if (document.querySelector('.item-layout')) return; // already applied
    const container = document.querySelector('main') || document.body;
    const imgs = Array.from(container.querySelectorAll('img'));
    for (const img of imgs) {
      let next = img.nextElementSibling;
      if (!next) continue;
      const text = (next.textContent || '').trim();
      if (!/Creator:|Date:|Type:|Format:|Room:/i.test(text)) continue;

      const layout = document.createElement('div');
      layout.className = 'item-layout';

      const imgBox = document.createElement('div');
      imgBox.className = 'item-image';
      imgBox.appendChild(img.cloneNode(true));

      const metaBox = document.createElement('div');
      metaBox.className = 'item-meta';

      let node = next;
      const stopTags = ['HR', 'FOOTER', 'SECTION', 'NAV'];
      while (node && !stopTags.includes(node.tagName)) {
        metaBox.appendChild(node.cloneNode(true));
        const toRemove = node;
        node = node.nextElementSibling;
        toRemove.remove();
      }

      layout.appendChild(imgBox);
      layout.appendChild(metaBox);

      img.parentNode.insertBefore(layout, img);
      img.remove();
      break;
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', applyItemLayout);
  } else {
    applyItemLayout();
  }
})();

// Transform item listings into beautiful painting cards (for narratives & map pages)
(function() {
  function initPaintingCards() {
    // Look for item containers (common patterns on narratives/map)
    const items = document.querySelectorAll('[data-item-id], .item-entry, article[id]');
    
    items.forEach(item => {
      if (item.classList.contains('painting-card')) return; // already transformed
      
      const img = item.querySelector('img');
      const titleEl = item.querySelector('h2, h3, .title');
      const creatorEl = item.querySelector('.creator, [data-creator]');
      const dateEl = item.querySelector('.date, [data-date]');
      const typeEl = item.querySelector('.type, [data-type]');
      const descEl = item.querySelector('.description, p');
      
      if (!img || !titleEl) return; // skip if no image or title
      
      // Build card structure
      const card = document.createElement('div');
      card.className = 'painting-card';
      
      // Image section
      const imgBox = document.createElement('div');
      imgBox.className = 'card-image';
      imgBox.appendChild(img.cloneNode(true));
      
      // Content section
      const content = document.createElement('div');
      content.className = 'card-content';
      
      const title = document.createElement('h2');
      title.className = 'card-title';
      title.textContent = titleEl.textContent.trim();
      content.appendChild(title);
      
      if (creatorEl) {
        const creator = document.createElement('p');
        creator.className = 'card-creator';
        creator.textContent = creatorEl.textContent.trim();
        content.appendChild(creator);
      }
      
      // Metadata grid
      const metaBox = document.createElement('dl');
      metaBox.className = 'card-meta';
      
      if (dateEl) {
        const dt1 = document.createElement('dt');
        dt1.textContent = 'Date';
        const dd1 = document.createElement('dd');
        dd1.textContent = dateEl.textContent.trim();
        metaBox.appendChild(dt1);
        metaBox.appendChild(dd1);
      }
      
      if (typeEl) {
        const dt2 = document.createElement('dt');
        dt2.textContent = 'Type';
        const dd2 = document.createElement('dd');
        dd2.textContent = typeEl.textContent.trim();
        metaBox.appendChild(dt2);
        metaBox.appendChild(dd2);
      }
      
      content.appendChild(metaBox);
      
      if (descEl) {
        const desc = document.createElement('p');
        desc.className = 'card-description';
        desc.textContent = descEl.textContent.trim().substring(0, 150) + '...';
        content.appendChild(desc);
      }
      
      card.appendChild(imgBox);
      card.appendChild(content);
      
      item.parentNode.replaceChild(card, item);
    });
  }
  
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initPaintingCards);
  } else {
    initPaintingCards();
  }
})();
