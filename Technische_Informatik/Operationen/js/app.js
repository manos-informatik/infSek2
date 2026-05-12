(function () {
  "use strict";

  var Practice = window.NumberFormatPractice;
  var state = {
    task: null,
    taskNumber: 0,
    attempted: 0,
    score: 0,
    currentTaskAttempted: false
  };
  var elements = {};

  document.addEventListener("DOMContentLoaded", init);

  function init() {
    elements.bitWidth = document.getElementById("bit-width");
    elements.newTaskButton = document.getElementById("new-task-button");
    elements.nextTaskButton = document.getElementById("next-task-button");
    elements.answerForm = document.getElementById("answer-form");
    elements.submitButton = document.getElementById("submit-button");
    elements.resultInput = document.getElementById("result-input");
    elements.overflowKind = document.getElementById("overflow-kind");
    elements.feedbackPanel = document.getElementById("feedback-panel");
    elements.taskKicker = document.getElementById("task-kicker");
    elements.taskBitWidth = document.getElementById("task-bit-width");
    elements.taskOperation = document.getElementById("task-operation");
    elements.taskRepresentation = document.getElementById("task-representation");
    elements.representationCallout = document.getElementById("representation-callout");
    elements.representationCalloutLabel = document.getElementById("representation-callout-label");
    elements.leftOperand = document.getElementById("left-operand");
    elements.rightOperand = document.getElementById("right-operand");
    elements.operatorSymbol = document.getElementById("operator-symbol");
    elements.attemptedCount = document.getElementById("attempted-count");
    elements.scoreCount = document.getElementById("score-count");

    elements.newTaskButton.addEventListener("click", createNewTask);
    elements.nextTaskButton.addEventListener("click", createNewTask);
    elements.answerForm.addEventListener("submit", handleSubmit);

    Array.prototype.slice.call(document.querySelectorAll("input[name='overflowStatus']")).forEach(function (input) {
      input.addEventListener("change", syncOverflowKindState);
    });

    createNewTask();
  }

  function getSettings() {
    return {
      bitWidth: Number(elements.bitWidth.value)
    };
  }

  function createNewTask() {
    state.task = Practice.generateTask(getSettings());
    state.taskNumber += 1;
    state.currentTaskAttempted = false;
    renderTask();
    resetAnswer();
    setAnswerFieldsLocked(false);
    setTaskButtonsEnabled(false);
  }

  function renderTask() {
    var task = state.task;

    elements.taskKicker.textContent = "Aufgabe " + state.taskNumber;
    elements.taskBitWidth.textContent = task.bitWidth + " Bit";
    elements.taskOperation.textContent = Practice.getOperationLabel(task.operation);
    elements.taskRepresentation.textContent = Practice.getRepresentationLabel(task.representation);
    elements.taskRepresentation.className = "tag representation-tag " + getRepresentationClass(task.representation);
    elements.representationCallout.className = "representation-callout " + getRepresentationClass(task.representation);
    elements.representationCalloutLabel.textContent = Practice.getRepresentationLabel(task.representation);
    elements.leftOperand.textContent = task.leftBits;
    elements.rightOperand.textContent = task.rightBits;
    elements.operatorSymbol.textContent = Practice.getOperatorSymbol(task.operation);
    elements.resultInput.placeholder = "z. B. " + "0".repeat(Math.max(0, task.bitWidth - 2)) + "11";
  }

  function getRepresentationClass(representation) {
    return representation === Practice.REPRESENTATION.TWOS ? "is-twos" : "is-unsigned";
  }

  function resetAnswer() {
    elements.resultInput.value = "";
    elements.overflowKind.value = "";

    Array.prototype.slice.call(document.querySelectorAll("input[name='overflowStatus']")).forEach(function (input) {
      input.checked = false;
    });

    syncOverflowKindState();
    hideFeedback();
    elements.resultInput.focus();
  }

  function syncOverflowKindState() {
    var selected = getSelectedOverflowStatus();
    var hasOverflow = selected === "yes";

    elements.overflowKind.disabled = !hasOverflow;
    if (!hasOverflow) {
      elements.overflowKind.value = "";
    }
  }

  function getSelectedOverflowStatus() {
    var checked = document.querySelector("input[name='overflowStatus']:checked");
    return checked ? checked.value : "";
  }

  function collectAnswer() {
    return {
      resultBits: elements.resultInput.value,
      overflowStatus: getSelectedOverflowStatus(),
      overflowKind: elements.overflowKind.value
    };
  }

  function handleSubmit(event) {
    var result;

    event.preventDefault();
    result = Practice.evaluateStudentAnswer(state.task, collectAnswer());

    if (result.valid) {
      if (!state.currentTaskAttempted) {
        state.attempted += 1;
        state.score += result.earnedPoints;
        state.currentTaskAttempted = true;
      }

      renderStats();
      setAnswerFieldsLocked(true);
      setTaskButtonsEnabled(true);
    }

    renderFeedback(result);

    if (result.valid && result.correct) {
      showCelebration();
    }
  }

  function renderStats() {
    elements.attemptedCount.textContent = String(state.attempted);
    elements.scoreCount.textContent = String(state.score);
  }

  function setTaskButtonsEnabled(isEnabled) {
    elements.newTaskButton.disabled = !isEnabled;
    elements.nextTaskButton.disabled = !isEnabled;
  }

  function setAnswerFieldsLocked(isLocked) {
    elements.resultInput.disabled = isLocked;
    elements.overflowKind.disabled = isLocked || getSelectedOverflowStatus() !== "yes";
    elements.submitButton.disabled = isLocked;

    Array.prototype.slice.call(document.querySelectorAll("input[name='overflowStatus']")).forEach(function (input) {
      input.disabled = isLocked;
    });
  }

  function hideFeedback() {
    elements.feedbackPanel.hidden = true;
    elements.feedbackPanel.textContent = "";
    elements.feedbackPanel.className = "feedback-panel practice-feedback";
  }

  function renderFeedback(result) {
    var label = document.createElement("span");

    elements.feedbackPanel.hidden = false;
    elements.feedbackPanel.textContent = "";
    elements.feedbackPanel.className = "feedback-panel practice-feedback";

    if (!result.valid) {
      elements.feedbackPanel.classList.add("is-warning");
      label.className = "feedback-label";
      label.textContent = "Eingabe pruefen";
      var message = document.createElement("p");
      message.textContent = result.message;
      elements.feedbackPanel.appendChild(label);
      elements.feedbackPanel.appendChild(message);
      return;
    }

    elements.feedbackPanel.classList.add(result.correct ? "is-correct" : "is-incorrect");
    label.className = "feedback-label";
    label.textContent = result.correct ? "Richtig" : "Noch nicht richtig";
    elements.feedbackPanel.appendChild(label);
    elements.feedbackPanel.appendChild(createFacts(result));

    if (!result.correct) {
      elements.feedbackPanel.appendChild(createMistakeNotes(result));
    }

    elements.feedbackPanel.appendChild(createReasonBox(result.expected.reason));
  }

  function createFacts(result) {
    var facts = document.createElement("div");

    facts.className = "feedback-facts";
    facts.appendChild(createFact("Punkte", result.earnedPoints + " von " + result.maxPoints, false, result.correct ? "is-correct" : "is-warning"));
    facts.appendChild(createFact("Ergebnis", result.resultCorrect ? "richtig" : "falsch", false, result.resultCorrect ? "is-correct" : "is-incorrect"));
    facts.appendChild(createFact("Overflow erkannt", result.overflowStatusCorrect ? "richtig" : "falsch", false, result.overflowStatusCorrect ? "is-correct" : "is-incorrect"));
    if (result.overflowKindApplies) {
      facts.appendChild(createFact("Overflow-Art", result.overflowKindCorrect ? "richtig" : "falsch", false, result.overflowKindCorrect ? "is-correct" : "is-incorrect"));
    }
    facts.appendChild(createFact("Korrektes Ergebnis", result.expected.resultBits, true, "is-answer"));
    facts.appendChild(createFact("Korrekte Einschaetzung", Practice.getOverflowLabel(result.expected.overflowKind), false, "is-answer"));

    return facts;
  }

  function createMistakeNotes(result) {
    var panel = document.createElement("section");
    var heading = document.createElement("h3");
    var list = document.createElement("ul");

    panel.className = "mistake-panel";
    heading.textContent = "Fehlerhinweise";
    list.className = "mistake-list";
    panel.appendChild(heading);
    panel.appendChild(list);

    if (!result.resultCorrect) {
      appendMistake(list, "Ergebnis: Das Bitmuster muss exakt " + result.expected.bitWidth + " Stellen haben und nach dem Abschneiden " + result.expected.resultBits + " lauten.");
    }

    if (!result.overflowStatusCorrect) {
      appendMistake(list, result.expected.overflow
        ? "Overflow: Hier liegt ein Overflow vor, weil das mathematische Ergebnis nicht in den darstellbaren Bereich passt."
        : "Overflow: Hier liegt kein Overflow vor, weil das mathematische Ergebnis im darstellbaren Bereich bleibt.");
    }

    if (result.overflowKindApplies && !result.overflowKindCorrect) {
      appendMistake(list, "Overflow-Art: Passend ist \"" + Practice.getOverflowLabel(result.expected.overflowKind) + "\".");
    }

    return panel;
  }

  function appendMistake(list, text) {
    var item = document.createElement("li");
    item.textContent = text;
    list.appendChild(item);
  }

  function createReasonBox(reasonText) {
    var panel = document.createElement("section");
    var heading = document.createElement("h3");
    var text = document.createElement("p");

    panel.className = "reason-panel";
    heading.textContent = "Begruendung";
    text.textContent = reasonText;
    panel.appendChild(heading);
    panel.appendChild(text);

    return panel;
  }

  function createFact(labelText, valueText, isCode, modifierClass) {
    var fact = document.createElement("div");
    var label = document.createElement("span");
    var value = document.createElement(isCode ? "code" : "strong");

    fact.className = "feedback-fact" + (modifierClass ? " " + modifierClass : "");
    label.textContent = labelText;
    value.textContent = valueText;
    fact.appendChild(label);
    fact.appendChild(value);

    return fact;
  }

  function showCelebration() {
    var oldCelebration = document.querySelector(".celebration");
    var celebration = document.createElement("div");
    var label = document.createElement("strong");
    var index;
    var particle;

    if (oldCelebration) {
      oldCelebration.remove();
    }

    celebration.className = "celebration";
    celebration.setAttribute("aria-live", "polite");
    label.textContent = "Alles richtig!";
    celebration.appendChild(label);

    for (index = 0; index < 18; index += 1) {
      particle = document.createElement("span");
      particle.style.setProperty("--angle", (index * 20) + "deg");
      particle.style.setProperty("--distance", (112 + (index % 4) * 20) + "px");
      particle.style.setProperty("--delay", (index % 6) * 0.035 + "s");
      celebration.appendChild(particle);
    }

    document.body.appendChild(celebration);

    window.setTimeout(function () {
      celebration.remove();
    }, 1400);
  }
})();
