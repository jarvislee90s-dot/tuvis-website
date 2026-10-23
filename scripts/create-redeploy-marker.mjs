import { appendFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { assertRecoveryTagSupportsMarker, verifyRecoveryMarker } from "./release-policy.mjs";
import { remoteTags } from "./release-website.mjs";

// GITHUB_TOKEN pushes that introduce a tree containing workflow files are
// rejected by GitHub (issue #7), so the marker — whose tree must equal the
// release tag's tree — is created through the Git data API, never via git push.
const ACTIONS_BOT = { name: "github-actions[bot]", email: "41898282+github-actions[bot]@users.noreply.github.com" };

function ensure(condition, message) {
  if (!condition) throw new Error(message);
}

export function createRedeployMarker({
  tag,
  runId,
  attempt,
  run = execFileSync,
  listRemoteTags = remoteTags,
  repository = process.env.GITHUB_REPOSITORY,
}) {
  ensure(/^\d+$/.test(String(runId)), "workflow run id must be numeric");
  ensure(/^\d+$/.test(String(attempt)), "workflow run attempt must be numeric");
  const git = (...args) => run("git", args, { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();
  ensure(git("status", "--porcelain") === "", "marker creation requires a clean working tree");

  let deployWorkflow = "";
  try { deployWorkflow = git("show", `${tag}:.github/workflows/deploy.yml`); } catch { /* handled by protocol validation */ }
  assertRecoveryTagSupportsMarker(tag, [...listRemoteTags("origin").keys()], deployWorkflow);

  const branch = `${tag}-redeploy-${runId}-${attempt}`;
  ensure(!git("ls-remote", "--heads", "origin", `refs/heads/${branch}`), `marker branch ${branch} already exists`);

  const releaseCommit = git("rev-parse", `${tag}^{commit}`);
  const releaseTree = git("rev-parse", `${tag}^{tree}`);
  ensure(/^[\w.-]+\/[\w.-]+$/.test(repository ?? ""), "GITHUB_REPOSITORY must look like owner/repo");

  const ghApi = (path, body) =>
    run("gh", ["api", "--method", "POST", "--header", "X-GitHub-Api-Version: 2022-11-28", path, "--input", "-"], {
      encoding: "utf8",
      input: JSON.stringify(body),
    });

  const commit = JSON.parse(ghApi(`/repos/${repository}/git/commits`, {
    message: `chore(redeploy): ${tag} run ${runId}.${attempt}`,
    tree: releaseTree,
    parents: [releaseCommit],
    author: ACTIONS_BOT,
    committer: ACTIONS_BOT,
  }));
  verifyRecoveryMarker({
    markerTree: commit.tree.sha,
    releaseTree,
    markerParents: commit.parents.map((parent) => parent.sha),
    releaseCommit,
  });

  const ref = JSON.parse(ghApi(`/repos/${repository}/git/refs`, { ref: `refs/heads/${branch}`, sha: commit.sha }));
  ensure(ref.ref === `refs/heads/${branch}` && ref.object?.sha === commit.sha, "GitHub did not create the marker branch at the verified commit");
  return { branch, markerSha: commit.sha, releaseCommit };
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
