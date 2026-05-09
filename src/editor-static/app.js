const state = {
  workspaceRoot: "",
  projects: [],
  project: null,
  files: { project: [], sources: [], scopes: [], matrix: { columns: [], rows: [] }, validation: { warnings: [], count: 0 } },
  history: [],
  view: localStorage.getItem("viewMode") || "edit",
  previewTab: "song-select",
  scope: "std",
  category: "",
  selectedSourceId: "",
  disabledSourceIds: new Set(JSON.parse(localStorage.getItem("disabledSourceIds") || "[]")),
  selectedRows: new Set(),
  editingFile: null,
  pendingItems: [],
  activeAudio: null
};

const $ = (id) => document.getElementById(id);

function sortedFiles(cell) {
  return [...(cell.files || [])].sort((a, b) => (a.sequenceIndex ?? 999999) - (b.sequenceIndex ?? 999999));
}

function stopOtherAudio(audio) {
  if (state.activeAudio && state.activeAudio !== audio) state.activeAudio.pause();
  state.activeAudio = audio;
}

function audioPreview(cell, row) {
  const preview = document.createElement("div");
  preview.className = "miniPreview audioPreview";
  const files = sortedFiles(cell);
  const audio = files.find((file) => file.kind === "audio");
  if (!audio) {
    preview.textContent = cell.missing ? "Missing" : "AUDIO";
    return preview;
  }
  const play = document.createElement("button");
  play.type = "button";
  play.textContent = "Play";
  const labelNode = document.createElement("div");
  labelNode.className = "audioLabel";
  labelNode.innerHTML = `<strong>${row.groupLabel}</strong><span>${audio.name}</span>`;
  const meter = document.createElement("div");
  meter.className = "audioMeter";
  meter.innerHTML = "<span></span>";
  const duration = document.createElement("span");
  duration.className = "audioDuration";
  duration.textContent = "--:--";
  const player = new Audio(audio.url);
  player.preload = "metadata";
  player.onloadedmetadata = () => {
    if (Number.isFinite(player.duration)) duration.textContent = formatTime(player.duration);
  };
  player.ontimeupdate = () => {
    const ratio = player.duration ? player.currentTime / player.duration : 0;
    meter.firstElementChild.style.width = `${Math.max(4, ratio * 100)}%`;
  };
  player.onplay = () => {
    stopOtherAudio(player);
    play.textContent = "Pause";
  };
  player.onpause = () => {
    play.textContent = "Play";
  };
  player.onerror = () => {
    play.textContent = "Unsupported";
    play.disabled = true;
  };
  play.onclick = (event) => {
    event.stopPropagation();
    if (player.paused) void player.play().catch(() => {
      play.textContent = "Unsupported";
      play.disabled = true;
    });
    else player.pause();
  };
  preview.append(play, labelNode, meter, duration);
  return preview;
}

function formatTime(seconds) {
  const safe = Math.max(0, Math.round(seconds || 0));
  const minutes = Math.floor(safe / 60);
  return `${minutes}:${String(safe % 60).padStart(2, "0")}`;
}

function thumbnailPreview(cell, row) {
  const files = sortedFiles(cell);
  if (files.some((file) => file.kind === "audio")) return audioPreview(cell, row);
  const preview = document.createElement("div");
  preview.className = "miniPreview";
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
  preview.textContent = cell.missing ? "Missing" : (files[0]?.kind || "file").toUpperCase();
  return preview;
}

function buildPreview(cell, row) {
  return thumbnailPreview(cell, row);
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

function activeSources() {
  return state.files.sources.filter((source) => !state.disabledSourceIds.has(source.id));
}

function warningMessage(warning) {
  return typeof warning === "string" ? warning : warning.message;
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
  const sources = activeSources();
  if (!sources.some((source) => source.id === state.selectedSourceId)) state.selectedSourceId = sources[0]?.id || state.files.sources[0]?.id || "";
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
      row.warnings.map(warningMessage).join(" "),
      ...projectCell.files.map((file) => file.flatPath),
      ...sourceCell.files.map((file) => file.flatPath)
    ].join(" ").toLowerCase();
    return haystack.includes(filter);
  });
}

function previewNode(cell, row) {
  return buildPreview(cell, row);
}

function fileChips(files) {
  const chips = document.createElement("div");
  chips.className = "fileChips compact";
  for (const file of files.slice(0, 4)) {
    const chip = document.createElement("span");
    chip.textContent = file.name;
    chips.append(chip);
  }
  if (files.length > 4) {
    const more = document.createElement("span");
    more.textContent = `+${files.length - 4}`;
    chips.append(more);
  }
  return chips;
}

function renderAssetRow(row, columnId, side) {
  const cell = row.cells[columnId] || { files: [], missing: true, warnings: [], hasHd: false, hasSd: false };
  const node = document.createElement("div");
  const selected = side === "source" && state.selectedRows.has(row.rowKey);
  node.dataset.rowKey = row.rowKey;
  node.className = `assetRow${cell.missing ? " missing" : ""}${selected ? " selected" : ""}${row.lazerMeaningful ? "" : " legacy"} ${side}AssetRow`;
  const text = document.createElement("div");
  text.className = "assetRowText";
  text.innerHTML = `<strong>${row.groupLabel}</strong><span>${label(row.category)} · ${cell.files.length || 0} files${row.lazerMeaningful ? "" : " · Stable later"}</span>`;
  if (row.warnings.length || cell.warnings.length) {
    const warn = document.createElement("div");
    warn.className = `warningText ${side === "project" ? "projectWarning" : "sourceWarning"}`;
    const first = [...row.warnings, ...cell.warnings][0];
    warn.textContent = `${side === "project" ? "Project" : "Source"}: ${warningMessage(first)}`;
    text.append(warn);
  }
  const meta = document.createElement("div");
  meta.className = "cellMeta";
  if (cell.hasHd) meta.append(badge("HD"));
  if (cell.hasSd) meta.append(badge("SD"));
  if (side === "source" && !cell.missing) {
    const mark = document.createElement("span");
    mark.className = "selectMark";
    mark.textContent = selected ? "✓" : "";
    meta.append(mark);
  }
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
    del.className = "dangerButton smallAction";
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
  if (side === "project") {
    const mainCell = row.cells.main;
    if (mainCell && !mainCell.missing) {
      const restore = document.createElement("button");
      restore.className = "smallAction";
      restore.textContent = "Restore from main";
      restore.onclick = async (event) => {
        event.stopPropagation();
        try {
          await api(`/api/projects/${encodeURIComponent(state.project.id)}/restore`, {
            method: "POST",
            body: JSON.stringify({ sourceId: "main", paths: mainCell.files.map((file) => file.path) })
          });
          toast("Restored from main.");
          await loadProject(state.project.id);
        } catch (error) {
          toast(error.message, true);
        }
      };
      actions.append(restore);
    }
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

function badge(text) {
  const node = document.createElement("span");
  node.className = `badge badge${text}`;
  node.textContent = text;
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
  for (const source of activeSources()) {
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
    const enabled = !state.disabledSourceIds.has(source.id);
    row.innerHTML = `<label class="sourceToggle"><input type="checkbox" ${enabled ? "checked" : ""} /> <span><strong>${source.name}</strong><div class="muted">${source.files.length} files · ${source.sourcePath}</div></span></label>`;
    row.querySelector("input").onchange = (event) => {
      if (event.target.checked) state.disabledSourceIds.delete(source.id);
      else state.disabledSourceIds.add(source.id);
      localStorage.setItem("disabledSourceIds", JSON.stringify([...state.disabledSourceIds]));
      ensureSelectionModel();
      render();
    };
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
    const recentBox = document.createElement("div");
    recentBox.className = "recentSources";
    const title = document.createElement("div");
    title.className = "muted";
    title.textContent = "Recent sources";
    recentBox.append(title);
    for (const sourcePath of recent.slice(0, 3)) {
      const button = document.createElement("button");
      button.textContent = `Reimport ${sourcePath.split(/[\\/]/).pop() || sourcePath}`;
      button.title = sourcePath;
      button.onclick = async () => {
        if (!state.project) return;
        try {
          await api(`/api/projects/${encodeURIComponent(state.project.id)}/import-assets`, { method: "POST", body: JSON.stringify({ sourcePath }) });
          toast("Recent source imported.");
          await loadProject(state.project.id);
        } catch (error) {
          toast(error.message, true);
        }
      };
      recentBox.append(button);
    }
    list.append(recentBox);
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
  updateUndoButton();
}

function renderValidationSummary() {
  const node = $("validationSummary");
  const warnings = (state.files.validation.warnings || []).filter((warning) => !warning.ignored);
  node.replaceChildren();
  if (!warnings.length) {
    node.classList.add("quiet");
    node.innerHTML = "<strong>No active warnings</strong><span class=\"muted\"> ignored warnings stay available in the list.</span>";
    return;
  }
  node.classList.remove("quiet");
  const counts = warnings.reduce((acc, warning) => {
    acc[warning.type || "warning"] = (acc[warning.type || "warning"] || 0) + 1;
    return acc;
  }, {});
  const labelNode = document.createElement("div");
  labelNode.className = "warningCounts";
  labelNode.innerHTML = `<strong>${warnings.length} warnings</strong>`;
  for (const [type, count] of Object.entries(counts)) {
    const chip = document.createElement("button");
    chip.type = "button";
    chip.textContent = `${label(type)} ${count}`;
    chip.onclick = () => {
      const target = warnings.find((warning) => warning.type === type);
      if (target) jumpToWarning(target);
    };
    labelNode.append(chip);
  }
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
    item.innerHTML = `<strong>${label(warning.type)} · ${warning.ignored ? "Ignored" : "Active"}</strong><div>${label(warning.scope)} / ${label(warning.category)} / ${warning.group}: ${warning.message}</div>`;
    const actions = document.createElement("div");
    actions.className = "modalActions";
    const jump = document.createElement("button");
    jump.textContent = "Jump";
    jump.onclick = () => {
      $("validationOverlay").classList.add("hidden");
      jumpToWarning(warning);
    };
    const ignore = document.createElement("button");
    ignore.textContent = warning.ignored ? "Unignore" : "Ignore";
    ignore.onclick = async () => {
      await api(`/api/projects/${encodeURIComponent(state.project.id)}/warning-state`, {
        method: "POST",
        body: JSON.stringify({ id: warning.id, ignored: !warning.ignored, read: true })
      });
      await loadProject(state.project.id);
      openValidationOverlay();
    };
    actions.append(jump, ignore);
    item.append(actions);
    list.append(item);
  }
  if (!list.children.length) list.textContent = "No warnings.";
  $("validationOverlay").classList.remove("hidden");
}

function jumpToWarning(warning) {
  const row = state.files.matrix.rows.find((candidate) => candidate.rowKey === warning.rowKey);
  if (row) {
    state.view = "edit";
    localStorage.setItem("viewMode", state.view);
    state.scope = row.scope;
    state.category = row.category;
    render();
    requestAnimationFrame(() => {
      const target = document.querySelector(`[data-row-key="${CSS.escape(row.rowKey)}"]`);
      target?.scrollIntoView({ block: "center" });
      target?.classList.add("focusFlash");
      window.setTimeout(() => target?.classList.remove("focusFlash"), 1200);
    });
    return;
  }
  state.view = "preview";
  state.previewTab = warning.scope === "configs" ? "song-select" : warning.scope;
  render();
}

function updateUndoButton() {
  const button = $("undoProject");
  const latest = state.history[0];
  button.textContent = latest ? `Undo: ${latest.action} ${latest.affectedCount} files` : "Undo";
  button.disabled = !latest;
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

const previewTabs = [
  ["song-select", "Song Select"],
  ["std", "Std"],
  ["taiko", "Taiko"],
  ["catch", "Catch"],
  ["mania", "Mania"],
];

function projectFilesByName() {
  const files = {};
  for (const file of state.files.project || []) files[file.flatPath.toLowerCase()] = file;
  return files;
}

function projectRows(scope) {
  return state.files.matrix.rows.filter((row) => row.scope === scope && row.groupKey !== "__rule__");
}

function firstProjectFile(patterns, kind = "image") {
  const all = state.files.project || [];
  for (const pattern of patterns) {
    const file = all.find((candidate) => candidate.kind === kind && pattern.test(candidate.flatPath.toLowerCase()));
    if (file) return file;
  }
  return null;
}

function imagePromise(file) {
  if (!file) return Promise.resolve(null);
  const image = new Image();
  image.src = file.url;
  return image.decode().then(() => image).catch(() => null);
}

function renderPreview() {
  const tabs = $("previewTabs");
  tabs.replaceChildren();
  for (const [id, text] of previewTabs) {
    const button = document.createElement("button");
    button.className = `tab${state.previewTab === id ? " active" : ""}`;
    button.textContent = text;
    button.onclick = () => {
      state.previewTab = id;
      renderPreview();
    };
    tabs.append(button);
  }
  const stage = $("previewStage");
  stage.replaceChildren();
  const panel = document.createElement("div");
  panel.className = `lazerPreview ${state.previewTab}`;
  const canvas = document.createElement("canvas");
  canvas.width = 1180;
  canvas.height = 660;
  panel.append(canvas);
  const audioRack = document.createElement("div");
  audioRack.className = "previewAudioRack";
  stage.append(panel, audioRack);
  drawPreviewCanvas(canvas, state.previewTab);
  renderPreviewAudio(audioRack, state.previewTab);
}

function renderPreviewAudio(container, tab) {
  container.replaceChildren();
  const sounds = (state.files.project || []).filter((file) => file.kind === "audio");
  const relevant = sounds.filter((file) => {
    const name = file.flatPath.toLowerCase();
    if (tab === "taiko") return name.includes("taiko") || name.includes("drum") || name.includes("hit");
    if (tab === "std") return name.includes("hit") || name.includes("slider") || name.includes("spinner") || name.includes("combobreak");
    if (tab === "catch") return name.includes("hit") || name.includes("combobreak") || name.includes("applause");
    if (tab === "mania") return name.includes("hit") || name.includes("key") || name.includes("combobreak");
    return name.includes("count") || name.includes("ready") || name.includes("go") || name.includes("applause") || name.includes("rank");
  }).slice(0, 8);
  const title = document.createElement("strong");
  title.textContent = "Audio";
  container.append(title);
  if (!relevant.length) {
    const empty = document.createElement("span");
    empty.className = "muted";
    empty.textContent = "No matching audio in project.";
    container.append(empty);
    return;
  }
  for (const file of relevant) {
    container.append(audioPreview({ files: [file], missing: false }, { groupLabel: file.name }));
  }
}

function drawPreviewCanvas(canvas, tab) {
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#0d1114";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#161d22";
  ctx.fillRect(38, 38, canvas.width - 76, canvas.height - 76);
  ctx.fillStyle = "#f0f4f5";
  ctx.font = "700 28px Inter, sans-serif";
  ctx.fillText(previewTabs.find(([id]) => id === tab)?.[1] || "Preview", 62, 84);
  if (tab === "song-select") drawSongSelect(ctx);
  if (tab === "std") void drawStd(ctx);
  if (tab === "taiko") void drawTaiko(ctx);
  if (tab === "catch") void drawCatch(ctx);
  if (tab === "mania") void drawMania(ctx);
}

function drawMissing(ctx, text, x, y, width, height) {
  ctx.strokeStyle = "#3a444b";
  ctx.setLineDash([8, 6]);
  ctx.strokeRect(x, y, width, height);
  ctx.setLineDash([]);
  ctx.fillStyle = "#75828a";
  ctx.font = "700 18px Inter, sans-serif";
  ctx.fillText(text, x + 14, y + height / 2);
}

async function drawAsset(ctx, file, x, y, width, height, missingLabel) {
  const image = await imagePromise(file);
  if (!image) {
    drawMissing(ctx, missingLabel, x, y, width, height);
    return;
  }
  ctx.drawImage(image, x, y, width, height);
}

function drawSongSelect(ctx) {
  ctx.fillStyle = "#20272d";
  for (let i = 0; i < 6; i += 1) {
    ctx.fillRect(78, 126 + i * 72, 700, 54);
    ctx.fillStyle = i === 2 ? "#3b3220" : "#20272d";
  }
  ctx.fillStyle = "#c9d2d7";
  ctx.font = "700 22px Inter, sans-serif";
  ctx.fillText("Artist - Beatmap Title", 104, 164);
  ctx.font = "16px Inter, sans-serif";
  ctx.fillText("Lazer first editor preview", 104, 226);
  ctx.fillStyle = "#151a1e";
  ctx.fillRect(820, 126, 260, 390);
  ctx.fillStyle = "#e2b85d";
  ctx.font = "700 48px Inter, sans-serif";
  ctx.fillText("S", 934, 250);
  ctx.font = "16px Inter, sans-serif";
  ctx.fillStyle = "#93a0a8";
  ctx.fillText("Result sounds and fonts are checked below.", 862, 326);
}

async function drawStd(ctx) {
  const circle = firstProjectFile([/hitcircle(@2x)?\.png$/]);
  const overlay = firstProjectFile([/hitcircleoverlay/]);
  const number = firstProjectFile([/default-1/]);
  const approach = firstProjectFile([/approachcircle/]);
  const cursor = firstProjectFile([/cursor(@2x)?\.png$/]);
  const follow = firstProjectFile([/followpoint/]);
  ctx.strokeStyle = "#40505a";
  ctx.lineWidth = 14;
  ctx.beginPath();
  ctx.moveTo(250, 350);
  ctx.bezierCurveTo(420, 180, 580, 480, 760, 280);
  ctx.stroke();
  await drawAsset(ctx, approach, 208, 188, 180, 180, "approachcircle");
  await drawAsset(ctx, circle, 240, 220, 116, 116, "hitcircle");
  await drawAsset(ctx, overlay, 240, 220, 116, 116, "overlay");
  await drawAsset(ctx, number, 282, 252, 36, 42, "1");
  await drawAsset(ctx, follow, 430, 250, 54, 54, "follow");
  await drawAsset(ctx, cursor, 820, 410, 82, 82, "cursor");
}

async function drawTaiko(ctx) {
  const upper = firstProjectFile([/taiko-slider/, /taiko-glow/]);
  const left = firstProjectFile([/taiko-bar-left/]);
  const drumInner = firstProjectFile([/taiko-drum-inner/]);
  const drumOuter = firstProjectFile([/taiko-drum-outer/]);
  const note = firstProjectFile([/taikohitcircle/]);
  const shaker = firstProjectFile([/spinner-warning/, /spinner-circle/]);
  ctx.fillStyle = "#11181d";
  ctx.fillRect(100, 180, 920, 94);
  ctx.fillStyle = "#202b32";
  ctx.fillRect(100, 274, 920, 116);
  await drawAsset(ctx, upper, 220, 186, 680, 78, "upper playfield");
  await drawAsset(ctx, left, 110, 272, 200, 118, "bar left");
  await drawAsset(ctx, drumOuter, 120, 238, 154, 154, "drum outer");
  await drawAsset(ctx, drumInner, 144, 262, 106, 106, "drum inner");
  await drawAsset(ctx, note, 564, 203, 68, 68, "note");
  await drawAsset(ctx, shaker, 820, 108, 130, 130, "shaker");
}

async function drawCatch(ctx) {
  const catcher = firstProjectFile([/fruit-catcher-idle/, /fruit-ryuuta/]);
  const fruit = firstProjectFile([/fruit-apple/, /fruit-orange/, /fruit-pear/, /fruit-grapes/]);
  const drop = firstProjectFile([/fruit-drop/, /fruit-droplet/]);
  const lighting = firstProjectFile([/lighting/]);
  ctx.fillStyle = "#10191e";
  ctx.fillRect(120, 126, 880, 426);
  for (const [x, y] of [[300, 170], [520, 230], [710, 150]]) await drawAsset(ctx, fruit, x, y, 64, 64, "fruit");
  await drawAsset(ctx, drop, 440, 320, 46, 46, "drop");
  await drawAsset(ctx, lighting, 492, 430, 160, 80, "lighting");
  await drawAsset(ctx, catcher, 480, 462, 190, 92, "catcher");
}

async function drawMania(ctx) {
  const stage = firstProjectFile([/mania-stage-left/, /mania-stage-right/, /mania-stage-bottom/]);
  const key = firstProjectFile([/mania-key\d/]);
  const note = firstProjectFile([/mania-note\d(@2x)?\.png$/]);
  const hold = firstProjectFile([/mania-note\d[lht]/]);
  const light = firstProjectFile([/mania-light/]);
  ctx.fillStyle = "#0b1013";
  ctx.fillRect(390, 112, 360, 452);
  await drawAsset(ctx, stage, 360, 110, 420, 456, "stage");
  for (let lane = 0; lane < 4; lane += 1) {
    ctx.fillStyle = lane % 2 ? "#182127" : "#12191e";
    ctx.fillRect(424 + lane * 74, 130, 70, 400);
    await drawAsset(ctx, note, 431 + lane * 74, 180 + lane * 42, 56, 30, "note");
    await drawAsset(ctx, key, 424 + lane * 74, 522, 70, 34, "key");
  }
  await drawAsset(ctx, hold, 584, 270, 56, 160, "hold");
  await drawAsset(ctx, light, 510, 460, 120, 80, "light");
}

function render() {
  ensureSelectionModel();
  document.body.classList.toggle("compactRows", localStorage.getItem("densityMode") === "compact");
  $("editView").classList.toggle("active", state.view === "edit");
  $("previewView").classList.toggle("active", state.view === "preview");
  $("editShell").classList.toggle("hidden", state.view !== "edit");
  $("previewShell").classList.toggle("hidden", state.view !== "preview");
  $("scopeTabs").classList.toggle("hidden", state.view !== "edit");
  $("categoryTabs").classList.toggle("hidden", state.view !== "edit");
  renderProjects();
  renderSourceSelect();
  renderSources();
  renderProjectHeader();
  renderScopeTabs();
  renderCategoryTabs();
  if (state.view === "edit") renderCompare();
  else renderPreview();
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
  state.history = await api(`/api/projects/${encodeURIComponent(projectId)}/history`).catch(() => []);
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
    full: "Includes SD files, @2x files, stable later, and extras unless unchecked below.",
    sd: "Includes normal-resolution files and excludes @2x assets for a lighter skin.",
    hd: "Includes @2x image assets where possible and excludes SD image assets.",
    diff: "Includes only files changed from the main source and keeps the normal folder layout.",
    backup: "Includes the full editor project for restore or moving to another machine."
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

function renderExportResult(result) {
  const node = $("exportResult");
  node.classList.remove("hidden");
  node.replaceChildren();
  const title = document.createElement("strong");
  title.textContent = "Export result";
  node.append(title);
  for (const item of result.resultSummary || []) {
    const row = document.createElement("div");
    row.className = "exportResultRow";
    row.innerHTML = `<span>${label(item.format)}</span><code>${item.path}</code><strong>${item.count} files</strong>`;
    node.append(row);
  }
  if (!(result.resultSummary || []).length) node.append("No files exported.");
}

function resetExportResult() {
  const node = $("exportResult");
  node.classList.add("hidden");
  node.replaceChildren();
}

function openHistoryOverlay() {
  const list = $("historyList");
  list.replaceChildren();
  for (const entry of state.history) {
    const row = document.createElement("div");
    row.className = "validationWarning";
    row.innerHTML = `<strong>${entry.action}</strong><div>${entry.affectedCount} files · ${new Date(entry.createdAt).toLocaleString()}</div>`;
    list.append(row);
  }
  if (!list.children.length) list.textContent = "No undo history.";
  $("historyOverlay").classList.remove("hidden");
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
  $("densityMode").value = localStorage.getItem("densityMode") || "comfortable";
  $("densityMode").onchange = (event) => {
    localStorage.setItem("densityMode", event.target.value);
    render();
  };
  $("editView").onclick = () => {
    state.view = "edit";
    localStorage.setItem("viewMode", state.view);
    render();
  };
  $("previewView").onclick = () => {
    state.view = "preview";
    localStorage.setItem("viewMode", state.view);
    render();
  };
  $("selectVisible").onclick = () => {
    const source = currentSource();
    if (!source) return;
    for (const row of visibleRows()) {
      if (!(row.cells[source.id]?.missing ?? true)) state.selectedRows.add(row.rowKey);
    }
    renderCompare();
  };
  $("selectMissing").onclick = () => {
    const source = currentSource();
    if (!source) return;
    for (const row of visibleRows()) {
      if (row.cells.project.missing && !(row.cells[source.id]?.missing ?? true)) state.selectedRows.add(row.rowKey);
    }
    renderCompare();
  };
  $("selectWarnings").onclick = () => {
    const source = currentSource();
    if (!source) return;
    for (const row of visibleRows()) {
      const sourceCell = row.cells[source.id] || { warnings: [], missing: true };
      if ((row.warnings.length || row.cells.project.warnings.length || sourceCell.warnings.length) && !sourceCell.missing) state.selectedRows.add(row.rowKey);
    }
    renderCompare();
  };
  $("clearSelection").onclick = () => {
    state.selectedRows.clear();
    renderCompare();
  };
  $("clearCategory").onclick = () => {
    for (const row of visibleRows()) state.selectedRows.delete(row.rowKey);
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
      summary.innerHTML = `<strong>${preview.changed} changed</strong><div class="muted">${preview.unchanged} unchanged · ${preview.missing} missing files · Undo supported</div>`;
      list.append(summary);
      for (const move of preview.moves || []) {
        const item = document.createElement("div");
        item.className = "validationWarning";
        item.textContent = `${move.count} files: ${move.move}`;
        list.append(item);
      }
      for (const example of preview.examples || []) {
        const item = document.createElement("div");
        item.className = "validationWarning";
        item.textContent = `${example.flatPath}: ${example.oldScope}/${example.oldCategory}/${example.oldGroup} -> ${example.newScope}/${example.newCategory}/${example.newGroup}`;
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
  $("historyProject").onclick = openHistoryOverlay;
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
    resetExportResult();
    $("exportOverlay").classList.remove("hidden");
  };
  $("closeExport").onclick = () => $("exportOverlay").classList.add("hidden");
  $("closeValidation").onclick = () => $("validationOverlay").classList.add("hidden");
  $("closeValidationFooter").onclick = () => $("validationOverlay").classList.add("hidden");
  $("closeHistory").onclick = () => $("historyOverlay").classList.add("hidden");
  $("closeHistoryFooter").onclick = () => $("historyOverlay").classList.add("hidden");
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
      renderExportResult(result);
      toast(`Exported ${Object.values(result.counts || {}).reduce((sum, count) => sum + Number(count || 0), 0)} files.`);
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
