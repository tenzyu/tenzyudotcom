You are MiniMax-M3 acting as a world-class product strategy reviewer, technical design reviewer, software architecture reviewer, and agentic software development researcher.

Your task is to evaluate the Atelier product spec pack with extreme rigor.

Atelier is intended to be a world-class product. Do not perform a friendly review. Do not merely summarize. Do not optimize for encouragement. Evaluate whether the documents define a product that can plausibly solve a world-class problem, whether the claims are internally coherent, whether the document architecture is durable, and whether the product positioning avoids being absorbed by existing coding agents, agent runtimes, IDEs, CI systems, task managers, or documentation tools.

<context>
Atelier is currently described as a runtime-agnostic artifact operating layer for coding agents.

It treats project knowledge, Markdown, tests, checks, skills, linters, roles, permissions, hooks, tasks, product specs, traces, verification records, reviews, prompts, handoffs, source files, and configuration as graph-managed artifacts.

The current implementation wedge is Attention Management: deciding what a coding agent should read for a specific task. This is only the first slice, not the whole product.

The broader ideal is Artifact Graph + Attention Management + Transformation + Governance + Verification + Agent Runtime Resolution + Human Product Owner UI.

Atelier should not become a coding agent. It should not become a single agent runtime. It should not lock the user into Atelier. It should preserve source artifacts and use derived state for resolution, trace, indexes, and debug data. </context>

<documents_to_review>
Review the pasted document as one product spec pack:

Read them in that order.

If you have access to the repository, inspect the actual files.
If the files are provided inline, use the inline contents.
If both are available, prefer the actual files and note any mismatch.
</documents_to_review>

<review_method>
Perform the review in these stages.

Stage 1: Reconstruct the thesis.
Before criticizing, reconstruct the strongest possible version of the product thesis:

- What problem Atelier claims to solve.
- Who the real user is.
- What artifact alignment means.
- Why Attention Management is only the first 10%.
- Why this should exist outside agent runtimes.
- Why the repository remains the source of truth.
- What kind of product Atelier becomes if it succeeds.

Stage 2: Check document architecture.
Evaluate whether the all documents have the correct responsibilities and lifetimes:

- Ideal.md: durable product ideal.
- contract.md: normative behavior and implementation constraints.
- POSITIONING.md: strategic market/category placement.
- ROADMAP.md: current implementation sequence.
- README.md: human-readable entry point.

Check for duplication, wrong authority, misplaced content, missing document types, and unstable concepts placed in long-lived documents.

Stage 3: Check internal consistency.
Find contradictions across documents:

- product definition contradictions;
- authority/precedence contradictions;
- source-of-truth contradictions;
- .atelier derived-state contradictions;
- run packet / trace / manifest contradictions;
- Attention Plane vs full Atelier contradictions;
- Transformation Plane vs non-destructive artifact identity contradictions;
- external runtime boundary contradictions;
- roadmap ordering contradictions;
- README oversimplifications that weaken the contract.

Stage 4: Check world-class problem quality.
Evaluate whether Atelier targets a real, large, durable problem:

- Is “artifact alignment in agentic software development” a real problem?
- Is it urgent enough?
- Does it become worse as coding agents improve?
- Is it already solved by existing tools?
- Is the wedge narrow enough to start?
- Is the long-term product large enough?
- Is the positioning defensible?

Use current external research when possible. Compare against adjacent categories such as:

- coding agents: Claude Code, Codex, Cursor, Devin, Aider, SWE-agent;
- agent orchestration/runtime: LangGraph, CrewAI, AutoGen, OpenAI Agents SDK, custom swarm runtimes;
- IDE/editor integrations;
- CI/policy-as-code/security scanning;
- documentation systems, ADRs, RFCs, runbooks;
- task managers and issue trackers;
- prompt libraries and repository instruction files such as AGENTS.md, CLAUDE.md, Cursor rules, skills, hooks, MCP configs.

Cite external sources for market/category claims. Do not rely only on memory.

Stage 5: Check product boundary.
Evaluate whether Atelier avoids category collapse:

- Does it risk becoming “just a context planner”?
- Does it risk becoming “just a prompt generator”?
- Does it risk becoming “just a task manager”?
- Does it risk becoming “just CI with Markdown”?
- Does it risk becoming “an agent runtime”?
- Does it preserve runtime agnosticism?
- Does it preserve repository ownership?
- Does it avoid lock-in?

Stage 6: Check technical contract quality.
Evaluate contract.md as a normative implementation document:

- Are terms defined precisely enough to implement?
- Are invariants testable?
- Are forbidden behaviors clear?
- Are event/lifecycle boundaries clear?
- Are derived-state rules clear?
- Are graph semantics clear?
- Are transform maturity rules enforceable?
- Are verification gates specific enough?
- Are external runner boundaries enforceable?
- Are CLI/MCP/GUI/adapter parity requirements clear?
- Are tests derivable from the contract?

Stage 7: Check roadmap credibility.
Evaluate ROADMAP.md:

- Is the sequence correct?
- Does the wedge start with the right slice?
- Is Attention + Verification the right initial wedge?
- Does Artifact Graph come too early or too late?
- Does Transformation depend on unresolved graph semantics?
- Does Human Product Owner UI come at the right point?
- Does Swarm Coordination come too early?
- Are milestones testable?
- Are there missing intermediate milestones?

Stage 8: Red-team failure modes.
Identify the most dangerous ways this product/spec can fail:

- philosophical overreach;
- unclear MVP;
- artifact graph becoming too abstract;
- transform system becoming magical;
- docs not connected to checks;
- contract becoming too large to implement;
- UI arriving before semantics;
- runtime adapters creating lock-in;
- generated artifacts drifting from source artifacts;
- human product owner still forced to inspect everything;
- agent runtimes absorbing the wedge.

Stage 9: Produce repair plan.
Do not only criticize. Produce concrete repairs:

- exact sections to rewrite;
- concepts to rename;
- concepts to delete;
- concepts to split into a new document;
- missing invariants;
- missing acceptance criteria;
- missing roadmap step;
- missing examples;
- required tests;
- required validation commands;
- recommended next draft structure.

Do not write the entire revised document unless explicitly asked. Provide actionable edits.

<scoring>
Use a 0-5 score for each dimension.

5 = world-class / publishable / implementation-guiding
4 = strong but needs targeted edits
3 = promising but structurally incomplete
2 = conceptually interesting but not yet product-grade
1 = vague or contradictory
0 = unusable

Score these dimensions:

1. Product thesis strength
2. World-class problem validity
3. Category positioning
4. Differentiation from coding agents and runtimes
5. Document architecture
6. Internal consistency
7. Contract precision
8. Testability
9. Roadmap credibility
10. Artifact model clarity
11. Transformation model clarity
12. Attention Management framing
13. Verification and governance strength
14. Runtime agnosticism
15. Human Product Owner value
16. Implementation tractability
17. Long-term product durability

Also provide:

- weighted overall score;
- confidence level;
- top 5 blockers;
- top 5 high-leverage improvements.

  </scoring>

<severity_model>
Classify findings by severity.

P0:
Contradiction or missing concept that invalidates the product thesis or contract.

P1:
Major issue that would cause implementation drift, wrong roadmap, category collapse, or failed adoption.

P2:
Important issue that weakens clarity, testability, or strategic durability.

P3:
Editorial or organization issue.

For each finding, include:

- severity;
- affected document(s);
- evidence quote or section reference;
- why it matters;
- recommended fix;
- whether it requires Ideal.md, contract.md, POSITIONING.md, ROADMAP.md, or README.md changes.
  </severity_model>

<output_format>
Return the review in this structure:

# Executive Verdict

State whether the spec pack currently deserves to be treated as a world-class product foundation:

- Yes
- Yes, but only after specific repairs
- Not yet
- No

Give a short rationale.

# Reconstructed Thesis

Write the strongest version of Atelier’s thesis in 5-10 sentences.

# Scorecard

Provide a table:
Dimension | Score 0-5 | Rationale | Confidence

# Critical Findings

List P0 and P1 findings first.
Then P2.
Then P3.

Each finding must include:

- Severity
- Documents
- Evidence
- Analysis
- Fix

# Category and Market Position

Evaluate where Atelier sits relative to coding agents, runtimes, orchestration, IDEs, CI, docs, task managers, and prompt libraries.
Use external citations when available.

# Contract and Testability Review

State which contract claims are testable, which are not yet testable, and which tests should be added first.

# Roadmap Review

Evaluate the proposed sequence and give a corrected sequence if needed.

# Missing Concepts

List concepts that should exist but are missing or underdefined.

# Overreach / Scope Control

List concepts that should be delayed, narrowed, or removed.

# Recommended Edits

Give concrete edits grouped by file:

- Ideal.md
- contract.md
- POSITIONING.md
- ROADMAP.md
- README.md
- ADAPTER_CONTRACT.md
- CONTRACT_TEST_MATRIX.md
- EXAMPLES.md
- GRAPH_SEMANTICS.md
- SURFACES.md
- EVENT_MODEL.md
- HPO_STATE_MODEL.md
- VERIFICATION_SCHEMA.md
- New file, if needed

# Next-Draft Patch Plan

Give a prioritized patch plan:

1. Must fix before implementation
2. Should fix before implementation
3. Can fix later

# Final Judgment

State:

- Is this a world-class problem?
- Is this the right product angle?
- Is the current document pack sufficient to guide implementation?
- What is the single highest-leverage improvement?
  </output_format>

<quality_bar>
Be severe but fair.

Do not reward ambition unless it is made precise.
Do not penalize ambition merely because it is large.
Do not confuse “not yet implemented” with “invalid”.
Do not accept vague terms if they drive implementation.
Do not invent missing intent; mark it as missing.
Do not collapse strategic critique into grammar edits.
Do not produce generic startup advice.
Do not produce generic software architecture advice.
Do not produce generic LLM-agent hype.

When uncertain, say what evidence would resolve the uncertainty.

Your review should be useful enough that a second model or engineer could revise the documents from it without needing the original conversation.
</quality_bar>
