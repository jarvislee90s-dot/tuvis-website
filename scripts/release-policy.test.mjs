import { describe, expect, it } from "vitest";
import {
  compareStableTags,
  isLatestStableTag,
  latestStableTag,
  parseStableTag,
  resolveDeployTarget,
  verifyRecoveryMarker,
  assertLatestRecoverableTag,
  assertRecoveryTagSupportsMarker,
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
  it("targets the latest release even when an older tag event arrives late", () => {
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
    })).toEqual({ releaseTag: "v0.7.0", shouldDeploy: true, recovery: false });
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

    expect(resolveDeployTarget({
      eventName: "workflow_dispatch",
      refType: "branch",
      refName: "v0.7.0-redeploy-42-1",
      inputTag: "v0.7.0",
      latestTag: "v0.8.0",
    })).toEqual({ releaseTag: "v0.8.0", shouldDeploy: true, recovery: true });

    expect(() => resolveDeployTarget({
      eventName: "workflow_dispatch",
      refType: "branch",
      refName: "main",
      inputTag: "v0.7.0",
      latestTag: "v0.7.0",
    })).toThrow(/marker branch/);
    expect(resolveDeployTarget({
      eventName: "workflow_dispatch",
      refType: "branch",
      refName: "v0.6.0-redeploy-42-1",
      inputTag: "v0.6.0",
      latestTag: "v0.7.0",
    })).toEqual({ releaseTag: "v0.7.0", shouldDeploy: true, recovery: true });
  });
});

describe("verifyRecoveryMarker", () => {
  it("requires an identical release tree and the release commit as parent", () => {
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
    })).toThrow(/same tree/);
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

  it("refuses legacy releases whose own deploy workflow lacks the marker-safe protocol", () => {
    const markerWorkflow = "# recovery-marker-protocol: v1\non:\n  workflow_dispatch:\n";
    expect(assertRecoveryTagSupportsMarker("v0.7.0", ["v0.6.0", "v0.7.0"], markerWorkflow)).toBe("v0.7.0");
    expect(() => assertRecoveryTagSupportsMarker("v0.6.0", ["v0.6.0"], "on:\n  workflow_dispatch:\n"))
      .toThrow(/predates the same-tree recovery protocol/);
    expect(() => assertRecoveryTagSupportsMarker("v0.6.0", ["v0.6.0", "v0.7.0"], markerWorkflow))
      .toThrow(/only the latest stable release tag/);
  });
});
