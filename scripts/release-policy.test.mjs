import { describe, expect, it } from "vitest";
import {
  compareStableTags,
  tuvisContentTag,
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
    expect(parseStableTag("v0.6.3.1")).toEqual([0, 6, 3, 1]);
    expect(parseStableTag("v1.12.3")).toEqual([1, 12, 3]);
    expect(parseStableTag("v0.6.0-deploy.1")).toBeNull();
    expect(parseStableTag("v01.6.0")).toBeNull();
    expect(parseStableTag("0.6.0")).toBeNull();
    expect(tuvisContentTag("v0.6.3.1")).toBe("v0.6.3");
  });

  it("orders numeric components and ignores helper or prerelease tags", () => {
    expect(compareStableTags("v1.10.0", "v1.9.9")).toBeGreaterThan(0);
    expect(compareStableTags("v0.6.3.1", "v0.6.3")).toBeGreaterThan(0);
    expect(latestStableTag(["v0.6.3", "v0.6.3.1"])).toBe("v0.6.3.1");
    expect(
      latestStableTag(["v0.6.0", "v0.6.0-deploy.1", "v0.10.0", "v0.9.9-rc.1"]),
    ).toBe("v0.10.0");
    expect(latestStableTag(["v0.6.0-deploy.1", "v0.9.9-rc.1"])).toBeNull();
    expect(isLatestStableTag("v0.10.0", ["v0.6.0", "v0.10.0"])).toBe(true);
    expect(isLatestStableTag("v0.6.0", ["v0.6.0", "v0.10.0"])).toBe(false);
  });
});

describe("resolveDeployTarget", () => {
  it("keeps each tag event bound to its own release and signals reconciliation for stale tags", () => {
    expect(
      resolveDeployTarget({
        eventName: "push",
        refType: "tag",
        refName: "v0.7.0",
        latestTag: "v0.7.0",
      }),
    ).toEqual({
      releaseTag: "v0.7.0",
      shouldDeploy: true,
      recovery: false,
      reconcileTag: null,
    });

    expect(
      resolveDeployTarget({
        eventName: "push",
        refType: "tag",
        refName: "v0.6.0",
        latestTag: "v0.7.0",
      }),
    ).toEqual({
      releaseTag: "v0.6.0",
      shouldDeploy: false,
      recovery: false,
      reconcileTag: "v0.7.0",
    });
  });

  it("rejects helper tags and non-tag push refs", () => {
    expect(() =>
      resolveDeployTarget({
        eventName: "push",
        refType: "tag",
        refName: "v0.6.0-deploy.1",
        latestTag: "v0.6.0",
      }),
    ).toThrow(/stable release tag/);
    expect(() =>
      resolveDeployTarget({
        eventName: "push",
        refType: "branch",
        refName: "main",
        latestTag: "v0.6.0",
      }),
    ).toThrow(/tag push/);
  });

  it("keeps marker recovery bound to its release and signals reconciliation if it becomes stale", () => {
    expect(
      resolveDeployTarget({
        eventName: "workflow_dispatch",
        refType: "branch",
        refName: "v0.7.0-redeploy-42-1",
        inputTag: "v0.7.0",
        latestTag: "v0.7.0",
      }),
    ).toEqual({
      releaseTag: "v0.7.0",
      shouldDeploy: true,
      recovery: true,
      reconcileTag: null,
    });

    expect(
      resolveDeployTarget({
        eventName: "workflow_dispatch",
        refType: "branch",
        refName: "v0.7.0-redeploy-42-1",
        inputTag: "v0.7.0",
        latestTag: "v0.8.0",
      }),
    ).toEqual({
      releaseTag: "v0.7.0",
      shouldDeploy: false,
      recovery: true,
      reconcileTag: "v0.8.0",
    });

    expect(() =>
      resolveDeployTarget({
        eventName: "workflow_dispatch",
        refType: "branch",
        refName: "main",
        inputTag: "v0.7.0",
        latestTag: "v0.7.0",
      }),
    ).toThrow(/marker branch/);
    expect(
      resolveDeployTarget({
        eventName: "workflow_dispatch",
        refType: "branch",
        refName: "v0.6.0-redeploy-42-1",
        inputTag: "v0.6.0",
        latestTag: "v0.7.0",
      }),
    ).toEqual({
      releaseTag: "v0.6.0",
      shouldDeploy: false,
      recovery: true,
      reconcileTag: "v0.7.0",
    });
  });
});

describe("verifyRecoveryMarker", () => {
  it("requires an identical release tree and the release commit as parent", () => {
    expect(() =>
      verifyRecoveryMarker({
        markerTree: "tree-1",
        releaseTree: "tree-1",
        markerParents: ["tag-commit", "other"],
        releaseCommit: "tag-commit",
      }),
    ).not.toThrow();

    expect(() =>
      verifyRecoveryMarker({
        markerTree: "tree-2",
        releaseTree: "tree-1",
        markerParents: ["tag-commit"],
        releaseCommit: "tag-commit",
      }),
    ).toThrow(/same tree/);
    expect(() =>
      verifyRecoveryMarker({
        markerTree: "tree-1",
        releaseTree: "tree-1",
        markerParents: ["different-commit"],
        releaseCommit: "tag-commit",
      }),
    ).toThrow(/parent the release commit/);
  });
});

describe("assertLatestRecoverableTag", () => {
  it("permits only the latest exact stable release tag", () => {
    expect(assertLatestRecoverableTag("v0.7.0", ["v0.6.0", "v0.7.0"])).toBe(
      "v0.7.0",
    );
    expect(() =>
      assertLatestRecoverableTag("v0.6.0", ["v0.6.0", "v0.7.0"]),
    ).toThrow(/only the latest stable release tag/);
    expect(() =>
      assertLatestRecoverableTag("v0.7.0-deploy.1", ["v0.7.0"]),
    ).toThrow(/stable release tag/);
  });

  it("refuses legacy releases whose own deploy workflow lacks the marker-safe protocol", () => {
    const markerWorkflow =
      "# recovery-marker-protocol: v1\non:\n  workflow_dispatch:\n";
    expect(
      assertRecoveryTagSupportsMarker(
        "v0.7.0",
        ["v0.6.0", "v0.7.0"],
        markerWorkflow,
      ),
    ).toBe("v0.7.0");
    expect(() =>
      assertRecoveryTagSupportsMarker(
        "v0.6.0",
        ["v0.6.0"],
        "on:\n  workflow_dispatch:\n",
      ),
    ).toThrow(/predates the same-tree recovery protocol/);
    expect(() =>
      assertRecoveryTagSupportsMarker(
        "v0.6.0",
        ["v0.6.0", "v0.7.0"],
        markerWorkflow,
      ),
    ).toThrow(/only the latest stable release tag/);
  });
});
