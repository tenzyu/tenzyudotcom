// Local simulation only. This module never executes a candidate or resumes work.
import { closeSync, fsyncSync, mkdirSync, openSync, readFileSync, renameSync, rmdirSync, writeFileSync } from 'node:fs';
import { randomUUID } from 'node:crypto';

const text = (value) => typeof value === 'string' && value.trim().length > 0;
const requireText = (value, name) => { if (!text(value)) throw new Error(`${name} is required`); };
const sameIdentity = (a, b) => b && ['task', 'worktree', 'session'].every((key) => a[key] === b[key]);

/** One state file per task. Caller must use a private, trusted local directory. */
export function updateCandidate(file, event) {
  const lock = `${file}.lock`;
  mkdirSync(lock); // A leftover lock is deliberately not stolen after a crash.
  try {
    let state;
    try { state = JSON.parse(readFileSync(file, 'utf8')); }
    catch (error) { if (error.code !== 'ENOENT') throw error; }
    const next = transition(state, event);
    const temp = `${file}.${randomUUID()}.tmp`;
    const fd = openSync(temp, 'wx', 0o600);
    try { writeFileSync(fd, `${JSON.stringify(next, null, 2)}\n`); fsyncSync(fd); }
    finally { closeSync(fd); }
    renameSync(temp, file);
    return next;
  } finally { rmdirSync(lock); }
}

function transition(state, event) {
  if (!event || typeof event !== 'object') throw new Error('event required');
  if (!state) {
    if (event.type !== 'propose') throw new Error('proposal required');
    requireText(event.identity?.task, 'task');
    for (const key of ['worktree', 'session']) {
      if (event.identity[key] !== undefined) requireText(event.identity[key], key);
    }
    for (const key of ['receivedAt', 'project', 'source', 'original']) requireText(event[key], key);
    if (!Number.isSafeInteger(event.maxAttempts) || event.maxAttempts < 1) throw new Error('positive attempt limit required');
    return { version: 1, identity: { task: event.identity.task, ...(event.identity.worktree !== undefined && { worktree: event.identity.worktree }), ...(event.identity.session !== undefined && { session: event.identity.session }) }, receivedAt: event.receivedAt, project: event.project, source: event.source, original: event.original, status: 'proposed', maxAttempts: event.maxAttempts, attempts: 0, checkpoint: null, approval: null, pause: null };
  }
  if (state.version !== 1 || !event.identity || state.identity.task !== event.identity.task || ['worktree', 'session'].some((key) => state.identity[key] !== undefined && state.identity[key] !== event.identity[key])) throw new Error('identity mismatch or invalid state');
  if (!['proposed', 'blocked_approval'].includes(state.status) && !sameIdentity(state.identity, event.identity)) throw new Error('identity mismatch');
  const next = { ...state };
  switch (event.type) {
    case 'block_approval':
      if (state.status !== 'proposed') throw new Error('only a proposal can be blocked');
      requireText(event.reason, 'block reason');
      next.status = 'blocked_approval';
      next.blockReason = event.reason;
      break;
    case 'approve':
      if (!['proposed', 'blocked_approval'].includes(state.status)) throw new Error('only an unapproved proposal can be approved');
      requireText(event.approval, 'explicit approval');
      for (const key of ['worktree', 'session']) requireText(event.identity[key], key);
      next.identity = { task: state.identity.task, worktree: event.identity.worktree, session: event.identity.session };
      next.approval = event.approval;
      next.status = 'approved';
      break;
    case 'start':
      if (state.status !== 'approved') throw new Error('not approved or already started');
      if (state.attempts >= state.maxAttempts) throw new Error('attempt limit reached');
      next.attempts++;
      next.status = 'running';
      break;
    case 'checkpoint':
      if (state.status !== 'running') throw new Error('not running');
      requireText(event.checkpoint, 'checkpoint');
      next.checkpoint = event.checkpoint;
      break;
    case 'pause_rate_limit':
      if (state.status !== 'running') throw new Error('not running');
      requireText(event.condition, 'resume condition');
      next.pause = { condition: event.condition };
      next.status = 'paused_rate_limit';
      break;
    case 'resume':
      if (state.status !== 'paused_rate_limit') throw new Error('not paused');
      requireText(event.evidence, 'manual resume evidence');
      if (event.condition !== state.pause.condition) throw new Error('resume condition mismatch');
      if (state.attempts >= state.maxAttempts) throw new Error('attempt limit reached');
      next.attempts++;
      next.pause = { ...state.pause, evidence: event.evidence };
      next.status = 'running';
      break;
    case 'fail':
    case 'complete':
      if (state.status !== 'running') throw new Error('not running');
      requireText(event.detail, 'outcome detail');
      next.status = event.type === 'fail' ? 'failed' : 'completed';
      next.outcome = event.detail;
      break;
    default: throw new Error('invalid transition');
  }
  return next;
}
