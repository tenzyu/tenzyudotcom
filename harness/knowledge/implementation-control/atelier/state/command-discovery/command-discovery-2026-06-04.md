# Command Discovery 2026-06-04

```yaml
discovery_id: command-discovery-2026-06-04
recorded_at: 2026-06-04T00:00:00Z
recorded_by: control-doc-repair
baseline_revision: 71a9700171fdea8466c0d20221d02896a99cc081
package_manager_detection:
  selected: bun
  evidence:
    - root package.json packageManager: bun@1.3.10
    - bun.lock exists
    - bun --version: 1.3.13
nx_detection:
  selected: bun nx
  evidence:
    - nx.json exists
    - root devDependency nx: 22.7.2
    - bun nx --version: Local v22.7.2; Global not found
fallback_order_recorded:
  - bun nx show projects
  - bun nx show project <project>
  - pnpm nx show projects if pnpm metadata exists
  - yarn nx show projects if yarn metadata exists
  - npx nx show projects if npm metadata exists
  - non-Nx package/workspace/build-tool script discovery if Nx metadata is absent or all Nx commands fail
commands_run:
  - command: bun nx show projects
    status: passed
    output_projects:
      - "@tenzyu/chatgpt-partial-html-export"
      - skin-workbench
      - osu-skin-core
      - linter
      - castalia
      - atelier
      - ui
      - web
  - command: bun nx show project atelier
    status: passed
    resolved_root: product/apps/atelier
    resolved_source_root: product/apps/atelier/src
    resolved_targets:
      - typecheck
      - context
      - run-capsule
      - doctor
      - scan
      - graph
      - graph-status
      - graph-check
      - context-plan
      - mcp
      - gui
      - policy-check
      - policy-explain
      - policy-simulate
      - task-create
      - task-status
      - task-close
      - task-split
      - run-create
      - run-list
      - run-handoff
      - run-inspect
      - run-resume
      - run-verify
      - run-complete
      - role-create
      - role-edit
      - controls-list
      - controls-coverage
      - controls-missing
      - reconcile
      - repair
      - build
      - test
      - check
      - verify
root_scripts:
  - affected:build
  - affected:check
  - build
  - check
  - format
  - lint
  - test
  - typecheck
  - verify
  - nx
  - graph
  - policy:deps
  - lint:workspace
  - verify:workspace
  - test:scripts
  - build:docs-map
  - docs-rename
atelier_package_scripts:
  - build
  - typecheck
  - test
  - check
  - doctor
  - context
  - run-capsule
canonical_project_check:
  command: bun nx run atelier:check
  target: atelier:check
  source: nx project target
non_nx_fallback_used: false
non_nx_target_source: N/A because Nx discovery passed
status: passed_for_discovery_control_packets
product_code_packet_status: blocked_until_assigned_gate_records_and_traceability_rows_are_concrete
```
