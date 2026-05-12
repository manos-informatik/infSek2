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

console.log("number-formats.test.js: alle Tests bestanden");
