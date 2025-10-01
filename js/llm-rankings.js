// File: llm-rankings.js

const biasMap = {
  anchor: "anchoring_bias",
  av: "availability_bias",
  confirm: "confirmation_bias",
  fra: "framing_bias",
  nlp: "prospect_theory_bias",
  attr: "fundamental_attribution_error_bias",
  rep: "representativeness_bias",
  inter: "interpretation_bias",
};

let llmData = {};
let selectedTemperature = "0.2";

// Load JSON and initialize checkboxes
fetch("data/data.json")
  .then((res) => res.json())
  .then((data) => {
    llmData = data;
    initTemperatureSelector();
    initCheckboxHandlers();
    initGroupToggleHandlers();
    checkAllBiasesByDefault();
    updateTableFromSelectedBiases();
  });

function initTemperatureSelector() {
  const tempSelect = document.getElementById("temp");
  if (tempSelect) {
    selectedTemperature = tempSelect.value;
    tempSelect.addEventListener("change", () => {
      selectedTemperature = tempSelect.value;
      updateTableFromSelectedBiases();
    });
  }
}

function checkAllBiasesByDefault() {
  const checkboxes = document.querySelectorAll('input[type="checkbox"]');
  checkboxes.forEach((cb) => (cb.checked = true));
}

function initCheckboxHandlers() {
  const checkboxes = document.querySelectorAll('input[type="checkbox"]');
  checkboxes.forEach((cb) => {
    cb.addEventListener("change", () => {
      updateTableFromSelectedBiases();
    });
  });
}

function initGroupToggleHandlers() {
  function toggleCheckboxesInGroup(groupClass, value) {
    const checkboxes = document.querySelectorAll(`.${groupClass} input[type="checkbox"]`);
    checkboxes.forEach((cb) => (cb.checked = value));
    updateTableFromSelectedBiases();
  }

  const groups = ["ai-area", "systems-area", "theory-area", "interdisciplinary-area"];
  groups.forEach((group) => {
    const on = document.getElementById(group.split("-")[0] + "_areas_on");
    const off = document.getElementById(group.split("-")[0] + "_areas_off");
    if (on && off) {
      on.addEventListener("click", () => toggleCheckboxesInGroup(group, true));
      off.addEventListener("click", () => toggleCheckboxesInGroup(group, false));
    }
  });
}

function updateTableFromSelectedBiases() {
  const checkboxes = document.querySelectorAll('input[type="checkbox"]');
  const selectedBiases = Array.from(checkboxes)
    .filter((cb) => cb.checked)
    .map((cb) => biasMap[cb.id])
    .filter(Boolean);

  if (selectedBiases.length === 0) {
    showEmptyMessage();
    return;
  }

  renderLLMTable(selectedBiases);
}

function showEmptyMessage() {
  const tableBody = document.querySelector("#llm-table-body");
  tableBody.innerHTML = `
    <tr>
      <td colspan="3" style="text-align: center; padding: 20px; font-style: italic;">
        Please select at least one bias category to rank models.
      </td>
    </tr>
  `;
}

function renderLLMTable(selectedBiases) {
  const tableBody = document.querySelector("#llm-table-body");
  tableBody.innerHTML = "";

  const rows = [];

  for (const [llmName, biasScores] of Object.entries(llmData)) {
    let finalScores = [];
    let levelScores = [[], [], [], [], []];

    for (const bias of selectedBiases) {
      const tempEntry = biasScores[bias]?.[selectedTemperature];
      if (tempEntry) {
        finalScores.push(tempEntry["average"]);
        for (let i = 1; i <= 5; i++) {
          levelScores[i - 1].push(tempEntry[`level_${i}`]);
        }
      }
    }

    if (finalScores.length > 0) {
      const avgFinal = finalScores.reduce((a, b) => a + b, 0) / finalScores.length;
      const avgLevels = levelScores.map(
        (level) => level.reduce((a, b) => a + b, 0) / level.length
      );

      rows.push({
        name: biasScores.displayName || llmName,  // Use displayName if it exists
        score: avgFinal,
        levels: avgLevels,
      });
    }
  }

  rows.sort((a, b) => b.score - a.score);

  rows.forEach((row, index) => {
    const id = `llm-detail-${index + 1}`;

    tableBody.innerHTML += `
  <tr class="llm-row custom-row" data-target="${id}">
    <td style="width: 8%;">${index + 1}</td>
    <td style="width: 72%;"><span class="hovertip">&#9658;</span> ${row.name}</td>
    <td style="width: 20%; text-align: right;">${row.score.toFixed(3)}</td>
  </tr>
  <tr id="${id}" class="llm-details" style="display: none;">
    <td colspan="3" style="padding: 0;">
      <table class="table table-sm" style="width: 100%; margin: 0; border-collapse: separate; border-spacing: 0;">
        <colgroup>
          <col style="width: 8%;">
          <col style="width: 72%;">
          <col style="width: 20%;">
        </colgroup>
        <thead>
          <tr>
            <td></td>
            <th>Level of Details in Prompts defined by TELeR Taxonomy</th>
            <th style="text-align: right;">Score</th>
          </tr>
        </thead>
        <tbody>
        ${(() => {
          const levelLabels = [
            "Level 1 - Minimum Details",
            "Level 2 - Moderate Details",
            "Level 3 - Moderate Listwise Details",
            "Level 4 - Significant Details + User Expectation",
            "Level 5 - Maximum Details"
          ];

          const levelsWithScores = row.levels.map((score, idx) => ({
            label: levelLabels[idx],
            score: score
          }));

          levelsWithScores.sort((a, b) => b.score - a.score);

          return levelsWithScores.map(({ label, score }) => `
            <tr>
              <td></td>
              <td>${label}</td>
              <td style="text-align: right;">${score.toFixed(3)}</td>
            </tr>
          `).join("");
        })()}        
        </tbody>
      </table>
    </td>
  </tr>
`;
  });

  attachExpandCollapse();
}


function attachExpandCollapse() {
  document.querySelectorAll(".llm-row").forEach((row) => {
    row.addEventListener("click", function () {
      const arrow = this.querySelector(".hovertip");
      const targetId = this.getAttribute("data-target");
      const detailRow = document.getElementById(targetId);
      const isExpanded = detailRow.style.display === "table-row";
      detailRow.style.display = isExpanded ? "none" : "table-row";
      arrow.innerHTML = isExpanded ? "&#9654;" : "&#9660;";
      arrow.style.color = "#2f855a";
      arrow.style.fontWeight = "bold";
    });
  });
}

function copyBibtex(event, blockId) {
  event.preventDefault(); // safety
  const text = document.getElementById(blockId).innerText;
  const button = event.target;

  navigator.clipboard.writeText(text).then(() => {
    button.textContent = "Copied!";
    setTimeout(() => {
      button.textContent = "Copy";
    }, 2000);
  });
}


