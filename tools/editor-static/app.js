const state = {
  workspaceRoot: "",
  projects: [],
  project: null,
  files: { project: [], sources: [], scopes: [], matrix: { columns: [], rows: [] }, validation: { warnings: [], count: 0 } },
  scope: "std",
  category: "",
  selectedSourceId: "",
  selectedRows: new Set(),
  editingFile: null,
  pendingItems: []
};

const $ = (id) => document.getElementById(id);

function sortedFiles(cell) {
  return [...(cell.files || [])].sort((a, b) => (a.sequenceIndex ?? 999999) - (b.sequenceIndex ?? 999999));
}

function thumbnailPreview(cell, row) {
  const preview = document.createElement("div");
  preview.className = "miniPreview";
  const files = sortedFiles(cell);
  const imageFiles = files.filter((file) => file.kind === "image");
  if (imageFiles.length) {
    const image = document.createElement("img");
    image.src = imageFiles[0].url;
    image.alt = row.groupLabel;
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
  preview.textContent = cell.missing ? "Missing" : (files[0]?.kind || "file").toUpperCase();
  return preview;
}

function findImage(files, pattern) {
  return files.find((file) => file.kind === "image" && pattern.test(file.flatPath.toLowerCase()));
}

async function drawImage(ctx, file, x, y, width, height) {
  if (!file) return false;
  const image = new Image();
  image.src = file.url;
  await image.decode().catch(() => null);
  if (!image.naturalWidth) return false;
  ctx.drawImage(image, x, y, width, height);
  return true;
}

function canvasPreview(cell, row) {
  const preview = document.createElement("div");
  preview.className = "miniPreview";
  const files = sortedFiles(cell);
  if (cell.missing) {
    preview.textContent = "Missing";
    return preview;
  }
  if (files.some((file) => file.kind === "audio")) return thumbnailPreview(cell, row);
  const imageFiles = files.filter((file) => file.kind === "image");
  if (!imageFiles.length) return thumbnailPreview(cell, row);

  const canvas = document.createElement("canvas");
  canvas.width = 320;
  canvas.height = 180;
  preview.append(canvas);
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#101518";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const lower = `${row.scope}/${row.category}/${row.groupKey}`;
  void (async () => {
    if (lower.includes("hit-circle") || lower.includes("default-numbers")) {
      const circle = findImage(imageFiles, /hitcircle(@2x)?\.png|approachcircle/);
      const overlay = findImage(imageFiles, /hitcircleoverlay/);
      const number = findImage(imageFiles, /default-1/);
      await drawImage(ctx, circle ?? imageFiles[0], 92, 22, 136, 136);
      await drawImage(ctx, overlay, 92, 22, 136, 136);
      await drawImage(ctx, number, 138, 66, 44, 44);
      return;
    }
    if (row.scope === "mania") {
      ctx.fillStyle = "#20262b";
      ctx.fillRect(78, 12, 164, 156);
      for (let i = 0; i < 4; i += 1) {
        ctx.fillStyle = i % 2 ? "#151a1e" : "#1b2227";
        ctx.fillRect(82 + i * 39, 18, 36, 144);
      }
      const stage = findImage(imageFiles, /stage|key|note|light/);
      await drawImage(ctx, stage ?? imageFiles[0], 102, 48, 116, 84);
      return;
    }
    if (row.scope === "taiko") {
      ctx.fillStyle = "#1b2025";
      ctx.fillRect(20, 42, 280, 54);
      ctx.fillStyle = "#252d33";
      ctx.fillRect(20, 96, 280, 42);
      await drawImage(ctx, imageFiles[0], 28, 36, 250, 102);
      return;
    }
    await drawImage(ctx, imageFiles[0], 32, 18, 256, 144);
  })();
  return preview;
}

function buildPreview(cell, row, mode = "thumbnail") {
  return mode === "composite" ? canvasPreview(cell, row) : thumbnailPreview(cell, row);
}

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
  return (value || "").split("-").map((part) => part[0]?.toUpperCase() + part.slice(1)).join(" ");
}

function currentSource() {
  return state.files.sources.find((source) => source.id === state.selectedSourceId) || null;
}

function rowCategories(scopeName = state.scope) {
  return [...new Set(state.files.matrix.rows.filter((row) => row.scope === scopeName).map((row) => row.category))].sort();
}

function firstAvailableScope() {
  return state.files.scopes.find((scope) => state.files.matrix.rows.some((row) => row.scope === scope)) || state.files.scopes[0] || "std";
}

function ensureSelectionModel() {
  if (!state.files.scopes.includes(state.scope)) state.scope = firstAvailableScope();
  const categories = rowCategories();
  if (!state.category || !categories.includes(state.category)) state.category = categories[0] || "";
  if (!state.files.sources.some((source) => source.id === state.selectedSourceId)) state.selectedSourceId = state.files.sources[0]?.id || "";
}

function visibleRows() {
  const filter = $("assetFilter").value.trim().toLowerCase();
  const meaningfulOnly = $("meaningfulOnly").checked;
  const collapseStable = $("collapseStable").checked;
  const mode = $("sourceFilterMode").value;
  const sourceId = state.selectedSourceId;
  return state.files.matrix.rows.filter((row) => {
    if (row.scope !== state.scope || row.category !== state.category) return false;
    if (row.groupKey === "__rule__") return false;
    if (meaningfulOnly && !row.lazerMeaningful) return false;
    if (collapseStable && row.scope === "stable") return false;
    const projectCell = row.cells.project;
    const sourceCell = row.cells[sourceId] || { files: [], missing: true, warnings: [] };
    if (mode === "missing" && !projectCell.missing) return false;
    if (mode === "different" && (sourceCell.missing || sourceCell.files.map((file) => file.flatPath).join("|") === projectCell.files.map((file) => file.flatPath).join("|"))) return false;
    if (mode === "warnings" && !row.warnings.length && !projectCell.warnings.length && !sourceCell.warnings.length) return false;
    if (mode === "hd" && !projectCell.hasHd && !sourceCell.hasHd) return false;
    if (mode === "sd" && !projectCell.hasSd && !sourceCell.hasSd) return false;
    if (!filter) return true;
    const haystack = [
      row.groupLabel,
      row.category,
      row.scope,
      row.warnings.join(" "),
      ...projectCell.files.map((file) => file.flatPath),
      ...sourceCell.files.map((file) => file.flatPath)
    ].join(" ").toLowerCase();
    return haystack.includes(filter);
  });
}

function previewNode(cell, row) {
  return buildPreview(cell, row, $("previewMode")?.value || "thumbnail");
}

function fileChips(files) {
  const chips = document.createElement("div");
  chips.className = "fileChips compact";
  for (const file of files.slice(0, 5)) {
    const chip = document.createElement("span");
    chip.textContent = file.name;
    chips.append(chip);
  }
  if (files.length > 5) {
    const more = document.createElement("span");
    more.textContent = `+${files.length - 5}`;
    chips.append(more);
  }
  return chips;
}

function renderAssetRow(row, columnId, side) {
  const cell = row.cells[columnId] || { files: [], missing: true, warnings: [], hasHd: false, hasSd: false };
  const node = document.createElement("div");
  const selected = side === "source" && state.selectedRows.has(row.rowKey);
  node.className = `assetRow${cell.missing ? " missing" : ""}${selected ? " selected" : ""}${row.lazerMeaningful ? "" : " legacy"}`;
  const text = document.createElement("div");
  text.className = "assetRowText";
  text.innerHTML = `<strong>${row.groupLabel}</strong><span>${label(row.category)} · ${cell.files.length || 0} files${row.lazerMeaningful ? "" : " · Stable later"}</span>`;
  if (row.warnings.length || cell.warnings.length) {
    const warn = document.createElement("div");
    warn.className = "warningText";
    warn.textContent = [...row.warnings, ...cell.warnings][0];
    text.append(warn);
  }
  const meta = document.createElement("div");
  meta.className = "cellMeta";
  meta.innerHTML = `<span>${cell.hasHd ? "HD" : ""}${cell.hasHd && cell.hasSd ? " / " : ""}${cell.hasSd ? "SD" : ""}</span>`;
  const actions = document.createElement("div");
  actions.className = "cardActions";
  const textFile = side === "project" ? cell.files.find((file) => file.kind === "text") : null;
  if (textFile) {
    const edit = document.createElement("button");
    edit.textContent = "Edit";
    edit.onclick = (event) => {
      event.stopPropagation();
      openTextEditor(textFile);
    };
    actions.append(edit);
  }
  if (side === "project" && !cell.missing) {
    const del = document.createElement("button");
    del.textContent = "Delete";
    del.onclick = async (event) => {
      event.stopPropagation();
      try {
        for (const file of cell.files) {
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
  node.append(previewNode(cell, row), text, meta, fileChips(cell.files), actions);
  if (side === "source" && !cell.missing) {
    node.onclick = () => {
      if (state.selectedRows.has(row.rowKey)) state.selectedRows.delete(row.rowKey);
      else state.selectedRows.add(row.rowKey);
      renderCompare();
    };
  }
  return node;
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

function renderSourceSelect() {
  const select = $("sourceSelect");
  select.replaceChildren();
  for (const source of state.files.sources || []) {
    const option = document.createElement("option");
    option.value = source.id;
    option.textContent = source.name;
    select.append(option);
  }
  select.value = state.selectedSourceId;
}

function renderSources() {
  const list = $("sourceList");
  list.replaceChildren();
  const recent = JSON.parse(localStorage.getItem("recentAssetSources") || "[]");
  for (const source of state.files.sources || []) {
    const row = document.createElement("div");
    row.className = "sourceRow";
    row.innerHTML = `<div><strong>${source.name}</strong><div class="muted">${source.files.length} files · ${source.sourcePath}</div></div>`;
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
  if (recent.length) {
    const note = document.createElement("p");
    note.className = "muted";
    note.textContent = `Recent: ${recent.slice(0, 3).join(" · ")}`;
    list.append(note);
  }
  if (!list.children.length) list.textContent = "No asset sources.";
}

function renderScopeTabs() {
  const tabs = $("scopeTabs");
  tabs.replaceChildren();
  for (const scope of state.files.scopes || []) {
    const count = state.files.matrix.rows.filter((row) => row.scope === scope && row.groupKey !== "__rule__").length;
    if (!count) continue;
    const button = document.createElement("button");
    button.className = `tab${scope === state.scope ? " active" : ""}`;
    button.textContent = `${label(scope)} ${count}`;
    button.onclick = () => {
      state.scope = scope;
      state.category = "";
      state.selectedRows.clear();
      ensureSelectionModel();
      render();
    };
    tabs.append(button);
  }
}

function renderCategoryTabs() {
  const tabs = $("categoryTabs");
  tabs.replaceChildren();
  for (const category of rowCategories()) {
    const count = state.files.matrix.rows.filter((row) => row.scope === state.scope && row.category === category && row.groupKey !== "__rule__").length;
    if (!count) continue;
    const button = document.createElement("button");
    button.className = `tab${category === state.category ? " active" : ""}`;
    button.textContent = `${label(category)} ${count}`;
    button.onclick = () => {
      state.category = category;
      state.selectedRows.clear();
      render();
    };
    tabs.append(button);
  }
}

function renderProjectHeader() {
  $("projectTitle").textContent = state.project ? state.project.name : "No project loaded";
  $("projectMeta").textContent = state.project
    ? `${state.project.id} · ${state.files.project.length} files · ${state.files.sources.length} asset sources · ${state.files.validation.count} warnings`
    : "Import a main skin to start.";
}

function renderValidationSummary() {
  const node = $("validationSummary");
  const warnings = state.files.validation.warnings || [];
  node.replaceChildren();
  const labelNode = document.createElement("div");
  labelNode.innerHTML = `<strong>${warnings.length} warnings</strong><span class="muted"> @2x only, animation gaps, and missing references are shown here.</span>`;
  const button = document.createElement("button");
  button.textContent = "View warnings";
  button.onclick = () => openValidationOverlay();
  node.append(labelNode, button);
}

function openValidationOverlay() {
  const list = $("validationList");
  list.replaceChildren();
  for (const warning of (state.files.validation.warnings || [])) {
    const item = document.createElement("div");
    item.className = "validationWarning";
    item.textContent = `${label(warning.scope)} / ${label(warning.category)} / ${warning.group}: ${warning.message}`;
    list.append(item);
  }
  if (!list.children.length) list.textContent = "No warnings.";
  $("validationOverlay").classList.remove("hidden");
}

function renderCompare() {
  const rows = visibleRows();
  const root = $("assetRows");
  root.replaceChildren();
  const source = currentSource();
  $("compareMeta").textContent = `${label(state.scope)} / ${label(state.category || "none")} · ${rows.length} rows · ${state.selectedRows.size} selected`;
  $("projectColumnMeta").textContent = `${rows.filter((row) => !row.cells.project.missing).length} present`;
  $("assetColumnMeta").textContent = source ? `${source.name} · ${rows.filter((row) => !(row.cells[source.id]?.missing ?? true)).length} present` : "No source selected";
  for (const row of rows) {
    const pair = document.createElement("div");
    pair.className = "assetPairRow";
    pair.append(renderAssetRow(row, "project", "project"), renderAssetRow(row, state.selectedSourceId, "source"));
    root.append(pair);
  }
  if (!rows.length) {
    root.textContent = "No rows match the current filters.";
  }
  renderValidationSummary();
}

function render() {
  ensureSelectionModel();
  renderProjects();
  renderSourceSelect();
  renderSources();
  renderProjectHeader();
  renderScopeTabs();
  renderCategoryTabs();
  renderCompare();
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
  if (!state.files.sources.some((source) => source.id === state.selectedSourceId)) state.selectedSourceId = state.files.sources[0]?.id || "";
  state.selectedRows.clear();
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
    for (const [key, labelText] of [["General.Name", "Name"], ["General.Author", "Author"], ["General.Version", "Version"], ["General.CursorRotate", "Cursor rotate"], ["Colours.Combo1", "Combo 1"], ["Colours.Combo2", "Combo 2"], ["Fonts.HitCircleOverlap", "Hit overlap"]]) {
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
  return visibleRows()
    .filter((row) => state.selectedRows.has(row.rowKey))
    .map((row) => {
      const cell = row.cells[source.id];
      return {
        sourceId: source.id,
        paths: cell.files.map((file) => file.path),
        action: "replace",
        conflict: !row.cells.project.missing,
        label: `${row.groupLabel} from ${source.name}`,
        row,
        sourceCell: cell,
        projectCell: row.cells.project
      };
    })
    .filter((item) => item.paths.length);
}

function openConflictDialog(items) {
  state.pendingItems = items;
  const list = $("conflictList");
  list.replaceChildren();
  for (const item of items) {
    const row = document.createElement("div");
    row.className = "conflictRow";
    const info = document.createElement("div");
    info.innerHTML = `<strong>${item.label}</strong><div class="muted">${item.paths.length} files${item.conflict ? " · replaces project files" : ""}</div>`;
    const previews = document.createElement("div");
    previews.className = "conflictPreviews";
    previews.append(previewNode(item.projectCell, item.row), previewNode(item.sourceCell, item.row));
    const select = document.createElement("select");
    select.innerHTML = `<option value="replace">${item.conflict ? "Replace" : "Copy"}</option><option value="skip">Skip</option>`;
    select.onchange = () => {
      item.action = select.value;
    };
    row.append(info, previews, select);
    list.append(row);
  }
  $("conflictOverlay").classList.remove("hidden");
}

async function applyMix(items) {
  const payload = items.map(({ sourceId, paths, action, targetPath }) => ({ sourceId, paths, action, targetPath }));
  await api(`/api/projects/${encodeURIComponent(state.project.id)}/mix`, { method: "POST", body: JSON.stringify({ items: payload }) });
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

function syncExportPreset() {
  const preset = $("exportPreset").value;
  $("formatFlat").checked = ["full", "sd", "hd"].includes(preset);
  $("formatOsk").checked = ["full", "sd", "hd"].includes(preset);
  $("formatDiff").checked = preset === "diff";
  $("formatBackup").checked = preset === "backup";
  const descriptions = {
    full: "Full export includes SD and @2x assets.",
    sd: "SD only excludes @2x assets for a lighter skin.",
    hd: "HD only exports @2x image assets where possible.",
    diff: "Diff exports files changed from the main source.",
    backup: "Backup exports the full project for restore on another machine."
  };
  $("exportPresetDescription").textContent = descriptions[preset] || "";
}

function renderValidationPanel() {
  const panel = $("validationPanel");
  panel.replaceChildren();
  const warnings = state.files.validation.warnings || [];
  const title = document.createElement("div");
  title.innerHTML = `<strong>${warnings.length} warnings</strong><p class="muted">Warnings do not block export.</p>`;
  panel.append(title);
  for (const warning of warnings.slice(0, 12)) {
    const row = document.createElement("div");
    row.className = "validationWarning";
    row.textContent = `${label(warning.scope)} / ${label(warning.category)} / ${warning.group}: ${warning.message}`;
    panel.append(row);
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
      state.project = await api("/api/projects/import-main", { method: "POST", body: JSON.stringify({ sourcePath: $("mainPath").value, name: $("projectName").value }) });
      toast("Main skin imported.");
      await loadProjects();
      await loadProject(state.project.id);
    } catch (error) {
      toast(error.message, true);
    }
  };
  $("importBackup").onclick = async () => {
    try {
      state.project = await api("/api/projects/import-backup", { method: "POST", body: JSON.stringify({ sourcePath: $("mainPath").value }) });
      toast("Backup imported as a new project.");
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
    state.selectedRows.clear();
    render();
  };
  $("assetFilter").oninput = renderCompare;
  $("meaningfulOnly").onchange = renderCompare;
  $("collapseStable").onchange = renderCompare;
  $("sourceFilterMode").onchange = renderCompare;
  $("previewMode").onchange = renderCompare;
  $("selectVisible").onclick = () => {
    const source = currentSource();
    if (!source) return;
    for (const row of visibleRows()) {
      if (!(row.cells[source.id]?.missing ?? true)) state.selectedRows.add(row.rowKey);
    }
    renderCompare();
  };
  $("clearSelection").onclick = () => {
    state.selectedRows.clear();
    renderCompare();
  };
  $("importAsset").onclick = async () => {
    if (!state.project) return toast("Import a main skin first.", true);
    try {
      const sourcePath = $("assetPath").value;
      await api(`/api/projects/${encodeURIComponent(state.project.id)}/import-assets`, { method: "POST", body: JSON.stringify({ sourcePath, name: $("assetName").value }) });
      const recent = [sourcePath, ...JSON.parse(localStorage.getItem("recentAssetSources") || "[]").filter((entry) => entry !== sourcePath)].slice(0, 5);
      localStorage.setItem("recentAssetSources", JSON.stringify(recent));
      toast("Asset source imported.");
      await loadProject(state.project.id);
    } catch (error) {
      toast(error.message, true);
    }
  };
  $("copySelected").onclick = () => {
    const items = selectedMixItems();
    if (!items.length) return toast("Select asset rows first.", true);
    openConflictDialog(items);
  };
  $("reclassifyProject").onclick = async () => {
    if (!state.project) return;
    try {
      const preview = await api(`/api/projects/${encodeURIComponent(state.project.id)}/reclassify-preview`, { method: "POST", body: "{}" });
      const list = $("reclassifyPreview");
      list.replaceChildren();
      const summary = document.createElement("div");
      summary.innerHTML = `<strong>${preview.changed} changed</strong><div class="muted">${preview.unchanged} unchanged · ${preview.missing} missing files</div>`;
      list.append(summary);
      for (const example of preview.examples || []) {
        const item = document.createElement("div");
        item.className = "validationWarning";
        item.textContent = `${example.flatPath}: ${example.oldStructuredPath} -> ${example.nextStructuredPath}`;
        list.append(item);
      }
      $("reclassifyOverlay").classList.remove("hidden");
    } catch (error) {
      toast(error.message, true);
    }
  };
  $("closeReclassify").onclick = () => $("reclassifyOverlay").classList.add("hidden");
  $("runReclassify").onclick = async () => {
    try {
      await api(`/api/projects/${encodeURIComponent(state.project.id)}/reclassify`, { method: "POST", body: "{}" });
      $("reclassifyOverlay").classList.add("hidden");
      toast("Project reclassified.");
      await loadProject(state.project.id);
    } catch (error) {
      toast(error.message, true);
    }
  };
  $("undoProject").onclick = async () => {
    if (!state.project) return;
    try {
      const result = await api(`/api/projects/${encodeURIComponent(state.project.id)}/undo`, { method: "POST", body: "{}" });
      toast(`Undone: ${result.undone}`);
      await loadProject(state.project.id);
    } catch (error) {
      toast(error.message, true);
    }
  };
  $("closeConflicts").onclick = () => $("conflictOverlay").classList.add("hidden");
  $("applyConflicts").onclick = async () => {
    $("conflictOverlay").classList.add("hidden");
    try {
      await applyMix(state.pendingItems);
    } catch (error) {
      toast(error.message, true);
    }
  };
  $("closeText").onclick = () => $("textOverlay").classList.add("hidden");
  $("saveText").onclick = async () => {
    if (!state.editingFile) return;
    try {
      await api(`/api/projects/${encodeURIComponent(state.project.id)}/file?path=${encodeURIComponent(state.editingFile.path)}`, { method: "PUT", body: JSON.stringify({ content: $("textEditor").value }) });
      toast("Saved.");
      $("textOverlay").classList.add("hidden");
      await loadProject(state.project.id);
    } catch (error) {
      toast(error.message, true);
    }
  };
  $("exportProject").onclick = () => {
    if (!state.project) return toast("Import a main skin first.", true);
    syncExportPreset();
    renderValidationPanel();
    $("exportOverlay").classList.remove("hidden");
  };
  $("closeExport").onclick = () => $("exportOverlay").classList.add("hidden");
  $("closeValidation").onclick = () => $("validationOverlay").classList.add("hidden");
  $("closeValidationFooter").onclick = () => $("validationOverlay").classList.add("hidden");
  $("exportPreset").onchange = syncExportPreset;
  $("runExport").onclick = async () => {
    const formats = [];
    if ($("formatFlat").checked) formats.push("flat");
    if ($("formatOsk").checked) formats.push("osk");
    if ($("formatDiff").checked) formats.push("diff");
    if ($("formatBackup").checked) formats.push("backup");
    const preset = $("exportPreset").value;
    const resolution = preset === "sd" ? "sd" : preset === "hd" ? "hd" : "full";
    try {
      const result = await api(`/api/projects/${encodeURIComponent(state.project.id)}/export`, {
        method: "POST",
        body: JSON.stringify({ preset, formats, resolution, includeStable: $("includeStable").checked, includeExtras: $("includeExtras").checked })
      });
      toast(`Exported: ${Object.values(result.exports).join(" / ")} (${Object.values(result.counts || {}).join(" / ")} files)`);
      $("exportOverlay").classList.add("hidden");
      await loadProject(state.project.id);
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
