const screens = {}

function registerScreen(id, label, { onActivate } = {}) {
  screens[id] = { id, label, onActivate }
}

function activate(screenId) {
  for (const [sid, screen] of Object.entries(screens)) {
    const el = document.getElementById(`screen-${sid}`)
    if (!el) continue
    el.hidden = sid !== screenId
  }
  for (const button of document.querySelectorAll('.tab')) {
    button.setAttribute('aria-selected', button.dataset.screen === screenId ? 'true' : 'false')
  }
  screens[screenId]?.onActivate?.()
}

async function apiGet(pathname) {
  const response = await fetch(pathname)
  if (!response.ok) {
    throw new Error(`GET ${pathname} failed: ${response.status}`)
  }
  return response.json()
}

async function apiPost(pathname, body) {
  const response = await fetch(pathname, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body ?? {}),
  })
  const text = await response.text()
  const data = text ? safeJson(text) : {}
  if (!response.ok) {
    const message = data?.error?.message ?? text ?? response.statusText
    throw new Error(`POST ${pathname} failed: ${message}`)
  }
  return data
}

function safeJson(text) {
  try {
    return JSON.parse(text)
  } catch {
    return null
  }
}

function setMutations(allowed) {
  const el = document.getElementById('mutations-status')
  if (!el) return
  el.dataset.allowed = String(allowed)
  el.textContent = allowed ? 'mutations: allowed' : 'mutations: confirm required'
}

function readForm(form) {
  const data = new FormData(form)
  const result = {}
  for (const [key, value] of data.entries()) {
    result[key] = typeof value === 'string' ? value : ''
  }
  for (const checkbox of form.querySelectorAll('input[type="checkbox"]')) {
    result[checkbox.name] = checkbox.checked
  }
  return result
}

function renderError(targetId, error) {
  const target = document.getElementById(targetId)
  if (!target) return
  target.innerHTML = `<li class="error">${error.message}</li>`
}

function renderEmpty(targetId, message) {
  const target = document.getElementById(targetId)
  if (!target) return
  target.innerHTML = `<p class="muted">${message}</p>`
}

function pill(text, className) {
  const el = document.createElement('span')
  el.className = `pill ${className ?? ''}`
  el.textContent = text
  return el
}

function showLoading(targetId) {
  const target = document.getElementById(targetId)
  if (!target) return
  target.innerHTML = '<div class="loading">Loading...</div>'
}

function filterBar(placeholder, handler) {
  const input = document.createElement('input')
  input.className = 'filter-bar'
  input.type = 'text'
  input.placeholder = placeholder
  input.addEventListener('input', () => handler(input.value))
  return input
}

function detailPanel(title, content) {
  const panel = document.createElement('div')
  panel.className = 'detail-panel'
  const header = document.createElement('div')
  header.className = 'detail-panel-header'
  header.innerHTML = `<strong>${title}</strong>`
  const closeBtn = document.createElement('button')
  closeBtn.className = 'close-btn'
  closeBtn.textContent = '✕'
  closeBtn.addEventListener('click', () => panel.remove())
  header.appendChild(closeBtn)
  panel.appendChild(header)
  const body = document.createElement('div')
  body.className = 'detail-panel-body'
  body.appendChild(content)
  panel.appendChild(body)
  return panel
}

// ===== Screen: Doctor =====

registerScreen('doctor', 'Doctor', { onActivate: () => refreshDoctor() })

function renderDoctor(report) {
  const summary = document.getElementById('doctor-summary')
  const list = document.getElementById('doctor-list')
  if (!summary || !list) return
  summary.innerHTML = ''
  const counts = [
    ['Documents', report.summary.documentCount],
    ['Errors', report.summary.errorCount],
    ['Warnings', report.summary.warningCount],
    ['Info', report.summary.infoCount],
  ]
  for (const [label, value] of counts) {
    const card = document.createElement('div')
    card.className = 'card'
    card.innerHTML = `<div class="label">${label}</div><div class="value">${value}</div>`
    summary.appendChild(card)
  }
  list.innerHTML = ''
  for (const diagnostic of report.diagnostics) {
    const li = document.createElement('li')
    li.className = diagnostic.severity
    const location = [diagnostic.path, diagnostic.line].filter(Boolean).join(':')
    li.textContent = `${location ? location + ': ' : ''}${diagnostic.severity.toUpperCase()} ${diagnostic.code}: ${diagnostic.message}`
    list.appendChild(li)
  }
  if (report.diagnostics.length === 0) {
    const li = document.createElement('li')
    li.textContent = 'No diagnostics.'
    list.appendChild(li)
  }
}

async function refreshDoctor() {
  try {
    const report = await apiGet('/api/doctor')
    renderDoctor(report)
  } catch (error) {
    renderError('doctor-list', error)
  }
}

// ===== Screen: Role Bundles =====

registerScreen('bundles', 'Role Bundles')

async function refreshBundles() {
  const target = document.getElementById('bundles')
  if (!target) return
  try {
    const data = await apiGet('/api/role-bundles')
    const entries = Object.entries(data ?? {})
    if (entries.length === 0) {
      target.innerHTML = '<p class="muted">No role bundles generated yet. Run <code>atelier index</code>.</p>'
      return
    }
    target.innerHTML = ''
    for (const [roleId, bundle] of entries) {
      const div = document.createElement('div')
      div.className = 'bundle'
      const pinned = bundle.pinned?.length ? bundle.pinned : []
      const matched = bundle.matched?.length ? bundle.matched : []
      div.innerHTML = `
        <h3>${roleId}</h3>
        <div class="muted">${bundle.warnings?.length ? `warnings: ${bundle.warnings.length}` : 'no warnings'}</div>
        <h4 class="muted">Pinned</h4>
        <ul>${pinned.map((id) => `<li>${id}</li>`).join('') || '<li class="muted">none</li>'}</ul>
        <h4 class="muted">Matched</h4>
        <ul>${matched.map((id) => `<li>${id}</li>`).join('') || '<li class="muted">none</li>'}</ul>
      `
      target.appendChild(div)
    }
  } catch (error) {
    target.innerHTML = `<p class="muted">${error.message}</p>`
  }
}

// ===== Screen: Context Plan =====

registerScreen('plan', 'Context Plan')

async function planContext(event) {
  event.preventDefault()
  const form = event.currentTarget
  const data = readForm(form)
  const output = document.getElementById('plan-output')
  if (!output) return

  output.innerHTML = '<div class="loading">Planning...</div>'

  try {
    const result = await apiPost('/api/context/plan', {
      workflowId: data.workflowId,
      roleIds: data.roleIds.split(',').map((id) => id.trim()).filter(Boolean),
      inputPath: data.inputPath,
      intent: data.intent,
      mode: data.mode,
      selectorV2: data.selectorV2 === true,
    })

    output.innerHTML = ''

    // Dynamically discover document arrays
    const selected = []
    const skipped = []
    for (const [key, val] of Object.entries(result)) {
      if (!Array.isArray(val) || val.length === 0) continue
      if (typeof val[0] !== 'object' || val[0] === null) continue
      if (!('id' in val[0] || 'title' in val[0])) continue
      if (key === 'skipped') {
        skipped.push(...val)
      } else {
        selected.push(...val)
      }
    }

    const warnings = result.warnings ?? []
    const tokenBudget = result.tokenBudget ?? null
    const envelope = result.permissions ?? result.permissionEnvelope ?? result.envelope ?? null

    // Summary cards
    const summary = document.createElement('div')
    summary.className = 'summary'
    summary.appendChild(cardEl('Selected', String(selected.length), 'success'))
    summary.appendChild(cardEl('Skipped', String(skipped.length), ''))
    if (warnings.length > 0) {
      summary.appendChild(cardEl('Warnings', String(warnings.length), 'warning'))
    }
    output.appendChild(summary)

    // Token budget bar
    if (tokenBudget?.total > 0) {
      const pct = Math.min(tokenBudget.percentage ?? 0, 100)
      const el = document.createElement('div')
      el.style.marginBottom = '1rem'
      el.innerHTML = `<strong>Token Budget</strong><div class="coverage-bar"><div class="coverage-covered" style="width:${pct}%"></div></div><span class="muted">${tokenBudget.used ?? 0} / ${tokenBudget.total} (${pct}%)</span>`
      output.appendChild(el)
    }

    // Selected documents
    if (selected.length > 0) {
      const h = document.createElement('h3')
      h.textContent = 'Selected Documents'
      output.appendChild(h)
      for (const doc of selected) output.appendChild(docEntry(doc, false))
    }

    // Skipped documents
    if (skipped.length > 0) {
      const h = document.createElement('h3')
      h.textContent = 'Skipped Documents'
      output.appendChild(h)
      for (const doc of skipped) output.appendChild(docEntry(doc, true))
    }

    // Warnings
    if (warnings.length > 0) {
      const h = document.createElement('h3')
      h.textContent = 'Warnings'
      output.appendChild(h)
      for (const w of warnings) {
        const b = document.createElement('div')
        b.className = 'banner warning'
        b.textContent = typeof w === 'string' ? w : w.message ?? JSON.stringify(w)
        output.appendChild(b)
      }
    }

    // Permission envelope
    if (envelope) {
      const h = document.createElement('h3')
      h.textContent = 'Permission Envelope'
      output.appendChild(h)
      const pre = document.createElement('pre')
      pre.className = 'output'
      pre.textContent = JSON.stringify(envelope, null, 2)
      output.appendChild(pre)
    }

    // Raw JSON
    const h = document.createElement('h3')
    h.textContent = 'Raw JSON'
    output.appendChild(h)
    const raw = document.createElement('pre')
    raw.className = 'plan-output'
    raw.textContent = JSON.stringify(result, null, 2)
    output.appendChild(raw)

  } catch (error) {
    output.innerHTML = ''
    output.textContent = error.message
  }
}

function cardEl(label, value, modifier) {
  const el = document.createElement('div')
  el.className = `card ${modifier ?? ''}`
  el.innerHTML = `<div class="label">${label}</div><div class="value">${value}</div>`
  return el
}

function docEntry(doc, isSkipped) {
  const div = document.createElement('div')
  div.className = 'artifact-card'
  if (isSkipped) div.style.opacity = '0.5'
  const kind = doc.kind ?? doc.type ?? (doc.id ? doc.id.split('.').at(0) : null)
  if (kind) div.appendChild(pill(kind, kind))
  const idSpan = document.createElement('span')
  idSpan.className = 'artifact-id'
  idSpan.textContent = doc.id ?? doc.title ?? '?'
  div.appendChild(idSpan)
  if (doc.reason) {
    const r = document.createElement('span')
    r.className = 'artifact-path'
    r.textContent = doc.reason
    div.appendChild(r)
  }
  if (doc.tokenEstimate != null) {
    div.appendChild(pill(`~${doc.tokenEstimate}`, ''))
  }
  return div
}

// ===== Screen: Knowledge Inbox =====

registerScreen('inbox', 'Knowledge Inbox', { onActivate: () => refreshInbox() })

async function refreshInbox() {
  const list = document.getElementById('inbox')
  if (!list) return
  try {
    const data = await apiGet('/api/knowledge')
    const proposals = data.proposals ?? []
    if (proposals.length === 0) {
      list.innerHTML = '<li class="muted">No proposals on disk.</li>'
      return
    }
    list.innerHTML = ''
    for (const proposal of proposals) {
      const li = document.createElement('li')
      li.innerHTML = `
        <div><strong>${proposal.title ?? '(untitled)'}</strong></div>
        <div class="meta">${proposal.path}</div>
        <div class="meta">status: ${proposal.status} · type: ${proposal.knowledgeType ?? '?'} · run: ${proposal.runId ?? '—'}</div>
      `
      list.appendChild(li)
    }
  } catch (error) {
    list.innerHTML = `<li class="error">${error.message}</li>`
  }
}

// ===== Screen: ID Rename =====

registerScreen('rename', 'ID Rename')

async function renameId(event) {
  event.preventDefault()
  const form = event.currentTarget
  const data = readForm(form)
  const output = document.getElementById('rename-output')
  if (output) output.textContent = 'Running...'
  try {
    const result = await apiPost('/api/id/rename', {
      oldId: data.oldId,
      newId: data.newId,
      write: data.write === true,
      confirm: data.confirm === true,
    })
    if (output) output.textContent = JSON.stringify(result, null, 2)
  } catch (error) {
    if (output) output.textContent = error.message
  }
}

// ===== M17 Screen Stubs (implemented by parallel agents) =====

// Graph Overview
registerScreen('graph', 'Graph', { onActivate: () => refreshGraph() })

let _graphArtifacts = []
let _graphFilterKind = null
let _graphFilterText = ''

async function refreshGraph() {
  showLoading('graph-summary')
  showLoading('graph-breakdown')
  showLoading('graph-list')
  const blamePanel = document.getElementById('graph-blame-panel')
  if (blamePanel) blamePanel.innerHTML = ''
  try {
    const [graphSnapshot, status] = await Promise.all([
      apiGet('/api/graph'),
      apiGet('/api/status')
    ])
    _graphArtifacts = graphSnapshot.artifacts ?? []
    _graphFilterKind = null
    _graphFilterText = ''
    renderGraphSummary(graphSnapshot, status)
    renderGraphBreakdown(status?.graph?.kindCounts ?? {})
    setupGraphFilter()
    renderGraphList()
  } catch (error) {
    renderError('graph-list', error)
  }
}

function setupGraphFilter() {
  const container = document.getElementById('graph-filter-bar')
  if (!container) return
  container.innerHTML = ''
  const input = filterBar('Filter artifacts by ID or path...', (value) => {
    _graphFilterText = value.toLowerCase()
    renderGraphList()
  })
  container.appendChild(input)
}

function renderGraphSummary(graphSnapshot, status) {
  const target = document.getElementById('graph-summary')
  if (!target) return
  target.innerHTML = ''
  if (status?.stale) {
    const banner = document.createElement('div')
    banner.className = 'banner warning'
    banner.textContent = 'Graph is stale — rescan recommended'
    target.appendChild(banner)
  }
  const g = status?.graph ?? {}
  const totalArtifacts = g.artifactCount ?? graphSnapshot.artifacts?.length ?? 0
  const totalEdges = g.edgeCount ?? graphSnapshot.edges?.length ?? 0
  const staleCount = g.staleArtifacts?.length ?? 0
  const orphanedCount = g.orphanedArtifacts?.length ?? 0
  const cards = [
    ['Total Artifacts', totalArtifacts, ''],
    ['Total Edges', totalEdges, ''],
  ]
  if (staleCount > 0) cards.push(['Stale Artifacts', staleCount, 'warning'])
  if (orphanedCount > 0) cards.push(['Orphaned Artifacts', orphanedCount, 'error'])
  for (const [label, value, className] of cards) {
    const card = document.createElement('div')
    card.className = 'card' + (className ? ' ' + className : '')
    card.innerHTML = `<div class="label">${label}</div><div class="value">${value}</div>`
    target.appendChild(card)
  }
}

function renderGraphBreakdown(kindCounts) {
  const target = document.getElementById('graph-breakdown')
  if (!target) return
  target.innerHTML = ''
  const container = document.createElement('div')
  container.className = 'filter-pills'
  const allPill = pill('all', 'active')
  allPill.addEventListener('click', () => {
    _graphFilterKind = null
    container.querySelectorAll('.pill').forEach(p => { p.classList.remove('active') })
    allPill.classList.add('active')
    renderGraphList()
  })
  container.appendChild(allPill)
  for (const [kind, count] of Object.entries(kindCounts)) {
    const p = pill(`${kind} (${count})`, kind)
    p.addEventListener('click', () => {
      _graphFilterKind = kind
      container.querySelectorAll('.pill').forEach(p => { p.classList.remove('active') })
      p.classList.add('active')
      renderGraphList()
    })
    container.appendChild(p)
  }
  target.appendChild(container)
}

function renderGraphList() {
  const target = document.getElementById('graph-list')
  if (!target) return
  target.innerHTML = ''
  let filtered = _graphArtifacts
  if (_graphFilterKind) {
    filtered = filtered.filter(a => a.kind === _graphFilterKind)
  }
  if (_graphFilterText) {
    const t = _graphFilterText
    filtered = filtered.filter(a =>
      (a.id && a.id.toLowerCase().includes(t)) ||
      (a.path && a.path.toLowerCase().includes(t))
    )
  }
  if (filtered.length === 0) {
    renderEmpty('graph-list', 'No artifacts match the current filter.')
    return
  }
  for (const artifact of filtered) {
    const card = document.createElement('div')
    card.className = 'artifact-card'
    card.appendChild(pill(artifact.kind, artifact.kind))
    const idSpan = document.createElement('span')
    idSpan.className = 'artifact-id'
    idSpan.textContent = artifact.id
    card.appendChild(idSpan)
    if (artifact.path) {
      const pathSpan = document.createElement('span')
      pathSpan.className = 'artifact-path'
      const p = artifact.path
      pathSpan.textContent = p.length > 60 ? '...' + p.slice(-57) : p
      card.appendChild(pathSpan)
    }
    card.appendChild(pill(artifact.status ?? 'active', artifact.status ?? 'active'))
    card.addEventListener('click', () => showGraphBlame(artifact.id))
    target.appendChild(card)
  }
}

async function showGraphBlame(artifactId) {
  const container = document.getElementById('graph-blame-panel')
  if (!container) return
  container.innerHTML = '<div class="loading">Loading...</div>'
  try {
    const blame = await apiGet(`/api/graph/blame/${encodeURIComponent(artifactId)}`)
    const body = document.createElement('div')
    if (blame.artifact) {
      const a = blame.artifact
      const info = document.createElement('div')
      info.innerHTML = `
        <div><strong>${a.id}</strong></div>
        <div class="meta-row">kind: ${a.kind}</div>
        <div class="meta-row">path: ${a.path ?? '—'}</div>
        <div class="meta-row">status: ${a.status ?? 'active'}</div>
      `
      body.appendChild(info)
    } else {
      const p = document.createElement('p')
      p.className = 'muted'
      p.textContent = `Artifact "${artifactId}" not found.`
      body.appendChild(p)
    }
    const inEdges = blame.incomingEdges ?? []
    const outEdges = blame.outgoingEdges ?? []
    if (inEdges.length > 0) {
      const h4 = document.createElement('h4')
      h4.textContent = `Incoming Edges (${inEdges.length})`
      body.appendChild(h4)
      for (const edge of inEdges) {
        const d = document.createElement('div')
        d.className = 'finding'
        d.innerHTML = `
          <div class="finding-header">
            <span>${edge.from}</span>
            <span class="muted">→</span>
            ${pill(edge.kind, edge.kind).outerHTML}
            <span class="muted">→</span>
            <span>${edge.to}</span>
          </div>
          <div class="meta-row">confidence: ${edge.confidence ?? '—'}</div>
        `
        body.appendChild(d)
      }
    }
    if (outEdges.length > 0) {
      const h4 = document.createElement('h4')
      h4.textContent = `Outgoing Edges (${outEdges.length})`
      body.appendChild(h4)
      for (const edge of outEdges) {
        const d = document.createElement('div')
        d.className = 'finding'
        d.innerHTML = `
          <div class="finding-header">
            <span>${edge.from}</span>
            <span class="muted">→</span>
            ${pill(edge.kind, edge.kind).outerHTML}
            <span class="muted">→</span>
            <span>${edge.to}</span>
          </div>
          <div class="meta-row">confidence: ${edge.confidence ?? '—'}</div>
        `
        body.appendChild(d)
      }
    }
    if (inEdges.length === 0 && outEdges.length === 0) {
      const p = document.createElement('p')
      p.className = 'muted'
      p.textContent = 'No edges connected to this artifact.'
      body.appendChild(p)
    }
    const panel = detailPanel(`Blame: ${artifactId}`, body)
    container.appendChild(panel)
  } catch (error) {
    container.innerHTML = `<p class="error">${error.message}</p>`
  }
}

// Control Coverage
registerScreen('controls', 'Controls', { onActivate: () => refreshControls() })

async function refreshControls() {
  showLoading('controls-list')
  showLoading('controls-orphaned')
  const summary = document.getElementById('controls-summary')
  if (summary) summary.innerHTML = ''

  try {
    const [coverage] = await Promise.all([
      apiGet('/api/controls/coverage'),
      apiGet('/api/controls/list'),
    ])
    renderControlsSummary(coverage)
    const filterBarEl = document.getElementById('controls-filter-bar')
    if (filterBarEl) {
      filterBarEl.innerHTML = ''
      filterBarEl.appendChild(filterBar('Filter by knowledge ID or path...', (text) => {
        renderControlsList(coverage.entries ?? [], text)
      }))
    }
    renderControlsList(coverage.entries ?? [], '')
    renderOrphanedControls(coverage.orphanedControls ?? [])
  } catch (error) {
    renderError('controls-list', error)
    renderError('controls-orphaned', error)
  }
}

function renderControlsSummary(report) {
  const target = document.getElementById('controls-summary')
  if (!target) return
  target.innerHTML = ''

  const totalCard = document.createElement('div')
  totalCard.className = 'card'
  totalCard.innerHTML = `<div class="label">Knowledge Items</div><div class="value">${report.totalKnowledge}</div>`
  target.appendChild(totalCard)

  const coveredCard = document.createElement('div')
  coveredCard.className = 'card success'
  coveredCard.innerHTML = `<div class="label">Covered</div><div class="value">${report.coveredKnowledge}</div>`
  target.appendChild(coveredCard)

  if (report.uncoveredKnowledge > 0) {
    const uncoveredCard = document.createElement('div')
    uncoveredCard.className = 'card error'
    uncoveredCard.innerHTML = `<div class="label">Uncovered</div><div class="value">${report.uncoveredKnowledge}</div>`
    target.appendChild(uncoveredCard)
  }

  const controlsCard = document.createElement('div')
  controlsCard.className = 'card'
  controlsCard.innerHTML = `<div class="label">Controls</div><div class="value">${report.totalControls}</div>`
  target.appendChild(controlsCard)

  const orphanedCount = report.orphanedControls?.length ?? 0
  const orphanedCard = document.createElement('div')
  orphanedCard.className = orphanedCount > 0 ? 'card error' : 'card'
  orphanedCard.innerHTML = `<div class="label">Orphaned Controls</div><div class="value">${orphanedCount}</div>`
  target.appendChild(orphanedCard)

  if (report.typeCounts) {
    const typePills = document.createElement('div')
    typePills.className = 'type-counts'
    for (const [type, count] of Object.entries(report.typeCounts)) {
      typePills.appendChild(pill(`${type}: ${count}`, 'control-mechanism'))
    }
    target.appendChild(typePills)
  }
}

function renderControlsList(entries, filterText) {
  const target = document.getElementById('controls-list')
  if (!target) return
  target.innerHTML = ''

  const filter = (filterText ?? '').toLowerCase().trim()
  const filtered = filter
    ? entries.filter((e) =>
        e.knowledgeId.toLowerCase().includes(filter) ||
        (e.knowledgePath && e.knowledgePath.toLowerCase().includes(filter))
      )
    : entries

  if (filtered.length === 0) {
    target.innerHTML = '<p class="muted">No coverage entries match the filter.</p>'
    return
  }

  for (const entry of filtered) {
    const div = document.createElement('div')
    div.className = 'bundle'

    const header = document.createElement('div')
    header.innerHTML = `<strong>${entry.knowledgeId}</strong>`
    if (entry.knowledgePath) {
      header.innerHTML += ` <span class="muted">${entry.knowledgePath}</span>`
    }
    div.appendChild(header)

    const pct = Math.round((entry.coverageScore ?? 0) * 100)
    const bar = document.createElement('div')
    bar.className = 'coverage-bar'
    bar.innerHTML = `
      <div class="coverage-covered" style="width:${pct}%"></div>
      <div class="coverage-uncovered" style="width:${100 - pct}%"></div>
    `
    div.appendChild(bar)

    const scoreLabel = document.createElement('div')
    scoreLabel.style.fontSize = '0.8rem'
    scoreLabel.style.color = 'var(--muted)'
    scoreLabel.textContent = `Coverage: ${pct}%`
    div.appendChild(scoreLabel)

    if (entry.controls?.length) {
      const row = document.createElement('div')
      row.style.cssText = 'margin-top:0.35rem;display:flex;gap:0.3rem;flex-wrap:wrap;align-items:center'
      const label = document.createElement('span')
      label.style.cssText = 'font-size:0.8rem;color:var(--muted)'
      label.textContent = 'controls: '
      row.appendChild(label)
      for (const ctrl of entry.controls) {
        row.appendChild(pill(ctrl.name || ctrl.id || ctrl.type, 'control-mechanism'))
      }
      div.appendChild(row)
    }

    if (entry.missingTypes?.length) {
      const row = document.createElement('div')
      row.style.cssText = 'margin-top:0.25rem;display:flex;gap:0.3rem;flex-wrap:wrap;align-items:center'
      const label = document.createElement('span')
      label.style.cssText = 'font-size:0.8rem;color:var(--error)'
      label.textContent = 'missing: '
      row.appendChild(label)
      for (const mt of entry.missingTypes) {
        row.appendChild(pill(mt, 'orphaned'))
      }
      div.appendChild(row)
    }

    target.appendChild(div)
  }
}

function renderOrphanedControls(orphanedControls) {
  const target = document.getElementById('controls-orphaned')
  if (!target) return
  target.innerHTML = ''

  if (!orphanedControls?.length) {
    target.innerHTML = '<p class="muted">No orphaned controls.</p>'
    return
  }

  const heading = document.createElement('h3')
  heading.textContent = 'Orphaned Controls'
  target.appendChild(heading)

  for (const ctrl of orphanedControls) {
    const div = document.createElement('div')
    div.className = 'finding'

    const header = document.createElement('div')
    header.className = 'finding-header'
    header.appendChild(pill(ctrl.type, 'orphaned'))

    const nameSpan = document.createElement('strong')
    nameSpan.textContent = ctrl.name || ctrl.id || '(unnamed)'
    header.appendChild(nameSpan)
    div.appendChild(header)

    if (ctrl.path) {
      const pathRow = document.createElement('div')
      pathRow.className = 'finding-detail'
      pathRow.textContent = ctrl.path
      div.appendChild(pathRow)
    }

    if (ctrl.provenance) {
      const provRow = document.createElement('div')
      provRow.className = 'finding-detail'
      provRow.textContent = `provenance: ${ctrl.provenance}`
      div.appendChild(provRow)
    }

    target.appendChild(div)
  }
}

// Drift Dashboard
registerScreen('drift', 'Drift', { onActivate: () => refreshDrift() })

async function refreshDrift() {
  showLoading('drift-findings')
  try {
    const result = await apiGet('/api/reconcile')
    renderDriftSummary(result)
    renderDriftFindings(result.findings)
  } catch (error) {
    renderError('drift-findings', error)
  }
}

function renderDriftSummary(result) {
  const summary = document.getElementById('drift-summary')
  if (!summary) return
  summary.innerHTML = ''

  const riskStyles = {
    silent: 'risk-silent',
    'auto-reconcile': 'risk-auto-reconcile',
    advisory: 'risk-advisory',
    task: 'risk-task',
    'human-decision': 'risk-human-decision',
    block: 'risk-block',
  }

  const totalCard = document.createElement('div')
  totalCard.className = 'card'
  totalCard.innerHTML = `<div class="label">Total Findings</div><div class="value">${result.findings.length}</div>`
  summary.appendChild(totalCard)

  for (const [action, count] of Object.entries(result.riskActionCounts ?? {})) {
    const card = document.createElement('div')
    card.className = `card ${riskStyles[action] ?? ''}`
    card.innerHTML = `<div class="label">${action}</div><div class="value">${count}</div>`
    summary.appendChild(card)
  }

  const eventCard = document.createElement('div')
  eventCard.className = 'card'
  eventCard.innerHTML = `<div class="label">Events</div><div class="value">${result.eventCount ?? 0}</div>`
  summary.appendChild(eventCard)
}

function renderDriftFindings(findings, filterRiskAction) {
  const target = document.getElementById('drift-findings')
  if (!target) return
  target.innerHTML = ''

  const riskStyles = {
    silent: 'risk-silent',
    'auto-reconcile': 'risk-auto-reconcile',
    advisory: 'risk-advisory',
    task: 'risk-task',
    'human-decision': 'risk-human-decision',
    block: 'risk-block',
  }

  const filterPills = document.createElement('div')
  filterPills.className = 'filter-pills'

  const allPill = document.createElement('button')
  allPill.className = filterRiskAction ? 'pill' : 'pill active'
  allPill.textContent = 'All'
  allPill.addEventListener('click', () => renderDriftFindings(findings))
  filterPills.appendChild(allPill)

  const actions = ['silent', 'auto-reconcile', 'advisory', 'task', 'human-decision', 'block']
  for (const action of actions) {
    const pillEl = document.createElement('button')
    pillEl.className = filterRiskAction === action ? 'pill active' : 'pill'
    pillEl.textContent = action
    pillEl.addEventListener('click', () => renderDriftFindings(findings, action))
    filterPills.appendChild(pillEl)
  }
  target.appendChild(filterPills)

  const filtered = filterRiskAction
    ? findings.filter((f) => f.riskAction === filterRiskAction)
    : findings

  if (filtered.length === 0) {
    const msg = document.createElement('p')
    msg.className = 'muted'
    msg.textContent = 'No findings.'
    target.appendChild(msg)
    return
  }

  for (const finding of filtered) {
    const div = document.createElement('div')
    div.className = `finding ${riskStyles[finding.riskAction] ?? ''}`

    const header = document.createElement('div')
    header.className = 'finding-header'
    header.appendChild(pill(finding.riskAction, riskStyles[finding.riskAction]))
    header.appendChild(pill(finding.kind))
    const idSpan = document.createElement('span')
    idSpan.className = 'finding-id'
    idSpan.textContent = finding.artifactId
    header.appendChild(idSpan)
    div.appendChild(header)

    const message = document.createElement('div')
    message.className = 'finding-message'
    message.textContent = finding.message
    div.appendChild(message)

    const detail = document.createElement('div')
    detail.className = 'finding-detail'
    detail.textContent = finding.artifactPath
    div.appendChild(detail)

    if (finding.details) {
      const detailsPre = document.createElement('pre')
      detailsPre.className = 'finding-details'
      detailsPre.textContent = JSON.stringify(finding.details, null, 2)
      div.appendChild(detailsPre)
    }

    const createBtn = document.createElement('button')
    createBtn.className = 'finding-action'
    createBtn.textContent = 'Create Task'
    createBtn.addEventListener('click', () => createTaskFromFinding(finding))
    div.appendChild(createBtn)

    target.appendChild(div)
  }
}

async function createTaskFromFinding(finding) {
  try {
    await apiPost('/api/tasks/create', {
      title: `Drift: ${finding.message.slice(0, 80)}`,
      description: JSON.stringify(finding),
      scope: finding.artifactPath,
    })
    alert('Task created successfully.')
  } catch (error) {
    alert(`Failed to create task: ${error.message}`)
  }
}

// Task Builder
registerScreen('tasks', 'Tasks', { onActivate: () => refreshTaskList() })

async function refreshTaskList() {
  const list = document.getElementById('task-list')
  if (!list) return
  showLoading('task-list')
  try {
    const tasks = await apiGet('/api/tasks')
    if (!tasks || tasks.length === 0) {
      renderEmpty('task-list', 'No tasks yet. Use the form above to create one.')
      return
    }
    list.innerHTML = ''
    for (const task of tasks) {
      const div = document.createElement('div')
      div.className = 'bundle'

      const statusStyles = {
        pending: '',
        in_progress: 'knowledge',
        completed: 'run',
        cancelled: '',
        blocked: 'orphaned',
      }
      const statusPill = pill(task.status ?? 'pending', statusStyles[task.status] ?? '')

      const created = task.createdAt ? new Date(task.createdAt).toLocaleString() : ''
      const updated = task.updatedAt ? new Date(task.updatedAt).toLocaleString() : ''
      const roles = task.assignedRoles?.length ? task.assignedRoles.join(', ') : ''
      const agent = task.assignedAgent || ''
      const phase = task.phase || ''
      const scope = task.scope || ''
      const metaParts = [phase, scope].filter(Boolean)
      if (roles) metaParts.push(`Roles: ${roles}`)
      if (agent) metaParts.push(`Agent: ${agent}`)

      div.innerHTML = `
        <div><code>${task.id}</code> <strong>${task.title}</strong> ${statusPill.outerHTML}</div>
        ${metaParts.length ? `<div class="meta">${metaParts.join(' · ')}</div>` : ''}
        <div class="meta">Created: ${created}${updated ? ` · Updated: ${updated}` : ''}</div>
        ${task.description ? `<div class="meta">${task.description}</div>` : ''}
      `
      list.appendChild(div)
    }
  } catch (error) {
    renderError('task-list', error)
  }
}

async function createTaskAction(event) {
  event.preventDefault()
  const form = event.currentTarget
  const data = readForm(form)
  const roleIds = data.roleIds ? data.roleIds.split(',').map((id) => id.trim()).filter(Boolean) : undefined
  try {
    await apiPost('/api/tasks/create', {
      title: data.title,
      description: data.description,
      phase: data.phase || undefined,
      scope: data.scope || undefined,
      roleIds,
      parentTask: data.parentTask || null,
    })
    form.reset()
    await refreshTaskList()
  } catch (error) {
    const list = document.getElementById('task-list')
    if (list) list.innerHTML = `<li class="error">${error.message}</li>`
  }
}

async function createRoleAction(event) {
  event.preventDefault()
  const form = event.currentTarget
  const data = readForm(form)
  const pinned = data.pinned ? data.pinned.split(',').map((id) => id.trim()).filter(Boolean) : undefined
  try {
    await apiPost('/api/roles/create', { id: data.id, title: data.title, pinned })
    form.reset()
  } catch (error) {
    const list = document.getElementById('task-list')
    if (list) list.innerHTML = `<li class="error">${error.message}</li>`
  }
}

// Permission Console
registerScreen('policy', 'Policy')

async function checkPolicyAction(event) {
  event.preventDefault()
  const form = event.currentTarget
  const data = readForm(form)
  const output = document.getElementById('policy-output')
  if (!output) return
  const params = new URLSearchParams()
  if (data.path) params.set('path', data.path)
  if (data.command) params.set('command', data.command)
  if (data.tool) params.set('tool', data.tool)
  output.textContent = 'Checking...'
  try {
    const result = await apiGet(`/api/policy/check?${params.toString()}`)
    output.textContent = JSON.stringify(result, null, 2)
  } catch (error) {
    output.textContent = error.message
  }
}

async function refreshPolicyRules() {
  const target = document.getElementById('policy-rules')
  if (!target) return
  showLoading('policy-rules')
  try {
    const result = await apiGet('/api/policy/explain')
    if (!result || (Array.isArray(result) && result.length === 0)) {
      renderEmpty('policy-rules', 'No policy rules configured.')
      return
    }
    target.innerHTML = ''
    if (Array.isArray(result)) {
      for (const rule of result) {
        const finding = document.createElement('div')
        finding.className = 'finding'
        if (typeof rule === 'object' && rule !== null) {
          const header = document.createElement('div')
          header.className = 'finding-header'
          const name = document.createElement('strong')
          name.textContent = rule.name ?? rule.id ?? rule.rule ?? 'Rule'
          header.appendChild(name)
          const decision = rule.decision ?? rule.effect ?? null
          if (decision) {
            const cls = decision === 'allow' ? 'active' : decision === 'deny' ? 'risk-block' : 'risk-advisory'
            header.appendChild(pill(decision, cls))
          }
          finding.appendChild(header)
          const summary = rule.summary ?? rule.description ?? rule.explain ?? ''
          if (summary) {
            const msg = document.createElement('div')
            msg.className = 'finding-message'
            msg.textContent = summary
            finding.appendChild(msg)
          }
        } else {
          finding.textContent = String(rule)
        }
        target.appendChild(finding)
      }
    } else if (typeof result === 'object' && result !== null) {
      const dl = document.createElement('dl')
      for (const [key, value] of Object.entries(result)) {
        const dt = document.createElement('dt')
        dt.textContent = key
        const dd = document.createElement('dd')
        dd.textContent = typeof value === 'object' ? JSON.stringify(value) : String(value)
        dl.appendChild(dt)
        dl.appendChild(dd)
      }
      target.appendChild(dl)
    } else {
      target.textContent = JSON.stringify(result, null, 2)
      target.className = 'output'
    }
  } catch (error) {
    target.innerHTML = `<p class="muted">${error.message}</p>`
  }
}

// ===== Tab building and initialization =====

function buildTabs() {
  const nav = document.querySelector('.tabs')
  if (!nav) return
  nav.innerHTML = ''
  for (const [id, screen] of Object.entries(screens)) {
    const button = document.createElement('button')
    button.className = 'tab'
    button.role = 'tab'
    button.dataset.screen = id
    button.textContent = screen.label
    button.addEventListener('click', () => activate(id))
    nav.appendChild(button)
  }
}

function wireForms() {
  const planForm = document.getElementById('plan-form')
  if (planForm) planForm.addEventListener('submit', planContext)
  const renameForm = document.getElementById('rename-form')
  if (renameForm) renameForm.addEventListener('submit', renameId)
  const taskCreateForm = document.getElementById('task-create-form')
  if (taskCreateForm) taskCreateForm.addEventListener('submit', createTaskAction)
  const roleCreateForm = document.getElementById('role-create-form')
  if (roleCreateForm) roleCreateForm.addEventListener('submit', createRoleAction)
  const policyCheckForm = document.getElementById('policy-check-form')
  if (policyCheckForm) policyCheckForm.addEventListener('submit', checkPolicyAction)
  for (const button of document.querySelectorAll('[data-action]')) {
    const action = button.dataset.action
    if (action === 'refresh-doctor') button.addEventListener('click', refreshDoctor)
    else if (action === 'refresh-graph') button.addEventListener('click', refreshGraph)
    else if (action === 'refresh-controls') button.addEventListener('click', refreshControls)
    else if (action === 'refresh-drift') button.addEventListener('click', refreshDrift)
    else if (action === 'refresh-policy') button.addEventListener('click', refreshPolicyRules)
  }
}

async function detectMutations() {
  try {
    const data = await apiGet('/api/status')
    setMutations(data.allowMutations === true)
  } catch (error) {
    setMutations('error')
  }
}

function init() {
  buildTabs()
  wireForms()
  detectMutations()
  activate('doctor')
}

init()
