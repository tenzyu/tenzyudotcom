# Vercel preview admission

Automatic Git deployments are restricted to the production branch `main` in `vercel.json`. The separate preview workflow requests a Git-source deployment only for an open, same-repository PR targeting `main`, using the exact current head SHA. It never checks out PR code and never requests a production target. External forks remain excluded because preview builds may inherit owner credentials (see editor-deployment.md).

## Cutover

1. Configure the repository Actions secret `VERCEL_TOKEN` with access to the existing Vercel project. Do not expose it to PR build code.
2. Review and integrate this change through develop, then release to main under the normal release authority. The privileged workflow is read from the base branch.
3. Ensure every active source branch inherits the new root `vercel.json`. Older branches may still trigger Git deployments because the configuration is source-controlled. Do not assume the policy is globally active until tested; inspect project-wide Git source controls if available without disabling API previews.
4. Verify against Vercel Deployment Records: push a branch without a PR; create/update a develop-target PR; push develop. All must create zero new preview records. Open or update a same-repository main-target PR: exactly one preview for the head SHA, with no production assignment. Re-run the workflow and confirm no additional deployment for the same live SHA. Retarget a PR away from main; subsequent pushes must not request previews. No existing deployments are deleted.
5. Verify that the next separately authorized main release still creates a production deployment and passes the existing CI. Do not publish production solely to test this change.

If any check fails, stop the cutover and investigate. Roll back via a reviewed revert of the two deployment configuration files; this restores native Git auto-preview behavior. Existing CI workflows are unchanged.

References: https://vercel.com/docs/project-configuration/git-configuration and https://vercel.com/docs/rest-api/reference/endpoints/deployments/create-a-new-deployment.
