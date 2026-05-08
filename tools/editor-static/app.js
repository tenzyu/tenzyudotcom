const state = {
  workspaceRoot: "",
  projects: [],
  project: null,
  files: { project: [], projectGrouped: [], sources: [], scopes: [] },
  scope: "std",
  category: "",
  selectedSourceId: "",
  selectedGroups: new Set(),
  editingFile: null,
  pendingConflicts: []
};

const $ = (id) => document.getElementById(id);

function toast(message, isError = false) {
  const node = $("toast");
  node.textContent = message;
  node.style.borderColor = isError ? "#b95c5c" : "#4e9f82";
  node.style.background = isError ? "#3d1d1d" : "#173127";
  node.classList.remove("hidden");
  window.setTimeout(() => node.classList.add("hidden"), 4200);
}

async function api(path, options = {}) {
  const response = await fetch(path, {
    headers: options.body instanceof FormData ? undefined : { "content-type": "application/json" },
    ...options
  });
  if (!response.ok) {
    let message = `${response.status} ${response.statusText}`;
    try {
      const data = await response.json();
      message = data.error || message;
    } catch {}
    throw new Error(message);
  }
  const type = response.headers.get("content-type") || "";
  return type.includes("application/json") ? response.json() : response.text();
}

function label(value) {
  return value.split("-").map((part) => part[0]?.toUpperCase() + part.slice(1)).join(" ");
}

function currentSource() {
  return state.files.sources.find((source) => source.id === state.selectedSourceId) || null;
}

function sourceKey(sourceId, group) {
  return `${sourceId}:${group.scope}:${group.category}:${group.groupKey}`;
}

function nodeFor(grouped, scopeName = state.scope, categoryName = state.category) {
  const scope = grouped.find((entry) => entry.scope === scopeName);
  if (!scope) return { categories: [], groups: [] };
  if (!categoryName) return { categories: scope.categories, groups: [] };
  const category = scope.categories.find((entry) => entry.category === categoryName);
  return { categories: scope.categories, groups: category?.groups || [] };
}

function visibleGroups(grouped, filterId) {
  const filter = $(filterId).value.trim().toLowerCase();
  return nodeFor(grouped).groups.filter((group) => {
    if (!filter) return true;
    return `${group.groupLabel} ${group.groupKey} ${group.files.map((file) => file.flatPath).join(" ")}`.toLowerCase().includes(filter);
  });
}

function firstAvailableScope() {
  return state.files.scopes.find((scope) =>
    nodeFor(state.files.projectGrouped, scope).categories.length ||
    state.files.sources.some((source) => nodeFor(source.grouped, scope).categories.length)
  ) || state.files.scopes[0] || "std";
}

function ensureSelectionModel() {
  if (!state.files.scopes.includes(state.scope)) state.scope = firstAvailableScope();
  const categories = [
    ...nodeFor(state.files.projectGrouped, state.scope, "").categories,
    ...(currentSource() ? nodeFor(currentSource().grouped, state.scope, "").categories : [])
  ];
  if (!state.category || !categories.some((entry) => entry.category === state.category)) {
    state.category = categories[0]?.category || "";
  }
}

function renderProjects() {
  const select = $("projectSelect");
  select.replaceChildren();
  for (const project of state.projects) {
    const option = document.createElement("option");
    option.value = project.id;
    option.textContent = project.name;
    select.append(option);
  }
  if (state.project) select.value = state.project.id;
}

function renderSources() {
  const select = $("sourceSelect");
  select.replaceChildren();
  for (const source of state.files.sources || []) {
    const option = document.createElement("option");
    option.value = source.id;
    option.textContent = source.name;
    select.append(option);
  }
  if (!state.selectedSourceId && state.files.sources?.[0]) state.selectedSourceId = state.files.sources[0].id;
  select.value = state.selectedSourceId;

  const list = $("sourceList");
  list.replaceChildren();
  for (const source of state.files.sources || []) {
    const row = document.createElement("div");
    row.className = "sourceRow";
    row.innerHTML = `<div><strong>${source.name}</strong><div class="muted">${source.sourcePath}</div></div>`;
    const del = document.createElement("button");
    del.textContent = "Delete";
    del.onclick = async () => {
      try {
        await api(`/api/projects/${encodeURIComponent(state.project.id)}/sources/${encodeURIComponent(source.id)}`, { method: "DELETE" });
        toast("Asset source deleted.");
        await loadProject(state.project.id);
      } catch (error) {
        toast(error.message, true);
      }
    };
    row.append(del);
    list.append(row);
  }
  if (!list.children.length) list.textContent = "No asset sources.";
}

function renderScopeTabs() {
  const tabs = $("scopeTabs");
  tabs.replaceChildren();
  for (const scope of state.files.scopes || []) {
    const count = nodeFor(state.files.projectGrouped, scope).categories.length +
      state.files.sources.reduce((total, source) => total + nodeFor(source.grouped, scope).categories.length, 0);
    if (!count) continue;
    const button = document.createElement("button");
    button.className = `tab${scope === state.scope ? " active" : ""}`;
    button.textContent = label(scope);
    button.onclick = () => {
      state.scope = scope;
      state.category = "";
      ensureSelectionModel();
      render();
    };
    tabs.append(button);
  }
}

function renderCategoryTabs() {
  const tabs = $("categoryTabs");
  tabs.replaceChildren();
  const map = new Map();
  for (const category of nodeFor(state.files.projectGrouped, state.scope, "").categories) map.set(category.category, category.category);
  const source = currentSource();
  if (source) for (const category of nodeFor(source.grouped, state.scope, "").categories) map.set(category.category, category.category);
  for (const category of [...map.keys()].sort()) {
    const button = document.createElement("button");
    button.className = `tab${category === state.category ? " active" : ""}`;
    button.textContent = label(category);
    button.onclick = () => {
      state.category = category;
      render();
    };
    tabs.append(button);
  }
}

function renderProjectHeader() {
  $("projectTitle").textContent = state.project ? state.project.name : "No project loaded";
  $("projectMeta").textContent = state.project
    ? `${state.project.id} · ${state.files.project.length} files · ${state.files.sources.length} asset sources`
    : "Import a main skin to start.";
}

function previewNode(group) {
  const preview = document.createElement("div");
  preview.className = "thumb";
  const files = [...group.files].sort((a, b) => (a.sequenceIndex ?? 999999) - (b.sequenceIndex ?? 999999));
  const imageFiles = files.filter((file) => file.kind === "image");
  if (imageFiles.length) {
    const image = document.createElement("img");
    image.src = imageFiles[0].url;
    image.alt = group.groupLabel;
    if (imageFiles.length > 1) {
      let frame = 0;
      window.setInterval(() => {
        if (!document.body.contains(image)) return;
        frame = (frame + 1) % imageFiles.length;
        image.src = imageFiles[frame].url;
      }, 240);
    }
    preview.append(image);
    return preview;
  }
  const audio = files.find((file) => file.kind === "audio");
  if (audio) {
    const player = document.createElement("audio");
    player.controls = true;
    player.src = audio.url;
    preview.append(player);
    return preview;
  }
  preview.textContent = files[0]?.kind?.toUpperCase() || "FILE";
  return preview;
}

function makeGroupCard(group, side, sourceId = "") {
  const key = sourceKey(sourceId, group);
  const card = document.createElement("div");
  card.className = `groupCard${state.selectedGroups.has(key) ? " selected" : ""}`;
  card.append(previewNode(group));

  const info = document.createElement("div");
  info.className = "groupInfo";
  info.innerHTML = `<strong>${group.groupLabel}</strong><div class="muted">${label(group.category)} · ${group.files.length} file${group.files.length === 1 ? "" : "s"}</div>`;
  card.append(info);

  const files = document.createElement("div");
  files.className = "fileChips";
  for (const file of group.files.slice(0, 4)) {
    const chip = document.createElement("span");
    chip.textContent = file.name;
    files.append(chip);
  }
  if (group.files.length > 4) {
    const more = document.createElement("span");
    more.textContent = `+${group.files.length - 4}`;
    files.append(more);
  }
  card.append(files);

  const actions = document.createElement("div");
  actions.className = "cardActions";
  const textFile = group.files.find((file) => file.kind === "text");
  if (textFile && side === "project") {
    const edit = document.createElement("button");
    edit.textContent = "Edit";
    edit.onclick = (event) => {
      event.stopPropagation();
      openTextEditor(textFile);
    };
    actions.append(edit);
  }
  if (side === "project") {
    const del = document.createElement("button");
    del.textContent = "Delete";
    del.onclick = async (event) => {
      event.stopPropagation();
      try {
        for (const file of group.files) {
          await api(`/api/projects/${encodeURIComponent(state.project.id)}/file?path=${encodeURIComponent(file.path)}`, { method: "DELETE" });
        }
        toast("Project files deleted.");
        await loadProject(state.project.id);
      } catch (error) {
        toast(error.message, true);
      }
    };
    actions.append(del);
  }
  card.append(actions);

  if (side === "source") {
    card.onclick = () => {
      if (state.selectedGroups.has(key)) state.selectedGroups.delete(key);
      else state.selectedGroups.add(key);
      renderGroupLists();
    };
  }
  return card;
}

function renderGroupLists() {
  const projectGroups = $("projectGroups");
  projectGroups.replaceChildren();
  const projectVisible = visibleGroups(state.files.projectGrouped, "projectFilter");
  $("projectCategoryMeta").textContent = `${label(state.scope)} / ${label(state.category || "none")} · ${projectVisible.length} groups`;
  for (const group of projectVisible) projectGroups.append(makeGroupCard(group, "project"));
  if (!projectGroups.children.length) projectGroups.textContent = "No project groups here.";

  const sourceGroups = $("sourceGroups");
  sourceGroups.replaceChildren();
  const source = currentSource();
  const sourceVisible = source ? visibleGroups(source.grouped, "sourceFilter") : [];
  $("sourceCategoryMeta").textContent = source ? `${source.name} · ${sourceVisible.length} groups` : "No source selected";
  for (const group of sourceVisible) sourceGroups.append(makeGroupCard(group, "source", source.id));
  if (!sourceGroups.children.length) sourceGroups.textContent = source ? "No source groups here." : "Add an asset source.";
}

function render() {
  ensureSelectionModel();
  renderProjects();
  renderSources();
  renderProjectHeader();
  renderScopeTabs();
  renderCategoryTabs();
  renderGroupLists();
}

async function loadHealth() {
  const health = await api("/api/health");
  state.workspaceRoot = health.workspaceRoot;
  $("workspace").textContent = health.workspaceRoot;
}

async function loadProjects() {
  state.projects = await api("/api/projects");
  if (!state.project && state.projects[0]) await loadProject(state.projects[0].id);
  else render();
}

async function loadProject(projectId) {
  if (!projectId) return;
  state.project = await api(`/api/projects/${encodeURIComponent(projectId)}`);
  state.files = await api(`/api/projects/${encodeURIComponent(projectId)}/files`);
  if (!state.files.sources.find((source) => source.id === state.selectedSourceId)) {
    state.selectedSourceId = state.files.sources[0]?.id || "";
  }
  state.selectedGroups.clear();
  ensureSelectionModel();
  render();
}

function parseIni(content) {
  const fields = {};
  let section = "";
  for (const line of content.split(/\r?\n/)) {
    const sectionMatch = line.match(/^\s*\[([^\]]+)]\s*$/);
    if (sectionMatch) {
      section = sectionMatch[1];
      continue;
    }
    const pair = line.match(/^\s*([^:#;][^:]*):\s*(.*?)\s*$/);
    if (pair) fields[`${section}.${pair[1].trim()}`] = pair[2];
  }
  return fields;
}

function updateIni(content, updates) {
  const seen = new Set();
  let section = "";
  const lines = content.split(/\r?\n/).map((line) => {
    const sectionMatch = line.match(/^\s*\[([^\]]+)]\s*$/);
    if (sectionMatch) {
      section = sectionMatch[1];
      return line;
    }
    const pair = line.match(/^(\s*)([^:#;][^:]*):(\s*)(.*?)\s*$/);
    if (!pair) return line;
    const key = `${section}.${pair[2].trim()}`;
    if (!(key in updates)) return line;
    seen.add(key);
    return `${pair[1]}${pair[2]}:${pair[3]}${updates[key]}`;
  });
  for (const [key, value] of Object.entries(updates)) {
    if (seen.has(key) || value === "") continue;
    const [targetSection, targetKey] = key.split(".");
    const index = lines.findIndex((line) => line.trim() === `[${targetSection}]`);
    if (index >= 0) lines.splice(index + 1, 0, `${targetKey}: ${value}`);
  }
  return lines.join("\n");
}

function setJsonPath(root, segments, value) {
  let target = root;
  for (const segment of segments.slice(0, -1)) target = target[segment];
  target[segments.at(-1)] = value;
}

function parseJsonInput(value) {
  const trimmed = value.trim();
  if (trimmed === "true") return true;
  if (trimmed === "false") return false;
  if (trimmed === "null") return null;
  if (trimmed !== "" && !Number.isNaN(Number(trimmed))) return Number(trimmed);
  return value;
}

function renderJsonForm(value, onChange, segments = []) {
  const container = document.createElement("div");
  container.className = "formGrid";
  if (!value || typeof value !== "object") return container;
  for (const [key, child] of Object.entries(value)) {
    const pathSegments = [...segments, key];
    if (child && typeof child === "object") {
      container.append(renderJsonForm(child, onChange, pathSegments));
      continue;
    }
    const wrapper = document.createElement("label");
    wrapper.textContent = pathSegments.join(".");
    const input = document.createElement("input");
    input.value = child === null ? "null" : String(child);
    input.oninput = () => onChange(pathSegments, parseJsonInput(input.value));
    wrapper.append(input);
    container.append(wrapper);
  }
  return container;
}

async function openTextEditor(file) {
  state.editingFile = file;
  $("textTitle").textContent = file.flatPath;
  $("textForm").replaceChildren();
  const content = await api(`/api/projects/${encodeURIComponent(state.project.id)}/file?scope=project&path=${encodeURIComponent(file.path)}`);
  const textarea = $("textEditor");
  textarea.value = content;

  if (file.flatPath.toLowerCase().endsWith("skin.ini")) {
    const fields = parseIni(content);
    const form = document.createElement("div");
    form.className = "formGrid";
    for (const [key, labelText] of [
      ["General.Name", "Name"],
      ["General.Author", "Author"],
      ["General.Version", "Version"],
      ["General.CursorRotate", "Cursor rotate"],
      ["Colours.Combo1", "Combo 1"],
      ["Colours.Combo2", "Combo 2"],
      ["Fonts.HitCircleOverlap", "Hit overlap"]
    ]) {
      const wrapper = document.createElement("label");
      wrapper.textContent = labelText;
      const input = document.createElement("input");
      input.value = fields[key] || "";
      input.oninput = () => {
        textarea.value = updateIni(textarea.value, { [key]: input.value });
      };
      wrapper.append(input);
      form.append(wrapper);
    }
    $("textForm").append(form);
  }

  if (file.flatPath.toLowerCase().endsWith(".json")) {
    try {
      const parsed = JSON.parse(content);
      $("textForm").append(renderJsonForm(parsed, (segments, value) => {
        setJsonPath(parsed, segments, value);
        textarea.value = JSON.stringify(parsed, null, 2);
      }));
    } catch (error) {
      toast(error.message, true);
    }
  }
  $("textOverlay").classList.remove("hidden");
}

function selectedMixItems() {
  const source = currentSource();
  if (!source) return [];
  const projectPaths = new Set(state.files.project.map((file) => file.path));
  const groups = [];
  for (const scope of source.grouped) {
    for (const category of scope.categories) {
      for (const group of category.groups) {
        if (state.selectedGroups.has(sourceKey(source.id, group))) groups.push(group);
      }
    }
  }
  return groups.map((group) => ({
    sourceId: source.id,
    paths: group.files.map((file) => file.path),
    action: "replace",
    conflict: group.files.some((file) => projectPaths.has(file.path)),
    label: group.groupLabel
  }));
}

function openConflictDialog(items) {
  state.pendingConflicts = items;
  const overlay = $("conflictOverlay");
  const list = $("conflictList");
  list.replaceChildren();
  for (const item of items) {
    const row = document.createElement("div");
    row.className = "conflictRow";
    const name = document.createElement("div");
    name.innerHTML = `<strong>${item.label}</strong><div class="muted">${item.paths.length} files${item.conflict ? " · conflicts" : ""}</div>`;
    const select = document.createElement("select");
    select.innerHTML = item.conflict
      ? `<option value="replace">Replace</option><option value="skip">Skip</option>`
      : `<option value="replace">Copy</option><option value="skip">Skip</option>`;
    select.onchange = () => {
      item.action = select.value;
    };
    row.append(name, select, document.createElement("div"));
    list.append(row);
  }
  overlay.classList.remove("hidden");
}

async function applyMix(items) {
  await api(`/api/projects/${encodeURIComponent(state.project.id)}/mix`, {
    method: "POST",
    body: JSON.stringify({ items })
  });
  toast("Assets copied.");
  await loadProject(state.project.id);
}

async function chooseSkin(targetInput, kind) {
  try {
    const result = await api(`/api/dialog/choose-skin?kind=${kind}`, { method: "POST", body: "{}" });
    if (result.path) $(targetInput).value = result.path;
  } catch (error) {
    toast("File dialog failed. Manual path still works.", true);
  }
}

async function initEvents() {
  $("toggleSidebar").onclick = () => document.body.classList.add("sidebarCollapsed");
  $("showSidebar").onclick = () => document.body.classList.remove("sidebarCollapsed");

  $("chooseMainFile").onclick = () => chooseSkin("mainPath", "file");
  $("chooseMainFolder").onclick = () => chooseSkin("mainPath", "directory");
  $("chooseAssetFile").onclick = () => chooseSkin("assetPath", "file");
  $("chooseAssetFolder").onclick = () => chooseSkin("assetPath", "directory");

  $("importMain").onclick = async () => {
    try {
      state.project = await api("/api/projects/import-main", {
        method: "POST",
        body: JSON.stringify({ sourcePath: $("mainPath").value, name: $("projectName").value })
      });
      toast("Main skin imported.");
      await loadProjects();
      await loadProject(state.project.id);
    } catch (error) {
      toast(error.message, true);
    }
  };

  $("refreshProjects").onclick = loadProjects;
  $("projectSelect").onchange = (event) => loadProject(event.target.value);
  $("sourceSelect").onchange = (event) => {
    state.selectedSourceId = event.target.value;
    state.selectedGroups.clear();
    render();
  };
  $("projectFilter").oninput = renderGroupLists;
  $("sourceFilter").oninput = renderGroupLists;

  $("importAsset").onclick = async () => {
    if (!state.project) return toast("Import a main skin first.", true);
    try {
      await api(`/api/projects/${encodeURIComponent(state.project.id)}/import-assets`, {
        method: "POST",
        body: JSON.stringify({ sourcePath: $("assetPath").value, name: $("assetName").value })
      });
      toast("Asset source imported.");
      await loadProject(state.project.id);
    } catch (error) {
      toast(error.message, true);
    }
  };

  $("selectCategory").onclick = () => {
    const source = currentSource();
    if (!source) return;
    for (const group of visibleGroups(source.grouped, "sourceFilter")) state.selectedGroups.add(sourceKey(source.id, group));
    renderGroupLists();
  };
  $("clearCategory").onclick = () => {
    const source = currentSource();
    if (!source) return;
    for (const group of visibleGroups(source.grouped, "sourceFilter")) state.selectedGroups.delete(sourceKey(source.id, group));
    renderGroupLists();
  };

  $("copySelected").onclick = async () => {
    const items = selectedMixItems();
    if (!items.length) return toast("Select source groups first.", true);
    if (items.some((item) => item.conflict)) openConflictDialog(items);
    else await applyMix(items);
  };

  $("closeConflicts").onclick = () => $("conflictOverlay").classList.add("hidden");
  $("applyConflicts").onclick = async () => {
    $("conflictOverlay").classList.add("hidden");
    try {
      await applyMix(state.pendingConflicts);
    } catch (error) {
      toast(error.message, true);
    }
  };

  $("closeText").onclick = () => $("textOverlay").classList.add("hidden");
  $("saveText").onclick = async () => {
    if (!state.editingFile) return;
    try {
      await api(`/api/projects/${encodeURIComponent(state.project.id)}/file?path=${encodeURIComponent(state.editingFile.path)}`, {
        method: "PUT",
        body: JSON.stringify({ content: $("textEditor").value })
      });
      toast("Saved.");
      $("textOverlay").classList.add("hidden");
    } catch (error) {
      toast(error.message, true);
    }
  };

  $("exportProject").onclick = async () => {
    if (!state.project) return toast("Import a main skin first.", true);
    try {
      const result = await api(`/api/projects/${encodeURIComponent(state.project.id)}/export`, { method: "POST", body: "{}" });
      toast(`Exported: ${result.exports.flat} / ${result.exports.osk}`);
    } catch (error) {
      toast(error.message, true);
    }
  };
}

async function boot() {
  try {
    await initEvents();
    await loadHealth();
    await loadProjects();
  } catch (error) {
    toast(error.message, true);
  }
}

boot();
