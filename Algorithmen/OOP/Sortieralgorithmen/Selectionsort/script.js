(() => {
  "use strict";
  const STORAGE_KEY = "infsek2-selectionsort-v1";
  const SIZE = 8;
  const $ = (id) => document.getElementById(id);
  const actions = ["remember-min", "next", "swap", "mark", "restart-pass"].map($);

  function freshState() {
    return {
      values: Array.from({ length: SIZE }, () => Math.floor(Math.random() * 90) + 10),
      phase: "ready", first: 0, index: 0, minimum: 0, comparisons: 0, swaps: 0,
      feedback: "Die Liste ist bereit.", tone: "",
    };
  }

  function validState(s) {
    if (!s || !Array.isArray(s.values) || s.values.length !== SIZE ||
        !s.values.every((v) => Number.isInteger(v) && v >= 10 && v <= 99) ||
        !["ready", "compare", "place", "mark", "restart", "last", "done"].includes(s.phase) ||
        ![s.first, s.index, s.minimum, s.comparisons, s.swaps].every(Number.isInteger) ||
        s.first < 0 || s.first > SIZE || s.index < 0 || s.index >= SIZE ||
        s.minimum < 0 || s.minimum >= SIZE || s.comparisons < 0 || s.comparisons > 28 ||
        s.swaps < 0 || s.swaps > 7 || typeof s.feedback !== "string" ||
        !["", "success", "error"].includes(s.tone)) return false;
    const { phase, first, index, minimum, values } = s;
    if (phase === "ready") return first === 0 && index === 0 && minimum === 0 &&
      s.comparisons === 0 && s.swaps === 0;
    const ordered = [...values].sort((a, b) => a - b);
    if (!values.every((v, i) => i >= first || v === ordered[i])) return false;
    const completed = first * (15 - first) / 2;
    if (phase === "compare") {
      if (first >= 7 || index <= first || minimum < first || minimum > index ||
          s.comparisons !== completed + index - first - 1) return false;
      const scanned = values.slice(first, index);
      // The current candidate may already have been remembered, before pressing Weiter.
      return minimum === index ? values[minimum] < Math.min(...scanned) :
        values[minimum] === Math.min(...scanned) && values.indexOf(values[minimum], first) === minimum;
    }
    if (phase === "place" || phase === "mark") {
      if (first >= 7 || index !== 7 || minimum < first ||
          s.comparisons !== completed + 7 - first) return false;
      const smallest = Math.min(...values.slice(first));
      return phase === "mark" ? minimum === first && values[first] === smallest :
        values[minimum] === smallest && values.indexOf(smallest, first) === minimum;
    }
    if (phase === "restart") return first >= 1 && first < 7 && index === first &&
      minimum === first && s.comparisons === completed;
    if (phase === "last") return first === 7 && index === 7 && minimum === 7 && s.comparisons === 28;
    return phase === "done" && first === 8 && index === 7 && minimum === 7 && s.comparisons === 28;
  }

  function restore() {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
      if (validState(saved)) return saved;
    } catch { /* Storage is optional; invalid data starts a new simulation. */ }
    return freshState();
  }
  let state = restore();
  function save() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch { /* Optional storage. */ }
  }

  function render() {
    const ready = state.phase === "ready";
    const done = state.phase === "done";
    $("setup-actions").hidden = !ready;
    $("algorithm-actions").hidden = ready;
    $("new-simulation-row").hidden = ready;
    actions.forEach((button) => { button.disabled = done; });
    $("round").textContent = ready ? "Bereit" : done ? "Fertig" : `Durchlauf ${Math.min(state.first + 1, 7)} / 7`;
    $("sorted-count").textContent = `Einsortiert: ${state.first} / ${SIZE}`;
    $("comparisons").textContent = `Vergleiche: ${state.comparisons}`;
    $("swaps").textContent = `Tauschvorgänge: ${state.swaps}`;
    $("instruction").textContent = ready
      ? "Würfle bei Bedarf eine neue Liste und drücke auf „Start“."
      : done ? "Geschafft! Alle acht Elemente sind aufsteigend sortiert."
        : "Suche das kleinste Element im unsortierten Bereich und wähle deine nächste Aktion.";
    $("number-list").replaceChildren(...state.values.map((value, index) => {
      const tile = document.createElement("li");
      const sorted = index < state.first;
      const current = (state.phase === "compare" && index === state.index) ||
        (state.phase === "place" && index === state.first);
      const minimum = ["compare", "place"].includes(state.phase) && index === state.minimum;
      const pending = ["mark", "last"].includes(state.phase) && index === state.first;
      tile.className = `number-tile${sorted ? " is-sorted" : ""}${current ? " is-current" : ""}${minimum ? " is-minimum" : ""}${pending ? " is-pending" : ""}`;
      tile.setAttribute("aria-label", `Index ${index}: ${value}${sorted ? ", einsortiert" : ""}${current ? state.phase === "compare" ? ", Prüfindex" : ", Tauschziel" : ""}${minimum ? ", gemerktes Minimum" : ""}`);
      const label = document.createElement("span");
      label.className = "tile-index";
      label.textContent = index;
      const number = document.createElement("span");
      number.className = "tile-value";
      number.textContent = value;
      const marker = document.createElement("span");
      marker.className = "tile-marker";
      marker.setAttribute("aria-hidden", "true");
      marker.textContent = sorted ? "✓" : minimum ? "M" : current ? "↑" : pending ? "?" : "";
      tile.append(label, number, marker);
      return tile;
    }));
    const captions = {
      ready: "Indizes 0–7",
      compare: `Minimum: Index ${state.minimum} · Prüfindex: ${state.index} · Bereich: ${state.first}–7`,
      place: `Suche abgeschlossen · Minimum: Index ${state.minimum} · Ziel: Index ${state.first}`,
      mark: "Das Minimum steht am Anfang des unsortierten Bereichs",
      restart: "Durchlauf abgeschlossen",
      last: "Ein Element ist noch unmarkiert",
      done: "Alle Elemente sind aufsteigend sortiert",
    };
    $("pair-caption").textContent = captions[state.phase];
    $("feedback").className = `feedback-box ${state.tone}`;
    if ($("feedback").textContent !== state.feedback) $("feedback").textContent = state.feedback;
    save();
  }
  function respond(text, tone = "success") {
    state.feedback = text;
    state.tone = tone;
    render();
  }
  const reject = (message) => respond(message, "error");

  $("shuffle").addEventListener("click", () => {
    if (state.phase !== "ready") return;
    state = freshState();
    respond("Neue Liste gewürfelt – starte, wenn du bereit bist.", "");
  });
  $("start").addEventListener("click", () => {
    if (state.phase !== "ready") return;
    state.phase = "compare";
    state.index = 1;
    respond("Los geht’s: Index 0 ist das gemerkte Minimum; prüfe die Zahl an Index 1.", "");
    $("remember-min").focus();
  });
  $("remember-min").addEventListener("click", () => {
    if (state.phase !== "compare") return reject("Ein neues Minimum kannst du nur während der Suche merken.");
    if (state.minimum === state.index) return reject("Diese Zahl ist bereits als Minimum gemerkt – schließe den Vergleich mit „Weiter“ ab.");
    if (state.values[state.index] >= state.values[state.minimum]) return reject("Die Zahl am Prüfindex ist nicht kleiner – behalte das gemerkte Minimum.");
    state.minimum = state.index;
    respond(`Index ${state.minimum} ist das neue gemerkte Minimum – schließe den Vergleich mit „Weiter“ ab.`);
  });
  $("next").addEventListener("click", () => {
    if (state.phase !== "compare") return reject(state.phase === "restart"
      ? "Das Element ist markiert – beginne jetzt den nächsten Durchlauf."
      : "Die Suche ist beendet – bringe das Minimum an seine Position und markiere es als einsortiert.");
    if (state.values[state.index] < state.values[state.minimum]) return reject("Die Zahl am Prüfindex ist kleiner – merke sie zuerst als neues Minimum.");
    state.comparisons += 1;
    if (state.index === SIZE - 1) {
      state.phase = "place";
      respond("Die Suche ist abgeschlossen – entscheide, ob ein Tausch nötig ist.");
    } else {
      state.index += 1;
      respond(`Vergleich abgeschlossen – prüfe jetzt Index ${state.index}.`);
    }
  });
  $("swap").addEventListener("click", () => {
    if (state.phase !== "place") return reject(state.phase === "compare"
      ? "Noch nicht tauschen – prüfe zuerst den gesamten unsortierten Bereich."
      : "Hier ist kein Tausch nötig – markiere das Element oder beginne den nächsten Durchlauf.");
    if (state.minimum === state.first) return reject("Das Minimum steht schon am Anfang des unsortierten Bereichs – markiere es ohne Tausch.");
    const { first, minimum } = state;
    [state.values[first], state.values[minimum]] = [state.values[minimum], state.values[first]];
    state.minimum = first;
    state.phase = "mark";
    state.swaps += 1;
    respond(`Richtig getauscht – das Minimum steht jetzt an Index ${first}.`);
  });
  $("mark").addEventListener("click", () => {
    if (state.phase === "place" && state.minimum !== state.first) return reject("Tausche zuerst das gefundene Minimum mit dem ersten unsortierten Element.");
    if (!["place", "mark", "last"].includes(state.phase)) return reject(state.phase === "restart"
      ? "Dieses Element ist schon markiert – beginne jetzt den nächsten Durchlauf."
      : "Noch nicht markieren – schließe erst alle Vergleiche dieser Suche mit „Weiter“ ab.");
    const marked = state.first;
    state.first += 1;
    if (state.first === SIZE) {
      state.phase = "done";
      respond(`Geschafft! Alle acht Elemente sind einsortiert – ${state.comparisons} Vergleiche und ${state.swaps} Tauschvorgänge.`);
      $("new-simulation").focus();
    } else {
      state.index = state.first;
      state.minimum = state.first;
      state.phase = state.first === SIZE - 1 ? "last" : "restart";
      respond(state.phase === "last"
        ? "Index 6 ist einsortiert – markiere auch das letzte verbliebene Element an Index 7."
        : `Index ${marked} ist einsortiert und wird nicht mehr verglichen.`);
    }
  });
  $("restart-pass").addEventListener("click", () => {
    if (state.phase !== "restart") return reject(state.phase === "last"
      ? "Es bleibt nur Index 7 – markiere dieses Element, um die Simulation abzuschließen."
      : "Schließe zuerst die Suche ab, tausche bei Bedarf und markiere das Element als einsortiert.");
    state.minimum = state.first;
    state.index = state.first + 1;
    state.phase = "compare";
    respond(`Neuer Durchlauf: Index ${state.first} ist das gemerkte Minimum; prüfe Index ${state.index}.`, "");
  });
  $("new-simulation").addEventListener("click", () => {
    state = freshState();
    render();
    $("start").focus();
  });
  const dialog = $("hint-dialog");
  $("hint").addEventListener("click", () => dialog.showModal());
  $("close-hint").addEventListener("click", () => dialog.close());
  dialog.addEventListener("click", (event) => {
    const rect = dialog.getBoundingClientRect();
    if (event.target === dialog && (event.clientX < rect.left || event.clientX > rect.right ||
        event.clientY < rect.top || event.clientY > rect.bottom)) dialog.close();
  });
  dialog.addEventListener("close", () => $("hint").focus());
  render();
})();
