(function () {
  "use strict";

  function normalizeText(value) {
    return String(value || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[„“”]/g, '"')
      .replace(/[’]/g, "'")
      .replace(/\s+/g, " ")
      .replace(/\s*([(),=<>:+\-*\/])\s*/g, "$1")
      .replace(/;+$/, "")
      .trim();
  }

  function isArrayEqual(left, right) {
    if (left.length !== right.length) {
      return false;
    }
    for (var index = 0; index < left.length; index += 1) {
      if (left[index] !== right[index]) {
        return false;
      }
    }
    return true;
  }

  function sortArray(values) {
    return values.slice().sort();
  }

  function checkSingle(task, response) {
    return {
      correct: response === task.validation.correctOption
    };
  }

  function checkMulti(task, response) {
    var current = sortArray(Array.isArray(response) ? response : []);
    var expected = sortArray(task.validation.correctOptions || []);
    return {
      correct: isArrayEqual(current, expected)
    };
  }

  function checkText(task, response) {
    var normalized = normalizeText(response);
    var requiredGroups = task.validation.requiredGroups || [];
    var forbiddenGroups = task.validation.forbiddenGroups || [];
    var minimumLength = task.validation.minimumLength || 0;
    var missing = [];
    var forbiddenHits = [];

    requiredGroups.forEach(function (group, index) {
      var matches = group.some(function (variant) {
        return normalized.indexOf(normalizeText(variant)) !== -1;
      });

      if (!matches) {
        missing.push(index);
      }
    });

    forbiddenGroups.forEach(function (group, index) {
      var hits = group.some(function (variant) {
        return normalized.indexOf(normalizeText(variant)) !== -1;
      });

      if (hits) {
        forbiddenHits.push(index);
      }
    });

    return {
      correct: normalized.length >= minimumLength && missing.length === 0 && forbiddenHits.length === 0
    };
  }

  function checkMatch(task, response) {
    var expected = task.validation.correctMap || {};
    var rowIds = Object.keys(expected);
    var correct = rowIds.every(function (rowId) {
      return response && response[rowId] === expected[rowId];
    });

    return {
      correct: correct
    };
  }

  function checkOrder(task, response) {
    var expectedOrder = task.validation.correctOrder || [];
    var usedRanks = {};
    var correct = true;

    expectedOrder.forEach(function (itemId, index) {
      var value = response ? response[itemId] : "";
      var expectedRank = String(index + 1);

      if (!value || usedRanks[value] || value !== expectedRank) {
        correct = false;
      }

      usedRanks[value] = true;
    });

    return {
      correct: correct
    };
  }

  function evaluate(task, response) {
    switch (task.type) {
      case "single":
        return checkSingle(task, response);
      case "multi":
        return checkMulti(task, response);
      case "text":
        return checkText(task, response);
      case "match":
        return checkMatch(task, response);
      case "order":
        return checkOrder(task, response);
      default:
        return { correct: false };
    }
  }

  window.DataManagementCheckers = {
    evaluate: evaluate
  };
})();