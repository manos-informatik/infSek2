"use strict";

const STORAGE_KEY = "infsek2-rekursion-fakultaet-v1";
const state = { n: 5, step: 0 };
const codeView = document.querySelector("#codeView");
const diagram = document.querySelector("#diagram");
const diagramWrap = document.querySelector("#diagramWrap");
const nextButton = document.querySelector("#next");
const previousButton = document.querySelector("#previous");
const firstButton = document.querySelector("#first");
const fullscreenButton = document.querySelector("#fullscreen");
const fullscreenFeedback = document.querySelector("#fullscreenFeedback");
const choiceButtons = [...document.querySelectorAll("[data-n]")];
const svgNamespace = "http://www.w3.org/2000/svg";

// Zeilen und Ablauf verwenden dieselben benannten Programmschritte.
const program = [
  { id: "setup", source: () => "void setup() {" },
  { id: "print", source: n => `  println(fact_rekursiv(${n}));  // Ausgabe: ${factorial(n)}` },
  { source: () => "}" },
  { source: () => "" },
  { id: "call", source: () => "long fact_rekursiv(int n) {" },
  { id: "condition", source: () => "  if (n == 1) {" },
  { id: "base", source: () => "    return 1;  // Abbruchbedingung" },
  { source: () => "  }" },
  { source: () => "" },
  { id: "recursive", source: () => "  return n * fact_rekursiv(n - 1);  // Selbstaufruf" },
  { source: () => "}" }
];

function factorial(n) {
  return n === 1 ? 1 : n * factorial(n - 1);
}

function buildSteps(n) {
  const steps = [];
  const frames = [];
  function record(line, active, message, output = null) {
    steps.push({ line, active, message, output, frames: frames.map(frame => ({ ...frame })) });
  }
  record("setup", null, "setup() beginnt.");
  record("print", null, `println wartet auf fact_rekursiv(${n}).`);
  function visit(value) {
    const frame = { n: value, phase: "entered", operand: null, result: null };
    const index = frames.push(frame) - 1;
    record("call", index, `Aufruf fact_rekursiv(${value}): n = ${value}.`);
    record("condition", index, `n == 1 ist ${value === 1 ? "wahr" : "falsch"}.`);
    if (value === 1) {
      frame.phase = "returned";
      frame.result = 1;
      record("base", index, "fact_rekursiv(1) gibt 1 zurück.");
      return 1;
    }
    frame.phase = "waiting";
    record("recursive", index, `${value} * fact_rekursiv(${value - 1}): der nächste Aufruf folgt.`);
    const operand = visit(value - 1);
    frame.operand = operand;
    frame.phase = "resuming";
    record("recursive", index, `fact_rekursiv(${value - 1}) gibt ${operand} zurück; weiter mit ${value} * ${operand}.`);
    frame.result = value * operand;
    frame.phase = "returned";
    record("recursive", index, `fact_rekursiv(${value}) gibt ${frame.result} zurück.`);
    return frame.result;
  }
  const result = visit(n);
  record("print", null, `println gibt ${result} aus.`, result);
  return steps;
}

let steps;

function persist() {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch { /* Ohne Speicher weiter nutzbar. */ }
}

function restore() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (saved && [1, 5].includes(saved.n)) {
      state.n = saved.n;
      const count = buildSteps(state.n).length;
      if (Number.isInteger(saved.step) && saved.step >= 0 && saved.step < count) state.step = saved.step;
    }
  } catch { /* Ungültigen oder gesperrten Speicher ignorieren. */ }
}

function syntaxLine(source) {
  const fragment = document.createDocumentFragment();
  const tokens = source.match(/\/\/.*|\b(?:void|long|int|if|return)\b|\b(?:setup|println|fact_rekursiv)\b|\b\d+\b|[^\w/]+|\w+|\//g) || [];
  for (const token of tokens) {
    const span = document.createElement("span");
    span.textContent = token;
    if (token.startsWith("//")) span.className = "tok-comment";
    else if (/^(void|long|int)$/.test(token)) span.className = "tok-type";
    else if (/^(if|return)$/.test(token)) span.className = "tok-keyword";
    else if (/^(setup|println|fact_rekursiv)$/.test(token)) span.className = "tok-function";
    else if (/^\d+$/.test(token)) span.className = "tok-number";
    fragment.append(span);
  }
  return fragment;
}

function renderCode() {
  const snapshot = steps[state.step];
  codeView.replaceChildren();
  program.forEach((line, index) => {
    const row = document.createElement("div");
    row.className = "ide-line";
    if (line.id && line.id === snapshot.line) {
      row.classList.add("is-active");
      row.setAttribute("aria-current", "step");
    }
    const gutter = document.createElement("span");
    gutter.className = "ide-gutter";
    gutter.textContent = index + 1;
    gutter.setAttribute("aria-hidden", "true");
    const source = document.createElement("span");
    source.className = "ide-code";
    source.append(syntaxLine(line.source(state.n)));
    row.append(gutter, source);
    codeView.append(row);
  });
}

function svgElement(tag, attributes = {}, text = "") {
  const element = document.createElementNS(svgNamespace, tag);
  for (const [key, value] of Object.entries(attributes)) element.setAttribute(key, value);
  if (text) element.textContent = text;
  return element;
}

function renderDiagram() {
  const snapshot = steps[state.step];
  const width = Math.max(280, diagramWrap.clientWidth);
  const compact = width < 620;
  const boxWidth = compact ? width - 72 : Math.min(370, width * 0.42);
  const startX = 24;
  const stepX = Math.min(140, (width - startX - boxWidth - 22) / 4);
  const stepY = compact ? 142 : 116;
  const boxHeight = 88;
  const startY = 62;
  const height = snapshot.frames.length ? startY + (snapshot.frames.length - 1) * stepY + boxHeight + 30 : 92;
  const position = index => ({ x: startX + stepX * index, y: startY + stepY * index });
  diagram.setAttribute("viewBox", `0 0 ${width} ${height}`);
  diagram.style.height = `${height}px`;
  diagram.replaceChildren();
  diagram.append(svgElement("title", { id: "diagramTitle" }, "Aufrufe und Rückgaben der Fakultät"));
  diagram.append(svgElement("desc", { id: "diagramDescription" }, snapshot.message));
  const defs = svgElement("defs");
  for (const [id, className] of [["call-arrow", "call-head"], ["return-arrow", "return-head"]]) {
    const marker = svgElement("marker", { id, viewBox: "0 0 10 10", refX: 9, refY: 5, markerWidth: 7, markerHeight: 7, orient: "auto-start-reverse" });
    marker.append(svgElement("path", { d: "M 0 0 L 10 5 L 0 10 z", class: className }));
    defs.append(marker);
  }
  diagram.append(defs);
  diagram.append(svgElement("text", { x: startX, y: 25, class: "diagram-label" }, `println(fact_rekursiv(${state.n}))`));
  if (snapshot.output !== null) {
    diagram.append(svgElement("text", { x: compact ? startX : width - 24, y: compact ? height - 3 : 25, class: "output-value", "text-anchor": compact ? "start" : "end" }, `Ausgabe: ${snapshot.output}`));
  }

  snapshot.frames.forEach((frame, index) => {
    const { x, y } = position(index);
    const active = snapshot.active === index;
    const group = svgElement("g", { class: `frame${active ? " is-active" : ""}${frame.result !== null ? " is-returned" : ""}`, "data-n": frame.n });
    group.append(svgElement("path", { d: `M ${x} ${y + boxHeight} l 12 12 h ${boxWidth} v ${-boxHeight} l -12 -12 Z`, class: "box-depth" }));
    group.append(svgElement("rect", { x, y, width: boxWidth, height: boxHeight, rx: 3, class: "box-front" }));
    group.append(svgElement("text", { x: x + 16, y: y + 28, class: "frame-title" }, `fact_rekursiv(${frame.n})`));
    group.append(svgElement("text", { x: x + boxWidth - 14, y: y + 27, "text-anchor": "end", class: "frame-n" }, `n = ${frame.n}`));
    let expression = "";
    if (frame.n === 1 && frame.result !== null) expression = "return 1";
    else if (frame.result !== null) expression = `return ${frame.result}`;
    else if (frame.operand !== null) expression = `return ${frame.n} * ${frame.operand}`;
    else if (frame.phase === "waiting") expression = `return ${frame.n} * fact_rekursiv(${frame.n - 1})`;
    if (expression) group.append(svgElement("text", { x: x + 16, y: y + 64, class: "frame-expression" }, expression));
    diagram.append(group);
    const expressionText = group.querySelector(".frame-expression");
    if (expressionText && expressionText.getComputedTextLength() > boxWidth - 32) {
      expressionText.setAttribute("textLength", boxWidth - 32);
      expressionText.setAttribute("lengthAdjust", "spacingAndGlyphs");
    }
  });

  if (snapshot.frames.length) {
    const first = position(0);
    diagram.append(svgElement("path", { d: `M ${first.x + boxWidth * 0.67} 34 V ${first.y - 3}`, class: "call-path", "marker-end": "url(#call-arrow)" }));
  }
  snapshot.frames.forEach((frame, index) => {
    const current = position(index);
    if (index > 0) {
      const parent = position(index - 1);
      const x = parent.x + boxWidth * 0.8;
      diagram.append(svgElement("path", { d: `M ${x} ${parent.y + boxHeight + 12} V ${current.y - 3}`, class: "call-path", "marker-end": "url(#call-arrow)" }));
    }
    // Rückgabepfeile erscheinen erst beim Empfangen im aufrufenden Rahmen.
    const received = index === 0 ? snapshot.output !== null : snapshot.frames[index - 1].operand !== null;
    if (received) {
      const target = index === 0 ? { x: startX + 4, y: 25 } : { x: position(index - 1).x + 5, y: position(index - 1).y + 61 };
      const fromX = current.x + 5;
      const fromY = current.y + 61;
      const laneX = index === 0 ? 9 : Math.max(9, target.x - 16);
      diagram.append(svgElement("path", { d: `M ${fromX} ${fromY} H ${laneX} V ${target.y} H ${target.x}`, class: "return-path", "marker-end": "url(#return-arrow)" }));
      if (index > 0) {
        const labelY = (fromY + target.y) / 2;
        diagram.append(svgElement("rect", { x: laneX - 8, y: labelY - 12, width: 36, height: 23, rx: 6, class: "return-label-bg" }));
        diagram.append(svgElement("text", { x: laneX + 10, y: labelY + 5, "text-anchor": "middle", class: "return-value" }, String(frame.result)));
      }
    }
  });
}

function render() {
  const snapshot = steps[state.step];
  renderCode();
  renderDiagram();
  choiceButtons.forEach(button => button.setAttribute("aria-pressed", String(Number(button.dataset.n) === state.n)));
  firstButton.disabled = state.step === 0;
  previousButton.disabled = state.step === 0;
  nextButton.disabled = state.step === steps.length - 1;
  document.querySelector("#stepCount").textContent = `${state.step + 1} / ${steps.length}`;
  const announcement = document.querySelector("#announcement");
  const text = `Schritt ${state.step + 1} von ${steps.length}. ${snapshot.message}`;
  if (announcement.textContent !== text) announcement.textContent = text;
}

function goTo(step) {
  state.step = Math.max(0, Math.min(steps.length - 1, step));
  persist();
  render();
}

fullscreenButton.addEventListener("click", async () => {
  fullscreenFeedback.hidden = true;
  try {
    if (document.fullscreenElement) {
      await document.exitFullscreen();
    } else {
      if (!document.fullscreenEnabled || !document.documentElement.requestFullscreen) {
        throw new Error("Vollbild nicht verfügbar");
      }
      await document.documentElement.requestFullscreen();
    }
  } catch {
    fullscreenFeedback.textContent = "Vollbild ist hier gesperrt. Erlaube Vollbild in der Logseq-Einbettung oder öffne die Seite separat.";
    const link = document.createElement("a");
    link.href = window.location.href;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.textContent = "Seite öffnen";
    fullscreenFeedback.append(" ", link);
    fullscreenFeedback.hidden = false;
  }
});

document.addEventListener("fullscreenchange", () => {
  const active = Boolean(document.fullscreenElement);
  fullscreenButton.textContent = active ? "Vollbild beenden" : "Vollbild";
  fullscreenButton.setAttribute("aria-pressed", String(active));
  fullscreenFeedback.hidden = true;
});

firstButton.addEventListener("click", () => goTo(0));
previousButton.addEventListener("click", () => goTo(state.step - 1));
nextButton.addEventListener("click", () => goTo(state.step + 1));
choiceButtons.forEach(button => button.addEventListener("click", () => {
  state.n = Number(button.dataset.n);
  state.step = 0;
  steps = buildSteps(state.n);
  persist();
  render();
}));

restore();
steps = buildSteps(state.n);
render();
new ResizeObserver(renderDiagram).observe(diagramWrap);
