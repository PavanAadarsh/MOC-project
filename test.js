/**
 * Automated Test Suite for Enigma Rotor Mealy Machine
 * 
 * Runs offline in Node.js with zero dependencies.
 * Validates the data layer against all 4 structural constraints and tests the
 * core simulation logic across required and extra test cases.
 */

const enigmaData = require("./enigmaData.js");
const { validateEnigmaData } = require("./validator.js");
const { runEnigmaMachine } = require("./enigmaMachine.js");

// Test statistics counters
let totalTests = 0;
let passedTests = 0;

/**
 * Helper to run a test and print PASS/FAIL status.
 * 
 * @param {string} testName - Description of test case
 * @param {Function} testFn - Function returning boolean (true = pass)
 */
function runTest(testName, testFn) {
  totalTests++;
  try {
    const result = testFn();
    if (result === true) {
      passedTests++;
      console.log(`[PASS] Case ${totalTests}: ${testName}`);
    } else {
      console.error(`[FAIL] Case ${totalTests}: ${testName} (Assertion returned false)`);
    }
  } catch (err) {
    console.error(`[FAIL] Case ${totalTests}: ${testName} (Threw error: ${err.message})`);
  }
}

console.log("================================================================================");
console.log("      ENIGMA ROTOR MEALY MACHINE - AUTOMATED VERIFICATION & TEST SUITE          ");
console.log("================================================================================\n");

// -----------------------------------------------------------------------------
// SECTION 1: RUN TASK 2 DATA VALIDATION
// -----------------------------------------------------------------------------
console.log("\n--- Task 2: Machine Constraints Verification ---");
runTest("Validation Rule Checks: 26 states/inputs, 676 transitions, rotor stepping & bijective outputs", () => {
  const res = validateEnigmaData(enigmaData, { silent: true });
  return res.valid === true && res.passedChecks.length === 4;
});

// -----------------------------------------------------------------------------
// SECTION 2: SIMULATION LOGIC TESTS (REQUIRED + EXTRA CASES)
// -----------------------------------------------------------------------------
console.log("--- Task 4: Simulation Logic Automated Test Cases ---\n");

// --- REQUIRED CASE 1: Start q0, input "A" -> output "J", final state q1
runTest("Start q0, input 'A' -> output 'J', final state q1", () => {
  const res = runEnigmaMachine(enigmaData, "A", "q0");
  return res.output === "J" &&
         res.finalState === "q1" &&
         res.visitedStates.join(" > ") === "q0 > q1" &&
         res.error === "" &&
         res.steps.length === 1 &&
         res.steps[0].state === "q0" &&
         res.steps[0].input === "A" &&
         res.steps[0].output === "J" &&
         res.steps[0].nextState === "q1";
});

// --- REQUIRED CASE 2: Start q0, input "AAA" -> output "JKC", states q0 > q1 > q2 > q3
runTest("Start q0, input 'AAA' -> output 'JKC', states q0 > q1 > q2 > q3", () => {
  const res = runEnigmaMachine(enigmaData, "AAA", "q0");
  return res.output === "JKC" &&
         res.finalState === "q3" &&
         res.visitedStates.join(" > ") === "q0 > q1 > q2 > q3" &&
         res.error === "" &&
         res.steps.length === 3;
});

// --- REQUIRED CASE 3: Start q0, input "ABC" -> output "JDD", final state q3
runTest("Start q0, input 'ABC' -> output 'JDD', final state q3", () => {
  const res = runEnigmaMachine(enigmaData, "ABC", "q0");
  return res.output === "JDD" &&
         res.finalState === "q3" &&
         res.visitedStates.join(" > ") === "q0 > q1 > q2 > q3" &&
         res.error === "" &&
         res.steps.length === 3;
});

// --- REQUIRED CASE 4: Start q25, input "AA" -> output "EJ", states q25 > q0 > q1 (wrap-around)
runTest("Start q25, input 'AA' -> output 'EJ', states q25 > q0 > q1 (wrap-around)", () => {
  const res = runEnigmaMachine(enigmaData, "AA", "q25");
  return res.output === "EJ" &&
         res.finalState === "q1" &&
         res.visitedStates.join(" > ") === "q25 > q0 > q1" &&
         res.error === "" &&
         res.steps.length === 2;
});

// --- REQUIRED CASE 5: Start q0, any 26-letter input -> final state q0 (full rotor cycle)
runTest("Start q0, 26-letter input 'ABCDEFGHIJKLMNOPQRSTUVWXYZ' -> final state q0", () => {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const res = runEnigmaMachine(enigmaData, alphabet, "q0");
  return res.output.length === 26 &&
         res.finalState === "q0" &&
         res.visitedStates.length === 27 &&
         res.visitedStates[0] === "q0" &&
         res.visitedStates[26] === "q0" &&
         res.error === "";
});

// --- REQUIRED CASE 6: Start q0, input "a" (lowercase) -> error naming character and position 1
runTest("Start q0, input 'a' (lowercase) -> error naming 'a' at position 1", () => {
  const res = runEnigmaMachine(enigmaData, "a", "q0");
  return res.error.includes("'a'") &&
         res.error.includes("position 1") &&
         res.output === "" &&
         res.finalState === "q0" &&
         res.visitedStates.length === 1 &&
         res.steps.length === 0;
});

// --- REQUIRED CASE 7: Start q0, input "A1" -> error naming '1' at position 2, state trace up to failure
runTest("Start q0, input 'A1' -> error naming '1' at position 2 with trace up to failure", () => {
  const res = runEnigmaMachine(enigmaData, "A1", "q0");
  return res.error.includes("'1'") &&
         res.error.includes("position 2") &&
         res.output === "J" &&
         res.finalState === "q1" &&
         res.visitedStates.join(" > ") === "q0 > q1" &&
         res.steps.length === 1 &&
         res.steps[0].state === "q0" &&
         res.steps[0].input === "A" &&
         res.steps[0].output === "J" &&
         res.steps[0].nextState === "q1";
});

// --- EXTRA CASE 8 (One-letter input): Start q0, input "Z" -> output "D", final state q1
runTest("Extra 1 (One-letter): Start q0, input 'Z' -> output 'D', final state q1", () => {
  const res = runEnigmaMachine(enigmaData, "Z", "q0");
  return res.output === "D" &&
         res.finalState === "q1" &&
         res.visitedStates.join(" > ") === "q0 > q1" &&
         res.error === "";
});

// --- EXTRA CASE 9 (One-letter input from non-zero state): Start q5, input "M" -> output "M", final state q6
runTest("Extra 2 (One-letter mid-cycle): Start q5, input 'M' -> output 'M', final state q6", () => {
  const res = runEnigmaMachine(enigmaData, "M", "q5");
  return res.output === "M" &&
         res.finalState === "q6" &&
         res.visitedStates.join(" > ") === "q5 > q6" &&
         res.error === "";
});

// --- EXTRA CASE 10 (Repeated letter): Start q0, input "ZZZ" -> output "DIJ", states q0 > q1 > q2 > q3
runTest("Extra 3 (Repeated letter): Start q0, input 'ZZZ' -> output 'DIJ', states q0 > q1 > q2 > q3", () => {
  const res = runEnigmaMachine(enigmaData, "ZZZ", "q0");
  return res.output === "DIJ" &&
         res.finalState === "q3" &&
         res.visitedStates.join(" > ") === "q0 > q1 > q2 > q3" &&
         res.error === "";
});

// --- EXTRA CASE 11 (Repeated letter): Start q0, input "BBBB" -> output "LDIC", states q0 > q1 > q2 > q3 > q4
runTest("Extra 4 (Repeated letter): Start q0, input 'BBBB' -> output 'LDIC', states q0 > q1 > q2 > q3 > q4", () => {
  const res = runEnigmaMachine(enigmaData, "BBBB", "q0");
  return res.output === "LDIC" &&
         res.finalState === "q4" &&
         res.visitedStates.join(" > ") === "q0 > q1 > q2 > q3 > q4" &&
         res.error === "";
});

// --- EXTRA CASE 12 (Full 26-letter repeated input): Start q0, 26 'A's -> final state q0
runTest("Extra 5 (Full 26-letter repeated): Start q0, input 26 'A's -> final state q0", () => {
  const input26A = "A".repeat(26);
  const res = runEnigmaMachine(enigmaData, input26A, "q0");
  return res.output.length === 26 &&
         res.finalState === "q0" &&
         res.visitedStates.length === 27 &&
         res.visitedStates[0] === "q0" &&
         res.visitedStates[26] === "q0" &&
         res.error === "";
});

// --- EXTRA CASE 13 (Starting from q25 wrap-around single letter): Start q25, input "Z" -> output "J", final state q0
runTest("Extra 6 (Wrap-around single step): Start q25, input 'Z' -> output 'J', final state q0", () => {
  const res = runEnigmaMachine(enigmaData, "Z", "q25");
  return res.output === "J" &&
         res.finalState === "q0" &&
         res.visitedStates.join(" > ") === "q25 > q0" &&
         res.error === "";
});

// --- EXTRA CASE 14 (Starting from q25 multi-step wrap): Start q25, input "XYZ" -> output "RII", states q25 > q0 > q1 > q2
runTest("Extra 7 (Wrap-around sequence): Start q25, input 'XYZ' -> output 'RII', states q25 > q0 > q1 > q2", () => {
  const res = runEnigmaMachine(enigmaData, "XYZ", "q25");
  return res.output === "RII" &&
         res.finalState === "q2" &&
         res.visitedStates.join(" > ") === "q25 > q0 > q1 > q2" &&
         res.error === "";
});

// --- EXTRA CASE 15 (Empty string from q0): Start q0, input "" -> output "", final state q0, error ""
runTest("Extra 8 (Empty string default start): Start q0, input '' -> output '', states [q0], final state q0", () => {
  const res = runEnigmaMachine(enigmaData, "", "q0");
  return res.output === "" &&
         res.finalState === "q0" &&
         res.visitedStates.length === 1 &&
         res.visitedStates[0] === "q0" &&
         res.steps.length === 0 &&
         res.error === "";
});

// --- EXTRA CASE 16 (Empty string from q15): Start q15, input "" -> output "", final state q15, error ""
runTest("Extra 9 (Empty string arbitrary state): Start q15, input '' -> output '', states [q15], final state q15", () => {
  const res = runEnigmaMachine(enigmaData, "", "q15");
  return res.output === "" &&
         res.finalState === "q15" &&
         res.visitedStates.length === 1 &&
         res.visitedStates[0] === "q15" &&
         res.steps.length === 0 &&
         res.error === "";
});

// --- EXTRA CASE 17 (Invalid input: Space at position 6): Start q0, input "HELLO WORLD" -> error naming ' ' at position 6
runTest("Extra 10 (Invalid character in string): Start q0, input 'HELLO WORLD' -> error naming ' ' at position 6", () => {
  const res = runEnigmaMachine(enigmaData, "HELLO WORLD", "q0");
  return res.error.includes("' '") &&
         res.error.includes("position 6") &&
         res.output === "UBVDK" &&
         res.finalState === "q5" &&
         res.steps.length === 5 &&
         res.visitedStates.join(" > ") === "q0 > q1 > q2 > q3 > q4 > q5";
});

// --- EXTRA CASE 18 (Invalid input: Symbol at position 1): Start q0, input "@ABC" -> error naming '@' at position 1
runTest("Extra 11 (Invalid character at start): Start q0, input '@ABC' -> error naming '@' at position 1", () => {
  const res = runEnigmaMachine(enigmaData, "@ABC", "q0");
  return res.error.includes("'@'") &&
         res.error.includes("position 1") &&
         res.output === "" &&
         res.finalState === "q0" &&
         res.steps.length === 0 &&
         res.visitedStates.length === 1 &&
         res.visitedStates[0] === "q0";
});

// -----------------------------------------------------------------------------
// SECTION 3: FINAL RESULTS REPORT
// -----------------------------------------------------------------------------
console.log("\n================================================================================");
console.log(`TEST SUMMARY: ${passedTests}/${totalTests} match`);
console.log("================================================================================");

if (passedTests === totalTests) {
  console.log("All automated tests passed successfully!\n");
  process.exit(0);
} else {
  console.error(`FAILED: ${totalTests - passedTests} test(s) failed.\n`);
  process.exit(1);
}
