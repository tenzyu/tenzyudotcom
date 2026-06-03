const screens = ['doctor', 'bundles', 'plan', 'inbox', 'rename']

function activate(screen) {
  for (const id of screens) {
    const el = document.getElementById(`screen-${id}`)
    if (!el) continue
    el.hidden = id !== screen
  }
  for (const button of document.querySelectorAll('.tab')) {
    button.setAttribute('aria-selected', button.dataset.screen === screen ? 'true' : 'false')
  }
  if (screen === 'doctor') refreshDoctor()
  if (screen === 'bundles') refreshBundles()
  if (screen === 'inbox') refreshInbox()
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

function renderError(targetId, error) {
  const target = document.getElementById(targetId)
  if (!target) return
  target.innerHTML = `<li class="error">${error.message}</li>`
}

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

async function planContext(event) {
  event.preventDefault()
  const form = event.currentTarget
  const data = readForm(form)
  const output = document.getElementById('plan-output')
  if (output) output.textContent = 'Planning...'
  try {
    const result = await apiPost('/api/context/plan', {
      workflowId: data.workflowId,
      roleIds: data.roleIds.split(',').map((id) => id.trim()).filter(Boolean),
      inputPath: data.inputPath,
      intent: data.intent,
      mode: data.mode,
    })
    if (output) output.textContent = JSON.stringify(result, null, 2)
  } catch (error) {
    if (output) output.textContent = error.message
  }
}

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

async function detectMutations() {
  try {
    const data = await apiGet('/api/status')
    setMutations(data.allowMutations === true)
  } catch (error) {
    setMutations('error')
  }
}

function wireTabs() {
  for (const button of document.querySelectorAll('.tab')) {
    button.addEventListener('click', () => activate(button.dataset.screen))
  }
}

function wireForms() {
  const planForm = document.getElementById('plan-form')
  if (planForm) planForm.addEventListener('submit', planContext)
  const renameForm = document.getElementById('rename-form')
  if (renameForm) renameForm.addEventListener('submit', renameId)
  const refreshDoctorButton = document.querySelector('[data-action="refresh-doctor"]')
  if (refreshDoctorButton) refreshDoctorButton.addEventListener('click', refreshDoctor)
}

function init() {
  wireTabs()
  wireForms()
  detectMutations()
  activate('doctor')
}

init()
