import { appendFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { assertRecoveryTagSupportsMarker, verifyRecoveryMarker } from "./release-policy.mjs";
import { remoteTags } from "./release-website.mjs";

function git(...args) {
  return execFileSync("git", args, { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();
}

function ensure(condition, message) {
  if (!condition) throw new Error(message);
}

export function createRedeployMarker({ tag, runId, attempt }) {
  ensure(/^\d+$/.test(String(runId)), "workflow run id must be numeric");
  ensure(/^\d+$/.test(String(attempt)), "workflow run attempt must be numeric");
  ensure(git("status", "--porcelain") === "", "marker creation requires a clean working tree");

  let deployWorkflow = "";
  try { deployWorkflow = git("show", `${tag}:.github/workflows/deploy.yml`); } catch { /* handled by protocol validation */ }
  assertRecoveryTagSupportsMarker(tag, [...remoteTags("origin").keys()], deployWorkflow);

  const branch = `${tag}-redeploy-${runId}-${attempt}`;
  ensure(!git("ls-remote", "--heads", "origin", `refs/heads/${branch}`), `marker branch ${branch} already exists`);

  const releaseCommit = git("rev-parse", `${tag}^{commit}`);
  git("checkout", "--detach", releaseCommit);
  git("switch", "--create", branch);
  git(
    "-c", "user.name=github-actions[bot]",
    "-c", "user.email=41898282+github-actions[bot]@users.noreply.github.com",
    "commit", "--allow-empty", "-m", `chore(redeploy): ${tag} run ${runId}.${attempt}`,
  );

  const markerSha = git("rev-parse", "HEAD");
  verifyRecoveryMarker({
    markerTree: git("rev-parse", "HEAD^{tree}"),
    releaseTree: git("rev-parse", `${tag}^{tree}`),
    markerParents: git("rev-list", "--parents", "-n", "1", "HEAD").split(" ").slice(1),
    releaseCommit,
  });
  git("push", "origin", `HEAD:refs/heads/${branch}`);
  return { branch, markerSha, releaseCommit };
}

if (process.argv[1]?.endsWith("create-redeploy-marker.mjs")) {
  try {
    const marker = createRedeployMarker({
      tag: process.env.RELEASE_TAG ?? "",
      runId: process.env.GITHUB_RUN_ID ?? "",
      attempt: process.env.GITHUB_RUN_ATTEMPT ?? "",
    });
    for (const [key, value] of Object.entries({ branch: marker.branch, marker_sha: marker.markerSha })) {
      console.log(`${key}=${value}`);
      if (process.env.GITHUB_OUTPUT) appendFileSync(process.env.GITHUB_OUTPUT, `${key}=${value}\n`);
    }
  } catch (error) {
    console.error(`::error::${error.message}`);
    process.exitCode = 1;
  }
}
