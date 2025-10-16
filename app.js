const stateOptions = [
  ["AL", "Alabama"],
  ["AK", "Alaska"],
  ["AZ", "Arizona"],
  ["AR", "Arkansas"],
  ["CA", "California"],
  ["CO", "Colorado"],
  ["CT", "Connecticut"],
  ["DE", "Delaware"],
  ["FL", "Florida"],
  ["GA", "Georgia"],
  ["HI", "Hawaii"],
  ["ID", "Idaho"],
  ["IL", "Illinois"],
  ["IN", "Indiana"],
  ["IA", "Iowa"],
  ["KS", "Kansas"],
  ["KY", "Kentucky"],
  ["LA", "Louisiana"],
  ["ME", "Maine"],
  ["MD", "Maryland"],
  ["MA", "Massachusetts"],
  ["MI", "Michigan"],
  ["MN", "Minnesota"],
  ["MS", "Mississippi"],
  ["MO", "Missouri"],
  ["MT", "Montana"],
  ["NE", "Nebraska"],
  ["NV", "Nevada"],
  ["NH", "New Hampshire"],
  ["NJ", "New Jersey"],
  ["NM", "New Mexico"],
  ["NY", "New York"],
  ["NC", "North Carolina"],
  ["ND", "North Dakota"],
  ["OH", "Ohio"],
  ["OK", "Oklahoma"],
  ["OR", "Oregon"],
  ["PA", "Pennsylvania"],
  ["RI", "Rhode Island"],
  ["SC", "South Carolina"],
  ["SD", "South Dakota"],
  ["TN", "Tennessee"],
  ["TX", "Texas"],
  ["UT", "Utah"],
  ["VT", "Vermont"],
  ["VA", "Virginia"],
  ["WA", "Washington"],
  ["WV", "West Virginia"],
  ["WI", "Wisconsin"],
  ["WY", "Wyoming"],
];

const defaultAdvisories = {
  Low: "Normal conditions. Know your route; buddy up.",
  Elevated: "Share legal hotline; avoid chokepoints; med kit.",
  High: "Trained marshals; exit lanes; de-escalation scripts.",
  Critical: "Tight comms; buffers; livestream updates; legal observers visible.",
};

const diagnosticsState = {
  enabled: new URLSearchParams(window.location.search).get("debug") === "1",
  lastQuery: null,
  lastFetchStatus: null,
  lastError: null,
  lastResponse: null,
};

const elements = {};
let gaugeTimeouts = [];

document.addEventListener("DOMContentLoaded", () => {
  cacheElements();
  populateStates();
  setDefaultDate();
  hydrateGauge();
  registerEvents();
  applyDiagnosticsVisibility();
  render(0, defaultAdvisories.Low);
});

function cacheElements() {
  elements.date = document.getElementById("date");
  elements.state = document.getElementById("state");
  elements.city = document.getElementById("city");
  elements.check = document.getElementById("check");
  elements.band = document.getElementById("band");
  elements.bigscore = document.getElementById("bigscore");
  elements.barfill = document.getElementById("barfill");
  elements.advisory = document.getElementById("advisory");
  elements.form = document.getElementById("lookupForm");
  elements.alert = document.getElementById("alert");
  elements.alertDismiss = elements.alert.querySelector(".alert-dismiss");
  elements.diagnostics = document.getElementById("diagnostics");
  elements.diagnosticsContent = document.getElementById("diagnosticsContent");
  elements.copyDebug = document.getElementById("copyDebug");
  elements.helpButton = document.getElementById("helpButton");
  elements.helpModal = document.getElementById("helpModal");
  elements.helpClose = document.getElementById("helpClose");
}

function populateStates() {
  const fragment = document.createDocumentFragment();
  const placeholder = document.createElement("option");
  placeholder.value = "";
  placeholder.textContent = "Select state";
  placeholder.disabled = true;
  placeholder.selected = true;
  fragment.appendChild(placeholder);

  stateOptions.forEach(([value, label]) => {
    const option = document.createElement("option");
    option.value = value;
    option.textContent = `${label} (${value})`;
    fragment.appendChild(option);
  });

  elements.state.appendChild(fragment);
}

function setDefaultDate() {
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, "0");
  const dd = String(today.getDate()).padStart(2, "0");
  elements.date.value = `${yyyy}-${mm}-${dd}`;
}

function hydrateGauge() {
  elements.barfill.innerHTML = "";
  for (let i = 0; i < 10; i += 1) {
    const segment = document.createElement("div");
    segment.className = "segment";
    segment.dataset.index = String(i);
    elements.barfill.appendChild(segment);
  }
}

function registerEvents() {
  elements.form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const date = elements.date.value;
    const state = elements.state.value;
    if (!date || !state) {
      return;
    }
    const city = elements.city.value;

    setLoading(true);

    const result = await fetchRisk(date, state, city);
    handleFetchResult(result);

    setLoading(false);
  });

  elements.alertDismiss.addEventListener("click", () => {
    elements.alert.hidden = true;
    elements.alert.setAttribute("aria-hidden", "true");
  });

  elements.copyDebug.addEventListener("click", () => {
    if (!diagnosticsState.enabled) return;
    const payload = JSON.stringify(
      {
        projectOrigin: window.location.origin,
        lastQuery: diagnosticsState.lastQuery,
        lastFetchStatus: diagnosticsState.lastFetchStatus,
        lastError: diagnosticsState.lastError ? diagnosticsState.lastError.message || String(diagnosticsState.lastError) : null,
        lastResponse: diagnosticsState.lastResponse,
      },
      null,
      2
    );

    navigator.clipboard.writeText(payload).catch(() => {
      window.prompt("Copy diagnostics", payload);
    });
  });

  elements.helpButton.addEventListener("click", () => toggleHelpModal(true));
  elements.helpClose.addEventListener("click", () => toggleHelpModal(false));
  elements.helpModal.addEventListener("click", (event) => {
    if (event.target === elements.helpModal) {
      toggleHelpModal(false);
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && elements.helpModal.getAttribute("aria-hidden") === "false") {
      toggleHelpModal(false);
    }
  });
}

function toggleHelpModal(open) {
  const expanded = open ? "true" : "false";
  elements.helpButton.setAttribute("aria-expanded", expanded);
  elements.helpModal.setAttribute("aria-hidden", open ? "false" : "true");
  if (open) {
    const modalContent = elements.helpModal.querySelector(".help-modal-content");
    modalContent?.focus();
    elements.helpClose.focus();
  } else {
    elements.helpButton.focus();
  }
}

function applyDiagnosticsVisibility() {
  if (!diagnosticsState.enabled) {
    elements.diagnostics.style.display = "none";
  } else {
    elements.diagnostics.style.display = "flex";
    elements.diagnostics.style.flexDirection = "column";
    updateDiagnosticsPanel();
  }
}

function setLoading(isLoading) {
  elements.check.disabled = isLoading;
  elements.check.textContent = isLoading ? "Checking…" : "Check Risk";
}

function handleFetchResult(result) {
  const { found, data, error } = result;

  diagnosticsState.lastFetchStatus = found ? "found" : error ? "error" : "not_found";
  diagnosticsState.lastError = error || null;
  diagnosticsState.lastResponse = data || null;
  updateDiagnosticsPanel();

  if (found && data) {
    elements.alert.hidden = true;
    elements.alert.setAttribute("aria-hidden", "true");
    render(data.risk_score, data.advisory || defaultAdvisories[data.risk_band] || defaultAdvisories[getBand(data.risk_score)]);
  } else {
    elements.alert.hidden = false;
    elements.alert.setAttribute("aria-hidden", "false");
  }
}

function render(score, advisoryText) {
  const numericScore = Number(score) || 0;
  const safeScore = Math.max(0, Math.min(10, Math.round(numericScore)));
  const band = getBand(safeScore);

  document.body.classList.remove("low", "elevated", "high", "critical");
  document.body.classList.add(band.toLowerCase());

  elements.bigscore.textContent = `${safeScore}`;
  elements.band.textContent = band;
  elements.advisory.textContent = advisoryText || defaultAdvisories[band];

  fillGauge(safeScore);
}

function fillGauge(score) {
  gaugeTimeouts.forEach((timeoutId) => clearTimeout(timeoutId));
  gaugeTimeouts = [];
  const segments = elements.barfill.querySelectorAll(".segment");
  segments.forEach((segment) => {
    segment.classList.remove("filled");
  });

  for (let i = 0; i < score; i += 1) {
    const segment = segments[i];
    if (!segment) break;
    const delay = i * 60;
    const timeoutId = setTimeout(() => {
      segment.classList.add("filled");
    }, delay);
    gaugeTimeouts.push(timeoutId);
  }
}

function getBand(score) {
  if (score >= 9) return "Critical";
  if (score >= 6) return "High";
  if (score >= 3) return "Elevated";
  return "Low";
}

async function fetchRisk(date, state, city) {
  const normalizedDate = date;
  const normalizedState = (state || "").trim().toLowerCase();
  const normalizedCity = (city || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_")
    .replace(/[^a-z0-9_]/g, "");

  const baseId = `${normalizedDate}_${normalizedState}`;
  const fullId = normalizedCity ? `${baseId}_${normalizedCity}` : baseId;

  diagnosticsState.lastQuery = {
    date: normalizedDate,
    state: normalizedState,
    city: normalizedCity || null,
    attemptIds: normalizedCity ? [fullId, baseId] : [baseId],
  };

  const primary = await requestDoc(fullId);
  if (primary.ok && primary.data) {
    return { found: true, data: primary.data };
  }

  if (primary.status === 404 && normalizedCity) {
    const fallback = await requestDoc(baseId);
    if (fallback.ok && fallback.data) {
      return { found: true, data: fallback.data };
    }
    return { found: false, error: fallback.error || null };
  }

  return { found: false, error: primary.error || null };
}

async function requestDoc(id) {
  if (!id) {
    return { ok: false, status: 400, error: new Error("Invalid document id"), data: null };
  }

  try {
    const response = await fetch(`risk/${id}.json`, { cache: "no-store" });
    if (!response.ok) {
      return { ok: false, status: response.status, error: response.status === 404 ? null : new Error(`HTTP ${response.status}`), data: null };
    }
    const data = await response.json();
    return { ok: true, status: 200, error: null, data };
  } catch (error) {
    console.error("FRI lookup fetch error", error);
    return { ok: false, status: 0, error, data: null };
  }
}

function updateDiagnosticsPanel() {
  if (!diagnosticsState.enabled) {
    return;
  }
  const snapshot = {
    projectId: diagnosticsState.lastResponse?.projectId || "(projectId not provided)",
    origin: window.location.origin,
    lastQuery: diagnosticsState.lastQuery,
    lastFetchStatus: diagnosticsState.lastFetchStatus,
    lastError: diagnosticsState.lastError ? diagnosticsState.lastError.message || String(diagnosticsState.lastError) : null,
    lastResponse: diagnosticsState.lastResponse,
  };

  elements.diagnosticsContent.textContent = JSON.stringify(snapshot, null, 2);
}

window.render = render;
window.fetchRisk = fetchRisk;
