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
    paramColor: document.querySelector("#param-color"),
    paramColorText: document.querySelector("#param-color-text"),
    paramFeedback: document.querySelector("#param-feedback"),
    codePreview: document.querySelector("#code-preview"),
    cancelObjectButton: document.querySelector("#cancel-object-button"),
    confirmObjectButton: document.querySelector("#confirm-object-button"),

    deleteAllOverlay: document.querySelector("#delete-all-overlay"),
    cancelDeleteAllButton: document.querySelector("#cancel-delete-all-button"),
    confirmDeleteAllButton: document.querySelector("#confirm-delete-all-button"),

    showCodeButton: document.querySelector("#show-code-button"),
    codeOverlay: document.querySelector("#code-overlay"),
    closeCodeButton: document.querySelector("#close-code-button"),
    ideTabs: Array.from(document.querySelectorAll(".ide-tab")),
    codeViewMain: document.querySelector("#code-view-main"),
    codeViewKreis: document.querySelector("#code-view-kreis")
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

  function hexToRgb(hex) {
    const normalized = (hex || "#000000").replace("#", "");
    const r = parseInt(normalized.substring(0, 2), 16);
    const g = parseInt(normalized.substring(2, 4), 16);
    const b = parseInt(normalized.substring(4, 6), 16);

    return {
      r: Number.isFinite(r) ? r : 0,
      g: Number.isFinite(g) ? g : 0,
      b: Number.isFinite(b) ? b : 0
    };
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

  function validateParams() {
    const xRaw = elements.paramX.value.trim();
    const yRaw = elements.paramY.value.trim();
    const dRaw = elements.paramDurchmesser.value.trim();

    if (xRaw === "" || yRaw === "" || dRaw === "") {
      return "Bitte x, y und durchmesser ausfüllen.";
    }

    const durchmesser = Number(dRaw);
    if (!Number.isFinite(durchmesser) || durchmesser <= 0) {
      return "durchmesser muss größer als 0 sein.";
    }

    return null;
  }

  function setFieldFeedback(el, message) {
    if (!message) {
      el.hidden = true;
      el.textContent = "";
      return;
    }

    el.hidden = false;
    el.textContent = message;
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

  function createParameterKreis(name, x, y, durchmesser, farbe) {
    return {
      name,
      ctor: "parameter",
      x: clamp(x, 0, GRID_SIZE),
      y: clamp(y, 0, GRID_SIZE),
      durchmesser: clamp(durchmesser, 1, GRID_SIZE),
      farbe: { r: clamp(farbe.r, 0, 255), g: clamp(farbe.g, 0, 255), b: clamp(farbe.b, 0, 255) }
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
        hint.textContent = "Noch kein Objekt erstellt. Klicke auf „new“.";
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

  function isOverlayOpen(overlay) {
    return overlay.classList.contains("is-visible");
  }

  function isAnyOverlayOpen() {
    return isOverlayOpen(elements.newObjectOverlay)
      || isOverlayOpen(elements.deleteAllOverlay)
      || isOverlayOpen(elements.codeOverlay);
  }

  function handleGlobalKeydown(event) {
    if (isAnyOverlayOpen()) {
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

  function updateParamColorText() {
    const { r, g, b } = hexToRgb(elements.paramColor.value);
    elements.paramColorText.textContent = `farbe = color(${r}, ${g}, ${b})`;
  }

  function updateCodePreview() {
    const name = elements.objectNameInput.value.trim() || nextDefaultName();
    const ctor = getSelectedCtor();

    if (ctor === "standard") {
      elements.codePreview.textContent = `Kreis ${name} = new Kreis();`;
      return;
    }

    const x = elements.paramX.value.trim();
    const y = elements.paramY.value.trim();
    const d = elements.paramDurchmesser.value.trim();
    const { r, g, b } = hexToRgb(elements.paramColor.value);

    elements.codePreview.textContent =
      `Kreis ${name} = new Kreis(${x || "?"}, ${y || "?"}, ${d || "?"}, color(${r}, ${g}, ${b}));`;
  }

  function updateParamFieldsVisibility() {
    const isParameter = getSelectedCtor() === "parameter";
    elements.paramFields.hidden = !isParameter;
    elements.paramColorText.hidden = !isParameter;
    setFieldFeedback(elements.paramFeedback, null);

    if (isParameter) {
      updateParamColorText();
    }

    updateCodePreview();
  }

  function openNewObjectDialog() {
    elements.newObjectForm.reset();
    elements.objectNameInput.value = nextDefaultName();
    setFieldFeedback(elements.nameFeedback, null);
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
      setFieldFeedback(elements.nameFeedback, nameError);
      elements.objectNameInput.focus();
      return;
    }

    setFieldFeedback(elements.nameFeedback, null);
    const ctor = getSelectedCtor();

    if (ctor === "parameter") {
      const paramError = validateParams();
      if (paramError) {
        setFieldFeedback(elements.paramFeedback, paramError);
        elements.paramX.focus();
        return;
      }
    }

    setFieldFeedback(elements.paramFeedback, null);

    const newObject = ctor === "standard"
      ? createStandardKreis(name)
      : createParameterKreis(
        name,
        Number(elements.paramX.value),
        Number(elements.paramY.value),
        Number(elements.paramDurchmesser.value),
        hexToRgb(elements.paramColor.value)
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
  // Dialog: Java-Code
  // ---------------------------------------------------------------------

  const KEYWORDS = new Set(["void", "class", "new", "return", "this", "if", "else", "for", "while"]);
  const TYPES = new Set(["color", "int", "float", "boolean"]);
  const BUILTINS = new Set([
    "setup", "draw", "size", "background", "fill", "circle", "random",
    "width", "height", "zeichnen"
  ]);

  function buildMainCode() {
    const lines = [];

    state.objects.forEach((obj) => lines.push(`Kreis ${obj.name};`));

    if (state.objects.length > 0) {
      lines.push("");
    }

    lines.push("void setup(){");
    lines.push(`  size(${GRID_SIZE},${GRID_SIZE});`);

    state.objects.forEach((obj) => {
      if (obj.ctor === "standard") {
        lines.push(`  ${obj.name} = new Kreis();`);
      } else {
        const { r, g, b } = obj.farbe;
        lines.push(`  ${obj.name} = new Kreis(${obj.x},${obj.y},${obj.durchmesser},color(${r},${g},${b}));`);
      }
    });

    lines.push("}");
    lines.push("");
    lines.push("void draw(){");
    lines.push("  background(255);");

    state.objects.forEach((obj) => lines.push(`  ${obj.name}.zeichnen();`));

    lines.push("}");

    return lines.join("\n");
  }

  function buildKreisCode() {
    return `class Kreis {
  int x;
  int y;
  float durchmesser;
  color farbe;

  Kreis(){
    x = width/2;
    y = height/2;
    durchmesser = random(${DIAMETER_MIN},${DIAMETER_MAX});
    farbe = color(random(255),random(255),random(255));
  }

  Kreis(int x, int y, float durchmesser, color farbe){
    this.x = x;
    this.y = y;
    this.durchmesser = durchmesser;
    this.farbe = farbe;
  }

  void zeichnen(){
    fill(farbe);
    circle(x,y,durchmesser);
  }
}`;
  }

  function highlightLine(lineText) {
    const fragment = document.createDocumentFragment();
    const pattern = /(\/\/.*$)|([A-Za-zÀ-ÖØ-öø-ÿ_][A-Za-zÀ-ÖØ-öø-ÿ0-9_]*)|(\d+(?:\.\d+)?)/g;
    let lastIndex = 0;
    let match;

    while ((match = pattern.exec(lineText)) !== null) {
      if (match.index > lastIndex) {
        fragment.append(document.createTextNode(lineText.slice(lastIndex, match.index)));
      }

      const text = match[0];
      let className = null;

      if (match[1]) {
        className = "tok-comment";
      } else if (match[2]) {
        if (KEYWORDS.has(text)) {
          className = "tok-keyword";
        } else if (TYPES.has(text)) {
          className = "tok-type";
        } else if (BUILTINS.has(text)) {
          className = "tok-function";
        }
      } else {
        className = "tok-number";
      }

      if (className) {
        const span = document.createElement("span");
        span.className = className;
        span.textContent = text;
        fragment.append(span);
      } else {
        fragment.append(document.createTextNode(text));
      }

      lastIndex = pattern.lastIndex;
    }

    if (lastIndex < lineText.length) {
      fragment.append(document.createTextNode(lineText.slice(lastIndex)));
    }

    return fragment;
  }

  function renderCodeView(container, code) {
    container.innerHTML = "";

    code.split("\n").forEach((line, index) => {
      const lineEl = document.createElement("div");
      lineEl.className = "ide-line";

      const gutter = document.createElement("span");
      gutter.className = "ide-gutter";
      gutter.textContent = String(index + 1);

      const codeEl = document.createElement("span");
      codeEl.className = "ide-code";
      codeEl.append(highlightLine(line));

      lineEl.append(gutter, codeEl);
      container.append(lineEl);
    });
  }

  function selectCodeTab(tabName) {
    elements.ideTabs.forEach((tab) => {
      const isActive = tab.dataset.tab === tabName;
      tab.classList.toggle("is-active", isActive);
      tab.setAttribute("aria-selected", isActive ? "true" : "false");
    });

    elements.codeViewMain.hidden = tabName !== "main";
    elements.codeViewKreis.hidden = tabName !== "kreis";
  }

  function openCodeDialog() {
    renderCodeView(elements.codeViewMain, buildMainCode());
    renderCodeView(elements.codeViewKreis, buildKreisCode());
    selectCodeTab("main");

    elements.codeOverlay.classList.add("is-visible");
    elements.codeOverlay.setAttribute("aria-hidden", "false");
  }

  function closeCodeDialog() {
    elements.codeOverlay.classList.remove("is-visible");
    elements.codeOverlay.setAttribute("aria-hidden", "true");
    elements.showCodeButton.focus();
  }

  // ---------------------------------------------------------------------
  // Fortschritt (automatisch im Hintergrund, ohne Bedienelemente)
  // ---------------------------------------------------------------------

  function persistProgress() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        objects: state.objects,
        selectedIndex: state.selectedIndex
      }));
    } catch {
      // Speichern ist optional; ohne localStorage geht nur der Fortschritt zwischen Besuchen verloren.
    }
  }

  function loadPersistedProgress() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        return;
      }

      const data = JSON.parse(raw);
      if (!data || !Array.isArray(data.objects)) {
        return;
      }

      state.objects = data.objects;
      state.selectedIndex = state.objects.length > 0
        ? clamp(Number(data.selectedIndex) || 0, 0, state.objects.length - 1)
        : -1;
    } catch {
      // ungültige Daten ignorieren, Seite startet leer
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
  elements.paramColor.addEventListener("input", () => {
    updateParamColorText();
    updateCodePreview();
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

    if (isOverlayOpen(elements.newObjectOverlay)) {
      closeNewObjectDialog();
    } else if (isOverlayOpen(elements.deleteAllOverlay)) {
      closeDeleteAllDialog();
    } else if (isOverlayOpen(elements.codeOverlay)) {
      closeCodeDialog();
    }
  });

  elements.showCodeButton.addEventListener("click", openCodeDialog);
  elements.closeCodeButton.addEventListener("click", closeCodeDialog);
  elements.codeOverlay.addEventListener("click", (event) => {
    if (event.target === elements.codeOverlay) {
      closeCodeDialog();
    }
  });
  elements.ideTabs.forEach((tab) => {
    tab.addEventListener("click", () => selectCodeTab(tab.dataset.tab));
  });

  elements.prevObjectButton.addEventListener("click", selectPrevious);
  elements.nextObjectButton.addEventListener("click", selectNext);
  window.addEventListener("keydown", handleGlobalKeydown);

  // ---------------------------------------------------------------------
  // Start
  // ---------------------------------------------------------------------

  drawGrid();
  loadPersistedProgress();
  renderAll(null);
})();
