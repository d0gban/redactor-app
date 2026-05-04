// (function () {
//   if (window.__redactorWorkbenchInitialized) return;
//   window.__redactorWorkbenchInitialized = true;

//   const form = document.getElementById("redact-form");
//   const rulesJson = document.getElementById("rules-json");
//   const selectedFindingIdsJson = document.getElementById("selected-finding-ids-json");
//   const addRuleBtn = document.getElementById("add-rule-btn");
//   const rulesGrid = document.getElementById("rules-grid");
//   const resizer = document.getElementById("resizer");
//   const leftPane = document.querySelector(".pane-left");
//   const rightPane = document.querySelector(".pane-right");
//   const workspaceForm = document.querySelector(".workspace-form");
//   const checkAllFindingsBtn = document.getElementById("check-all-findings");
//   const uncheckAllFindingsBtn = document.getElementById("uncheck-all-findings");

//   function escapeHtml(str) {
//     return String(str || "")
//       .replace(/&/g, "&amp;")
//       .replace(/</g, "&lt;")
//       .replace(/>/g, "&gt;")
//       .replace(/"/g, "&quot;")
//       .replace(/'/g, "&#039;");
//   }

//   function addRuleCard(rule) {
//     if (!rulesGrid) return;
//     rule = rule || {};

//     const card = document.createElement("div");
//     card.className = "rule-card";
//     card.innerHTML = `
//       <div class="rule-card-header">
//         <strong>Rule</strong>
//         <button type="button" class="danger-btn remove-rule-btn">Remove</button>
//       </div>
//       <label>Find text</label>
//       <input type="text" class="rule-find" placeholder="Value to redact" value="${escapeHtml(rule.find || "")}">
//       <label>Entity type</label>
//       <input type="text" class="rule-entity" placeholder="e.g. PERSON / ORG / PROJECT" value="${escapeHtml(rule.entity_type || "")}">
//       <div class="rule-flags">
//         <label class="inline-check">
//           <input type="checkbox" class="rule-case-sensitive" ${rule.case_sensitive ? "checked" : ""}>
//           <span>Case sensitive</span>
//         </label>
//       </div>
//     `;
//     rulesGrid.appendChild(card);
//   }

//   function collectRules() {
//     if (!rulesGrid) return [];

//     const rules = [];
//     document.querySelectorAll(".rule-card").forEach(function (card) {
//       const find = (card.querySelector(".rule-find")?.value || "").trim();
//       const entityType = (card.querySelector(".rule-entity")?.value || "").trim().toUpperCase();
//       const caseSensitive = !!card.querySelector(".rule-case-sensitive")?.checked;

//       if (!find || !entityType) return;

//       rules.push({
//         find: find,
//         entity_type: entityType,
//         case_sensitive: caseSensitive
//       });
//     });

//     return rules;
//   }

//   function syncRulesJson() {
//     if (!rulesJson) return;
//     rulesJson.value = JSON.stringify(collectRules());
//   }

//   function syncSelectedFindingIds() {
//     if (!selectedFindingIdsJson) return;

//     const selected = Array.from(document.querySelectorAll(".finding-toggle:checked")).map(function (checkbox) {
//       return checkbox.value;
//     });

//     selectedFindingIdsJson.value = JSON.stringify(selected);
//   }

//   function setAllFindingsChecked(checked) {
//     document.querySelectorAll(".finding-toggle").forEach(function (checkbox) {
//       checkbox.checked = checked;
//     });
//     syncSelectedFindingIds();
//   }

//   function setLeftPaneWidth(px) {
//     if (!leftPane || !rightPane || !workspaceForm) return;

//     const containerRect = workspaceForm.getBoundingClientRect();
//     const resizerWidth = resizer ? (resizer.offsetWidth || 6) : 6;
//     const minLeft = 320;
//     const minRight = 320;
//     const maxLeft = Math.max(minLeft, containerRect.width - resizerWidth - minRight);
//     const width = Math.max(minLeft, Math.min(px, maxLeft));

//     leftPane.style.flex = `0 0 ${width}px`;
//     leftPane.style.width = `${width}px`;
//     leftPane.style.minWidth = `${width}px`;
//     leftPane.style.maxWidth = `${width}px`;

//     rightPane.style.flex = "1 1 0";
//     rightPane.style.minWidth = "0";
//   }

//   function wireHorizontalResize() {
//     if (!resizer || !leftPane || !workspaceForm) return;

//     let dragging = false;

//     function onPointerMove(e) {
//       if (!dragging) return;
//       const containerRect = workspaceForm.getBoundingClientRect();
//       const nextWidth = e.clientX - containerRect.left;
//       setLeftPaneWidth(nextWidth);
//     }

//     function onPointerUp() {
//       if (!dragging) return;
//       dragging = false;
//       document.body.style.userSelect = "";
//       document.body.style.cursor = "";
//       resizer.classList.remove("is-dragging");
//       window.removeEventListener("pointermove", onPointerMove);
//       window.removeEventListener("pointerup", onPointerUp);
//     }

//     resizer.addEventListener("pointerdown", function (e) {
//       if (window.innerWidth <= 900) return;
//       dragging = true;
//       document.body.style.userSelect = "none";
//       document.body.style.cursor = "ew-resize";
//       resizer.classList.add("is-dragging");
//       e.preventDefault();
//       window.addEventListener("pointermove", onPointerMove);
//       window.addEventListener("pointerup", onPointerUp);
//     });
//   }

//   if (rulesGrid) {
//     rulesGrid.innerHTML = "";
//     const initialRules = Array.isArray(window.INITIAL_RULES) ? window.INITIAL_RULES : [];
//     if (initialRules.length) initialRules.forEach(addRuleCard);
//     else addRuleCard({});

//     rulesGrid.addEventListener("input", syncRulesJson);
//     rulesGrid.addEventListener("change", syncRulesJson);
//     rulesGrid.addEventListener("click", function (e) {
//       if (e.target.classList.contains("remove-rule-btn")) {
//         const card = e.target.closest(".rule-card");
//         if (card) {
//           card.remove();
//           syncRulesJson();
//         }
//       }
//     });
//   }

//   if (addRuleBtn) {
//     addRuleBtn.addEventListener("click", function () {
//       addRuleCard({});
//       syncRulesJson();
//     });
//   }

//   document.querySelectorAll(".finding-toggle").forEach(function (checkbox) {
//     checkbox.addEventListener("change", syncSelectedFindingIds);
//   });

//   if (checkAllFindingsBtn) {
//     checkAllFindingsBtn.addEventListener("click", function () {
//       setAllFindingsChecked(true);
//     });
//   }

//   if (uncheckAllFindingsBtn) {
//     uncheckAllFindingsBtn.addEventListener("click", function () {
//       setAllFindingsChecked(false);
//     });
//   }

//   if (form) {
//     form.addEventListener("submit", function () {
//       syncRulesJson();
//       syncSelectedFindingIds();
//     });
//   }

//   wireHorizontalResize();
//   syncRulesJson();
//   syncSelectedFindingIds();
// })();

(function () {
  if (window.__redactorWorkbenchInitialized) return;
  window.__redactorWorkbenchInitialized = true;

  const form = document.getElementById("redact-form");
  const rulesJson = document.getElementById("rules-json");
  const selectedFindingIdsJson = document.getElementById("selected-finding-ids-json");
  const addRuleBtn = document.getElementById("add-rule-btn");
  const rulesGrid = document.getElementById("rules-grid");

  const resizer = document.getElementById("resizer");
  const leftPane = document.querySelector(".pane-left");
  const rightPane = document.querySelector(".pane-right");
  const workspaceForm = document.querySelector(".workspace-form");

  const sourcePanel = document.querySelector(".source-panel");
  const rulesPanel = document.querySelector(".rules-panel-block");
  const findingsPanel = document.querySelector(".findings-panel-block");
  const dividerSourceRules = document.getElementById("divider-source-rules");
  const dividerRulesFindings = document.getElementById("divider-rules-findings");

  const checkAllFindingsBtn = document.getElementById("check-all-findings");
  const uncheckAllFindingsBtn = document.getElementById("uncheck-all-findings");

  function escapeHtml(str) {
    return String(str || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function addRuleCard(rule) {
    if (!rulesGrid) return;
    rule = rule || {};

    const card = document.createElement("div");
    card.className = "rule-card";
    card.innerHTML = `
      <div class="rule-card-header">
        <strong>Rule</strong>
        <button type="button" class="danger-btn remove-rule-btn">Remove</button>
      </div>
      <label>Find text</label>
      <input type="text" class="rule-find" placeholder="Value to redact" value="${escapeHtml(rule.find || "")}">
      <label>Entity type</label>
      <input type="text" class="rule-entity" placeholder="e.g. PERSON / ORG / PROJECT" value="${escapeHtml(rule.entity_type || "")}">
      <div class="rule-flags">
        <label class="inline-check">
          <input type="checkbox" class="rule-case-sensitive" ${rule.case_sensitive ? "checked" : ""}>
          <span>Case sensitive</span>
        </label>
      </div>
    `;
    rulesGrid.appendChild(card);
  }

  function collectRules() {
    if (!rulesGrid) return [];

    const rules = [];
    document.querySelectorAll(".rule-card").forEach(function (card) {
      const find = (card.querySelector(".rule-find")?.value || "").trim();
      const entityType = (card.querySelector(".rule-entity")?.value || "").trim().toUpperCase();
      const caseSensitive = !!card.querySelector(".rule-case-sensitive")?.checked;

      if (!find || !entityType) return;

      rules.push({
        find: find,
        entity_type: entityType,
        case_sensitive: caseSensitive
      });
    });

    return rules;
  }

  function syncRulesJson() {
    if (!rulesJson) return;
    rulesJson.value = JSON.stringify(collectRules());
  }

  function syncSelectedFindingIds() {
    if (!selectedFindingIdsJson) return;

    const selected = Array.from(document.querySelectorAll(".finding-toggle:checked")).map(function (checkbox) {
      return checkbox.value;
    });

    selectedFindingIdsJson.value = JSON.stringify(selected);
  }

  function setAllFindingsChecked(checked) {
    document.querySelectorAll(".finding-toggle").forEach(function (checkbox) {
      checkbox.checked = checked;
    });
    syncSelectedFindingIds();
  }

  function setLeftPaneWidth(px) {
    if (!leftPane || !rightPane || !workspaceForm) return;

    const containerRect = workspaceForm.getBoundingClientRect();
    const resizerWidth = resizer ? (resizer.offsetWidth || 6) : 6;
    const minLeft = 320;
    const minRight = 320;
    const maxLeft = Math.max(minLeft, containerRect.width - resizerWidth - minRight);
    const width = Math.max(minLeft, Math.min(px, maxLeft));

    leftPane.style.flex = `0 0 ${width}px`;
    leftPane.style.width = `${width}px`;
    leftPane.style.minWidth = `${width}px`;
    leftPane.style.maxWidth = `${width}px`;

    rightPane.style.flex = "1 1 0";
    rightPane.style.minWidth = "0";
  }

  function wireHorizontalResize() {
    if (!resizer || !leftPane || !workspaceForm) return;

    let dragging = false;

    function onPointerMove(e) {
      if (!dragging) return;
      const containerRect = workspaceForm.getBoundingClientRect();
      const nextWidth = e.clientX - containerRect.left;
      setLeftPaneWidth(nextWidth);
    }

    function onPointerUp() {
      if (!dragging) return;
      dragging = false;
      document.body.style.userSelect = "";
      document.body.style.cursor = "";
      resizer.classList.remove("is-dragging");
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
    }

    resizer.addEventListener("pointerdown", function (e) {
      if (window.innerWidth <= 900) return;
      dragging = true;
      document.body.style.userSelect = "none";
      document.body.style.cursor = "ew-resize";
      resizer.classList.add("is-dragging");
      e.preventDefault();
      window.addEventListener("pointermove", onPointerMove);
      window.addEventListener("pointerup", onPointerUp);
    });
  }

  function px(n) {
    return `${n}px`;
  }

  function setPanelHeights(sourceHeight, rulesHeight, findingsHeight) {
    if (!sourcePanel || !rulesPanel || !findingsPanel) return;

    sourcePanel.style.flex = `0 0 ${sourceHeight}px`;
    sourcePanel.style.height = px(sourceHeight);
    sourcePanel.style.minHeight = "120px";

    rulesPanel.style.flex = `0 0 ${rulesHeight}px`;
    rulesPanel.style.height = px(rulesHeight);
    rulesPanel.style.minHeight = "120px";

    findingsPanel.style.flex = `0 0 ${findingsHeight}px`;
    findingsPanel.style.height = px(findingsHeight);
    findingsPanel.style.minHeight = "120px";
  }

  function wireVerticalResize(divider, upperPanel, lowerPanel) {
    if (!divider || !upperPanel || !lowerPanel) return;

    let dragging = false;
    let startY = 0;
    let startUpperHeight = 0;
    let startLowerHeight = 0;

    function onPointerMove(e) {
      if (!dragging) return;

      const dy = e.clientY - startY;
      const minPanelHeight = 120;

      let nextUpper = startUpperHeight + dy;
      let nextLower = startLowerHeight - dy;

      if (nextUpper < minPanelHeight) {
        nextLower -= (minPanelHeight - nextUpper);
        nextUpper = minPanelHeight;
      }

      if (nextLower < minPanelHeight) {
        nextUpper -= (minPanelHeight - nextLower);
        nextLower = minPanelHeight;
      }

      upperPanel.style.flex = `0 0 ${nextUpper}px`;
      upperPanel.style.height = px(nextUpper);

      lowerPanel.style.flex = `0 0 ${nextLower}px`;
      lowerPanel.style.height = px(nextLower);
    }

    function onPointerUp() {
      if (!dragging) return;
      dragging = false;
      document.body.style.userSelect = "";
      document.body.style.cursor = "";
      divider.classList.remove("is-dragging");
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
    }

    divider.addEventListener("pointerdown", function (e) {
      if (window.innerWidth <= 900) return;

      dragging = true;
      startY = e.clientY;
      startUpperHeight = upperPanel.getBoundingClientRect().height;
      startLowerHeight = lowerPanel.getBoundingClientRect().height;

      document.body.style.userSelect = "none";
      document.body.style.cursor = "row-resize";
      divider.classList.add("is-dragging");
      e.preventDefault();

      window.addEventListener("pointermove", onPointerMove);
      window.addEventListener("pointerup", onPointerUp);
    });
  }

  function initVerticalPanels() {
    if (!sourcePanel || !rulesPanel || !findingsPanel) return;
    if (window.innerWidth <= 900) return;

    const container = sourcePanel.parentElement;
    if (!container) return;

    const totalHeight = container.getBoundingClientRect().height;
    if (!totalHeight) return;

    const dividerCount = 2;
    const dividerHeight = 8;
    const usableHeight = totalHeight - dividerCount * dividerHeight;

    const sourceHeight = Math.max(160, Math.floor(usableHeight * 0.42));
    const rulesHeight = Math.max(120, Math.floor(usableHeight * 0.33));
    const findingsHeight = Math.max(120, usableHeight - sourceHeight - rulesHeight);

    setPanelHeights(sourceHeight, rulesHeight, findingsHeight);
  }

  if (rulesGrid) {
    rulesGrid.innerHTML = "";
    const initialRules = Array.isArray(window.INITIAL_RULES) ? window.INITIAL_RULES : [];
    if (initialRules.length) initialRules.forEach(addRuleCard);
    else addRuleCard({});

    rulesGrid.addEventListener("input", syncRulesJson);
    rulesGrid.addEventListener("change", syncRulesJson);
    rulesGrid.addEventListener("click", function (e) {
      if (e.target.classList.contains("remove-rule-btn")) {
        const card = e.target.closest(".rule-card");
        if (card) {
          card.remove();
          syncRulesJson();
        }
      }
    });
  }

  if (addRuleBtn) {
    addRuleBtn.addEventListener("click", function () {
      addRuleCard({});
      syncRulesJson();
    });
  }

  document.querySelectorAll(".finding-toggle").forEach(function (checkbox) {
    checkbox.addEventListener("change", syncSelectedFindingIds);
  });

  if (checkAllFindingsBtn) {
    checkAllFindingsBtn.addEventListener("click", function () {
      setAllFindingsChecked(true);
    });
  }

  if (uncheckAllFindingsBtn) {
    uncheckAllFindingsBtn.addEventListener("click", function () {
      setAllFindingsChecked(false);
    });
  }

  if (form) {
    form.addEventListener("submit", function () {
      syncRulesJson();
      syncSelectedFindingIds();
    });
  }

  wireHorizontalResize();
  initVerticalPanels();
  wireVerticalResize(dividerSourceRules, sourcePanel, rulesPanel);
  wireVerticalResize(dividerRulesFindings, rulesPanel, findingsPanel);

  window.addEventListener("resize", function () {
    if (window.innerWidth <= 900) return;
    initVerticalPanels();
  });

  syncRulesJson();
  syncSelectedFindingIds();
})();