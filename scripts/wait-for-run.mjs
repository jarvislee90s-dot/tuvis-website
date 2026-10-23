import { execFileSync } from "node:child_process";

// gh run watch does not support fine-grained PAT authentication (checks:read
// cannot be granted on them), so the recovery orchestrator polls the Actions
// REST API for the dispatched deployment run instead.
const defaultSleepMs = (ms) => {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, Date.now() + ms);
};

function ensure(condition, message) {
  if (!condition) throw new Error(message);
}

export function waitForRun(runId, {
  run = execFileSync,
  repository = process.env.GITHUB_REPOSITORY,
  intervalSeconds = 15,
  timeoutSeconds = 1800,
  now = Date.now,
  sleepMs = defaultSleepMs,
  log = () => {},
} = {}) {
  ensure(/^\d+$/.test(String(runId)), "workflow run id must be numeric");
  ensure(repository, "GITHUB_REPOSITORY is required to poll the deployment run");

  const deadline = now() + timeoutSeconds * 1000;
  while (true) {
    const response = JSON.parse(
      run("gh", ["api", `repos/${repository}/actions/runs/${runId}`], { encoding: "utf8" }),
    );
    if (response.status === "completed") {
      if (response.conclusion === "success") return response;
      throw new Error(`deployment run ${runId} finished with conclusion "${response.conclusion}"`);
    }
    log(`deployment run ${runId}: ${response.status}`);
    if (now() >= deadline) {
      throw new Error(`timed out after ${timeoutSeconds}s waiting for deployment run ${runId} (last status: ${response.status})`);
    }
    sleepMs(intervalSeconds * 1000);
  }
}

if (process.argv[1]?.endsWith("wait-for-run.mjs")) {
  try {
    waitForRun(process.env.DEPLOY_RUN_ID ?? "", { log: (message) => console.error(message) });
  } catch (error) {
    console.error(`::error::${error.message}`);
    process.exitCode = 1;
  }
}
