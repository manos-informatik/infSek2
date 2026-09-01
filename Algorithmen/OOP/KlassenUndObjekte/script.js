(() => {
  "use strict";

  const STORAGE_KEY = "infsek2-oop-kreis-v1";
  const GRID_SIZE = 400;
  const CENTER = GRID_SIZE / 2;
  const DIAMETER_MIN = 20;
  const DIAMETER_MAX = 120;
  const NAME_PATTERN = /^[A-Za-zÀ-ÖØ-öø-ÿ_][A-Za-zÀ-ÖØ-öø-ÿ0-9_]*$/;
  const CARD_TRANSITION_MS = 200;

  const elements = {
    saveProgressButton: document.querySelector("#save-progress-button"),
    loadProgressButton: document.querySelector("#load-progress-button"),
    loadProgressFile: document.querySelector("#load-progress-file"),
    progressMessage: document.querySelector("#progress-message"),

    drawingCanvas: document.querySelector("#drawing-canvas"),
    gridCanvas: document.querySelector("#grid-canvas"),

    prevObjectButton: document.querySelector("#prev-object-button"),
    nextObjectButton: document.querySelector("#next-object-button"),
    objectCardWrap: document.querySelector("#object-card-wrap"),
    objectCounter: document.querySelector("#object-counter"),
    newObjectButton: document.querySelector("#new-object-button"),
    deleteAllButton: document.querySelector("#delete-all-button"),

    newObjectOverlay: document.querySelector("#new-object-overlay"),
    newObjectForm: document.querySelector("#new-object-form"),
    objectNameInput: document.querySelector("#object-name-input"),
    nameFeedback: document.querySelector("#name-feedback"),
    ctorRadios: Array.from(document.querySelectorAll('input[name="ctor"]')),
    paramFields: document.querySelector("#param-fields"),
    paramX: document.querySelector("#param-x"),
    paramY: document.querySelector("#param-y"),
    paramDurchmesser: document.querySelector("#param-durchmesser"),
    paramR: document.querySelector("#param-r"),
    paramG: document.querySelector("#param-g"),
    paramB: document.querySelector("#param-b"),
    paramColorRow: document.querySelector("#param-color-row"),
    paramColorPreview: document.querySelector("#param-color-preview"),
    paramColorText: document.querySelector("#param-color-text"),
    codePreview: document.querySelector("#code-preview"),
    cancelObjectButton: document.querySelector("#cancel-object-button"),
    confirmObjectButton: document.querySelector("#confirm-object-button"),

    deleteAllOverlay: document.querySelector("#delete-all-overlay"),
    cancelDeleteAllButton: document.querySelector("#cancel-delete-all-button"),
    confirmDeleteAllButton: document.querySelector("#confirm-delete-all-button")
  };

  const drawingContext = elements.drawingCanvas.getContext("2d");
  const gridContext = elements.gridCanvas.getContext("2d");

  const state = {
    objects: [],
    selectedIndex: -1
  };

  // ---------------------------------------------------------------------
  // Hilfsfunktionen
  // ---------------------------------------------------------------------

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  function randomInt(min, max) {
    return Math.round(min + Math.random() * (max - min));
  }

  function rgbText(rgb) {
    return `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`;
  }

  function prefersReducedMotion() {
    return window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }

  function nextDefaultName() {
    let n = 1;
    const taken = new Set(state.objects.map((obj) => obj.name.toLowerCase()));

    while (taken.has(`kreis${n}`)) {
      n += 1;
    }

    return `Kreis${n}`;
  }

  function isNameTaken(name, excludeIndex) {
    const normalized = name.trim().toLowerCase();

    return state.objects.some((obj, index) => index !== excludeIndex && obj.name.toLowerCase() === normalized);
  }

  function validateName(name, excludeIndex) {
    const trimmed = name.trim();

    if (trimmed === "" || !NAME_PATTERN.test(trimmed)) {
      return "Bitte einen gültigen Namen eingeben (Buchstaben, Zahlen, _; nicht mit einer Zahl beginnen).";
    }

    if (isNameTaken(trimmed, excludeIndex)) {
      return "Diesen Namen gibt es schon. Objekte müssen eindeutige Namen haben.";
    }

    return null;
  }

  // ---------------------------------------------------------------------
  // Objekte erzeugen
  // ---------------------------------------------------------------------

  function createStandardKreis(name) {
    return {
      name,
      ctor: "standard",
      x: CENTER,
      y: CENTER,
      durchmesser: randomInt(DIAMETER_MIN, DIAMETER_MAX),
      farbe: { r: randomInt(0, 255), g: randomInt(0, 255), b: randomInt(0, 255) }
    };
  }

  function createParameterKreis(name, x, y, durchmesser, r, g, b) {
    return {
      name,
      ctor: "parameter",
      x: clamp(x, 0, GRID_SIZE),
      y: clamp(y, 0, GRID_SIZE),
      durchmesser: clamp(durchmesser, 1, GRID_SIZE),
      farbe: { r: clamp(r, 0, 255), g: clamp(g, 0, 255), b: clamp(b, 0, 255) }
    };
  }

  // ---------------------------------------------------------------------
  // Zeichenfläche
  // ---------------------------------------------------------------------

  function drawGrid() {
    gridContext.clearRect(0, 0, GRID_SIZE, GRID_SIZE);
    gridContext.lineWidth = 1;
    gridContext.strokeStyle = "rgba(15, 23, 42, 0.16)";

    for (let x = 0; x < GRID_SIZE; x += 10) {
      gridContext.beginPath();
      gridContext.moveTo(x + 0.5, 0);
      gridContext.lineTo(x + 0.5, GRID_SIZE);
      gridContext.stroke();
    }

    for (let y = 0; y < GRID_SIZE; y += 10) {
      gridContext.beginPath();
      gridContext.moveTo(0, y + 0.5);
      gridContext.lineTo(GRID_SIZE, y + 0.5);
      gridContext.stroke();
    }

    gridContext.strokeStyle = "rgba(15, 23, 42, 0.34)";
    gridContext.beginPath();
    gridContext.moveTo(0.5, 0);
    gridContext.lineTo(0.5, GRID_SIZE);
    gridContext.moveTo(0, 0.5);
    gridContext.lineTo(GRID_SIZE, 0.5);
    gridContext.stroke();

    gridContext.font = "10px Consolas, 'Courier New', monospace";
    gridContext.fillStyle = "rgba(15, 23, 42, 0.7)";
    gridContext.fillText("(0,0)", 4, 13);

    const sizeLabel = `(${GRID_SIZE},${GRID_SIZE})`;
    const labelWidth = gridContext.measureText(sizeLabel).width;
    gridContext.fillText(sizeLabel, Math.max(4, GRID_SIZE - labelWidth - 4), GRID_SIZE - 5);
  }

  function drawKreis(obj) {
    const radius = obj.durchmesser / 2;

    drawingContext.beginPath();
    drawingContext.arc(obj.x, obj.y, radius, 0, Math.PI * 2);
    drawingContext.fillStyle = rgbText(obj.farbe);
    drawingContext.fill();
    drawingContext.lineWidth = 1;
    drawingContext.strokeStyle = "rgba(15, 23, 42, 0.35)";
    drawingContext.stroke();
  }

  function drawSelectionIndicator(obj) {
    const radius = obj.durchmesser / 2;

    drawingContext.save();
    drawingContext.strokeStyle = "rgba(34, 211, 238, 0.95)";
    drawingContext.lineWidth = 2;
    drawingContext.setLineDash([6, 4]);
    drawingContext.beginPath();
    drawingContext.arc(obj.x, obj.y, radius + 8, 0, Math.PI * 2);
    drawingContext.stroke();

    drawingContext.setLineDash([]);
    drawingContext.beginPath();
    drawingContext.moveTo(obj.x - 6, obj.y);
    drawingContext.lineTo(obj.x + 6, obj.y);
    drawingContext.moveTo(obj.x, obj.y - 6);
    drawingContext.lineTo(obj.x, obj.y + 6);
    drawingContext.stroke();
    drawingContext.restore();
  }

  function renderCanvas() {
    drawingContext.clearRect(0, 0, GRID_SIZE, GRID_SIZE);
    state.objects.forEach((obj) => drawKreis(obj));

    const selected = state.objects[state.selectedIndex];
    if (selected) {
      drawSelectionIndicator(selected);
    }
  }

  // ---------------------------------------------------------------------
  // Objektkarte
  // ---------------------------------------------------------------------

  function buildObjectCard(obj) {
    const card = document.createElement("div");
    card.className = "object-card";

    const header = document.createElement("div");
    header.className = "object-card-header";
    header.textContent = `${obj.name}: Kreis`;
    card.append(header);

    const body = document.createElement("div");
    body.className = "object-card-body";

    const rows = [
      ["x", String(obj.x)],
      ["y", String(obj.y)],
      ["durchmesser", String(obj.durchmesser)]
    ];

    rows.forEach(([key, value]) => {
      const row = document.createElement("div");
      row.className = "object-card-row";
      row.textContent = `${key} = ${value}`;
      body.append(row);
    });

    const farbeRow = document.createElement("div");
    farbeRow.className = "object-card-row";

    const swatch = document.createElement("span");
    swatch.className = "color-swatch";
    swatch.style.backgroundColor = rgbText(obj.farbe);
    swatch.setAttribute("aria-hidden", "true");

    const farbeText = document.createElement("span");
    farbeText.textContent = `farbe = color(${obj.farbe.r},${obj.farbe.g},${obj.farbe.b})`;

    farbeRow.append(swatch, farbeText);
    body.append(farbeRow);

    card.append(body);
    return card;
  }

  function renderObjectCard(direction) {
    const wrap = elements.objectCardWrap;
    const selected = state.objects[state.selectedIndex];
    const reduceMotion = prefersReducedMotion();

    const swap = () => {
      wrap.innerHTML = "";

      if (!selected) {
        const hint = document.createElement("p");
        hint.className = "empty-hint";
        hint.id = "empty-hint";
        hint.textContent = "Noch kein Objekt erstellt. Klicke auf „+ new“.";
        wrap.append(hint);
        return;
      }

      const card = buildObjectCard(selected);
      wrap.append(card);

      if (direction && !reduceMotion) {
        card.classList.add("is-transitioning", direction === "next" ? "is-from-right" : "is-from-left");
        // Reflow erzwingen, damit der Übergang tatsächlich animiert.
        void card.offsetWidth;
        card.classList.remove("is-transitioning", "is-from-right", "is-from-left");
      }
    };

    if (direction && wrap.firstElementChild && !reduceMotion) {
      const outgoing = wrap.firstElementChild;
      outgoing.classList.add("is-transitioning", direction === "next" ? "is-from-left" : "is-from-right");
      window.setTimeout(swap, CARD_TRANSITION_MS);
    } else {
      swap();
    }
  }

  function renderCounter() {
    if (state.objects.length === 0) {
      elements.objectCounter.textContent = "";
      return;
    }

    elements.objectCounter.textContent = `Objekt ${state.selectedIndex + 1} von ${state.objects.length}`;
  }

  function renderNavButtons() {
    const hasMultiple = state.objects.length > 1;
    elements.prevObjectButton.disabled = !hasMultiple;
    elements.nextObjectButton.disabled = !hasMultiple;
    elements.deleteAllButton.disabled = state.objects.length === 0;
  }

  function renderAll(direction) {
    renderCanvas();
    renderObjectCard(direction || null);
    renderCounter();
    renderNavButtons();
  }

  // ---------------------------------------------------------------------
  // Navigation
  // ---------------------------------------------------------------------

  function selectPrevious() {
    if (state.objects.length < 2) {
      return;
    }

    state.selectedIndex = (state.selectedIndex - 1 + state.objects.length) % state.objects.length;
    renderAll("prev");
    persistProgress();
  }

  function selectNext() {
    if (state.objects.length < 2) {
      return;
    }

    state.selectedIndex = (state.selectedIndex + 1) % state.objects.length;
    renderAll("next");
    persistProgress();
  }

  function handleGlobalKeydown(event) {
    if (elements.newObjectOverlay.classList.contains("is-visible") || elements.deleteAllOverlay.classList.contains("is-visible")) {
      return;
    }

    const activeTag = document.activeElement ? document.activeElement.tagName : "";
    if (activeTag === "INPUT" || activeTag === "TEXTAREA" || activeTag === "SELECT") {
      return;
    }

    if (event.key === "ArrowLeft") {
      event.preventDefault();
      selectPrevious();
    } else if (event.key === "ArrowRight") {
      event.preventDefault();
      selectNext();
    }
  }

  // ---------------------------------------------------------------------
  // Dialog: neues Objekt
  // ---------------------------------------------------------------------

  function getSelectedCtor() {
    const checked = elements.ctorRadios.find((radio) => radio.checked);
    return checked ? checked.value : "standard";
  }

  function readParamValue(input) {
    const value = Number(input.value);
    return Number.isFinite(value) ? value : 0;
  }

  function updateParamColorPreview() {
    const r = clamp(readParamValue(elements.paramR), 0, 255);
    const g = clamp(readParamValue(elements.paramG), 0, 255);
    const b = clamp(readParamValue(elements.paramB), 0, 255);

    elements.paramColorPreview.style.backgroundColor = `rgb(${r}, ${g}, ${b})`;
    elements.paramColorText.textContent = `color(${r}, ${g}, ${b})`;
  }

  function updateCodePreview() {
    const name = elements.objectNameInput.value.trim() || nextDefaultName();
    const ctor = getSelectedCtor();

    if (ctor === "standard") {
      elements.codePreview.textContent = `Kreis ${name} = new Kreis();`;
      return;
    }

    const x = readParamValue(elements.paramX);
    const y = readParamValue(elements.paramY);
    const d = readParamValue(elements.paramDurchmesser);
    const r = clamp(readParamValue(elements.paramR), 0, 255);
    const g = clamp(readParamValue(elements.paramG), 0, 255);
    const b = clamp(readParamValue(elements.paramB), 0, 255);

    elements.codePreview.textContent = `Kreis ${name} = new Kreis(${x}, ${y}, ${d}, color(${r}, ${g}, ${b}));`;
  }

  function updateParamFieldsVisibility() {
    const isParameter = getSelectedCtor() === "parameter";
    elements.paramFields.hidden = !isParameter;
    elements.paramColorRow.hidden = !isParameter;

    if (isParameter) {
      updateParamColorPreview();
    }

    updateCodePreview();
  }

  function showNameFeedback(message) {
    if (!message) {
      elements.nameFeedback.hidden = true;
      elements.nameFeedback.textContent = "";
      return;
    }

    elements.nameFeedback.hidden = false;
    elements.nameFeedback.textContent = message;
  }

  function openNewObjectDialog() {
    elements.newObjectForm.reset();
    elements.objectNameInput.value = nextDefaultName();
    showNameFeedback(null);
    updateParamFieldsVisibility();

    elements.newObjectOverlay.classList.add("is-visible");
    elements.newObjectOverlay.setAttribute("aria-hidden", "false");
    window.setTimeout(() => elements.objectNameInput.focus(), 0);
  }

  function closeNewObjectDialog() {
    elements.newObjectOverlay.classList.remove("is-visible");
    elements.newObjectOverlay.setAttribute("aria-hidden", "true");
    elements.newObjectButton.focus();
  }

  function handleNewObjectSubmit(event) {
    event.preventDefault();

    const name = elements.objectNameInput.value.trim();
    const nameError = validateName(name, -1);

    if (nameError) {
      showNameFeedback(nameError);
      elements.objectNameInput.focus();
      return;
    }

    showNameFeedback(null);
    const ctor = getSelectedCtor();

    const newObject = ctor === "standard"
      ? createStandardKreis(name)
      : createParameterKreis(
        name,
        readParamValue(elements.paramX),
        readParamValue(elements.paramY),
        readParamValue(elements.paramDurchmesser),
        readParamValue(elements.paramR),
        readParamValue(elements.paramG),
        readParamValue(elements.paramB)
      );

    state.objects.push(newObject);
    state.selectedIndex = state.objects.length - 1;

    closeNewObjectDialog();
    renderAll(null);
    persistProgress();
  }

  // ---------------------------------------------------------------------
  // Dialog: alle löschen
  // ---------------------------------------------------------------------

  function openDeleteAllDialog() {
    elements.deleteAllOverlay.classList.add("is-visible");
    elements.deleteAllOverlay.setAttribute("aria-hidden", "false");
  }

  function closeDeleteAllDialog() {
    elements.deleteAllOverlay.classList.remove("is-visible");
    elements.deleteAllOverlay.setAttribute("aria-hidden", "true");

    if (elements.deleteAllButton.disabled) {
      elements.newObjectButton.focus();
    } else {
      elements.deleteAllButton.focus();
    }
  }

  function confirmDeleteAll() {
    state.objects = [];
    state.selectedIndex = -1;
    renderAll(null);
    persistProgress();
    closeDeleteAllDialog();
  }

  // ---------------------------------------------------------------------
  // Fortschritt (localStorage + JSON-Export/Import)
  // ---------------------------------------------------------------------

  function buildProgressPayload() {
    return {
      version: 1,
      app: "infsek2-oop-kreis",
      savedAt: new Date().toISOString(),
      objects: state.objects,
      selectedIndex: state.selectedIndex
    };
  }

  function applyProgressPayload(payload) {
    if (!payload || !Array.isArray(payload.objects)) {
      return;
    }

    state.objects = payload.objects;
    state.selectedIndex = state.objects.length > 0
      ? clamp(Number(payload.selectedIndex) || 0, 0, state.objects.length - 1)
      : -1;
  }

  function persistProgress() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(buildProgressPayload()));
    } catch {
      // Speichern ist optional; ohne localStorage geht nur der Fortschritt zwischen Reloads verloren.
    }
  }

  function loadPersistedProgress() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        applyProgressPayload(JSON.parse(raw));
      }
    } catch {
      // ungültige Daten ignorieren, Seite startet leer
    }
  }

  function setProgressMessage(text, isError) {
    elements.progressMessage.textContent = text;
    elements.progressMessage.classList.toggle("is-error", Boolean(isError));
  }

  function exportProgressJson() {
    const payload = buildProgressPayload();
    const formatted = `${JSON.stringify(payload, null, 2)}\n`;
    const blob = new Blob([formatted], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const dateStamp = new Date().toISOString().slice(0, 10);
    const link = document.createElement("a");

    link.href = url;
    link.download = `oop-kreis-fortschritt-${dateStamp}.json`;
    document.body.append(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);

    setProgressMessage("Fortschritt wurde als JSON gespeichert.");
  }

  async function importProgressJson(event) {
    const file = event.target.files && event.target.files[0];
    if (!file) {
      return;
    }

    try {
      const content = await file.text();
      const data = JSON.parse(content);
      applyProgressPayload(data);
      renderAll(null);
      persistProgress();
      setProgressMessage("Fortschritt aus JSON geladen.");
    } catch {
      setProgressMessage("Datei konnte nicht geladen werden. Bitte gültige JSON-Datei wählen.", true);
    } finally {
      elements.loadProgressFile.value = "";
    }
  }

  // ---------------------------------------------------------------------
  // Ereignisse
  // ---------------------------------------------------------------------

  elements.newObjectButton.addEventListener("click", openNewObjectDialog);
  elements.cancelObjectButton.addEventListener("click", closeNewObjectDialog);
  elements.newObjectForm.addEventListener("submit", handleNewObjectSubmit);
  elements.newObjectOverlay.addEventListener("click", (event) => {
    if (event.target === elements.newObjectOverlay) {
      closeNewObjectDialog();
    }
  });

  elements.ctorRadios.forEach((radio) => radio.addEventListener("change", updateParamFieldsVisibility));
  elements.objectNameInput.addEventListener("input", updateCodePreview);
  [elements.paramX, elements.paramY, elements.paramDurchmesser].forEach((input) => {
    input.addEventListener("input", updateCodePreview);
  });
  [elements.paramR, elements.paramG, elements.paramB].forEach((input) => {
    input.addEventListener("input", () => {
      updateParamColorPreview();
      updateCodePreview();
    });
  });

  elements.deleteAllButton.addEventListener("click", openDeleteAllDialog);
  elements.cancelDeleteAllButton.addEventListener("click", closeDeleteAllDialog);
  elements.confirmDeleteAllButton.addEventListener("click", confirmDeleteAll);
  elements.deleteAllOverlay.addEventListener("click", (event) => {
    if (event.target === elements.deleteAllOverlay) {
      closeDeleteAllDialog();
    }
  });

  window.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") {
      return;
    }

    if (elements.newObjectOverlay.classList.contains("is-visible")) {
      closeNewObjectDialog();
    } else if (elements.deleteAllOverlay.classList.contains("is-visible")) {
      closeDeleteAllDialog();
    }
  });

  elements.prevObjectButton.addEventListener("click", selectPrevious);
  elements.nextObjectButton.addEventListener("click", selectNext);
  window.addEventListener("keydown", handleGlobalKeydown);

  elements.saveProgressButton.addEventListener("click", exportProgressJson);
  elements.loadProgressButton.addEventListener("click", () => elements.loadProgressFile.click());
  elements.loadProgressFile.addEventListener("change", importProgressJson);

  // ---------------------------------------------------------------------
  // Start
  // ---------------------------------------------------------------------

  drawGrid();
  loadPersistedProgress();
  renderAll(null);
})();
