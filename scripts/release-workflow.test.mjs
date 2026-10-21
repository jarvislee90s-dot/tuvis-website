import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const deploy = readFileSync(resolve(root, ".github/workflows/deploy.yml"), "utf8");
const recovery = readFileSync(resolve(root, ".github/workflows/redeploy-latest.yml"), "utf8");

describe("release workflow policy", () => {
  it("only publishes on formal tag pushes or the internal recovery dispatch, serially", () => {
    expect(deploy).toContain('tags: ["v*"]');
    expect(deploy).not.toMatch(/^\s+schedule:/m);
    expect(deploy).not.toMatch(/^\s+repository_dispatch:/m);
    expect(deploy).toMatch(/concurrency:\n  group: github-pages-production\n  cancel-in-progress: false\n  queue: max/);
    expect(deploy).toContain("TUVIS_RELEASE_SOURCE_DIR: ../tuvis-source");
    expect(deploy).toContain("workflow_source_sha:");
    expect(deploy).toContain("workflow_tools_sha: ${{ steps.target.outputs.workflow_tools_sha }}");
  });

  it("requests and waits for the exact dispatched workflow run, then always cleans its marker", () => {
    expect(recovery).toContain('X-GitHub-Api-Version: 2022-11-28');
    expect(recovery).toContain('-F "return_run_details=true"');
    expect(recovery).toContain('-F "inputs[workflow_source_sha]=${WORKFLOW_SOURCE_SHA}"');
    expect(recovery).toContain("gh run watch");
    expect(recovery).toMatch(/if: always\(\).*steps\.marker\.outputs\.branch/);
  });
});
