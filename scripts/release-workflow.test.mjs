import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const deploy = readFileSync(resolve(root, ".github/workflows/deploy.yml"), "utf8");
const recovery = readFileSync(resolve(root, ".github/workflows/redeploy-latest.yml"), "utf8");
const reconciliation = readFileSync(resolve(root, "scripts/dispatch-latest-redeploy.mjs"), "utf8");

describe("release workflow policy", () => {
  it("checks release events before the deploy job and serializes that job with one pending run", () => {
    expect(deploy).toContain('tags: ["v*"]');
    expect(deploy).not.toMatch(/^\s+schedule:/m);
    expect(deploy).not.toMatch(/^\s+repository_dispatch:/m);
    expect(deploy).not.toMatch(/^concurrency:/m);
    expect(deploy).toContain("resolve:");
    expect(deploy).toContain("needs: resolve");
    expect(deploy).toMatch(/deploy:\n[\s\S]*?concurrency:\n      group: github-pages-production\n      cancel-in-progress: false/);
    expect(deploy).not.toContain("queue: max");
    expect((deploy.match(/resolve-deploy-target\.mjs/g) ?? []).length).toBe(2);
    expect((deploy.match(/dispatch-latest-redeploy\.mjs/g) ?? []).length).toBe(3);
    expect(deploy).toContain("TUVIS_RELEASE_SOURCE_DIR: ../tuvis-source");
    expect(deploy).toContain("recovery-marker-protocol: v1");
    expect(deploy).toContain("reconcile_tag: ${{ steps.target.outputs.reconcile_tag }}");
    expect(deploy).toContain("Queue a same-tree deployment for a newer tag");
    expect(deploy).toContain("Queue the latest tag if this event became stale while waiting");
    expect(deploy).toContain("Queue a same-tree deployment if a newer tag arrived during the build");
    expect(deploy).toContain("Recheck latest release before deployment");
    expect(deploy).not.toContain("RECONCILE_WAIT");
    expect(reconciliation).not.toContain('"run", "watch"');
    expect(deploy).toContain('run: node scripts/assert-latest-release.mjs "$RELEASE_TAG"');
    expect(deploy).toMatch(/Fetch the event ref for lock-time validation[\s\S]*?working-directory: event-tools/);
    expect(deploy).toMatch(/Resolve the latest release after acquiring the deployment lock[\s\S]*?working-directory: event-tools/);
    expect(deploy).toMatch(/Recheck latest release before deployment[\s\S]*?working-directory: workflow-tools/);
  });

  it("keeps stale-event reconciliation asynchronous to avoid recovery-lock cycles", () => {
    const requeueBlocks = deploy.match(/- name: (?:Queue a same-tree deployment for a newer tag|Queue the latest tag if this event became stale while waiting|Queue a same-tree deployment if a newer tag arrived during the build)[\s\S]*?(?=\n      - |\n  #|$)/g) ?? [];

    expect(requeueBlocks).toHaveLength(3);
    for (const block of requeueBlocks) {
      expect(block).toContain("dispatch-latest-redeploy.mjs");
      expect(block).not.toContain("RECONCILE_WAIT");
      expect(block).not.toContain("gh run watch");
    }
    expect(recovery).toMatch(/concurrency:\n  group: pages-recovery-orchestrator\n  cancel-in-progress: false/);
    expect(recovery).toContain("gh run watch");
  });

  it("requests and waits for the exact dispatched workflow run, then always cleans its marker", () => {
    expect(recovery).toContain('X-GitHub-Api-Version: 2022-11-28');
    expect(recovery).toContain('-F "return_run_details=true"');
    expect(recovery).toContain('-F "inputs[release_tag]=${RELEASE_TAG}"');
    expect(recovery).not.toContain("workflow_source_sha");
    expect(recovery).toContain("gh run watch");
    expect(recovery).toMatch(/if: always\(\).*steps\.marker\.outputs\.branch/);
  });
});
