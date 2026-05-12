(function () {
  "use strict";

  var Practice = window.NumberFormatPractice;
  var state = {
    task: null,
    taskNumber: 0,
    attempted: 0,
    correct: 0
  };
  var elements = {};

  document.addEventListener("DOMContentLoaded", init);

  function init() {
    elements.bitWidth = document.getElementById("bit-width");
    elements.representation = document.getElementById("representation");
    elements.operation = document.getElementById("operation");
    elements.newTaskButton = document.getElementById("new-task-button");
    elements.nextTaskButton = document.getElementById("next-task-button");
    elements.answerForm = document.getElementById("answer-form");
    elements.resultInput = document.getElementById("result-input");
    elements.overflowKind = document.getElementById("overflow-kind");
    elements.feedbackPanel = document.getElementById("feedback-panel");
    elements.taskKicker = document.getElementById("task-kicker");
    elements.taskBitWidth = document.getElementById("task-bit-width");
    elements.taskOperation = document.getElementById("task-operation");
    elements.taskRepresentation = document.getElementById("task-representation");
    elements.leftOperand = document.getElementById("left-operand");
    elements.rightOperand = document.getElementById("right-operand");
    elements.operatorSymbol = document.getElementById("operator-symbol");
    elements.attemptedCount = document.getElementById("attempted-count");
    elements.correctCount = document.getElementById("correct-count");

    elements.newTaskButton.addEventListener("click", createNewTask);
    elements.nextTaskButton.addEventListener("click", createNewTask);
    elements.answerForm.addEventListener("submit", handleSubmit);
    elements.bitWidth.addEventListener("change", createNewTask);
    elements.representation.addEventListener("change", createNewTask);
    elements.operation.addEventListener("change", createNewTask);

    Array.prototype.slice.call(document.querySelectorAll("input[name='overflowStatus']")).forEach(function (input) {
      input.addEventListener("change", syncOverflowKindState);
    });

    createNewTask();
  }

  function getSettings() {
    return {
      bitWidth: Number(elements.bitWidth.value),
      representation: elements.representation.value,
      operation: elements.operation.value
    };
  }

  function createNewTask() {
    state.task = Practice.generateTask(getSettings());
    state.taskNumber += 1;
    renderTask();
    resetAnswer();
  }

  function renderTask() {
    var task = state.task;

    elements.taskKicker.textContent = "Aufgabe " + state.taskNumber;
    elements.taskBitWidth.textContent = task.bitWidth + " Bit";
    elements.taskOperation.textContent = Practice.getOperationLabel(task.operation);
    elements.taskRepresentation.textContent = Practice.getRepresentationLabel(task.representation);
    elements.leftOperand.textContent = task.leftBits;
    elements.rightOperand.textContent = task.rightBits;
    elements.operatorSymbol.textContent = Practice.getOperatorSymbol(task.operation);
    elements.resultInput.placeholder = "z. B. " + "0".repeat(Math.max(0, task.bitWidth - 2)) + "11";
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
      state.attempted += 1;
      if (result.correct) {
        state.correct += 1;
      }
      renderStats();
    }

    renderFeedback(result);
  }

  function renderStats() {
    elements.attemptedCount.textContent = String(state.attempted);
    elements.correctCount.textContent = String(state.correct);
  }

  function hideFeedback() {
    elements.feedbackPanel.hidden = true;
    elements.feedbackPanel.textContent = "";
    elements.feedbackPanel.className = "feedback-panel practice-feedback";
  }

  function renderFeedback(result) {
    var label = document.createElement("span");
    var message = document.createElement("p");

    elements.feedbackPanel.hidden = false;
    elements.feedbackPanel.textContent = "";
    elements.feedbackPanel.className = "feedback-panel practice-feedback";

    if (!result.valid) {
      elements.feedbackPanel.classList.add("is-warning");
      label.className = "feedback-label";
      label.textContent = "Eingabe pruefen";
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

    message.textContent = result.expected.reason;
    elements.feedbackPanel.appendChild(message);
  }

  function createFacts(result) {
    var facts = document.createElement("div");

    facts.className = "feedback-facts";
    facts.appendChild(createFact("Ergebnis", result.resultCorrect ? "richtig" : "falsch", false));
    facts.appendChild(createFact("Overflow", result.overflowCorrect ? "richtig" : "falsch", false));
    facts.appendChild(createFact("Korrektes Ergebnis", result.expected.resultBits, true));
    facts.appendChild(createFact("Korrekte Einschaetzung", Practice.getOverflowLabel(result.expected.overflowKind), false));

    return facts;
  }

  function createFact(labelText, valueText, isCode) {
    var fact = document.createElement("div");
    var label = document.createElement("span");
    var value = document.createElement(isCode ? "code" : "strong");

    fact.className = "feedback-fact";
    label.textContent = labelText;
    value.textContent = valueText;
    fact.appendChild(label);
    fact.appendChild(value);

    return fact;
  }
})();
