"use strict";

const LAW_LABELS = {
  demorgan: "De Morgansches Gesetz",
  commutative: "Kommutativgesetz",
  associative: "Assoziativgesetz",
  distributive: "Distributivgesetz",
  complement: "Komplementärgesetz"
};

const APP_ID = "boolesche-algebra-trainer";
const PROGRESS_VERSION = 2;
const STORAGE_KEY = "boolesche-algebra-trainer-progress-v2";
const COOKIE_KEY = "boolesche_algebra_trainer_progress";
const DEFAULT_TASK_PROMPT = "Forme den Ausgangsterm Schritt für Schritt um.";

// Alle Aufgaben liegen bewusst zentral in dieser Struktur.
// Neue Aufgaben lassen sich pro Level über start + steps ergänzen.
const TASKS = {
  leicht: [
    {
      id: "leicht-demorgan-und",
      title: "Aufgabe 1",
      prompt: DEFAULT_TASK_PROMPT,
      start: "¬(a ∧ b)",
      steps: [
        { term: "¬a ∨ ¬b", law: "demorgan" }
      ]
    },
    {
      id: "leicht-komplement-und",
      title: "Aufgabe 2",
      prompt: DEFAULT_TASK_PROMPT,
      start: "a ∧ ¬a",
      steps: [
        { term: "0", law: "complement" }
      ]
    },
    {
      id: "leicht-kommutativ-oder",
      title: "Aufgabe 3",
      prompt: DEFAULT_TASK_PROMPT,
      start: "a ∨ b",
      steps: [
        { term: "b ∨ a", law: "commutative" }
      ]
    }
  ],
  mittel: [
    {
      id: "mittel-demorgan-doppelnegation",
      title: "Aufgabe 1",
      prompt: DEFAULT_TASK_PROMPT,
      start: "¬(a ∨ ¬b)",
      steps: [
        { term: "¬a ∧ ¬¬b", law: "demorgan" },
        { term: "¬a ∧ b", law: "complement" }
      ]
    },
    {
      id: "mittel-distributiv-kurz",
      title: "Aufgabe 2",
      prompt: DEFAULT_TASK_PROMPT,
      start: "(a ∨ b) ∧ (a ∨ c)",
      steps: [
        { term: "a ∨ (b ∧ c)", law: "distributive" }
      ]
    },
    {
      id: "mittel-assoziativ",
      title: "Aufgabe 3",
      prompt: DEFAULT_TASK_PROMPT,
      start: "(a ∨ b) ∨ c",
      steps: [
        { term: "a ∨ (b ∨ c)", law: "associative" }
      ]
    }
  ],
  schwer: [
    {
      id: "schwer-xor-umformung",
      title: "Aufgabe 1",
      prompt: DEFAULT_TASK_PROMPT,
      start: "(¬a ∧ b) ∨ (a ∧ ¬b)",
      steps: [
        { term: "((¬a ∧ b) ∨ a) ∧ ((¬a ∧ b) ∨ ¬b)", law: "distributive" },
        { term: "((a ∨ ¬a) ∧ (a ∨ b)) ∧ ((¬a ∨ ¬b) ∧ (b ∨ ¬b))", law: "distributive" },
        { term: "(a ∨ b) ∧ (¬a ∨ ¬b)", law: "complement" },
        { term: "(a ∨ b) ∧ ¬(a ∧ b)", law: "demorgan" }
      ]
    },
    {
      id: "schwer-ausklammern-komplement",
      title: "Aufgabe 2",
      prompt: DEFAULT_TASK_PROMPT,
      start: "(a ∧ b) ∨ (a ∧ ¬b)",
      steps: [
        { term: "a ∧ (b ∨ ¬b)", law: "distributive" },
        { term: "a ∧ 1", law: "complement" },
        { term: "a", law: "complement" }
      ]
    },
    {
      id: "schwer-ausmultiplizieren-komplement",
      title: "Aufgabe 3",
      prompt: DEFAULT_TASK_PROMPT,
      start: "(a ∨ ¬b) ∧ b",
      steps: [
        { term: "(a ∧ b) ∨ (¬b ∧ b)", law: "distributive" },
        { term: "(a ∧ b) ∨ 0", law: "complement" },
        { term: "a ∧ b", law: "complement" }
      ]
    }
  ]
};

const TASK_PROGRESS_ALIASES = {
  "mittel-distributiv-kurz": ["schwer-distributiv-kurz"],
  "mittel-assoziativ": ["schwer-assoziativ"],
  "schwer-ausklammern-komplement": [
    "mittel-ausklammern-komplement",
    "mittel-distributiv-ausklammern",
    "mittel-distributiv-komplement"
  ],
  "schwer-ausmultiplizieren-komplement": [
    "mittel-ausmultiplizieren-komplement",
    "mittel-distributiv-ausmultiplizieren"
  ]
};

const TASK_LOCATION_ALIASES = {
  "mittel-distributiv-kurz": [{ level: "schwer", taskIndex: 1 }],
  "mittel-assoziativ": [{ level: "schwer", taskIndex: 2 }],
  "schwer-ausklammern-komplement": [{ level: "mittel", taskIndex: 1 }],
  "schwer-ausmultiplizieren-komplement": [{ level: "mittel", taskIndex: 2 }]
};

// Flacher UI-Zustand: Die Lösung selbst bleibt in TASKS, hier steht nur der aktuelle Fortschritt.
const state = {
  level: "leicht",
  taskIndex: null,
  stepIndex: 0,
  currentTerm: "",
  entryTokens: [],
  cursorIndex: 0,
  activeNegationLayers: new Set(),
  completedTasks: new Set(),
  progress: loadSavedProgress()
};

const elements = {};

document.addEventListener("DOMContentLoaded", () => {
  bindElements();
  bindEvents();
  restoreCompletedTasks();
  renderLevel();
  renderTaskOverview();
  renderEmptyWorkspace();
});

function bindElements() {
  elements.levelButtons = Array.from(document.querySelectorAll(".level-button"));
  elements.saveProgressButton = document.querySelector("#save-progress-button");
  elements.loadProgressButton = document.querySelector("#load-progress-button");
  elements.loadProgressFile = document.querySelector("#load-progress-file");
  elements.progressMessage = document.querySelector("#progress-message");
  elements.levelKicker = document.querySelector("#level-kicker");
  elements.taskList = document.querySelector("#task-list");
  elements.workspace = document.querySelector("#workspace");
  elements.emptyState = document.querySelector("#empty-state");
  elements.workspaceContent = document.querySelector("#workspace-content");
  elements.taskKicker = document.querySelector("#task-kicker");
  elements.taskTitle = document.querySelector("#task-title");
  elements.taskStatus = document.querySelector("#task-status");
  elements.startTerm = document.querySelector("#start-term");
  elements.taskPrompt = document.querySelector("#task-prompt");
  elements.currentTerm = document.querySelector("#current-term");
  elements.lawSelect = document.querySelector("#law-select");
  elements.termPreview = document.querySelector("#term-preview");
  elements.tokenButtons = Array.from(document.querySelectorAll(".token-button"));
  elements.negationButtons = Array.from(document.querySelectorAll("[data-not-layer]"));
  elements.cursorLeftButton = document.querySelector("#cursor-left-button");
  elements.cursorRightButton = document.querySelector("#cursor-right-button");
  elements.deleteLastButton = document.querySelector("#delete-last-button");
  elements.clearEntryButton = document.querySelector("#clear-entry-button");
  elements.checkStepButton = document.querySelector("#check-step-button");
  elements.showStepButton = document.querySelector("#show-step-button");
  elements.resetTaskButton = document.querySelector("#reset-task-button");
  elements.feedbackPanel = document.querySelector("#feedback-panel");
  elements.historyList = document.querySelector("#history-list");
}

function bindEvents() {
  elements.levelButtons.forEach((button) => {
    button.addEventListener("click", () => selectLevel(button.dataset.level));
  });

  if (elements.saveProgressButton) {
    elements.saveProgressButton.addEventListener("click", exportProgressJson);
  }

  if (elements.loadProgressButton && elements.loadProgressFile) {
    elements.loadProgressButton.addEventListener("click", () => {
      elements.loadProgressFile.click();
    });

    elements.loadProgressFile.addEventListener("change", importProgressJson);
  }

  elements.taskList.addEventListener("click", (event) => {
    const button = event.target.closest("[data-task-index]");
    if (!button) {
      return;
    }
    openTask(Number(button.dataset.taskIndex));
  });

  elements.tokenButtons.forEach((button) => {
    button.addEventListener("click", () => {
      if (button.dataset.notLayer) {
        handleNegationButton(Number(button.dataset.notLayer));
        return;
      }
      insertEntryToken({
        value: button.dataset.token,
        negationDepth: getActiveNegationDepth()
      });
    });
  });

  elements.termPreview.addEventListener("click", handlePreviewCursorEvent);
  elements.termPreview.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      handlePreviewCursorEvent(event);
    }
  });

  elements.cursorLeftButton.addEventListener("click", () => moveCursor(-1));
  elements.cursorRightButton.addEventListener("click", () => moveCursor(1));

  elements.deleteLastButton.addEventListener("click", () => {
    deleteTokenBeforeCursor();
  });

  elements.clearEntryButton.addEventListener("click", () => {
    clearEntry();
    setFeedback("info", "Eingabe zurückgesetzt", "Baue den nächsten Term erneut aus den Bausteinen auf.");
  });

  elements.checkStepButton.addEventListener("click", checkStep);
  elements.showStepButton.addEventListener("click", showNextStep);
  elements.resetTaskButton.addEventListener("click", resetCurrentTask);
}

function exportProgressJson() {
  const payload = createProgressPayload();
  const formatted = `${JSON.stringify(payload, null, 2)}\n`;
  const blob = new Blob([formatted], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const dateStamp = new Date().toISOString().slice(0, 10);
  const link = document.createElement("a");

  link.href = url;
  link.download = `boolesche-algebra-fortschritt-${dateStamp}.json`;
  document.body.appendChild(link);
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
    const importedProgress = normalizeProgressMap(readProgressMapFromPayload(data));
    applyImportedProgress(importedProgress);
    setProgressMessage("Fortschritt aus JSON geladen.");
  } catch (error) {
    setProgressMessage("Datei konnte nicht geladen werden. Bitte gültige JSON-Datei wählen.", true);
  } finally {
    elements.loadProgressFile.value = "";
  }
}

function applyImportedProgress(progress) {
  state.progress = progress;
  state.completedTasks = new Set();
  restoreCompletedTasks();
  persistProgress();
  renderLevel();
  renderTaskOverview();

  if (hasActiveTask()) {
    openTask(state.taskIndex);
  }
}

function setProgressMessage(text, isError = false) {
  if (!elements.progressMessage) {
    return;
  }

  elements.progressMessage.textContent = text;
  elements.progressMessage.classList.toggle("is-error", isError);
  elements.progressMessage.classList.toggle("is-success", !isError && Boolean(text));
}

function selectLevel(level) {
  state.level = level;
  state.taskIndex = null;
  state.stepIndex = 0;
  state.currentTerm = "";
  state.entryTokens = [];
  state.cursorIndex = 0;
  state.activeNegationLayers.clear();
  renderLevel();
  renderNegationMode();
  renderTaskOverview();
  renderEmptyWorkspace();
}

function renderLevel() {
  elements.levelButtons.forEach((button) => {
    const isActive = button.dataset.level === state.level;
    const isComplete = isLevelComplete(button.dataset.level);
    button.classList.toggle("is-active", isActive);
    button.classList.toggle("is-complete", isComplete);
    button.setAttribute("aria-pressed", String(isActive));
  });
  elements.levelKicker.textContent = `Level ${capitalize(state.level)}`;
}

function renderTaskOverview() {
  const tasks = TASKS[state.level];
  elements.taskList.innerHTML = "";

  tasks.forEach((task, index) => {
    const taskId = getTaskId(state.level, index);
    const button = document.createElement("button");
    button.type = "button";
    button.className = "task-card-button";
    button.dataset.taskIndex = String(index);
    button.classList.toggle("is-active", state.taskIndex === index);
    button.classList.toggle("is-complete", state.completedTasks.has(taskId));
    button.setAttribute("aria-label", `${task.title} öffnen, Startterm ${task.start}`);

    const topLine = document.createElement("span");
    topLine.className = "task-card-top";

    const title = document.createElement("span");
    title.className = "task-card-title";
    title.textContent = task.title;

    const meta = document.createElement("span");
    meta.className = "task-card-meta";
    meta.textContent = state.completedTasks.has(taskId) ? "gelöst" : `${task.steps.length} Schritt${task.steps.length === 1 ? "" : "e"}`;

    const formula = document.createElement("span");
    formula.className = "formula";
    renderFormula(formula, task.start);

    topLine.append(title, meta);
    button.append(topLine, formula);
    elements.taskList.append(button);
  });
}

function renderEmptyWorkspace() {
  elements.workspace.classList.add("is-empty");
  elements.emptyState.hidden = false;
  elements.workspaceContent.hidden = true;
}

function openTask(index) {
  const task = TASKS[state.level][index];
  const savedProgress = getTaskProgress(state.level, index);
  state.taskIndex = index;
  state.stepIndex = clampStepIndex(task, savedProgress ? savedProgress.stepIndex : 0);
  state.currentTerm = getTermAtStep(task, state.stepIndex);
  state.entryTokens = [];
  state.cursorIndex = 0;
  state.activeNegationLayers.clear();

  elements.workspace.classList.remove("is-empty");
  elements.emptyState.hidden = true;
  elements.workspaceContent.hidden = false;
  elements.taskKicker.textContent = `Level ${capitalize(state.level)}`;
  elements.taskTitle.textContent = task.title;
  elements.taskPrompt.textContent = task.prompt || "Forme den Ausgangsterm schrittweise um und gib jeden Zwischenterm über die Bausteine ein.";
  renderFormula(elements.startTerm, task.start);
  renderFormula(elements.currentTerm, state.currentTerm);
  elements.lawSelect.value = "";
  elements.feedbackPanel.innerHTML = "";

  renderTaskOverview();
  renderEntry();
  renderNegationMode();
  renderHistory();
  renderProgress();

  if (state.stepIndex >= task.steps.length) {
    setFeedback("success", "Aufgabe bereits gelöst", "Die gespeicherte Lösungshistorie ist unten sichtbar.");
  }
}

function resetCurrentTask() {
  if (!hasActiveTask()) {
    return;
  }
  const task = getCurrentTask();
  const taskId = getTaskId(state.level, state.taskIndex);
  delete state.progress[taskId];
  state.completedTasks.delete(taskId);
  persistProgress();

  state.stepIndex = 0;
  state.currentTerm = task.start;
  state.entryTokens = [];
  state.cursorIndex = 0;
  state.activeNegationLayers.clear();
  elements.lawSelect.value = "";
  renderFormula(elements.currentTerm, task.start);
  renderEntry();
  renderNegationMode();
  renderHistory();
  renderProgress();
  renderTaskOverview();
  renderLevel();
  setFeedback("info", "Aufgabe zurückgesetzt", "Du beginnst wieder beim Ausgangsterm.");
}

function clearEntry() {
  state.entryTokens = [];
  state.cursorIndex = 0;
  state.activeNegationLayers.clear();
  renderEntry();
  renderNegationMode();
}

function insertEntryToken(token) {
  state.cursorIndex = clampCursorIndex(state.cursorIndex);
  state.entryTokens.splice(state.cursorIndex, 0, token);
  state.cursorIndex += 1;
  renderEntry();
}

function deleteTokenBeforeCursor() {
  state.cursorIndex = clampCursorIndex(state.cursorIndex);
  if (state.cursorIndex <= 0) {
    return;
  }

  state.entryTokens.splice(state.cursorIndex - 1, 1);
  state.cursorIndex -= 1;
  renderEntry();
}

function moveCursor(offset) {
  setCursor(state.cursorIndex + offset);
}

function setCursor(index) {
  state.cursorIndex = clampCursorIndex(index);
  renderEntry();
}

function clampCursorIndex(index) {
  const numericIndex = Number(index);
  if (!Number.isFinite(numericIndex)) {
    return state.entryTokens.length;
  }
  return Math.min(Math.max(0, numericIndex), state.entryTokens.length);
}

function handlePreviewCursorEvent(event) {
  const clickedElement = event.target && event.target.closest
    ? event.target
    : event.target.parentElement;
  if (!clickedElement) {
    return;
  }
  const target = clickedElement.closest("[data-cursor-index], [data-token-index]");
  if (!target || !elements.termPreview.contains(target)) {
    return;
  }

  event.preventDefault();
  if (target.dataset.cursorIndex !== undefined) {
    setCursor(Number(target.dataset.cursorIndex));
    return;
  }

  setCursor(Number(target.dataset.tokenIndex) + 1);
}

function handleNegationButton(layer) {
  state.cursorIndex = clampCursorIndex(state.cursorIndex);
  const negationLayer = Math.max(1, Math.min(3, Number(layer) || 1));

  if (state.cursorIndex < state.entryTokens.length) {
    const token = normalizeEntryToken(state.entryTokens[state.cursorIndex]);
    token.negationDepth += 1;
    state.entryTokens[state.cursorIndex] = token;
    state.cursorIndex += 1;
    renderEntry();
    return;
  }

  if (state.activeNegationLayers.has(negationLayer)) {
    state.activeNegationLayers.delete(negationLayer);
  } else {
    state.activeNegationLayers.add(negationLayer);
  }

  renderNegationMode();
}

function getActiveNegationDepth() {
  return state.activeNegationLayers.size;
}

function renderNegationMode() {
  if (!elements.negationButtons) {
    return;
  }

  elements.negationButtons.forEach((button) => {
    const layer = Number(button.dataset.notLayer) || 1;
    const isActive = state.activeNegationLayers.has(layer);
    button.classList.toggle("is-active", isActive);
    button.setAttribute("aria-pressed", String(isActive));
  });
}

function renderEntry() {
  const value = formatTokens(state.entryTokens);
  elements.termPreview.classList.toggle("is-empty", !value);
  renderEditableFormula();
  renderCursorButtons();
}

function renderEditableFormula() {
  state.cursorIndex = clampCursorIndex(state.cursorIndex);

  if (!state.entryTokens.length) {
    elements.termPreview.innerHTML = `
      ${renderCursorSlot(0)}
      <span class="empty-entry-text">Noch kein Baustein gewählt</span>
    `;
    elements.termPreview.removeAttribute("aria-label");
    return;
  }

  elements.termPreview.innerHTML = renderEditableRange(0, state.entryTokens.length, 1);
  elements.termPreview.setAttribute("aria-label", termToAccessibleText(formatTokens(state.entryTokens)));
}

function renderEditableRange(start, end, layer) {
  let html = "";
  let index = start;
  let lastCursorIndex = -1;

  const appendCursor = (cursorIndex) => {
    if (lastCursorIndex === cursorIndex) {
      return;
    }

    html += renderCursorSlot(cursorIndex);
    lastCursorIndex = cursorIndex;
  };

  while (index < end) {
    const token = normalizeEntryToken(state.entryTokens[index]);

    if (layer <= 3 && token.negationDepth >= layer) {
      const segmentStart = index;

      while (
        index < end
        && normalizeEntryToken(state.entryTokens[index]).negationDepth >= layer
      ) {
        index += 1;
      }

      html += `<span class="editable-not-run editable-not-run-${layer}">${renderEditableRange(segmentStart, index, layer + 1)}</span>`;
      lastCursorIndex = index;
      continue;
    }

    appendCursor(index);
    html += renderEditableToken(token, index);
    index += 1;
  }

  appendCursor(end);
  return html;
}

function renderCursorSlot(index) {
  const isActive = index === state.cursorIndex;
  return `<span class="cursor-slot${isActive ? " is-active" : ""}" role="button" tabindex="0" data-cursor-index="${index}" aria-label="Cursor an Position ${index} setzen"></span>`;
}

function renderEditableToken(rawToken, index) {
  const token = normalizeEntryToken(rawToken);
  const spacingClass = token.value === "∧" || token.value === "∨" ? " is-operator" : "";
  const tokenHtml = escapeHtml(token.value);
  return `<span class="formula-token${spacingClass}" role="button" tabindex="0" data-token-index="${index}" aria-label="Cursor hinter ${termToAccessibleText(token.value)} setzen">${tokenHtml}</span>`;
}

function renderCursorButtons() {
  elements.cursorLeftButton.disabled = state.cursorIndex <= 0;
  elements.cursorRightButton.disabled = state.cursorIndex >= state.entryTokens.length;
}

function renderProgress() {
  const task = getCurrentTask();
  const isComplete = state.stepIndex >= task.steps.length;
  elements.taskStatus.textContent = isComplete ? "Aufgabe gelöst" : `Schritt ${state.stepIndex + 1} von ${task.steps.length}`;
  elements.taskStatus.classList.toggle("is-complete", isComplete);
  elements.checkStepButton.disabled = isComplete;
  elements.showStepButton.disabled = isComplete;
}

function renderHistory() {
  const task = getCurrentTask();
  const savedProgress = getTaskProgress(state.level, state.taskIndex);
  const savedHistory = savedProgress && savedProgress.stepIndex === state.stepIndex && Array.isArray(savedProgress.history)
    ? savedProgress.history
    : null;
  const history = savedHistory || buildHistoryForStep(task, state.stepIndex);

  elements.historyList.innerHTML = "";
  history.forEach((entry, index) => {
    const isStart = entry.isStart || index === 0;
    const lawText = entry.law ? `Verwendetes Gesetz: ${LAW_LABELS[entry.law]}` : "";
    addHistoryItem(isStart ? "Ausgang" : "", entry.term, lawText, isStart);
  });
}

function addHistoryItem(label, term, lawText, isStart) {
  const item = document.createElement("li");
  item.className = "history-item";
  item.classList.toggle("is-start", isStart);

  const labelElement = document.createElement("span");
  labelElement.className = "history-label";
  labelElement.textContent = label;

  const termElement = document.createElement("span");
  termElement.className = "formula";
  renderFormula(termElement, term);

  item.append(labelElement, termElement);

  if (lawText) {
    const lawElement = document.createElement("span");
    lawElement.className = "history-law";
    lawElement.textContent = lawText;
    item.append(lawElement);
  }

  elements.historyList.append(item);
}

function checkStep() {
  if (!hasActiveTask()) {
    return;
  }

  const task = getCurrentTask();
  const expected = task.steps[state.stepIndex];
  const entry = formatTokens(state.entryTokens);
  const selectedLaw = elements.lawSelect.value;

  if (!entry) {
    setFeedback("warning", "Noch kein Term eingegeben", "Wähle Bausteine aus der Leiste, um den nächsten Term zu erstellen.");
    return;
  }

  if (!selectedLaw) {
    setFeedback("warning", "Gesetz fehlt", "Wähle zuerst aus, welches Gesetz du in diesem Schritt anwendest.");
    return;
  }

  // Hauptvalidierung: nächster Lösungsschritt mit robustem Vergleich gegen überflüssige Klammern.
  const termMatches = termsMatch(entry, expected.term);
  const lawMatches = selectedLaw === expected.law;

  if (termMatches && lawMatches) {
    state.stepIndex += 1;
    state.currentTerm = expected.term;
    renderFormula(elements.currentTerm, expected.term);
    elements.lawSelect.value = "";
    clearEntry();
    saveCurrentProgress();
    renderHistory();
    renderProgress();

    if (state.stepIndex >= task.steps.length) {
      state.completedTasks.add(getTaskId(state.level, state.taskIndex));
      renderLevel();
      renderTaskOverview();
      setFeedback("success", "Aufgabe gelöst", "Sehr gut. Alle vorgegebenen Lösungsschritte wurden korrekt durchgeführt.");
    } else {
      setFeedback("success", "Richtiger Schritt", "Der Term und das gewählte Gesetz passen. Baue nun den nächsten Schritt.");
    }
    return;
  }

  if (termMatches && !lawMatches) {
    setFeedback("warning", "Term stimmt, Gesetz noch nicht", "Der eingegebene Term ist der erwartete nächste Schritt. Prüfe noch einmal das ausgewählte Gesetz.");
    return;
  }

  if (!termMatches && lawMatches) {
    const equivalenceHint = buildEquivalenceHint(state.currentTerm, entry);
    setFeedback("error", "Term noch nicht passend", `Das Gesetz passt, aber der nächste Term entspricht noch nicht dem erwarteten Lösungspfad. Prüfe besonders Klammern und Negationen.${equivalenceHint}`);
    return;
  }

  const equivalenceHint = buildEquivalenceHint(state.currentTerm, entry);
  setFeedback("error", "Noch nicht richtig", `Term und Gesetz passen noch nicht zum nächsten Lösungsschritt. Überlege, welche Umformungsregel direkt auf den aktuellen Term passt.${equivalenceHint}`);
}

function showNextStep() {
  if (!hasActiveTask()) {
    return;
  }

  const task = getCurrentTask();
  const expected = task.steps[state.stepIndex];
  if (!expected) {
    setFeedback("success", "Keine weiteren Schritte", "Diese Aufgabe ist bereits vollständig gelöst.");
    return;
  }

  setFeedback(
    "info",
    "Nächster Lösungsschritt",
    `Baue diesen Term nach und wähle das passende Gesetz aus.`,
    expected.term,
    LAW_LABELS[expected.law]
  );
}

function setFeedback(type, title, text, term = "", law = "") {
  const message = document.createElement("div");
  message.className = `feedback-message is-${type}`;

  const strong = document.createElement("strong");
  strong.textContent = title;

  const paragraph = document.createElement("p");
  paragraph.textContent = text;

  message.append(strong, paragraph);

  if (term) {
    const termElement = document.createElement("span");
    termElement.className = "formula feedback-term";
    renderFormula(termElement, term);
    message.append(termElement);
  }

  if (law) {
    const lawElement = document.createElement("span");
    lawElement.className = "history-law";
    lawElement.textContent = `Verwendetes Gesetz: ${law}`;
    message.append(lawElement);
  }

  elements.feedbackPanel.innerHTML = "";
  elements.feedbackPanel.append(message);
}

function buildEquivalenceHint(leftTerm, rightTerm) {
  const equivalent = areEquivalent(leftTerm, rightTerm);
  if (equivalent === true) {
    return " Dein Term ist logisch äquivalent zum aktuellen Term, folgt hier aber nicht dem vorgegebenen nächsten Lösungsschritt.";
  }
  return "";
}

function termsMatch(leftTerm, rightTerm) {
  if (normalizeTerm(leftTerm) === normalizeTerm(rightTerm)) {
    return true;
  }

  try {
    return canonicalizeAst(parseBooleanTerm(leftTerm)) === canonicalizeAst(parseBooleanTerm(rightTerm));
  } catch (error) {
    return false;
  }
}

function hasActiveTask() {
  return state.taskIndex !== null;
}

function getCurrentTask() {
  return TASKS[state.level][state.taskIndex];
}

function getTaskId(level, index) {
  return TASKS[level][index].id || `${level}-${index}`;
}

function isLevelComplete(level) {
  return TASKS[level].every((task, index) => state.completedTasks.has(getTaskId(level, index)));
}

function getTaskProgress(level, index) {
  return state.progress[getTaskId(level, index)] || null;
}

function restoreCompletedTasks() {
  Object.keys(TASKS).forEach((level) => {
    TASKS[level].forEach((task, index) => {
      const taskId = getTaskId(level, index);
      const progress = state.progress[taskId];
      if (progress && clampStepIndex(task, progress.stepIndex) >= task.steps.length) {
        state.completedTasks.add(taskId);
      }
    });
  });
}

function saveCurrentProgress() {
  if (!hasActiveTask()) {
    return;
  }

  const task = getCurrentTask();
  const taskId = getTaskId(state.level, state.taskIndex);
  const completed = state.stepIndex >= task.steps.length;

  state.progress[taskId] = {
    level: state.level,
    taskIndex: state.taskIndex,
    stepIndex: state.stepIndex,
    currentTerm: state.currentTerm,
    completed,
    history: buildHistoryForStep(task, state.stepIndex)
  };

  if (completed) {
    state.completedTasks.add(taskId);
  }

  persistProgress();
}

function loadSavedProgress() {
  const payload = readLocalStoragePayload() || readCookiePayload();
  return normalizeProgressMap(readProgressMapFromPayload(payload));
}

function persistProgress() {
  const payload = createProgressPayload();

  try {
    if (typeof localStorage !== "undefined") {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    }
  } catch (error) {
    // Ohne lokalen Speicher funktioniert die Seite weiterhin in der aktuellen Sitzung.
  }

  writeCookiePayload(payload);
}

function createProgressPayload() {
  const progress = normalizeProgressMap(state.progress);
  state.progress = progress;

  return {
    app: APP_ID,
    version: PROGRESS_VERSION,
    savedAt: new Date().toISOString(),
    completedTaskIds: Object.keys(progress).filter((taskId) => progress[taskId].completed),
    progress
  };
}

function readLocalStoragePayload() {
  try {
    if (typeof localStorage === "undefined") {
      return null;
    }
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch (error) {
    return null;
  }
}

function readCookiePayload() {
  try {
    if (typeof document === "undefined" || !document.cookie) {
      return null;
    }

    const cookie = document.cookie
      .split(";")
      .map((entry) => entry.trim())
      .find((entry) => entry.startsWith(`${COOKIE_KEY}=`));

    if (!cookie) {
      return null;
    }

    return JSON.parse(decodeURIComponent(cookie.slice(COOKIE_KEY.length + 1)));
  } catch (error) {
    return null;
  }
}

function writeCookiePayload(payload) {
  try {
    if (typeof document === "undefined") {
      return;
    }

    const value = encodeURIComponent(JSON.stringify(payload));
    document.cookie = `${COOKIE_KEY}=${value}; max-age=31536000; path=/; SameSite=Lax`;
  } catch (error) {
    // Cookies können je nach Browser-/Datei-Kontext blockiert sein; localStorage bleibt maßgeblich.
  }
}

function readProgressMapFromPayload(payload) {
  if (!payload || typeof payload !== "object") {
    return {};
  }

  if (payload.progress && typeof payload.progress === "object") {
    return payload.progress;
  }

  const completedTaskIds = Array.isArray(payload.completedTaskIds)
    ? payload.completedTaskIds
    : Array.isArray(payload.completedTasks)
      ? payload.completedTasks
      : null;

  if (completedTaskIds) {
    return completedTaskIds.reduce((progress, taskId) => {
      if (typeof taskId === "string") {
        progress[taskId] = { completed: true, stepIndex: Number.MAX_SAFE_INTEGER };
      }
      return progress;
    }, {});
  }

  // Abwärtskompatibel zu älteren Speicherständen, die direkt die Aufgaben-Map enthielten.
  return payload;
}

function normalizeProgressMap(rawProgress) {
  const normalized = {};

  Object.keys(TASKS).forEach((level) => {
    TASKS[level].forEach((task, index) => {
      const taskId = getTaskId(level, index);
      const rawTaskProgress = findRawTaskProgress(rawProgress, task, taskId);
      if (!rawTaskProgress || typeof rawTaskProgress !== "object") {
        return;
      }

      const stepIndex = clampStepIndex(task, rawTaskProgress.stepIndex);
      if (stepIndex <= 0) {
        return;
      }

      const history = normalizeHistory(rawTaskProgress.history, task, stepIndex);
      normalized[taskId] = {
        level,
        taskIndex: index,
        stepIndex,
        currentTerm: getTermAtStep(task, stepIndex),
        completed: stepIndex >= task.steps.length,
        history
      };
    });
  });

  return normalized;
}

function findRawTaskProgress(rawProgress, task, taskId) {
  if (!rawProgress || typeof rawProgress !== "object") {
    return null;
  }

  const directProgress = readRawTaskProgress(rawProgress, taskId);
  if (directProgress) {
    return directProgress;
  }

  const aliases = TASK_PROGRESS_ALIASES[taskId] || [];
  for (const alias of aliases) {
    const aliasProgress = readRawTaskProgress(rawProgress, alias);
    if (aliasProgress) {
      return aliasProgress;
    }
  }

  const locationAliases = TASK_LOCATION_ALIASES[taskId] || [];
  for (const location of locationAliases) {
    const locationProgress = findProgressByLocation(rawProgress, location);
    if (locationProgress && progressBelongsToTask(locationProgress, task)) {
      return locationProgress;
    }
  }

  return findProgressByTaskSignature(rawProgress, task);
}

function readRawTaskProgress(rawProgress, taskId) {
  const progress = rawProgress[taskId];
  return progress && typeof progress === "object" && !Array.isArray(progress) ? progress : null;
}

function findProgressByLocation(rawProgress, location) {
  return Object.values(rawProgress).find((progress) => {
    if (!progress || typeof progress !== "object" || Array.isArray(progress)) {
      return false;
    }

    return progress.level === location.level && Number(progress.taskIndex) === location.taskIndex;
  }) || null;
}

function findProgressByTaskSignature(rawProgress, task) {
  return Object.values(rawProgress).find((progress) => {
    if (!progress || typeof progress !== "object" || Array.isArray(progress)) {
      return false;
    }

    return progressBelongsToTask(progress, task);
  }) || null;
}

function progressBelongsToTask(progress, task) {
  if (Array.isArray(progress.history) && progress.history.length > 0) {
    const firstEntry = progress.history[0];
    if (firstEntry && typeof firstEntry.term === "string" && termsMatch(firstEntry.term, task.start)) {
      return true;
    }
  }

  const stepIndex = clampStepIndex(task, progress.stepIndex);
  return stepIndex > 0
    && typeof progress.currentTerm === "string"
    && termsMatch(progress.currentTerm, getTermAtStep(task, stepIndex));
}

function normalizeHistory(rawHistory, task, stepIndex) {
  if (!Array.isArray(rawHistory)) {
    return buildHistoryForStep(task, stepIndex);
  }

  const expectedHistory = buildHistoryForStep(task, stepIndex);
  const cleaned = rawHistory
    .slice(0, expectedHistory.length)
    .map((entry, index) => {
      const expected = expectedHistory[index];
      if (!entry || typeof entry !== "object") {
        return expected;
      }

      return {
        term: typeof entry.term === "string" ? entry.term : expected.term,
        law: typeof entry.law === "string" ? entry.law : expected.law,
        isStart: Boolean(entry.isStart || index === 0)
      };
    });

  while (cleaned.length < expectedHistory.length) {
    cleaned.push(expectedHistory[cleaned.length]);
  }

  return cleaned;
}

function buildHistoryForStep(task, stepIndex) {
  const history = [{ term: task.start, law: "", isStart: true }];
  task.steps.slice(0, stepIndex).forEach((step) => {
    history.push({ term: step.term, law: step.law, isStart: false });
  });
  return history;
}

function clampStepIndex(task, stepIndex) {
  const numericStep = Number(stepIndex);
  if (!Number.isFinite(numericStep)) {
    return 0;
  }
  return Math.min(Math.max(0, numericStep), task.steps.length);
}

function getTermAtStep(task, stepIndex) {
  if (stepIndex <= 0) {
    return task.start;
  }
  return task.steps[stepIndex - 1].term;
}

function capitalize(value) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function renderFormula(element, term, emptyText = "") {
  if (!term) {
    element.textContent = emptyText;
    element.removeAttribute("aria-label");
    return;
  }

  element.innerHTML = formulaToHtml(term);
  element.setAttribute("aria-label", termToAccessibleText(term));
}

function formulaToHtml(term) {
  const displayTerm = String(term)
    .replace(/AND/gi, "∧")
    .replace(/OR/gi, "∨")
    .replace(/NOT/gi, "¬")
    .replace(/!/g, "¬");

  return renderFormulaRange(displayTerm, 0, displayTerm.length).html;
}

function renderFormulaRange(term, start, end) {
  let html = "";
  let index = start;

  while (index < end) {
    const character = term[index];
    if (character === "¬") {
      const negated = renderNegatedFactor(term, index + 1, end);
      html += `<span class="not-overline">${negated.html}</span>`;
      index = negated.nextIndex;
      continue;
    }

    html += escapeHtml(character);
    index += 1;
  }

  return { html, nextIndex: index };
}

function renderNegatedFactor(term, start, end) {
  let index = start;
  while (index < end && /\s/.test(term[index])) {
    index += 1;
  }

  if (index >= end) {
    return { html: "", nextIndex: index };
  }

  if (term[index] === "¬") {
    const nested = renderNegatedFactor(term, index + 1, end);
    return {
      html: `<span class="not-overline">${nested.html}</span>`,
      nextIndex: nested.nextIndex
    };
  }

  if (term[index] === "(") {
    const closingIndex = findMatchingParen(term, index, end);
    if (closingIndex !== -1) {
      return {
        html: renderFormulaRange(term, index, closingIndex + 1).html,
        nextIndex: closingIndex + 1
      };
    }
  }

  return {
    html: escapeHtml(term[index]),
    nextIndex: index + 1
  };
}

function findMatchingParen(term, openIndex, end) {
  let depth = 0;
  for (let index = openIndex; index < end; index += 1) {
    if (term[index] === "(") {
      depth += 1;
    }
    if (term[index] === ")") {
      depth -= 1;
      if (depth === 0) {
        return index;
      }
    }
  }
  return -1;
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function termToAccessibleText(term) {
  return String(term)
    .replace(/¬/g, "nicht ")
    .replace(/∧/g, " und ")
    .replace(/∨/g, " oder ")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeTerm(term) {
  // Leerzeichen und einfache Texteingabe-Varianten sollen beim Vergleich keine Rolle spielen.
  const normalized = term
    .normalize("NFKC")
    .replace(/\s+/g, "")
    .replace(/AND/gi, "∧")
    .replace(/OR/gi, "∨")
    .replace(/NOT/gi, "¬")
    .replace(/!/g, "¬");

  return stripRedundantOuterParens(normalized);
}

function stripRedundantOuterParens(term) {
  let current = term;
  while (hasRedundantOuterParens(current)) {
    current = current.slice(1, -1);
  }
  return current;
}

function hasRedundantOuterParens(term) {
  if (term.length < 2 || term[0] !== "(" || term[term.length - 1] !== ")") {
    return false;
  }

  let depth = 0;
  for (let index = 0; index < term.length; index += 1) {
    if (term[index] === "(") {
      depth += 1;
    } else if (term[index] === ")") {
      depth -= 1;
    }

    if (depth === 0 && index < term.length - 1) {
      return false;
    }

    if (depth < 0) {
      return false;
    }
  }

  return depth === 0;
}

function formatTokens(tokens) {
  const parts = [];
  let index = 0;

  while (index < tokens.length) {
    const token = normalizeEntryToken(tokens[index]);
    if (token.negationDepth > 0) {
      const run = [];
      const negationDepth = token.negationDepth;
      while (index < tokens.length && normalizeEntryToken(tokens[index]).negationDepth === negationDepth) {
        run.push(normalizeEntryToken(tokens[index]).value);
        index += 1;
      }
      parts.push(formatNegatedRun(run, negationDepth));
      continue;
    }

    parts.push(token.value);
    index += 1;
  }

  return formatPlainTokens(parts);
}

function normalizeEntryToken(token) {
  if (typeof token === "string") {
    return { value: token, negationDepth: 0 };
  }

  const legacyDepth = token.negated ? 1 : 0;
  return {
    value: token.value,
    negationDepth: Number.isFinite(Number(token.negationDepth)) ? Math.max(0, Number(token.negationDepth)) : legacyDepth
  };
}

function formatNegatedRun(tokens, negationDepth = 1) {
  const term = formatPlainTokens(tokens);
  if (!term) {
    return "";
  }

  const prefix = "¬".repeat(negationDepth);
  const compactTerm = term.replace(/\s+/g, "");
  if (tokens.length === 1 || hasRedundantOuterParens(compactTerm)) {
    return `${prefix}${term}`;
  }

  return `${prefix}(${term})`;
}

function formatPlainTokens(tokens) {
  return tokens
    .map((token) => (token === "∧" || token === "∨" ? ` ${token} ` : token))
    .join("")
    .replace(/\s+/g, " ")
    .replace(/\(\s/g, "(")
    .replace(/\s\)/g, ")")
    .trim();
}

function areEquivalent(leftTerm, rightTerm) {
  // Ergänzende Prüfung: Wahrheitstafel über a, b und c. Sie ersetzt nicht den Lösungspfad.
  try {
    const leftAst = parseBooleanTerm(leftTerm);
    const rightAst = parseBooleanTerm(rightTerm);
    const assignments = [
      { a: false, b: false, c: false },
      { a: false, b: false, c: true },
      { a: false, b: true, c: false },
      { a: false, b: true, c: true },
      { a: true, b: false, c: false },
      { a: true, b: false, c: true },
      { a: true, b: true, c: false },
      { a: true, b: true, c: true }
    ];

    return assignments.every((assignment) => evaluateAst(leftAst, assignment) === evaluateAst(rightAst, assignment));
  } catch (error) {
    return null;
  }
}

function canonicalizeAst(node) {
  switch (node.type) {
    case "variable":
      return node.name;
    case "constant":
      return node.value ? "1" : "0";
    case "not":
      return `not(${canonicalizeAst(node.value)})`;
    case "and":
    case "or": {
      const parts = flattenAssociative(node, node.type).map(canonicalizeAst);
      return `${node.type}(${parts.join(",")})`;
    }
    default:
      throw new Error(`Unknown node type ${node.type}`);
  }
}

function flattenAssociative(node, type) {
  if (node.type !== type) {
    return [node];
  }
  return [
    ...flattenAssociative(node.left, type),
    ...flattenAssociative(node.right, type)
  ];
}

function parseBooleanTerm(term) {
  // Kleiner rekursiver Parser mit der üblichen Bindung: ¬ vor ∧ vor ∨.
  const tokens = tokenizeTerm(term);
  let position = 0;

  function peek() {
    return tokens[position];
  }

  function consume(expected) {
    const token = tokens[position];
    if (expected && token !== expected) {
      throw new Error(`Expected ${expected}, found ${token}`);
    }
    position += 1;
    return token;
  }

  function parseExpression() {
    return parseOr();
  }

  function parseOr() {
    let node = parseAnd();
    while (peek() === "∨") {
      consume("∨");
      node = { type: "or", left: node, right: parseAnd() };
    }
    return node;
  }

  function parseAnd() {
    let node = parseUnary();
    while (peek() === "∧") {
      consume("∧");
      node = { type: "and", left: node, right: parseUnary() };
    }
    return node;
  }

  function parseUnary() {
    if (peek() === "¬") {
      consume("¬");
      return { type: "not", value: parseUnary() };
    }
    return parseAtom();
  }

  function parseAtom() {
    const token = peek();
    if (token === "(") {
      consume("(");
      const node = parseExpression();
      consume(")");
      return node;
    }
    if (token === "a" || token === "b" || token === "c") {
      consume();
      return { type: "variable", name: token };
    }
    if (token === "0" || token === "1") {
      consume();
      return { type: "constant", value: token === "1" };
    }
    throw new Error(`Unexpected token ${token}`);
  }

  const ast = parseExpression();
  if (position !== tokens.length) {
    throw new Error("Unexpected trailing tokens");
  }
  return ast;
}

function tokenizeTerm(term) {
  const normalized = normalizeTerm(term);
  const tokens = [];

  for (let index = 0; index < normalized.length; index += 1) {
    const character = normalized[index];
    if ("abc01()¬∧∨".includes(character)) {
      tokens.push(character);
      continue;
    }
    throw new Error(`Invalid character ${character}`);
  }

  return tokens;
}

function evaluateAst(node, assignment) {
  switch (node.type) {
    case "variable":
      return assignment[node.name];
    case "constant":
      return node.value;
    case "not":
      return !evaluateAst(node.value, assignment);
    case "and":
      return evaluateAst(node.left, assignment) && evaluateAst(node.right, assignment);
    case "or":
      return evaluateAst(node.left, assignment) || evaluateAst(node.right, assignment);
    default:
      throw new Error(`Unknown node type ${node.type}`);
  }
}
