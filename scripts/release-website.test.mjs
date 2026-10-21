import { afterEach, describe, expect, it } from "vitest";
import { execFileSync, spawnSync } from "node:child_process";
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { RECOVERY_TOOL_FILES } from "./release-policy.mjs";

const script = path.join(path.dirname(fileURLToPath(import.meta.url)), "release-website.mjs");
const markerScript = path.join(path.dirname(fileURLToPath(import.meta.url)), "create-redeploy-marker.mjs");
const resolverScript = path.join(path.dirname(fileURLToPath(import.meta.url)), "resolve-deploy-target.mjs");
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

function runMarker(website, tag, workflowSha, runId = "42", attempt = "1") {
  return spawnSync(process.execPath, [markerScript], {
    cwd: website,
    encoding: "utf8",
    env: { ...process.env, RELEASE_TAG: tag, GITHUB_RUN_ID: runId, GITHUB_RUN_ATTEMPT: attempt, WORKFLOW_SOURCE_SHA: workflowSha },
  });
}

function addRecoveryTools(website) {
  for (const file of RECOVERY_TOOL_FILES) commitFile(website, file, `workflow support from ${file}\n`);
  git(website, "push", "origin", "main");
  return git(website, "rev-parse", "HEAD");
}

function runResolver(website, env) {
  return spawnSync(process.execPath, [resolverScript], {
    cwd: website,
    encoding: "utf8",
    env: { ...process.env, ...env },
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

  it("creates a unique recovery marker parented by the release with only current deployment tools overlaid", () => {
    const { websiteRemote, website } = setup();
    git(website, "tag", "-a", "v0.1.0", "-m", "Website v0.1.0");
    git(website, "push", "origin", "v0.1.0");
    const release = git(website, "rev-parse", "v0.1.0^{commit}");
    const workflowSha = addRecoveryTools(website);

    const result = runMarker(website, "v0.1.0", workflowSha);
    expect(result.status, result.stderr).toBe(0);
    const branch = "v0.1.0-redeploy-42-1";
    const remoteBranch = execFileSync("git", ["ls-remote", websiteRemote, `refs/heads/${branch}`], { encoding: "utf8" });
    expect(remoteBranch).toContain(`refs/heads/${branch}`);
    git(website, "fetch", "origin", branch);
    const marker = git(website, "rev-parse", `origin/${branch}`);
    expect(git(website, "diff", "--name-only", `${release}..${marker}`).split("\n").sort()).toEqual([...RECOVERY_TOOL_FILES].sort());
    expect(git(website, "rev-parse", `${marker}^`)).toBe(release);
    expect(git(website, "show", `${marker}:README.md`)).toBe(git(website, "show", `${release}:README.md`));
    for (const file of RECOVERY_TOOL_FILES) {
      expect(git(website, "rev-parse", `${marker}:${file}`)).toBe(git(website, "rev-parse", `${workflowSha}:${file}`));
    }
  });

  it("refuses recovery of a tag older than the latest stable website release", () => {
    const { website } = setup();
    git(website, "tag", "-a", "v0.1.0", "-m", "Website v0.1.0");
    git(website, "tag", "-a", "v0.2.0", "-m", "Website v0.2.0");
    git(website, "push", "origin", "--tags");

    const result = runMarker(website, "v0.1.0", "");
    expect(result.status).not.toBe(0);
    expect(result.stderr).toMatch(/only the latest stable release tag/);
  });

  it("validates a dispatch marker by its event SHA while using current workflow scripts", () => {
    const { website, websiteRemote } = setup();
    git(website, "tag", "-a", "v0.1.0", "-m", "Website v0.1.0");
    git(website, "push", "origin", "v0.1.0");
    const workflowSha = addRecoveryTools(website);
    const markerResult = runMarker(website, "v0.1.0", workflowSha);
    expect(markerResult.status, markerResult.stderr).toBe(0);
    const markerBranch = "v0.1.0-redeploy-42-1";
    const markerSha = git(website, "rev-parse", "HEAD");

    const resolved = runResolver(website, {
      GITHUB_SHA: markerSha,
      GITHUB_EVENT_NAME: "workflow_dispatch",
      GITHUB_REF_TYPE: "branch",
      GITHUB_REF_NAME: markerBranch,
      INPUT_RELEASE_TAG: "v0.1.0",
      INPUT_WORKFLOW_SOURCE_SHA: workflowSha,
    });
    expect(resolved.status, resolved.stderr).toBe(0);
    expect(resolved.stdout).toContain("should_deploy=true");
    expect(resolved.stdout).toContain("recovery=true");

    const releaseCommit = git(website, "rev-parse", "v0.1.0^{commit}");
    git(website, "switch", "main");
    commitFile(website, "scripts/release-policy.mjs", "tampered support from a later workflow source\n");
    git(website, "push", "origin", "main");
    const mismatchedSource = runResolver(website, {
      GITHUB_SHA: markerSha,
      GITHUB_EVENT_NAME: "workflow_dispatch",
      GITHUB_REF_TYPE: "branch",
      GITHUB_REF_NAME: markerBranch,
      INPUT_RELEASE_TAG: "v0.1.0",
      INPUT_WORKFLOW_SOURCE_SHA: git(website, "rev-parse", "HEAD"),
    });
    expect(mismatchedSource.status).not.toBe(0);
    expect(mismatchedSource.stderr).toMatch(/does not match workflow source/);

    const staleTag = "v0.2.0";
    git(website, "tag", "-a", staleTag, "-m", "Website v0.2.0");
    git(website, "push", "origin", staleTag);
    const stale = runResolver(website, {
      GITHUB_SHA: releaseCommit,
      GITHUB_EVENT_NAME: "push",
      GITHUB_REF_TYPE: "tag",
      GITHUB_REF_NAME: "v0.1.0",
    });
    expect(stale.status, stale.stderr).toBe(0);
    expect(stale.stdout).toContain("should_deploy=false");
  });
});
