import { appendFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { assertLatestRecoverableTag, RECOVERY_TOOL_FILES, verifyRecoveryMarker } from "./release-policy.mjs";
import { remoteTags } from "./release-website.mjs";

function git(...args) {
  return execFileSync("git", args, { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();
}

function ensure(condition, message) {
  if (!condition) throw new Error(message);
}

export function createRedeployMarker({ tag, runId, attempt, workflowSha }) {
  ensure(/^\d+$/.test(String(runId)), "workflow run id must be numeric");
  ensure(/^\d+$/.test(String(attempt)), "workflow run attempt must be numeric");
  ensure(git("status", "--porcelain") === "", "marker creation requires a clean working tree");

  assertLatestRecoverableTag(tag, [...remoteTags("origin").keys()]);
  ensure(/^[0-9a-f]{40}$/i.test(String(workflowSha)), "workflow source SHA must be a full commit SHA");

  git("fetch", "origin", "main", "--quiet");
  git("cat-file", "-e", `${workflowSha}^{commit}`);
  try {
    git("merge-base", "--is-ancestor", workflowSha, "origin/main");
  } catch {
    throw new Error("workflow source SHA must be present in origin/main history");
  }

  const branch = `${tag}-redeploy-${runId}-${attempt}`;
  ensure(!git("ls-remote", "--heads", "origin", `refs/heads/${branch}`), `marker branch ${branch} already exists`);

  const releaseCommit = git("rev-parse", `${tag}^{commit}`);
  git("checkout", "--detach", releaseCommit);
  git("switch", "--create", branch);
  git("checkout", workflowSha, "--", ...RECOVERY_TOOL_FILES);
  git(
    "-c", "user.name=github-actions[bot]",
    "-c", "user.email=41898282+github-actions[bot]@users.noreply.github.com",
    "commit", "--allow-empty", "-m", `chore(redeploy): ${tag} run ${runId}.${attempt}`,
  );

  const markerSha = git("rev-parse", "HEAD");
  const changedPaths = git("diff", "--name-only", `${releaseCommit}..${markerSha}`).split("\n").filter(Boolean);
  verifyRecoveryMarker({
    markerTree: git("rev-parse", "HEAD^{tree}"),
    releaseTree: git("rev-parse", `${tag}^{tree}`),
    markerParents: git("rev-list", "--parents", "-n", "1", "HEAD").split(" ").slice(1),
    releaseCommit,
    changedPaths,
  });
  for (const file of changedPaths) {
    ensure(git("rev-parse", `${markerSha}:${file}`) === git("rev-parse", `${workflowSha}:${file}`),
      `recovery marker support file does not match workflow source: ${file}`);
  }
  git("push", "origin", `HEAD:refs/heads/${branch}`);
  return { branch, markerSha, releaseCommit, workflowSha };
}

if (process.argv[1]?.endsWith("create-redeploy-marker.mjs")) {
  try {
    const marker = createRedeployMarker({
      tag: process.env.RELEASE_TAG ?? "",
      runId: process.env.GITHUB_RUN_ID ?? "",
      attempt: process.env.GITHUB_RUN_ATTEMPT ?? "",
      workflowSha: process.env.WORKFLOW_SOURCE_SHA ?? "",
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
