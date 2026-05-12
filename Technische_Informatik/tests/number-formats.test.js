const assert = require("node:assert/strict");
const Practice = require("../js/number-formats.js");

const { OVERFLOW_KIND, OPERATION, REPRESENTATION } = Practice;

function evaluate(task) {
  return Practice.evaluateOperation(task);
}

function task(bitWidth, representation, operation, leftBits, rightBits) {
  return {
    bitWidth,
    representation,
    operation,
    leftBits,
    rightBits
  };
}

let result = evaluate(task(4, REPRESENTATION.UNSIGNED, OPERATION.ADD, "0011", "0100"));
assert.equal(result.resultBits, "0111");
assert.equal(result.overflowKind, OVERFLOW_KIND.NONE);

result = evaluate(task(4, REPRESENTATION.UNSIGNED, OPERATION.ADD, "1111", "0001"));
assert.equal(result.resultBits, "0000");
assert.equal(result.overflowKind, OVERFLOW_KIND.UNSIGNED_ADDITION);

result = evaluate(task(4, REPRESENTATION.UNSIGNED, OPERATION.SUB, "1010", "0011"));
assert.equal(result.resultBits, "0111");
assert.equal(result.overflowKind, OVERFLOW_KIND.NONE);

result = evaluate(task(4, REPRESENTATION.UNSIGNED, OPERATION.SUB, "0010", "0101"));
assert.equal(result.resultBits, "1101");
assert.equal(result.overflowKind, OVERFLOW_KIND.UNSIGNED_SUBTRACTION);

result = evaluate(task(4, REPRESENTATION.TWOS, OPERATION.ADD, "0100", "0100"));
assert.equal(result.resultBits, "1000");
assert.equal(result.overflowKind, OVERFLOW_KIND.TWOS_POSITIVE);

result = evaluate(task(4, REPRESENTATION.TWOS, OPERATION.ADD, "1000", "1111"));
assert.equal(result.resultBits, "0111");
assert.equal(result.overflowKind, OVERFLOW_KIND.TWOS_NEGATIVE);

result = evaluate(task(4, REPRESENTATION.TWOS, OPERATION.SUB, "0111", "1001"));
assert.equal(result.resultBits, "1110");
assert.equal(result.overflowKind, OVERFLOW_KIND.TWOS_POSITIVE);

result = evaluate(task(4, REPRESENTATION.TWOS, OPERATION.SUB, "1000", "0001"));
assert.equal(result.resultBits, "0111");
assert.equal(result.overflowKind, OVERFLOW_KIND.TWOS_NEGATIVE);

assert.equal(Practice.toBinaryBits(16, 4), "0000");
assert.equal(Practice.toBinaryBits(-1, 4), "1111");

const leadingZeroTask = task(4, REPRESENTATION.UNSIGNED, OPERATION.ADD, "0001", "0010");
result = Practice.evaluateStudentAnswer(leadingZeroTask, {
  resultBits: "0011",
  overflowStatus: "no",
  overflowKind: ""
});
assert.equal(result.correct, true);
assert.equal(result.earnedPoints, 2);
assert.equal(result.maxPoints, 2);

result = Practice.evaluateStudentAnswer(leadingZeroTask, {
  resultBits: "11",
  overflowStatus: "no",
  overflowKind: ""
});
assert.equal(result.valid, false);
assert.match(result.message, /genau 4 Bits/);

result = Practice.evaluateStudentAnswer(leadingZeroTask, {
  resultBits: "00A1",
  overflowStatus: "no",
  overflowKind: ""
});
assert.equal(result.valid, false);
assert.match(result.message, /0 und 1/);

const eightBitOverflowTask = task(8, REPRESENTATION.UNSIGNED, OPERATION.ADD, "11111111", "00000001");
result = Practice.evaluateStudentAnswer(eightBitOverflowTask, {
  resultBits: "00000000",
  overflowStatus: "yes",
  overflowKind: OVERFLOW_KIND.UNSIGNED_ADDITION
});
assert.equal(result.correct, true);
assert.equal(result.earnedPoints, 4);
assert.equal(result.maxPoints, 4);

result = Practice.evaluateStudentAnswer(eightBitOverflowTask, {
  resultBits: "00000000",
  overflowStatus: "yes",
  overflowKind: OVERFLOW_KIND.UNSIGNED_SUBTRACTION
});
assert.equal(result.correct, false);
assert.equal(result.resultCorrect, true);
assert.equal(result.overflowStatusCorrect, true);
assert.equal(result.overflowKindCorrect, false);
assert.equal(result.earnedPoints, 3);

const rngValues = [0.1, 0.7, 0.2, 0.8, 0.1, 0.2, 0.3];
const generated = Practice.generateTask({ bitWidth: 4 }, function () {
  return rngValues.shift() || 0.4;
});
assert.equal(generated.bitWidth, 4);
assert.ok([REPRESENTATION.UNSIGNED, REPRESENTATION.TWOS].includes(generated.representation));
assert.ok([OPERATION.ADD, OPERATION.SUB].includes(generated.operation));

console.log("number-formats.test.js: alle Tests bestanden");
