import { appendFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { latestStableTag, resolveDeployTarget, verifyRecoveryMarker } from "./release-policy.mjs";
import { remoteTags } from "./release-website.mjs";

function git(...args) {
  return execFileSync("git", args, { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();
}

export function resolveCurrentDeployTarget(env = process.env) {
  // Keep each tag event bound to its own SHA. Stale events request a same-tree
  // marker deployment of the current latest stable tag through reconcileTag.
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
    const eventTagCommit = git("rev-parse", `${env.GITHUB_REF_NAME}^{commit}`);
    if (eventTagCommit !== eventSha) throw new Error("tag event SHA does not match the pushed stable tag");
  }

  if (target.recovery) {
    const recoveryTag = env.INPUT_RELEASE_TAG;
    const releaseCommit = git("rev-parse", `${recoveryTag}^{commit}`);
    verifyRecoveryMarker({
      markerTree: git("rev-parse", `${eventSha}^{tree}`),
      releaseTree: git("rev-parse", `${recoveryTag}^{tree}`),
      markerParents: git("rev-list", "--parents", "-n", "1", eventSha).split(" ").slice(1),
      releaseCommit,
    });
  }

  return {
    ...target,
    latestTag,
    workflowSha: eventSha,
  };
}

if (process.argv[1]?.endsWith("resolve-deploy-target.mjs")) {
  try {
    const target = resolveCurrentDeployTarget();
    if (target.reconcileTag) {
      console.log(`::notice::${target.releaseTag} is stale; queueing a same-tree deployment for ${target.reconcileTag}`);
    }
    const values = {
      release_tag: target.releaseTag,
      should_deploy: String(target.shouldDeploy),
      recovery: String(target.recovery),
      reconcile_tag: target.reconcileTag ?? "",
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
