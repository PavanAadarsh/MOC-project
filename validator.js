/**
 * Validation Module for Enigma Rotor Mealy Machine Data
 * 
 * Validates the integrity and theoretical constraints of the Mealy machine definition:
 * 1. Exactly 26 states and 26 input/output letters, with 676 transitions in total.
 * 2. Every transition cell has a valid next state and valid output letter.
 * 3. The rotor stepping rule: state qN always transitions to q(N+1), and q25 cycles back to q0.
 * 4. Bijective output mapping: in each state, the 26 outputs form a full permutation of A-Z (no duplicates, no omissions).
 */

function validateEnigmaData(data, options = { silent: false }) {
  const errors = [];
  const passedChecks = [];

  // 1. Verify basic data structures
  if (!data || typeof data !== "object") {
    throw new Error("Validation Error: Machine data must be a valid non-null object.");
  }

  const states = data.states;
  const inputAlphabet = data.inputAlphabet;
  const outputAlphabet = data.outputAlphabet;
  const transitions = data.transitions;

  // Rule 1: Exactly 26 states and 26 input letters
  if (!Array.isArray(states) || states.length !== 26) {
    errors.push(`Expected exactly 26 states, found ${Array.isArray(states) ? states.length : 'invalid type'}.`);
  } else {
    // Check state naming q0..q25
    for (let i = 0; i < 26; i++) {
      if (states[i] !== `q${i}`) {
        errors.push(`Expected state at index ${i} to be 'q${i}', found '${states[i]}'.`);
      }
    }
  }

  if (!Array.isArray(inputAlphabet) || inputAlphabet.length !== 26) {
    errors.push(`Expected exactly 26 input letters, found ${Array.isArray(inputAlphabet) ? inputAlphabet.length : 'invalid type'}.`);
  }

  if (!Array.isArray(outputAlphabet) || outputAlphabet.length !== 26) {
    errors.push(`Expected exactly 26 output letters, found ${Array.isArray(outputAlphabet) ? outputAlphabet.length : 'invalid type'}.`);
  }


  // Count transitions and check integrity
  let totalTransitions = 0;
  let allCellsValid = true;
  let allStepsFollowRotorRule = true;
  let allOutputsArePermutations = true;

  if (!transitions || typeof transitions !== "object") {
    errors.push("Missing or invalid transitions object.");
  } else {
    for (let i = 0; i < 26; i++) {
      const stateName = `q${i}`;
      const expectedNextState = `q${(i + 1) % 26}`;
      const stateTransitions = transitions[stateName];

      if (!stateTransitions || typeof stateTransitions !== "object") {
        errors.push(`State '${stateName}' is missing from the transitions table.`);
        continue;
      }

      const seenOutputs = new Set();

      for (let j = 0; j < 26; j++) {
        const letter = String.fromCharCode(65 + j); // A to Z
        const cell = stateTransitions[letter];

        if (!cell || typeof cell !== "object") {
          errors.push(`Missing transition for state '${stateName}' with input '${letter}'.`);
          allCellsValid = false;
          continue;
        }

        totalTransitions++;

        // Rule 2: Valid next state and valid output letter
        const nextState = cell.nextState;
        const output = cell.output;

        if (!states.includes(nextState)) {
          errors.push(`Invalid nextState '${nextState}' at ${stateName} on input '${letter}'.`);
          allCellsValid = false;
        }

        if (!outputAlphabet.includes(output)) {
          errors.push(`Invalid output '${output}' at ${stateName} on input '${letter}'.`);
          allCellsValid = false;
        }

        // Rule 3: Rotor stepping rule (qN -> q(N+1), q25 -> q0)
        if (nextState !== expectedNextState) {
          errors.push(`Rotor step violation at ${stateName} with input '${letter}': expected next state '${expectedNextState}', got '${nextState}'.`);
          allStepsFollowRotorRule = false;
        }

        // Track outputs for permutation check
        if (output) {
          seenOutputs.add(output);
        }
      }

      // Rule 4: Output permutation check for this state
      if (seenOutputs.size !== 26) {
        errors.push(`State '${stateName}' outputs do not form a 26-letter permutation (unique outputs: ${seenOutputs.size}/26).`);
        allOutputsArePermutations = false;
      }
    }
  }

  // Verify total transition count is exactly 26 x 26 = 676
  if (totalTransitions !== 676) {
    errors.push(`Expected exactly 676 transitions (26 x 26), counted ${totalTransitions}.`);
  }

  if (errors.length === 0) {
    passedChecks.push("Rule 1: Exactly 26 states and 26 input letters, with 676 transitions in total.");
    passedChecks.push("Rule 2: Every cell parsed with a valid next state and a valid output letter.");
    passedChecks.push("Rule 3: Rotor stepping verified: next state of qN is always q(N+1), and q25 goes back to q0.");
    passedChecks.push("Rule 4: In each state, the 26 outputs are a permutation of A-Z (no letter repeated, none missing).");
  }

  // Report errors if any rule failed
  if (errors.length > 0) {
    const errorMsg = `Data Validation Failed with ${errors.length} error(s):\n  - ` + errors.join("\n  - ");
    if (!options.silent) {
      console.error(errorMsg);
    }
    throw new Error(errorMsg);
  }

  // Summary of passed checks
  const summary = [
    "=== Enigma Rotor Mealy Machine Data Validation ===",
    ...passedChecks.map((check, index) => ` [PASS ${index + 1}/4] ${check}`),
    " Summary: All 4 validation rules passed successfully."
  ].join("\n");

  if (!options.silent) {
    console.log(summary);
  }

  return {
    valid: true,
    totalTransitions,
    passedChecks,
    summary
  };
}

// Export for Node.js and browser environments
if (typeof module !== "undefined" && module.exports) {
  module.exports = { validateEnigmaData };
}
if (typeof window !== "undefined") {
  window.validateEnigmaData = validateEnigmaData;
}
