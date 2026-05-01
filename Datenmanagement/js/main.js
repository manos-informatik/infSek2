(function () {
  "use strict";

  var storage = window.DataManagementStorage;
  var checkers = window.DataManagementCheckers;
  var topicState = null;

  var TOPIC_META = {
    sql: {
      title: "SQL",
      description: "Abfragen, Auswertung, Tabellenentwurf und typische Fehler.",
      href: "sql.html"
    },
    eerm: {
      title: "eERM",
      description: "Modellierung, Kardinalitaeten, relationale Ueberfuehrung und Fehlersuche.",
      href: "eerm.html"
    }
  };

  document.addEventListener("DOMContentLoaded", init);

  function init() {
    var page = document.body.getAttribute("data-page");
    if (page === "home") {
      renderHomePage();
      return;
    }

    if (page === "topic") {
      initTopicPage(document.body.getAttribute("data-topic"));
    }
  }

  function getTasks(topic) {
    if (topic === "sql") {
      return Array.isArray(window.DataManagementTasksSQL) ? window.DataManagementTasksSQL : [];
    }
    if (topic === "eerm") {
      return Array.isArray(window.DataManagementTasksEERM) ? window.DataManagementTasksEERM : [];
    }
    return [];
  }

  function renderHomePage() {
    var grid = document.getElementById("topic-grid");

    Object.keys(TOPIC_META).forEach(function (topicKey) {
      var meta = TOPIC_META[topicKey];
      var tasks = getTasks(topicKey);
      var stats = buildStats(tasks, topicKey);
      var card = document.createElement("a");
      var solvedPercent = tasks.length ? Math.round((stats.correct / tasks.length) * 100) : 0;

      card.className = "topic-tile";
      card.href = meta.href;
      card.innerHTML = [
        "<div>",
        "<h2>" + escapeHtml(meta.title) + "</h2>",
        "<p>" + escapeHtml(meta.description) + "</p>",
        "</div>",
        "<div class=\"progress-line\">",
        "<div class=\"progress-track\" aria-hidden=\"true\"><span style=\"width:" + solvedPercent + "%\"></span></div>",
        "<p>" + stats.attempted + " von " + tasks.length + " bearbeitet</p>",
        "</div>",
        "<div class=\"topic-stats\">",
        renderMetric(stats.correct, "korrekt"),
        renderMetric(stats.unsure, "unsicher"),
        renderMetric(tasks.length, "Aufgaben"),
        "</div>"
      ].join("");
      grid.appendChild(card);
    });
  }

  function initTopicPage(topic) {
    topicState = {
      topic: topic,
      tasks: getTasks(topic)
    };

    renderTopicPage();
  }

  function renderTopicPage(anchorTaskId) {
    renderOverviewPanels();
    renderTaskList();

    if (anchorTaskId) {
      requestAnimationFrame(function () {
        var anchor = document.getElementById("task-" + anchorTaskId);
        if (anchor) {
          anchor.scrollIntoView({ block: "nearest" });
        }
      });
    }
  }

  function renderOverviewPanels() {
    var tasks = topicState.tasks;
    var topic = topicState.topic;
    var stats = buildStats(tasks, topic);
    var overall = document.getElementById("overall-progress");

    overall.innerHTML = [
      "<div class=\"panel-heading\">",
      "<h2>Fortschritt</h2>",
      "</div>",
      "<div class=\"summary-metrics\">",
      renderMetric(stats.attempted, "bearbeitet"),
      renderMetric(stats.correct, "korrekt"),
      renderMetric(stats.unsure, "unsicher"),
      renderMetric(tasks.length, "gesamt"),
      "</div>",
      "<div class=\"progress-line\">",
      "<div class=\"progress-track\" aria-hidden=\"true\"><span style=\"width:" + (tasks.length ? Math.round((stats.correct / tasks.length) * 100) : 0) + "%\"></span></div>",
      "</div>"
    ].join("");
  }

  function renderTaskList() {
    var taskList = document.getElementById("task-list");
    var emptyState = document.getElementById("empty-state");
    var filteredTasks = topicState.tasks;

    taskList.innerHTML = "";

    if (!filteredTasks.length) {
      emptyState.hidden = false;
      return;
    }

    emptyState.hidden = true;

    filteredTasks.forEach(function (task) {
      taskList.appendChild(createTaskCard(task));
    });
  }

  function createTaskCard(task) {
    var taskStateData = getTaskState(task.id);
    var card = document.createElement("article");
    var status = getStatusMeta(taskStateData);

    card.className = "task-card";
    card.id = "task-" + task.id;
    card.innerHTML = [
      "<header class=\"task-card-header\">",
      "<div class=\"task-title-block\">",
      "<p class=\"eyebrow\">" + escapeHtml(task.id) + "</p>",
      "<h2>" + escapeHtml(task.title) + "</h2>",
      "<div class=\"badge-row\">",
      "<span class=\"tag\">" + escapeHtml(task.theme) + "</span>",
      "<span class=\"tag\">" + escapeHtml(task.difficulty) + "</span>",
      "<span class=\"status-tag " + status.className + "\">" + escapeHtml(status.label) + "</span>",
      "</div>",
      "</div>",
      "</header>",
      renderSections(task.sections || []),
      "<div class=\"response-panel\">",
      "<div class=\"panel-heading\">",
      "<h3>Aufgabe</h3>",
      "<p>" + escapeHtml(task.prompt) + "</p>",
      "</div>",
      renderAnswerControls(task, taskStateData.response),
      "</div>",
      "<div class=\"task-actions\">",
      "<button class=\"button-primary\" type=\"button\" data-action=\"check\">Ueberpruefen</button>",
      "<button class=\"button-secondary\" type=\"button\" data-action=\"hint\"" + (taskStateData.hintLevel >= task.hints.length ? " disabled" : "") + ">" + escapeHtml(getHintButtonLabel(task, taskStateData)) + "</button>",
      "<button class=\"button-ghost\" type=\"button\" data-action=\"solution\"" + (taskStateData.modelShown ? " disabled" : "") + ">" + (taskStateData.modelShown ? "Musterloesung sichtbar" : "Musterloesung anzeigen") + "</button>",
      "</div>",
      renderHints(task, taskStateData),
      renderFeedback(task, taskStateData),
      renderSolution(task, taskStateData),
      renderConfidence(task, taskStateData),
      ""
    ].join("");

    attachTaskEvents(card, task);
    return card;
  }

  function attachTaskEvents(card, task) {
    var topic = topicState.topic;
    var inputElements = card.querySelectorAll("input, textarea, select");

    inputElements.forEach(function (element) {
      if (task.type === "text" && element.tagName === "TEXTAREA") {
        element.addEventListener("input", function () {
          saveDraft(task, topic, collectResponse(card, task));
        });
      }

      element.addEventListener("change", function () {
        if (element.name.indexOf("confidence-") === 0) {
          storage.updateTask(topic, task.id, {
            confidence: element.value
          });
          renderTopicPage(task.id);
          return;
        }

        storage.updateTask(topic, task.id, {
          response: collectResponse(card, task),
          checked: false,
          correct: false,
          lastOutcome: null,
          message: ""
        });
      });
    });

    card.querySelector("[data-action='check']").addEventListener("click", function () {
      var response = collectResponse(card, task);
      var message = getIncompleteMessage(task, response);

      if (message) {
        storage.updateTask(topic, task.id, {
          response: response,
          checked: false,
          correct: false,
          lastOutcome: "warning",
          message: message
        });
        renderTopicPage(task.id);
        return;
      }

      var result = checkers.evaluate(task, response);
      storage.updateTask(topic, task.id, {
        response: response,
        attempted: true,
        checked: true,
        correct: result.correct,
        lastOutcome: result.correct ? "correct" : "incorrect",
        message: ""
      });
      renderTopicPage(task.id);
    });

    card.querySelector("[data-action='hint']").addEventListener("click", function () {
      var currentState = getTaskState(task.id);
      storage.updateTask(topic, task.id, {
        hintLevel: Math.min(currentState.hintLevel + 1, task.hints.length)
      });
      renderTopicPage(task.id);
    });

    card.querySelector("[data-action='solution']").addEventListener("click", function () {
      storage.updateTask(topic, task.id, {
        modelShown: true
      });
      renderTopicPage(task.id);
    });
  }

  function saveDraft(task, topic, response) {
    storage.updateTask(topic, task.id, {
      response: response,
      message: ""
    });
  }

  function renderSections(sections) {
    if (!sections.length) {
      return "";
    }

    return [
      "<div class=\"task-sections\">",
      sections.map(function (section) {
        return [
          "<section class=\"material-block\">",
          "<h3>" + escapeHtml(section.title) + "</h3>",
          renderSectionContent(section),
          "</section>"
        ].join("");
      }).join(""),
      "</div>"
    ].join("");
  }

  function renderSectionContent(section) {
    if (section.type === "code") {
      return "<pre><code>" + escapeHtml(section.content) + "</code></pre>";
    }
    return renderTextBlock(section.content);
  }

  function hashString(value) {
    var hash = 0;
    var index;

    for (index = 0; index < value.length; index += 1) {
      hash = ((hash * 31) + value.charCodeAt(index)) >>> 0;
    }

    return hash;
  }

  function rotateArray(values, offset) {
    if (!values.length) {
      return [];
    }

    var normalizedOffset = offset % values.length;
    return values.slice(normalizedOffset).concat(values.slice(0, normalizedOffset));
  }

  function isSameItemOrder(left, right) {
    if (left.length !== right.length) {
      return false;
    }

    return left.every(function (item, index) {
      return item.value === right[index].value;
    });
  }

  function getStableOrderedItems(items, seed) {
    var ordered = (items || []).map(function (item, index) {
      return {
        item: item,
        index: index,
        weight: hashString(seed + "::" + (item.value || item.id || index))
      };
    }).sort(function (left, right) {
      if (left.weight !== right.weight) {
        return left.weight - right.weight;
      }
      return left.index - right.index;
    }).map(function (entry) {
      return entry.item;
    });

    if (isSameItemOrder(ordered, items) && ordered.length > 1) {
      return rotateArray(ordered, 1);
    }

    return ordered;
  }

  function getChoiceOptions(task) {
    var ordered = getStableOrderedItems(task.options || [], task.id + "::choice");
    var correctOptions = task.validation && task.validation.correctOptions ? task.validation.correctOptions : [];
    var correctIndex;
    var swapIndex;

    if (task.type === "single" && ordered.length > 1) {
      correctIndex = ordered.findIndex(function (option) {
        return option.value === task.validation.correctOption;
      });

      if (correctIndex === 0) {
        swapIndex = Math.floor(ordered.length / 2);
        ordered = ordered.slice();
        ordered[0] = ordered[swapIndex];
        ordered[swapIndex] = task.options.find(function (option) {
          return option.value === task.validation.correctOption;
        }) || ordered[swapIndex];
      }
    }

    if (task.type === "multi" && ordered.length > 1 && correctOptions.indexOf(ordered[0].value) !== -1) {
      swapIndex = ordered.findIndex(function (option) {
        return correctOptions.indexOf(option.value) === -1;
      });

      if (swapIndex > 0) {
        ordered = ordered.slice();
        var firstOption = ordered[0];
        ordered[0] = ordered[swapIndex];
        ordered[swapIndex] = firstOption;
      }
    }

    return ordered;
  }

  function getMatchOptions(task) {
    if (task.fixedOptionOrder) {
      return (task.matchOptions || []).slice();
    }

    return getStableOrderedItems(task.matchOptions || [], task.id + "::match");
  }

  function renderMatchControls(task, response) {
    var matchOptions = getMatchOptions(task);

    if (task.layout === "cloze") {
      return [
        "<fieldset class=\"answer-fieldset\">",
        "<legend class=\"answer-label\">Lueckentext</legend>",
        "<div class=\"cloze-list\">",
        (task.rows || []).map(function (row) {
          return [
            "<label class=\"cloze-row\">",
            "<span class=\"cloze-text\">" + escapeHtml(row.before) + "</span>",
            "<select class=\"cloze-select\" data-match-row=\"" + escapeHtml(row.id) + "\">",
            "<option value=\"\">Begriff ausw&auml;hlen</option>",
            matchOptions.map(function (option) {
              var selected = response && response[row.id] === option.value ? " selected" : "";
              return "<option value=\"" + escapeHtml(option.value) + "\"" + selected + ">" + escapeHtml(option.label) + "</option>";
            }).join(""),
            "</select>",
            row.after ? "<span class=\"cloze-text\">" + escapeHtml(row.after) + "</span>" : "",
            "</label>"
          ].join("");
        }).join(""),
        "</div>",
        "</fieldset>"
      ].join("");
    }

    return [
      "<fieldset class=\"answer-fieldset\">",
      "<legend class=\"answer-label\">Zuordnung</legend>",
      "<div class=\"match-list\">",
      (task.rows || []).map(function (row) {
        return [
          "<label class=\"match-row\">",
          "<span>" + escapeHtml(row.label) + "</span>",
          "<select data-match-row=\"" + escapeHtml(row.id) + "\">",
          "<option value=\"\">Bitte ausw&auml;hlen</option>",
          matchOptions.map(function (option) {
            var selected = response && response[row.id] === option.value ? " selected" : "";
            return "<option value=\"" + escapeHtml(option.value) + "\"" + selected + ">" + escapeHtml(option.label) + "</option>";
          }).join(""),
          "</select>",
          "</label>"
        ].join("");
      }).join(""),
      "</div>",
      "</fieldset>"
    ].join("");
  }

  function renderAnswerControls(task, response) {
    if (task.type === "text") {
      return [
        "<label class=\"answer-fieldset\" for=\"answer-" + escapeHtml(task.id) + "\">",
        "<span class=\"answer-label\">" + escapeHtml(task.inputLabel || "Antwort") + "</span>",
        "<textarea id=\"answer-" + escapeHtml(task.id) + "\" placeholder=\"Antwort eingeben\">" + escapeHtml(String(response || "")) + "</textarea>",
        "</label>"
      ].join("");
    }

    if (task.type === "single" || task.type === "multi") {
      var inputType = task.type === "single" ? "radio" : "checkbox";
      var choiceOptions = getChoiceOptions(task);
      return [
        "<fieldset class=\"answer-fieldset\">",
        "<legend class=\"answer-label\">Antwort</legend>",
        "<div class=\"choice-list\">",
        choiceOptions.map(function (option) {
          var isChecked = task.type === "single"
            ? response === option.value
            : Array.isArray(response) && response.indexOf(option.value) !== -1;
          return [
            "<label class=\"choice-option\">",
            "<input type=\"" + inputType + "\" name=\"choice-" + escapeHtml(task.id) + "\" value=\"" + escapeHtml(option.value) + "\"" + (isChecked ? " checked" : "") + ">",
            option.kind === "code"
              ? "<span class=\"choice-code\">" + escapeHtml(option.label) + "</span>"
              : "<span>" + escapeHtml(option.label) + "</span>",
            "</label>"
          ].join("");
        }).join(""),
        "</div>",
        "</fieldset>"
      ].join("");
    }

    if (task.type === "match") {
      return renderMatchControls(task, response);
    }

    if (task.type === "order") {
      return [
        "<fieldset class=\"answer-fieldset\">",
        "<legend class=\"answer-label\">Reihenfolge</legend>",
        "<div class=\"order-list\">",
        (task.items || []).map(function (item) {
          return [
            "<label class=\"order-row\">",
            "<span>" + escapeHtml(item.label) + "</span>",
            "<select data-order-item=\"" + escapeHtml(item.id) + "\">",
            "<option value=\"\">Position ausw&auml;hlen</option>",
            buildRankOptions(task.items.length, response && response[item.id]),
            "</select>",
            "</label>"
          ].join("");
        }).join(""),
        "</div>",
        "</fieldset>"
      ].join("");
    }

    return "";
  }

  function renderHints(task, taskStateData) {
    if (!taskStateData.hintLevel) {
      return "";
    }

    return [
      "<section class=\"hint-panel\">",
      "<h3>Hinweise</h3>",
      "<ol>",
      task.hints.slice(0, taskStateData.hintLevel).map(function (hint, index) {
        return "<li><strong>Tipp " + (index + 1) + ":</strong> " + escapeHtml(hint) + "</li>";
      }).join(""),
      "</ol>",
      "</section>"
    ].join("");
  }

  function renderFeedback(task, taskStateData) {
    if (!taskStateData.lastOutcome) {
      return "";
    }

    var label = "";
    var className = "";
    var message = "";

    if (taskStateData.lastOutcome === "correct") {
      label = "Passend";
      className = "is-correct";
      message = task.feedbackCorrect;
    } else if (taskStateData.lastOutcome === "incorrect") {
      label = "Noch nicht stimmig";
      className = "is-incorrect";
      message = task.feedbackIncorrect;
    } else {
      label = "Hinweis";
      className = "is-warning";
      message = taskStateData.message || "Bitte zuerst eine vollstaendige Antwort eingeben oder auswaehlen.";
    }

    return [
      "<section class=\"feedback-panel " + className + "\" aria-live=\"polite\">",
      "<span class=\"feedback-label\">" + escapeHtml(label) + "</span>",
      renderTextBlock(message),
      taskStateData.lastOutcome === "warning" ? "" : renderTextBlock(task.explanation),
      "</section>"
    ].join("");
  }

  function renderSolution(task, taskStateData) {
    if (!taskStateData.modelShown) {
      return "";
    }

    return [
      "<section class=\"solution-panel\">",
      "<h3>Musterloesung</h3>",
      task.solutionFormat === "code"
        ? "<pre><code>" + escapeHtml(task.solution) + "</code></pre>"
        : renderTextBlock(task.solution),
      "</section>"
    ].join("");
  }

  function renderConfidence(task, taskStateData) {
    var options = [
      { value: "sicher", label: "sicher" },
      { value: "teilweise sicher", label: "teilweise sicher" },
      { value: "unsicher", label: "unsicher" }
    ];

    return [
      "<fieldset class=\"confidence-group\">",
      "<legend>Selbsteinschaetzung</legend>",
      "<div class=\"confidence-options\">",
      options.map(function (option) {
        return [
          "<label class=\"confidence-option\">",
          "<input type=\"radio\" name=\"confidence-" + escapeHtml(task.id) + "\" value=\"" + escapeHtml(option.value) + "\"" + (taskStateData.confidence === option.value ? " checked" : "") + ">",
          "<span>" + escapeHtml(option.label) + "</span>",
          "</label>"
        ].join("");
      }).join(""),
      "</div>",
      "</fieldset>"
    ].join("");
  }

  function collectResponse(card, task) {
    if (task.type === "text") {
      return card.querySelector("textarea") ? card.querySelector("textarea").value.trim() : "";
    }

    if (task.type === "single") {
      var checkedRadio = card.querySelector("input[type='radio'][name='choice-" + task.id + "']:checked");
      return checkedRadio ? checkedRadio.value : "";
    }

    if (task.type === "multi") {
      return Array.prototype.slice.call(card.querySelectorAll("input[type='checkbox'][name='choice-" + task.id + "']:checked")).map(function (checkbox) {
        return checkbox.value;
      }).sort();
    }

    if (task.type === "match") {
      return Array.prototype.slice.call(card.querySelectorAll("[data-match-row]"))
        .reduce(function (result, select) {
          result[select.getAttribute("data-match-row")] = select.value;
          return result;
        }, {});
    }

    if (task.type === "order") {
      return Array.prototype.slice.call(card.querySelectorAll("[data-order-item]"))
        .reduce(function (result, select) {
          result[select.getAttribute("data-order-item")] = select.value;
          return result;
        }, {});
    }

    return null;
  }

  function getIncompleteMessage(task, response) {
    if (task.type === "text") {
      return String(response || "").trim() ? "" : "Bitte zuerst eine Antwort eingeben.";
    }

    if (task.type === "single") {
      return response ? "" : "Bitte eine Antwort ausw&auml;hlen.";
    }

    if (task.type === "multi") {
      return Array.isArray(response) && response.length ? "" : "Bitte mindestens eine Aussage ausw&auml;hlen.";
    }

    if (task.type === "match") {
      return Object.keys(response || {}).every(function (key) {
        return response[key];
      }) ? "" : "Bitte alle Zuordnungen auswaehlen.";
    }

    if (task.type === "order") {
      return Object.keys(response || {}).every(function (key) {
        return response[key];
      }) ? "" : "Bitte jeder Zeile eine Position zuweisen.";
    }

    return "";
  }

  function buildStats(tasks, topic) {
    return tasks.reduce(function (stats, task) {
      var taskStateData = storage.getTaskState(topic, task.id);
      if (taskStateData.attempted) {
        stats.attempted += 1;
      }
      if (taskStateData.correct) {
        stats.correct += 1;
      }
      if (taskStateData.confidence === "unsicher") {
        stats.unsure += 1;
      }
      return stats;
    }, {
      attempted: 0,
      correct: 0,
      unsure: 0
    });
  }

  function getTaskState(taskId) {
    return storage.getTaskState(topicState.topic, taskId);
  }

  function getStatusMeta(taskStateData) {
    if (taskStateData.correct) {
      return { label: "korrekt", className: "is-correct" };
    }
    if (taskStateData.attempted) {
      return { label: "erneut pruefen", className: "is-review" };
    }
    return { label: "neu", className: "" };
  }

  function getHintButtonLabel(task, taskStateData) {
    if (!taskStateData.hintLevel) {
      return "Tipp anzeigen";
    }
    if (taskStateData.hintLevel < task.hints.length) {
      return "Naechsten Tipp anzeigen";
    }
    return "Alle Tipps sichtbar";
  }

  function buildRankOptions(length, currentValue) {
    var options = [];
    for (var index = 1; index <= length; index += 1) {
      options.push("<option value=\"" + index + "\"" + (String(index) === String(currentValue || "") ? " selected" : "") + ">" + index + "</option>");
    }
    return options.join("");
  }

  function renderMetric(value, label) {
    return [
      "<div class=\"metric\">",
      "<strong>" + value + "</strong>",
      "<span>" + escapeHtml(label) + "</span>",
      "</div>"
    ].join("");
  }

  function renderTextBlock(text) {
    return String(text || "")
      .split(/\n{2,}/)
      .map(function (paragraph) {
        return "<p>" + escapeHtml(paragraph).replace(/\n/g, "<br>") + "</p>";
      })
      .join("");
  }

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }
})();