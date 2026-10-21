const STABLE_TAG = /^v(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/;

// Only deployment plumbing may be overlaid onto a historical release tree for
// workflow_dispatch. The site itself is still built from the official tag.
export const RECOVERY_TOOL_FILES = [
  ".github/workflows/deploy.yml",
  "scripts/assert-latest-release.mjs",
  "scripts/release-policy.mjs",
  "scripts/release-website.mjs",
  "scripts/resolve-deploy-target.mjs",
  "scripts/split-changelog.mjs",
  "scripts/sync-user-manual.mjs",
];

export function parseStableTag(tag) {
  const match = typeof tag === "string" ? STABLE_TAG.exec(tag) : null;
  return match ? match.slice(1).map(Number) : null;
}

export function compareStableTags(left, right) {
  const a = parseStableTag(left);
  const b = parseStableTag(right);
  if (!a || !b) throw new Error("both values must be stable release tags (vMAJOR.MINOR.PATCH)");
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return a[i] - b[i];
  }
  return 0;
}

export function latestStableTag(tags) {
  return tags
    .filter((tag) => parseStableTag(tag))
    .reduce((latest, tag) => (!latest || compareStableTags(tag, latest) > 0 ? tag : latest), null);
}

export function isLatestStableTag(tag, tags) {
  return Boolean(parseStableTag(tag)) && latestStableTag(tags) === tag;
}

export function assertLatestRecoverableTag(tag, tags) {
  if (!parseStableTag(tag)) throw new Error("recovery requires an exact stable release tag (vMAJOR.MINOR.PATCH)");
  if (!isLatestStableTag(tag, tags)) throw new Error("only the latest stable release tag can be manually redeployed");
  return tag;
}

export function resolveDeployTarget({ eventName, refType, refName, inputTag = "", latestTag = null }) {
  if (eventName === "push") {
    if (refType !== "tag") throw new Error("deployment push must be a tag push");
    if (!parseStableTag(refName)) throw new Error("deployment requires a stable release tag (vMAJOR.MINOR.PATCH)");
    return { releaseTag: refName, shouldDeploy: refName === latestTag, recovery: false };
  }

  if (eventName === "workflow_dispatch") {
    if (refType !== "branch" || !parseStableTag(inputTag)) {
      throw new Error("manual redeploy requires a marker branch and a stable release tag");
    }
    const markerPattern = new RegExp(`^${inputTag}-redeploy-\\d+-\\d+$`);
    if (!markerPattern.test(refName ?? "")) {
      throw new Error("manual redeploy requires a marker branch for the selected release tag");
    }
    assertLatestRecoverableTag(inputTag, [latestTag]);
    return { releaseTag: inputTag, shouldDeploy: true, recovery: true };
  }

  throw new Error(`unsupported deployment event: ${eventName}`);
}

export function verifyRecoveryMarker({
  markerTree,
  releaseTree,
  markerParents,
  releaseCommit,
  changedPaths = [],
  allowedChangedPaths = RECOVERY_TOOL_FILES,
}) {
  if (!markerParents.includes(releaseCommit)) throw new Error("recovery marker must parent the release commit");
  if (markerTree !== releaseTree) {
    const allowed = new Set(allowedChangedPaths);
    const outside = changedPaths.filter((file) => !allowed.has(file));
    if (changedPaths.length === 0 || outside.length > 0) {
      throw new Error(`recovery marker changes files outside the recovery support allowlist: ${outside.join(", ") || "unknown"}`);
    }
  }
}
