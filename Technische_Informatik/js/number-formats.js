(function (root, factory) {
  "use strict";

  if (typeof module === "object" && module.exports) {
    module.exports = factory();
  } else {
    root.NumberFormatPractice = factory();
  }
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  var REPRESENTATION = {
    UNSIGNED: "unsigned",
    TWOS: "twos"
  };

  var OPERATION = {
    ADD: "add",
    SUB: "sub"
  };

  var OVERFLOW_KIND = {
    NONE: "none",
    UNSIGNED_ADDITION: "unsigned-addition",
    UNSIGNED_SUBTRACTION: "unsigned-subtraction",
    TWOS_POSITIVE: "twos-positive",
    TWOS_NEGATIVE: "twos-negative"
  };

  var OVERFLOW_LABELS = {};
  OVERFLOW_LABELS[OVERFLOW_KIND.NONE] = "kein Overflow";
  OVERFLOW_LABELS[OVERFLOW_KIND.UNSIGNED_ADDITION] = "Overflow bei Zahlen ohne Vorzeichen: Uebertrag aus dem hoechsten Bit bei Addition";
  OVERFLOW_LABELS[OVERFLOW_KIND.UNSIGNED_SUBTRACTION] = "Overflow bei Zahlen ohne Vorzeichen: negatives Ergebnis / Borrow bei Subtraktion";
  OVERFLOW_LABELS[OVERFLOW_KIND.TWOS_POSITIVE] = "Overflow im Zweierkomplement: zwei positive Zahlen ergeben ein negatives Ergebnis";
  OVERFLOW_LABELS[OVERFLOW_KIND.TWOS_NEGATIVE] = "Overflow im Zweierkomplement: zwei negative Zahlen ergeben ein positives Ergebnis";

  function normalizeBitWidth(bitWidth) {
    var width = Number(bitWidth);

    if (!Number.isInteger(width) || width < 2 || width > 24) {
      throw new Error("Bitbreite muss eine ganze Zahl zwischen 2 und 24 sein.");
    }

    return width;
  }

  function getModulo(bitWidth) {
    return Math.pow(2, normalizeBitWidth(bitWidth));
  }

  function getUnsignedMax(bitWidth) {
    return getModulo(bitWidth) - 1;
  }

  function getSignedMin(bitWidth) {
    return -Math.pow(2, normalizeBitWidth(bitWidth) - 1);
  }

  function getSignedMax(bitWidth) {
    return Math.pow(2, normalizeBitWidth(bitWidth) - 1) - 1;
  }

  function wrapToBitWidth(value, bitWidth) {
    var modulo = getModulo(bitWidth);
    return ((value % modulo) + modulo) % modulo;
  }

  function toBinaryBits(value, bitWidth) {
    var width = normalizeBitWidth(bitWidth);
    return wrapToBitWidth(value, width).toString(2).padStart(width, "0");
  }

  function isBinaryOfWidth(bits, bitWidth) {
    var width = normalizeBitWidth(bitWidth);
    return typeof bits === "string" && bits.length === width && /^[01]+$/.test(bits);
  }

  function parseUnsigned(bits, bitWidth) {
    if (!isBinaryOfWidth(bits, bitWidth)) {
      throw new Error("Binaerzahl passt nicht zur Bitbreite.");
    }

    return parseInt(bits, 2);
  }

  function parseTwosComplement(bits, bitWidth) {
    var width = normalizeBitWidth(bitWidth);
    var unsignedValue = parseUnsigned(bits, width);
    var signThreshold = Math.pow(2, width - 1);

    if (unsignedValue >= signThreshold) {
      return unsignedValue - Math.pow(2, width);
    }

    return unsignedValue;
  }

  function isValidRepresentation(value) {
    return value === REPRESENTATION.UNSIGNED || value === REPRESENTATION.TWOS;
  }

  function isValidOperation(value) {
    return value === OPERATION.ADD || value === OPERATION.SUB;
  }

  function normalizeTask(task) {
    var bitWidth = normalizeBitWidth(task.bitWidth);
    var representation = task.representation;
    var operation = task.operation;
    var leftBits = task.leftBits;
    var rightBits = task.rightBits;

    if (!isValidRepresentation(representation)) {
      throw new Error("Unbekannte Zahlendarstellung.");
    }

    if (!isValidOperation(operation)) {
      throw new Error("Unbekannte Rechenart.");
    }

    if (!isBinaryOfWidth(leftBits, bitWidth) || !isBinaryOfWidth(rightBits, bitWidth)) {
      throw new Error("Operanden muessen zur Bitbreite passen.");
    }

    return {
      bitWidth: bitWidth,
      representation: representation,
      operation: operation,
      leftBits: leftBits,
      rightBits: rightBits
    };
  }

  function getDisplayValues(task) {
    if (task.representation === REPRESENTATION.UNSIGNED) {
      return {
        leftValue: parseUnsigned(task.leftBits, task.bitWidth),
        rightValue: parseUnsigned(task.rightBits, task.bitWidth)
      };
    }

    return {
      leftValue: parseTwosComplement(task.leftBits, task.bitWidth),
      rightValue: parseTwosComplement(task.rightBits, task.bitWidth)
    };
  }

  function getOverflowKind(task, mathematicalResult) {
    if (task.representation === REPRESENTATION.UNSIGNED) {
      if (task.operation === OPERATION.ADD && mathematicalResult > getUnsignedMax(task.bitWidth)) {
        return OVERFLOW_KIND.UNSIGNED_ADDITION;
      }

      if (task.operation === OPERATION.SUB && mathematicalResult < 0) {
        return OVERFLOW_KIND.UNSIGNED_SUBTRACTION;
      }

      return OVERFLOW_KIND.NONE;
    }

    if (mathematicalResult > getSignedMax(task.bitWidth)) {
      return OVERFLOW_KIND.TWOS_POSITIVE;
    }

    if (mathematicalResult < getSignedMin(task.bitWidth)) {
      return OVERFLOW_KIND.TWOS_NEGATIVE;
    }

    return OVERFLOW_KIND.NONE;
  }

  function buildReason(evaluation) {
    var maxUnsigned = getUnsignedMax(evaluation.bitWidth);
    var minSigned = getSignedMin(evaluation.bitWidth);
    var maxSigned = getSignedMax(evaluation.bitWidth);
    var expression = evaluation.operation === OPERATION.ADD
      ? evaluation.leftValue + " + " + evaluation.rightValue
      : evaluation.leftValue + " - " + evaluation.rightValue;

    if (evaluation.representation === REPRESENTATION.UNSIGNED) {
      if (evaluation.overflowKind === OVERFLOW_KIND.UNSIGNED_ADDITION) {
        return expression + " = " + evaluation.mathematicalResult + " ist groesser als " + maxUnsigned + "; der Uebertrag aus dem hoechsten Bit faellt weg.";
      }

      if (evaluation.overflowKind === OVERFLOW_KIND.UNSIGNED_SUBTRACTION) {
        return expression + " = " + evaluation.mathematicalResult + " ist kleiner als 0; bei fester Bitbreite bleibt nur das gekuerzte Bitmuster.";
      }

      return expression + " = " + evaluation.mathematicalResult + " liegt im Bereich 0 bis " + maxUnsigned + ".";
    }

    if (evaluation.overflowKind === OVERFLOW_KIND.TWOS_POSITIVE) {
      return expression + " = " + evaluation.mathematicalResult + " liegt oberhalb von " + maxSigned + "; das gekuerzte Ergebnis wird als negative Zahl gelesen.";
    }

    if (evaluation.overflowKind === OVERFLOW_KIND.TWOS_NEGATIVE) {
      return expression + " = " + evaluation.mathematicalResult + " liegt unterhalb von " + minSigned + "; das gekuerzte Ergebnis wird als positive Zahl gelesen.";
    }

    return expression + " = " + evaluation.mathematicalResult + " liegt im Zweierkomplement-Bereich " + minSigned + " bis " + maxSigned + ".";
  }

  function evaluateOperation(taskInput) {
    var task = normalizeTask(taskInput);
    var values = getDisplayValues(task);
    var mathematicalResult = task.operation === OPERATION.ADD
      ? values.leftValue + values.rightValue
      : values.leftValue - values.rightValue;
    var resultBits = toBinaryBits(mathematicalResult, task.bitWidth);
    var overflowKind = getOverflowKind(task, mathematicalResult);
    var evaluation = {
      bitWidth: task.bitWidth,
      representation: task.representation,
      operation: task.operation,
      leftBits: task.leftBits,
      rightBits: task.rightBits,
      leftValue: values.leftValue,
      rightValue: values.rightValue,
      mathematicalResult: mathematicalResult,
      resultBits: resultBits,
      resultUnsignedValue: parseUnsigned(resultBits, task.bitWidth),
      resultSignedValue: parseTwosComplement(resultBits, task.bitWidth),
      overflow: overflowKind !== OVERFLOW_KIND.NONE,
      overflowKind: overflowKind
    };

    evaluation.reason = buildReason(evaluation);
    return evaluation;
  }

  function isValidOverflowKind(value) {
    return value === OVERFLOW_KIND.UNSIGNED_ADDITION
      || value === OVERFLOW_KIND.UNSIGNED_SUBTRACTION
      || value === OVERFLOW_KIND.TWOS_POSITIVE
      || value === OVERFLOW_KIND.TWOS_NEGATIVE;
  }

  function validateStudentAnswer(taskInput, answerInput) {
    var task = normalizeTask(taskInput);
    var answer = answerInput || {};
    var resultBits = String(answer.resultBits || "").trim();
    var overflowStatus = answer.overflowStatus;
    var overflowKind = answer.overflowKind || "";

    if (!resultBits) {
      return {
        valid: false,
        message: "Bitte gib das Ergebnis als Binaerzahl ein."
      };
    }

    if (/[^01]/.test(resultBits)) {
      return {
        valid: false,
        message: "Das Ergebnis darf nur aus 0 und 1 bestehen."
      };
    }

    if (resultBits.length !== task.bitWidth) {
      return {
        valid: false,
        message: "Bitte gib genau " + task.bitWidth + " Bits ein. Fuehrende Nullen gehoeren dazu."
      };
    }

    if (overflowStatus !== "yes" && overflowStatus !== "no") {
      return {
        valid: false,
        message: "Bitte waehle aus, ob ein Overflow vorliegt."
      };
    }

    if (overflowStatus === "yes" && !isValidOverflowKind(overflowKind)) {
      return {
        valid: false,
        message: "Bitte waehle die Art des Overflows aus."
      };
    }

    return {
      valid: true,
      resultBits: resultBits,
      overflowStatus: overflowStatus,
      overflowKind: overflowStatus === "yes" ? overflowKind : OVERFLOW_KIND.NONE
    };
  }

  function getResultPointValue(bitWidth) {
    return normalizeBitWidth(bitWidth) >= 8 ? 2 : 1;
  }

  function scoreStudentAnswer(expected, validation) {
    var expectedOverflowStatus = expected.overflow ? "yes" : "no";
    var resultPointValue = getResultPointValue(expected.bitWidth);
    var resultCorrect = validation.resultBits === expected.resultBits;
    var overflowStatusCorrect = validation.overflowStatus === expectedOverflowStatus;
    var overflowKindApplies = expected.overflow;
    var overflowKindCorrect = overflowKindApplies
      ? validation.overflowKind === expected.overflowKind
      : true;
    var maxPoints = resultPointValue + 1 + (overflowKindApplies ? 1 : 0);
    var earnedPoints = 0;

    if (resultCorrect) {
      earnedPoints += resultPointValue;
    }

    if (overflowStatusCorrect) {
      earnedPoints += 1;
    }

    if (overflowKindApplies && overflowKindCorrect) {
      earnedPoints += 1;
    }

    return {
      resultCorrect: resultCorrect,
      overflowStatusCorrect: overflowStatusCorrect,
      overflowKindCorrect: overflowKindCorrect,
      overflowKindApplies: overflowKindApplies,
      earnedPoints: earnedPoints,
      maxPoints: maxPoints,
      resultPointValue: resultPointValue
    };
  }

  function evaluateStudentAnswer(taskInput, answerInput) {
    var validation = validateStudentAnswer(taskInput, answerInput);
    var expected;
    var score;

    if (!validation.valid) {
      return {
        valid: false,
        correct: false,
        message: validation.message
      };
    }

    expected = evaluateOperation(taskInput);
    score = scoreStudentAnswer(expected, validation);

    return {
      valid: true,
      correct: score.earnedPoints === score.maxPoints,
      resultCorrect: score.resultCorrect,
      overflowCorrect: score.overflowStatusCorrect && score.overflowKindCorrect,
      overflowStatusCorrect: score.overflowStatusCorrect,
      overflowKindCorrect: score.overflowKindCorrect,
      overflowKindApplies: score.overflowKindApplies,
      earnedPoints: score.earnedPoints,
      maxPoints: score.maxPoints,
      resultPointValue: score.resultPointValue,
      givenResultBits: validation.resultBits,
      givenOverflowStatus: validation.overflowStatus,
      givenOverflowKind: validation.overflowKind,
      expected: expected
    };
  }

  function randomInt(min, max, rng) {
    return Math.floor((rng || Math.random)() * (max - min + 1)) + min;
  }

  function pickSetting(value, firstValue, secondValue, rng) {
    if (value === "mixed" || !value) {
      return (rng || Math.random)() < 0.5 ? firstValue : secondValue;
    }

    return value;
  }

  function generateTask(settings, rngInput) {
    var rng = rngInput || Math.random;
    var bitWidth = normalizeBitWidth(settings && settings.bitWidth ? settings.bitWidth : 8);
    var representation = pickSetting(settings && settings.representation, REPRESENTATION.UNSIGNED, REPRESENTATION.TWOS, rng);
    var operation = pickSetting(settings && settings.operation, OPERATION.ADD, OPERATION.SUB, rng);
    var wantOverflow = rng() < 0.45;
    var maxUnsigned = getUnsignedMax(bitWidth);
    var fallback = null;
    var attempt;
    var task;
    var evaluation;

    if (!isValidRepresentation(representation)) {
      representation = REPRESENTATION.UNSIGNED;
    }

    if (!isValidOperation(operation)) {
      operation = OPERATION.ADD;
    }

    for (attempt = 0; attempt < 500; attempt += 1) {
      task = {
        bitWidth: bitWidth,
        representation: representation,
        operation: operation,
        leftBits: toBinaryBits(randomInt(0, maxUnsigned, rng), bitWidth),
        rightBits: toBinaryBits(randomInt(0, maxUnsigned, rng), bitWidth)
      };
      evaluation = evaluateOperation(task);
      fallback = fallback || task;

      if (evaluation.overflow === wantOverflow) {
        return task;
      }
    }

    return fallback;
  }

  function getRepresentationLabel(value) {
    if (value === REPRESENTATION.TWOS) {
      return "Zweierkomplement";
    }

    return "ohne Vorzeichen";
  }

  function getOperationLabel(value) {
    if (value === OPERATION.SUB) {
      return "Subtraktion";
    }

    return "Addition";
  }

  function getOperatorSymbol(value) {
    return value === OPERATION.SUB ? "-" : "+";
  }

  function getOverflowLabel(value) {
    return OVERFLOW_LABELS[value] || OVERFLOW_LABELS[OVERFLOW_KIND.NONE];
  }

  return {
    REPRESENTATION: REPRESENTATION,
    OPERATION: OPERATION,
    OVERFLOW_KIND: OVERFLOW_KIND,
    evaluateOperation: evaluateOperation,
    evaluateStudentAnswer: evaluateStudentAnswer,
    generateTask: generateTask,
    getResultPointValue: getResultPointValue,
    getOperationLabel: getOperationLabel,
    getOperatorSymbol: getOperatorSymbol,
    getOverflowLabel: getOverflowLabel,
    getRepresentationLabel: getRepresentationLabel,
    getSignedMax: getSignedMax,
    getSignedMin: getSignedMin,
    getUnsignedMax: getUnsignedMax,
    isBinaryOfWidth: isBinaryOfWidth,
    parseTwosComplement: parseTwosComplement,
    parseUnsigned: parseUnsigned,
    toBinaryBits: toBinaryBits,
    validateStudentAnswer: validateStudentAnswer,
    wrapToBitWidth: wrapToBitWidth
  };
});
