import { describe, expect, it } from "vitest";
import {
  compareStableTags,
  isLatestStableTag,
  latestStableTag,
  parseStableTag,
  resolveDeployTarget,
  verifyRecoveryMarker,
  assertLatestRecoverableTag,
  RECOVERY_TOOL_FILES,
} from "./release-policy.mjs";

describe("stable release tags", () => {
  it("accepts only exact vMAJOR.MINOR.PATCH tags", () => {
    expect(parseStableTag("v0.6.0")).toEqual([0, 6, 0]);
    expect(parseStableTag("v1.12.3")).toEqual([1, 12, 3]);
    expect(parseStableTag("v0.6.0-deploy.1")).toBeNull();
    expect(parseStableTag("v01.6.0")).toBeNull();
    expect(parseStableTag("0.6.0")).toBeNull();
  });

  it("orders numeric components and ignores helper or prerelease tags", () => {
    expect(compareStableTags("v1.10.0", "v1.9.9")).toBeGreaterThan(0);
    expect(latestStableTag(["v0.6.0", "v0.6.0-deploy.1", "v0.10.0", "v0.9.9-rc.1"])).toBe("v0.10.0");
    expect(latestStableTag(["v0.6.0-deploy.1", "v0.9.9-rc.1"])).toBeNull();
    expect(isLatestStableTag("v0.10.0", ["v0.6.0", "v0.10.0"])).toBe(true);
    expect(isLatestStableTag("v0.6.0", ["v0.6.0", "v0.10.0"])).toBe(false);
  });
});

describe("resolveDeployTarget", () => {
  it("deploys a stable tag only when it is still the latest formal release", () => {
    expect(resolveDeployTarget({
      eventName: "push",
      refType: "tag",
      refName: "v0.7.0",
      latestTag: "v0.7.0",
    })).toEqual({ releaseTag: "v0.7.0", shouldDeploy: true, recovery: false });

    expect(resolveDeployTarget({
      eventName: "push",
      refType: "tag",
      refName: "v0.6.0",
      latestTag: "v0.7.0",
    })).toEqual({ releaseTag: "v0.6.0", shouldDeploy: false, recovery: false });
  });

  it("rejects helper tags and non-tag push refs", () => {
    expect(() => resolveDeployTarget({
      eventName: "push",
      refType: "tag",
      refName: "v0.6.0-deploy.1",
      latestTag: "v0.6.0",
    })).toThrow(/stable release tag/);
    expect(() => resolveDeployTarget({
      eventName: "push",
      refType: "branch",
      refName: "main",
      latestTag: "v0.6.0",
    })).toThrow(/tag push/);
  });

  it("allows recovery only from a marker branch for the latest stable tag", () => {
    expect(resolveDeployTarget({
      eventName: "workflow_dispatch",
      refType: "branch",
      refName: "v0.7.0-redeploy-42-1",
      inputTag: "v0.7.0",
      latestTag: "v0.7.0",
    })).toEqual({ releaseTag: "v0.7.0", shouldDeploy: true, recovery: true });

    expect(() => resolveDeployTarget({
      eventName: "workflow_dispatch",
      refType: "branch",
      refName: "main",
      inputTag: "v0.7.0",
      latestTag: "v0.7.0",
    })).toThrow(/marker branch/);
    expect(() => resolveDeployTarget({
      eventName: "workflow_dispatch",
      refType: "branch",
      refName: "v0.6.0-redeploy-42-1",
      inputTag: "v0.6.0",
      latestTag: "v0.7.0",
    })).toThrow(/latest stable release/);
  });
});

describe("verifyRecoveryMarker", () => {
  it("requires a release parent and limits marker tree changes to deployment support files", () => {
    expect(() => verifyRecoveryMarker({
      markerTree: "tree-1",
      releaseTree: "tree-1",
      markerParents: ["tag-commit", "other"],
      releaseCommit: "tag-commit",
    })).not.toThrow();

    expect(() => verifyRecoveryMarker({
      markerTree: "tree-2",
      releaseTree: "tree-1",
      markerParents: ["tag-commit"],
      releaseCommit: "tag-commit",
      changedPaths: [".github/workflows/deploy.yml", "scripts/release-policy.mjs"],
      allowedChangedPaths: RECOVERY_TOOL_FILES,
    })).not.toThrow();

    expect(() => verifyRecoveryMarker({
      markerTree: "tree-2",
      releaseTree: "tree-1",
      markerParents: ["tag-commit"],
      releaseCommit: "tag-commit",
      changedPaths: ["src/App.tsx"],
      allowedChangedPaths: RECOVERY_TOOL_FILES,
    })).toThrow(/outside the recovery support allowlist/);
    expect(() => verifyRecoveryMarker({
      markerTree: "tree-1",
      releaseTree: "tree-1",
      markerParents: ["different-commit"],
      releaseCommit: "tag-commit",
    })).toThrow(/parent the release commit/);
  });
});

describe("assertLatestRecoverableTag", () => {
  it("permits only the latest exact stable release tag", () => {
    expect(assertLatestRecoverableTag("v0.7.0", ["v0.6.0", "v0.7.0"])).toBe("v0.7.0");
    expect(() => assertLatestRecoverableTag("v0.6.0", ["v0.6.0", "v0.7.0"]))
      .toThrow(/only the latest stable release tag/);
    expect(() => assertLatestRecoverableTag("v0.7.0-deploy.1", ["v0.7.0"]))
      .toThrow(/stable release tag/);
  });
});
