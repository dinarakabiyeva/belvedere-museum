/* ============================================================
   item.js - Artwork Viewer
   Handles: JSON loading, artwork display, description mode 
   switching, narrative navigation, progress indicator, 
   and keyboard navigation.
   ============================================================ */

let itemsData = {};
let currentId = null;
let narrativeMode = null;
let narrativeList = [];
let currentIndex = 0;

// ---- narrative chapter intro texts ----
// These brief transition texts appear at the start of each narrative,
// grounding the visitor in the story they are about to follow.
const NARRATIVE_INTROS = {
  timeline: {
    title: "Timeline Narrative",
    intro: "You are following the chronological story of Austrian art, from the Enlightenment through to early Modernism. Use Next and Previous to move through the sequence."
  },
  emotion_expression: {
    title: "Emotion & Expression",
    intro: "This narrative traces how Austrian artists made inner states visible - through distorted faces, trembling brushstrokes, and charged bodies. 9 works await you."
  }
};

// ---- Load JSON ----
fetch("data/items-bilingual.json", { cache: "no-store" })
  .then(res => res.json())
  .then(data => {
    itemsData = (data && data.items) ? data.items : {};
    const narratives = (data && data.narratives) ? data.narratives : {};

    const params = new URLSearchParams(window.location.search);
    currentId = params.get("id");

    if (!currentId || !itemsData[currentId]) {
      const requestedNarrative = params.get("n");
      const requestedList = requestedNarrative && Array.isArray(narratives[requestedNarrative])
        ? narratives[requestedNarrative] : [];
      if (params.has("n") && requestedList.length) {
        currentId = requestedList[0];
        narrativeMode = requestedNarrative;
        narrativeList = requestedList;
        currentIndex = narrativeList.indexOf(currentId);
        if (currentIndex < 0) currentIndex = 0;
      } else {
        console.error("Invalid or missing ID in URL:", currentId);
        document.getElementById('descriptionBox').innerText = 'Artwork not found.';
        return;
      }
    }

    // Narrative mode
    if (params.has("n")) {
      const requestedNarrative = params.get("n");
      const requestedList = requestedNarrative && Array.isArray(narratives[requestedNarrative])
        ? narratives[requestedNarrative] : [];
      if (requestedList.length) {
        narrativeMode = requestedNarrative;
        narrativeList = requestedList;
        currentIndex = narrativeList.indexOf(currentId);
        if (currentIndex < 0) currentIndex = 0;
      } else {
        narrativeMode = null;
        narrativeList = [];
        currentIndex = 0;
      }
    }

    loadArtwork(currentId);
    updateNarrativeUI();
  })
  .catch(err => {
    console.error("JSON load error:", err);
    document.getElementById('descriptionBox').innerText = 'Failed to load artwork data.';
  });


// ---- Load Artwork Content ----
function loadArtwork(id) {
  const art = itemsData[id];
  if (!art) return;

  // Image
  const img = document.getElementById("artImage");
  img.src = art.image;
  img.alt = art.title || "Artwork image";

  // Title & page title
  const titleEl = document.getElementById("title");
  if (titleEl) titleEl.innerText = art.title || "";
  if (art.title) document.title = `${art.title} - Belvedere Virtual Exhibition`;

  // Metadata
  document.getElementById("creator").innerText = art.creator || "-";
  document.getElementById("date").innerText = art.date || "-";
  document.getElementById("type").innerText = art.type || "-";
  document.getElementById("format").innerText = art.format || "-";
  document.getElementById("room").innerText = art.room !== undefined ? `Room ${art.room}` : "-";

  loadDescription(id);
  updateNarrativeUI();
}


function hasOwn(obj, key) {
  return !!obj && Object.prototype.hasOwnProperty.call(obj, key);
}

function findDescriptionKey(store, candidates) {
  if (!store || typeof store !== "object" || Array.isArray(store)) return null;

  const exact = candidates.find(key => hasOwn(store, key));
  if (exact) return exact;

  // Support historical data that sometimes stores advanced texts under
  // `*_scholar` instead of the normal tone suffixes.
  const scholarCandidates = candidates
    .filter(key => key.endsWith("_adult") || key.endsWith("_young"))
    .map(key => key.replace(/_(adult|young)$/, "_scholar"));
  const scholarKey = scholarCandidates.find(key => hasOwn(store, key));
  if (scholarKey) return scholarKey;

  const allKeys = Object.keys(store);
  return allKeys[0] || null;
}

function getTextFromLanguageBucket(bucket, candidates) {
  if (!bucket || typeof bucket !== "object" || Array.isArray(bucket)) return null;

  const key = findDescriptionKey(bucket, candidates);
  if (!key) return null;

  const value = bucket[key];
  return typeof value === "string" ? value : null;
}

function getTextFromPerModeObject(descriptions, lang, candidates) {
  if (!descriptions || typeof descriptions !== "object" || Array.isArray(descriptions)) return null;

  for (const key of candidates) {
    if (!hasOwn(descriptions, key)) continue;

    const value = descriptions[key];
    if (typeof value === "string") return value;

    if (value && typeof value === "object" && !Array.isArray(value)) {
      if (typeof value[lang] === "string") return value[lang];
      if (typeof value.en === "string") return value.en;

      const nestedFallback = Object.values(value).find(entry => typeof entry === "string");
      if (nestedFallback) return nestedFallback;
    }
  }

  return null;
}

function hasLanguageContent(descriptions, lang) {
  if (!descriptions || typeof descriptions !== "object" || Array.isArray(descriptions)) return false;

  if (descriptions[lang] && typeof descriptions[lang] === "object" && !Array.isArray(descriptions[lang])) {
    return Object.values(descriptions[lang]).some(value => typeof value === "string" && value.trim());
  }

  return Object.values(descriptions).some(value =>
    value && typeof value === "object" && !Array.isArray(value) && typeof value[lang] === "string" && value[lang].trim()
  );
}

// ---- Load Description ----
function loadDescription(id) {
  const art = itemsData[id];
  if (!art) return;

  const lang = document.getElementById("languageSelect").value || "en";
  const len = document.getElementById("lengthSelect").value;
  const comp = document.getElementById("competenceSelect").value;
  const tone = document.getElementById("toneSelect").value;

  const lengthKey = len === "Short" ? "short" : len === "Medium" ? "medium" : "long";
  const compKey = comp === "Introductory" ? "intro" : comp === "Advanced" ? "adv" : "avg";
  const toneKey = tone === "Young" ? "young" : "adult";

  const candidates = [
    `${lengthKey}_${compKey}_${toneKey}`,
    `${lengthKey}_avg_${toneKey}`,
    `${lengthKey}_adv_${toneKey}`,
    `${lengthKey}_intro_${toneKey}`,
    `${lengthKey}_avg_adult`,
    `${lengthKey}_adv_adult`,
    `${lengthKey}_intro_adult`,
    `${lengthKey}`,
  ];

  const descriptions = art.descriptions || {};
  const requestedLanguageExists = hasLanguageContent(descriptions, lang);

  // 1. Language buckets:
  // descriptions: { en: {...}, it: {...} }
  const textFromLanguageBuckets =
    getTextFromLanguageBucket(descriptions[lang], candidates) ||
    getTextFromLanguageBucket(descriptions.en, candidates);

  // 2. Per-mode bilingual values:
  // descriptions: { short_intro_adult: { en: "...", it: "..." }, ... }
  const textFromPerModeObjects = getTextFromPerModeObject(descriptions, lang, candidates);

  // 3. Single-language fallback:
  // descriptions: { short_intro_adult: "...", ... }
  const singleLanguageKey = findDescriptionKey(descriptions, candidates);
  const singleLanguageText =
    singleLanguageKey && typeof descriptions[singleLanguageKey] === "string"
      ? descriptions[singleLanguageKey]
      : null;

  const text = textFromLanguageBuckets || textFromPerModeObjects || singleLanguageText;
  const fallbackNotice = lang === "it"
    ? "Italian description not available for this artwork yet."
    : "English description not available for this artwork yet.";

  document.getElementById("descriptionBox").innerText =
    (!requestedLanguageExists && lang !== "en")
      ? fallbackNotice
      : (text || "No description available for this mode.");
}


// ---- Narrative UI Updates ----
function updateNarrativeUI() {
  const prevBtn = document.getElementById("prevBtn");
  const nextBtn = document.getElementById("nextBtn");
  const narrativeBanner = document.getElementById("narrativeBanner");
  const progressEl = document.getElementById("narrativeProgress");

  if (!narrativeMode) {
    // Not in a narrative - disable nav buttons
    if (prevBtn) { prevBtn.disabled = true; prevBtn.title = "Enter a narrative to use navigation"; }
    if (nextBtn) { nextBtn.disabled = true; nextBtn.title = "Enter a narrative to use navigation"; }
    if (narrativeBanner) narrativeBanner.style.display = "none";
    return;
  }

  // Enable buttons
  if (prevBtn) { prevBtn.disabled = false; prevBtn.title = "Previous artwork in narrative"; }
  if (nextBtn) { nextBtn.disabled = false; nextBtn.title = "Next artwork in narrative"; }

  // Show narrative banner
  const info = NARRATIVE_INTROS[narrativeMode];
  if (narrativeBanner && info) {
    narrativeBanner.style.display = "block";
    const nameEl = document.getElementById("narrativeName");
    const introEl = document.getElementById("narrativeIntro");
    if (nameEl) nameEl.innerText = info.title;
    if (introEl && currentIndex === 0) {
      // Only show intro text on first item of narrative
      introEl.innerText = info.intro;
      introEl.style.display = "block";
    } else if (introEl) {
      introEl.style.display = "none";
    }
  }

  // Progress indicator
  if (progressEl) {
    progressEl.innerText = `${currentIndex + 1} / ${narrativeList.length}`;
  }
}


// ---- Narrative Navigation ----
document.getElementById("nextBtn").addEventListener("click", () => {
  if (!narrativeMode) return;
  currentIndex = (currentIndex + 1) % narrativeList.length;
  const nextId = narrativeList[currentIndex];
  window.location.href = `item.html?id=${encodeURIComponent(nextId)}&n=${encodeURIComponent(narrativeMode)}`;
});

document.getElementById("prevBtn").addEventListener("click", () => {
  if (!narrativeMode) return;
  currentIndex = (currentIndex - 1 + narrativeList.length) % narrativeList.length;
  const prevId = narrativeList[currentIndex];
  window.location.href = `item.html?id=${encodeURIComponent(prevId)}&n=${encodeURIComponent(narrativeMode)}`;
});

// ---- Keyboard Navigation ----
document.addEventListener("keydown", (e) => {
  if (!narrativeMode) return;
  if (e.key === "ArrowRight" || e.key === "ArrowDown") {
    document.getElementById("nextBtn").click();
  }
  if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
    document.getElementById("prevBtn").click();
  }
});

// ---- Description dropdowns ----
document.querySelectorAll("#languageSelect, #lengthSelect, #competenceSelect, #toneSelect")
  .forEach(select => {
    select.addEventListener("change", () => loadDescription(currentId));
  });
document.querySelectorAll(".desc-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    const axis = btn.dataset.axis;
    const value = btn.dataset.value;
    if (!axis || !value) return;

    const selectMap = {
      language: "languageSelect",
      length: "lengthSelect",
      competence: "competenceSelect",
      tone: "toneSelect"
    };

    const selectId = selectMap[axis];
    const select = document.getElementById(selectId);
    if (!select) return;

    select.value = value;

    document.querySelectorAll(`.desc-btn[data-axis="${axis}"]`).forEach(b => {
      b.classList.remove("active");
    });
    btn.classList.add("active");

    loadDescription(currentId);
  });
});
