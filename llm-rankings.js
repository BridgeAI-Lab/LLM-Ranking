// File: llm-rankings.js

// Mapping from checkbox ID to bias key in the JSON
const biasMap = {
    fact: "factual_content",
    harm: "harmless_content",
    fal: "false_assertion_resistance",
    anchor: "anchoring_bias",
    av: "availability_bias",
    confirm: "confirmation_bias",
    fra: "framing_bias",
    nlp: "prospect_theory_bias",
    pol: "political_bias",
    race: "racial_bias",
    relig: "religious_bias",
    attr: "attribution_bias"
  };
  
  let llmData = {};
  let selectedTemperature = "0.75";
  
  // Load JSON and initialize checkboxes
  fetch('data.json')
    .then(res => res.json())
    .then(data => {
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
    checkboxes.forEach(cb => cb.checked = true);
  }
  
  function initCheckboxHandlers() {
    const checkboxes = document.querySelectorAll('input[type="checkbox"]');
  
    checkboxes.forEach(cb => {
      cb.addEventListener("change", () => {
        updateTableFromSelectedBiases();
      });
    });
  
    document.getElementById("all_areas_on").addEventListener("click", () => {
      checkboxes.forEach(cb => cb.checked = true);
      updateTableFromSelectedBiases();
    });
  
    document.getElementById("all_areas_off").addEventListener("click", () => {
      checkboxes.forEach(cb => cb.checked = false);
      updateTableFromSelectedBiases();
    });
  }
  
  function initGroupToggleHandlers() {
    function toggleCheckboxesInGroup(groupClass, value) {
      const checkboxes = document.querySelectorAll(`.${groupClass} input[type="checkbox"]`);
      checkboxes.forEach(cb => cb.checked = value);
      updateTableFromSelectedBiases();
    }
  
    const groups = ['ai-area', 'systems-area', 'theory-area', 'interdisciplinary-area'];
  
    groups.forEach(group => {
      const on = document.getElementById(group.split('-')[0] + "_areas_on");
      const off = document.getElementById(group.split('-')[0] + "_areas_off");
      if (on && off) {
        on.addEventListener("click", () => toggleCheckboxesInGroup(group, true));
        off.addEventListener("click", () => toggleCheckboxesInGroup(group, false));
      }
    });
  }
  
  function updateTableFromSelectedBiases() {
    const checkboxes = document.querySelectorAll('input[type="checkbox"]');
    const selectedBiases = Array.from(checkboxes)
      .filter(cb => cb.checked)
      .map(cb => biasMap[cb.id])
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
          Please select at least one area by clicking one or more checkboxes.
        </td>
      </tr>
    `;
  }
  
  function renderLLMTable(selectedBiases) {
    const tableBody = document.querySelector("#llm-table-body");
    tableBody.innerHTML = "";
  
    const rows = [];
  
    for (const llm of llmData.llms) {
      let finalScores = [];
      let levelScores = [[], [], [], [], []];
  
      for (const bias of selectedBiases) {
        const scoreArr = llm.bias_scores[bias]?.[selectedTemperature];
        if (scoreArr && scoreArr.length === 6) {
          finalScores.push(scoreArr[5]);
          scoreArr.slice(0, 5).forEach((val, idx) => levelScores[idx].push(val));
        }
      }
  
      if (finalScores.length > 0) {
        const avgFinal = finalScores.reduce((a, b) => a + b, 0) / finalScores.length;
        const avgLevels = levelScores.map(level => {
          return level.reduce((a, b) => a + b, 0) / level.length;
        });
  
        rows.push({
          name: llm.name,
          score: avgFinal,
          levels: avgLevels
        });
      }
    }
  
    rows.sort((a, b) => b.score - a.score);
  
    rows.forEach((row, index) => {
      const id = `llm-detail-${index + 1}`;
  
      tableBody.innerHTML += `
        <tr class="llm-row" data-target="${id}">
          <td>${index + 1}</td>
          <td><span class="hovertip">&#9658;</span> ${row.name}</td>
          <td style="text-align: right;">${row.score.toFixed(1)}</td>
        </tr>
        <tr id="${id}" class="llm-details" style="display: none;">
          <td></td>
          <td colspan="2">
            <table class="table table-sm" style="margin-left: 20px; width: 95%;">
              <thead>
                <tr>
                  <th><i>TeLeR Levels</i></th>
                  <th style="text-align: right;"><i>Adj. #</i></th>
                </tr>
              </thead>
              <tbody>
                ${row.levels.map((score, i) => `
                  <tr>
                    <td><a href="#">Level ${i + 1}</a></td>
                    <td style="text-align: right;">${score.toFixed(1)}</td>
                  </tr>
                `).join("")}
              </tbody>
            </table>
          </td>
        </tr>
      `;
    });
  
    attachExpandCollapse();
  }
  
  function attachExpandCollapse() {
    document.querySelectorAll(".llm-row").forEach(row => {
      row.addEventListener("click", function () {
        const arrow = this.querySelector(".hovertip");
        const targetId = this.getAttribute("data-target");
        const detailRow = document.getElementById(targetId);
        const isExpanded = detailRow.style.display === "table-row";
        detailRow.style.display = isExpanded ? "none" : "table-row";
        arrow.innerHTML = isExpanded ? "&#9658;" : "&#9660;";
      });
    });
  }
  