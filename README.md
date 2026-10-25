# A Mealy Machine Model of the Enigma Rotor

A formal computer science study guide and interactive simulation website modeling a single Enigma rotor as a deterministic Mealy machine transducer. Built for the **Models of Computation** course (Research Paper Review).

---

## 1. What the Project Is

This project models the electro-mechanical stepping and cryptographic substitution of a single isolated Enigma rotor as a formal 6-tuple Mealy machine:
$$M = (Q, \Sigma, \Gamma, \delta, \lambda, q_0)$$
- **26 States ($Q = \{q_0, q_1, \dots, q_{25}\}$)** representing the physical rotational positions of the rotor.
- **26 Input/Output Symbols ($\Sigma = \Gamma = \{A, B, \dots, Z\}$)** representing keyboard keystrokes and lampboard output letters.
- **State Transition Function ($\delta: Q \times \Sigma \to Q$)**: Advances the rotor by one rotational position cyclically per keystroke ($\delta(q_N, \sigma) = q_{(N+1) \bmod 26}$).
- **Output Function ($\lambda: Q \times \Sigma \to \Gamma$)**: In every state, $\lambda(q_N, \cdot)$ produces a strict permutation of $A$–$Z$, with exactly one letter mapping to itself (a fixed point).
- **Start State ($q_0$)**: The initial reference rotational position.
- **Transducer Nature**: As a finite-state transducer that reads a finite input string and emits one output letter per input letter, there are **no accepting states** ($F = \emptyset$) and **no reject states**. A short run, including an empty one, is valid.

---

## 2. Project File Structure

Every file in the repository serves a specific, documented role:

| File | Description |
| :--- | :--- |
| `index.html` | Semantic HTML5 structure providing the complete 11-section study guide, interactive SVG diagram viewport, matrix, state cards, simulator, and test traces. |
| `style.css` | Pure vanilla CSS implementing responsive academic typography, color tokens, accessible focus states, dark/light contrast, and print media rules. |
| `app.js` | Client-side application controller handling interactive diagram panning/zooming, SVG node rendering, matrix synchronization, state card filtering, step-by-step simulation with text cleaning and auto-play, and running 19 console self-checks. |
| `enigmaData.js` | The single source of truth containing the complete $26 \times 26$ transition lookup table (676 entries), state set, alphabets, and start state. |
| `enigmaMachine.js` | Pure execution function (`runEnigmaMachine`) that evaluates input strings without side effects or DOM dependencies. |
| `validator.js` | Automated assertion validator that checks state counts, transition completeness (676 entries), cyclic stepping, and output bijectivity. |
| `test.js` | Node.js automated verification suite running 19 exhaustive unit tests (1 data validation check + 18 simulation test cases). |
| `package.json` | Project manifest defining metadata and developer convenience scripts (`npm test`, `npm start`). |
| `server.js` | Lightweight zero-dependency Node.js HTTP server for local testing at `http://localhost:8000/`. |
| `start.md` | Local developer reference guide detailing 4 options for running, testing, and stopping the development server. |
| `Enigma_Mealy_Machine_Transitions.xlsx` | Original source spreadsheet defining the $26 \times 26$ transition table (range A1:AA27). |
| `moc project.pdf` | Course reference documentation and research paper review addendum. |
| `moc my project.pdf` | Student project submission and research review documentation. |
| `.gitignore` | Ignores local operating system files, logs, temporary test PDFs, and editor caches. |
| `.vercelignore` | Excludes non-runtime course materials, test scripts, and local servers from the production deployment bundle. |
| `README.md` | Complete study guide overview, architecture, test instructions, and static deployment guide. |

---

## 3. How to Open and Run Locally

The web application is completely self-contained with **zero frameworks, zero bundlers, and zero network dependencies**:
1. Open the project folder on your computer.
2. Double-click `index.html` (or right-click and open with Chrome, Firefox, Edge, or Safari).
3. The page loads completely offline from local `file://` URLs.
4. Press `F12` (or `Ctrl+Shift+I`) to open Developer Tools and check the Console tab: all data validation rules and 19 automated system self-checks will report `[PASS]`.

---

## 4. How to Run the Automated Tests with Node

To execute the offline verification suite from your terminal:
```bash
node test.js
```
The test runner executes:
- **Task 2 Validator**: Verifies all 4 foundational structural rules across the 676 transitions.
- **18 Simulation Test Cases**: Verifies stepping, wrap-around ($q_{25} \to q_0$), full revolutions (26 keystrokes), fixed points, and character validation.
- Output: `TEST SUMMARY: 19/19 match`.

---

## 5. How the Page is Generated from the Single Data File

All data displayed on the website originates exclusively from `enigmaData.js`:
- The stat tiles in Section 0 query `enigmaData.states.length`, `enigmaData.inputAlphabet.length`, and `enigmaData.startState`.
- The SVG circular state diagram in Section 4 dynamically constructs all 26 nodes ($q_0$ to $q_{25}$) and ring edges ($S_0$ to $S_{25}$) from the state array.
- The Section 5 transition matrix ($26 \times 26$) and 676-row English catalog are rendered by looping over `enigmaData.transitions`.
- The Section 6 state cards and Section 7 fixed-point tiles compute $\lambda(q_N, \sigma) = \sigma$ at page load.
- The Section 8 interactive simulator and 16 worked test traces execute directly via `runEnigmaMachine(enigmaData, ...)`.
No machine properties or transition outputs are hard-coded in the UI.

---

## 6. How to Deploy on Vercel as a Static Site

This project is ready to deploy directly to Vercel as a zero-configuration static website:
1. Push this repository to GitHub or GitLab.
2. Log into [Vercel](https://vercel.com/) and click **"Add New Project"**.
3. Import your repository.
4. In the **Configure Project** screen:
   - **Framework Preset**: Select `Other` (or leave default).
   - **Root Directory**: `./` (project root).
   - **Build Command**: Leave empty / disabled (no build step needed).
   - **Output Directory**: Leave empty / disabled (static HTML served from root).
5. Click **Deploy**.
6. Vercel will deploy the site in seconds, serving `index.html`, `style.css`, and the vanilla JavaScript scripts.

---

## 7. Limitations & Honest Scope

This project implements a formal mathematical transducer modeling the internal wiring permutation and mechanical stepping of a **single isolated Enigma rotor**.
- **Not a Full Cryptographic Machine**: It does not contain multiple cascading rotors, turnover notches, a reflector, or a plugboard ($Steckerbrett$). Consequently, it does not encrypt reciprocally (re-entering ciphertext into the same state will not produce plaintext).
- **No Cryptanalysis or Bombe**: Historical cryptanalytic techniques discussed in the research paper (such as the Turing-Welchman Bombe, clonking, or Banburismus) are reviewed theoretically in Section 2, but are not simulated by this finite state machine.
- **Alphabet Boundary**: The machine alphabet is strictly Latin $A$–$Z$. Non-alphabet characters are intercepted at the input validation layer before any state transition occurs.
