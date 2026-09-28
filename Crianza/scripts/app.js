/* Lógica propia de la app SnowOld (planificador de crianza): utilidades, UI, datos, motor de cálculo, vistas, costos y efecto de nieve. */
function parseNumber(raw, fallback) {
  const parsed = Number(raw);
  if (Number.isFinite(parsed) && parsed >= 0) {
    return parsed;
  }
  return fallback;
}

function formatStatSet(statsSet) {
  return [...statsSet].join(", ");
}

function increment(map, key, by) {
  map.set(key, (map.get(key) || 0) + by);
}

function areStatSetsEqual(left, right) {
  if (left.size !== right.size) {
    return false;
  }

  for (const value of left) {
    if (!right.has(value)) {
      return false;
    }
  }

  return true;
}

function formatCurrency(value) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(value);
}

function normalize(input) {
  return String(input).trim().toLowerCase().replaceAll(" ", "-");
}

function formatPokemonName(name) {
  return name
    .split("-")
    .map((part) => part.slice(0, 1).toUpperCase() + part.slice(1))
    .join(" ");
}

function escapeHtml(input) {
  return String(input)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}


// -----------------------------------------------------------------------------
// Búsqueda y sugerencias de especies.
// La idea es ofrecer autocompletado en tiempo real sin depender de datalist
// del navegador, que a veces no se comporta de forma uniforme.
// -----------------------------------------------------------------------------

function hideSpeciesSuggestions() {
  const suggestionsEl = document.getElementById("speciesSuggestions");
  if (suggestionsEl) {
    suggestionsEl.hidden = true;
    suggestionsEl.style.display = "none";
    suggestionsEl.style.background = "#0d1b2a";
    suggestionsEl.style.border = "1px solid rgba(174, 235, 255, 0.18)";
    suggestionsEl.style.borderRadius = "10px";
    suggestionsEl.innerHTML = "";
  }
}

function ocultarSugerenciasEspecies() {
  hideSpeciesSuggestions();
}

function renderSpeciesSuggestions(query = "") {
  const suggestionsEl = document.getElementById("speciesSuggestions");
  if (!suggestionsEl) {
    return;
  }

  const typed = String(query || "").trim();
  if (!typed) {
    hideSpeciesSuggestions();
    return;
  }

  const matches = (state.speciesCatalog || [])
    .filter((species) => {
      const display = String(species.displayName || "").toLowerCase();
      return display.includes(typed.toLowerCase());
    })
    .slice(0, 12);

  suggestionsEl.innerHTML = "";
  suggestionsEl.style.background = "#0d1b2a";
  suggestionsEl.style.border = "1px solid rgba(174, 235, 255, 0.18)";
  suggestionsEl.style.borderRadius = "10px";
  suggestionsEl.style.color = "#eaf8ff";
  suggestionsEl.style.display = "grid";
  suggestionsEl.style.gap = "4px";
  suggestionsEl.style.padding = "6px";
  suggestionsEl.style.boxShadow = "0 12px 28px rgba(10, 18, 30, 0.22)";

  if (!matches.length) {
    suggestionsEl.hidden = true;
    suggestionsEl.style.display = "none";
    return;
  }

  for (const species of matches) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "species-suggestion";
    button.textContent = species.displayName;
    button.style.color = "#eaf8ff";
    button.style.background = "transparent";
    button.style.border = "1px solid transparent";
    button.style.borderRadius = "8px";
    button.style.padding = "8px 10px";
    button.style.textAlign = "left";
    button.style.width = "100%";
    button.style.cursor = "pointer";
    button.addEventListener("click", () => {
      el.speciesInput.value = species.displayName;
      hideSpeciesSuggestions();
      onSpeciesInputChanged();
    });
    suggestionsEl.appendChild(button);
  }

  suggestionsEl.hidden = false;
}

function onSpeciesInputChanged() {
  const rawValue = String(el.speciesInput.value || "").trim();
  renderSpeciesSuggestions(rawValue);

  const entry = resolveSpeciesEntry(rawValue);
  if (!entry) {
    if (rawValue) {
      el.speciesMeta.className = "species-meta";
      el.speciesMeta.textContent = "No encontré esa especie. Probá con un nombre exacto o elegí una de la sugerencia.";
    } else {
      el.speciesMeta.className = "species-meta empty";
      el.speciesMeta.textContent = "Elegí una especie para cargar automáticamente sus grupos huevo y proporción de género.";
    }
    return;
  }

  renderSpeciesMeta(entry, {
    eggGroups: entry.eggGroups,
    genderProfile: entry.genderProfile
  });
}

function resolveSpeciesEntry(rawValue) {
  const normalized = normalize(rawValue);
  if (!normalized) {
    return null;
  }

  const exactDisplay = state.speciesByDisplay.get(normalized);
  if (exactDisplay) {
    return exactDisplay;
  }

  const apiMatch = state.speciesByApi.get(normalized);
  if (apiMatch) {
    return apiMatch;
  }

  return null;
}

function manejarCambioInputEspecie() {
  return onSpeciesInputChanged();
}

function resolverEntradaEspecie(rawValue) {
  return resolveSpeciesEntry(rawValue);
}

function initTheme() {
  const savedTheme = localStorage.getItem(THEME_STORAGE_KEY);
  const theme = savedTheme === "light" || savedTheme === "dark" ? savedTheme : "light";
  applyTheme(theme);
}

function toggleTheme() {
  const current = document.body.dataset.theme === "light" ? "light" : "dark";
  const next = current === "light" ? "dark" : "light";
  applyTheme(next);
}

function applyTheme(theme) {
  document.body.dataset.theme = theme;
  localStorage.setItem(THEME_STORAGE_KEY, theme);

  if (el.themeToggle) {
    el.themeToggle.textContent = theme === "dark"
      ? "Cambiar a Modo Claro"
      : "Cambiar a Modo Oscuro";
  }

  if (state.graphCache.size > 0) {
    renderSelectedGraph();
  }
}

function setSettingsSidebarOpen(isOpen) {
  el.settingsSidebar.classList.toggle("is-open", isOpen);
  el.settingsSidebar.setAttribute("aria-hidden", String(!isOpen));
  el.settingsBackdrop.hidden = !isOpen;
}

function loadTwoperfectivsSupportSetting() {
  return localStorage.getItem(TWOPERFECTIVS_SUPPORT_STORAGE_KEY) === "true";
}

function onTwoperfectivsSupportChanged() {
  state.costConfig.twoperfectivsSupport = Boolean(el.twoperfectivsSupportInput.checked);
  localStorage.setItem(TWOPERFECTIVS_SUPPORT_STORAGE_KEY, String(state.costConfig.twoperfectivsSupport));
  persistSettingsFromUi();
  syncTwoperfectivsSupportUi();

  if (state.planByTargetId.size > 0) {
    refreshCostsAfterInput();
  }
}

function onInventoryEnabledChanged() {
  state.inventoryEnabled = Boolean(el.inventoryEnabledInput?.checked);
  persistSettingsFromUi();
  syncInventoryUi();

  if (state.targets.length > 0) {
    generatePlan();
  } else {
    renderShoppingList([], []);
    renderInventorySummary({ consumedTotal: 0, uncoveredTotal: 0, parseErrors: [] });
  }
}

function syncTwoperfectivsSupportUi() {
  const enabled = Boolean(state.costConfig.twoperfectivsSupport);
  if (el.twoperfectivsSupportInput) {
    el.twoperfectivsSupportInput.checked = enabled;
  }

  if (el.twoperfectivsPriceSection) {
    el.twoperfectivsPriceSection.hidden = !enabled;
  }
}

function syncInventoryUi() {
  const enabled = Boolean(state.inventoryEnabled);
  if (el.inventoryEnabledInput) {
    el.inventoryEnabledInput.checked = enabled;
  }

  if (el.inventorySection) {
    el.inventorySection.hidden = false;
    el.inventorySection.classList.toggle("inventory-section--disabled", !enabled);
  }
}

function hydrateSelect(selectElement, options) {
  if (!selectElement) {
    return;
  }

  selectElement.innerHTML = "";
  for (const value of options || []) {
    const option = document.createElement("option");
    option.value = value;
    option.textContent = value;
    selectElement.appendChild(option);
  }
}

function hydrateIvChecklist(container = el.ivChecklist) {
  if (!container) {
    return;
  }

  container.innerHTML = "";
  for (const stat of STATS) {
    const label = document.createElement("label");

    const input = document.createElement("input");
    input.type = "checkbox";
    input.value = stat;

    const text = document.createElement("span");
    text.textContent = stat;

    label.appendChild(input);
    label.appendChild(text);
    container.appendChild(label);
  }
}

function getSpeciesData(apiName) {
  const entry = state.speciesByApi.get(apiName);
  if (!entry) {
    throw new Error(`Especie desconocida: ${apiName}`);
  }

  return {
    eggGroups: entry.eggGroups,
    genderProfile: entry.genderProfile
  };
}

function parseGenderProfile(genderRate) {
  if (genderRate === -1) {
    return {
      mode: "Genderless",
      text: "Genderless",
      femaleRate: 0,
      maleRate: 0
    };
  }

  const femaleRate = genderRate / 8;
  const maleRate = 1 - femaleRate;
  const formatGenderPercent = (rate) => {
    const percent = rate * 100;
    return Number.isInteger(percent) ? String(percent) : percent.toFixed(1).replace(/\.0$/, "");
  };

  if (femaleRate === 0) {
    return {
      mode: "Solo macho",
      text: "Solo macho",
      femaleRate,
      maleRate
    };
  }

  if (femaleRate === 1) {
    return {
      mode: "Solo hembra",
      text: "Solo hembra",
      femaleRate,
      maleRate
    };
  }

  return {
    mode: "Mixed",
    text: `${formatGenderPercent(maleRate)}% male / ${formatGenderPercent(femaleRate)}% female`,
    femaleRate,
    maleRate
  };
}

function renderSpeciesMeta(entry, speciesData) {
  const groups = speciesData.eggGroups.map((g) => `<span class="tag">${escapeHtml(g)}</span>`).join(" ");
  const notBreedable = speciesData.eggGroups.includes("Undiscovered");
  const warning = notBreedable
    ? "<div class=\"target-meta\">Atención: el grupo huevo Indescubierto no puede criar en cadenas normales.</div>"
    : "";

  el.speciesMeta.className = "species-meta";
  el.speciesMeta.innerHTML = `
    <div><strong>${escapeHtml(entry.displayName)}</strong></div>
    <div class="target-meta">Egg Groups: ${groups || "None"}</div>
    <div class="target-meta">Gender: ${escapeHtml(speciesData.genderProfile.text)}</div>
    ${warning}
  `;
}

function readSelectedIvs() {
  const checked = [...el.ivChecklist.querySelectorAll("input:checked")].map((node) => node.value);
  const ivs = {};

  for (const stat of STATS) {
    ivs[stat] = checked.includes(stat) ? 31 : null;
  }

  return ivs;
}

function readSelectedInventoryIvs() {
  const checked = [...el.inventoryIvChecklist.querySelectorAll("input:checked")].map((node) => node.value);
  return new Set(checked.filter((stat) => STATS.includes(stat)));
}

function addTargetFromForm() {
  const speciesEntry = resolveSpeciesEntry(el.speciesInput.value.trim());
  const nature = el.natureInput.value;
  const ivs = readSelectedIvs();

  if (!speciesEntry) {
    window.alert("Por favor seleccioná una especie válida (Gen 1-5) de las sugerencias.");
    return;
  }

  const speciesData = getSpeciesData(speciesEntry.apiName);

  const target = {
    id: generateId(),
    species: speciesEntry.displayName,
    speciesApiName: speciesEntry.apiName,
    eggGroups: speciesData.eggGroups,
    genderProfile: speciesData.genderProfile,
    nature,
    ivs
  };

  state.targets.push(target);
  persistTargets();
  clearInputForm();
  renderTargets();
}

function clearInputForm() {
  el.speciesInput.value = "";
  for (const checkbox of el.ivChecklist.querySelectorAll("input[type='checkbox']")) {
    checkbox.checked = false;
  }
  el.speciesMeta.className = "species-meta empty";
  el.speciesMeta.textContent = "Elegí una especie para cargar automáticamente sus grupos huevo y proporción de género.";
}

function addInventoryFromForm() {
  const speciesEntry = resolveSpeciesEntry(el.inventorySpeciesInput.value.trim());
  const nature = el.inventoryNatureInput.value;
  const gender = normalizeInventoryGender(el.inventoryGenderInput.value);
  const ivs = readSelectedInventoryIvs();

  if (!speciesEntry) {
    window.alert("Por favor seleccioná una especie válida (Gen 1-5) de las sugerencias.");
    return;
  }

  const existing = state.inventory.find((entry) => (
    entry.speciesApiName === speciesEntry.apiName
    && entry.gender === gender
    && entry.nature === nature
    && areStatSetsEqual(entry.ivs, ivs)
  ));

  if (existing) {
    existing.count += 1;
  } else {
    const speciesData = getSpeciesData(speciesEntry.apiName);
    state.inventory.push({
      id: generateId(),
      species: speciesEntry.displayName,
      speciesApiName: speciesEntry.apiName,
      eggGroups: speciesData.eggGroups,
      gender,
      nature,
      ivs,
      count: 1
    });
  }

  persistInventory();
  clearInventoryForm();
  renderInventoryList();

  if (state.targets.length > 0) {
    generatePlan();
  } else {
    renderInventorySummary({ consumedTotal: 0, uncoveredTotal: 0, parseErrors: [] });
  }
}

function clearInventoryForm() {
  el.inventorySpeciesInput.value = "";
  el.inventoryNatureInput.value = "Any";
  el.inventoryGenderInput.value = "Any";

  for (const checkbox of el.inventoryIvChecklist.querySelectorAll("input[type='checkbox']")) {
    checkbox.checked = false;
  }
}

function renderInventoryList() {
  el.inventoryList.innerHTML = "";

  if (state.inventory.length === 0) {
    const empty = document.createElement("div");
    empty.className = "empty";
    empty.textContent = "Todavía no hay entradas en el inventario.";
    el.inventoryList.appendChild(empty);
    return;
  }

  for (const entry of state.inventory) {
    const item = document.createElement("article");
    item.className = "target-item inventory-item";
    const ivList = [...entry.ivs].join(", ") || "None";
    const genderIcon = entry.gender === "Male" ? "M" : (entry.gender === "Female" ? "F" : "A");
    const genderClass = entry.gender === "Male"
      ? "inventory-gender-icon--male"
      : (entry.gender === "Female" ? "inventory-gender-icon--female" : "inventory-gender-icon--any");
    const natureLine = entry.nature && entry.nature !== "Any"
      ? `<div class="target-meta">Naturaleza: ${escapeHtml(entry.nature)}</div>`
      : "";

    const left = document.createElement("div");
    left.innerHTML = `
      <span class="inventory-gender-icon ${genderClass}" title="Gender: ${escapeHtml(entry.gender)}">${genderIcon}</span>
      <strong>${escapeHtml(entry.species)} <span class="inventory-count-badge">x${entry.count}</span></strong>
      ${natureLine}
      <div class="target-meta">IVs: ${escapeHtml(ivList)}</div>
    `;

    const remove = document.createElement("button");
    remove.className = "inventory-remove-btn";
    remove.type = "button";
    remove.textContent = "X";
    remove.title = "Restar cantidad o quitar";
    remove.addEventListener("click", () => {
      if (entry.count > 1) {
        entry.count -= 1;
      } else {
        state.inventory = state.inventory.filter((row) => row.id !== entry.id);
      }
      persistInventory();
      renderInventoryList();

      if (state.targets.length > 0) {
        generatePlan();
      } else {
        renderInventorySummary({ consumedTotal: 0, uncoveredTotal: 0, parseErrors: [] });
      }
    });

    item.append(left, remove);
    el.inventoryList.appendChild(item);
  }
}

function clearTargets() {
  state.targets = [];
  state.planByTargetId.clear();
  state.graphCache.clear();
  state.lastGlobalNeeds = new Map();
  persistTargets();
  renderTargets();
  renderShoppingList([]);
  renderBuyChecklist([], [], state.costConfig);
  renderItemNeedsList([], state.costConfig);
  renderPlanExplanations([], null, state.costConfig);
  renderInventorySummary({ consumedTotal: 0, uncoveredTotal: 0, parseErrors: [] });
  renderTotalCostSummary(0, 0, 0);
  hydrateGraphSelect([]);
  setGraphCollapsed(true);
  renderEmptyGraph("Se limpiaron los objetivos.");
}

function renderTargets() {
  el.targetsList.innerHTML = "";

  if (state.targets.length === 0) {
    const empty = document.createElement("div");
    empty.className = "empty";
    empty.textContent = "Todavía no hay objetivos.";
    el.targetsList.appendChild(empty);
    return;
  }

  for (const target of state.targets) {
    const item = document.createElement("article");
    item.className = "target-item";

    const ivList = STATS.filter((s) => target.ivs[s] === 31).join(", ") || "None";

    const left = document.createElement("div");
    left.innerHTML = `
      <strong>${escapeHtml(target.species)}</strong>
      <div class="target-meta">
        <span class="tag">${escapeHtml(target.eggGroups.join(" / "))}</span>
        <span class="tag">Nature: ${escapeHtml(target.nature)}</span>
      </div>
      <div class="target-meta">Species Gender: ${escapeHtml(target.genderProfile.text)}</div>
      <div class="target-meta">IVs: ${escapeHtml(ivList)}</div>
    `;

    const remove = document.createElement("button");
    remove.className = "ghost-btn";
    remove.type = "button";
    remove.textContent = "Remove";
    remove.addEventListener("click", () => {
      state.targets = state.targets.filter((t) => t.id !== target.id);
      state.planByTargetId.delete(target.id);
      state.graphCache.delete(target.id);
      persistTargets();
      renderTargets();
    });

    item.append(left, remove);
    el.targetsList.appendChild(item);
  }
}



function persistTargets() {
  const serializedTargets = state.targets.map(serializeTarget);
  localStorage.setItem(TARGETS_STORAGE_KEY, JSON.stringify(serializedTargets));
}

function loadPersistedTargets() {
  try {
    const raw = localStorage.getItem(TARGETS_STORAGE_KEY);
    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed;
  } catch {
    return [];
  }
}

function serializeTarget(target) {
  return {
    species: target.species,
    speciesApiName: target.speciesApiName,
    nature: target.nature,
    ivs: { ...target.ivs }
  };
}

function hydrateTargets(rawTargets) {
  return (rawTargets || [])
    .map((target) => normalizeImportedTarget(target))
    .filter(Boolean);
}

function normalizeImportedTarget(rawTarget) {
  if (!rawTarget) {
    return null;
  }

  const apiName = String(rawTarget.speciesApiName || "").trim() || resolveSpeciesEntry(rawTarget.species || "")?.apiName;
  const speciesEntry = apiName ? state.speciesByApi.get(apiName) : null;
  if (!speciesEntry) {
    return null;
  }

  const speciesData = getSpeciesData(speciesEntry.apiName);
  const ivs = {};
  for (const stat of STATS) {
    ivs[stat] = rawTarget.ivs?.[stat] === 31 ? 31 : null;
  }

  return {
    id: generateId(),
    species: speciesEntry.displayName,
    speciesApiName: speciesEntry.apiName,
    eggGroups: speciesData.eggGroups,
    genderProfile: speciesData.genderProfile,
    nature: NATURES.includes(rawTarget.nature) ? rawTarget.nature : "Any",
    ivs
  };
}

function generateId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return `id-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 11)}`;
}

function exportTargetsToJson() {
  const payload = {
    version: 1,
    exportedAt: new Date().toISOString(),
    targets: state.targets.map(serializeTarget)
  };

  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = "pokemmo-breeder-targets.json";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

async function importTargetsFromJson(event) {
  const file = event.target.files?.[0];
  if (!file) {
    return;
  }

  try {
    const text = await file.text();
    const parsed = JSON.parse(text);
    const rawTargets = Array.isArray(parsed) ? parsed : parsed?.targets;
    if (!Array.isArray(rawTargets)) {
      throw new Error("Formato de importación de objetivos inválido.");
    }

    const importedTargets = hydrateTargets(rawTargets);
    if (importedTargets.length === 0 && rawTargets.length > 0) {
      throw new Error("No se pudo importar ningún objetivo válido.");
    }

    state.targets = importedTargets;
    persistTargets();
    renderTargets();

    if (state.targets.length > 0) {
      generatePlan();
    } else {
      clearTargets();
    }
  } catch (error) {
    window.alert(error instanceof Error ? error.message : "No se pudo importar el JSON de objetivos.");
  } finally {
    event.target.value = "";
  }
}

function loadPersistedInventory() {
  try {
    const raw = localStorage.getItem(INVENTORY_STORAGE_KEY);
    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function persistInventory() {
  const serialized = state.inventory.map((entry) => ({
    speciesApiName: entry.speciesApiName,
    species: entry.species,
    gender: entry.gender,
    nature: entry.nature,
    ivs: [...entry.ivs],
    count: entry.count
  }));

  localStorage.setItem(INVENTORY_STORAGE_KEY, JSON.stringify(serialized));
}

function hydrateInventory(rawEntries) {
  return (rawEntries || [])
    .map((entry) => normalizeInventoryEntry(entry))
    .filter(Boolean);
}

function normalizeInventoryEntry(rawEntry) {
  if (!rawEntry || typeof rawEntry !== "object") {
    return null;
  }

  const apiName = String(rawEntry.speciesApiName || "").trim() || resolveSpeciesEntry(rawEntry.species || "")?.apiName;
  const speciesEntry = apiName ? state.speciesByApi.get(apiName) : null;
  if (!speciesEntry) {
    return null;
  }

  const speciesData = getSpeciesData(speciesEntry.apiName);
  const ivSource = Array.isArray(rawEntry.ivs) ? rawEntry.ivs : [];
  const ivs = new Set(ivSource.filter((stat) => STATS.includes(stat)));
  const gender = normalizeInventoryGender(rawEntry.gender);
  const nature = normalizeInventoryNature(rawEntry.nature);
  const count = Math.max(1, parseInt(rawEntry.count, 10) || 1);

  return {
    id: generateId(),
    species: speciesEntry.displayName,
    speciesApiName: speciesEntry.apiName,
    eggGroups: speciesData.eggGroups,
    gender,
    nature,
    ivs,
    count
  };
}

function clearInventory() {
  state.inventory = [];
  persistInventory();
  clearInventoryForm();
  renderInventoryList();

  if (state.targets.length > 0) {
    generatePlan();
  } else {
    renderInventorySummary({ consumedTotal: 0, uncoveredTotal: 0, parseErrors: [] });
  }
}

function exportInventoryToJson() {
  const payload = {
    version: 1,
    exportedAt: new Date().toISOString(),
    inventory: state.inventory.map((entry) => ({
      species: entry.species,
      speciesApiName: entry.speciesApiName,
      gender: entry.gender,
      nature: entry.nature,
      ivs: [...entry.ivs],
      count: entry.count
    }))
  };

  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = "pokemmo-breeder-inventory.json";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

async function importInventoryFromJson(event) {
  const file = event.target.files?.[0];
  if (!file) {
    return;
  }

  try {
    const text = await file.text();
    const parsed = JSON.parse(text);
    const rawInventory = Array.isArray(parsed) ? parsed : parsed?.inventory;
    if (!Array.isArray(rawInventory)) {
      throw new Error("Formato de importación de inventario inválido.");
    }

    const importedInventory = hydrateInventory(rawInventory);
    if (importedInventory.length === 0 && rawInventory.length > 0) {
      throw new Error("No se pudo importar ninguna entrada de inventario válida.");
    }

    const override = getInventoryImportOverride("inventoryImportBreederOverrideChk");
    state.inventory = override ? importedInventory : [...state.inventory, ...importedInventory];
    persistInventory();
    renderInventoryList();
    clearInventoryForm();

    if (state.targets.length > 0) {
      generatePlan();
    } else {
      renderInventorySummary({ consumedTotal: 0, uncoveredTotal: 0, parseErrors: [] });
    }
  } catch (error) {
    window.alert(error instanceof Error ? error.message : "No se pudo importar el JSON de inventario.");
  } finally {
    event.target.value = "";
  }
}

async function importInventoryFromPokeMMO(event) {
  const file = event.target.files?.[0];
  if (!file) {
    return;
  }

  try {
    const text = await file.text();
    const parsed = JSON.parse(text);
    const skipOtValues = String(document.getElementById("inventoryPokeMMOSkipOtInput")?.value || "")
      .split(",")
      .map((value) => value.trim().toLowerCase())
      .filter(Boolean);
    const excludeHatched = document.getElementById("inventoryPokeMMOExcludeHatchedChk")?.checked ?? false;
    const skipLevel100 = document.getElementById("inventoryPokeMMOSkipLevel100Chk")?.checked ?? false;
    const requireBothFilters = document.getElementById("inventoryPokeMMORequireBothFiltersChk")?.checked ?? false;
    const filtersReady = skipOtValues.length > 0 && excludeHatched;
    const imported = parsePokeMMOInventory(parsed, {
      skipOtValues: requireBothFilters && !filtersReady ? [] : skipOtValues,
      excludeHatched: requireBothFilters && !filtersReady ? false : excludeHatched,
      requireBothFilters,
      skipLevel100
    });
    if (imported.entries.length === 0) {
      throw new Error("No se pudo importar ningún Pokémon válido desde el PC o el equipo.");
    }

    const importedInventory = hydrateInventory(imported.entries);
    const override = getInventoryImportOverride("inventoryImportPokeMMOOverrideChk");
    state.inventory = override ? importedInventory : [...state.inventory, ...importedInventory];
    persistInventory();
    renderInventoryList();
    clearInventoryForm();
    closeInventoryImportModal();

    if (state.targets.length > 0) {
      generatePlan();
    } else {
      renderInventorySummary({ consumedTotal: 0, uncoveredTotal: 0, parseErrors: [] });
    }

    if (imported.warnings.length > 0) {
      const importedCount = imported.entries.reduce((sum, entry) => sum + entry.count, 0);
      window.alert(`Imported ${importedCount} Pokemon with ${imported.warnings.length} warning(s).\n${imported.warnings.slice(0, 5).join("\n")}${imported.warnings.length > 5 ? "\n..." : ""}`);
    }
  } catch (error) {
    window.alert(error instanceof Error ? error.message : "No se pudo importar el JSON de monsters de PokeMMO.");
  } finally {
    event.target.value = "";
  }
}

function parsePokeMMOInventory(parsed, options = {}) {
  const skipOtValues = new Set(options.skipOtValues || []);
  const excludeHatched = Boolean(options.excludeHatched);
  const requireBothFilters = Boolean(options.requireBothFilters);
  const skipLevel100 = Boolean(options.skipLevel100);
  const sources = [
    ...(Array.isArray(parsed?.accountPC) ? parsed.accountPC : []),
    ...(Array.isArray(parsed?.party) ? parsed.party : [])
  ];
  const warnings = [];
  const grouped = new Map();

  for (const [index, pokemon] of sources.entries()) {
    const ot = String(pokemon?.ot || "").trim().toLowerCase();
    const matchesOtFilter = skipOtValues.has(ot);
    const matchesHatchedFilter = excludeHatched
      && pokemon?.capture_data?.is_hatched === true
      && Number(pokemon?.level) > 1;
    const shouldExcludeForBreedingFilters = requireBothFilters
      ? matchesOtFilter && matchesHatchedFilter
      : matchesOtFilter || matchesHatchedFilter;
    if (shouldExcludeForBreedingFilters) {
      continue;
    }

    if (skipLevel100 && Number(pokemon?.level) === 100) {
      continue;
    }

    const speciesEntry = resolveSpeciesEntry(pokemon?.species_name || pokemon?.name || "");
    if (!speciesEntry) {
      warnings.push(`Unknown species skipped at record ${index + 1}.`);
      continue;
    }

    const ivValues = String(pokemon?.ivs || "").split("/").map((value) => Number(value));
    const ivs = STATS.filter((stat, statIndex) => ivValues[statIndex] === 31);
    const gender = pokemon?.gender === 0 ? "Male" : pokemon?.gender === 1 ? "Female" : "Any";
    const nature = normalizeInventoryNature(pokemon?.nature_name);
    const key = `${speciesEntry.apiName}|${gender}|${nature}|${ivs.join(",")}`;
    const existing = grouped.get(key);
    if (existing) {
      existing.count += 1;
      continue;
    }

    grouped.set(key, {
      speciesApiName: speciesEntry.apiName,
      species: speciesEntry.displayName,
      gender,
      nature,
      ivs,
      count: 1
    });
  }

  return {
    entries: [...grouped.values()],
    warnings
  };
}

function openInventoryImportModal() {
  const modal = document.getElementById("inventoryImportModal");
  const jsonBtn = document.getElementById("inventoryImportJsonOptionBtn");
  const pasteSubmitBtn = document.getElementById("inventoryImportPasteSubmitBtn");
  const pokeMMOBtn = document.getElementById("inventoryImportPokeMMOOptionBtn");
  const cancelBtn = document.getElementById("inventoryImportCancelBtn");

  if (!modal || !jsonBtn || !pokeMMOBtn || !cancelBtn || !pasteSubmitBtn) {
    el.inventoryImportInput.click();
    return;
  }

  ensureInventoryImportModalBindings();
  setInventoryImportTab("breeder");
  modal.hidden = false;
}

function closeInventoryImportModal() {
  const modal = document.getElementById("inventoryImportModal");
  const textarea = document.getElementById("inventoryPokepasteInput");
  if (!modal) {
    return;
  }

  modal.hidden = true;
  if (textarea) {
    textarea.value = "";
  }
}

function getInventoryImportOverride(inputId) {
  return document.getElementById(inputId)?.checked ?? true;
}

function setInventoryImportTab(tabName) {
  const tabMap = {
    breeder: ["inventoryImportBreederTab", "inventoryImportBreederPanel"],
    pokepaste: ["inventoryImportPokePasteTab", "inventoryImportPokePastePanel"],
    pokemmo: ["inventoryImportPokeMMOTab", "inventoryImportPokeMMOPanel"]
  };

  for (const [name, [tabId, panelId]] of Object.entries(tabMap)) {
    const tab = document.getElementById(tabId);
    const panel = document.getElementById(panelId);
    const isActive = name === tabName;
    tab?.classList.toggle("is-active", isActive);
    tab?.setAttribute("aria-selected", String(isActive));
    if (panel) {
      panel.hidden = !isActive;
      panel.setAttribute("aria-hidden", String(!isActive));
      panel.querySelectorAll("input, textarea, select, button").forEach((control) => {
        control.disabled = !isActive;
      });
    }
  }
}

function ensureInventoryImportModalBindings() {
  const modal = document.getElementById("inventoryImportModal");
  if (!modal || modal.dataset.bound === "1") {
    return;
  }

  const jsonBtn = document.getElementById("inventoryImportJsonOptionBtn");
  const pasteSubmitBtn = document.getElementById("inventoryImportPasteSubmitBtn");
  const pokeMMOBtn = document.getElementById("inventoryImportPokeMMOOptionBtn");
  const cancelBtn = document.getElementById("inventoryImportCancelBtn");
  const breederTab = document.getElementById("inventoryImportBreederTab");
  const pokePasteTab = document.getElementById("inventoryImportPokePasteTab");
  const pokeMMOTab = document.getElementById("inventoryImportPokeMMOTab");
  const card = modal.querySelector(".inventory-import-modal__card");

  breederTab?.addEventListener("click", () => setInventoryImportTab("breeder"));
  pokePasteTab?.addEventListener("click", () => setInventoryImportTab("pokepaste"));
  pokeMMOTab?.addEventListener("click", () => setInventoryImportTab("pokemmo"));

  jsonBtn?.addEventListener("click", () => {
    closeInventoryImportModal();
    el.inventoryImportInput.click();
  });

  pokeMMOBtn?.addEventListener("click", () => {
    closeInventoryImportModal();
    el.inventoryPokeMMOImportInput.click();
  });

  cancelBtn?.addEventListener("click", closeInventoryImportModal);
  pasteSubmitBtn?.addEventListener("click", importInventoryFromPokePaste);

  modal.addEventListener("click", (event) => {
    if (event.target === modal) {
      closeInventoryImportModal();
    }
  });

  card?.addEventListener("click", (event) => {
    event.stopPropagation();
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !modal.hidden) {
      closeInventoryImportModal();
    }
  });

  modal.dataset.bound = "1";
}

function importInventoryFromPokePaste() {
  const textarea = document.getElementById("inventoryPokepasteInput");
  const rawText = textarea?.value || "";

  try {
    const parsed = parsePokePasteInventory(rawText);
    if (parsed.entries.length === 0) {
      throw new Error("No se pudo interpretar ningún Pokémon válido del texto pegado.");
    }

    const importedInventory = hydrateInventory(parsed.entries);
    if (importedInventory.length === 0) {
      throw new Error("No se pudo importar ninguna entrada de inventario válida.");
    }

    const override = getInventoryImportOverride("inventoryImportPokePasteOverrideChk");
    state.inventory = override ? importedInventory : [...state.inventory, ...importedInventory];
    persistInventory();
    renderInventoryList();
    clearInventoryForm();

    if (state.targets.length > 0) {
      generatePlan();
    } else {
      renderInventorySummary({ consumedTotal: 0, uncoveredTotal: 0, parseErrors: [] });
    }

    closeInventoryImportModal();

    if (parsed.warnings.length > 0) {
      window.alert(`Imported ${parsed.entries.length} Pokemon with ${parsed.warnings.length} warning(s).\n${parsed.warnings.slice(0, 5).join("\n")}${parsed.warnings.length > 5 ? "\n..." : ""}`);
    }
  } catch (error) {
    window.alert(error instanceof Error ? error.message : "No se pudo importar el inventario desde PokePaste.");
  }
}

function parsePokePasteInventory(rawText) {
  const normalized = String(rawText || "").replace(/\r/g, "").trim();
  if (!normalized) {
    throw new Error("Primero pegá el texto de PokePaste.");
  }

  const blocks = splitPokePasteBlocks(normalized);
  const warnings = [];
  const grouped = new Map();

  for (const block of blocks) {
    const rawLines = block
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);
    if (rawLines.length === 0) {
      continue;
    }

    const lines = rawLines.filter((line) => !/^EVs\s*:/i.test(line));
    if (lines.length === 0) {
      continue;
    }

    const headerInfo = parsePokePasteHeaderLine(lines[0]);
    const speciesLabel = headerInfo.speciesLabel;
    const speciesEntry = resolveSpeciesEntry(speciesLabel);
    if (!speciesEntry) {
      warnings.push(`Unknown species skipped: ${speciesLabel}`);
      continue;
    }

    const natureLine = lines.find((line) => /\sNature$/i.test(line));
    const natureMatch = natureLine ? natureLine.match(/^([A-Za-z-]+)\s+Nature$/i) : null;
    const nature = normalizeInventoryNature(natureMatch?.[1] || "Any");

    const genderLine = rawLines.find((line) => /^Gender[\s:]/i.test(line));
    const genderRaw = genderLine ? genderLine.replace(/^Gender[\s:]+/i, "").trim() : "";
    const lineGender = normalizeInventoryGender(genderRaw);
    const headerGender = normalizeInventoryGender(headerInfo.genderRaw);
    const gender = lineGender !== "Any" ? lineGender : headerGender;

    const ivLine = lines.find((line) => /^IVs\s*:/i.test(line));
    const ivs = [];
    if (ivLine) {
      const statRegex = /(\d+)\s*(HP|Atk|Def|SpA|SpD|Spe)/gi;
      let match;
      while ((match = statRegex.exec(ivLine)) !== null) {
        const value = Number(match[1]);
        const stat = match[2];
        if (value === 31 && STATS.includes(stat)) {
          ivs.push(stat);
        }
      }
    }

    const dedupedIvs = [...new Set(ivs)];
    const key = `${speciesEntry.apiName}|${gender}|${nature}|${dedupedIvs.slice().sort().join(",")}`;
    const existing = grouped.get(key);
    if (existing) {
      existing.count += 1;
      continue;
    }

    grouped.set(key, {
      speciesApiName: speciesEntry.apiName,
      species: speciesEntry.displayName,
      gender,
      nature,
      ivs: dedupedIvs,
      count: 1
    });
  }

  return {
    entries: [...grouped.values()],
    warnings
  };
}

function splitPokePasteBlocks(normalizedText) {
  const lines = String(normalizedText || "").replace(/\r/g, "").split("\n");
  const blocks = [];
  let current = [];

  for (const rawLine of lines) {
    const line = rawLine.trim();

    if (!line) {
      if (current.length > 0) {
        blocks.push(current.join("\n"));
        current = [];
      }
      continue;
    }

    if (isPokePasteSpeciesHeader(line) && current.length > 0) {
      blocks.push(current.join("\n"));
      current = [line];
      continue;
    }

    current.push(line);
  }

  if (current.length > 0) {
    blocks.push(current.join("\n"));
  }

  return blocks.map((chunk) => chunk.trim()).filter(Boolean);
}

function isPokePasteSpeciesHeader(line) {
  const value = String(line || "").trim();
  if (!value) {
    return false;
  }

  if (/^-\s/.test(value)) {
    return false;
  }

  if (/^(Ability|Level|IVs|EVs|Gender|Happiness|Shiny|Nature|Tera Type|OT)\s*:/i.test(value)) {
    return false;
  }

  if (/^Gender\s+(Male|Female|M|F)$/i.test(value)) {
    return false;
  }

  if (/\sNature$/i.test(value)) {
    return false;
  }

  return !/:/.test(value);
}

function parsePokePasteHeaderLine(rawLine) {
  const withoutItem = String(rawLine || "").replace(/\s*@.*$/, "").trim();
  let genderRaw = "";

  const explicitGenderMatch = withoutItem.match(/\(\s*Gender\s+([A-Za-z]+)\s*\)/i);
  if (explicitGenderMatch) {
    genderRaw = explicitGenderMatch[1] || "";
  } else {
    const shortGenderMatch = withoutItem.match(/\((M|F)\)\s*$/i);
    if (shortGenderMatch) {
      genderRaw = shortGenderMatch[1] || "";
    }
  }

  let cleaned = withoutItem
    .replace(/\s*\(\s*Gender\s+[A-Za-z]+\s*\)/gi, "")
    .replace(/\s*\((M|F)\)\s*$/i, "")
    .trim();

  const bracketMatches = [...cleaned.matchAll(/\(([^()]+)\)/g)];
  for (const match of bracketMatches) {
    const candidate = String(match[1] || "").trim();
    if (!candidate || /^Gender\b/i.test(candidate)) {
      continue;
    }

    if (resolveSpeciesEntry(candidate)) {
      return {
        speciesLabel: candidate,
        genderRaw
      };
    }
  }

  if (!resolveSpeciesEntry(cleaned) && bracketMatches.length > 0) {
    const fallback = String(bracketMatches[0][1] || "").trim();
    if (fallback) {
      cleaned = fallback;
    }
  }

  return {
    speciesLabel: cleaned,
    genderRaw
  };
}

function normalizeInventoryGender(rawGender) {
  const value = String(rawGender || "").trim().toLowerCase();
  if (value.startsWith("m")) {
    return "Male";
  }
  if (value.startsWith("f")) {
    return "Female";
  }
  return "Any";
}

function normalizeInventoryNature(rawNature) {
  const value = String(rawNature || "").trim();
  if (!value || /^any$/i.test(value) || value === "-") {
    return "Any";
  }

  const matched = NATURES.find((nature) => nature.toLowerCase() === value.toLowerCase());
  if (!matched) {
    return "Any";
  }

  return matched;
}

function renderInventorySummary(allocation) {
  const totalLines = state.inventory.length;
  const totalUnits = state.inventory.reduce((sum, entry) => sum + entry.count, 0);
  const consumed = allocation?.consumedTotal || 0;
  const uncovered = allocation?.uncoveredTotal || 0;
  const parseErrors = allocation?.parseErrors || [];

  if (totalUnits === 0) {
    el.inventorySummary.className = "species-meta empty";
    el.inventorySummary.textContent = "No hay inventario cargado. El planificador asumirá que hay que conseguir todos los reproductores.";
    return;
  }

  const errorLines = parseErrors.length > 0
    ? `<div class=\"target-meta\">Warnings: ${escapeHtml(parseErrors.slice(0, 5).join(" | "))}${parseErrors.length > 5 ? " ..." : ""}</div>`
    : "";

  el.inventorySummary.className = "species-meta";
  el.inventorySummary.innerHTML = `
    <div><strong>Loaded Inventory: ${totalUnits} Pokemon across ${totalLines} lines</strong></div>
    <div class="target-meta">Matched from inventory: ${consumed}</div>
    <div class="target-meta">Still needed to catch/buy: ${uncovered}</div>
    ${errorLines}
  `;
}

function exportCostsToJson() {
  const config = readCostConfig();
  const payload = {
    version: 1,
    exportedAt: new Date().toISOString(),
    costs: {
      twoperfectivsSupport: Boolean(config.twoperfectivsSupport),
      brace: config.brace,
      everstone: config.everstone,
      maleEggGroupPrices: { ...config.maleEggGroupPrices },

      maleTwoperfectivsEggGroupPrices: { ...config.maleTwoperfectivsEggGroupPrices }
    }
  };

  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = "pokemmo-breeder-costs.json";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

async function importCostsFromJson(event) {
  const file = event.target.files?.[0];
  if (!file) {
    return;
  }

  try {
    const text = await file.text();
    const parsed = JSON.parse(text);
    const rawCosts = parsed?.costs ?? parsed;
    const importedCosts = normalizeImportedCosts(rawCosts);
    if (!importedCosts) {
      throw new Error("Formato de importación de costos inválido.");
    }

    applyPersistedSettingsToUi(importedCosts);
    state.costConfig = { ...state.costConfig, ...readCostConfig() };
    syncTwoperfectivsSupportUi();
    persistSettingsFromUi();

    if (state.targets.length > 0) {
      refreshCostsAfterInput();
    }
  } catch (error) {
    window.alert(error instanceof Error ? error.message : "No se pudo importar el JSON de costos.");
  } finally {
    event.target.value = "";
  }
}

function normalizeImportedCosts(rawCosts) {
  if (!rawCosts || typeof rawCosts !== "object") {
    return null;
  }

  const normalized = {};

  const twoperfectivsSupport = rawCosts.twoperfectivsSupport;
  if (typeof twoperfectivsSupport === "boolean") {
    normalized.twoperfectivsSupport = twoperfectivsSupport;
  }

  if (Number.isFinite(rawCosts.brace)) {
    normalized.brace = Math.max(0, rawCosts.brace);
  }

  if (Number.isFinite(rawCosts.everstone)) {
    normalized.everstone = Math.max(0, rawCosts.everstone);
  }

  if (rawCosts.maleEggGroupPrices && typeof rawCosts.maleEggGroupPrices === "object") {
    normalized.maleEggGroupPrices = {};
    for (const [group, value] of Object.entries(rawCosts.maleEggGroupPrices)) {
      if (!Number.isFinite(value)) {
        continue;
      }

      normalized.maleEggGroupPrices[group] = Math.max(0, value);
    }
  }

  const maleTwoperfectivsEggGroupPrices = rawCosts.maleTwoperfectivsEggGroupPrices;

  if (maleTwoperfectivsEggGroupPrices && typeof maleTwoperfectivsEggGroupPrices === "object") {
    normalized.maleTwoperfectivsEggGroupPrices = {};
    for (const [group, value] of Object.entries(maleTwoperfectivsEggGroupPrices)) {
      if (!Number.isFinite(value)) {
        continue;
      }

      normalized.maleTwoperfectivsEggGroupPrices[group] = Math.max(0, value);
    }
  }

  const hasKnownFields = [
    "twoperfectivsSupport",
    "brace",
    "everstone",
    "maleEggGroupPrices",
    "maleTwoperfectivsEggGroupPrices"
  ].some((field) => Object.prototype.hasOwnProperty.call(normalized, field));

  return hasKnownFields ? normalized : null;
}

function loadPersistedSettings() {
  try {
    const raw = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch {
    return null;
  }
}

function applyPersistedSettingsToUi(settings) {
  if (!settings) {
    return;
  }

  if (typeof settings.inventoryEnabled === "boolean") {
    state.inventoryEnabled = settings.inventoryEnabled;
    if (el.inventoryEnabledInput) {
      el.inventoryEnabledInput.checked = settings.inventoryEnabled;
    }
  }

  const twoperfectivsSupport = settings.twoperfectivsSupport;
  if (typeof twoperfectivsSupport === "boolean") {
    el.twoperfectivsSupportInput.checked = twoperfectivsSupport;
    state.costConfig.twoperfectivsSupport = twoperfectivsSupport;
  }

  if (Number.isFinite(settings.brace)) {
    el.costBraceInput.value = String(settings.brace);
  }

  if (Number.isFinite(settings.everstone)) {
    el.costEverstoneInput.value = String(settings.everstone);
  }

  for (const input of el.maleEggGroupCosts.querySelectorAll("input[data-egg-group][data-price-type='male']")) {
    const value = settings.maleEggGroupPrices?.[input.dataset.eggGroup];
    if (Number.isFinite(value)) {
      input.value = String(value);
    }
  }

  for (const input of el.twoperfectivsEggGroupCosts.querySelectorAll("input[data-egg-group][data-price-type='twoperfectivs']")) {
    const twoperfectivsPrices = settings.maleTwoperfectivsEggGroupPrices;
    const value = twoperfectivsPrices?.[input.dataset.eggGroup];
    if (Number.isFinite(value)) {
      input.value = String(value);
    }
  }
}

function persistSettingsFromUi() {
  state.costConfig = readCostConfig();
  localStorage.setItem(TWOPERFECTIVS_SUPPORT_STORAGE_KEY, String(state.costConfig.twoperfectivsSupport));
  localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify({
    inventoryEnabled: state.inventoryEnabled,
    twoperfectivsSupport: state.costConfig.twoperfectivsSupport,
    brace: state.costConfig.brace,
    everstone: state.costConfig.everstone,
    maleEggGroupPrices: state.costConfig.maleEggGroupPrices,
    maleTwoperfectivsEggGroupPrices: state.costConfig.maleTwoperfectivsEggGroupPrices
  }));
}



function findCarrierBoost(target, mutableSlots) {
  if (!mutableSlots || mutableSlots.length === 0) return null;

  const requiredStats = STATS.filter((s) => target.ivs[s] === 31);
  const families = state.evolutionFamilies || {};
  const targetApiEntry = state.speciesByDisplay.get(normalize(target.species));
  const targetApiName = targetApiEntry ? targetApiEntry.apiName : null;
  const targetFamily = targetApiName ? families[targetApiName] : null;
  if (!targetFamily) return null;

  const breedingContext = resolveTargetBreedingContext(target);
  const carrierGender = breedingContext.carrierGender === "Female" ? "Female" : null;

  let bestSlot = null;
  let bestBoost = null;
  let bestScore = 0; // only use a boost if it covers at least 1 thing

  for (const slot of mutableSlots) {
    if (!slot || slot.remaining <= 0) continue;
    const entry = slot.entry;

    const entryFamily = families[entry.speciesApiName];
    if (!entryFamily || entryFamily !== targetFamily) continue;

    if (carrierGender === "Female") {
      if (entry.gender !== "Female" && entry.gender !== "Any") continue;
    }

    const hasNature = target.nature !== "Any" && entry.nature === target.nature;
    const coveredStats = requiredStats.filter((s) => entry.ivs.has(s));
    const score = (hasNature ? 1 : 0) + coveredStats.length;

    if (score > bestScore) {
      bestScore = score;
      bestSlot = slot;
      bestBoost = { hasNature, preloadedStats: new Set(coveredStats), entry };
    }
  }

  if (bestSlot && bestBoost) {
    bestSlot.remaining -= 1; // reserve this entry for this target
    return bestBoost;
  }
  return null;
}

function findMaleDittoCarrierFallback(target, mutableSlots) {
  if (!mutableSlots || mutableSlots.length === 0) {
    return null;
  }

  const breedingContext = resolveTargetBreedingContext(target);
  if (breedingContext.carrierGender !== "Female") {
    return null;
  }

  const dittoEntry = state.speciesByDisplay.get(normalize("Ditto"));
  if (!dittoEntry) {
    return null;
  }

  const carrierEntry = state.speciesByDisplay.get(normalize(breedingContext.carrierSpecies));
  const targetFamily = carrierEntry?.apiName ? (state.evolutionFamilies || {})[carrierEntry.apiName] : null;
  const maleCandidates = mutableSlots.filter((slot) => {
    if (!slot || slot.remaining <= 0 || !slot.entry) {
      return false;
    }
    const entryFamily = (state.evolutionFamilies || {})[slot.entry.speciesApiName];
    return (slot.entry.gender === "Male" || slot.entry.gender === "Any")
      && (slot.entry.speciesApiName === carrierEntry?.apiName || (targetFamily && entryFamily === targetFamily));
  });
  maleCandidates.sort((a, b) => {
    const aIsExact = a.entry.speciesApiName === carrierEntry?.apiName;
    const bIsExact = b.entry.speciesApiName === carrierEntry?.apiName;
    return Number(bIsExact) - Number(aIsExact);
  });
  const maleSlot = maleCandidates[0];
  const dittoSlot = mutableSlots.find((slot) => slot !== maleSlot
    && slot?.remaining > 0
    && slot.entry?.speciesApiName === dittoEntry.apiName);

  if (!maleSlot || !dittoSlot) {
    return null;
  }

  maleSlot.remaining -= 1;
  dittoSlot.remaining -= 1;
  return {
    male: maleSlot.entry,
    ditto: dittoSlot.entry,
    sourceSpecies: maleSlot.entry.species
  };
}

function generatePlan() {
  if (state.targets.length === 0) {
    window.alert("Add at least one target first.");
    return;
  }

  state.planByTargetId.clear();
  state.graphCache.clear();
  state.costConfig = readCostConfig();

  const allBaseNeeds = new Map();
  const plans = [];
  const effectiveInventory = state.inventoryEnabled ? state.inventory : [];
  const boostSlots = effectiveInventory.map((e) => ({ entry: e, remaining: e.count }));

  for (const target of state.targets) {
    const carrierBoost = findCarrierBoost(target, boostSlots);
    const carrierFallback = carrierBoost ? null : findMaleDittoCarrierFallback(target, boostSlots);
    const plan = buildTargetPlan(target, carrierBoost, carrierFallback);
    state.planByTargetId.set(target.id, plan);
    state.graphCache.set(target.id, buildGraphElementsForPlan(plan));
    plans.push(plan);

    for (const [key, amount] of plan.baseNeeds.entries()) {
      const current = allBaseNeeds.get(key) || 0;
      allBaseNeeds.set(key, current + amount);
    }
  }

  const normalizedNeeds = normalizeNeedsWithCompatibleGroups(allBaseNeeds, plans);
  state.lastGlobalNeeds = normalizedNeeds;
  const inventoryAllocation = allocateInventoryToNeeds(normalizedNeeds, effectiveInventory);

  const allocationsByNeedKey = new Map();
  for (const allocation of inventoryAllocation.allocatedInventoryEntries) {
    const list = allocationsByNeedKey.get(allocation.needKey) || [];
    list.push(allocation.entry);
    allocationsByNeedKey.set(allocation.needKey, list);
  }

  for (const elements of state.graphCache.values()) {
    const nodeById = new Map(elements.nodes.map((node) => [node.data.id, node.data]));
    const childNodesByParentId = buildChildNodesByParentId(nodeById);

    for (const cyNode of elements.nodes) {
      if (cyNode.data.kind === "leaf" && cyNode.data.needKey) {
        const availableEntries = allocationsByNeedKey.get(cyNode.data.needKey) || [];
        if (availableEntries.length > 0) {
          const isGenericDonor = normalize(cyNode.data.species) === normalize("Compatible Egg-Group Donor");
          const requiredGroup = String(cyNode.data.eggGroupUsed || "").trim();
          const needInfo = parseNeedKey(cyNode.data.needKey);
          const compatibleGroups = (needInfo.candidateEggGroups || []).map((group) => String(group || "").trim()).filter(Boolean);
          const nodeGroups = (cyNode.data.eggGroups || [])
            .map((group) => String(group || "").trim())
            .filter((group) => group && group !== "Undiscovered" && group !== "Ditto");
          const allowedGroups = compatibleGroups.length > 0
            ? compatibleGroups
            : (requiredGroup ? [requiredGroup] : nodeGroups);

          let chosenIndex = isGenericDonor ? -1 : 0;
          if (isGenericDonor) {


            if (requiredGroup) {
              chosenIndex = availableEntries.findIndex((entry) => {
                const entryGroups = (entry?.eggGroups || []).map((group) => String(group || "").trim());
                return entryGroups.includes(requiredGroup)
                  && doesInventoryEntryKeepNodePairCompatible(cyNode.data, entry, nodeById, childNodesByParentId);
              });
            }


            if (chosenIndex < 0) {
              chosenIndex = availableEntries.findIndex((entry) => {
                const entryGroups = (entry?.eggGroups || []).map((group) => String(group || "").trim());
                return allowedGroups.length > 0
                  && allowedGroups.some((group) => entryGroups.includes(group))
                  && doesInventoryEntryKeepNodePairCompatible(cyNode.data, entry, nodeById, childNodesByParentId);
              });
            }
          }

          if (chosenIndex < 0) {
            continue;
          }

          cyNode.data.fromInventory = true;
          cyNode.data.sourceIconPath = "assets/ball.png";
          if (!cyNode.data.inventoryEntry) {
            cyNode.data.inventoryEntry = availableEntries.splice(chosenIndex, 1)[0];
            if (isGenericDonor && compatibleGroups.length > 0) {
              const entryGroups = (cyNode.data.inventoryEntry?.eggGroups || []).map((group) => String(group || "").trim()).filter(Boolean);
              const matchedGroup = entryGroups.find((group) => compatibleGroups.includes(group));
              if (matchedGroup) {
                cyNode.data.eggGroupUsed = matchedGroup;
              }
            }
          }
          cyNode.data.label = buildNodePlannerLabel(cyNode.data);
        }
      }
    }


    enforceNodePairCompatibility(elements.nodes, nodeById);
  }

  const finalizedAllocation = buildAllocationFromBoundNodes(normalizedNeeds, state.graphCache);
  state.latestGeneratedPlans = plans;
  state.latestFinalizedAllocation = finalizedAllocation;

  renderAcquisitionPriorityList(finalizedAllocation.remainingNeeds, state.costConfig);
  renderShoppingList(finalizedAllocation.remainingNeeds, finalizedAllocation.allocatedInventoryEntries, state.costConfig);
  renderBuyChecklist(finalizedAllocation.remainingNeeds, plans, state.costConfig);
  renderItemNeedsList(plans, state.costConfig);
  renderPathAlternatives(plans, finalizedAllocation, state.costConfig);
  renderPlanCompare(plans, finalizedAllocation, state.costConfig);
  renderPlanExplanations(plans, finalizedAllocation, state.costConfig);
  renderInventorySummary(finalizedAllocation);
  const needsCost = estimateNeedsCost(finalizedAllocation.remainingNeeds, state.costConfig);
  const consumableCost = plans.reduce((sum, plan) => sum + estimateConsumablesCost(plan, state.costConfig), 0);
  renderTotalCostSummary(needsCost.total + consumableCost, needsCost.total, consumableCost);
  hydrateGraphSelect(plans);
  setGraphCollapsed(true);
  renderSelectedGraph();
}

function getNodeDisplayBreedingGroups(nodeData) {
  if (!nodeData) {
    return [];
  }

  const groups = [];
  if (nodeData.kind === "leaf" && nodeData.fromInventory && nodeData.inventoryEntry) {
    groups.push(...(nodeData.inventoryEntry.eggGroups || []));
  } else if (normalize(nodeData.species) === normalize("Compatible Egg-Group Donor")) {
    groups.push(nodeData.eggGroupUsed || "");
  } else {
    groups.push(...(nodeData.eggGroups || []));
  }

  return groups
    .map((group) => String(group || "").trim())
    .filter((group) => group && group !== "Undiscovered" && group !== "Ditto");
}

function unbindNodeInventory(nodeData) {
  if (!nodeData || !nodeData.fromInventory) {
    return;
  }

  nodeData.fromInventory = false;
  nodeData.sourceIconPath = "assets/gtl.png";
  nodeData.inventoryEntry = null;
  nodeData.label = buildNodePlannerLabel(nodeData);
}

function enforceNodePairCompatibility(nodes, nodeById) {
  const MAX_PASSES = 8;

  for (let pass = 0; pass < MAX_PASSES; pass += 1) {
    let changed = false;

    for (const wrappedNode of nodes) {
      const nodeData = wrappedNode?.data;
      if (!nodeData || !Array.isArray(nodeData.parents) || nodeData.parents.length < 2) {
        continue;
      }

      const parentA = nodeById.get(nodeData.parents[0]);
      const parentB = nodeById.get(nodeData.parents[1]);
      if (!parentA || !parentB) {
        continue;
      }

      const groupsA = getNodeDisplayBreedingGroups(parentA);
      const groupsB = getNodeDisplayBreedingGroups(parentB);
      if (groupsA.length === 0 || groupsB.length === 0) {
        continue;
      }

      const compatible = groupsA.some((group) => groupsB.includes(group));
      if (compatible) {
        continue;
      }

      if (parentA.fromInventory) {
        unbindNodeInventory(parentA);
        changed = true;
      }
      if (parentB.fromInventory) {
        unbindNodeInventory(parentB);
        changed = true;
      }
    }

    if (!changed) {
      break;
    }
  }
}

function buildAllocationFromBoundNodes(globalNeeds, graphCache) {
  const allocatedInventoryEntries = [];
  const consumedByNeedKey = new Map();

  for (const elements of graphCache.values()) {
    for (const wrappedNode of elements.nodes) {
      const nodeData = wrappedNode?.data;
      if (!nodeData || nodeData.kind !== "leaf" || !nodeData.needKey) {
        continue;
      }

      if (!nodeData.fromInventory || !nodeData.inventoryEntry) {
        continue;
      }

      allocatedInventoryEntries.push({ needKey: nodeData.needKey, entry: nodeData.inventoryEntry });
      consumedByNeedKey.set(nodeData.needKey, (consumedByNeedKey.get(nodeData.needKey) || 0) + 1);
    }
  }

  const remainingNeeds = new Map();
  for (const [needKey, amount] of (globalNeeds || new Map()).entries()) {
    const consumed = consumedByNeedKey.get(needKey) || 0;
    const left = Math.max(0, amount - consumed);
    if (left > 0) {
      remainingNeeds.set(needKey, left);
    }
  }

  const consumedTotal = allocatedInventoryEntries.length;
  const uncoveredTotal = [...remainingNeeds.values()].reduce((sum, value) => sum + value, 0);

  return {
    remainingNeeds,
    allocatedNeeds: consumedByNeedKey,
    allocatedInventoryEntries,
    consumedTotal,
    uncoveredTotal,
    parseErrors: []
  };
}

function getNodeEffectiveEggGroups(nodeData) {
  if (!nodeData) {
    return [];
  }

  const normalizeGroups = (groups) => (groups || [])
    .map((group) => String(group || "").trim())
    .filter((group) => group && group !== "Undiscovered" && group !== "Ditto");

  if (nodeData.kind === "leaf" && nodeData.fromInventory && nodeData.inventoryEntry) {
    return normalizeGroups(nodeData.inventoryEntry.eggGroups);
  }

  if (normalize(nodeData.species) === normalize("Compatible Egg-Group Donor")) {
    if (nodeData.eggGroupUsed) {
      return [nodeData.eggGroupUsed];
    }
    return [];
  }

  return normalizeGroups(nodeData.eggGroups);
}

function buildChildNodesByParentId(nodeById) {
  const childMap = new Map();

  for (const nodeData of nodeById.values()) {
    if (!Array.isArray(nodeData.parents) || nodeData.parents.length === 0) {
      continue;
    }

    for (const parentId of nodeData.parents) {
      const list = childMap.get(parentId) || [];
      list.push(nodeData);
      childMap.set(parentId, list);
    }
  }

  return childMap;
}

function doesInventoryEntryKeepNodePairCompatible(nodeData, candidateEntry, nodeById, childNodesByParentId) {
  if (!nodeData || !candidateEntry || !(nodeById instanceof Map) || !(childNodesByParentId instanceof Map)) {
    return false;
  }

  const childNodes = childNodesByParentId.get(nodeData.id) || [];

  if (childNodes.length === 0) {
    return true;
  }

  const candidateGroups = (candidateEntry.eggGroups || [])
    .map((group) => String(group || "").trim())
    .filter((group) => group && group !== "Undiscovered" && group !== "Ditto");
  if (candidateGroups.length === 0) {
    return false;
  }

  for (const childNode of childNodes) {
    if (!Array.isArray(childNode.parents) || childNode.parents.length < 2) {
      continue;
    }

    const siblingId = childNode.parents.find((parentId) => parentId !== nodeData.id);
    const siblingNode = siblingId ? nodeById.get(siblingId) : null;
    if (!siblingNode) {
      continue;
    }

    const siblingGroups = getNodeEffectiveEggGroups(siblingNode).map((group) => String(group || "").trim());
    if (siblingGroups.length === 0) {
      return false;
    }

    const isCompatibleWithSibling = candidateGroups.some((group) => siblingGroups.includes(group));
    if (!isCompatibleWithSibling) {
      return false;
    }
  }

  return true;
}

function setGraphCollapsed(isCollapsed) {
  el.graphPanelBody.classList.toggle("is-collapsed", isCollapsed);
  el.graphCollapseToggle.setAttribute("aria-expanded", String(!isCollapsed));
  el.graphCollapseToggle.textContent = isCollapsed ? "Expand" : "Collapse";
}


function toggleGraphCollapsed() {
  const isCollapsed = el.graphPanelBody.classList.contains("is-collapsed");
  setGraphCollapsed(!isCollapsed);

  if (!isCollapsed || !state.cy) {
    return;
  }

  requestAnimationFrame(() => {
    state.cy.resize();
    state.cy.fit(undefined, 30);
  });
}

function buildTargetPlan(target, carrierBoost = null, carrierFallback = null) {
  let nodeSeq = 1;
  let stepSeq = 1;

  const steps = [];
  const baseNeeds = new Map();
  const leaves = [];
  const allNodes = [];
  const requiredStats = STATS.filter((s) => target.ivs[s] === 31);

  const preloadedNature = !!(carrierBoost && carrierBoost.hasNature);
  const rawPreloadedStats = (carrierBoost && carrierBoost.preloadedStats) ? carrierBoost.preloadedStats : new Set();
  const carrierFullyMatchesTarget = (target.nature === "Any" || preloadedNature)
    && requiredStats.every((stat) => rawPreloadedStats.has(stat));


  const effectiveRequiredStats = preloadedNature
    ? requiredStats
    : requiredStats.filter((s) => !rawPreloadedStats.has(s));
  const families = state.evolutionFamilies || {};
  const targetApiEntry = state.speciesByDisplay.get(normalize(target.species));
  const targetFamilyApiName = targetApiEntry?.apiName ? families[targetApiEntry.apiName] || null : null;
  const breedingContext = resolveTargetBreedingContext(target);
  const carrierSpecies = breedingContext.carrierSpecies;
  const carrierEggGroups = breedingContext.carrierEggGroups;
  const carrierGender = breedingContext.carrierGender;
  const donorGender = breedingContext.donorGender;
  const finalResultGender = breedingContext.finalResultGender;
  const needsEvolutionFinal = breedingContext.usesFamilyLineCarrier;
  const donorDisplaySpecies = "Compatible Egg-Group Donor";
  const useFamilyLineDonor = target.genderProfile.mode === "Genderless" && !!targetFamilyApiName;
  const dittoEntry = state.speciesByDisplay.get(normalize("Ditto"));

  if (target.eggGroups.includes("Undiscovered")) {
    steps.push({
      id: `${target.id}-s${stepSeq++}`,
      text: "Warning: species is in Undiscovered egg group and cannot follow normal breeding chains.",
      branch: "Prechecks",
      bracesUsed: 0,
      everstoneUsed: 0,
      itemsUsed: []
    });
  }

  if (carrierGender !== "Female" && target.genderProfile.mode !== "Genderless") {
    steps.push({
      id: `${target.id}-s${stepSeq++}`,
      text: "Warning: this species cannot be female under normal rules. Final-step carrier fallback was applied.",
      branch: "Prechecks",
      bracesUsed: 0,
      everstoneUsed: 0,
      itemsUsed: []
    });
  }

  const carrierEggGroup = resolveNeedEggGroup(carrierEggGroups, carrierGender, state.costConfig);
  const donorEggGroup = resolveNeedEggGroup(target.eggGroups, donorGender, state.costConfig);
  const donorAllowedGroups = target.eggGroups.filter((group) => group !== "Undiscovered" && group !== "Ditto");
  const donorGroupsTag = donorAllowedGroups.length > 0 ? `|Groups:${donorAllowedGroups.join(",")}` : "";
  const donorFamilyTag = useFamilyLineDonor ? `|Family:${targetFamilyApiName}` : "";
  const anchorStat = effectiveRequiredStats[0] || null;

  const carrierNode = {
    id: `${target.id}-n${nodeSeq++}`,
    label: `${carrierSpecies} carrier\n${carrierGender}\n${carrierEggGroup}`,
    kind: carrierFallback ? "breed" : "leaf",
    species: carrierSpecies,
    eggGroups: carrierEggGroups,
    stats: new Set(rawPreloadedStats),
    nature: preloadedNature ? target.nature : null,
    genderNeed: carrierGender,
    eggGroupUsed: carrierEggGroup,
    fromInventory: !!carrierBoost,
    inventoryEntry: carrierBoost ? carrierBoost.entry : null,
    parents: carrierFallback ? [] : undefined
  };
  if (carrierFallback) {
    const sourceEntry = state.speciesByDisplay.get(normalize(carrierFallback.sourceSpecies)) || targetApiEntry;
    const sourceEggGroups = sourceEntry?.eggGroups || carrierEggGroups;
    const maleNode = {
      id: `${target.id}-n${nodeSeq++}`,
      label: `${carrierFallback.sourceSpecies}\nMale\n${resolveNeedEggGroup(sourceEggGroups, "Male", state.costConfig)}`,
      kind: "leaf",
      species: carrierFallback.sourceSpecies,
      eggGroups: sourceEggGroups,
      stats: new Set(),
      nature: null,
      genderNeed: "Male",
      eggGroupUsed: resolveNeedEggGroup(sourceEggGroups, "Male", state.costConfig),
      fromInventory: true,
      inventoryEntry: carrierFallback.male
    };
    const dittoNode = {
      id: `${target.id}-n${nodeSeq++}`,
      label: "Ditto\nAny",
      kind: "leaf",
      species: dittoEntry.displayName,
      eggGroups: dittoEntry.eggGroups,
      stats: new Set(),
      nature: null,
      genderNeed: "Any",
      eggGroupUsed: "Ditto",
      fromInventory: true,
      inventoryEntry: carrierFallback.ditto
    };

    carrierNode.parents = [maleNode.id, dittoNode.id];
    leaves.push(maleNode, dittoNode);
    allNodes.push(maleNode, dittoNode);
    const evolutionNote = normalize(carrierFallback.sourceSpecies) === normalize(carrierSpecies)
      ? ""
      : ` Then evolve the female ${carrierFallback.sourceSpecies} into ${carrierSpecies}.`;
    const fallbackInstruction = `Step ${stepSeq}: Breed the owned male ${carrierFallback.sourceSpecies} with Ditto to produce a female ${carrierFallback.sourceSpecies}.${evolutionNote}`;
    steps.push({
      id: `${target.id}-s${stepSeq++}`,
      text: fallbackInstruction,
      branch: "Branch A: Species Parent",
      bracesUsed: 0,
      everstoneUsed: 0,
      itemsUsed: []
    });
    increment(baseNeeds, `${maleNode.eggGroupUsed}|${carrierFallback.sourceSpecies}|Base Carrier|Gender:Male`, 1);
    increment(baseNeeds, `Ditto|${dittoEntry.displayName}|Base Carrier|Gender:Any`, 1);
  } else {
    leaves.push(carrierNode);
    increment(baseNeeds, `${carrierEggGroup}|${carrierSpecies}|Base Carrier|Gender:${carrierGender}`, 1);
  }
  allNodes.push(carrierNode);

  let natureSeed = null;
  if (target.nature !== "Any" && !preloadedNature) {
    natureSeed = {
      id: `${target.id}-n${nodeSeq++}`,
      label: `${donorDisplaySpecies}\nNature ${target.nature}\n${donorGender}\n${donorEggGroup}`,
      kind: "leaf",
      species: donorDisplaySpecies,
      eggGroups: target.eggGroups,
      familyApiName: useFamilyLineDonor ? targetFamilyApiName : null,
      stats: new Set(),
      nature: target.nature,
      genderNeed: donorGender,
      eggGroupUsed: donorEggGroup
    };
    leaves.push(natureSeed);
    allNodes.push(natureSeed);
    increment(baseNeeds, `${donorEggGroup}|${donorDisplaySpecies}|Nature:${target.nature}|Gender:${donorGender}${donorGroupsTag}${donorFamilyTag}`, 1);
  }



  const shouldCreateAnchor = anchorStat && (
    !carrierBoost ||
    target.nature === "Any" ||
    (!preloadedNature && effectiveRequiredStats.length >= 2)
  );
  let anchorStatSeed = null;
  if (shouldCreateAnchor) {
    anchorStatSeed = {
      id: `${target.id}-n${nodeSeq++}`,
      label: `${donorDisplaySpecies}\n${anchorStat} 31\n${donorGender}\n${donorEggGroup}`,
      kind: "leaf",
      species: donorDisplaySpecies,
      eggGroups: target.eggGroups,
      familyApiName: useFamilyLineDonor ? targetFamilyApiName : null,
      stats: new Set([anchorStat]),
      nature: null,
      genderNeed: donorGender,
      eggGroupUsed: donorEggGroup
    };
    leaves.push(anchorStatSeed);
    allNodes.push(anchorStatSeed);
    increment(baseNeeds, `${donorEggGroup}|${donorDisplaySpecies}|IV:${anchorStat}|Gender:${donorGender}${donorGroupsTag}${donorFamilyTag}`, 1);
  }

  function createIvSeed(stat, genderNeed = donorGender) {
    const node = {
      id: `${target.id}-n${nodeSeq++}`,
      label: `${donorDisplaySpecies}\n${stat} 31\n${genderNeed}\n${donorEggGroup}`,
      kind: "leaf",
      species: donorDisplaySpecies,
      eggGroups: target.eggGroups,
      familyApiName: useFamilyLineDonor ? targetFamilyApiName : null,
      stats: new Set([stat]),
      nature: null,
      genderNeed,
      eggGroupUsed: donorEggGroup
    };

    leaves.push(node);
    allNodes.push(node);
    increment(baseNeeds, `${donorEggGroup}|${donorDisplaySpecies}|IV:${stat}|Gender:${genderNeed}${donorGroupsTag}${donorFamilyTag}`, 1);
    return node;
  }

  function computeGuaranteedChildStats(parentA, parentB, childNature) {
    const candidateChild = {
      stats: new Set([...parentA.stats, ...parentB.stats])
    };
    const guaranteed = new Set([...parentA.stats].filter((stat) => parentB.stats.has(stat)));

    let everstoneParent = null;
    if (childNature) {
      if (parentA.nature) {
        everstoneParent = "A";
      } else if (parentB.nature) {
        everstoneParent = "B";
      } else {
        everstoneParent = "A";
      }
    }

    if (parentA.stats.size > 0 && everstoneParent !== "A") {
      const bracedStat = pickBraceStat(parentA, parentB, candidateChild);
      if (bracedStat && bracedStat !== "Any") {
        guaranteed.add(bracedStat);
      }
    }

    if (parentB.stats.size > 0 && everstoneParent !== "B") {
      const bracedStat = pickBraceStat(parentB, parentA, candidateChild);
      if (bracedStat && bracedStat !== "Any") {
        guaranteed.add(bracedStat);
      }
    }

    return guaranteed;
  }

  function buildOverlapIvNode(statsList, preferredGender = "Female") {
    const effectiveGender = preferredGender;

    if (statsList.length === 0) {
      const fallback = {
        id: `${target.id}-n${nodeSeq++}`,
        label: `${donorDisplaySpecies}\nBase donor\n${effectiveGender}\n${donorEggGroup}`,
        kind: "leaf",
        species: donorDisplaySpecies,
        eggGroups: target.eggGroups,
        familyApiName: useFamilyLineDonor ? targetFamilyApiName : null,
        stats: new Set(),
        nature: null,
        genderNeed: effectiveGender,
        eggGroupUsed: donorEggGroup
      };

      leaves.push(fallback);
      allNodes.push(fallback);
      increment(baseNeeds, `${donorEggGroup}|${donorDisplaySpecies}|Base|Gender:${effectiveGender}${donorGroupsTag}${donorFamilyTag}`, 1);
      return fallback;
    }

    if (statsList.length === 1) {
      return createIvSeed(statsList[0], effectiveGender);
    }

    if (statsList.length === 2 && preferredGender === "Male" && shouldUseTwoperfectivsForTwoStatMale(statsList, donorEggGroup, state.costConfig, donorAllowedGroups)) {
      const twoperfectivsStats = [...statsList];
      const twoperfectivsNode = {
        id: `${target.id}-n${nodeSeq++}`,
        label: `${donorDisplaySpecies}\n2x31 ${formatStatSet(new Set(twoperfectivsStats)) || "2x31"}\n${preferredGender}\n${donorEggGroup}`,
        kind: "leaf",
        species: donorDisplaySpecies,
        eggGroups: target.eggGroups,
        familyApiName: useFamilyLineDonor ? targetFamilyApiName : null,
        stats: new Set(twoperfectivsStats),
        nature: null,
        genderNeed: preferredGender,
        eggGroupUsed: donorEggGroup
      };

      leaves.push(twoperfectivsNode);
      allNodes.push(twoperfectivsNode);
      increment(baseNeeds, `${donorEggGroup}|${donorDisplaySpecies}|TwoPerfectIVs:${twoperfectivsStats.join("+")}|Gender:${preferredGender}${donorGroupsTag}${donorFamilyTag}`, 1);
      return twoperfectivsNode;
    }

    const leftNode = buildOverlapIvNode(statsList.slice(0, -1), effectiveGender === "Genderless" ? "Genderless" : "Female");
    const rightNode = buildOverlapIvNode(statsList.slice(1), effectiveGender === "Genderless" ? "Genderless" : "Male");
    const unionStats = computeGuaranteedChildStats(leftNode, rightNode, null);

    const child = {
      id: `${target.id}-n${nodeSeq++}`,
      label: `${donorDisplaySpecies}\n${formatStatSet(unionStats) || "No fixed IV"}\n${preferredGender}`,
      kind: "breed",
      species: donorDisplaySpecies,
      eggGroups: target.eggGroups,
      familyApiName: useFamilyLineDonor ? targetFamilyApiName : null,
      stats: unionStats,
      nature: null,
      genderNeed: preferredGender,
      eggGroupUsed: donorEggGroup,
      parents: [leftNode.id, rightNode.id]
    };

    const instruction = buildInstruction({
      species: donorDisplaySpecies,
      eggGroups: target.eggGroups,
      parentA: leftNode,
      parentB: rightNode,
      child,
      stepIndex: stepSeq
    });

    const itemUsage = calculateStepItemUsage(leftNode, rightNode, child);
    leftNode.itemNeeded = itemUsage.parentAItem;
    rightNode.itemNeeded = itemUsage.parentBItem;
    steps.push({
      id: `${target.id}-s${stepSeq++}`,
      text: instruction,
      branch: "Branch B: IV Donor Stack",
      bracesUsed: itemUsage.bracesUsed,
      everstoneUsed: itemUsage.everstoneUsed,
      itemsUsed: collectStepItems(itemUsage)
    });

    allNodes.push(child);
    return child;
  }

  let speciesBranchNode = carrierNode;
  const speciesPrepSeeds = [];
  if (natureSeed) {
    speciesPrepSeeds.push(natureSeed);
  }

  if (target.nature !== "Any") {
    const carrierMissingStats = effectiveRequiredStats.filter((stat) => !speciesBranchNode.stats.has(stat));
    const statsToCarryBeforeFinal = carrierMissingStats.slice(0, Math.max(carrierMissingStats.length - 1, 0));
    const plannedSpeciesStats = new Set(speciesBranchNode.stats);
    for (const stat of statsToCarryBeforeFinal) {
      if (plannedSpeciesStats.has(stat)) {
        continue;
      }

      const seedStats = [...plannedSpeciesStats, stat];
      if (anchorStatSeed && anchorStatSeed.stats.has(stat)) {
        if (!speciesPrepSeeds.includes(anchorStatSeed)) {
          speciesPrepSeeds.push(anchorStatSeed);
        }
      } else {
        speciesPrepSeeds.push(buildOverlapIvNode(seedStats, donorGender === "Genderless" ? "Genderless" : (donorGender === "Any" ? "Any" : "Male")));
      }

      plannedSpeciesStats.add(stat);
    }
  } else if (anchorStatSeed && !speciesBranchNode.stats.has(anchorStat)) {
    speciesPrepSeeds.push(anchorStatSeed);
  }

  for (const seedNode of speciesPrepSeeds) {
    const nextSpeciesStats = computeGuaranteedChildStats(speciesBranchNode, seedNode, speciesBranchNode.nature || seedNode.nature || null);
    const nextSpeciesNode = {
      id: `${target.id}-n${nodeSeq++}`,
    label: `${carrierSpecies} parent\n${formatStatSet(nextSpeciesStats) || "No fixed IV"}${(speciesBranchNode.nature || seedNode.nature) ? `\n${speciesBranchNode.nature || seedNode.nature}` : ""}\n${carrierGender}`,
      kind: "breed",
    species: carrierSpecies,
    eggGroups: carrierEggGroups,
      stats: nextSpeciesStats,
      nature: speciesBranchNode.nature || seedNode.nature || null,
      genderNeed: carrierGender,
      eggGroupUsed: carrierEggGroup,
      parents: [speciesBranchNode.id, seedNode.id]
    };

    const prepInstruction = buildInstruction({
      species: `${carrierSpecies} species-parent setup`,
      eggGroups: carrierEggGroups,
      parentA: speciesBranchNode,
      parentB: seedNode,
      child: nextSpeciesNode,
      stepIndex: stepSeq
    });

    const prepUsage = calculateStepItemUsage(speciesBranchNode, seedNode, nextSpeciesNode);
    speciesBranchNode.itemNeeded = prepUsage.parentAItem;
    seedNode.itemNeeded = prepUsage.parentBItem;
    steps.push({
      id: `${target.id}-s${stepSeq++}`,
      text: `${prepInstruction} This prepares the target-species final parent profile.`,
      branch: "Branch A: Species Parent",
      bracesUsed: prepUsage.bracesUsed,
      everstoneUsed: prepUsage.everstoneUsed,
      itemsUsed: collectStepItems(prepUsage)
    });

    speciesBranchNode = nextSpeciesNode;
    allNodes.push(nextSpeciesNode);
  }

  if ((carrierFullyMatchesTarget || effectiveRequiredStats.length === 0) && !needsEvolutionFinal) {
    carrierNode.kind = "final";
    return { target, leaves, finalNode: carrierNode, steps, baseNeeds, nodes: allNodes };
  }

  const donorFinal = buildOverlapIvNode(effectiveRequiredStats, donorGender === "Genderless" ? "Genderless" : (donorGender === "Any" ? "Any" : "Male"));
  const finalStats = computeGuaranteedChildStats(speciesBranchNode, donorFinal, target.nature !== "Any" ? target.nature : null);
  const finalNode = {
    id: `${target.id}-n${nodeSeq++}`,
    label: `${target.species}\nFinal target\n${formatStatSet(finalStats) || "No fixed IV"}${target.nature !== "Any" ? `\n${target.nature}` : ""}\n${finalResultGender || carrierGender} species carrier`,
    kind: "final",
    species: target.species,
    eggGroups: target.eggGroups,
    stats: finalStats,
    nature: speciesBranchNode.nature || donorFinal.nature,
    genderNeed: finalResultGender || carrierGender,
    eggGroupUsed: carrierEggGroup,
    parents: [speciesBranchNode.id, donorFinal.id]
  };

  allNodes.push(finalNode);

  const finalInstruction = buildInstruction({
    species: target.species,
    eggGroups: target.eggGroups,
    parentA: speciesBranchNode,
    parentB: donorFinal,
    child: finalNode,
    stepIndex: stepSeq
  });

  const finalItemUsage = calculateStepItemUsage(speciesBranchNode, donorFinal, finalNode);
  speciesBranchNode.itemNeeded = finalItemUsage.parentAItem;
  donorFinal.itemNeeded = finalItemUsage.parentBItem;

  steps.push({
    id: `${target.id}-s${stepSeq++}`,
    text: `${finalInstruction}${buildFinalMergeNote(target, breedingContext)}`,
    branch: "Final Merge",
    bracesUsed: finalItemUsage.bracesUsed,
    everstoneUsed: finalItemUsage.everstoneUsed,
    itemsUsed: collectStepItems(finalItemUsage)
  });

  return {
    target,
    leaves,
    finalNode,
    steps,
    baseNeeds,
    nodes: allNodes
  };
}

function getCarrierGender(genderProfile) {
  if (genderProfile.mode === "Genderless") {
    return "Genderless";
  }

  if (genderProfile.mode === "Male only") {
    return "Male";
  }

  return "Female";
}

function getDonorGender(genderProfile) {
  if (genderProfile.mode === "Genderless") {
    return "Genderless";
  }

  if (genderProfile.mode === "Male only") {
    return "Male";
  }

  if (genderProfile.mode === "Female only") {
    return "Male";
  }

  return "Male";
}

function resolveTargetBreedingContext(target) {
  const context = {
    carrierSpecies: target.species,
    carrierEggGroups: [...(target.eggGroups || [])],
    carrierGender: target.genderProfile.mode === "Mixed" || target.genderProfile.mode === "Female only"
      ? "Female"
      : getCarrierGender(target.genderProfile),
    donorGender: getDonorGender(target.genderProfile),
    finalResultGender: null,
    usesFamilyLineCarrier: false
  };

  const targetInfo = getGenderAwareSpeciesInfo(target.species);
  const availableGenders = new Set((targetInfo?.available_genders || []).map((value) => String(value || "").toLowerCase()));

  if (availableGenders.size === 1 && (availableGenders.has("male") || availableGenders.has("female"))) {
    const requiredGender = availableGenders.has("male") ? "male" : "female";
    const lineCarrierName = findLineCarrierForGenderTarget(targetInfo, requiredGender);
    if (lineCarrierName) {
      const carrierEntry = state.speciesByDisplay.get(normalize(lineCarrierName));
      if (carrierEntry) {
        context.carrierSpecies = carrierEntry.displayName;
        context.carrierEggGroups = [...(carrierEntry.eggGroups || context.carrierEggGroups)];
        context.carrierGender = requiredGender === "male" ? "Female" : "Female";
        context.donorGender = "Male";
        context.finalResultGender = requiredGender === "male" ? "Male" : "Female";
        context.usesFamilyLineCarrier = normalize(context.carrierSpecies) !== normalize(target.species);
      }
    }
  }

  if (target.genderProfile.mode === "Genderless") {
    context.carrierGender = "Genderless";
    context.donorGender = "Genderless";
  }

  return context;
}

function getGenderAwareSpeciesInfo(speciesName) {
  if (!state.genderAwareSpeciesByName || typeof state.genderAwareSpeciesByName.get !== "function") {
    return null;
  }
  return state.genderAwareSpeciesByName.get(normalize(speciesName)) || null;
}

function findLineCarrierForGenderTarget(targetInfo, requiredGender = "male") {
  if (!targetInfo) {
    return "";
  }

  const normalizedRequired = String(requiredGender || "").toLowerCase();
  const preEvolutionByGender = targetInfo.pre_evolution_species_by_gender || {};
  const sourceList = normalizedRequired === "female"
    ? (preEvolutionByGender.female || [])
    : (preEvolutionByGender.male || []);

  const candidateNames = [];
  for (const row of sourceList) {
    if (row?.name) {
      candidateNames.push(row.name);
    }
  }
  if (targetInfo.family_base_species?.name) {
    candidateNames.push(targetInfo.family_base_species.name);
  }

  for (const candidate of candidateNames) {
    const info = getGenderAwareSpeciesInfo(candidate);
    const available = new Set((info?.available_genders || []).map((value) => String(value || "").toLowerCase()));
    if (available.has("female")) {
      return candidate;
    }
  }

  return "";
}

function buildFinalMergeNote(target, breedingContext) {
  if (breedingContext.finalResultGender === "Male" || breedingContext.finalResultGender === "Female") {
    const requiredGender = breedingContext.finalResultGender;
    if (breedingContext.usesFamilyLineCarrier) {
      return ` Final species lock uses a female ${breedingContext.carrierSpecies} line carrier, then evolves the ${requiredGender.toLowerCase()} offspring into ${target.species}.`;
    }
    return ` Final species lock step preserves the required ${requiredGender.toLowerCase()} result.`;
  }

  if (target.genderProfile.mode === "Genderless") {
    return ` Final species lock stays within the ${getSpeciesLineLabelForSpecies(breedingContext.carrierSpecies || target.species)}.`;
  }

  return " Final species lock step uses target-species female carrier.";
}

function pickBestPair(nodes) {
  let best = [nodes[0], nodes[1]];
  let bestScore = -Infinity;

  for (let i = 0; i < nodes.length; i += 1) {
    for (let j = i + 1; j < nodes.length; j += 1) {
      const a = nodes[i];
      const b = nodes[j];
      const overlap = [...a.stats].filter((s) => b.stats.has(s)).length;
      const total = a.stats.size + b.stats.size;
      const natureBonus = a.nature || b.nature ? 0.45 : 0;

      const score = total - overlap * 2 + natureBonus;
      if (score > bestScore) {
        bestScore = score;
        best = [a, b];
      }
    }
  }

  return best;
}

function calculateStepItemUsage(parentA, parentB, child) {
  const everstoneUsed = child.nature ? 1 : 0;

  let everstoneParent = null;
  if (everstoneUsed === 1) {
    if (parentA.nature) {
      everstoneParent = "A";
    } else if (parentB.nature) {
      everstoneParent = "B";
    } else {
      everstoneParent = "A";
    }
  }

  const canBraceA = parentA.stats.size > 0 && everstoneParent !== "A";
  const canBraceB = parentB.stats.size > 0 && everstoneParent !== "B";

  const parentAItem = everstoneParent === "A"
    ? "Everstone"
    : (canBraceA ? braceNameForStat(pickBraceStat(parentA, parentB, child)) : "No Item");
  const parentBItem = everstoneParent === "B"
    ? "Everstone"
    : (canBraceB ? braceNameForStat(pickBraceStat(parentB, parentA, child)) : "No Item");

  return {
    bracesUsed: (canBraceA ? 1 : 0) + (canBraceB ? 1 : 0),
    everstoneUsed,
    parentAItem,
    parentBItem
  };
}

function collectStepItems(itemUsage) {
  return [itemUsage.parentAItem, itemUsage.parentBItem].filter((item) => item && item !== "No Item");
}

function pickBraceStat(parent, otherParent, child) {
  const preferred = [...parent.stats].filter((stat) => child.stats.has(stat) && !otherParent.stats.has(stat));
  if (preferred.length > 0) {
    return preferred[0];
  }

  const fallback = [...parent.stats].filter((stat) => child.stats.has(stat));
  if (fallback.length > 0) {
    return fallback[0];
  }

  return "Any";
}

function braceNameForStat(stat) {
  return BRACE_BY_STAT[stat] || `Brace (${stat})`;
}

function buildInstruction({ species, eggGroups, parentA, parentB, child, stepIndex }) {
  const fromA = formatStatSet(parentA.stats);
  const fromB = formatStatSet(parentB.stats);
  const natureLine = child.nature ? ` Use Everstone path for ${child.nature}.` : "";
  const genderLine = buildValidRoleLine(parentA, parentB);
  const eggLine = ` Must share egg group compatibility (${eggGroups.join(" / ")}).`;

  return `Step ${stepIndex}: Breed ${species} donor A (${fromA || "no fixed IV"}) with donor B (${fromB || "no fixed IV"}) -> offspring with ${formatStatSet(child.stats) || "no fixed IV"}.${natureLine}${genderLine}${eggLine}`;
}

function buildValidRoleLine(parentA, parentB) {
  const a = String(parentA.genderNeed || "");
  const b = String(parentB.genderNeed || "");

  const aIsGenderless = /^genderless/i.test(a);
  const bIsGenderless = /^genderless/i.test(b);

  if (aIsGenderless && bIsGenderless) {
    const aLabel = parentA.familyApiName
      ? getSpeciesLineLabelFromFamilyApiName(parentA.familyApiName, parentA.species)
      : getSpeciesLineLabelForSpecies(parentA.species);
    const bLabel = parentB.familyApiName
      ? getSpeciesLineLabelFromFamilyApiName(parentB.familyApiName, parentB.species)
      : getSpeciesLineLabelForSpecies(parentB.species);
    return ` Parent roles: A = ${aLabel} (${parentA.eggGroupUsed}), B = ${bLabel} (${parentB.eggGroupUsed}).`;
  }

  const aIsFemale = /^female/i.test(a);
  const bIsFemale = /^female/i.test(b);
  const aIsMale = /^male/i.test(a);
  const bIsMale = /^male/i.test(b);

  if (aIsFemale && !bIsFemale) {
    return ` Parent roles: A = Female (${parentA.eggGroupUsed}), B = Male (${parentB.eggGroupUsed}).`;
  }

  if (bIsFemale && !aIsFemale) {
    return ` Parent roles: A = Male (${parentA.eggGroupUsed}), B = Female (${parentB.eggGroupUsed}).`;
  }

  if (aIsMale && !bIsMale) {
    return ` Parent roles: A = Male (${parentA.eggGroupUsed}), B = Female (${parentB.eggGroupUsed}).`;
  }

  if (bIsMale && !aIsMale) {
    return ` Parent roles: A = Female (${parentA.eggGroupUsed}), B = Male (${parentB.eggGroupUsed}).`;
  }

  return ` Parent roles: A = Female (${parentA.eggGroupUsed}), B = Male (${parentB.eggGroupUsed}).`;
}



function computeNeedKeyForLeaf(node) {
  if (!node || node.kind !== "leaf") return null;
  const eggGroup = node.eggGroupUsed || "Unknown";
  const species = node.species;
  const gender = `Gender:${node.genderNeed || "Any"}`;
  const compatibleGroups = (node.eggGroups || []).filter((group) => group !== "Undiscovered" && group !== "Ditto");
  const groupsTag = compatibleGroups.length > 0 ? `|Groups:${compatibleGroups.join(",")}` : "";
  const familyTag = node.familyApiName ? `|Family:${node.familyApiName}` : "";
  if (species !== "Compatible Egg-Group Donor") {
    return `${eggGroup}|${species}|Base Carrier|${gender}`;
  }
  if (node.nature) {
    return `${eggGroup}|${species}|Nature:${node.nature}|${gender}${groupsTag}${familyTag}`;
  }
  const stats = [...(node.stats || [])];
  if (stats.length >= 2) {
    return `${eggGroup}|${species}|TwoPerfectIVs:${stats.join("+")}|${gender}${groupsTag}${familyTag}`;
  }
  if (stats.length === 1) {
    return `${eggGroup}|${species}|IV:${stats[0]}|${gender}${groupsTag}${familyTag}`;
  }
  return `${eggGroup}|${species}|Base|${gender}${groupsTag}${familyTag}`;
}

function buildGraphElementsForPlan(plan) {
  const nodes = plan.nodes.map((node) => {
    const sourceIconPath = node.kind === "leaf"
      ? (node.fromInventory ? "assets/ball.png" : "assets/gtl.png")
      : "";
    const data = {
      id: node.id,
      species: node.species,
      eggGroups: [...(node.eggGroups || [])],
      familyApiName: node.familyApiName || null,
      genderNeed: node.genderNeed,
      eggGroupUsed: node.eggGroupUsed,
      nature: node.nature,
      stats: [...(node.stats || [])],
      parents: [...(node.parents || [])],
      itemNeeded: node.itemNeeded || "No Item",
      itemIconPath: getItemIconPath(node.itemNeeded || "No Item"),
      sourceIconPath,
      fromInventory: !!node.fromInventory,
      inventoryEntry: node.inventoryEntry || null,
      label: buildNodePlannerLabel(node),
      kind: node.kind
    };
    if (node.kind === "leaf") {
      data.needKey = computeNeedKeyForLeaf(node);
    }
    return { data };
  });

  const edges = [];
  for (const node of plan.nodes) {
    if (!node.parents) {
      continue;
    }

    for (const parentId of node.parents) {
      edges.push({
        data: {
          id: `${parentId}->${node.id}`,
          source: parentId,
          target: node.id
        }
      });
    }
  }

  return { nodes, edges };
}

function buildNodePlannerLabel(node) {
  const lines = [];

  const normalizedGender = normalizeNodeGender(node.genderNeed);
  const isGenericEggGroupNode = node.species === "Compatible Egg-Group Donor";
  const roleLabel = isGenericEggGroupNode ? resolveDisplayEggGroupForNode(node) : node.species;
  const genderlessLineLabel = String(node.genderNeed || "").startsWith("Genderless")
    ? (node.familyApiName
        ? getSpeciesLineLabelFromFamilyApiName(node.familyApiName, node.species)
        : getSpeciesLineLabelForSpecies(node.species))
    : "";

  if (node.kind === "final") {
    lines.push(`${roleLabel}`);
  } else if (normalizedGender === "Male" || normalizedGender === "Female") {
    lines.push(`${normalizedGender} ${roleLabel}`);
  } else if (genderlessLineLabel) {
    lines.push(isGenericEggGroupNode ? genderlessLineLabel : `${roleLabel} (${genderlessLineLabel})`);
  } else if (normalize(normalizedGender) && normalize(normalizedGender) === normalize(roleLabel)) {
    lines.push(`${normalizedGender}`);
  } else {
    lines.push(`${roleLabel} (${node.genderNeed || "Any"})`);
  }

  if (node.nature) {
    lines.push(`Nature: ${node.nature}`);
  }

  const ivLine = formatIvLine(node.stats instanceof Set ? node.stats : new Set(node.stats || []));
  if (ivLine) {
    lines.push(ivLine);
  }

  const inventoryLines = buildInventoryCardLines(node.inventoryEntry, { includeTraits: false });
  if (inventoryLines.length > 0) {
    lines.push(...inventoryLines);
  }

  if (node.kind !== "final") {
    lines.push(`Item: ${node.itemNeeded || "No Item"}`);
  }
  return lines.join("\n");
}

function resolveDisplayEggGroupForNode(node) {
  if (!node) {
    return "Egg Group";
  }

  const fallback = node.eggGroupUsed || "Egg Group";
  if (!node.fromInventory || !node.inventoryEntry) {
    return fallback;
  }

  const entryGroups = (node.inventoryEntry.eggGroups || [])
    .map((group) => String(group || "").trim())
    .filter(Boolean);
  if (entryGroups.length === 0) {
    return fallback;
  }

  const compatibleGroups = (node.eggGroups || [])
    .map((group) => String(group || "").trim())
    .filter((group) => group !== "Undiscovered" && group !== "Ditto");
  if (compatibleGroups.length > 0) {
    const compatibleSet = new Set(compatibleGroups.map((group) => normalize(group)));
    const matched = entryGroups.find((group) => compatibleSet.has(normalize(group)));
    if (matched) {
      return matched;
    }
  }

  return entryGroups[0] || fallback;
}

function normalizeNodeGender(genderNeed) {
  const value = String(genderNeed || "");
  if (value.startsWith("Male")) {
    return "Male";
  }

  if (value.startsWith("Female")) {
    return "Female";
  }

  return value;
}

function formatIvLine(statsSet) {
  const stats = [...(statsSet || [])];
  if (stats.length === 0) {
    return "";
  }

  if (stats.length === 1) {
    return `IV: ${stats[0]} 31`;
  }

  return `IV: ${stats.map((s) => `${s} 31`).join(", ")}`;
}

function hydrateGraphSelect(plans) {
  el.graphTargetSelect.innerHTML = "";

  const emptyOpt = document.createElement("option");
  emptyOpt.value = "";
  emptyOpt.textContent = "No Target Selected";
  el.graphTargetSelect.appendChild(emptyOpt);

  const allOpt = document.createElement("option");
  allOpt.value = "__all__";
  allOpt.textContent = "All Targets";
  el.graphTargetSelect.appendChild(allOpt);

  for (const plan of plans) {
    const option = document.createElement("option");
    option.value = plan.target.id;
    option.textContent = `${plan.target.species} (${plan.target.nature})`;
    el.graphTargetSelect.appendChild(option);
  }

  el.graphTargetSelect.value = "";
}

function renderSelectedGraph() {
  if (state.graphCache.size === 0) {
    renderEmptyGraph("Generate a plan to view the graph.");
    return;
  }

  const selected = el.graphTargetSelect.value || "";

  if (!selected) {
    setGraphCollapsed(true);
    renderEmptyGraph("Select a target to open the node planner.");
    return;
  }

  setGraphCollapsed(false);

  let elements;
  if (selected === "__all__") {
    elements = mergeGraphElements([...state.graphCache.values()]);
  } else {
    elements = state.graphCache.get(selected);
  }

  if (!elements) {
    renderEmptyGraph("Could not render graph for this target.");
    return;
  }

  if (state.cy) {
    state.cy.destroy();
    state.cy = null;
  }

  const hasDagre = typeof cytoscape === "function" && typeof cytoscape("layout", "dagre") === "function";
  const graphLayout = hasDagre
    ? {
      name: "dagre",
      rankDir: "TB",
      nodeSep: 42,
      rankSep: 80,
      edgeSep: 18,
      padding: 30,
      fit: true,
      animate: false
    }
    : {
      name: "breadthfirst",
      directed: true,
      padding: 30,
      spacingFactor: 1.7,
      animate: false
    };

  state.cy = cytoscape({
    container: el.graph,
    elements,

    wheelSensitivity: 0.2,
    layout: graphLayout,
    style: [
      {
        selector: "node",
        style: {
          label: "data(label)",
          "font-size": 10,
          color: getThemeVar("--graph-label", "#14231d"),
          "text-wrap": "wrap",
          "text-max-width": 120,
          "text-valign": "center",
          "text-halign": "center",
          "text-justification": "center",
          "background-color": getThemeVar("--graph-node-bg", "#e4f4ec"),
          "border-color": getThemeVar("--graph-node-border", "#2f6f5e"),
          "border-width": 1,
          "background-image": (ele) => {
            const images = [];
            if (ele.data("sourceIconPath")) {
              images.push(ele.data("sourceIconPath"));
            }
            if (ele.data("itemIconPath")) {
              images.push(ele.data("itemIconPath"));
            }
            return images;
          },
          "background-width": (ele) => {
            const sizes = [];
            if (ele.data("sourceIconPath")) {
              sizes.push(16);
            }
            if (ele.data("itemIconPath")) {
              sizes.push(16);
            }
            return sizes;
          },
          "background-height": (ele) => {
            const sizes = [];
            if (ele.data("sourceIconPath")) {
              sizes.push(16);
            }
            if (ele.data("itemIconPath")) {
              sizes.push(16);
            }
            return sizes;
          },
          "background-fit": (ele) => {
            const fits = [];
            if (ele.data("sourceIconPath")) {
              fits.push("none");
            }
            if (ele.data("itemIconPath")) {
              fits.push("none");
            }
            return fits;
          },
          "background-position-x": (ele) => {
            const positions = [];
            if (ele.data("sourceIconPath")) {
              positions.push("100%");
            }
            if (ele.data("itemIconPath")) {
              positions.push("100%");
            }
            return positions;
          },
          "background-position-y": (ele) => {
            const positions = [];
            if (ele.data("sourceIconPath")) {
              positions.push("0%");
            }
            if (ele.data("itemIconPath")) {
              positions.push("100%");
            }
            return positions;
          },
          "background-image-opacity": (ele) => {
            const opacities = [];
            if (ele.data("sourceIconPath")) {
              opacities.push(0.75);
            }
            if (ele.data("itemIconPath")) {
              opacities.push(0.8);
            }
            return opacities;
          },
          width: 124,
          height: 66,
          shape: "round-rectangle"
        }
      },
      {
        selector: "node[kind = 'leaf']",
        style: {
          "background-color": getThemeVar("--graph-leaf-bg", "#f9ead8"),
          "border-color": getThemeVar("--graph-leaf-border", "#d58340")
        }
      },
      {
        selector: "node[kind = 'final']",
        style: {
          "background-color": getThemeVar("--graph-final-bg", "#ffd9bf"),
          "border-color": getThemeVar("--graph-final-border", "#d85f27"),
          "border-width": 2
        }
      },
      {
        selector: "edge",
        style: {
          width: 2,
          "curve-style": "taxi",
          "taxi-direction": "downward",
          "taxi-turn": 28,
          "line-color": getThemeVar("--graph-edge", "#65857a"),
          "target-arrow-color": getThemeVar("--graph-edge", "#65857a"),
          "target-arrow-shape": "none"
        }
      }
    ]
  });

  state.cy.on("layoutstop", () => {
    state.cy.fit(undefined, 30);
  });

  state.cy.one("render", () => {
    state.cy.fit(undefined, 30);
  });
}

function getThemeVar(name, fallback) {
  const value = getComputedStyle(document.body).getPropertyValue(name).trim();
  return value || fallback;
}

function renderEmptyGraph(message) {
  el.graph.innerHTML = `<div class="empty">${escapeHtml(message)}</div>`;
  if (state.cy) {
    state.cy.destroy();
    state.cy = null;
  }
}

function mergeGraphElements(graphs) {
  const nodeMap = new Map();
  const edgeMap = new Map();

  for (const graph of graphs) {
    for (const node of graph.nodes) {
      nodeMap.set(node.data.id, node);
    }

    for (const edge of graph.edges) {
      edgeMap.set(edge.data.id, edge);
    }
  }

  return {
    nodes: [...nodeMap.values()],
    edges: [...edgeMap.values()]
  };
}



function allocateInventoryToNeeds(globalNeeds, inventoryEntries) {
  const remainingNeeds = new Map(globalNeeds || []);
  const allocatedNeeds = new Map();
  const allocatedInventoryEntries = [];
  const mutableInventory = (inventoryEntries || []).map((entry) => ({ entry, remaining: entry.count }));
  const needInfoCache = new Map();
  const sortedNeedKeys = [...remainingNeeds.keys()].sort((a, b) => compareNeedPriority(a, needInfoCache) - compareNeedPriority(b, needInfoCache));

  let consumedTotal = 0;

  for (const needKey of sortedNeedKeys) {
    let needed = remainingNeeds.get(needKey) || 0;
    if (needed <= 0) {
      continue;
    }

    const needInfo = getNeedInfoCached(needKey, needInfoCache);

    while (needed > 0) {
      const best = findBestInventoryCandidate(mutableInventory, needInfo);
      if (!best) {
        break;
      }

      best.remaining -= 1;
      needed -= 1;
      consumedTotal += 1;
      allocatedNeeds.set(needKey, (allocatedNeeds.get(needKey) || 0) + 1);
      allocatedInventoryEntries.push({ needKey, entry: best.entry });
    }

    if (needed > 0) {
      remainingNeeds.set(needKey, needed);
    } else {
      remainingNeeds.delete(needKey);
    }
  }

  const uncoveredTotal = [...remainingNeeds.values()].reduce((sum, value) => sum + value, 0);

  return {
    remainingNeeds,
    allocatedNeeds,
    allocatedInventoryEntries,
    consumedTotal,
    uncoveredTotal
  };
}

function compareNeedPriority(needKey, needInfoCache = null) {
  const info = getNeedInfoCached(needKey, needInfoCache);
  if (info.need === "Base Carrier") {
    return 1;
  }
  if (info.need.startsWith("TwoPerfectIVs:")) {
    return 2;
  }
  if (info.need.startsWith("Nature:")) {
    return 3;
  }
  if (info.need.startsWith("IV:")) {
    return 4;
  }
  return 5;
}

function getNeedInfoCached(needKey, cache = null) {
  if (!(cache instanceof Map)) {
    return parseNeedKey(needKey);
  }

  const cached = cache.get(needKey);
  if (cached) {
    return cached;
  }

  const parsed = parseNeedKey(needKey);
  cache.set(needKey, parsed);
  return parsed;
}

function getNormalizedEntryEggGroups(entry) {
  if (!entry) {
    return [];
  }

  if (Array.isArray(entry._normalizedEggGroups)) {
    return entry._normalizedEggGroups;
  }

  const normalizedGroups = (entry.eggGroups || []).map((group) => normalize(group)).filter(Boolean);
  entry._normalizedEggGroups = normalizedGroups;
  return normalizedGroups;
}

function getNormalizedEntrySpecies(entry) {
  if (!entry) {
    return "";
  }

  if (typeof entry._normalizedSpecies === "string") {
    return entry._normalizedSpecies;
  }

  entry._normalizedSpecies = normalize(entry.species);
  return entry._normalizedSpecies;
}

function parseNeedKey(needKey) {
  const parts = String(needKey || "").split("|");
  const [eggGroup = "Unknown", species = "Unknown", need = "Base", genderNeed = "Gender:Any"] = parts;
  const metadata = parts.slice(4);
  const groupsMeta = metadata.find((segment) => String(segment || "").startsWith("Groups:")) || "";
  const familyMeta = metadata.find((segment) => String(segment || "").startsWith("Family:")) || "";
  const candidateEggGroups = String(groupsMeta || "")
    .replace("Groups:", "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
  const familyApiName = String(familyMeta || "").replace("Family:", "").trim();
  return { eggGroup, species, need, genderNeed, candidateEggGroups, familyApiName };
}

function findBestInventoryCandidate(mutableInventory, needInfo) {
  let bestCandidate = null;
  let bestScore = -Infinity;

  for (const slot of mutableInventory) {
    if (!slot || slot.remaining <= 0) {
      continue;
    }

    if (!canInventoryEntrySatisfyNeed(slot.entry, needInfo)) {
      continue;
    }

    const score = scoreInventoryCandidate(slot.entry, needInfo);
    if (score > bestScore) {
      bestScore = score;
      bestCandidate = slot;
    }
  }

  return bestCandidate;
}

function canInventoryEntrySatisfyNeed(entry, needInfo) {
  if (!entry || !needInfo) {
    return false;
  }

  if (!isInventoryGenderCompatible(entry, needInfo.genderNeed)) {
    return false;
  }

  if (needInfo.need === "Base Carrier") {
    const normalizedEntrySpecies = getNormalizedEntrySpecies(entry);
    if (normalizedEntrySpecies === normalize(needInfo.species)) {
      return true;
    }
    const families = state.evolutionFamilies || {};
    const entryFamily = families[entry.speciesApiName];
    const needApiName = (state.speciesByDisplay.get(normalize(needInfo.species)) || {}).apiName;
    const needFamily = needApiName ? families[needApiName] : null;
    if (entryFamily && needFamily && entryFamily === needFamily) {
      return true;
    }
    return false;
  }

  if (needInfo.need.startsWith("Nature:")) {
    const requiredNature = needInfo.need.replace("Nature:", "").trim();
    if (entry.nature !== requiredNature) {
      return false;
    }
  }

  if (needInfo.need.startsWith("IV:")) {
    const stat = needInfo.need.replace("IV:", "").trim();
    if (state.costConfig?.twoperfectivsSupport && entry.ivs.size >= 2) {
      return false;
    }
    if (!entry.ivs.has(stat)) {
      return false;
    }
  }

  if (needInfo.need.startsWith("TwoPerfectIVs:")) {
    const stats = needInfo.need.replace("TwoPerfectIVs:", "").split("+").map((value) => value.trim()).filter(Boolean);
    if (!stats.every((stat) => entry.ivs.has(stat))) {
      return false;
    }
  }

  if (normalize(needInfo.species) === normalize("Compatible Egg-Group Donor")) {
    const allowedGroups = Array.isArray(needInfo.candidateEggGroups) && needInfo.candidateEggGroups.length > 0
      ? needInfo.candidateEggGroups
      : [needInfo.eggGroup];
    const normalizedAllowedGroups = allowedGroups.map((group) => normalize(group)).filter(Boolean);
    const entryGroups = getNormalizedEntryEggGroups(entry);
    const matchesGroup = normalizedAllowedGroups.some((group) => entryGroups.includes(group));
    if (!matchesGroup) {
      return false;
    }
    if (needInfo.familyApiName) {
      const families = state.evolutionFamilies || {};
      return families[entry.speciesApiName] === needInfo.familyApiName;
    }
    return true;
  }

  return true;
}

function isInventoryGenderCompatible(entry, rawGenderNeed) {
  const genderNeed = String(rawGenderNeed || "").replace("Gender:", "").trim().toLowerCase();

  if (genderNeed.startsWith("male")) {
    return entry.gender === "Male" || entry.gender === "Any";
  }

  if (genderNeed.startsWith("female")) {
    return entry.gender === "Female" || entry.gender === "Any";
  }

  return true;
}

function scoreInventoryCandidate(entry, needInfo) {
  let score = 0;
  const normalizedEntrySpecies = getNormalizedEntrySpecies(entry);

  if (needInfo.need === "Base Carrier" && normalizedEntrySpecies === normalize(needInfo.species)) {
    score += 80;
  }

  if (needInfo.need.startsWith("Nature:") && entry.nature !== "Any") {
    score += 40;
  }

  if (needInfo.need.startsWith("TwoPerfectIVs:")) {
    score += 35;
  }

  if (needInfo.need.startsWith("IV:")) {
    score += 25;
  }

  const normalizedGenderNeed = String(needInfo.genderNeed || "").toLowerCase();
  if (normalizedGenderNeed.includes("male") && entry.gender === "Male") {
    score += 8;
  }

  if (normalizedGenderNeed.includes("female") && entry.gender === "Female") {
    score += 8;
  }

  score -= entry.ivs.size;
  if (entry.nature !== "Any") {
    score -= 1;
  }

  return score;
}


function renderShoppingList(remainingNeeds, allocatedInventoryEntries = [], costConfig = state.costConfig) {
  el.shoppingList.innerHTML = "";
  const needInfoCache = new Map();

  const hasRemaining = remainingNeeds && remainingNeeds.size > 0;
  const hasAllocated = allocatedInventoryEntries && allocatedInventoryEntries.length > 0;
  const totalRemaining = hasRemaining ? [...remainingNeeds.values()].reduce((sum, count) => sum + count, 0) : 0;
  const totalAllocated = hasAllocated ? allocatedInventoryEntries.length : 0;

  if (el.shoppingListTotal) {
    el.shoppingListTotal.textContent = `Total: ${totalRemaining + totalAllocated}`;
  }

  if (!hasRemaining && !hasAllocated) {
    const empty = document.createElement("div");
    empty.className = "empty";
    empty.textContent = state.planByTargetId.size > 0
      ? "All breeder needs are covered by your owned inventory."
      : "No plan generated yet.";
    el.shoppingList.appendChild(empty);
    return;
  }

  if (hasRemaining) {
    const sorted = [...remainingNeeds.entries()].sort((a, b) => compareShoppingNeedEntries(a, b, needInfoCache));
    for (const [key, count] of sorted) {
      const needInfo = getNeedInfoCached(key, needInfoCache);
      const genderIcon = buildNeedGenderIcon(needInfo.genderNeed);
      const cardLines = buildCatchCardLines({
        eggGroup: needInfo.eggGroup,
        species: needInfo.species,
        need: needInfo.need,
        genderNeed: needInfo.genderNeed,
        familyApiName: needInfo.familyApiName
      });
      const item = document.createElement("article");
      item.className = "shop-item";
      item.innerHTML = `
        ${genderIcon}
        <strong>${escapeHtml(cardLines[0])}</strong>
        ${cardLines.slice(1).map((line) => `<div class="target-meta">${escapeHtml(line)}</div>`).join("")}
        <div class="shop-item-corner"><strong>x${count}</strong><img class="shop-item-icon" src="assets/gtl.png" alt=""></div>
      `;
      el.shoppingList.appendChild(item);
    }
  }

  if (hasAllocated) {
    const grouped = groupAllocatedInventoryEntries(allocatedInventoryEntries);
    const sorted = [...grouped.values()].sort((a, b) => compareShoppingNeedEntries(
      [a.needKey, a.count, a.entry ? a.entry.species : ""],
      [b.needKey, b.count, b.entry ? b.entry.species : ""],
      needInfoCache
    ));
    for (const allocation of sorted) {
      const needInfo = getNeedInfoCached(allocation.needKey, needInfoCache);
      const genderIcon = buildNeedGenderIcon(needInfo.genderNeed);
      const displayEggGroup = resolveDisplayEggGroupForAllocation(needInfo, allocation.entry);
      const cardLines = buildCatchCardLines({
        eggGroup: displayEggGroup,
        species: needInfo.species,
        need: needInfo.need,
        genderNeed: needInfo.genderNeed,
        familyApiName: needInfo.familyApiName
      });
      const inventoryLines = buildInventoryCardLines(allocation.entry);
      const item = document.createElement("article");
      item.className = "shop-item shop-item--from-inventory";
      item.innerHTML = `
        ${genderIcon}
        <strong>${escapeHtml(cardLines[0])}</strong>
        ${cardLines.slice(1).map((line) => `<div class="target-meta">${escapeHtml(line)}</div>`).join("")}
        ${inventoryLines.map((line) => `<div class="target-meta">${escapeHtml(line)}</div>`).join("")}
        <div class="shop-item-corner"><strong>x${allocation.count}</strong><img class="shop-item-icon" src="assets/ball.png" alt=""></div>
      `;
      el.shoppingList.appendChild(item);
    }
  }
}

function renderAcquisitionPriorityList(remainingNeeds, costConfig = state.costConfig) {
  if (!el.acquisitionPriorityList) {
    return;
  }

  el.acquisitionPriorityList.innerHTML = "";
  const rows = buildAcquisitionPriorityRows(remainingNeeds, costConfig).slice(0, 8);

  if (rows.length === 0) {
    const empty = document.createElement("div");
    empty.className = "empty";
    empty.textContent = state.planByTargetId.size > 0
      ? "No market purchases needed. Inventory already covers all breeders."
      : "Generate a plan to see buy-first priorities.";
    el.acquisitionPriorityList.appendChild(empty);
    return;
  }

  for (const row of rows) {
    const item = document.createElement("article");
    item.className = "shop-item priority-item";
    item.innerHTML = `
      ${buildNeedGenderIcon(row.genderNeed)}
      <strong>${escapeHtml(row.title)}</strong>
      ${row.detail ? `<div class="target-meta">${escapeHtml(row.detail)}</div>` : ""}
      <div class="target-meta">Enables ${row.unlockSteps} downstream step${row.unlockSteps === 1 ? "" : "s"}</div>
      <div class="priority-item-footer">
        <div class="target-meta">Need: x${row.count} | Unit: ${formatCurrency(row.unitCost)}</div>
        <strong>Priority ${row.rank}</strong>
      </div>
    `;
    el.acquisitionPriorityList.appendChild(item);
  }
}

function buildAcquisitionPriorityRows(remainingNeeds, costConfig = state.costConfig) {
  if (!(remainingNeeds instanceof Map) || remainingNeeds.size === 0) {
    return [];
  }

  const rows = [];
  const needInfoCache = new Map();

  for (const [needKey, count] of remainingNeeds.entries()) {
    const info = getNeedInfoCached(needKey, needInfoCache);
    const cardLines = buildCatchCardLines({
      eggGroup: info.eggGroup,
      species: info.species,
      need: info.need,
      genderNeed: info.genderNeed,
      familyApiName: info.familyApiName
    });
    const unitCost = getUnitCostForNeed(info.eggGroup, info.need, info.genderNeed, costConfig);
    const impact = calculateNeedTargetImpact(needKey);
    const unlockSteps = calculateNeedUnlockSteps(needKey);
    const subtotal = Math.max(1, unitCost * Math.max(1, count));
    const impactPoints = impact * 100;
    const unlockPoints = unlockSteps * 12;
    const efficiencyPoints = Math.round(40000 / subtotal);
    const score = impactPoints + unlockPoints + efficiencyPoints;

    rows.push({
      needKey,
      title: cardLines[0] || info.species || "Breeder",
      detail: cardLines.slice(1).join(" | "),
      genderNeed: info.genderNeed,
      count,
      unitCost,
      targetImpact: impact,
      unlockSteps,
      score
    });
  }

  rows.sort((a, b) => {
    if (a.score !== b.score) {
      return b.score - a.score;
    }
    if (a.targetImpact !== b.targetImpact) {
      return b.targetImpact - a.targetImpact;
    }
    if (a.unlockSteps !== b.unlockSteps) {
      return b.unlockSteps - a.unlockSteps;
    }
    if (a.unitCost !== b.unitCost) {
      return a.unitCost - b.unitCost;
    }
    return String(a.title).localeCompare(String(b.title));
  });

  return rows.map((row, index) => ({ ...row, rank: index + 1 }));
}

function calculateNeedTargetImpact(needKey) {
  let impacts = 0;
  for (const elements of state.graphCache.values()) {
    const hasNeed = (elements?.nodes || []).some((node) => {
      const data = node?.data;
      return data && data.kind === "leaf" && !data.fromInventory && data.needKey === needKey;
    });
    if (hasNeed) {
      impacts += 1;
    }
  }
  return impacts;
}

function calculateNeedUnlockSteps(needKey) {
  let total = 0;

  for (const elements of state.graphCache.values()) {
    const nodeList = (elements?.nodes || []).map((node) => node?.data).filter(Boolean);
    const nodeById = new Map(nodeList.map((node) => [node.id, node]));
    const childrenByParentId = new Map();

    for (const node of nodeList) {
      for (const parentId of (node.parents || [])) {
        const list = childrenByParentId.get(parentId) || [];
        list.push(node.id);
        childrenByParentId.set(parentId, list);
      }
    }

    const matchingLeaves = nodeList.filter((node) => node.kind === "leaf" && !node.fromInventory && node.needKey === needKey);
    for (const leaf of matchingLeaves) {
      const visited = new Set();
      const queue = [...(childrenByParentId.get(leaf.id) || [])];
      while (queue.length > 0) {
        const nodeId = queue.shift();
        if (!nodeId || visited.has(nodeId)) {
          continue;
        }
        visited.add(nodeId);
        const node = nodeById.get(nodeId);
        if (node && node.kind !== "leaf") {
          total += 1;
        }
        queue.push(...(childrenByParentId.get(nodeId) || []));
      }
    }
  }

  return total;
}

function resolveDisplayEggGroupForAllocation(needInfo, entry) {
  if (!needInfo || !entry) {
    return needInfo?.eggGroup || "Unknown";
  }

  if (normalize(needInfo.species) !== normalize("Compatible Egg-Group Donor")) {
    return needInfo.eggGroup || "Unknown";
  }

  const entryGroups = (entry.eggGroups || []).map((group) => String(group || "").trim()).filter(Boolean);
  if (entryGroups.length === 0) {
    return needInfo.eggGroup || "Unknown";
  }

  const candidateGroupSet = new Set((needInfo.candidateEggGroups || []).map((group) => normalize(group)).filter(Boolean));
  if (candidateGroupSet.size > 0) {
    const matched = entryGroups.find((group) => candidateGroupSet.has(normalize(group)));
    if (matched) {
      return matched;
    }
  }

  if (entryGroups.includes(needInfo.eggGroup)) {
    return needInfo.eggGroup;
  }

  return entryGroups[0];
}

function compareShoppingNeedEntries(entryA, entryB, needInfoCache = null) {
  const [keyA, countA, inventorySpeciesA = ""] = entryA;
  const [keyB, countB, inventorySpeciesB = ""] = entryB;
  const infoA = getNeedInfoCached(keyA, needInfoCache);
  const infoB = getNeedInfoCached(keyB, needInfoCache);
  const isSpeciesSpecificA = infoA.need === "Base Carrier" && normalize(infoA.species) !== normalize("Compatible Egg-Group Donor");
  const isSpeciesSpecificB = infoB.need === "Base Carrier" && normalize(infoB.species) !== normalize("Compatible Egg-Group Donor");

  if (isSpeciesSpecificA !== isSpeciesSpecificB) {
    return isSpeciesSpecificA ? -1 : 1;
  }

  if (isSpeciesSpecificA && isSpeciesSpecificB) {
    const speciesNameA = inventorySpeciesA || infoA.species || "";
    const speciesNameB = inventorySpeciesB || infoB.species || "";
    const speciesCompare = String(speciesNameA).localeCompare(String(speciesNameB));
    if (speciesCompare !== 0) {
      return speciesCompare;
    }
  }

  const eggGroupCompare = String(infoA.eggGroup || "").localeCompare(String(infoB.eggGroup || ""));
  if (eggGroupCompare !== 0) {
    return eggGroupCompare;
  }

  if (countA !== countB) {
    return countB - countA;
  }

  return String(keyA).localeCompare(String(keyB));
}

function groupAllocatedInventoryEntries(allocatedInventoryEntries) {
  const grouped = new Map();

  for (const allocation of allocatedInventoryEntries || []) {
    if (!allocation || !allocation.entry || !allocation.needKey) {
      continue;
    }

    const entry = allocation.entry;
    const ivKey = STATS.filter((stat) => entry.ivs && entry.ivs.has(stat)).join(",");
    const groupKey = [
      allocation.needKey,
      entry.speciesApiName || normalize(entry.species),
      entry.gender || "Any",
      entry.nature || "Any",
      ivKey
    ].join("|");

    const existing = grouped.get(groupKey);
    if (existing) {
      existing.count += 1;
    } else {
      grouped.set(groupKey, {
        needKey: allocation.needKey,
        entry,
        count: 1
      });
    }
  }

  return grouped;
}

function buildInventoryCardLines(entry, options = {}) {
  const lines = [];
  if (!entry) {
    return lines;
  }

  const includeTraits = options.includeTraits !== false;

  const entryEggGroups = (entry.eggGroups || [])
    .map((group) => String(group || "").trim())
    .filter(Boolean);
  const isGenderlessSpecies = entryEggGroups.some((group) => normalize(group) === normalize("Genderless"));
  const speciesLine = isGenderlessSpecies
    ? `${entry.species || "Unknown"}`.trim()
    : `${entry.gender || "Any"} ${entry.species}`.trim();
  lines.push(`Use: ${speciesLine}`);

  if (includeTraits && entry.nature && entry.nature !== "Any") {
    lines.push(`Nature: ${entry.nature}`);
  }

  const ownedStats = STATS.filter((stat) => entry.ivs && entry.ivs.has(stat));
  if (includeTraits && ownedStats.length > 0) {
    lines.push(`IVs: ${ownedStats.map((stat) => `${stat} 31`).join(", ")}`);
  }

  return lines;
}

function buildCatchCardLines({ eggGroup, species, need, genderNeed, familyApiName }) {
  const gender = normalizeNodeGender((genderNeed || "").replace("Gender:", ""));
  const isSpeciesLine = need === "Base Carrier";
  const isGenderlessNeed = String(genderNeed || "").replace("Gender:", "").trim().startsWith("Genderless");
  const genderlessLineLabel = isGenderlessNeed
    ? (familyApiName ? getSpeciesLineLabelFromFamilyApiName(familyApiName, species) : getSpeciesLineLabelForSpecies(species))
    : "";
  const roleLabel = isSpeciesLine ? species : eggGroup;

  if (genderlessLineLabel) {
    const lines = [genderlessLineLabel];
    if (need.startsWith("Nature:")) {
      lines.push(`Nature: ${need.replace("Nature:", "")}`);
      return lines;
    }
    if (need.startsWith("IV:")) {
      const stat = need.replace("IV:", "");
      lines.push(`IV: ${stat} 31`);
      return lines;
    }
    if (need.startsWith("TwoPerfectIVs:")) {
      const stats = need.replace("TwoPerfectIVs:", "").split("+").join(", ");
      lines.push(`2x31: ${stats}`);
      return lines;
    }
    return lines;
  }

  const sameRoleAndGender = normalize(gender || "") && normalize(gender || "") === normalize(roleLabel || "");
  const lines = [sameRoleAndGender ? `${gender || roleLabel || "Any"}`.trim() : `${gender || "Any"} ${roleLabel}`.trim()];

  if (need.startsWith("Nature:")) {
    lines.push(`Nature: ${need.replace("Nature:", "")}`);
    return lines;
  }

  if (need.startsWith("IV:")) {
    const stat = need.replace("IV:", "");
    lines.push(`IV: ${stat} 31`);
    return lines;
  }

  if (need.startsWith("TwoPerfectIVs:")) {
    const stats = need.replace("TwoPerfectIVs:", "").split("+").join(", ");
    lines.push(`2x31: ${stats}`);
    return lines;
  }
  return lines;
}

function buildNeedGenderIcon(genderNeed) {
  const normalized = String(genderNeed || "").replace("Gender:", "").trim().toLowerCase();
  let label = "A";
  let modifier = "any";

  if (normalized.startsWith("male")) {
    label = "M";
    modifier = "male";
  } else if (normalized.startsWith("female")) {
    label = "F";
    modifier = "female";
  } else if (normalized.startsWith("genderless")) {
    label = "G";
    modifier = "any";
  }

  const title = `Gender: ${normalized || "any"}`;
  return `<span class="need-gender-icon need-gender-icon--${modifier}" title="${escapeHtml(title)}">${label}</span>`;
}


function collectItemCounts(plans) {
  const itemCounts = new Map();
  for (const plan of plans || []) {
    for (const step of plan.steps || []) {
      for (const item of step.itemsUsed || []) {
        if (!item || item === "No Item") {
          continue;
        }
        itemCounts.set(item, (itemCounts.get(item) || 0) + 1);
      }
    }
  }
  return itemCounts;
}

function getItemIconPath(itemName) {
  const itemIcons = {
    "Everstone": "assets/everstone.png",
    "Power Weight (HP)": "assets/weight.png",
    "Power Bracer (Atk)": "assets/power.png",
    "Power Belt (Def)": "assets/belt.png",
    "Power Lens (SpA)": "assets/lens.png",
    "Power Band (SpD)": "assets/band.png",
    "Power Anklet (Spe)": "assets/anklet.png"
  };

  return itemIcons[itemName] || "";
}

function getUnitCostForItem(itemName, costConfig) {
  if (itemName === "Everstone") {
    return costConfig.everstone;
  }

  if (itemName.startsWith("Power ")) {
    return costConfig.brace;
  }

  return 0;
}

function renderItemNeedsList(plans, costConfig = state.costConfig) {
  el.itemNeedsList.innerHTML = "";

  if (!plans || plans.length === 0) {
    const empty = document.createElement("div");
    empty.className = "empty";
    empty.textContent = "No item requirements yet.";
    el.itemNeedsList.appendChild(empty);
    return;
  }

  const itemCounts = collectItemCounts(plans);

  if (itemCounts.size === 0) {
    const empty = document.createElement("div");
    empty.className = "empty";
    empty.textContent = "No held items required for this plan.";
    el.itemNeedsList.appendChild(empty);
    return;
  }

  const sorted = [...itemCounts.entries()].sort((a, b) => b[1] - a[1]);
  for (const [itemName, count] of sorted) {
    const unitCost = getUnitCostForItem(itemName, costConfig);
    const subtotal = unitCost * count;
    const iconPath = getItemIconPath(itemName);
    const card = document.createElement("article");
    card.className = "shop-item";
    card.innerHTML = `
      <strong>${escapeHtml(itemName)}</strong>
      <div class="target-meta">Unit Price: ${formatCurrency(unitCost)}</div>
      <div class="target-meta">Subtotal: ${formatCurrency(subtotal)}</div>
      <div class="shop-item-corner"><strong>x${count}</strong>${iconPath ? `<img class="shop-item-icon" src="${escapeHtml(iconPath)}" alt="">` : ""}</div>
    `;
    el.itemNeedsList.appendChild(card);
  }
}


function renderBuyChecklist(remainingNeeds, plans = [], costConfig = state.costConfig) {
  if (!el.buyChecklistList) {
    return;
  }

  el.buyChecklistList.innerHTML = "";

  const rows = buildChecklistRows(remainingNeeds, plans, costConfig);
  const checkedMap = state.buyChecklist?.checkedById || {};
  const budget = Math.max(0, Number(state.buyChecklist?.budget || 0));

  if (el.buyChecklistBudgetInput) {
    el.buyChecklistBudgetInput.value = String(budget);
  }

  if (rows.length === 0) {
    const empty = document.createElement("div");
    empty.className = "empty";
    empty.textContent = "No checklist items yet.";
    el.buyChecklistList.appendChild(empty);

    if (el.buyChecklistProgress) {
      el.buyChecklistProgress.textContent = "Checked 0/0";
    }
    if (el.buyChecklistStatus) {
      el.buyChecklistStatus.textContent = "Generate a plan to build your checklist.";
    }
    if (el.buyChecklistRemaining) {
      el.buyChecklistRemaining.value = formatCurrency(budget);
    }
    if (el.buyChecklistOutstanding) {
      el.buyChecklistOutstanding.value = formatCurrency(0);
    }

    state.buyChecklist.checkedById = {};
    persistBuyChecklist();
    return;
  }

  const validKeys = new Set(rows.map((row) => row.id));
  const nextChecked = {};
  for (const key of Object.keys(checkedMap)) {
    if (validKeys.has(key)) {
      nextChecked[key] = Boolean(checkedMap[key]);
    }
  }
  state.buyChecklist.checkedById = nextChecked;

  let checkedCount = 0;
  let spent = 0;
  let outstanding = 0;

  for (const row of rows) {
    const checked = Boolean(state.buyChecklist.checkedById[row.id]);
    if (checked) {
      checkedCount += 1;
      spent += row.subtotal;
    } else {
      outstanding += row.subtotal;
    }

    const card = document.createElement("article");
    card.className = `shop-item buy-check-item${checked ? " buy-check-item--checked" : ""}`;
    const genderIcon = row.genderNeed ? buildNeedGenderIcon(row.genderNeed) : "";
    card.innerHTML = `
      ${genderIcon}
      <label class="buy-check-item__label">
        <input type="checkbox" data-check-id="${escapeHtml(row.id)}" ${checked ? "checked" : ""}>
        <span>
          <strong>${escapeHtml(row.title)}</strong>
          ${row.meta ? `<div class="target-meta">${escapeHtml(row.meta)}</div>` : ""}
          <div class="target-meta">Unit Price: ${formatCurrency(row.unitCost)}</div>
          <div class="target-meta">Subtotal: ${formatCurrency(row.subtotal)}</div>
        </span>
      </label>
      <div class="shop-item-corner"><strong>x${row.count}</strong>${row.iconPath ? `<img class="shop-item-icon" src="${escapeHtml(row.iconPath)}" alt="">` : ""}</div>
    `;
    el.buyChecklistList.appendChild(card);
  }

  if (el.buyChecklistProgress) {
    el.buyChecklistProgress.textContent = `Checked ${checkedCount}/${rows.length}`;
  }

  const remaining = budget - spent;
  if (el.buyChecklistRemaining) {
    el.buyChecklistRemaining.value = formatCurrency(remaining);
  }

  if (el.buyChecklistOutstanding) {
    el.buyChecklistOutstanding.value = formatCurrency(outstanding);
  }

  if (el.buyChecklistStatus) {
    el.buyChecklistStatus.textContent = `Spent ${formatCurrency(spent)} of ${formatCurrency(budget)}.`;
  }

  persistBuyChecklist();
}

function buildChecklistRows(remainingNeeds, plans, costConfig) {
  const rows = [];

  if (remainingNeeds instanceof Map && remainingNeeds.size > 0) {
    const needInfoCache = new Map();
    const sortedNeeds = [...remainingNeeds.entries()].sort((a, b) => compareShoppingNeedEntries(a, b, needInfoCache));
    for (const [needKey, count] of sortedNeeds) {
      const info = getNeedInfoCached(needKey, needInfoCache);
      const cardLines = buildCatchCardLines({
        eggGroup: info.eggGroup,
        species: info.species,
        need: info.need,
        genderNeed: info.genderNeed,
        familyApiName: info.familyApiName
      });
      const title = cardLines[0] || "Breeder";
      const meta = cardLines.slice(1).join(" | ");
      const unitCost = getUnitCostForNeed(info.eggGroup, info.need, info.genderNeed, costConfig);
      rows.push({
        id: `need:${needKey}`,
        title,
        meta,
        genderNeed: info.genderNeed,
        count,
        unitCost,
        subtotal: unitCost * count,
        iconPath: "assets/gtl.png"
      });
    }
  }

  const itemCounts = collectItemCounts(plans || []);
  for (const [itemName, count] of [...itemCounts.entries()].sort((a, b) => b[1] - a[1])) {
    const unitCost = getUnitCostForItem(itemName, costConfig);
    rows.push({
      id: `item:${itemName}`,
      title: itemName,
      meta: "Held Item",
      genderNeed: "",
      count,
      unitCost,
      subtotal: unitCost * count,
      iconPath: getItemIconPath(itemName)
    });
  }

  return rows;
}


function createCollapsiblePlanCard(title, extraClass = "", isOpen = true) {
  const card = document.createElement("article");
  card.className = `plan-card plan-card--collapsible ${extraClass}`.trim();

  const details = document.createElement("details");
  details.className = "plan-card-toggle";
  details.open = isOpen;

  const summary = document.createElement("summary");
  summary.className = "plan-card-summary";
  summary.textContent = title;

  const body = document.createElement("div");
  body.className = "plan-card-body";

  details.append(summary, body);
  card.appendChild(details);
  return { card, body };
}

function renderPlanExplanations(plans, finalizedAllocation = null, costConfig = state.costConfig) {
  if (!el.planExplanations) {
    return;
  }

  el.planExplanations.innerHTML = "";

  if (!plans || plans.length === 0) {
    const empty = document.createElement("div");
    empty.className = "empty";
    empty.textContent = "Generate a plan to see why choices were made.";
    el.planExplanations.appendChild(empty);
    return;
  }

  for (const plan of plans) {
    const { card, body } = createCollapsiblePlanCard(`${plan.target.species} (${plan.target.nature})`, "", false);

    const list = document.createElement("ul");
    list.className = "plan-explain-list";

    for (const line of buildPlanExplanationLines(plan, finalizedAllocation, costConfig)) {
      const li = document.createElement("li");
      li.textContent = line;
      list.appendChild(li);
    }

    body.appendChild(list);
    el.planExplanations.appendChild(card);
  }
}

function renderPathAlternatives(plans, finalizedAllocation = null, costConfig = state.costConfig) {
  if (!el.pathAlternatives) {
    return;
  }

  el.pathAlternatives.innerHTML = "";

  const { card: wrapper, body: wrapperBody } = createCollapsiblePlanCard("Breeding Path Alternatives", "plan-alternatives-card", false);

  if (!plans || plans.length === 0) {
    const empty = document.createElement("div");
    empty.className = "empty";
    empty.textContent = "Generate a plan to view alternative route profiles.";
    wrapperBody.appendChild(empty);
    el.pathAlternatives.appendChild(wrapper);
    return;
  }

  const root = document.createElement("div");
  root.className = "plan-sections";
  for (const plan of plans) {
    const group = document.createElement("section");
    group.className = "plan-section";

    const header = document.createElement("h4");
    header.textContent = `${plan.target.species} (${plan.target.nature})`;
    group.appendChild(header);

    const profiles = buildAlternativeProfilesForPlan(plan, finalizedAllocation, costConfig);
    const cheapestCost = Math.min(...profiles.map((profile) => profile.estimatedCost));

    const list = document.createElement("ul");
    list.className = "plan-explain-list";
    for (const profile of profiles) {
      const li = document.createElement("li");
      const bestBadge = profile.estimatedCost === cheapestCost ? " <span class=\"plan-change-badge plan-change-badge--down\">best cost</span>" : "";
      li.innerHTML = `<strong>${escapeHtml(profile.name)}</strong>: ${escapeHtml(profile.summary)} (Cost ${escapeHtml(formatCurrency(profile.estimatedCost))}, Steps ${profile.estimatedSteps}, New Purchases ${profile.marketLeaves})${bestBadge}`;
      list.appendChild(li);
    }

    if (profiles.length === 1) {
      const info = document.createElement("p");
      info.className = "hint";
      info.textContent = "This is already the lowest-cost route for this target under available modes.";
      group.appendChild(info);
    }

    group.appendChild(list);
    root.appendChild(group);
  }

  const note = document.createElement("p");
  note.className = "hint";
  note.textContent = "Alternatives are planning profiles intended for tradeoff comparison before implementation.";
  wrapperBody.append(root, note);
  el.pathAlternatives.appendChild(wrapper);
}

function renderPlanCompare(plans, finalizedAllocation = null, costConfig = state.costConfig) {
  if (!el.planCompareOutput || !el.compareLeftProfile || !el.compareRightProfile) {
    return;
  }

  const profiles = buildGlobalAlternativeProfiles(plans, finalizedAllocation, costConfig);
  state.latestCompareProfiles = profiles;
  const options = profiles.map((profile) => ({ value: profile.key, label: profile.name }));

  hydrateCompareProfileSelect(el.compareLeftProfile, options, state.compareMode.left);
  hydrateCompareProfileSelect(el.compareRightProfile, options, state.compareMode.right);

  const leftKey = el.compareLeftProfile.value || state.compareMode.left;
  const rightKey = el.compareRightProfile.value || state.compareMode.right;
  state.compareMode.left = leftKey;
  state.compareMode.right = rightKey;

  el.planCompareOutput.innerHTML = "";

  if (profiles.length === 0) {
    const empty = document.createElement("div");
    empty.className = "empty";
    empty.textContent = "Generate a plan to compare profile outcomes.";
    el.planCompareOutput.appendChild(empty);
    return;
  }

  if (profiles.length === 1) {
    const single = profiles[0];
    el.compareLeftProfile.disabled = true;
    el.compareRightProfile.disabled = true;

    const note = document.createElement("div");
    note.className = "empty";
    note.textContent = "Only one executable mode is available for this setup.";

    const singleCard = buildCompareProfileCard(single, true);
    el.planCompareOutput.append(singleCard, note);
    return;
  }

  el.compareLeftProfile.disabled = false;
  el.compareRightProfile.disabled = false;

  const leftProfile = profiles.find((profile) => profile.key === leftKey) || profiles[0];
  const rightProfile = profiles.find((profile) => profile.key === rightKey) || profiles[Math.min(1, profiles.length - 1)] || profiles[0];

  const compareGrid = document.createElement("div");
  compareGrid.className = "plan-compare-grid";
  compareGrid.append(
    buildCompareProfileCard(leftProfile, true),
    buildCompareProfileCard(rightProfile, true)
  );

  const deltaList = document.createElement("ul");
  deltaList.className = "plan-explain-list";
  const deltas = [
    { label: "Estimated Total", left: leftProfile.estimatedCost, right: rightProfile.estimatedCost, fmt: formatCurrency, lowerIsBetter: true },
    { label: "Breeding Steps", left: leftProfile.estimatedSteps, right: rightProfile.estimatedSteps, fmt: (value) => String(value), lowerIsBetter: true },
    { label: "New Purchases", left: leftProfile.marketLeaves, right: rightProfile.marketLeaves, fmt: (value) => String(value), lowerIsBetter: true }
  ];

  for (const row of deltas) {
    const diff = row.right - row.left;
    const direction = diff === 0 ? "even" : (diff > 0 ? "higher" : "lower");
    const winner = diff === 0
      ? "Tie"
      : ((row.lowerIsBetter ? (diff < 0) : (diff > 0)) ? rightProfile.name : leftProfile.name);
    const li = document.createElement("li");
    li.textContent = `${row.label}: ${leftProfile.name} ${row.fmt(row.left)} vs ${rightProfile.name} ${row.fmt(row.right)} (${direction} by ${row.fmt(Math.abs(diff))}, winner: ${winner}).`;
    deltaList.appendChild(li);
  }

  el.planCompareOutput.append(compareGrid, deltaList);
}

function buildGlobalAlternativeProfiles(plans, finalizedAllocation, costConfig) {
  if (!plans || plans.length === 0) {
    return [];
  }

  const keys = ["current_optimized", "cheapest", "ignore_inventory"];
  const labels = {
    current_optimized: "Use Inventory (Balanced)",
    cheapest: "Lowest Cost (Auto)",
    ignore_inventory: "Ignore Inventory"
  };

  const totalSteps = (plans || []).reduce((sum, plan) => sum + (plan.steps || []).length, 0);
  const globalConsumablesCost = (plans || []).reduce((sum, plan) => sum + estimateConsumablesCost(plan, costConfig), 0);
  const optimizedNeedsCost = estimateNeedsCost(finalizedAllocation?.remainingNeeds || new Map(), costConfig).total;
  const ignoreInventoryNeedsCost = estimateNeedsCost(state.lastGlobalNeeds || new Map(), costConfig).total;

  const currentOptimized = {
    key: "current_optimized",
    name: labels.current_optimized,
    estimatedCost: optimizedNeedsCost + globalConsumablesCost,
    estimatedSteps: totalSteps,
    marketLeaves: finalizedAllocation?.remainingNeeds instanceof Map
      ? [...finalizedAllocation.remainingNeeds.values()].reduce((sum, count) => sum + count, 0)
      : 0,
    summary: "Uses owned inventory when beneficial while keeping normal planner behavior.",
    executable: true,
    executableProfileKey: "current_optimized"
  };

  const ignoreInventory = {
    key: "ignore_inventory",
    name: labels.ignore_inventory,
    estimatedCost: ignoreInventoryNeedsCost + globalConsumablesCost,
    estimatedSteps: totalSteps,
    marketLeaves: state.lastGlobalNeeds instanceof Map
      ? [...state.lastGlobalNeeds.values()].reduce((sum, count) => sum + count, 0)
      : 0,
    summary: "Treats all breeders as market purchases and ignores owned inventory.",
    executable: true,
    executableProfileKey: "ignore_inventory"
  };

  const cheapestBase = currentOptimized.estimatedCost <= ignoreInventory.estimatedCost
    ? currentOptimized
    : ignoreInventory;
  const cheapest = {
    key: "cheapest",
    name: labels.cheapest,
    estimatedCost: cheapestBase.estimatedCost,
    estimatedSteps: cheapestBase.estimatedSteps,
    marketLeaves: cheapestBase.marketLeaves,
    summary: `Automatically picks the cheaper result between \"${labels.current_optimized}\" and \"${labels.ignore_inventory}\".`,
    executable: true,
    executableProfileKey: cheapestBase.executableProfileKey
  };

  const profileMap = {
    current_optimized: currentOptimized,
    cheapest,
    ignore_inventory: ignoreInventory
  };
  return keys.map((key) => profileMap[key]).filter(Boolean);
}

function hydrateCompareProfileSelect(selectEl, options, selectedValue) {
  if (!selectEl) {
    return;
  }

  const previous = selectedValue || selectEl.value;
  selectEl.innerHTML = "";
  for (const optionMeta of options) {
    const option = document.createElement("option");
    option.value = optionMeta.value;
    option.textContent = optionMeta.label;
    selectEl.appendChild(option);
  }

  if (options.some((option) => option.value === previous)) {
    selectEl.value = previous;
  } else if (options.length > 0) {
    selectEl.value = options[0].value;
  }
}

function buildCompareProfileCard(profile, showUseAction = false) {
  const card = document.createElement("section");
  card.className = "plan-section";

  const heading = document.createElement("h4");
  heading.textContent = profile.name;

  const list = document.createElement("ul");
  list.className = "plan-explain-list";

  const rows = [
    profile.summary ? `Mode: ${profile.summary}` : "",
    `Estimated Total: ${formatCurrency(profile.estimatedCost)}`,
    `Breeding Steps: ${profile.estimatedSteps}`,
    `New Purchases: ${profile.marketLeaves}`
  ].filter(Boolean);

  for (const row of rows) {
    const li = document.createElement("li");
    li.textContent = row;
    list.appendChild(li);
  }

  card.append(heading, list);

  if (showUseAction) {
    const actionRow = document.createElement("div");
    actionRow.className = "section-actions";
    const useBtn = document.createElement("button");
    useBtn.className = "ghost-btn";
    useBtn.type = "button";
    useBtn.textContent = "Use This";
    useBtn.dataset.useProfile = profile.executableProfileKey || profile.key;
    useBtn.disabled = !profile.executable;
    actionRow.appendChild(useBtn);
    card.appendChild(actionRow);
  }

  return card;
}

function buildAlternativeProfilesForPlan(plan, finalizedAllocation, costConfig) {
  const graph = state.graphCache.get(plan.target.id);
  const leafNodes = (graph?.nodes || []).map((node) => node.data).filter((node) => node && node.kind === "leaf");
  const marketLeaves = leafNodes.filter((node) => !node.fromInventory);
  const marketLeavesCount = marketLeaves.length;
  const marketLeafCost = marketLeaves.reduce((sum, node) => {
    if (!node?.needKey) {
      return sum;
    }
    const info = parseNeedKey(node.needKey);
    return sum + getUnitCostForNeed(info.eggGroup, info.need, info.genderNeed, costConfig);
  }, 0);
  const baseCost = marketLeafCost + estimateConsumablesCost(plan, costConfig);
  const stepCount = (plan.steps || []).length;
  const requiredStatsCount = STATS.filter((stat) => plan.target.ivs[stat] === 31).length;

  const optimized = {
    key: "current_optimized",
    name: "Use Inventory (Balanced)",
    summary: "Uses inventory where helpful while preserving normal planner behavior.",
    estimatedCost: baseCost,
    estimatedSteps: stepCount,
    marketLeaves: marketLeavesCount
  };

  const ignoreInventory = {
    key: "ignore_inventory",
    name: "Ignore Inventory",
    summary: "Forces all breeders to be market-sourced; owned inventory is intentionally ignored.",
    estimatedCost: estimateNeedsCost(plan.baseNeeds, costConfig).total + estimateConsumablesCost(plan, costConfig),
    estimatedSteps: stepCount,
    marketLeaves: Math.max(marketLeavesCount, [...plan.baseNeeds.values()].reduce((sum, count) => sum + count, 0))
  };

  const cheapestBase = [optimized, ignoreInventory].sort((a, b) => {
    if (a.estimatedCost !== b.estimatedCost) {
      return a.estimatedCost - b.estimatedCost;
    }
    return a.estimatedSteps - b.estimatedSteps;
  })[0] || optimized;
  const cheapest = {
    key: "cheapest",
    name: "Lowest Cost (Auto)",
    summary: "Automatically picks the lower-cost result between balanced and ignore-inventory modes.",
    estimatedCost: cheapestBase.estimatedCost,
    estimatedSteps: cheapestBase.estimatedSteps,
    marketLeaves: cheapestBase.marketLeaves
  };

  return [optimized, cheapest, ignoreInventory];
}

function buildPlanExplanationLines(plan, finalizedAllocation, costConfig) {
  const lines = [];
  const ivSummary = STATS.filter((stat) => plan.target.ivs[stat] === 31).join(", ") || "None";
  lines.push(`Target IVs: ${ivSummary}.`);

  const graph = state.graphCache.get(plan.target.id);
  const leafNodes = (graph?.nodes || []).map((node) => node.data).filter((node) => node && node.kind === "leaf");
  const inventoryLeaves = leafNodes.filter((node) => node.fromInventory);
  const marketLeaves = leafNodes.filter((node) => !node.fromInventory);

  if (inventoryLeaves.length > 0) {
    lines.push(`Used ${inventoryLeaves.length} owned breeder${inventoryLeaves.length === 1 ? "" : "s"} to reduce purchases.`);
  } else {
    lines.push("No compatible owned breeders were selected, so all donor needs are market-based.");
  }

  const natureNeeds = [...plan.baseNeeds.keys()].filter((key) => parseNeedKey(key).need.startsWith("Nature:"));
  if (plan.target.nature !== "Any") {
    lines.push(natureNeeds.length > 0
      ? "Nature was inherited through a dedicated nature donor path."
      : "Nature donor was skipped because the carrier path already satisfied nature requirements.");
  }

  const twoPerfectNeeds = [...plan.baseNeeds.entries()].filter(([key]) => parseNeedKey(key).need.startsWith("TwoPerfectIVs:"));
  if (twoPerfectNeeds.length > 0) {
    const analyses = twoPerfectNeeds.map(([needKey, count]) => {
      const info = parseNeedKey(needKey);
      const twoperfectivsUnit = getUnitCostForNeed(info.eggGroup, info.need, info.genderNeed, costConfig);
      const singleUnit = getMaleEggGroupPrice(info.eggGroup, costConfig);
      const bredPairCost = singleUnit * 2 + costConfig.brace * 2;
      return {
        count,
        twoperfectivsUnit,
        bredPairCost
      };
    });

    const totalChosen = analyses.reduce((sum, row) => sum + row.twoperfectivsUnit * row.count, 0);
    const totalAlternative = analyses.reduce((sum, row) => sum + row.bredPairCost * row.count, 0);
    const delta = totalAlternative - totalChosen;

    if (delta > 0) {
      lines.push(`2x31 donor path saved ${formatCurrency(delta)} versus breeding equivalent two single-IV donors.`);
    } else if (delta < 0) {
      lines.push(`2x31 donor path costs ${formatCurrency(Math.abs(delta))} more than breeding two single-IV donors, likely due to inventory or compatibility constraints.`);
    } else {
      lines.push("2x31 donor path is cost-neutral versus breeding two single-IV donors.");
    }
  }

  const donorSavings = estimateCheapestDonorSavings(plan, costConfig);
  if (donorSavings) {
    const direction = donorSavings.delta >= 0 ? "saved" : "costs";
    const amount = formatCurrency(Math.abs(donorSavings.delta));
    lines.push(`Donor egg group choice ${direction} ${amount} per donor (chosen ${donorSavings.chosenGroup} vs next best ${donorSavings.alternativeGroup}).`);
  }

  const breederCost = estimateNeedsCost(plan.baseNeeds, costConfig).total;
  const itemCost = estimateConsumablesCost(plan, costConfig);
  lines.push(`Estimated target total: ${formatCurrency(breederCost + itemCost)} (${formatCurrency(breederCost)} breeders + ${formatCurrency(itemCost)} items).`);

  if (finalizedAllocation?.remainingNeeds instanceof Map) {
    const uncovered = marketLeaves.length;
    lines.push(`${uncovered} leaf breeder step${uncovered === 1 ? " remains" : "s remain"} uncovered by inventory for this target path.`);
  }

  return lines;
}

function estimateCheapestDonorSavings(plan, costConfig) {
  const donorNeedKeys = [...plan.baseNeeds.keys()].filter((needKey) => {
    const info = parseNeedKey(needKey);
    return normalize(info.species) === normalize("Compatible Egg-Group Donor");
  });

  if (donorNeedKeys.length === 0) {
    return null;
  }

  const sampleInfo = parseNeedKey(donorNeedKeys[0]);
  const candidateGroups = sampleInfo.candidateEggGroups.length > 0
    ? sampleInfo.candidateEggGroups
    : plan.target.eggGroups.filter((group) => group !== "Undiscovered" && group !== "Ditto");
  const chosenGroup = sampleInfo.eggGroup;

  if (!candidateGroups.includes(chosenGroup) || candidateGroups.length < 2) {
    return null;
  }

  const ranked = candidateGroups
    .map((group) => ({ group, price: getMaleEggGroupPrice(group, costConfig) }))
    .sort((a, b) => a.price - b.price);
  const chosen = ranked.find((entry) => entry.group === chosenGroup);
  const best = ranked[0];
  const nextBest = ranked.find((entry) => entry.group !== chosenGroup) || ranked[1];

  if (!chosen || !nextBest || !best) {
    return null;
  }

  return {
    chosenGroup,
    alternativeGroup: nextBest.group,
    delta: nextBest.price - chosen.price
  };
}

function renderPlanCards(plans, costConfig = state.costConfig) {
  el.planCards.innerHTML = "";

  if (!plans || plans.length === 0) {
    const empty = document.createElement("div");
    empty.className = "empty";
    empty.textContent = "Generate a plan to see steps.";
    el.planCards.appendChild(empty);
    return;
  }

  for (const plan of plans) {
    const card = document.createElement("article");
    card.className = "plan-card";

    const ivSummary = STATS.filter((s) => plan.target.ivs[s] === 31).join(", ") || "None";

    const title = document.createElement("h3");
    title.textContent = `${plan.target.species} (${plan.target.nature})`;

    const meta = document.createElement("p");
    meta.className = "hint";
    meta.textContent = `Egg Groups: ${plan.target.eggGroups.join(" / ")} | Species Gender: ${plan.target.genderProfile.text} | Target IVs: ${ivSummary}`;

    const sections = [
      "Prechecks",
      "Branch A: Species Parent",
      "Branch B: IV Donor Stack",
      "Final Merge"
    ];

    const sectionRoot = document.createElement("div");
    sectionRoot.className = "plan-sections";

    for (const sectionName of sections) {
      const sectionSteps = plan.steps.filter((step) => (step.branch || "Branch B: IV Donor Stack") === sectionName);
      if (sectionSteps.length === 0) {
        continue;
      }

      const block = document.createElement("section");
      block.className = "plan-section";

      const heading = document.createElement("h4");
      heading.textContent = sectionName;

      const list = document.createElement("ol");
      for (const step of sectionSteps) {
        const li = document.createElement("li");
        const stepCost = step.bracesUsed * costConfig.brace + step.everstoneUsed * costConfig.everstone;
        li.textContent = `${step.text} (Braces: ${step.bracesUsed || 0}, Everstones: ${step.everstoneUsed || 0}, Est. Step Cost: ${formatCurrency(stepCost)})`;
        list.appendChild(li);
      }

      block.append(heading, list);
      sectionRoot.appendChild(block);
    }

    const planCost = estimateNeedsCost(plan.baseNeeds, costConfig).total + estimateConsumablesCost(plan, costConfig);
    const costLine = document.createElement("p");
    costLine.className = "hint";
    costLine.textContent = `Estimated Total Cost: ${formatCurrency(planCost)}`;

    if (plan.steps.length === 0) {
      const li = document.createElement("div");
      li.className = "empty";
      li.textContent = "No breeding chain required for this target.";
      card.append(title, meta, costLine, li);
    } else {
      card.append(title, meta, costLine, sectionRoot);
    }

    el.planCards.appendChild(card);
  }
}


function readCostConfig() {
  return {
    twoperfectivsSupport: Boolean(el.twoperfectivsSupportInput?.checked),
    brace: parseNumber(el.costBraceInput.value, 10000),
    everstone: parseNumber(el.costEverstoneInput.value, 5000),
    maleEggGroupPrices: readMaleEggGroupPrices(),
    maleTwoperfectivsEggGroupPrices: readMaleTwoperfectivsEggGroupPrices()
  };
}

function normalizeNeedsWithCompatibleGroups(needsMap, plans) {
  if (!(needsMap instanceof Map) || needsMap.size === 0) {
    return needsMap;
  }

  const compatibilityByLegacyKey = new Map();

  for (const plan of plans || []) {
    for (const node of plan?.nodes || []) {
      if (!node || node.kind !== "leaf" || normalize(node.species) !== normalize("Compatible Egg-Group Donor")) {
        continue;
      }

      const nodeNeed = node.nature
        ? `Nature:${node.nature}`
        : (node.stats?.size >= 2
            ? `TwoPerfectIVs:${[...node.stats].join("+")}`
            : (node.stats?.size === 1 ? `IV:${[...node.stats][0]}` : "Base"));
      const legacyKey = `${node.eggGroupUsed || "Unknown"}|${node.species}|${nodeNeed}|Gender:${node.genderNeed || "Any"}`;
      const compatibleGroups = (node.eggGroups || [])
        .filter((group) => group !== "Undiscovered" && group !== "Ditto")
        .map((group) => String(group || "").trim())
        .filter(Boolean);

      if (compatibleGroups.length === 0) {
        continue;
      }

      const existing = compatibilityByLegacyKey.get(legacyKey) || new Set();
      for (const group of compatibleGroups) {
        existing.add(group);
      }
      compatibilityByLegacyKey.set(legacyKey, existing);
    }
  }

  const normalized = new Map();

  for (const [key, amount] of needsMap.entries()) {
    const info = parseNeedKey(key);
    let finalKey = key;

    if (normalize(info.species) === normalize("Compatible Egg-Group Donor") && info.candidateEggGroups.length === 0) {
      const compatible = compatibilityByLegacyKey.get(key);
      if (compatible && compatible.size > 0) {
        finalKey = `${key}|Groups:${[...compatible].join(",")}`;
      }
    }

    normalized.set(finalKey, (normalized.get(finalKey) || 0) + amount);
  }

  return normalized;
}

function refreshCostsAfterInput() {
  state.costConfig = readCostConfig();
  setSettingsSidebarOpen(false);

  if (state.targets.length === 0) {
    renderTotalCostSummary(0, 0, 0);
    return;
  }


  generatePlan();
}

function estimateNeedsCost(needsMap, costConfig) {
  let total = 0;

  for (const [key, count] of needsMap.entries()) {
    const parts = key.split("|");
    const eggGroup = parts[0] || "Unknown";
    const need = parts[2] || "Base";
    const genderNeed = parts[3] || "Gender:Any";
    total += getUnitCostForNeed(eggGroup, need, genderNeed, costConfig) * count;
  }

  return { total };
}

function estimateConsumablesCost(plan, costConfig) {
  let total = 0;
  for (const step of plan.steps) {
    total += (step.bracesUsed || 0) * costConfig.brace;
    total += (step.everstoneUsed || 0) * costConfig.everstone;
  }
  return total;
}

function getUnitCostForNeed(eggGroup, need, genderNeed, costConfig) {
  const normalizedGender = genderNeed.toLowerCase();

  if (need.startsWith("TwoPerfectIVs:")) {
    return getMaleTwoperfectivsEggGroupPrice(eggGroup, costConfig);
  }

  if (normalizedGender.includes("male")) {
    return getMaleEggGroupPrice(eggGroup, costConfig);
  }

  if (normalizedGender.includes("genderless")) {
    return getMaleEggGroupPrice(eggGroup, costConfig);
  }

  return 0;
}

function createDefaultMaleEggGroupPrices(groups) {
  const out = {};
  for (const group of groups) {
    out[group] = DEFAULT_MALE_EGG_GROUP_PRICE;
  }
  return out;
}

function createDefaultMaleTwoperfectivsEggGroupPrices(groups) {
  const out = {};
  for (const group of groups) {
    out[group] = DEFAULT_TWOPERFECTIVS_MALE_EGG_GROUP_PRICE;
  }
  return out;
}

function collectKnownMaleEggGroups(speciesCatalog) {
  const groupSet = new Set();
  for (const mon of speciesCatalog) {
    for (const group of mon.eggGroups) {
      if (group !== "Undiscovered" && group !== "Ditto") {
        groupSet.add(group);
      }
    }
  }
  return [...groupSet].sort((a, b) => a.localeCompare(b));
}

function renderMaleEggGroupCostInputs(groups) {
  const existingPrices = readMaleEggGroupPrices();
  const existingTwoperfectivsPrices = readMaleTwoperfectivsEggGroupPrices();
  el.maleEggGroupCosts.innerHTML = "";
  el.twoperfectivsEggGroupCosts.innerHTML = "";

  for (const group of groups) {
    const maleLabel = document.createElement("label");
    maleLabel.textContent = group;

    const maleInput = document.createElement("input");
    maleInput.type = "number";
    maleInput.min = "0";
    maleInput.step = "1";
    maleInput.dataset.eggGroup = group;
    maleInput.dataset.priceType = "male";
    maleInput.value = String(existingPrices[group] || state.costConfig.maleEggGroupPrices[group] || DEFAULT_MALE_EGG_GROUP_PRICE);

    maleLabel.appendChild(maleInput);
    el.maleEggGroupCosts.appendChild(maleLabel);

    const twoperfectivsLabel = document.createElement("label");
    twoperfectivsLabel.textContent = group;

    const twoperfectivsInput = document.createElement("input");
    twoperfectivsInput.type = "number";
    twoperfectivsInput.min = "0";
    twoperfectivsInput.step = "1";
    twoperfectivsInput.dataset.eggGroup = group;
    twoperfectivsInput.dataset.priceType = "twoperfectivs";
    twoperfectivsInput.value = String(existingTwoperfectivsPrices[group] || state.costConfig.maleTwoperfectivsEggGroupPrices[group] || DEFAULT_TWOPERFECTIVS_MALE_EGG_GROUP_PRICE);

    twoperfectivsLabel.appendChild(twoperfectivsInput);
    el.twoperfectivsEggGroupCosts.appendChild(twoperfectivsLabel);
  }

  syncTwoperfectivsSupportUi();
}

function readMaleEggGroupPrices() {
  const prices = createDefaultMaleEggGroupPrices(state.knownMaleEggGroups);
  const inputs = el.maleEggGroupCosts.querySelectorAll("input[data-egg-group][data-price-type='male']");

  for (const input of inputs) {
    const group = input.dataset.eggGroup;
    prices[group] = parseNumber(input.value, DEFAULT_MALE_EGG_GROUP_PRICE);
  }

  return prices;
}

function readMaleTwoperfectivsEggGroupPrices() {
  const prices = createDefaultMaleTwoperfectivsEggGroupPrices(state.knownMaleEggGroups);
  const inputs = el.twoperfectivsEggGroupCosts.querySelectorAll("input[data-egg-group][data-price-type='twoperfectivs']");

  for (const input of inputs) {
    const group = input.dataset.eggGroup;
    prices[group] = parseNumber(input.value, DEFAULT_TWOPERFECTIVS_MALE_EGG_GROUP_PRICE);
  }

  return prices;
}

function getMaleEggGroupPrice(eggGroup, costConfig) {
  const configured = costConfig.maleEggGroupPrices?.[eggGroup];
  if (Number.isFinite(configured) && configured >= 0) {
    return configured;
  }

  return DEFAULT_MALE_EGG_GROUP_PRICE;
}

function getMaleTwoperfectivsEggGroupPrice(eggGroup, costConfig) {
  const configured = costConfig.maleTwoperfectivsEggGroupPrices?.[eggGroup];
  if (Number.isFinite(configured) && configured >= 0) {
    return configured;
  }

  return DEFAULT_TWOPERFECTIVS_MALE_EGG_GROUP_PRICE;
}

function shouldUseTwoperfectivsForTwoStatMale(statsList, eggGroup, costConfig, compatibleEggGroups = [eggGroup]) {
  if (!costConfig.twoperfectivsSupport) {
    return false;
  }

  if (!Array.isArray(statsList) || statsList.length !== 2) {
    return false;
  }


  if (hasOwnedTwoStatDonor(statsList, compatibleEggGroups)) {
    return true;
  }

  const twoperfectivsCost = getMaleTwoperfectivsEggGroupPrice(eggGroup, costConfig);
  const singleDonorCost = getMaleEggGroupPrice(eggGroup, costConfig);
  const bredTwoStatCost = singleDonorCost * 2 + costConfig.brace * 2;
  return twoperfectivsCost < bredTwoStatCost;
}

function hasOwnedTwoStatDonor(statsList, eggGroups) {
  if (!state.inventoryEnabled) {
    return false;
  }

  const candidateGroups = Array.isArray(eggGroups) ? eggGroups : [eggGroups];
  const normalizedGroups = candidateGroups.map((g) => String(g || "").trim()).filter(Boolean);
  if (normalizedGroups.length === 0) {
    return false;
  }

  const requiredStats = new Set((statsList || []).map((s) => String(s || "").trim()).filter(Boolean));
  if (requiredStats.size !== 2) {
    return false;
  }

  for (const entry of state.inventory || []) {
    if (!entry || entry.count <= 0) {
      continue;
    }

    if (entry.gender !== "Male" && entry.gender !== "Any") {
      continue;
    }

    const entryGroups = entry.eggGroups || [];
    if (!normalizedGroups.some((group) => entryGroups.includes(group))) {
      continue;
    }

    const hasAllStats = [...requiredStats].every((stat) => entry.ivs.has(stat));
    if (hasAllStats) {
      return true;
    }
  }

  return false;
}

function resolveNeedEggGroup(eggGroups, genderNeed, costConfig) {
  const normalizedGender = String(genderNeed).toLowerCase();
  const candidates = eggGroups.filter((group) => group !== "Undiscovered" && group !== "Ditto");
  const anyInventoryGender = ["Male", "Female", "Any"];

  if (normalizedGender.includes("male")) {
    return chooseCheapestEggGroupByEffectivePrice(candidates, costConfig, anyInventoryGender) || candidates[0] || "Unknown";
  }

  if (normalizedGender.includes("female")) {
    const cheapest = chooseCheapestEggGroupByEffectivePrice(candidates, costConfig, anyInventoryGender);
    if (cheapest) {
      return cheapest;
    }
  }

  if (normalizedGender.includes("genderless")) {
    const cheapest = chooseCheapestEggGroupByEffectivePrice(candidates, costConfig, anyInventoryGender);
    if (cheapest) {
      return cheapest;
    }
  }

  const fallback = eggGroups.find((group) => group !== "Undiscovered");
  return fallback || eggGroups[0] || "Unknown";
}

function chooseCheapestEggGroupByEffectivePrice(candidates, costConfig, allowedGenders) {
  if (!Array.isArray(candidates) || candidates.length === 0) {
    return null;
  }

  let bestGroup = candidates[0];
  let bestPrice = getEggGroupEffectivePrice(candidates[0], costConfig, allowedGenders);

  for (const group of candidates.slice(1)) {
    const price = getEggGroupEffectivePrice(group, costConfig, allowedGenders);
    if (price < bestPrice) {
      bestPrice = price;
      bestGroup = group;
    }
  }

  return bestGroup;
}

function getEggGroupEffectivePrice(eggGroup, costConfig, allowedGenders) {
  if (hasOwnedEntryForEggGroup(eggGroup, allowedGenders)) {

    return 0;
  }

  return getMaleEggGroupPrice(eggGroup, costConfig);
}

function hasOwnedEntryForEggGroup(eggGroup, allowedGenders) {
  if (!state.inventoryEnabled) {
    return false;
  }

  for (const entry of state.inventory || []) {
    if (!entry || entry.count <= 0) {
      continue;
    }

    if (!allowedGenders.includes(entry.gender)) {
      continue;
    }

    if ((entry.eggGroups || []).includes(eggGroup)) {
      return true;
    }
  }

  return false;
}

function renderTotalCostSummary(total, needsCost, consumableCost) {
  el.totalCostOutput.textContent = `Estimated Total: ${formatCurrency(total)} (Breeders: ${formatCurrency(needsCost)} + Items: ${formatCurrency(consumableCost)})`;
}


const STATS = ["HP", "Atk", "Def", "SpA", "SpD", "Spe"];
const NATURES = [
  "Any",
  "Adamant",
  "Bold",
  "Brave",
  "Calm",
  "Careful",
  "Docile",
  "Gentle",
  "Hardy",
  "Hasty",
  "Impish",
  "Jolly",
  "Lax",
  "Lonely",
  "Mild",
  "Modest",
  "Naive",
  "Naughty",
  "Quiet",
  "Quirky",
  "Rash",
  "Relaxed",
  "Sassy",
  "Serious",
  "Timid"
];

const DEFAULT_MALE_EGG_GROUPS = [
  "Monster",
  "Water A",
  "Bug",
  "Flying",
  "Field",
  "Fairy",
  "Plant",
  "Humanoid",
  "Water C",
  "Mineral",
  "Chaos",
  "Water B",
  "Dragon"
];

const DEFAULT_MALE_EGG_GROUP_PRICE = 7000;
const DEFAULT_TWOPERFECTIVS_MALE_EGG_GROUP_PRICE = 34000;
const THEME_STORAGE_KEY = "pokemmo-breeder-theme";
const TWOPERFECTIVS_SUPPORT_STORAGE_KEY = "pokemmo-breeder-twoperfectivs-support";
const TARGETS_STORAGE_KEY = "pokemmo-breeder-targets";
const SETTINGS_STORAGE_KEY = "pokemmo-breeder-settings";
const INVENTORY_STORAGE_KEY = "pokemmo-breeder-inventory";
const BUY_CHECKLIST_STORAGE_KEY = "pokemmo-breeder-buy-checklist";
const MOBILE_QUICK_MODE_STORAGE_KEY = "pokemmo-breeder-mobile-quick-mode";
const BRACE_BY_STAT = {
  HP: "Pesas Recias (HP)",
  Atk: "Muñequeras Recias (Atk)",
  Def: "Cinturón Recio (Def)",
  SpA: "Lentes Recios (Ata. Esp.)",
  SpD: "Banda Recia (Def. Esp.)",
  Spe: "Tobilleras Recias (Vel)"
};

// -----------------------------------------------------------------------------
// Archivo principal del planificador de crianza de PokeMMO.
//
// Este script centraliza la lógica de la aplicación:
// - carga y normalización del catálogo de especies
// - búsqueda y validación de especies por nombre
// - almacenamiento de objetivos e inventario
// - generación del plan de cría y cálculo de costos
// - renderizado de la interfaz y estados visuales
// -----------------------------------------------------------------------------

const state = {
  targets: [],
  planByTargetId: new Map(),
  graphCache: new Map(),
  speciesCatalog: [],
  speciesByDisplay: new Map(),
  speciesByApi: new Map(),
  speciesDataCache: new Map(),
  evolutionFamilies: {},
  genderAwareSpeciesByName: new Map(),
  inventory: [],
  inventoryEnabled: true,
  mobileQuickMode: false,
  lastGlobalNeeds: new Map(),
  costConfig: {
    twoperfectivsSupport: false,
    brace: 10000,
    everstone: 5000,
    maleEggGroupPrices: {},
    maleTwoperfectivsEggGroupPrices: {}
  },
  knownMaleEggGroups: [...DEFAULT_MALE_EGG_GROUPS],
  buyChecklist: {
    budget: 0,
    checkedById: {}
  },
  latestGeneratedPlans: [],
  latestFinalizedAllocation: null,
  latestCompareProfiles: [],
  appliedPlanProfile: "current_optimized",
  compareMode: {
    left: "current_optimized",
    right: "ignore_inventory"
  },
  cy: null
};

// Referencias rápidas a los nodos del DOM que usa la app.
// Se guardan en un único objeto para evitar repetir document.getElementById
// en distintas funciones y mantener el código más legible.
const el = {
  speciesInput: document.getElementById("speciesInput"),
  speciesMeta: document.getElementById("speciesMeta"),
  natureInput: document.getElementById("natureInput"),
  settingsToggle: document.getElementById("settingsToggle"),
  mobileQuickModeToggle: document.getElementById("mobileQuickModeToggle"),
  settingsClose: document.getElementById("settingsClose"),
  settingsBackdrop: document.getElementById("settingsBackdrop"),
  settingsSidebar: document.getElementById("settingsSidebar"),
  twoperfectivsSupportInput: document.getElementById("twoperfectivsSupportInput"),
  twoperfectivsPriceSection: document.getElementById("twoperfectivsPriceSection"),
  costBraceInput: document.getElementById("costBraceInput"),
  costEverstoneInput: document.getElementById("costEverstoneInput"),
  maleEggGroupCosts: document.getElementById("maleEggGroupCosts"),
  twoperfectivsEggGroupCosts: document.getElementById("twoperfectivsEggGroupCosts"),
  importCostsBtn: document.getElementById("importCostsBtn"),
  exportCostsBtn: document.getElementById("exportCostsBtn"),
  costsImportInput: document.getElementById("costsImportInput"),
  recalcCostsBtn: document.getElementById("recalcCostsBtn"),
  totalCostOutput: document.getElementById("totalCostOutput"),
  themeToggle: document.getElementById("themeToggle"),
  ivChecklist: document.getElementById("ivChecklist"),
  inventoryIvChecklist: document.getElementById("inventoryIvChecklist"),
  addTargetBtn: document.getElementById("addTargetBtn"),
  importTargetsBtn: document.getElementById("importTargetsBtn"),
  exportTargetsBtn: document.getElementById("exportTargetsBtn"),
  targetImportInput: document.getElementById("targetImportInput"),
  clearTargetsBtn: document.getElementById("clearTargetsBtn"),
  targetsList: document.getElementById("targetsList"),
  generatePlanBtn: document.getElementById("generatePlanBtn"),
  generatePlanProfile: document.getElementById("generatePlanProfile"),
  inventorySection: document.getElementById("inventorySection"),
  inventorySpeciesInput: document.getElementById("inventorySpeciesInput"),
  inventoryNatureInput: document.getElementById("inventoryNatureInput"),
  inventoryGenderInput: document.getElementById("inventoryGenderInput"),
  addInventoryBtn: document.getElementById("addInventoryBtn"),
  importInventoryBtn: document.getElementById("importInventoryBtn"),
  exportInventoryBtn: document.getElementById("exportInventoryBtn"),
  inventoryImportInput: document.getElementById("inventoryImportInput"),
  inventoryPokeMMOImportInput: document.getElementById("inventoryPokeMMOImportInput"),
  clearInventoryBtn: document.getElementById("clearInventoryBtn"),
  inventoryList: document.getElementById("inventoryList"),
  inventorySummary: document.getElementById("inventorySummary"),
  inventoryEnabledInput: document.getElementById("inventoryEnabledInput"),
  shoppingChecklistTitle: document.getElementById("shoppingChecklistTitle"),
  shoppingChecklistToggleBtn: document.getElementById("shoppingChecklistToggleBtn"),
  shoppingListView: document.getElementById("shoppingListView"),
  buyChecklistView: document.getElementById("buyChecklistView"),
  acquisitionPriorityList: document.getElementById("acquisitionPriorityList"),
  shoppingListTotal: document.getElementById("shoppingListTotal"),
  shoppingList: document.getElementById("shoppingList"),
  buyChecklistProgress: document.getElementById("buyChecklistProgress"),
  buyChecklistBudgetInput: document.getElementById("buyChecklistBudgetInput"),
  buyChecklistRemaining: document.getElementById("buyChecklistRemaining"),
  buyChecklistOutstanding: document.getElementById("buyChecklistOutstanding"),
  buyChecklistStatus: document.getElementById("buyChecklistStatus"),
  buyChecklistList: document.getElementById("buyChecklistList"),
  clearBuyChecklistBtn: document.getElementById("clearBuyChecklistBtn"),
  itemNeedsList: document.getElementById("itemNeedsList"),
  pathAlternatives: document.getElementById("pathAlternatives"),
  compareLeftProfile: document.getElementById("compareLeftProfile"),
  compareRightProfile: document.getElementById("compareRightProfile"),
  planCompareOutput: document.getElementById("planCompareOutput"),
  planExplanations: document.getElementById("planExplanations"),
  graph: document.getElementById("graph"),
  graphTargetSelect: document.getElementById("graphTargetSelect"),
  graphCollapseToggle: document.getElementById("graphCollapseToggle"),
  graphPanelBody: document.getElementById("graphPanelBody")
};

function waitForVendorLibraries() {
  const cytoscapeReady = typeof window !== "undefined" && typeof window.cytoscape === "function";
  const dagreReady = typeof window !== "undefined" && (typeof window.dagre !== "undefined" || typeof window.cytoscapeDagre !== "undefined");

  if (cytoscapeReady && dagreReady) {
    init();
    return;
  }

  window.setTimeout(waitForVendorLibraries, 150);
}

waitForVendorLibraries();

function normalizeEggGroupToken(rawGroup) {
  const token = String(rawGroup || "").trim().toLowerCase();
  const map = {
    "bug": "Bug",
    "cannot breed": "Undiscovered",
    "chaos": "Chaos",
    "ditto": "Ditto",
    "dragon": "Dragon",
    "fairy": "Fairy",
    "field": "Field",
    "flying": "Flying",
    "genderless": "Genderless",
    "humanoid": "Humanoid",
    "mineral": "Mineral",
    "monster": "Monster",
    "plant": "Plant",
    "water a": "Water A",
    "water b": "Water B",
    "water c": "Water C"
  };

  return map[token] || (token ? token.charAt(0).toUpperCase() + token.slice(1) : "");
}

function normalizeGenderRate(rawRate) {
  if (!Number.isFinite(rawRate)) {
    return 4;
  }

  if (rawRate === 255) {
    return -1;
  }

  if (rawRate === 254) {
    return 8;
  }


  const femaleRate = Math.max(0, Math.min(1, (rawRate + 1) / 256));
  return Math.max(0, Math.min(8, Math.round(femaleRate * 8)));
}

function normalizeSpeciesApiKey(rawName) {
  return String(rawName || "")
    .trim()
    .toLowerCase()
    .replace(/♀|â™€/g, "-f")
    .replace(/♂|â™‚/g, "-m")
    .replace(/[.'’]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function buildEvolutionFamiliesFromGenderAwareRows(rows) {
  const families = {};
  for (const row of rows || []) {
    const speciesApiName = normalizeSpeciesApiKey(row?.name || "");
    const familyApiName = normalizeSpeciesApiKey(row?.family_base_species?.name || "");
    if (!speciesApiName || !familyApiName) {
      continue;
    }
    families[speciesApiName] = familyApiName;
  }
  return families;
}

function getSpeciesLineLabelFromFamilyApiName(familyApiName, fallbackSpecies = "") {
  const normalizedFamilyApiName = normalizeSpeciesApiKey(familyApiName || "");
  if (normalizedFamilyApiName) {
    const entry = state.speciesByApi.get(normalizedFamilyApiName);
    const displayName = String(entry?.displayName || "").trim();
    if (displayName) {
      return `Línea de ${displayName}`;
    }
  }

  const fallback = String(fallbackSpecies || "").trim();
  return fallback ? `Línea de ${fallback}` : "Línea de especie";
}

function getSpeciesLineLabelForSpecies(speciesName = "") {
  const speciesEntry = state.speciesByDisplay.get(normalize(speciesName || ""));
  const speciesApiName = speciesEntry?.apiName || "";
  const familyApiName = speciesApiName ? state.evolutionFamilies?.[speciesApiName] : "";
  return getSpeciesLineLabelFromFamilyApiName(familyApiName, speciesEntry?.displayName || speciesName);
}

// -----------------------------------------------------------------------------
// Carga del catálogo oficial de especies.
// El JSON se usa para armar la metadata de cada Pokémon: grupos huevo,
// proporción de género, evolución y otros datos necesarios para el plan.
// -----------------------------------------------------------------------------
function normalizeSpeciesRow(row) {
  const apiName = normalizeSpeciesApiKey(row.apiName || row.name || "");
  const displayName = String(row.displayName || row.name || "").trim();
  const rawEggGroups = Array.isArray(row.eggGroups) ? row.eggGroups : (Array.isArray(row.egg_groups) ? row.egg_groups : []);
  const eggGroups = rawEggGroups.map((group) => normalizeEggGroupToken(group)).filter(Boolean);
  const rawGenderRate = typeof row.genderRate === "number" ? row.genderRate : row.gender_ratio;
  const genderRate = normalizeGenderRate(rawGenderRate);

  return {
    id: row.id,
    apiName,
    displayName: displayName || apiName,
    eggGroups,
    genderRate,
    genderProfile: parseGenderProfile(genderRate)
  };
}

function isNotBreedableSpeciesName(name = "") {
  const banned = new Set([
    "Articuno",
    "Zapdos",
    "Moltres",
    "Mew",
    "Mewtwo",
    "Raikou",
    "Entei",
    "Suicune",
    "Uxie",
    "Mesprit",
    "Azelf",
    "Cobalion",
    "Terrakion",
    "Virizion",
    "Tornadus",
    "Lugia",
    "Ho-Oh",
    "Celebi",
    "Dialga",
    "Palkia",
    "Giratina",
    "Darkrai",
    "Shaymin",
    "Arceus",
    "Victini",
    "Keldeo",
    "Meloetta",
    "Genesect",
    "Kyurem",
    "Landorus",
    "Thundurus",
    "Tornadus",
    "Reshiram",
    "Zekrom",
    "Kyurem"
  ]);

  return banned.has(String(name || "").trim());
}

// Alias removido para evitar duplicación: la lógica canonical está en
// `normalizeSpeciesRow` y `loadSpeciesCatalogData`.
async function loadSpeciesCatalogData() {
  const relativePath = "data/gender_aware_evolution_species_list.json";
  const candidates = new Set();

  const baseCandidates = [
    window.location.href,
    document.baseURI || window.location.href,
    `${window.location.origin}${window.location.pathname}`,
    `${window.location.origin}${window.location.pathname.replace(/index\.html?$/, "")}`,
    `${window.location.origin}${window.location.pathname.replace(/\/+$/, "")}/`
  ];

  for (const base of baseCandidates) {
    try {
      candidates.add(new URL(relativePath, base).href);
      candidates.add(new URL(`./${relativePath}`, base).href);
    } catch (error) {
      // ignorar bases inválidas
    }
  }

  const pathnameParts = (window.location.pathname || "/").split("/").filter(Boolean);
  for (let i = 0; i < pathnameParts.length; i++) {
    const repoPath = pathnameParts.slice(0, i + 1).join("/");
    candidates.add(`${window.location.origin}/${repoPath}/data/gender_aware_evolution_species_list.json`);
    candidates.add(`${window.location.origin}/${repoPath}/Crianza/data/gender_aware_evolution_species_list.json`);
  }

  candidates.add(`${window.location.origin}/data/gender_aware_evolution_species_list.json`);
  candidates.add(`${window.location.origin}/Crianza/data/gender_aware_evolution_species_list.json`);
  candidates.add(new URL(relativePath, `${window.location.origin}/`).href);

  for (const url of candidates) {
    try {
      const response = await fetch(url, { cache: "no-store" });
      if (response.ok) {
        return await response.json();
      }
    } catch (error) {
      // probar la siguiente candidata
    }
  }

  return null;
}

async function init() {
  const persistedSettings = loadPersistedSettings();
  const persistedTargets = loadPersistedTargets();
  const persistedInventory = loadPersistedInventory();
  const persistedBuyChecklist = loadPersistedBuyChecklist();

  state.costConfig.maleEggGroupPrices = createDefaultMaleEggGroupPrices(DEFAULT_MALE_EGG_GROUPS);
  state.costConfig.maleTwoperfectivsEggGroupPrices = createDefaultMaleTwoperfectivsEggGroupPrices(DEFAULT_MALE_EGG_GROUPS);
  state.costConfig.twoperfectivsSupport = persistedSettings?.twoperfectivsSupport ?? loadTwoperfectivsSupportSetting();
  state.inventoryEnabled = persistedSettings?.inventoryEnabled ?? true;
  state.buyChecklist.budget = Number.isFinite(persistedBuyChecklist?.budget) ? Math.max(0, persistedBuyChecklist.budget) : 0;
  state.buyChecklist.checkedById = persistedBuyChecklist?.checkedById && typeof persistedBuyChecklist.checkedById === "object"
    ? { ...persistedBuyChecklist.checkedById }
    : {};
  state.mobileQuickMode = loadMobileQuickModeSetting();
  initTheme();
  hydrateSelect(el.natureInput, NATURES);
  hydrateSelect(el.inventoryNatureInput, NATURES);
  hydrateIvChecklist();
  hydrateIvChecklist(el.inventoryIvChecklist);
  renderMaleEggGroupCostInputs(DEFAULT_MALE_EGG_GROUPS);
  applyPersistedSettingsToUi(persistedSettings);
  state.costConfig = { ...state.costConfig, ...readCostConfig() };
  syncTwoperfectivsSupportUi();
  syncInventoryUi();
  bindPanelSummaryActionGuards();

  el.speciesInput.addEventListener("input", onSpeciesInputChanged);
  el.speciesInput.addEventListener("change", onSpeciesInputChanged);
  el.speciesInput.addEventListener("blur", () => {
    window.setTimeout(() => hideSpeciesSuggestions(), 120);
    onSpeciesInputChanged();
  });
  document.addEventListener("click", (event) => {
    const target = event.target;
    const isInsideSpeciesControl = target && (
      target === el.speciesInput ||
      target.closest(".species-suggestion") ||
      target.closest("#speciesSuggestions")
    );

    if (!isInsideSpeciesControl) {
      hideSpeciesSuggestions();
    }
  });
  el.addTargetBtn.addEventListener("click", addTargetFromForm);
  el.importTargetsBtn.addEventListener("click", () => el.targetImportInput.click());
  el.exportTargetsBtn.addEventListener("click", exportTargetsToJson);
  el.targetImportInput.addEventListener("change", importTargetsFromJson);
  el.clearTargetsBtn.addEventListener("click", clearTargets);
  el.recalcCostsBtn.addEventListener("click", refreshCostsAfterInput);
  el.themeToggle.addEventListener("click", toggleTheme);
  el.settingsToggle.addEventListener("click", () => setSettingsSidebarOpen(true));
  el.mobileQuickModeToggle?.addEventListener("click", toggleMobileQuickMode);
  el.settingsClose.addEventListener("click", () => setSettingsSidebarOpen(false));
  el.settingsBackdrop.addEventListener("click", () => setSettingsSidebarOpen(false));
  el.twoperfectivsSupportInput.addEventListener("change", onTwoperfectivsSupportChanged);
  el.inventoryEnabledInput.addEventListener("change", onInventoryEnabledChanged);
  el.costBraceInput.addEventListener("input", persistSettingsFromUi);
  el.costEverstoneInput.addEventListener("input", persistSettingsFromUi);
  el.maleEggGroupCosts.addEventListener("input", persistSettingsFromUi);
  el.twoperfectivsEggGroupCosts.addEventListener("input", persistSettingsFromUi);
  el.importCostsBtn.addEventListener("click", () => el.costsImportInput.click());
  el.exportCostsBtn.addEventListener("click", exportCostsToJson);
  el.costsImportInput.addEventListener("change", importCostsFromJson);
  el.generatePlanBtn.addEventListener("click", onGeneratePlanRequested);
  el.generatePlanProfile?.addEventListener("change", onGeneratePlanProfileChanged);
  el.addInventoryBtn.addEventListener("click", addInventoryFromForm);
  el.importInventoryBtn.addEventListener("click", openInventoryImportModal);
  el.exportInventoryBtn.addEventListener("click", exportInventoryToJson);
  el.inventoryImportInput.addEventListener("change", importInventoryFromJson);
  el.inventoryPokeMMOImportInput.addEventListener("change", importInventoryFromPokeMMO);
  el.clearInventoryBtn.addEventListener("click", clearInventory);
  el.graphTargetSelect.addEventListener("change", renderSelectedGraph);
  el.graphCollapseToggle.addEventListener("click", toggleGraphCollapsed);
  el.shoppingChecklistToggleBtn?.addEventListener("click", toggleShoppingChecklistView);
  el.buyChecklistBudgetInput?.addEventListener("input", onBuyChecklistBudgetChanged);
  el.buyChecklistList?.addEventListener("change", onBuyChecklistItemToggled);
  el.clearBuyChecklistBtn?.addEventListener("click", clearBuyChecklistChecks);
  el.compareLeftProfile?.addEventListener("change", onPlanCompareModeChanged);
  el.compareRightProfile?.addEventListener("change", onPlanCompareModeChanged);
  el.planCompareOutput?.addEventListener("click", onPlanCompareUseThisClick);

  renderTargets();

  function bindPanelSummaryActionGuards() {
    document.querySelectorAll(".panel-summary-actions").forEach((actions) => {
      actions.addEventListener("click", (event) => {
        event.stopPropagation();
      });

      actions.addEventListener("keydown", (event) => {
        event.stopPropagation();
      });
    });
  }

  renderInventoryList();
  renderAcquisitionPriorityList(new Map(), state.costConfig);
  renderShoppingList([]);
  renderBuyChecklist([], [], state.costConfig);
  renderItemNeedsList([], state.costConfig);
  renderPathAlternatives([], null, state.costConfig);
  renderPlanCompare([], null, state.costConfig);
  renderPlanExplanations([], null, state.costConfig);
  hydrateGeneratePlanProfiles();
  setMobileQuickMode(state.mobileQuickMode);
  renderInventorySummary({ consumedTotal: 0, uncoveredTotal: 0, parseErrors: [] });
  renderTotalCostSummary(0, 0, 0);
  hydrateGraphSelect([]);
  setGraphCollapsed(true);
  renderEmptyGraph("Agregá objetivos y generá un plan para ver el gráfico de crianza.");

  try {
    const genderAwareJson = await loadSpeciesCatalogData();
    if (!genderAwareJson) {
      throw new Error("Failed to load species data");
    }

    const genderAwareRows = Array.isArray(genderAwareJson?.species) ? genderAwareJson.species : [];

    state.speciesCatalog = genderAwareRows
      .map((row) => normalizeSpeciesRow(row))
      .filter((row) => {
        if (!row.apiName || !row.displayName || row.eggGroups.length === 0) {
          return false;
        }

        const hasUndiscoveredGroup = row.eggGroups.includes("Undiscovered");
        const isBanned = isNotBreedableSpeciesName(row.displayName);
        return !hasUndiscoveredGroup && !isBanned;
      });

    state.speciesByDisplay.clear();
    state.speciesByApi.clear();

    if (el.speciesInput) {
      el.speciesInput.innerHTML = "";
      const defaultOption = document.createElement("option");
      defaultOption.value = "";
      defaultOption.textContent = "Elegí una especie";
      el.speciesInput.appendChild(defaultOption);

      const sortedSpecies = [...state.speciesCatalog].sort((a, b) =>
        String(a.displayName || "").localeCompare(String(b.displayName || ""), "es", { sensitivity: "base" })
      );

      for (const mon of sortedSpecies) {
        const option = document.createElement("option");
        option.value = mon.displayName;
        option.textContent = mon.displayName;
        el.speciesInput.appendChild(option);
        state.speciesByDisplay.set(normalize(mon.displayName), mon);
        state.speciesByApi.set(mon.apiName, mon);
      }
    }

    state.genderAwareSpeciesByName.clear();
    for (const row of genderAwareRows) {
      const normalizedName = normalize(row?.name || "");
      if (!normalizedName) {
        continue;
      }
      state.genderAwareSpeciesByName.set(normalizedName, row);
    }
    state.evolutionFamilies = buildEvolutionFamiliesFromGenderAwareRows(genderAwareRows);

    const discoveredGroups = collectKnownMaleEggGroups(state.speciesCatalog);
    state.knownMaleEggGroups = discoveredGroups;
    renderMaleEggGroupCostInputs(discoveredGroups);
    applyPersistedSettingsToUi(persistedSettings);
    state.costConfig = { ...state.costConfig, ...readCostConfig() };
    syncTwoperfectivsSupportUi();

    state.targets = hydrateTargets(persistedTargets);
    state.inventory = hydrateInventory(persistedInventory);
    renderTargets();
    renderInventoryList();
    renderInventorySummary({ consumedTotal: 0, uncoveredTotal: 0, parseErrors: [] });
    if (state.targets.length > 0) {
      generatePlan();
    }

    el.speciesMeta.className = "species-meta";
    el.speciesMeta.textContent = `Se cargaron ${state.speciesCatalog.length} Pokémon. Elegí una especie para cargar automáticamente sus grupos huevo y proporción de género.`;
  } catch (error) {
    el.speciesMeta.className = "species-meta";

    if (window.location.protocol === "file:") {
      el.speciesMeta.textContent = "Abrí esta página desde un servidor local (por ejemplo: http://localhost:8000) para cargar el catálogo de especies y que aparezcan las sugerencias.";
      return;
    }

    el.speciesMeta.textContent = "No se pudo cargar el catálogo oficial de especies. Verificá que exista data/gender_aware_evolution_species_list.json.";
  }
}

function onPlanCompareModeChanged() {
  if (el.compareLeftProfile?.value) {
    state.compareMode.left = el.compareLeftProfile.value;
  }
  if (el.compareRightProfile?.value) {
    state.compareMode.right = el.compareRightProfile.value;
  }

  renderPlanCompare(state.latestGeneratedPlans || [], state.latestFinalizedAllocation, state.costConfig);
}

function hydrateGeneratePlanProfiles() {
  if (!el.generatePlanProfile) {
    return;
  }

  const options = [
    { value: "current_optimized", label: "Usar Inventario (Balanceado)" },
    { value: "cheapest", label: "Costo Más Bajo (Auto)" },
    { value: "ignore_inventory", label: "Ignorar Inventario" }
  ];

  const selected = state.appliedPlanProfile || "current_optimized";
  el.generatePlanProfile.innerHTML = "";
  for (const optionMeta of options) {
    const option = document.createElement("option");
    option.value = optionMeta.value;
    option.textContent = optionMeta.label;
    el.generatePlanProfile.appendChild(option);
  }

  if (options.some((optionMeta) => optionMeta.value === selected)) {
    el.generatePlanProfile.value = selected;
  } else {
    el.generatePlanProfile.value = "current_optimized";
  }
}

function onGeneratePlanProfileChanged() {
  if (el.generatePlanProfile?.value) {
    state.appliedPlanProfile = el.generatePlanProfile.value;
  }
}

function onGeneratePlanRequested() {
  const selectedProfile = el.generatePlanProfile?.value || state.appliedPlanProfile || "current_optimized";
  applyPlanProfile(selectedProfile);
}

function onPlanCompareUseThisClick(event) {
  const button = event.target?.closest?.("[data-use-profile]");
  if (!button) {
    return;
  }

  const profileKey = button.dataset.useProfile;
  if (!profileKey) {
    return;
  }

  applyPlanProfile(profileKey);
}

function applyPlanProfile(profileKey) {
  const normalized = String(profileKey || "").trim();
  if (!normalized) {
    return;
  }

  state.appliedPlanProfile = normalized;

  if (el.generatePlanProfile && Array.from(el.generatePlanProfile.options).some((option) => option.value === normalized)) {
    el.generatePlanProfile.value = normalized;
  }

  let enableInventory = true;
  if (normalized === "ignore_inventory") {
    enableInventory = false;
  } else if (normalized === "cheapest") {
    const cheapestProfile = (state.latestCompareProfiles || []).find((profile) => profile.key === "cheapest");
    enableInventory = (cheapestProfile?.executableProfileKey || "current_optimized") !== "ignore_inventory";
  }

  if (el.inventoryEnabledInput) {
    el.inventoryEnabledInput.checked = enableInventory;
  }
  onInventoryEnabledChanged();
}

function loadPersistedBuyChecklist() {
  try {
    const raw = localStorage.getItem(BUY_CHECKLIST_STORAGE_KEY);
    if (!raw) {
      return { budget: 0, checkedById: {} };
    }

    const parsed = JSON.parse(raw);
    const budget = Number.isFinite(parsed?.budget) ? Math.max(0, Number(parsed.budget)) : 0;
    const checkedById = parsed?.checkedById && typeof parsed.checkedById === "object"
      ? parsed.checkedById
      : {};
    return { budget, checkedById };
  } catch {
    return { budget: 0, checkedById: {} };
  }
}

function persistBuyChecklist() {
  localStorage.setItem(BUY_CHECKLIST_STORAGE_KEY, JSON.stringify(state.buyChecklist));
}

function onBuyChecklistBudgetChanged() {
  const budget = parseNumber(el.buyChecklistBudgetInput?.value, 0);
  state.buyChecklist.budget = Math.max(0, budget);
  persistBuyChecklist();
  if (state.targets.length > 0) {
    generatePlan();
  } else {
    renderBuyChecklist([], [], state.costConfig);
  }
}

function onBuyChecklistItemToggled(event) {
  const target = event.target;
  if (!target || target.type !== "checkbox" || !target.dataset.checkId) {
    return;
  }

  state.buyChecklist.checkedById[target.dataset.checkId] = Boolean(target.checked);
  persistBuyChecklist();

  if (state.targets.length > 0) {
    generatePlan();
  } else {
    renderBuyChecklist([], [], state.costConfig);
  }
}

function clearBuyChecklistChecks() {
  state.buyChecklist.checkedById = {};
  persistBuyChecklist();

  if (state.targets.length > 0) {
    generatePlan();
  } else {
    renderBuyChecklist([], [], state.costConfig);
  }
}

function setShoppingChecklistView(mode) {
  const isBuyChecklist = mode === "buy";

  if (el.shoppingListView) {
    el.shoppingListView.hidden = isBuyChecklist;
  }

  if (el.buyChecklistView) {
    el.buyChecklistView.hidden = !isBuyChecklist;
  }

  if (el.shoppingChecklistTitle) {
    el.shoppingChecklistTitle.textContent = isBuyChecklist ? "Lista de Compra" : "Lista de Compras";
  }

  if (el.shoppingChecklistToggleBtn) {
    el.shoppingChecklistToggleBtn.textContent = isBuyChecklist
      ? "Cambiar a Lista de Compras"
      : "Cambiar a Lista de Compra";
  }
}

function loadMobileQuickModeSetting() {
  try {
    return localStorage.getItem(MOBILE_QUICK_MODE_STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

function persistMobileQuickModeSetting(enabled) {
  try {
    localStorage.setItem(MOBILE_QUICK_MODE_STORAGE_KEY, enabled ? "1" : "0");
  } catch {

  }
}

function setMobileQuickMode(enabled) {
  state.mobileQuickMode = Boolean(enabled);
  document.body.classList.toggle("mobile-quick-mode", state.mobileQuickMode);

  if (el.mobileQuickModeToggle) {
    el.mobileQuickModeToggle.textContent = state.mobileQuickMode
      ? "Desactivar Modo Rápido"
      : "Activar Modo Rápido";
  }

  if (state.mobileQuickMode) {
    setShoppingChecklistView("buy");
    setGraphCollapsed(true);
  } else {
    setShoppingChecklistView("shopping");
  }
}

function toggleMobileQuickMode() {
  setMobileQuickMode(!state.mobileQuickMode);
  persistMobileQuickModeSetting(state.mobileQuickMode);
}

function toggleShoppingChecklistView() {
  const currentlyBuy = Boolean(el.buyChecklistView && !el.buyChecklistView.hidden);
  setShoppingChecklistView(currentlyBuy ? "shopping" : "buy");
}

function generarNieve(){
  const copos = "❄❅❆•";
  const cantidad = 30;
  for(let i=0;i<cantidad;i++){
    const copo = document.createElement("span");
    copo.className = "nieve";
    copo.textContent = copos[Math.floor(Math.random()*copos.length)];
    const tam = 10 + Math.random()*16;
    copo.style.left = Math.random()*100 + "vw";
    copo.style.fontSize = tam + "px";
    copo.style.opacity = 0.35 + Math.random()*0.5;
    copo.style.setProperty("--deriva", (Math.random()*80-40)+"px");
    const duracion = 9 + Math.random()*10;
    copo.style.animationDuration = duracion + "s";
    copo.style.animationDelay = (Math.random()*duracion) + "s";
    document.body.appendChild(copo);
  }
}
document.addEventListener("DOMContentLoaded", generarNieve);

