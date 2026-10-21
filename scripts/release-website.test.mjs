import { afterEach, describe, expect, it } from "vitest";
import { execFileSync, spawnSync } from "node:child_process";
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const script = path.join(path.dirname(fileURLToPath(import.meta.url)), "release-website.mjs");
const markerScript = path.join(path.dirname(fileURLToPath(import.meta.url)), "create-redeploy-marker.mjs");
const resolverScript = path.join(path.dirname(fileURLToPath(import.meta.url)), "resolve-deploy-target.mjs");
const validatorScript = path.join(path.dirname(fileURLToPath(import.meta.url)), "validate-recovery-request.mjs");
const roots = [];

function git(cwd, ...args) {
  return execFileSync("git", args, { cwd, encoding: "utf8", stdio: "pipe" }).trim();
}

function initRepo(cwd, bare = false) {
  mkdirSync(cwd, { recursive: true });
  git(cwd, "init", ...(bare ? ["--bare"] : ["--initial-branch=main"]), ...(bare ? ["--initial-branch=main"] : []));
}

function commitFile(cwd, name, contents) {
  mkdirSync(path.dirname(path.join(cwd, name)), { recursive: true });
  writeFileSync(path.join(cwd, name), contents);
  git(cwd, "add", name);
  git(cwd, "-c", "user.name=Release Test", "-c", "user.email=release-test@example.test", "commit", "-m", `add ${name}`);
}

function setup() {
  const root = mkdtempSync(path.join(tmpdir(), "tuvis-website-release-"));
  roots.push(root);
  const websiteRemote = path.join(root, "website.git");
  const website = path.join(root, "website");
  const tuvisRemote = path.join(root, "tuvis.git");
  const tuvis = path.join(root, "tuvis");

  initRepo(websiteRemote, true);
  git(root, "clone", websiteRemote, website);
  git(website, "config", "user.name", "Release Test");
  git(website, "config", "user.email", "release-test@example.test");
  commitFile(website, "README.md", "website release source\n");
  git(website, "push", "-u", "origin", "main");

  initRepo(tuvisRemote, true);
  git(root, "clone", tuvisRemote, tuvis);
  git(tuvis, "config", "user.name", "Release Test");
  git(tuvis, "config", "user.email", "release-test@example.test");
  commitFile(tuvis, "README.md", "tuvis docs source\n");
  git(tuvis, "push", "-u", "origin", "main");
  git(tuvis, "tag", "-a", "v0.1.0", "-m", "Tuvis v0.1.0");
  git(tuvis, "push", "origin", "v0.1.0");

  return { root, websiteRemote, website, tuvisRemote, tuvis };
}

function runRelease(website, tuvisRemote, tag) {
  return spawnSync(process.execPath, [script, tag], {
    cwd: website,
    encoding: "utf8",
    env: { ...process.env, TUVIS_REPO_URL: tuvisRemote },
  });
}

function runMarker(website, tag, runId = "42", attempt = "1") {
  return spawnSync(process.execPath, [markerScript], {
    cwd: website,
    encoding: "utf8",
    env: { ...process.env, RELEASE_TAG: tag, GITHUB_RUN_ID: runId, GITHUB_RUN_ATTEMPT: attempt },
  });
}

function createProtocolRelease(website, tag) {
  commitFile(website, ".github/workflows/deploy.yml", "# recovery-marker-protocol: v1\non:\n  workflow_dispatch:\n");
  git(website, "push", "origin", "main");
  git(website, "tag", "-a", tag, "-m", `Website ${tag}`);
  git(website, "push", "origin", tag);
  return git(website, "rev-parse", `${tag}^{commit}`);
}

function runResolver(website, env) {
  return spawnSync(process.execPath, [resolverScript], {
    cwd: website,
    encoding: "utf8",
    env: { ...process.env, ...env },
  });
}

function runValidator(website, tag) {
  return spawnSync(process.execPath, [validatorScript], {
    cwd: website,
    encoding: "utf8",
    env: { ...process.env, RELEASE_TAG: tag },
  });
}

afterEach(() => {
  for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true });
});

describe("release-website command", () => {
  it("tags and pushes the exact clean main SHA after finding the matching Tuvis tag", () => {
    const { websiteRemote, website, tuvisRemote } = setup();
    const expected = git(website, "rev-parse", "HEAD");
    const result = runRelease(website, tuvisRemote, "v0.1.0");

    expect(result.status, result.stderr).toBe(0);
    expect(git(website, "rev-parse", "v0.1.0^{commit}")).toBe(expected);
    expect(execFileSync("git", ["ls-remote", websiteRemote, "refs/tags/v0.1.0"], { encoding: "utf8" })).toContain("refs/tags/v0.1.0");
  });

  it("rejects dirty worktrees and a local main that is behind origin/main", () => {
    const dirty = setup();
    writeFileSync(path.join(dirty.website, "untracked.txt"), "dirty\n");
    const dirtyResult = runRelease(dirty.website, dirty.tuvisRemote, "v0.1.0");
    expect(dirtyResult.status).not.toBe(0);
    expect(dirtyResult.stderr).toMatch(/clean working tree/);

    const stale = setup();
    const secondClone = path.join(stale.root, "second-clone");
    git(stale.root, "clone", stale.websiteRemote, secondClone);
    git(secondClone, "config", "user.name", "Release Test");
    git(secondClone, "config", "user.email", "release-test@example.test");
    commitFile(secondClone, "later.md", "main moved\n");
    git(secondClone, "push", "origin", "main");
    const staleResult = runRelease(stale.website, stale.tuvisRemote, "v0.1.0");
    expect(staleResult.status).not.toBe(0);
    expect(staleResult.stderr).toMatch(/origin\/main/);
  });

  it("rejects missing Tuvis tags and a new tag on the same website SHA", () => {
    const missing = setup();
    const missingResult = runRelease(missing.website, missing.tuvisRemote, "v0.1.1");
    expect(missingResult.status).not.toBe(0);
    expect(missingResult.stderr).toMatch(/matching Tuvis tag/);

    const duplicateSha = setup();
    const first = runRelease(duplicateSha.website, duplicateSha.tuvisRemote, "v0.1.0");
    expect(first.status, first.stderr).toBe(0);
    git(duplicateSha.tuvis, "tag", "-a", "v0.1.1", "-m", "Tuvis v0.1.1");
    git(duplicateSha.tuvis, "push", "origin", "v0.1.1");
    const sameShaResult = runRelease(duplicateSha.website, duplicateSha.tuvisRemote, "v0.1.1");
    expect(sameShaResult.status).not.toBe(0);
    expect(sameShaResult.stderr).toMatch(/same SHA/);
  });

  it("creates an empty unique recovery marker with the release's exact tree and parent", () => {
    const { websiteRemote, website } = setup();
    const release = createProtocolRelease(website, "v0.1.0");

    const result = runMarker(website, "v0.1.0");
    expect(result.status, result.stderr).toBe(0);
    const branch = "v0.1.0-redeploy-42-1";
    const remoteBranch = execFileSync("git", ["ls-remote", websiteRemote, `refs/heads/${branch}`], { encoding: "utf8" });
    expect(remoteBranch).toContain(`refs/heads/${branch}`);
    git(website, "fetch", "origin", branch);
    const marker = git(website, "rev-parse", `origin/${branch}`);
    expect(marker).not.toBe(release);
    expect(git(website, "rev-parse", `${marker}^{tree}`)).toBe(git(website, "rev-parse", `${release}^{tree}`));
    expect(git(website, "rev-parse", `${marker}^`)).toBe(release);

    const secondResult = runMarker(website, "v0.1.0", "43", "1");
    expect(secondResult.status, secondResult.stderr).toBe(0);
    const secondBranch = "v0.1.0-redeploy-43-1";
    git(website, "fetch", "origin", secondBranch);
    const secondMarker = git(website, "rev-parse", `origin/${secondBranch}`);
    expect(secondMarker).not.toBe(marker);
    expect(git(website, "rev-parse", `${secondMarker}^{tree}`)).toBe(git(website, "rev-parse", `${release}^{tree}`));
    expect(git(website, "rev-parse", `${secondMarker}^`)).toBe(release);
  });

  it("refuses recovery of a tag older than the latest stable website release", () => {
    const { website } = setup();
    git(website, "tag", "-a", "v0.1.0", "-m", "Website v0.1.0");
    git(website, "tag", "-a", "v0.2.0", "-m", "Website v0.2.0");
    git(website, "push", "origin", "--tags");

    const result = runMarker(website, "v0.1.0");
    expect(result.status).not.toBe(0);
    expect(result.stderr).toMatch(/only the latest stable release tag/);
  });

  it("rejects recovery of the current legacy release but accepts the next same-tree protocol release", () => {
    const { website } = setup();
    commitFile(website, ".github/workflows/deploy.yml", "on:\n  workflow_dispatch:\n    inputs:\n      ref:\n        required: false\n");
    git(website, "push", "origin", "main");
    git(website, "tag", "-a", "v0.1.0", "-m", "legacy website release");
    git(website, "push", "origin", "v0.1.0");

    const legacy = runValidator(website, "v0.1.0");
    expect(legacy.status).not.toBe(0);
    expect(legacy.stderr).toMatch(/predates the same-tree recovery protocol/);
    expect(runMarker(website, "v0.1.0").status).not.toBe(0);

    git(website, "switch", "main");
    commitFile(website, ".github/workflows/deploy.yml", "# recovery-marker-protocol: v1\non:\n  workflow_dispatch:\n");
    git(website, "push", "origin", "main");
    git(website, "tag", "-a", "v0.2.0", "-m", "same-tree recovery release");
    git(website, "push", "origin", "v0.2.0");
    const current = runValidator(website, "v0.2.0");
    expect(current.status, current.stderr).toBe(0);
    expect(current.stdout).toContain("is the latest stable website release");
  });

  it("validates a same-tree dispatch marker and makes a late old tag event target the newest release", () => {
    const { website, websiteRemote } = setup();
    const releaseCommit = createProtocolRelease(website, "v0.1.0");
    const markerResult = runMarker(website, "v0.1.0");
    expect(markerResult.status, markerResult.stderr).toBe(0);
    const markerBranch = "v0.1.0-redeploy-42-1";
    const markerSha = git(website, "rev-parse", "HEAD");

    const resolved = runResolver(website, {
      GITHUB_SHA: markerSha,
      GITHUB_EVENT_NAME: "workflow_dispatch",
      GITHUB_REF_TYPE: "branch",
      GITHUB_REF_NAME: markerBranch,
      INPUT_RELEASE_TAG: "v0.1.0",
    });
    expect(resolved.status, resolved.stderr).toBe(0);
    expect(resolved.stdout).toContain("should_deploy=true");
    expect(resolved.stdout).toContain("recovery=true");

    const staleTag = "v0.2.0";
    git(website, "tag", "-a", staleTag, "-m", "Website v0.2.0", releaseCommit);
    git(website, "push", "origin", staleTag);
    const delayedRecovery = runResolver(website, {
      GITHUB_SHA: markerSha,
      GITHUB_EVENT_NAME: "workflow_dispatch",
      GITHUB_REF_TYPE: "branch",
      GITHUB_REF_NAME: markerBranch,
      INPUT_RELEASE_TAG: "v0.1.0",
    });
    expect(delayedRecovery.status, delayedRecovery.stderr).toBe(0);
    expect(delayedRecovery.stdout).toContain("release_tag=v0.2.0");
    expect(delayedRecovery.stdout).toContain("should_deploy=true");

    const stale = runResolver(website, {
      GITHUB_SHA: releaseCommit,
      GITHUB_EVENT_NAME: "push",
      GITHUB_REF_TYPE: "tag",
      GITHUB_REF_NAME: "v0.1.0",
    });
    expect(stale.status, stale.stderr).toBe(0);
    expect(stale.stdout).toContain("release_tag=v0.2.0");
    expect(stale.stdout).toContain("should_deploy=true");
  });
});
