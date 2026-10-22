import { appendFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { parseStableTag } from "./release-policy.mjs";

export function dispatchLatestRedeploy(tag, { run = execFileSync, repository = process.env.GITHUB_REPOSITORY } = {}) {
  if (!parseStableTag(tag)) throw new Error("reconciliation requires a stable release tag");
  if (!repository) throw new Error("GITHUB_REPOSITORY is required to queue a latest-tag redeploy");

  const response = run("gh", [
    "api", "--method", "POST",
    "--header", "X-GitHub-Api-Version: 2022-11-28",
    `/repos/${repository}/actions/workflows/redeploy-latest.yml/dispatches`,
    "-F", "ref=main",
    "-F", `inputs[release_tag]=${tag}`,
    "-F", "return_run_details=true",
  ], { encoding: "utf8" });
  const runId = JSON.parse(response).workflow_run_id;
  if (!Number.isSafeInteger(runId) || runId <= 0) throw new Error("GitHub did not return the recovery workflow run id");

  return runId;
}

if (process.argv[1]?.endsWith("dispatch-latest-redeploy.mjs")) {
  try {
    const tag = process.env.RECONCILE_TAG ?? "";
    const runId = dispatchLatestRedeploy(tag);
    console.log(`recovery_run_id=${runId}`);
    if (process.env.GITHUB_OUTPUT) appendFileSync(process.env.GITHUB_OUTPUT, `recovery_run_id=${runId}\n`);
  } catch (error) {
    console.error(`::error::${error.message}`);
    process.exitCode = 1;
  }
}
