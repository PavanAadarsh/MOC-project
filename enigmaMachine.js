/**
 * Core Mealy Machine Simulation Logic
 * 
 * Implements a pure function to simulate the single Enigma rotor as a Mealy machine.
 * 
 * Formal Definition of this Mealy Machine:
 *   M = (Q, Sigma, Gamma, delta, lambda, q0)
 *   - Q: Set of 26 states {q0, q1, ..., q25} representing rotor rotational positions.
 *   - Sigma: Input alphabet {A, B, ..., Z}.
 *   - Gamma: Output alphabet {A, B, ..., Z}.
 *   - delta: State transition function Q x Sigma -> Q (rotates rotor: qN -> q((N+1)%26)).
 *   - lambda: Output function Q x Sigma -> Gamma (internal wiring permutation at position qN).
 *   - q0: Initial state (default rotor position).
 * 
 * This function is pure: it has no side effects, does not mutate inputs or globals,
 * and produces deterministic results suitable for Node.js test suites, browser runtimes,
 * and UI components.
 */

/**
 * Runs the Enigma rotor Mealy machine on an input string.
 * 
 * @param {Object} data - The complete machine definition (states, alphabet, transitions).
 * @param {string} [inputString=""] - The input string consisting of uppercase letters A-Z.
 * @param {string} [startState] - The initial state to start execution from (defaults to data.startState or "q0").
 * @returns {Object} Result object containing:
 *   - output: string of generated output characters
 *   - visitedStates: array of states visited in sequence, including the start state
 *   - finalState: the state where execution ended
 *   - steps: array of step objects, each with { state, input, output, nextState }
 *   - error: descriptive string if an invalid character/state occurred, empty string "" when valid
 */
function runEnigmaMachine(data, inputString = "", startState) {
  // Determine start state, falling back to data.startState or "q0"
  const currentStart = startState || (data && data.startState) || "q0";

  // Validate presence of data and transitions table
  if (!data || !data.transitions || !data.states) {
    return {
      output: "",
      visitedStates: [currentStart],
      finalState: currentStart,
      steps: [],
      error: "Machine data or transitions table is missing or invalid."
    };
  }

  // Validate start state exists in the machine's state set
  if (!data.states.includes(currentStart)) {
    return {
      output: "",
      visitedStates: [currentStart],
      finalState: currentStart,
      steps: [],
      error: `Invalid start state '${currentStart}'. Must be one of: ${data.states.join(", ")}.`
    };
  }

  // Coerce non-string or null input safely
  if (typeof inputString !== "string") {
    return {
      output: "",
      visitedStates: [currentStart],
      finalState: currentStart,
      steps: [],
      error: `Input must be a string, received ${typeof inputString}.`
    };
  }

  // Initialize tracing structures
  let currentState = currentStart;
  const visitedStates = [currentState];
  const steps = [];
  let output = "";

  // Process input string character by character
  for (let i = 0; i < inputString.length; i++) {
    const char = inputString[i];
    const position = i + 1; // 1-based index for student-friendly error reporting

    // Check if character is a valid uppercase letter in inputAlphabet
    if (!data.inputAlphabet || !data.inputAlphabet.includes(char)) {
      return {
        output,
        visitedStates,
        finalState: currentState,
        steps,
        error: `Invalid character '${char}' at position ${position}. Only uppercase letters (A-Z) are accepted.`
      };
    }

    // Look up transition for current state and input letter
    const stateTransitions = data.transitions[currentState];
    const transition = stateTransitions ? stateTransitions[char] : null;

    if (!transition) {
      return {
        output,
        visitedStates,
        finalState: currentState,
        steps,
        error: `Undefined transition from state '${currentState}' with input '${char}' at position ${position}.`
      };
    }

    const { nextState, output: outChar } = transition;

    // Record the executed step
    steps.push({
      state: currentState,
      input: char,
      output: outChar,
      nextState: nextState
    });

    // Append output and advance state
    output += outChar;
    currentState = nextState;
    visitedStates.push(currentState);
  }

  // Return complete run trace
  return {
    output,
    visitedStates,
    finalState: currentState,
    steps,
    error: ""
  };
}

// Export for Node.js and browser environments
if (typeof module !== "undefined" && module.exports) {
  module.exports = { runEnigmaMachine };
}
if (typeof window !== "undefined") {
  window.runEnigmaMachine = runEnigmaMachine;
}
