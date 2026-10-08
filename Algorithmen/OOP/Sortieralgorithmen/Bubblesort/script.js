(() => {
  "use strict";
  const STORAGE_KEY = "infsek2-bubblesort-v1";
  const SIZE = 8;
  const $ = (id) => document.getElementById(id);
  const actions = [$("swap"), $("next"), $("restart-pass"), $("mark")];

  function freshState() {
    return {
      values: Array.from({ length: SIZE }, () => Math.floor(Math.random() * 90) + 10),
      phase: "ready", index: 0, end: SIZE - 1, round: 0, comparisons: 0, swaps: 0,
      feedback: "Die Liste ist bereit.", tone: "",
    };
  }

  function validState(candidate) {
    if (!candidate || !Array.isArray(candidate.values) || candidate.values.length !== SIZE ||
        !candidate.values.every((value) => Number.isInteger(value) && value >= 10 && value <= 99) ||
        !["ready", "compare", "mark", "restart", "last", "done"].includes(candidate.phase) ||
        ![candidate.index, candidate.end, candidate.round, candidate.comparisons, candidate.swaps]
          .every(Number.isInteger) || candidate.end < -1 || candidate.end >= SIZE ||
        candidate.index < 0 || candidate.index >= SIZE || candidate.round < 0 || candidate.round > 7 ||
        candidate.comparisons < 0 || candidate.comparisons > 28 || candidate.swaps < 0 ||
        candidate.swaps > candidate.comparisons + 1 || typeof candidate.feedback !== "string" ||
        !["", "success", "error"].includes(candidate.tone)) return false;
    const { phase, end, index, values } = candidate;
    if (phase === "ready") return end === 7 && index === 0 && candidate.round === 0 &&
      candidate.comparisons === 0 && candidate.swaps === 0;
    if (candidate.round === 0 || (phase === "compare" && (end < 1 || index >= end)) ||
        (phase === "mark" && (end < 1 || index !== end - 1 || values[index] > values[end])) ||
        (phase === "restart" && (end < 1 || index !== end)) ||
        (phase === "last" && (end !== 0 || index !== 0)) ||
        (phase === "done" && (end !== -1 || index !== 0))) return false;
    // Every green element must be in its final position, including duplicate values.
    const ordered = [...values].sort((a, b) => a - b);
    return values.every((value, position) => position <= end || value === ordered[position]);
  }

  function restore() {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
      if (validState(saved)) return saved;
    } catch { /* A blocked or damaged storage must not prevent the simulation. */ }
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
    $("round").textContent = ready ? "Bereit" : done ? "Fertig" : `Durchlauf ${state.round} / 7`;
    $("sorted-count").textContent = `Einsortiert: ${SIZE - 1 - state.end} / ${SIZE}`;
    $("comparisons").textContent = `Vergleiche: ${state.comparisons}`;
    $("swaps").textContent = `Tauschvorgänge: ${state.swaps}`;
    $("instruction").textContent = ready
      ? "Würfle bei Bedarf eine neue Liste und drücke auf „Start“."
      : done ? "Geschafft! Alle acht Elemente sind aufsteigend sortiert."
        : "Vergleiche das hervorgehobene Paar und wähle deine nächste Aktion.";
    $("number-list").replaceChildren(...state.values.map((value, index) => {
      const tile = document.createElement("li");
      const sorted = index > state.end;
      const current = state.phase === "compare" && (index === state.index || index === state.index + 1);
      const pending = (state.phase === "mark" || state.phase === "last") && index === state.end;
      tile.className = `number-tile${sorted ? " is-sorted" : ""}${current ? " is-current" : ""}${pending ? " is-pending" : ""}`;
      tile.setAttribute("aria-label", `Index ${index}: ${value}${sorted ? ", einsortiert" : current ? ", aktuelles Vergleichspaar" : ""}`);
      const label = document.createElement("span");
      label.className = "tile-index";
      label.textContent = index;
      const number = document.createElement("span");
      number.className = "tile-value";
      number.textContent = value;
      const marker = document.createElement("span");
      marker.className = "tile-marker";
      marker.setAttribute("aria-hidden", "true");
      marker.textContent = sorted ? "✓" : current ? "↑" : pending ? "?" : "";
      tile.append(label, number, marker);
      return tile;
    }));
    const captions = {
      ready: "Indizes 0–7",
      compare: `Aktuelles Paar: Index ${state.index} und ${state.index + 1}`,
      mark: "Durchlauf beendet",
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
    state = freshState();
    respond("Neue Liste gewürfelt – starte, wenn du bereit bist.", "");
  });
  $("start").addEventListener("click", () => {
    if (state.phase !== "ready") return;
    state.phase = "compare";
    state.round = 1;
    respond("Los geht’s: Vergleiche die Zahlen an Index 0 und 1.", "");
    $("swap").focus();
  });
  $("swap").addEventListener("click", () => {
    if (state.phase !== "compare") return reject("Hier gibt es kein Vergleichspaar zum Tauschen.");
    const i = state.index;
    if (state.values[i] <= state.values[i + 1]) return reject("Die linke Zahl ist nicht größer – dieses Paar darf nicht getauscht werden.");
    [state.values[i], state.values[i + 1]] = [state.values[i + 1], state.values[i]];
    state.swaps += 1;
    respond("Richtig getauscht – schließe diesen Vergleich mit „Weiter“ ab.");
  });
  $("next").addEventListener("click", () => {
    if (state.phase === "mark") return reject("Der Durchlauf ist beendet – markiere zuerst das letzte Element als einsortiert.");
    if (state.phase === "restart") return reject("Das letzte Element ist markiert – beginne den nächsten Durchlauf bei Index 0.");
    if (state.phase === "last") return reject("Es bleibt kein Vergleichspaar – markiere das Element an Index 0 als einsortiert.");
    if (state.phase !== "compare") return;
    if (state.values[state.index] > state.values[state.index + 1]) return reject("Die linke Zahl ist größer – tausche die beiden Zahlen, bevor du weitergehst.");
    state.comparisons += 1;
    if (state.index === state.end - 1) {
      state.phase = "mark";
      respond("Der letzte Vergleich ist abgeschlossen – welches Element ist jetzt sicher einsortiert?");
    } else {
      state.index += 1;
      respond(`Vergleich abgeschlossen – jetzt sind Index ${state.index} und ${state.index + 1} an der Reihe.`);
    }
  });
  $("mark").addEventListener("click", () => {
    if (state.phase === "restart") return reject("Dieses Element ist schon markiert – springe jetzt zu Index 0.");
    if (state.phase !== "mark" && state.phase !== "last") return reject("Noch nicht: Schließe erst alle Vergleiche dieses Durchlaufs mit „Weiter“ ab.");
    const markedIndex = state.end;
    state.end -= 1;
    if (state.end === -1) {
      state.phase = "done";
      respond(`Geschafft! Alle acht Elemente sind einsortiert – ${state.comparisons} Vergleiche und ${state.swaps} Tauschvorgänge.`);
      $("new-simulation").focus();
    } else if (state.end === 0) {
      state.index = 0;
      state.phase = "last";
      respond("Index 1 ist einsortiert – markiere jetzt auch das letzte verbliebene Element an Index 0.");
    } else {
      state.phase = "restart";
      respond(`Index ${markedIndex} ist einsortiert und wird nicht mehr verglichen.`);
    }
  });
  $("restart-pass").addEventListener("click", () => {
    if (state.phase === "mark") return reject("Markiere zuerst das letzte Element als einsortiert; erst dann darfst du zu Index 0 springen.");
    if (state.phase === "last") return reject("Es bleibt nur Index 0 – markiere dieses Element, um die Simulation abzuschließen.");
    if (state.phase !== "restart") return reject("Schließe den aktuellen Durchlauf ab und markiere sein letztes Element, bevor du zurückspringst.");
    state.index = 0;
    state.round += 1;
    state.phase = "compare";
    respond(`Durchlauf ${state.round} beginnt bei Index 0; die grünen Elemente bleiben unverändert.`, "");
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
