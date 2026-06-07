---
name: atelier-autopoiesis
description: Use when implementing, evaluating, or reviewing Atelier as a self-improving semantic control plane rather than a docs/search/relation demo.
---

# atelier-autopoiesis

Use this skill for any work on Atelier self-improvement, semantic control plane, artifact graph, lifecycle/promotion, authority model, task-local control packets, materialization gates, stale/drift/conflict detection, or OpenCode agent control loops.

## Required docs

Read these before claiming understanding:

```txt
harness/atelier-autopoiesis/MISSION.md
harness/atelier-autopoiesis/GOAL-ATELIER-AUTOPOIESIS.md
harness/atelier-autopoiesis/CAPABILITY-CONTRACT.md
harness/atelier-autopoiesis/EVALUATION-SPEC.md
harness/atelier-autopoiesis/AUTONOMY-CONTRACT.md
harness/atelier-autopoiesis/WORK-ORDER-COMPILER.md
harness/atelier-autopoiesis/FINDING-TAXONOMY.md
```

Use older `harness/atelier-design-docs/**` only as historical/product context. They do not limit the mission.

## Mental model

```txt
Atelier is not RAG.
Atelier is not AGENTS.md management.
Atelier is not a Markdown knowledge graph viewer.
Atelier is not just Relation Kernel.
Atelier is a repo/vault semantic control plane that lets agents ask what is valid, allowed, stale, conflicted, evidenced, and promotable.
```

## Mandatory suspicion

Fail or repair any implementation where:

- generated views become truth;
- handoff becomes authority;
- LLM output jumps to accepted/verified;
- context expansion substitutes for authority/state;
- graph edges exist but authority/promotion does not;
- packets are prompt summaries instead of control packets;
- agents can edit without proposal/evidence linkage;
- stale artifacts vanish instead of moving through lifecycle state;
- completion depends on the user manually creating tickets.
