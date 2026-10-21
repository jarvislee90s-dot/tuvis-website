import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const deploy = readFileSync(resolve(root, ".github/workflows/deploy.yml"), "utf8");
const recovery = readFileSync(resolve(root, ".github/workflows/redeploy-latest.yml"), "utf8");

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
    expect(deploy).toContain("TUVIS_RELEASE_SOURCE_DIR: ../tuvis-source");
    expect(deploy).toContain("recovery-marker-protocol: v1");
    expect(deploy).toContain("Recheck latest release before deployment");
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
