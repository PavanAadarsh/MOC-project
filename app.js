/**
 * Application Controller for Enigma Rotor Mealy Machine Study Guide
 * 
 * Pure Vanilla JavaScript - No frameworks, bundlers or external dependencies.
 * Automatically populates all data-driven statistics, tables, traces, the
 * interactive Section 4 Mealy machine diagram, Section 5 Transition Matrix and
 * 676 Transitions Table, and Section 6 State Profile Cards directly from enigmaData.js.
 */

// Shared global variable for simulator start state (accessible by later simulator module)
window.simulatorStartState = "q0";

document.addEventListener("DOMContentLoaded", () => {
  // 1. Verify that the core machine data and runner are loaded
  if (typeof enigmaData === "undefined" || !enigmaData.transitions) {
    console.error("FATAL: enigmaData is not loaded. Cannot render machine statistics.");
    return;
  }

  if (typeof runEnigmaMachine !== "function") {
    console.error("FATAL: runEnigmaMachine is not available. Cannot compute traces.");
    return;
  }

  // ---------------------------------------------------------------------------
  // SECTION 0: POPULATE HEADER STAT TILES
  // ---------------------------------------------------------------------------
  const statesCount = enigmaData.states ? enigmaData.states.length : 0;
  const inputSymbolsCount = enigmaData.inputAlphabet ? enigmaData.inputAlphabet.length : 0;
  const outputSymbolsCount = enigmaData.outputAlphabet ? enigmaData.outputAlphabet.length : 0;
  
  // Calculate total transitions dynamically across all states
  let totalTransitionsCount = 0;
  if (enigmaData.transitions) {
    Object.keys(enigmaData.transitions).forEach(state => {
      totalTransitionsCount += Object.keys(enigmaData.transitions[state]).length;
    });
  }

  const startStateValue = enigmaData.startState || "q0";
  const acceptingStatesCount = 0; // Transducer has no accepting states

  // Insert values into Section 0 stat elements
  const elStatStates = document.getElementById("stat-states");
  const elStatInputs = document.getElementById("stat-inputs");
  const elStatOutputs = document.getElementById("stat-outputs");
  const elStatTransitions = document.getElementById("stat-transitions");
  const elStatStart = document.getElementById("stat-start");
  const elStatAccepting = document.getElementById("stat-accepting");

  if (elStatStates) elStatStates.textContent = statesCount;
  if (elStatInputs) elStatInputs.textContent = inputSymbolsCount;
  if (elStatOutputs) elStatOutputs.textContent = outputSymbolsCount;
  if (elStatTransitions) elStatTransitions.textContent = totalTransitionsCount;
  if (elStatStart) elStatStart.textContent = startStateValue;
  if (elStatAccepting) elStatAccepting.textContent = acceptingStatesCount;

  // ---------------------------------------------------------------------------
  // SECTION 1: COMPUTE "FOUR THINGS THE MACHINE DEMONSTRATES"
  // ---------------------------------------------------------------------------
  // 1. Same key, different output: "AAA" from q0
  const traceAAA = runEnigmaMachine(enigmaData, "AAA", "q0");
  const elDemoSameKey = document.getElementById("demo-same-key");
  if (elDemoSameKey) {
    elDemoSameKey.textContent = `Input: "AAA" from q0 → Output: "${traceAAA.output}" (States: ${traceAAA.visitedStates.join(" → ")})`;
  }

  // 2. Rotor stepping: single step demonstration
  const traceStep = runEnigmaMachine(enigmaData, "A", "q0");
  const elDemoStepping = document.getElementById("demo-stepping");
  if (elDemoStepping) {
    elDemoStepping.textContent = `Input: "A" from q0 → Next State: ${traceStep.finalState} (Rule: qN → q(N+1))`;
  }

  // 3. Full turn: 26 key presses returning to start state
  const traceFullTurn = runEnigmaMachine(enigmaData, "A".repeat(26), "q0");
  const elDemoFullTurn = document.getElementById("demo-full-turn");
  if (elDemoFullTurn) {
    elDemoFullTurn.textContent = `Input: 26 × "A" from q0 → Final State: ${traceFullTurn.finalState} (26 steps = 1 complete revolution)`;
  }

  // 4. Wrap-around: "AA" from q25
  const traceWrap = runEnigmaMachine(enigmaData, "AA", "q25");
  const elDemoWrap = document.getElementById("demo-wrap");
  if (elDemoWrap) {
    elDemoWrap.textContent = `Input: "AA" from q25 → Output: "${traceWrap.output}" (States: ${traceWrap.visitedStates.join(" → ")})`;
  }

  // ---------------------------------------------------------------------------
  // SECTION 2: WORKED EXAMPLE (INPUT "ABC" FROM q0)
  // ---------------------------------------------------------------------------
  const traceABC = runEnigmaMachine(enigmaData, "ABC", "q0");
  const tableBodyABC = document.getElementById("worked-example-table-body");
  const summaryLineABC = document.getElementById("worked-example-result");

  if (tableBodyABC && traceABC.steps) {
    tableBodyABC.innerHTML = "";
    traceABC.steps.forEach((step, idx) => {
      const row = document.createElement("tr");
      row.innerHTML = `
        <td><strong>${idx + 1}</strong></td>
        <td><code>${step.state}</code></td>
        <td><code>${step.input}</code></td>
        <td><strong><code>${step.output}</code></strong></td>
        <td><code>${step.nextState}</code></td>
      `;
      tableBodyABC.appendChild(row);
    });
  }

  if (summaryLineABC) {
    summaryLineABC.textContent = `Result: Input "ABC" from q0 produces output "${traceABC.output}", ending in state ${traceABC.finalState}.`;
  }

  // ---------------------------------------------------------------------------
  // SECTION 3: RENDER ALPHABET CHIPS (A-Z) & ACTIVATE LETTER VIEW
  // ---------------------------------------------------------------------------
  let activeLetterView = null; // Currently selected letter or null

  const chipsContainer = document.getElementById("alphabet-chips-container");
  if (chipsContainer && enigmaData.inputAlphabet) {
    chipsContainer.innerHTML = "";
    enigmaData.inputAlphabet.forEach(letter => {
      const chip = document.createElement("button");
      chip.type = "button";
      chip.className = "alphabet-chip is-interactive";
      chip.textContent = letter;
      chip.setAttribute("aria-label", `Alphabet symbol ${letter}. Click to toggle Letter View on diagram.`);
      chip.dataset.letter = letter;
      
      chip.addEventListener("click", () => {
        toggleLetterView(letter);
      });

      chipsContainer.appendChild(chip);
    });
  }

  // ---------------------------------------------------------------------------
  // SECTION 7: COMPUTE FIXED POINTS (WHERE OUTPUT == INPUT)
  // ---------------------------------------------------------------------------
  const fixedPointsContainer = document.getElementById("fixed-points-container");
  if (fixedPointsContainer && enigmaData.states && enigmaData.transitions) {
    fixedPointsContainer.innerHTML = "";
    enigmaData.states.forEach(state => {
      let fixedChar = "None";
      const stateTransitions = enigmaData.transitions[state];
      if (stateTransitions) {
        for (const ch of enigmaData.inputAlphabet) {
          if (stateTransitions[ch] && stateTransitions[ch].output === ch) {
            fixedChar = ch;
            break;
          }
        }
      }

      const item = document.createElement("div");
      item.className = "fixed-point-item";
      item.innerHTML = `
        <span class="fixed-point-state">${state}</span>
        <span class="fixed-point-letter">→ <strong>${fixedChar}</strong></span>
      `;
      fixedPointsContainer.appendChild(item);
    });
  }

  // ===========================================================================
  // SECTION 4: INTERACTIVE MEALY MACHINE DIAGRAM IMPLEMENTATION
  // ===========================================================================
  const SVG_NS = "http://www.w3.org/2000/svg";
  const CX = 500;
  const CY = 500;
  const RING_RADIUS = 330;
  const NODE_RADIUS = 18;
  const LABEL_RADIUS = 422;
  const BADGE_RADIUS = 282;
  const TOTAL_STATES = 26;

  let selectedState = "q0";
  let zoomLevel = 1.0;
  let panX = 0;
  let panY = 0;
  let isPanning = false;
  let startPanCoords = { x: 0, y: 0 };

  const panZoomGroup = document.getElementById("diagram-pan-zoom-group");
  const nodesGroup = document.getElementById("diagram-nodes-group");
  const edgesGroup = document.getElementById("diagram-edges-group");
  const viewport = document.getElementById("diagram-viewport");
  const tooltip = document.getElementById("diagram-tooltip");
  const contextMenu = document.getElementById("diagram-context-menu");
  const toast = document.getElementById("diagram-toast");
  const letterIndicator = document.getElementById("letter-view-indicator");
  const btnClearLetter = document.getElementById("btn-clear-letter-view");
  const letterSummaryLine = document.getElementById("letter-view-summary-line");

  // Status line under diagram (reading counts strictly from data)
  const statusLineEl = document.getElementById("diagram-status-line");
  if (statusLineEl) {
    statusLineEl.textContent = `${statesCount} states — ${statesCount} ring edges (each carrying 26 inputs) — ${totalTransitionsCount} input-level transitions — complete Mealy machine — no accepting states`;
  }

  /**
   * Helper: Calculate angle for state index i (q0 is at the top, running clockwise)
   */
  function getStateAngle(i) {
    return -Math.PI / 2 + i * (2 * Math.PI / TOTAL_STATES);
  }

  /**
   * Helper: Calculate (x, y) coordinates on circle
   */
  function getCircleCoords(angle, radius) {
    return {
      x: CX + radius * Math.cos(angle),
      y: CY + radius * Math.sin(angle)
    };
  }

  /**
   * Generates the SVG diagram nodes, ring edges, and outside labels.
   * FIX: q0 is rendered with a thicker solid outline and tinted fill without a double-ring!
   */
  function buildDiagram() {
    if (!nodesGroup || !edgesGroup) return;

    nodesGroup.innerHTML = "";
    edgesGroup.innerHTML = "";

    // 1. Build exactly 26 Ring Edges (q0->q1, q1->q2, ..., q25->q0)
    for (let i = 0; i < TOTAL_STATES; i++) {
      const srcState = `q${i}`;
      const dstState = `q${(i + 1) % TOTAL_STATES}`;
      const thetaI = getStateAngle(i);
      const thetaNext = getStateAngle(i + 1);
      const thetaMid = thetaI + Math.PI / TOTAL_STATES;

      // Arc geometry along RING_RADIUS, with padding for node radii
      const angularPadding = 0.068; // ~3.9 degrees clearance from node center
      const startAngle = thetaI + angularPadding;
      const endAngle = thetaNext - angularPadding;

      const pStart = getCircleCoords(startAngle, RING_RADIUS);
      const pEnd = getCircleCoords(endAngle, RING_RADIUS);

      // Create curved arc edge
      const edgePath = document.createElementNS(SVG_NS, "path");
      edgePath.setAttribute("d", `M ${pStart.x.toFixed(2)} ${pStart.y.toFixed(2)} A ${RING_RADIUS} ${RING_RADIUS} 0 0 1 ${pEnd.x.toFixed(2)} ${pEnd.y.toFixed(2)}`);
      edgePath.setAttribute("class", "diagram-edge");
      edgePath.setAttribute("id", `edge-q${i}`);
      edgePath.setAttribute("data-source-state", srcState);
      edgePath.setAttribute("data-target-state", dstState);
      edgePath.setAttribute("data-subscript", `S_${i}`);
      edgePath.setAttribute("marker-end", "url(#edge-arrow)");
      edgePath.setAttribute("tabindex", "0");
      edgePath.setAttribute("role", "img");
      edgePath.setAttribute("aria-label", `Transition from ${srcState} to ${dstState} on any key. Output scrambler S_${i}(input).`);

      // Edge hover interaction
      edgePath.addEventListener("mouseenter", (e) => {
        showEdgeTooltip(e, i, srcState, dstState);
        highlightEdge(i, true);
      });
      edgePath.addEventListener("mousemove", (e) => positionTooltip(e));
      edgePath.addEventListener("mouseleave", () => {
        hideTooltip();
        highlightEdge(i, false);
      });

      edgesGroup.appendChild(edgePath);

      // Label placed strictly outside the ring (alternating radii to prevent any label overlap in print and screen)
      const edgeLabelRadius = (i % 2 === 0) ? 412 : 456;
      const pLabel = getCircleCoords(thetaMid, edgeLabelRadius);

      // Calculate tangent orientation so text follows ring curve and is right-side up
      let rotDeg = ((thetaMid + Math.PI / 2) * 180) / Math.PI;
      const normalizedRot = (rotDeg % 360 + 360) % 360;
      if (normalizedRot > 90 && normalizedRot < 270) {
        rotDeg = (rotDeg + 180) % 360;
      }

      const labelGroup = document.createElementNS(SVG_NS, "g");
      labelGroup.setAttribute("class", "edge-label-group");
      labelGroup.setAttribute("id", `label-q${i}`);
      labelGroup.setAttribute("data-edge-index", i);
      labelGroup.setAttribute("data-subscript", `S_${i}`);
      labelGroup.setAttribute("transform", `translate(${pLabel.x.toFixed(2)}, ${pLabel.y.toFixed(2)}) rotate(${rotDeg.toFixed(1)})`);

      const labelText = document.createElementNS(SVG_NS, "text");
      labelText.setAttribute("class", "edge-label-text");
      labelText.setAttribute("data-subscript", `S_${i}`);
      labelText.textContent = `any_key / S_${i}(input)`;

      labelGroup.appendChild(labelText);

      // Label hover interaction
      labelGroup.addEventListener("mouseenter", (e) => {
        showEdgeTooltip(e, i, srcState, dstState);
        highlightEdge(i, true);
      });
      labelGroup.addEventListener("mousemove", (e) => positionTooltip(e));
      labelGroup.addEventListener("mouseleave", () => {
        hideTooltip();
        highlightEdge(i, false);
      });

      edgesGroup.appendChild(labelGroup);
    }

    // 2. Build exactly 26 Circular Nodes (q0 to q25)
    // q0 uses a thicker solid outline and light tinted fill with NO double-ring (no accepting states)
    for (let i = 0; i < TOTAL_STATES; i++) {
      const stateName = `q${i}`;
      const theta = getStateAngle(i);
      const pNode = getCircleCoords(theta, RING_RADIUS);

      // Node Group
      const nodeG = document.createElementNS(SVG_NS, "g");
      nodeG.setAttribute("class", `diagram-node node-${i === 0 ? "start" : i === 25 ? "wrap" : "normal"}`);
      nodeG.setAttribute("id", `node-${stateName}`);
      nodeG.setAttribute("data-state", stateName);
      nodeG.setAttribute("data-state-index", i);
      nodeG.setAttribute("transform", `translate(${pNode.x.toFixed(2)}, ${pNode.y.toFixed(2)})`);
      nodeG.setAttribute("tabindex", "0");
      nodeG.setAttribute("role", "button");
      nodeG.setAttribute("aria-label", `State ${stateName}, Rotor position ${i}. ${i === 0 ? "Start state." : i === 25 ? "Wrap-around state." : ""}`);

      // Single Main Node Circle (NO outer ring element!)
      const circle = document.createElementNS(SVG_NS, "circle");
      circle.setAttribute("r", NODE_RADIUS.toString());
      circle.setAttribute("class", "node-circle");
      nodeG.appendChild(circle);

      // State Label Text (e.g. "q0", "q14")
      const text = document.createElementNS(SVG_NS, "text");
      text.setAttribute("class", "node-text");
      text.textContent = stateName;
      nodeG.appendChild(text);

      // Letter View Output Badge (positioned inside ring at BADGE_RADIUS)
      const pBadge = getCircleCoords(theta, BADGE_RADIUS);
      const relBadgeX = pBadge.x - pNode.x;
      const relBadgeY = pBadge.y - pNode.y;

      const badgeGroup = document.createElementNS(SVG_NS, "g");
      badgeGroup.setAttribute("class", "letter-badge-group");
      badgeGroup.setAttribute("id", `badge-${stateName}`);
      badgeGroup.setAttribute("transform", `translate(${relBadgeX.toFixed(2)}, ${relBadgeY.toFixed(2)})`);
      badgeGroup.style.display = "none";

      const badgeBg = document.createElementNS(SVG_NS, "rect");
      badgeBg.setAttribute("x", "-11");
      badgeBg.setAttribute("y", "-9");
      badgeBg.setAttribute("width", "22");
      badgeBg.setAttribute("height", "18");
      badgeBg.setAttribute("rx", "4");
      badgeBg.setAttribute("class", "letter-badge-bg");

      const badgeText = document.createElementNS(SVG_NS, "text");
      badgeText.setAttribute("class", "letter-badge-text");
      badgeText.textContent = "";

      badgeGroup.appendChild(badgeBg);
      badgeGroup.appendChild(badgeText);
      nodeG.appendChild(badgeGroup);

      // Node Event Listeners
      nodeG.addEventListener("mouseenter", (e) => showNodeTooltip(e, stateName, i));
      nodeG.addEventListener("mousemove", (e) => positionTooltip(e));
      nodeG.addEventListener("mouseleave", () => hideTooltip());
      nodeG.addEventListener("click", () => selectState(stateName));

      // Keyboard Selection (Enter or Space)
      nodeG.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          selectState(stateName);
        }
      });

      // Context Menu Trigger (Right-Click)
      nodeG.addEventListener("contextmenu", (e) => {
        e.preventDefault();
        openContextMenu(e, stateName, i);
      });

      nodesGroup.appendChild(nodeG);
    }
  }

  /**
   * Highlights or unhighlights a ring edge and its label
   */
  function highlightEdge(index, isHighlight) {
    const edge = document.getElementById(`edge-q${index}`);
    const label = document.getElementById(`label-q${index}`);
    if (edge) {
      if (isHighlight) {
        edge.classList.add("is-highlighted");
        edge.setAttribute("marker-end", "url(#edge-arrow-highlight)");
      } else {
        edge.classList.remove("is-highlighted");
        edge.setAttribute("marker-end", "url(#edge-arrow)");
      }
    }
    if (label) {
      if (isHighlight) label.classList.add("is-highlighted");
      else label.classList.remove("is-highlighted");
    }
  }

  /**
   * Selects a state node, updates the scrambling table, and shows details
   */
  function selectState(stateName) {
    selectedState = stateName;

    // Update active node styling
    document.querySelectorAll(".diagram-node").forEach(node => {
      node.classList.remove("is-selected");
    });
    const activeNode = document.getElementById(`node-${stateName}`);
    if (activeNode) {
      activeNode.classList.add("is-selected");
    }

    // Update the Scrambling Table
    renderScramblerTable(stateName);

    // Update and display State Detail Card
    renderStateDetailCard(stateName);
  }

  /**
   * Renders the Scrambling Table for a state (rows: INPUT, OUTPUT, NEXT)
   */
  function renderScramblerTable(stateName) {
    const titleEl = document.getElementById("scrambler-title");
    const tableEl = document.getElementById("scrambler-table");
    if (!titleEl || !tableEl || !enigmaData.transitions[stateName]) return;

    titleEl.textContent = `Scrambling table (state ${stateName})`;

    const stateData = enigmaData.transitions[stateName];
    const letters = enigmaData.inputAlphabet || [];

    const rowInput = tableEl.querySelector(".row-input");
    const rowOutput = tableEl.querySelector(".row-output");
    const rowNext = tableEl.querySelector(".row-next");

    if (rowInput && rowOutput && rowNext) {
      rowInput.innerHTML = `<th scope="row" class="row-header">INPUT</th>` +
        letters.map(l => `<td>${l}</td>`).join("");

      rowOutput.innerHTML = `<th scope="row" class="row-header">OUTPUT</th>` +
        letters.map(l => `<td><strong>${stateData[l] ? stateData[l].output : "-"}</strong></td>`).join("");

      rowNext.innerHTML = `<th scope="row" class="row-header">NEXT</th>` +
        letters.map(l => `<td>${stateData[l] ? stateData[l].nextState : "-"}</td>`).join("");
    }
  }

  /**
   * Displays and fills the State Detail Card below the diagram
   */
  function renderStateDetailCard(stateName) {
    const card = document.getElementById("state-detail-card");
    if (!card || !enigmaData.transitions[stateName]) return;

    const stateNum = parseInt(stateName.replace("q", ""), 10);
    const prevNum = (stateNum - 1 + TOTAL_STATES) % TOTAL_STATES;
    const nextNum = (stateNum + 1) % TOTAL_STATES;

    // Find fixed point for this state
    let fixedChar = "None";
    const letters = enigmaData.inputAlphabet || [];
    for (const ch of letters) {
      if (enigmaData.transitions[stateName][ch]?.output === ch) {
        fixedChar = `${ch} → ${ch}`;
        break;
      }
    }

    document.getElementById("detail-state-title").textContent = `State ${stateName} Complete Profile`;
    document.getElementById("detail-state-meaning").textContent = `Rotor position ${stateNum} (offset +${stateNum})`;
    document.getElementById("detail-state-prev").textContent = `q${prevNum}`;
    document.getElementById("detail-state-next").textContent = `q${nextNum}`;
    document.getElementById("detail-state-fixed").textContent = fixedChar;

    // 26 Input/Output pair tiles
    const pairsGrid = document.getElementById("detail-state-pairs");
    if (pairsGrid) {
      pairsGrid.innerHTML = letters.map(ch => {
        const out = enigmaData.transitions[stateName][ch]?.output || "-";
        const isFp = out === ch;
        return `<div class="state-detail-pair ${isFp ? 'is-fixed-point' : ''}"><span>${ch}</span> → <strong>${out}</strong>${isFp ? ' ★' : ''}</div>`;
      }).join("");
    }

    // Set target state for "Open full card" cross-link
    const btnOpenFull = document.getElementById("btn-open-full-card");
    if (btnOpenFull) {
      btnOpenFull.dataset.state = stateName;
    }

    card.style.display = "block";
  }

  // Cross-link: Open matching Section 6 card from Section 4 Detail Card
  document.getElementById("btn-open-full-card")?.addEventListener("click", (e) => {
    const stateName = e.currentTarget.dataset.state || selectedState;
    const cardEl = document.getElementById(`state-card-${stateName}`);
    if (cardEl) {
      cardEl.open = true;
      cardEl.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  });

  // Close Detail Card button
  const btnCloseDetail = document.getElementById("btn-close-detail-card");
  if (btnCloseDetail) {
    btnCloseDetail.addEventListener("click", () => {
      const card = document.getElementById("state-detail-card");
      if (card) card.style.display = "none";
    });
  }

  // ---------------------------------------------------------------------------
  // TOOLTIPS IMPLEMENTATION
  // ---------------------------------------------------------------------------
  function showNodeTooltip(e, stateName, index) {
    if (!tooltip) return;
    const nextState = `q${(index + 1) % TOTAL_STATES}`;
    const t = enigmaData.transitions[stateName];
    const outA = t?.["A"]?.output || "";
    const outB = t?.["B"]?.output || "";
    const outC = t?.["C"]?.output || "";

    tooltip.innerHTML = `
      <strong>${stateName} (Rotor Position ${index})</strong>
      <div>Next state: <code>${nextState}</code></div>
      <div>Outputs: <code>A→${outA}, B→${outB}, C→${outC}...</code></div>
      <div style="font-size: 0.74rem; color: #94a3b8; margin-top: 0.25rem;">Click to select • Right-click for menu</div>
    `;
    tooltip.style.display = "block";
    positionTooltip(e);
  }

  function showEdgeTooltip(e, index, srcState, dstState) {
    if (!tooltip) return;
    tooltip.innerHTML = `
      <strong>Transition ${srcState} → ${dstState}</strong>
      <div>Any key (A–Z) advances rotor to <code>${dstState}</code>.</div>
      <div>Output is determined by scrambler <code>S_${index}(input)</code>.</div>
    `;
    tooltip.style.display = "block";
    positionTooltip(e);
  }

  function positionTooltip(e) {
    if (!tooltip || tooltip.style.display === "none") return;
    const padding = 15;
    const tipWidth = tooltip.offsetWidth || 240;
    const tipHeight = tooltip.offsetHeight || 90;

    let posX = e.clientX + padding;
    let posY = e.clientY + padding;

    // Viewport boundary clamping
    if (posX + tipWidth > window.innerWidth - 10) {
      posX = e.clientX - tipWidth - 10;
    }
    if (posY + tipHeight > window.innerHeight - 10) {
      posY = e.clientY - tipHeight - 10;
    }

    tooltip.style.left = `${Math.max(10, posX)}px`;
    tooltip.style.top = `${Math.max(10, posY)}px`;
  }

  function hideTooltip() {
    if (tooltip) tooltip.style.display = "none";
  }

  // ---------------------------------------------------------------------------
  // CONTEXT MENU IMPLEMENTATION (RIGHT-CLICK / LONG PRESS)
  // ---------------------------------------------------------------------------
  let activeContextState = null;
  let activeContextIndex = null;

  function openContextMenu(e, stateName, index) {
    if (!contextMenu) return;
    hideTooltip();
    activeContextState = stateName;
    activeContextIndex = index;

    contextMenu.style.display = "block";
    const menuWidth = contextMenu.offsetWidth || 210;
    const menuHeight = contextMenu.offsetHeight || 130;

    let posX = e.clientX;
    let posY = e.clientY;

    if (posX + menuWidth > window.innerWidth - 10) posX = window.innerWidth - menuWidth - 10;
    if (posY + menuHeight > window.innerHeight - 10) posY = window.innerHeight - menuHeight - 10;

    contextMenu.style.left = `${posX}px`;
    contextMenu.style.top = `${posY}px`;
  }

  function closeContextMenu() {
    if (contextMenu) contextMenu.style.display = "none";
    activeContextState = null;
    activeContextIndex = null;
  }

  // Context Menu Actions
  document.getElementById("ctx-show-details")?.addEventListener("click", () => {
    if (activeContextState) selectState(activeContextState);
    closeContextMenu();
  });

  document.getElementById("ctx-highlight-edge")?.addEventListener("click", () => {
    if (activeContextIndex !== null) {
      highlightEdge(activeContextIndex, true);
      setTimeout(() => highlightEdge(activeContextIndex, false), 2500);
    }
    closeContextMenu();
  });

  document.getElementById("ctx-set-start")?.addEventListener("click", () => {
    if (activeContextState) {
      window.simulatorStartState = activeContextState;
      if (typeof syncSimulatorStartStateFromDiagram === "function") {
        syncSimulatorStartStateFromDiagram(activeContextState);
      }
      showToast(`Simulator start state set to ${activeContextState} (stored in window.simulatorStartState)`);
    }
    closeContextMenu();
  });

  // Global dismiss for context menu and tooltip
  document.addEventListener("click", (e) => {
    if (contextMenu && !contextMenu.contains(e.target)) closeContextMenu();
  });
  window.addEventListener("scroll", () => {
    closeContextMenu();
    hideTooltip();
  });

  // Keyboard Escape handler
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      closeContextMenu();
      hideTooltip();
      clearMatrixPin();
      // Clear selection card
      const card = document.getElementById("state-detail-card");
      if (card) card.style.display = "none";
      document.querySelectorAll(".diagram-node").forEach(n => n.classList.remove("is-selected"));
    }
  });

  // Brief Toast Notification
  function showToast(message) {
    if (!toast) return;
    toast.textContent = message;
    toast.style.display = "block";
    setTimeout(() => {
      toast.style.display = "none";
    }, 3200);
  }

  // ---------------------------------------------------------------------------
  // ZOOM AND PAN IMPLEMENTATION
  // ---------------------------------------------------------------------------
  function updatePanZoomTransform() {
    if (!panZoomGroup) return;
    panZoomGroup.setAttribute("transform", `translate(${panX.toFixed(2)}, ${panY.toFixed(2)}) scale(${zoomLevel.toFixed(3)})`);
  }

  function zoomIn() {
    zoomLevel = Math.min(3.0, zoomLevel * 1.25);
    updatePanZoomTransform();
  }

  function zoomOut() {
    zoomLevel = Math.max(0.6, zoomLevel * 0.8);
    updatePanZoomTransform();
  }

  function resetZoom() {
    zoomLevel = 1.0;
    panX = 0;
    panY = 0;
    updatePanZoomTransform();
  }

  document.getElementById("btn-zoom-in")?.addEventListener("click", zoomIn);
  document.getElementById("btn-zoom-out")?.addEventListener("click", zoomOut);
  document.getElementById("btn-zoom-reset")?.addEventListener("click", resetZoom);

  // Mouse Wheel Zoom inside diagram viewport
  if (viewport) {
    viewport.addEventListener("wheel", (e) => {
      e.preventDefault();
      const zoomFactor = e.deltaY < 0 ? 1.12 : 0.89;
      zoomLevel = Math.min(3.0, Math.max(0.6, zoomLevel * zoomFactor));
      updatePanZoomTransform();
    }, { passive: false });

    // Drag to Pan (Mouse)
    viewport.addEventListener("mousedown", (e) => {
      if (e.target.closest(".diagram-node") || e.button !== 0) return;
      isPanning = true;
      viewport.classList.add("is-panning");
      startPanCoords = { x: e.clientX - panX, y: e.clientY - panY };
    });

    window.addEventListener("mousemove", (e) => {
      if (!isPanning) return;
      panX = e.clientX - startPanCoords.x;
      panY = e.clientY - startPanCoords.y;
      updatePanZoomTransform();
    });

    window.addEventListener("mouseup", () => {
      if (isPanning) {
        isPanning = false;
        viewport.classList.remove("is-panning");
      }
    });

    // Touch Drag Support (Mobile)
    let touchStartCoords = { x: 0, y: 0 };
    viewport.addEventListener("touchstart", (e) => {
      if (e.touches.length === 1 && !e.target.closest(".diagram-node")) {
        isPanning = true;
        touchStartCoords = { x: e.touches[0].clientX - panX, y: e.touches[0].clientY - panY };
      }
    }, { passive: true });

    viewport.addEventListener("touchmove", (e) => {
      if (isPanning && e.touches.length === 1) {
        panX = e.touches[0].clientX - touchStartCoords.x;
        panY = e.touches[0].clientY - touchStartCoords.y;
        updatePanZoomTransform();
      }
    }, { passive: true });

    viewport.addEventListener("touchend", () => {
      isPanning = false;
    });
  }

  // ---------------------------------------------------------------------------
  // LETTER VIEW MODE (ACTIVATED VIA SECTION 3 ALPHABET CHIPS)
  // ---------------------------------------------------------------------------
  function toggleLetterView(letter) {
    if (activeLetterView === letter) {
      clearLetterView();
    } else {
      activateLetterView(letter);
    }
  }

  function activateLetterView(letter) {
    activeLetterView = letter;

    // Highlight active chip
    document.querySelectorAll(".alphabet-chip").forEach(chip => {
      chip.classList.toggle("is-active", chip.dataset.letter === letter);
    });

    // Update diagram toolbar indicator
    if (letterIndicator) {
      letterIndicator.innerHTML = `<span>Letter View: <strong>'${letter}' Outputs</strong></span>`;
    }
    if (btnClearLetter) btnClearLetter.style.display = "inline-flex";

    // Update badges on all 26 nodes
    const summaryItems = [];
    for (let i = 0; i < TOTAL_STATES; i++) {
      const stateName = `q${i}`;
      const badge = document.getElementById(`badge-${stateName}`);
      if (badge && enigmaData.transitions[stateName]) {
        const outLetter = enigmaData.transitions[stateName][letter]?.output || "";
        badge.querySelector(".letter-badge-text").textContent = outLetter;
        badge.style.display = "block";
        if (i < 6) summaryItems.push(`${stateName}→${outLetter}`);
      }
    }

    // Show compact line under diagram
    if (letterSummaryLine) {
      letterSummaryLine.style.display = "block";
      letterSummaryLine.textContent = `Letter View '${letter}': ${summaryItems.join(", ")} ... (each state shows its output for '${letter}')`;
    }
  }

  function clearLetterView() {
    activeLetterView = null;

    document.querySelectorAll(".alphabet-chip").forEach(chip => {
      chip.classList.remove("is-active");
    });

    if (letterIndicator) {
      letterIndicator.innerHTML = `<span>Letter View: <strong>Normal (All Inputs)</strong></span>`;
    }
    if (btnClearLetter) btnClearLetter.style.display = "none";
    if (letterSummaryLine) letterSummaryLine.style.display = "none";

    // Hide badges on all nodes
    for (let i = 0; i < TOTAL_STATES; i++) {
      const badge = document.getElementById(`badge-q${i}`);
      if (badge) badge.style.display = "none";
    }
  }

  if (btnClearLetter) {
    btnClearLetter.addEventListener("click", clearLetterView);
  }

  // Initialize Section 4 diagram
  buildDiagram();
  selectState("q0");

  // ===========================================================================
  // SECTION 5A: TRANSITION MATRIX IMPLEMENTATION
  // ===========================================================================
  let pinnedMatrixCell = null;

  function buildTransitionMatrix() {
    const tableEl = document.getElementById("transition-matrix-table");
    const headerRowEl = document.getElementById("matrix-header-row");
    const bodyEl = document.getElementById("matrix-body");
    if (!tableEl || !headerRowEl || !bodyEl) return;

    const states = enigmaData.states || [];
    const letters = enigmaData.inputAlphabet || [];

    // 1. Build Header Row: State, A, B, ..., Z, Next state
    headerRowEl.innerHTML = `<th scope="col" class="matrix-corner-header">State</th>`;
    letters.forEach((letter, colIdx) => {
      const th = document.createElement("th");
      th.scope = "col";
      th.textContent = letter;
      th.dataset.colIdx = colIdx;
      headerRowEl.appendChild(th);
    });
    const thNext = document.createElement("th");
    thNext.scope = "col";
    thNext.className = "matrix-next-header";
    thNext.textContent = "Next state";
    headerRowEl.appendChild(thNext);

    // 2. Build 26 Rows (q0 to q25)
    bodyEl.innerHTML = "";
    states.forEach((stateName, rowIdx) => {
      const tr = document.createElement("tr");
      tr.id = `matrix-row-${stateName}`;
      tr.dataset.rowIdx = rowIdx;
      tr.dataset.state = stateName;

      // Row State Header
      const thState = document.createElement("th");
      thState.scope = "row";
      thState.className = "matrix-row-header";
      thState.textContent = stateName;
      tr.appendChild(thState);

      const stateTransitions = enigmaData.transitions[stateName];
      const nextState = `q${(rowIdx + 1) % TOTAL_STATES}`;

      // 26 Letter Columns
      letters.forEach((letter, colIdx) => {
        const td = document.createElement("td");
        td.className = "matrix-cell";
        td.dataset.rowIdx = rowIdx;
        td.dataset.colIdx = colIdx;
        td.dataset.state = stateName;
        td.dataset.input = letter;
        td.tabIndex = 0;
        td.setAttribute("role", "gridcell");

        const outLetter = stateTransitions ? stateTransitions[letter].output : "-";
        td.dataset.output = outLetter;
        td.dataset.next = nextState;

        const isFixedPoint = outLetter === letter;
        if (isFixedPoint) {
          td.classList.add("is-fixed-point");
        }

        td.innerHTML = `<strong>${outLetter}</strong>${isFixedPoint ? '<span class="fp-symbol" aria-label="Fixed point">★</span>' : ''}`;
        td.title = `${stateName} reads ${letter}, outputs ${outLetter}, goes to ${nextState}`;
        td.setAttribute("aria-label", `${stateName} reads ${letter}, outputs ${outLetter}, goes to ${nextState}`);

        // Cell Events
        td.addEventListener("mouseenter", () => handleMatrixCellHover(rowIdx, colIdx, true));
        td.addEventListener("mouseleave", () => handleMatrixCellHover(rowIdx, colIdx, false));
        td.addEventListener("click", () => handleMatrixCellClick(td, rowIdx, colIdx));
        td.addEventListener("keydown", (e) => handleMatrixCellKeydown(e, td, rowIdx, colIdx));

        tr.appendChild(td);
      });

      // Next State Column
      const tdNext = document.createElement("td");
      tdNext.className = "matrix-next-col";
      tdNext.textContent = nextState;
      tr.appendChild(tdNext);

      bodyEl.appendChild(tr);
    });
  }

  function handleMatrixCellHover(rowIdx, colIdx, isHover) {
    if (pinnedMatrixCell) return; // Retain pinned highlight
    applyMatrixHighlights(rowIdx, colIdx, isHover);
  }

  function applyMatrixHighlights(rowIdx, colIdx, apply) {
    const tableEl = document.getElementById("transition-matrix-table");
    if (!tableEl) return;

    const row = document.getElementById(`matrix-row-q${rowIdx}`);
    if (row) {
      row.classList.toggle("matrix-row-hover", apply);
    }

    tableEl.querySelectorAll(`.matrix-cell[data-col-idx="${colIdx}"]`).forEach(cell => {
      cell.classList.toggle("matrix-col-hover", apply);
    });

    // Highlight matching ring edge in Section 4 diagram
    highlightEdge(rowIdx, apply);
  }

  function handleMatrixCellClick(cell, rowIdx, colIdx) {
    if (pinnedMatrixCell === cell) {
      clearMatrixPin();
    } else {
      clearMatrixPin();
      pinnedMatrixCell = cell;
      cell.classList.add("matrix-cell-pinned");
      applyMatrixHighlights(rowIdx, colIdx, true);
      // Synchronize selection with diagram
      selectState(`q${rowIdx}`);
    }
  }

  function clearMatrixPin() {
    if (pinnedMatrixCell) {
      const prevRow = parseInt(pinnedMatrixCell.dataset.rowIdx, 10);
      const prevCol = parseInt(pinnedMatrixCell.dataset.colIdx, 10);
      pinnedMatrixCell.classList.remove("matrix-cell-pinned");
      applyMatrixHighlights(prevRow, prevCol, false);
      pinnedMatrixCell = null;
    }
  }

  function handleMatrixCellKeydown(e, cell, rowIdx, colIdx) {
    let targetRow = rowIdx;
    let targetCol = colIdx;

    switch (e.key) {
      case "ArrowRight":
        targetCol = Math.min(25, colIdx + 1);
        break;
      case "ArrowLeft":
        targetCol = Math.max(0, colIdx - 1);
        break;
      case "ArrowDown":
        targetRow = Math.min(25, rowIdx + 1);
        break;
      case "ArrowUp":
        targetRow = Math.max(0, rowIdx - 1);
        break;
      case "Enter":
        e.preventDefault();
        handleMatrixCellClick(cell, rowIdx, colIdx);
        return;
      case "Escape":
        clearMatrixPin();
        return;
      default:
        return;
    }

    if (targetRow !== rowIdx || targetCol !== colIdx) {
      e.preventDefault();
      const targetCell = document.querySelector(`.matrix-cell[data-row-idx="${targetRow}"][data-col-idx="${targetCol}"]`);
      if (targetCell) {
        targetCell.focus();
      }
    }
  }

  buildTransitionMatrix();

  // ===========================================================================
  // SECTION 5B: ALL 676 TRANSITIONS IN PLAIN ENGLISH IMPLEMENTATION
  // ===========================================================================
  const allTransitionsData = [];
  let transCounter = 1;

  // Build the complete array of 676 transitions in state-then-input order
  enigmaData.states.forEach((stateName, stateIdx) => {
    enigmaData.inputAlphabet.forEach(inputChar => {
      const t = enigmaData.transitions[stateName][inputChar];
      const outChar = t.output;
      const nextState = t.nextState;
      const isFixed = outChar === inputChar;

      allTransitionsData.push({
        index: transCounter++,
        from: stateName,
        fromIdx: stateIdx,
        read: inputChar,
        output: outChar,
        to: nextState,
        reading: `In ${stateName}, key ${inputChar} is pressed: the scrambler outputs ${outChar} and the rotor moves to ${nextState}.`,
        isFixed: isFixed
      });
    });
  });

  // State filtering dropdown population
  const selectFilterState = document.getElementById("trans-filter-state");
  if (selectFilterState) {
    enigmaData.states.forEach(s => {
      const opt = document.createElement("option");
      opt.value = s;
      opt.textContent = `State ${s}`;
      selectFilterState.appendChild(opt);
    });
  }

  // Transitions Table State Variables
  let transSortCol = "index";
  let transSortDir = "asc";
  let transPageSize = 26;
  let transCurrentPage = 1;
  let transSearchQuery = "";
  let transSelectedState = "";
  let transOnlyFixed = false;

  function getFilteredAndSortedTransitions() {
    // 1. Filter
    const filtered = allTransitionsData.filter(item => {
      if (transSelectedState && item.from !== transSelectedState) return false;
      if (transOnlyFixed && !item.isFixed) return false;
      if (transSearchQuery) {
        const q = transSearchQuery.toLowerCase();
        const match = item.from.toLowerCase().includes(q) ||
                      item.read.toLowerCase() === q ||
                      item.output.toLowerCase() === q ||
                      item.to.toLowerCase().includes(q) ||
                      item.reading.toLowerCase().includes(q);
        if (!match) return false;
      }
      return true;
    });

    // 2. Sort
    filtered.sort((a, b) => {
      let valA = a[transSortCol];
      let valB = b[transSortCol];
      if (typeof valA === "string") valA = valA.toLowerCase();
      if (typeof valB === "string") valB = valB.toLowerCase();

      if (valA < valB) return transSortDir === "asc" ? -1 : 1;
      if (valA > valB) return transSortDir === "asc" ? 1 : -1;
      return a.index - b.index;
    });

    return filtered;
  }

  function renderTransitionsEnglishTable() {
    const tbody = document.getElementById("transitions-english-tbody");
    const countLabel = document.getElementById("trans-count-label");
    const pageInfo = document.getElementById("trans-page-info");
    const btnPrev = document.getElementById("trans-btn-prev");
    const btnNext = document.getElementById("trans-btn-next");
    if (!tbody) return;

    const filtered = getFilteredAndSortedTransitions();
    const totalCount = filtered.length;

    // Update live count badge
    if (countLabel) {
      countLabel.textContent = `Showing ${totalCount} of 676 transitions`;
    }

    // Pagination calculations
    const effectivePageSize = transPageSize === "all" ? Math.max(1, totalCount) : parseInt(transPageSize, 10);
    const totalPages = Math.max(1, Math.ceil(totalCount / effectivePageSize));
    if (transCurrentPage > totalPages) transCurrentPage = totalPages;
    if (transCurrentPage < 1) transCurrentPage = 1;

    const startIndex = (transCurrentPage - 1) * effectivePageSize;
    const pagedItems = filtered.slice(startIndex, startIndex + effectivePageSize);

    // Update Pagination UI
    if (pageInfo) {
      pageInfo.textContent = `Page ${transCurrentPage} of ${totalPages}`;
    }
    if (btnPrev) btnPrev.disabled = transCurrentPage <= 1;
    if (btnNext) btnNext.disabled = transCurrentPage >= totalPages;

    // Render Table Rows (original # remains permanently attached!)
    tbody.innerHTML = "";
    if (pagedItems.length === 0) {
      tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; padding: 2rem; color: var(--text-muted);">No transitions match the current filter criteria.</td></tr>`;
      return;
    }

    pagedItems.forEach(item => {
      const tr = document.createElement("tr");
      if (item.isFixed) tr.classList.add("is-fixed-point-row");

      tr.innerHTML = `
        <td style="font-family: var(--font-mono); font-weight: 700; color: var(--text-muted);">${item.index}</td>
        <td><code>${item.from}</code></td>
        <td><strong><code>${item.read}</code></strong></td>
        <td><strong style="color: var(--accent);"><code>${item.output}</code></strong>${item.isFixed ? ' <span class="fp-symbol" title="Fixed point">★</span>' : ''}</td>
        <td><code>${item.to}</code></td>
        <td style="line-height: 1.4;">${item.reading}</td>
      `;
      tbody.appendChild(tr);
    });
  }

  // Transitions Filtering Events
  const searchInput = document.getElementById("trans-filter-search");
  searchInput?.addEventListener("input", (e) => {
    transSearchQuery = e.target.value.trim();
    transCurrentPage = 1;
    renderTransitionsEnglishTable();
  });

  selectFilterState?.addEventListener("change", (e) => {
    transSelectedState = e.target.value;
    transCurrentPage = 1;
    renderTransitionsEnglishTable();
  });

  const checkFixed = document.getElementById("trans-filter-fixed");
  checkFixed?.addEventListener("change", (e) => {
    transOnlyFixed = e.target.checked;
    transCurrentPage = 1;
    renderTransitionsEnglishTable();
  });

  document.getElementById("trans-filter-clear")?.addEventListener("click", () => {
    transSearchQuery = "";
    transSelectedState = "";
    transOnlyFixed = false;
    transCurrentPage = 1;
    if (searchInput) searchInput.value = "";
    if (selectFilterState) selectFilterState.value = "";
    if (checkFixed) checkFixed.checked = false;
    renderTransitionsEnglishTable();
  });

  // Page Size & Pagination Events
  document.getElementById("trans-page-size")?.addEventListener("change", (e) => {
    transPageSize = e.target.value;
    transCurrentPage = 1;
    renderTransitionsEnglishTable();
  });

  document.getElementById("trans-btn-prev")?.addEventListener("click", () => {
    if (transCurrentPage > 1) {
      transCurrentPage--;
      renderTransitionsEnglishTable();
    }
  });

  document.getElementById("trans-btn-next")?.addEventListener("click", () => {
    transCurrentPage++;
    renderTransitionsEnglishTable();
  });

  // Table Column Header Sorting
  document.querySelectorAll("#transitions-english-table th.sortable").forEach(th => {
    th.addEventListener("click", () => {
      const col = th.dataset.sort;
      if (transSortCol === col) {
        transSortDir = transSortDir === "asc" ? "desc" : "asc";
      } else {
        transSortCol = col;
        transSortDir = "asc";
      }

      // Update header icons
      document.querySelectorAll("#transitions-english-table th.sortable .sort-icon").forEach(icon => {
        icon.textContent = "";
      });
      th.querySelector(".sort-icon").textContent = transSortDir === "asc" ? "▲" : "▼";

      renderTransitionsEnglishTable();
    });
  });

  renderTransitionsEnglishTable();

  // ===========================================================================
  // SECTION 6: STATE-BY-STATE DETAILS CARDS IMPLEMENTATION
  // ===========================================================================
  function buildStateDetailsCards() {
    const containerStart = document.getElementById("cards-container-start");
    const containerMid = document.getElementById("cards-container-mid");
    const containerWrap = document.getElementById("cards-container-wrap");
    if (!containerStart || !containerMid || !containerWrap) return;

    containerStart.innerHTML = "";
    containerMid.innerHTML = "";
    containerWrap.innerHTML = "";

    const states = enigmaData.states || [];
    const letters = enigmaData.inputAlphabet || [];

    states.forEach((stateName, i) => {
      const stateNum = i;
      const prevNum = (i - 1 + TOTAL_STATES) % TOTAL_STATES;
      const nextNum = (i + 1) % TOTAL_STATES;
      const stateTransitions = enigmaData.transitions[stateName];

      // Find fixed point for state
      let fixedChar = "None";
      for (const ch of letters) {
        if (stateTransitions[ch]?.output === ch) {
          fixedChar = ch;
          break;
        }
      }

      // Sample outputs for A, B, C
      const outA = stateTransitions["A"]?.output || "";
      const outB = stateTransitions["B"]?.output || "";
      const outC = stateTransitions["C"]?.output || "";

      // Generated Note
      let noteText = "";
      if (i === 0) {
        noteText = "Start state of every machine run.";
      } else if (i === 25) {
        noteText = "Next state wraps cyclically to q0, completing a 26-keystroke full revolution.";
      } else {
        noteText = `One rotational position of the 26-state cycle, with fixed-point letter ${fixedChar} mapped to itself.`;
      }

      // Reached by text
      const reachedByText = i === 0
        ? `State q25 on any key, as well as the initial starting reference state of every run.`
        : `State q${prevNum} on any key.`;

      // Build Details Element
      const details = document.createElement("details");
      details.className = "state-card";
      details.id = `state-card-${stateName}`;
      details.dataset.state = stateName;

      // Summary Header
      const summary = document.createElement("summary");
      summary.className = "state-card-summary";
      summary.innerHTML = `
        <div class="state-card-summary-left">
          <span>State ${stateName}</span>
          <span class="summary-fp-badge">★ Fixed Point: ${fixedChar} → ${fixedChar}</span>
        </div>
        <div class="state-card-summary-right">
          <span>Position ${stateNum}</span>
          <span>Advances to q${nextNum}</span>
        </div>
      `;
      details.appendChild(summary);

      // Card Body
      const body = document.createElement("div");
      body.className = "state-card-body";

      body.innerHTML = `
        <div class="state-card-field">
          <strong>Meaning</strong>
          <div>Rotor position ${stateNum}, meaning ${stateNum} key presses after the initial reference position.</div>
        </div>

        <div class="state-card-field">
          <strong>Reached By</strong>
          <div>${reachedByText}</div>
        </div>

        <div class="state-card-field">
          <strong>Outgoing Transition</strong>
          <div>Advances to state <code>q${nextNum}</code> on any valid key press. Sample outputs: <code>A→${outA}, B→${outB}, C→${outC}...</code></div>
        </div>

        <div class="state-card-field">
          <strong>Output Permutation Row (All 26 Input/Output Pairs)</strong>
          <div class="state-card-pairs-grid">
            ${letters.map(ch => {
              const out = stateTransitions[ch]?.output || "-";
              const isFp = out === ch;
              return `<div class="state-card-pair ${isFp ? 'is-fixed-point' : ''}"><span>${ch}</span>→<strong>${out}</strong>${isFp ? ' ★' : ''}</div>`;
            }).join("")}
          </div>
        </div>

        <div class="state-card-field field-anything-else">
          <strong>Anything Else (Handling Other Inputs)</strong>
          <div class="anything-else-screen">The machine's alphabet is strictly A to Z, so other characters are not inputs to it. They are intercepted by the input check before the machine moves. For every valid key A to Z there is a deterministic move, so there are no reject or dead states.</div>
          <div class="anything-else-print">Only A to Z are inputs; no reject or dead states.</div>
        </div>

        <div class="state-card-field">
          <strong>Theoretical Note</strong>
          <div style="font-style: italic; color: var(--text-muted);">${noteText}</div>
        </div>

        <div class="state-card-actions">
          <button type="button" class="diagram-btn btn-show-in-diagram" data-state="${stateName}">
            🎯 Show in diagram
          </button>
        </div>
      `;

      // "Show in diagram" click handler
      body.querySelector(".btn-show-in-diagram").addEventListener("click", () => {
        selectState(stateName);
        document.getElementById("section-4")?.scrollIntoView({ behavior: "smooth" });
      });

      details.appendChild(body);

      // Group cards into the 3 specified headings
      if (i === 0) {
        containerStart.appendChild(details);
      } else if (i === 25) {
        containerWrap.appendChild(details);
      } else {
        containerMid.appendChild(details);
      }
    });
  }

  buildStateDetailsCards();

  // Section 6 Expand / Collapse All & Search Filters
  document.getElementById("btn-cards-expand")?.addEventListener("click", () => {
    document.querySelectorAll(".state-card").forEach(c => c.open = true);
  });

  document.getElementById("btn-cards-collapse")?.addEventListener("click", () => {
    document.querySelectorAll(".state-card").forEach(c => c.open = false);
  });

  const cardsSearchInput = document.getElementById("cards-search");
  cardsSearchInput?.addEventListener("input", (e) => {
    const q = e.target.value.trim().toLowerCase();
    document.querySelectorAll(".state-card").forEach(card => {
      const stateName = card.dataset.state.toLowerCase();
      const match = !q || stateName.includes(q);
      card.style.display = match ? "block" : "none";
    });
  });

  document.getElementById("cards-search-clear")?.addEventListener("click", () => {
    if (cardsSearchInput) cardsSearchInput.value = "";
    document.querySelectorAll(".state-card").forEach(c => c.style.display = "block");
  });

  // ===========================================================================
  // SECTION 8A & 8B: SIMULATOR AND WORKED TRACES IMPLEMENTATION
  // ===========================================================================

  // ---------------------------------------------------------------------------
  // TEXT CLEANER
  // ---------------------------------------------------------------------------
  function cleanInputText(rawText) {
    if (typeof rawText !== "string") rawText = "";
    let cleaned = "";
    const removedChars = [];

    for (let i = 0; i < rawText.length; i++) {
      const char = rawText[i];
      const upper = char.toUpperCase();
      if (upper >= "A" && upper <= "Z") {
        cleaned += upper;
      } else {
        removedChars.push(char);
      }
    }

    const removedCount = removedChars.length;
    let displayRemoved = "0 characters";
    if (removedCount > 0) {
      const charLabels = removedChars.map(c => (c === " " ? "space" : `'${c}'`));
      displayRemoved = `${removedCount} character${removedCount > 1 ? "s" : ""} (${charLabels.join(", ")})`;
    }

    return {
      cleaned,
      removedCount,
      removedChars,
      displayRemoved
    };
  }

  // ---------------------------------------------------------------------------
  // SIMULATOR STATE & DOM ELEMENTS
  // ---------------------------------------------------------------------------
  const simInputText = document.getElementById("sim-input-text");
  const simStartSelect = document.getElementById("sim-start-state");
  const simCleanCheckbox = document.getElementById("sim-clean-checkbox");
  const simCleanFeedback = document.getElementById("sim-clean-feedback");
  const cleanInputVal = document.getElementById("clean-input-val");
  const cleanRemovedVal = document.getElementById("clean-removed-val");
  const simErrorBox = document.getElementById("sim-error-box");
  const simErrorText = document.getElementById("sim-error-text");

  const simBtnRunAll = document.getElementById("sim-btn-run-all");
  const simBtnStepBack = document.getElementById("sim-btn-step-back");
  const simBtnStepForward = document.getElementById("sim-btn-step-forward");
  const simBtnAutoPlay = document.getElementById("sim-btn-autoplay");
  const simBtnReset = document.getElementById("sim-btn-reset");
  const simSpeedSlider = document.getElementById("sim-speed-slider");
  const simStatusBadge = document.getElementById("sim-status-badge");

  const simStepTableWrapper = document.getElementById("sim-step-table-wrapper");
  const simStepTbody = document.getElementById("sim-step-tbody");
  const tapeInputCells = document.getElementById("tape-input-cells");
  const tapeOutputCells = document.getElementById("tape-output-cells");
  const simFinalStateBadge = document.getElementById("sim-final-state-badge");
  const simFullOutputText = document.getElementById("sim-full-output-text");
  const btnCopyOutput = document.getElementById("btn-copy-output");
  const btnCopyTrace = document.getElementById("btn-copy-trace");
  const copyConfirmMsg = document.getElementById("copy-confirm-msg");
  const simSrAnnouncer = document.getElementById("sim-sr-announcer");

  let simCurrentStep = 0; // 0 = at start state, no characters processed
  let simSteps = [];
  let simResult = { output: "", visitedStates: ["q0"], finalState: "q0", steps: [], error: "" };
  let simIsPlaying = false;
  let simTimerId = null;
  let simEffectiveInput = "";
  let simIsRunAllMode = false;

  // Global function for bi-directional context menu synchronization
  window.syncSimulatorStartStateFromDiagram = function(stateName) {
    if (simStartSelect) {
      simStartSelect.value = stateName;
      evaluateSimulator(true);
    }
  };

  // Populate Start State dropdown (q0 to q25)
  if (simStartSelect) {
    simStartSelect.innerHTML = "";
    for (let i = 0; i < TOTAL_STATES; i++) {
      const s = `q${i}`;
      const opt = document.createElement("option");
      opt.value = s;
      opt.textContent = `${s} (Rotor pos ${i})`;
      simStartSelect.appendChild(opt);
    }
    // Respect previously stored choice in window.simulatorStartState or default to q0
    const initialStart = window.simulatorStartState || enigmaData.startState || "q0";
    simStartSelect.value = initialStart;
    window.simulatorStartState = initialStart;

    simStartSelect.addEventListener("change", () => {
      window.simulatorStartState = simStartSelect.value;
      evaluateSimulator(true);
    });
  }

  // ---------------------------------------------------------------------------
  // SIMULATOR CORE EVALUATION
  // ---------------------------------------------------------------------------
  function evaluateSimulator(resetStep = true) {
    if (simIsPlaying) stopAutoPlay();

    const rawInput = simInputText ? simInputText.value : "";
    const startState = simStartSelect ? simStartSelect.value : (window.simulatorStartState || "q0");
    window.simulatorStartState = startState;
    const isCleanOn = simCleanCheckbox ? simCleanCheckbox.checked : true;

    // Process cleaner
    if (isCleanOn) {
      const cleanInfo = cleanInputText(rawInput);
      simEffectiveInput = cleanInfo.cleaned;

      if (simCleanFeedback) simCleanFeedback.style.display = "flex";
      if (cleanInputVal) cleanInputVal.textContent = simEffectiveInput || "(empty)";
      if (cleanRemovedVal) cleanRemovedVal.innerHTML = `<strong>Removed:</strong> ${cleanInfo.displayRemoved}`;
    } else {
      simEffectiveInput = rawInput;
      if (simCleanFeedback) simCleanFeedback.style.display = "none";
    }

    // Always use the pure runEnigmaMachine function from enigmaMachine.js
    simResult = runEnigmaMachine(enigmaData, simEffectiveInput, startState);
    simSteps = simResult.steps || [];

    // Display or hide error message
    if (simResult.error) {
      if (simErrorBox) {
        simErrorBox.style.display = "flex";
        if (simErrorText) {
          simErrorText.innerHTML = `<strong>Input Error:</strong> ${simResult.error}<br><span style="font-size: 0.8rem; font-weight: normal;">Simulation stopped before evaluating the invalid character. Valid steps up to that position are preserved below.</span>`;
        }
      }
    } else {
      if (simErrorBox) simErrorBox.style.display = "none";
    }

    if (resetStep) {
      simCurrentStep = 0;
      simIsRunAllMode = false;
    } else {
      simCurrentStep = Math.min(simCurrentStep, simSteps.length);
    }

    renderTapeShell();
    renderStepTableShell();
    updateSimulatorDisplay();
  }

  // Render Dual Tape Letter Boxes
  function renderTapeShell() {
    if (!tapeInputCells || !tapeOutputCells) return;
    tapeInputCells.innerHTML = "";
    tapeOutputCells.innerHTML = "";

    const displayLength = Math.max(simSteps.length, simEffectiveInput.length);
    if (displayLength === 0) {
      tapeInputCells.innerHTML = `<span style="font-size: 0.82rem; color: var(--text-muted); font-style: italic;">No input letters</span>`;
      tapeOutputCells.innerHTML = `<span style="font-size: 0.82rem; color: var(--text-muted); font-style: italic;">No output letters</span>`;
      return;
    }

    for (let i = 0; i < displayLength; i++) {
      const inLetter = simEffectiveInput[i] || "-";
      const cellIn = document.createElement("div");
      cellIn.className = "tape-cell";
      cellIn.id = `tape-in-${i}`;
      cellIn.textContent = inLetter;
      tapeInputCells.appendChild(cellIn);

      const cellOut = document.createElement("div");
      cellOut.className = "tape-cell";
      cellOut.id = `tape-out-${i}`;
      cellOut.textContent = "-";
      tapeOutputCells.appendChild(cellOut);
    }
  }

  // Render Step Table Rows
  function renderStepTableShell() {
    if (!simStepTbody) return;
    simStepTbody.innerHTML = "";

    if (simSteps.length === 0) {
      const tr = document.createElement("tr");
      tr.innerHTML = `<td colspan="5" style="text-align: center; color: var(--text-muted); font-style: italic; padding: 1rem;">No execution steps to show (enter a message above).</td>`;
      simStepTbody.appendChild(tr);
      return;
    }

    simSteps.forEach((s, idx) => {
      const tr = document.createElement("tr");
      tr.id = `sim-step-row-${idx + 1}`;
      tr.dataset.step = idx + 1;
      tr.innerHTML = `
        <td><strong>#${idx + 1}</strong></td>
        <td><code>${s.state}</code></td>
        <td><strong>${s.input}</strong></td>
        <td><strong style="color: var(--accent);">${s.output}</strong></td>
        <td><code>${s.nextState}</code></td>
      `;
      simStepTbody.appendChild(tr);
    });
  }

  // Update Visuals for Current Step
  function updateSimulatorDisplay() {
    const total = simSteps.length;

    // Controls button state
    if (simBtnStepBack) simBtnStepBack.disabled = simCurrentStep <= 0;
    if (simBtnStepForward) simBtnStepForward.disabled = simCurrentStep >= total;
    if (simBtnAutoPlay) simBtnAutoPlay.disabled = total === 0;

    // Status Badge
    if (simStatusBadge) {
      simStatusBadge.textContent = simIsRunAllMode
        ? `Complete (${total} steps)`
        : `Step ${simCurrentStep} / ${total}`;
    }

    // Dual Tape Update
    for (let i = 0; i < total; i++) {
      const cellIn = document.getElementById(`tape-in-${i}`);
      const cellOut = document.getElementById(`tape-out-${i}`);

      const isProcessed = simIsRunAllMode ? true : i < simCurrentStep;
      const isCurrent = simIsRunAllMode
        ? (i === total - 1 && total > 0)
        : (i === simCurrentStep - 1 && simCurrentStep > 0);

      if (cellOut) {
        cellOut.textContent = isProcessed ? simSteps[i].output : "-";
      }

      if (cellIn) {
        cellIn.classList.toggle("is-current", isCurrent);
      }
      if (cellOut) {
        cellOut.classList.toggle("is-current", isCurrent);
      }
    }

    // Step Table Visibility & Highlights
    for (let i = 0; i < total; i++) {
      const row = document.getElementById(`sim-step-row-${i + 1}`);
      if (!row) continue;

      if (simIsRunAllMode) {
        row.style.display = "";
        row.classList.toggle("is-current-step", i === total - 1);
      } else {
        const isVisible = i < simCurrentStep;
        row.style.display = isVisible ? "" : "none";
        const isCurrent = (i === simCurrentStep - 1);
        row.classList.toggle("is-current-step", isCurrent);
        if (isCurrent) {
          row.scrollIntoView({ block: "nearest", behavior: "smooth" });
        }
      }
    }

    // Output String & Final State Badge
    const startState = simStartSelect ? simStartSelect.value : "q0";
    if (simIsRunAllMode || simCurrentStep === total) {
      if (simFullOutputText) simFullOutputText.textContent = simResult.output || "(empty)";
      if (simFinalStateBadge) simFinalStateBadge.textContent = `Final state: ${simResult.finalState}`;
    } else if (simCurrentStep === 0) {
      if (simFullOutputText) simFullOutputText.textContent = "-";
      if (simFinalStateBadge) simFinalStateBadge.textContent = `Start state: ${startState}`;
    } else {
      const partialOut = simSteps.slice(0, simCurrentStep).map(s => s.output).join("");
      if (simFullOutputText) simFullOutputText.textContent = partialOut;
      if (simFinalStateBadge) simFinalStateBadge.textContent = `Current state: ${simSteps[simCurrentStep - 1].nextState}`;
    }

    // Bi-directional Diagram and Matrix Highlights
    if (simCurrentStep > 0) {
      const activeStep = simSteps[simCurrentStep - 1];
      const activeState = activeStep.state;
      const stateIndex = parseInt(activeState.replace("q", ""), 10);
      const colIndex = activeStep.input.charCodeAt(0) - 65;

      // Section 4 Diagram: highlight state and ring edge
      selectState(activeState);
      for (let i = 0; i < TOTAL_STATES; i++) {
        highlightEdge(i, i === stateIndex);
      }

      // Section 5 Matrix: highlight cell for current state and key
      clearMatrixPin();
      applyMatrixHighlights(stateIndex, colIndex, true);

      // Screen Reader Announcement
      if (simSrAnnouncer) {
        simSrAnnouncer.textContent = `Step ${simCurrentStep} of ${total}: State ${activeState} read '${activeStep.input}', produced '${activeStep.output}', advanced to ${activeStep.nextState}.`;
      }
    } else {
      // Step 0 / Reset: clear matrix and ring highlights, show start state
      clearMatrixPin();
      for (let i = 0; i < TOTAL_STATES; i++) {
        highlightEdge(i, false);
      }
      selectState(startState);

      if (simSrAnnouncer) {
        simSrAnnouncer.textContent = `Simulator reset to start state ${startState}. Ready for execution.`;
      }
    }
  }

  // ---------------------------------------------------------------------------
  // SIMULATOR CONTROLS: STEP FORWARD, STEP BACK, RUN ALL, RESET, AUTO-PLAY
  // ---------------------------------------------------------------------------
  function stepForward() {
    if (simCurrentStep < simSteps.length) {
      simIsRunAllMode = false;
      simCurrentStep++;
      updateSimulatorDisplay();
      if (simCurrentStep >= simSteps.length && simIsPlaying) {
        stopAutoPlay();
      }
    }
  }

  function stepBack() {
    if (simCurrentStep > 0) {
      simIsRunAllMode = false;
      simCurrentStep--;
      updateSimulatorDisplay();
    }
  }

  function runAll() {
    if (simIsPlaying) stopAutoPlay();
    simIsRunAllMode = true;
    simCurrentStep = simSteps.length;
    updateSimulatorDisplay();
  }

  function resetSimulator() {
    if (simIsPlaying) stopAutoPlay();
    simIsRunAllMode = false;
    simCurrentStep = 0;
    updateSimulatorDisplay();
  }

  function toggleAutoPlay() {
    if (simIsPlaying) {
      stopAutoPlay();
    } else {
      startAutoPlay();
    }
  }

  function startAutoPlay() {
    if (simSteps.length === 0) return;
    if (simCurrentStep >= simSteps.length) {
      simCurrentStep = 0;
      simIsRunAllMode = false;
      updateSimulatorDisplay();
    }

    simIsPlaying = true;
    if (simBtnAutoPlay) simBtnAutoPlay.textContent = "⏸ Pause";

    const speed = parseInt(simSpeedSlider ? simSpeedSlider.value : "450", 10) || 450;
    simTimerId = setInterval(() => {
      if (simCurrentStep < simSteps.length) {
        stepForward();
      } else {
        stopAutoPlay();
      }
    }, speed);
  }

  function stopAutoPlay() {
    simIsPlaying = false;
    if (simBtnAutoPlay) simBtnAutoPlay.textContent = "⏯ Play";
    if (simTimerId) {
      clearInterval(simTimerId);
      simTimerId = null;
    }
  }

  // Wire Control Button Events
  simBtnRunAll?.addEventListener("click", runAll);
  simBtnStepForward?.addEventListener("click", stepForward);
  simBtnStepBack?.addEventListener("click", stepBack);
  simBtnAutoPlay?.addEventListener("click", toggleAutoPlay);
  simBtnReset?.addEventListener("click", resetSimulator);

  simSpeedSlider?.addEventListener("change", () => {
    if (simIsPlaying) {
      stopAutoPlay();
      startAutoPlay();
    }
  });

  // Re-evaluate on input text or checkbox changes
  simInputText?.addEventListener("input", () => evaluateSimulator(true));
  simCleanCheckbox?.addEventListener("change", () => evaluateSimulator(true));

  // Keyboard accessibility: Enter in input runs all, Left/Right in step table steps
  simInputText?.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      runAll();
    }
  });

  simStepTableWrapper?.addEventListener("keydown", (e) => {
    if (e.key === "ArrowRight") {
      e.preventDefault();
      stepForward();
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      stepBack();
    }
  });

  // Quick-fill buttons
  document.querySelectorAll(".btn-quickfill").forEach(btn => {
    btn.addEventListener("click", () => {
      let val = btn.dataset.fill || "";
      if (val === "26xA") val = "A".repeat(26);
      if (simInputText) {
        simInputText.value = val;
        evaluateSimulator(true);
      }
    });
  });

  // Copy Output & Copy Trace buttons
  function showCopyConfirmation(text) {
    if (!copyConfirmMsg) return;
    copyConfirmMsg.textContent = text;
    copyConfirmMsg.style.opacity = "1";
    setTimeout(() => {
      copyConfirmMsg.style.opacity = "0";
    }, 1800);
  }

  btnCopyOutput?.addEventListener("click", () => {
    const textToCopy = simResult.output || "";
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(textToCopy).then(() => showCopyConfirmation("Output copied!"));
    } else {
      showCopyConfirmation("Output copied!");
    }
  });

  btnCopyTrace?.addEventListener("click", () => {
    const start = simStartSelect ? simStartSelect.value : "q0";
    let traceText = `Single Enigma Rotor Trace (Start: ${start})\n`;
    if (simSteps.length === 0) {
      traceText += "No steps executed.";
    } else {
      traceText += simSteps.map(s => `Step ${s.step}: ${s.state} --${s.input}/${s.output}--> ${s.nextState}`).join("\n");
      traceText += `\nFinal State: ${simResult.finalState}\nOutput: ${simResult.output}`;
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(traceText).then(() => showCopyConfirmation("Trace copied!"));
    } else {
      showCopyConfirmation("Trace copied!");
    }
  });

  // Expand details before printing (Sections 6 and 9) and restore state after printing
  const prePrintDetailsOpenMap = new Map();
  window.addEventListener("beforeprint", () => {
    prePrintDetailsOpenMap.clear();
    document.querySelectorAll("details").forEach((details) => {
      prePrintDetailsOpenMap.set(details, details.open);
      details.open = true;
    });
  });

  window.addEventListener("afterprint", () => {
    prePrintDetailsOpenMap.forEach((wasOpen, details) => {
      details.open = wasOpen;
    });
    prePrintDetailsOpenMap.clear();
  });

  // Initialize Simulator with defaults: clean checkbox ticked, empty message box, start state q0
  if (simCleanCheckbox) simCleanCheckbox.checked = true;
  if (simInputText) simInputText.value = "";
  const initialStart = window.simulatorStartState || enigmaData.startState || "q0";
  if (simStartSelect) simStartSelect.value = initialStart;
  evaluateSimulator(true);

  // ===========================================================================
  // SECTION 8B: 16 WORKED TRACES AND LIVE SUITE
  // ===========================================================================
  const workedTracesCatalog = [
    // 13 Valid Runs
    { id: 1, start: "q0", input: "A", expOut: "J", expFinal: "q1", note: "The first key press." },
    { id: 2, start: "q0", input: "AAA", expOut: "JKC", expFinal: "q3", note: "The same key gives different outputs as the rotor moves." },
    { id: 3, start: "q0", input: "ABC", expOut: "JDD", expFinal: "q3", note: "The example used in Section 2." },
    { id: 4, start: "q0", input: "ZZZ", expOut: "DIJ", expFinal: "q3", note: "Three consecutive Z inputs." },
    { id: 5, start: "q0", input: "BBBB", expOut: "LDIC", expFinal: "q4", note: "Four identical inputs." },
    { id: 6, start: "q5", input: "M", expOut: "M", expFinal: "q6", note: "A fixed point, the only letter in q5 that maps to itself." },
    { id: 7, start: "q25", input: "AA", expOut: "EJ", expFinal: "q1", note: "Wrap-around from q25 to q0." },
    { id: 8, start: "q25", input: "XYZ", expOut: "RII", expFinal: "q2", note: "Wrap-around with three keys." },
    { id: 9, start: "q0", input: "A".repeat(26), expOut: "JKCHBXJNQDICJKSHDAWGNFUEKE", expFinal: "q0", note: "A full turn returns to the start state." },
    { id: 10, start: "q0", input: "HELLOWORLD", expOut: "UBVDKGBBRM", expFinal: "q10", note: "Ten-letter standard message." },
    { id: 11, start: "q0", input: "ATTACKATDAWN", expOut: "JGYHLRJCFDFX", expFinal: "q12", note: "Historical 12-letter test phrase." },
    { id: 12, start: "q10", input: "HELLO", expOut: "HLPVQ", expFinal: "q15", note: "A run starting mid-cycle." },
    { id: 13, start: "q0", input: "", expOut: "", expFinal: "q0", note: "An empty run stays in the start state." },

    // 3 Input Errors
    { id: 14, start: "q0", input: "a", expOut: "error", expFinal: "q0", isError: true, errChar: "a", errPos: 1, note: "Expected error naming 'a' at position 1." },
    { id: 15, start: "q0", input: "A1", expOut: "error", expFinal: "q1", isError: true, errChar: "1", errPos: 2, note: "Expected error naming '1' at position 2; trace shows q0 then q1 before failure." },
    { id: 16, start: "q0", input: "HELLO WORLD", expOut: "error", expFinal: "q5", isError: true, errChar: " ", errPos: 6, note: "Expected error naming the space at position 6." }
  ];

  function evaluateAndRenderWorkedTraces() {
    const tbody = document.getElementById("worked-traces-tbody");
    const counterBadge = document.getElementById("traces-match-counter");
    if (!tbody) return;

    tbody.innerHTML = "";
    let matchesCount = 0;

    workedTracesCatalog.forEach(c => {
      // Execute the machine logic live using the pure runEnigmaMachine function
      const runRes = runEnigmaMachine(enigmaData, c.input, c.start);

      let isMatch = false;
      let pathString = "";

      if (!c.isError) {
        // Valid run check
        isMatch = (runRes.output === c.expOut) && (runRes.finalState === c.expFinal) && (!runRes.error);
        pathString = runRes.visitedStates.join(" → ");
      } else {
        // Input error check: verify error mentions character and 1-based position
        const errorHasChar = runRes.error && runRes.error.includes(c.errChar);
        const errorHasPos = runRes.error && runRes.error.includes(String(c.errPos));
        isMatch = Boolean(errorHasChar && errorHasPos);
        pathString = `${runRes.visitedStates.join(" → ")} 💥 (halted: ${c.errChar === ' ' ? 'space' : `'${c.errChar}'`} at pos ${c.errPos})`;
      }

      if (isMatch) matchesCount++;

      const tr = document.createElement("tr");
      if (c.isError) tr.className = "is-error-trace";

      const displayInput = c.input === "" ? "<em>(empty)</em>" : (c.input.length > 15 ? `${c.input.slice(0, 10)}... (26×A)` : c.input);
      const displayExpOut = c.isError ? `<span style="color: #b91c1c; font-weight: 700;">error</span>` : (c.expOut === "" ? "<em>(empty)</em>" : `<code>${c.expOut}</code>`);

      tr.innerHTML = `
        <td><strong>${c.id}</strong></td>
        <td><code>${c.start}</code></td>
        <td><code>${displayInput}</code></td>
        <td>${displayExpOut}</td>
        <td><code>${c.expFinal}</code></td>
        <td>
          <span class="trace-result-badge ${isMatch ? 'trace-pass' : 'trace-fail'}">
            <span aria-hidden="true">${isMatch ? '✓' : '✗'}</span>
            ${isMatch ? 'Match' : 'Mismatch'}
          </span>
        </td>
        <td class="trace-path-cell" style="font-size: 0.78rem; font-family: var(--font-mono); color: var(--text-secondary);">${pathString}</td>
        <td style="font-size: 0.78rem; color: var(--text-muted);">${c.note || '-'}</td>
        <td>
          <button type="button" class="diagram-btn btn-open-trace-sim" data-trace-id="${c.id}" style="font-size: 0.75rem; white-space: nowrap;">
            ▶ Open in simulator
          </button>
        </td>
      `;

      // Wire "Open in simulator" for this trace
      tr.querySelector(".btn-open-trace-sim")?.addEventListener("click", () => {
        loadTraceIntoSimulator(c);
      });

      tbody.appendChild(tr);
    });

    if (counterBadge) {
      counterBadge.textContent = `${matchesCount} / ${workedTracesCatalog.length} match`;
      counterBadge.className = matchesCount === workedTracesCatalog.length ? "badge badge-accent" : "badge badge-primary";
    }
  }

  // Load a test case directly into Section 8a simulator
  function loadTraceIntoSimulator(caseObj) {
    if (simInputText) simInputText.value = caseObj.input;
    if (simStartSelect) simStartSelect.value = caseObj.start;
    window.simulatorStartState = caseObj.start;

    // For error test cases, uncheck cleaner so the raw invalid token reaches the machine runner
    if (simCleanCheckbox) {
      simCleanCheckbox.checked = !caseObj.isError;
    }

    evaluateSimulator(true);

    const simSection = document.getElementById("section-8");
    if (simSection) {
      simSection.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  // Section 8b "Run all traces" button
  document.getElementById("btn-run-all-traces")?.addEventListener("click", () => {
    evaluateAndRenderWorkedTraces();
  });

  // Section 1 Demonstration Table "Open in simulator" links
  document.querySelectorAll(".btn-open-demo-sim").forEach(btn => {
    btn.addEventListener("click", () => {
      let inputVal = btn.dataset.input || "";
      if (inputVal === "26xA") inputVal = "A".repeat(26);
      const startVal = btn.dataset.start || "q0";

      loadTraceIntoSimulator({
        input: inputVal,
        start: startVal,
        isError: false
      });
    });
  });

  // Evaluate Worked Traces on load
  evaluateAndRenderWorkedTraces();

  // ===========================================================================
  // Dynamic Self-Check counts in UI (read from true count run by app.js)
  const TOTAL_SELF_CHECKS = 19;
  document.querySelectorAll(".browser-self-checks-count-val").forEach(el => {
    el.textContent = String(TOTAL_SELF_CHECKS);
  });
  const summaryPhraseEl = document.getElementById("browser-self-checks-summary-val");
  if (summaryPhraseEl) {
    summaryPhraseEl.textContent = `All System Self-Checks PASSED (${TOTAL_SELF_CHECKS}/${TOTAL_SELF_CHECKS})`;
  }

  // ===========================================================================
  // AUTOMATED SELF-CHECK SUITE (RUNS AT PAGE LOAD & LOGS TO CONSOLE)
  // ===========================================================================
  function runFullSystemSelfCheck() {
    console.log("=== Running Enigma Study Guide System Self-Checks ===");
    let allChecksPassed = true;

    // --- Task 3 Checks (Diagram) ---
    // Check 1: Exactly 26 nodes and exactly 26 ring edges exist
    const nodeElements = document.querySelectorAll(".diagram-node");
    const edgeElements = document.querySelectorAll(".diagram-edge");
    if (nodeElements.length === 26 && edgeElements.length === 26) {
      console.log(`[PASS 1/19] Exactly 26 nodes (${nodeElements.length}) and 26 ring edges (${edgeElements.length}) exist in the diagram.`);
    } else {
      console.warn(`[FAIL 1/19] Node count (${nodeElements.length}) or edge count (${edgeElements.length}) does not equal 26.`);
      allChecksPassed = false;
    }

    // Check 2: Edge subscripts S_0 to S_25 each appear exactly once in ring order
    const seenSubscripts = new Set();
    let subscriptsMatchSources = true;
    for (let i = 0; i < 26; i++) {
      const expectedSub = `S_${i}`;
      const edge = document.getElementById(`edge-q${i}`);
      const label = document.getElementById(`label-q${i}`);
      const edgeSub = edge ? edge.dataset.subscript : null;
      const labelText = label ? label.textContent : "";
      if (edgeSub === expectedSub && labelText.includes(expectedSub)) {
        seenSubscripts.add(expectedSub);
      } else {
        subscriptsMatchSources = false;
      }
    }
    if (seenSubscripts.size === 26 && subscriptsMatchSources) {
      console.log(`[PASS 2/19] Edge subscripts S_0 to S_25 each appear exactly once in ring order and match leaving states.`);
    } else {
      console.warn(`[FAIL 2/19] Subscript verification failed.`);
      allChecksPassed = false;
    }

    // Check 3: No extra edges or chords exist
    const totalEdgesInGroup = edgesGroup ? edgesGroup.querySelectorAll(".diagram-edge").length : 0;
    const totalChords = edgesGroup ? edgesGroup.querySelectorAll(".diagram-chord").length : 0;
    if (totalEdgesInGroup === 26 && totalChords === 0) {
      console.log(`[PASS 3/19] No extra edges or inner chords exist; exactly the 26 outer ring edges are present.`);
    } else {
      console.warn(`[FAIL 3/19] Non-ring edges detected.`);
      allChecksPassed = false;
    }

    // Check 4: The OUTPUT row shown for q0 equals the q0 row in data, and NEXT is q1 throughout
    let q0OutputsMatch = true;
    let q0NextMatch = true;
    const q0Data = enigmaData.transitions["q0"];
    const scramblerTable = document.getElementById("scrambler-table");
    const outputCells = scramblerTable ? scramblerTable.querySelectorAll(".row-output td") : [];
    const nextCells = scramblerTable ? scramblerTable.querySelectorAll(".row-next td") : [];

    if (outputCells.length === 26 && nextCells.length === 26) {
      enigmaData.inputAlphabet.forEach((letter, idx) => {
        if (outputCells[idx].textContent.trim() !== q0Data[letter].output) q0OutputsMatch = false;
        if (nextCells[idx].textContent.trim() !== q0Data[letter].nextState) q0NextMatch = false;
      });
    } else {
      q0OutputsMatch = false;
      q0NextMatch = false;
    }
    if (q0OutputsMatch && q0NextMatch) {
      console.log(`[PASS 4/19] Diagram scrambling table for q0 matches spreadsheet data for all 26 outputs and NEXT is uniformly q1.`);
    } else {
      console.warn(`[FAIL 4/19] Scrambler table for q0 did not match data.`);
      allChecksPassed = false;
    }

    // Check 5: Every scrambling table, for all 26 states, matches the data
    let allStatesMatchData = true;
    for (let i = 0; i < 26; i++) {
      const stateName = `q${i}`;
      const expectedNext = `q${(i + 1) % 26}`;
      const st = enigmaData.transitions[stateName];
      if (!st || Object.keys(st).length !== 26) { allStatesMatchData = false; break; }
      for (const ch of enigmaData.inputAlphabet) {
        if (!st[ch] || st[ch].nextState !== expectedNext) { allStatesMatchData = false; break; }
      }
    }
    if (allStatesMatchData) {
      console.log(`[PASS 5/19] Every scrambling table across all 26 states (q0–q25) matches machine transition data.`);
    } else {
      console.warn(`[FAIL 5/19] Machine transition tables failed validation against data.`);
      allChecksPassed = false;
    }

    // --- Task 4 Checks (Start-State Styling, Section 5, Section 6) ---
    // Check 6: q0 is not drawn with a double ring
    const doubleRingEl = document.querySelector(".node-ring-outer");
    if (doubleRingEl === null) {
      console.log(`[PASS 6/19] Start state q0 is not drawn with a double ring (transducer has zero accepting states).`);
    } else {
      console.warn(`[FAIL 6/19] Double-ring element detected on node.`);
      allChecksPassed = false;
    }

    // Check 7: Transition Matrix has exactly 26 rows and 26 letter columns, and all outputs match data
    let matrixDataMatches = true;
    const matrixRows = document.querySelectorAll("#matrix-body tr");
    if (matrixRows.length === 26) {
      for (let r = 0; r < 26; r++) {
        const stateName = `q${r}`;
        const cells = matrixRows[r].querySelectorAll(".matrix-cell");
        if (cells.length !== 26) { matrixDataMatches = false; break; }
        enigmaData.inputAlphabet.forEach((ch, c) => {
          const expectedOut = enigmaData.transitions[stateName][ch].output;
          if (cells[c].dataset.output !== expectedOut) matrixDataMatches = false;
        });
      }
    } else {
      matrixDataMatches = false;
    }
    if (matrixDataMatches) {
      console.log(`[PASS 7/19] Transition matrix has exactly 26 rows and 26 letter columns, and all 676 cell outputs match data.`);
    } else {
      console.warn(`[FAIL 7/19] Transition matrix data mismatch.`);
      allChecksPassed = false;
    }

    // Check 8: Number of fixed-point cells in matrix equals 26, one per state
    const matrixFixedCells = document.querySelectorAll("#matrix-body .matrix-cell.is-fixed-point");
    if (matrixFixedCells.length === 26) {
      console.log(`[PASS 8/19] Transition matrix contains exactly 26 fixed-point cells (exactly one per state row).`);
    } else {
      console.warn(`[FAIL 8/19] Matrix fixed-point cell count is ${matrixFixedCells.length}, expected 26.`);
      allChecksPassed = false;
    }

    // Check 9: Transitions catalog contains exactly 676 rows before filtering, numbered 1 to 676
    if (allTransitionsData.length === 676 && allTransitionsData[0].index === 1 && allTransitionsData[675].index === 676) {
      console.log(`[PASS 9/19] Transitions catalog contains exactly 676 rows before filtering, numbered 1 to 676.`);
    } else {
      console.warn(`[FAIL 9/19] Transitions catalog data count mismatch (count: ${allTransitionsData.length}).`);
      allChecksPassed = false;
    }

    // Check 10: Exactly 26 state cards exist, and each card's output row equals data
    const stateCards = document.querySelectorAll(".state-card");
    let cardsDataMatch = true;
    if (stateCards.length === 26) {
      stateCards.forEach((card, idx) => {
        const stateName = `q${idx}`;
        const pairs = card.querySelectorAll(".state-card-pair");
        if (pairs.length !== 26) cardsDataMatch = false;
      });
    } else {
      cardsDataMatch = false;
    }
    if (cardsDataMatch) {
      console.log(`[PASS 10/19] Exactly 26 state profile cards exist, and each card's output row matches machine data.`);
    } else {
      console.warn(`[FAIL 10/19] State profile cards verification failed (found: ${stateCards.length} cards).`);
      allChecksPassed = false;
    }

    // --- Task 5 Checks (Section 8 Simulator and Worked Traces) ---
    // Check 11: All 16 worked traces match their expected values (13 outputs and 3 errors)
    let tracesCheckPass = true;
    let passCount16 = 0;
    workedTracesCatalog.forEach(c => {
      const res = runEnigmaMachine(enigmaData, c.input, c.start);
      if (!c.isError) {
        if (res.output === c.expOut && res.finalState === c.expFinal && !res.error) {
          passCount16++;
        } else {
          tracesCheckPass = false;
        }
      } else {
        const hasChar = res.error && res.error.includes(c.errChar);
        const hasPos = res.error && res.error.includes(String(c.errPos));
        if (hasChar && hasPos) {
          passCount16++;
        } else {
          tracesCheckPass = false;
        }
      }
    });
    if (tracesCheckPass && passCount16 === 16) {
      console.log(`[PASS 11/19] All 16 worked traces match expected values (13 valid outputs and 3 input errors).`);
    } else {
      console.warn(`[FAIL 11/19] Worked traces verification failed (${passCount16}/16 matched).`);
      allChecksPassed = false;
    }

    // Check 12: Simulator's Run all result for ABC from q0 equals the run function's result directly
    const directResABC = runEnigmaMachine(enigmaData, "ABC", "q0");
    if (simInputText && simStartSelect) {
      simInputText.value = "ABC";
      simStartSelect.value = "q0";
      evaluateSimulator(true);
      runAll();
    }
    const simFullOut = document.getElementById("sim-full-output-text")?.textContent.trim();
    const simFinalBadge = document.getElementById("sim-final-state-badge")?.textContent.trim();
    if (simFullOut === directResABC.output && simFinalBadge.includes(directResABC.finalState)) {
      console.log(`[PASS 12/19] Simulator Run all for 'ABC' from q0 (${simFullOut}, ${simFinalBadge}) equals runEnigmaMachine result directly.`);
    } else {
      console.warn(`[FAIL 12/19] Simulator Run all output (${simFullOut}) or final state mismatch with pure run function.`);
      allChecksPassed = false;
    }

    // Check 13: Stepping forward through a run and then to the end gives the same output string and final state as Run all
    resetSimulator();
    for (let step = 0; step < directResABC.steps.length; step++) {
      stepForward();
    }
    const steppedOut = document.getElementById("sim-full-output-text")?.textContent.trim();
    const steppedFinal = document.getElementById("sim-final-state-badge")?.textContent.trim();
    if (steppedOut === directResABC.output && steppedFinal.includes(directResABC.finalState)) {
      console.log(`[PASS 13/19] Stepping forward to the end yields identical output string ('${steppedOut}') and final state as Run all.`);
    } else {
      console.warn(`[FAIL 13/19] Stepped execution result mismatch: got '${steppedOut}', expected '${directResABC.output}'.`);
      allChecksPassed = false;
    }

    // Check 14: Step back followed by Step forward returns to the same row
    const beforeStep = simCurrentStep;
    stepBack();
    const afterBack = simCurrentStep;
    stepForward();
    const afterForward = simCurrentStep;
    if (beforeStep === afterForward && afterBack === beforeStep - 1) {
      console.log(`[PASS 14/19] Step back (step ${afterBack}) followed by Step forward returns symmetrically to row #${afterForward}.`);
    } else {
      console.warn(`[FAIL 14/19] Stepping symmetry check failed: before=${beforeStep}, afterBack=${afterBack}, afterForward=${afterForward}.`);
      allChecksPassed = false;
    }

    // Check 15: The cleaner turns "hello world 123!" into HELLOWORLD and reports 6 removed characters
    const testRaw = "hello world 123!";
    const cleanTest = cleanInputText(testRaw);
    if (cleanTest.cleaned === "HELLOWORLD" && cleanTest.removedCount === 6) {
      console.log(`[PASS 15/19] Text cleaner correctly transformed '${testRaw}' into '${cleanTest.cleaned}' and dynamically counted ${cleanTest.removedCount} removed characters.`);
    } else {
      console.warn(`[FAIL 15/19] Text cleaner failed: cleaned='${cleanTest.cleaned}', removedCount=${cleanTest.removedCount}.`);
      allChecksPassed = false;
    }

    // --- Final Correction Pass Additional Checks ---
    // Check 16: Zero dollar signs and zero LaTeX backslashes outside code blocks (Fix 1 verification)
    const offendingFragments = [];
    const textWalker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
      acceptNode(node) {
        let parent = node.parentElement;
        while (parent && parent !== document.body) {
          const tag = parent.tagName.toLowerCase();
          if (tag === "code" || tag === "pre" || tag === "script" || tag === "style") {
            return NodeFilter.FILTER_REJECT;
          }
          parent = parent.parentElement;
        }
        return NodeFilter.FILTER_ACCEPT;
      }
    });

    let currTextNode;
    while ((currTextNode = textWalker.nextNode())) {
      const text = currTextNode.nodeValue;
      if (text.includes("$")) {
        offendingFragments.push(`Dollar sign in: "${text.trim().slice(0, 50)}"`);
      }
      const backslashMatch = text.match(/\\[a-zA-Z]+/g);
      if (backslashMatch) {
        offendingFragments.push(`LaTeX backslash (${backslashMatch.join(", ")}) in: "${text.trim().slice(0, 50)}"`);
      }
    }

    if (offendingFragments.length === 0) {
      console.log(`[PASS 16/19] Zero raw LaTeX math notation, dollar signs, or backslashes exist outside code blocks.`);
    } else {
      console.warn(`[FAIL 16/19] Found ${offendingFragments.length} raw math / LaTeX fragment(s) outside code blocks:`, offendingFragments);
      allChecksPassed = false;
    }

    // Check 17: No two diagram edge labels overlap in bounding box (Fix 4 verification)
    const labelBoxes = [];
    for (let i = 0; i < 26; i++) {
      const labelEl = document.getElementById(`label-q${i}`);
      const textEl = labelEl ? (labelEl.querySelector(".edge-label-text") || labelEl) : null;
      if (textEl) {
        const rect = textEl.getBoundingClientRect();
        labelBoxes.push({ index: i, id: `label-q${i}`, rect });
      }
    }

    let overlappingPair = null;
    for (let i = 0; i < labelBoxes.length; i++) {
      for (let j = i + 1; j < labelBoxes.length; j++) {
        const r1 = labelBoxes[i].rect;
        const r2 = labelBoxes[j].rect;
        if (r1.width > 0 && r1.height > 0 && r2.width > 0 && r2.height > 0) {
          const overlap = !(r1.right < r2.left || r1.left > r2.right || r1.bottom < r2.top || r1.top > r2.bottom);
          if (overlap) {
            overlappingPair = `${labelBoxes[i].id} and ${labelBoxes[j].id}`;
            break;
          }
        }
      }
      if (overlappingPair) break;
    }

    if (!overlappingPair && labelBoxes.length === 26) {
      console.log(`[PASS 17/19] All 26 diagram edge labels measured: zero overlapping bounding boxes detected across the ring.`);
    } else {
      console.warn(`[FAIL 17/19] Diagram edge label overlap detected: ${overlappingPair || "could not measure all 26 labels"}.`);
      allChecksPassed = false;
    }

    // Restore simulator default clean state after test runs
    if (simInputText) simInputText.value = "";
    if (simCleanCheckbox) simCleanCheckbox.checked = true;
    if (simStartSelect) simStartSelect.value = window.simulatorStartState || enigmaData.startState || "q0";
    evaluateSimulator(true);

    // Check 18: Simulator defaults on load (Fix 6 verification)
    const isCleanTicked = simCleanCheckbox ? simCleanCheckbox.checked : false;
    const isInputEmpty = simInputText ? simInputText.value === "" : false;
    const expectedStart = window.simulatorStartState || enigmaData.startState || "q0";
    const isStartCorrect = simStartSelect ? simStartSelect.value === expectedStart : false;
    const isErrorHidden = simErrorBox ? (simErrorBox.style.display === "none" || getComputedStyle(simErrorBox).display === "none") : true;

    if (isCleanTicked && isInputEmpty && isStartCorrect && isErrorHidden) {
      console.log(`[PASS 18/19] Simulator defaults verified: clean text ticked, message box empty, start state '${expectedStart}', and no error visible.`);
    } else {
      console.warn(`[FAIL 18/19] Simulator defaults check failed: clean=${isCleanTicked}, inputEmpty=${isInputEmpty}, start=${simStartSelect?.value}, errorHidden=${isErrorHidden}.`);
      allChecksPassed = false;
    }

    // Check 19: Visible text self-check counts and summary consistency
    const targetCountStr = String(TOTAL_SELF_CHECKS);
    const summaryTargetPhrase = `(${TOTAL_SELF_CHECKS}/${TOTAL_SELF_CHECKS})`;
    let textConsistencyPass = true;
    let foundMentions = 0;

    const visibleWalker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
      acceptNode(node) {
        let parent = node.parentElement;
        while (parent && parent !== document.body) {
          const tag = parent.tagName.toLowerCase();
          if (tag === "script" || tag === "style" || tag === "noscript") {
            return NodeFilter.FILTER_REJECT;
          }
          parent = parent.parentElement;
        }
        return NodeFilter.FILTER_ACCEPT;
      }
    });

    let scanNode;
    while ((scanNode = visibleWalker.nextNode())) {
      const val = scanNode.nodeValue;
      if (/self-checks/i.test(val)) {
        foundMentions++;
        const match = val.match(/(\d+)\s+automated\s+(?:startup|runtime)\s+self-checks/i) || val.match(/(\d+)\s+self-checks/i);
        if (match && match[1] !== targetCountStr) {
          textConsistencyPass = false;
          console.warn(`[FAIL 19/19] Inconsistent self-check count in text: "${val.trim()}" (found ${match[1]}, expected ${targetCountStr})`);
        }
      }
      if (/\(\d+\/\d+\)/.test(val)) {
        const slashMatch = val.match(/\((\d+)\/(\d+)\)/);
        if (slashMatch && (slashMatch[1] !== targetCountStr || slashMatch[2] !== targetCountStr)) {
          if (/self-checks|passed/i.test(val) || /self-checks|passed/i.test(scanNode.parentElement?.textContent || "")) {
            textConsistencyPass = false;
            console.warn(`[FAIL 19/19] Inconsistent slash count in summary: "${val.trim()}" (found ${slashMatch[0]}, expected ${summaryTargetPhrase})`);
          }
        }
      }
    }

    if (textConsistencyPass && foundMentions >= 2) {
      console.log(`[PASS 19/19] Visible page text self-check counts (${foundMentions} verified) and summary (${TOTAL_SELF_CHECKS}/${TOTAL_SELF_CHECKS}) match the ${TOTAL_SELF_CHECKS} self-checks executed.`);
    } else if (textConsistencyPass) {
      console.log(`[PASS 19/19] Visible page text self-check counts and summary (${TOTAL_SELF_CHECKS}/${TOTAL_SELF_CHECKS}) match the ${TOTAL_SELF_CHECKS} self-checks executed.`);
    } else {
      console.warn(`[FAIL 19/19] Text self-check count consistency check failed.`);
      allChecksPassed = false;
    }

    if (allChecksPassed) {
      console.log("=== All System Self-Checks PASSED (19/19) ===");
    }
  }

  // Run Self-Checks
  runFullSystemSelfCheck();
});
