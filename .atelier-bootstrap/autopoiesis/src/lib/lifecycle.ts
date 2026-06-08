/**
 * Atelier Autopoiesis — global lifecycle state machine.
 *
 * The `transition()` function in this file is the SINGLE source of
 * truth for legal lifecycle moves. The validator, the producer
 * commands, the query runtime, and the operation layer all consume
 * this same function. There is no other code path that may write
 * `lifecycle_state` to a record without first calling `transition()`
 * (and recording the result in a `PromotionDecision`).
 *
 * Two policies are encoded here:
 *
 *   1. **Transition table** — the legal `from → to` moves. Every
 *      move is a single small step; multi-step transitions must be
 *      expressed as a sequence of `transition()` calls. The
 *      validator rejects `PromotionDecision` records whose
 *      `from_state → to_state` is not in this table.
 *
 *   2. **Provenance policy** — records whose `provenance_kind` is
 *      `llm_extracted` or `llm_derived` CANNOT transition to
 *      `accepted` or `verified`. The producer must re-source the
 *      record with deterministic, manual, or runtime evidence
 *      before it can be promoted. The validator rejects any
 *      SemanticNode that violates this rule (defect code
 *      `E_PROMOTION_LLM_DIRECT_ACCEPT`).
 *
 * Additionally, promotion to `accepted` or `verified` requires:
 *   - non-empty `evidence_refs`
 *   - non-empty `owner_or_policy`
 *   - a defined `authority_scope`
 * The validator applies this gate as a sanity check.
 */
import type {
  LifecycleState,
  AutopoiesisProvenance,
} from './records.ts'

/* -------------------------------------------------------------------------- */
/*                              Transition table                              */
/* -------------------------------------------------------------------------- */

/**
 * The transition table. `TRANSITIONS[from]` is the set of states
 * that are reachable from `from` in a single step.
 *
 * The table is a `Readonly<Record<LifecycleState, ReadonlySet<LifecycleState>>>`
 * so the policy is declarative and the compiler enforces exhaustiveness.
 */
export const TRANSITIONS: Readonly<Record<LifecycleState, ReadonlySet<LifecycleState>>> = {
  observed: new Set<LifecycleState>(['inferred', 'rejected']),
  inferred: new Set<LifecycleState>(['proposed', 'rejected', 'archived']),
  proposed: new Set<LifecycleState>(['accepted', 'rejected', 'archived', 'quarantined']),
  accepted: new Set<LifecycleState>(['verified', 'superseded', 'invalidated', 'archived']),
  verified: new Set<LifecycleState>(['superseded', 'invalidated', 'archived']),
  superseded: new Set<LifecycleState>(['archived']),
  rejected: new Set<LifecycleState>(['archived']),
  quarantined: new Set<LifecycleState>(['rejected', 'archived', 'observed']),
  invalidated: new Set<LifecycleState>(['archived']),
  archived: new Set<LifecycleState>(),
}

/* -------------------------------------------------------------------------- */
/*                             Provenance policy                              */
/* -------------------------------------------------------------------------- */

/**
 * Provenance kinds that are subject to the LLM-prohibited promotion
 * policy. Records in this set may never transition to a state in
 * `LLM_PROHIBITED_PROMOTIONS`.
 */
export const LLM_PROVENANCE_KINDS: ReadonlySet<AutopoiesisProvenance> = new Set<
  AutopoiesisProvenance
>(['llm_extracted', 'llm_derived'])

/**
 * Lifecycle states that an LLM-derived/extracted record may not
 * transition into.
 */
export const LLM_PROHIBITED_PROMOTIONS: ReadonlySet<LifecycleState> = new Set<LifecycleState>([
  'accepted',
  'verified',
])

/* -------------------------------------------------------------------------- */
/*                              Error codes                                   */
/* -------------------------------------------------------------------------- */

export type TransitionErrorCode =
  /** The transition `from → to` is not in the transition table. */
  | 'E_TRANSITION_ILLEGAL'
  /** LLM-derived/extracted records cannot reach this state. */
  | 'E_PROMOTION_LLM_DIRECT_ACCEPT'
  /** `evidence_refs` is empty for an `accepted`/`verified` promotion. */
  | 'E_PROMOTION_MISSING_EVIDENCE'
  /** `owner_or_policy` is empty for an `accepted`/`verified` promotion. */
  | 'E_PROMOTION_MISSING_OWNER'
  /** `authority_scope` is undefined for an `accepted`/`verified` promotion. */
  | 'E_PROMOTION_MISSING_SCOPE'

/* -------------------------------------------------------------------------- */
/*                               Context type                                 */
/* -------------------------------------------------------------------------- */

export type TransitionContext = {
  provenance: AutopoiesisProvenance
  evidence_refs?: ReadonlyArray<string>
  owner_or_policy?: string
  authority_scope?: unknown
  /**
   * When `true` (the default), the LLM-prohibited promotion policy
   * is enforced. Set to `false` only for restore / migrate paths
   * that legitimately bypass the policy.
   */
  enforce_provenance_policy?: boolean
}

/* -------------------------------------------------------------------------- */
/*                              Result type                                   */
/* -------------------------------------------------------------------------- */

export type TransitionResult =
  | { ok: true; from: LifecycleState; to: LifecycleState }
  | { ok: false; code: TransitionErrorCode; message: string }

/* -------------------------------------------------------------------------- */
/*                              Public helpers                                */
/* -------------------------------------------------------------------------- */

export function isTransitionAllowed(from: LifecycleState, to: LifecycleState): boolean {
  return TRANSITIONS[from].has(to)
}

export function isLlmProvenance(provenance: AutopoiesisProvenance): boolean {
  return LLM_PROVENANCE_KINDS.has(provenance)
}

export function isPromotionToProhibited(
  provenance: AutopoiesisProvenance,
  toState: LifecycleState,
): boolean {
  return isLlmProvenance(provenance) && LLM_PROHIBITED_PROMOTIONS.has(toState)
}

/* -------------------------------------------------------------------------- */
/*                              transition()                                  */
/* -------------------------------------------------------------------------- */

/**
 * Apply a lifecycle transition. Returns a discriminated result so
 * callers can pattern-match on success vs. failure.
 *
 * The function checks, in order:
 *   1. `from → to` is in the transition table.
 *   2. The provenance policy does not prohibit the target state.
 *   3. The promotion gate (evidence / owner / scope) is satisfied.
 *
 * The function is pure: it does NOT mutate any record. The caller is
 * responsible for writing the new `lifecycle_state` AND appending a
 * `PromotionDecision` to the autopoiesis NDJSON ledger.
 */
export function transition(
  from: LifecycleState,
  to: LifecycleState,
  ctx: TransitionContext,
): TransitionResult {
  if (!isTransitionAllowed(from, to)) {
    return {
      ok: false,
      code: 'E_TRANSITION_ILLEGAL',
      message: `Illegal lifecycle transition: ${from} -> ${to}`,
    }
  }

  const enforce = ctx.enforce_provenance_policy !== false
  if (enforce && isPromotionToProhibited(ctx.provenance, to)) {
    return {
      ok: false,
      code: 'E_PROMOTION_LLM_DIRECT_ACCEPT',
      message:
        `Records with provenance_kind='${ctx.provenance}' cannot transition to '${to}'; ` +
        `promotion to accepted/verified requires deterministic/manual/runtime evidence.`,
    }
  }

  if (to === 'accepted' || to === 'verified') {
    const evidence = ctx.evidence_refs ?? []
    if (evidence.length === 0) {
      return {
        ok: false,
        code: 'E_PROMOTION_MISSING_EVIDENCE',
        message: `Promotion to '${to}' requires non-empty evidence_refs.`,
      }
    }
    if (!ctx.owner_or_policy || ctx.owner_or_policy.trim() === '') {
      return {
        ok: false,
        code: 'E_PROMOTION_MISSING_OWNER',
        message: `Promotion to '${to}' requires non-empty owner_or_policy.`,
      }
    }
    if (ctx.authority_scope === undefined || ctx.authority_scope === null) {
      return {
        ok: false,
        code: 'E_PROMOTION_MISSING_SCOPE',
        message: `Promotion to '${to}' requires authority_scope to be set.`,
      }
    }
  }

  return { ok: true, from, to }
}
