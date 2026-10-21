import { appendFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { latestStableTag, RECOVERY_TOOL_FILES, resolveDeployTarget, verifyRecoveryMarker } from "./release-policy.mjs";
import { remoteTags } from "./release-website.mjs";

function git(...args) {
  return execFileSync("git", args, { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();
}

export function resolveCurrentDeployTarget(env = process.env) {
  // This resolver is checked out from main so that recovery of an older release can
  // use current workflow code. Inspect the event ref by its immutable SHA instead.
  const eventSha = env.GITHUB_SHA || git("rev-parse", "HEAD");

  const latestTag = latestStableTag([...remoteTags("origin").keys()]);
  const target = resolveDeployTarget({
    eventName: env.GITHUB_EVENT_NAME,
    refType: env.GITHUB_REF_TYPE,
    refName: env.GITHUB_REF_NAME,
    inputTag: env.INPUT_RELEASE_TAG,
    latestTag,
  });

  if (!target.recovery) {
    const taggedCommit = git("rev-parse", `${target.releaseTag}^{commit}`);
    if (taggedCommit !== eventSha) throw new Error("tag event SHA does not match the selected stable release tag");
  }

  if (target.recovery) {
    const releaseCommit = git("rev-parse", `${target.releaseTag}^{commit}`);
    const workflowSourceSha = env.INPUT_WORKFLOW_SOURCE_SHA ?? "";
    if (!/^[0-9a-f]{40}$/i.test(workflowSourceSha)) {
      throw new Error("recovery dispatch requires the full workflow source SHA");
    }
    git("cat-file", "-e", `${workflowSourceSha}^{commit}`);
    try {
      git("merge-base", "--is-ancestor", workflowSourceSha, "origin/main");
    } catch {
      throw new Error("recovery workflow source SHA must be present in origin/main history");
    }
    const changedPaths = git("diff", "--name-only", `${releaseCommit}..${eventSha}`).split("\n").filter(Boolean);
    verifyRecoveryMarker({
      markerTree: git("rev-parse", `${eventSha}^{tree}`),
      releaseTree: git("rev-parse", `${target.releaseTag}^{tree}`),
      markerParents: git("rev-list", "--parents", "-n", "1", eventSha).split(" ").slice(1),
      releaseCommit,
      changedPaths,
    });
    for (const file of RECOVERY_TOOL_FILES) {
      let markerBlob;
      let sourceBlob;
      try {
        markerBlob = git("rev-parse", `${eventSha}:${file}`);
        sourceBlob = git("rev-parse", `${workflowSourceSha}:${file}`);
      } catch {
        throw new Error(`recovery marker or workflow source is missing support file: ${file}`);
      }
      if (markerBlob !== sourceBlob) {
        throw new Error(`recovery marker support file does not match workflow source: ${file}`);
      }
    }
  }

  return {
    ...target,
    latestTag,
    workflowSha: eventSha,
    workflowToolsSha: target.recovery ? env.INPUT_WORKFLOW_SOURCE_SHA : eventSha,
  };
}

if (process.argv[1]?.endsWith("resolve-deploy-target.mjs")) {
  try {
    const target = resolveCurrentDeployTarget();
    if (!target.shouldDeploy) console.log(`::notice::skipping stale release ${target.releaseTag}; latest is ${target.latestTag}`);
    const values = {
      release_tag: target.releaseTag,
      should_deploy: String(target.shouldDeploy),
      recovery: String(target.recovery),
      workflow_tools_sha: target.workflowToolsSha,
    };
    for (const [key, value] of Object.entries(values)) {
      console.log(`${key}=${value}`);
      if (process.env.GITHUB_OUTPUT) appendFileSync(process.env.GITHUB_OUTPUT, `${key}=${value}\n`);
    }
  } catch (error) {
    console.error(`::error::${error.message}`);
    process.exitCode = 1;
  }
}
