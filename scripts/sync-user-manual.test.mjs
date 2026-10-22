import { describe, expect, it, vi } from "vitest";
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { tmpdir } from "node:os";
import { BLOB_TIMEOUT_MS, MANUAL_DOWNLOAD_CONCURRENCY, blobApiUrl, fetchBlob, gitBlobSha, manualEntriesFromTree, manualSlugsFromSource, manualSyncBudget, mapWithConcurrency, runManualSync, syncFromReleaseCheckout } from "./sync-user-manual.mjs";

describe("runManualSync", () => {
  it("does not fall back to checked-in files when a release-pinned manual fetch fails", async () => {
    const localSync = vi.fn();

    await expect(runManualSync({
      ref: "v0.6.0",
      strict: true,
      networkSync: async () => { throw new Error("release tag unavailable"); },
      localSync,
    })).rejects.toThrow("release tag unavailable");

    expect(localSync).not.toHaveBeenCalled();
  });

  it("rejects mutable refs and local/offline overrides in release mode", async () => {
    const networkSync = vi.fn();
    await expect(runManualSync({ ref: "main", strict: true, networkSync }))
      .rejects.toThrow(/stable vMAJOR/);
    await expect(runManualSync({ ref: "v0.6.0", strict: true, offline: true, networkSync }))
      .rejects.toThrow(/offline mode or local fallback/);
    expect(networkSync).not.toHaveBeenCalled();
  });

  it("preserves the local fallback for non-release builds", async () => {
    const localSync = vi.fn();

    await runManualSync({
      ref: "main",
      strict: false,
      networkSync: async () => { throw new Error("offline"); },
      localSync,
      src: "/local/manual",
      ci: false,
    });

    expect(localSync).toHaveBeenCalledWith("/local/manual");
  });

  it("uses the checked-out matching Tuvis tag for strict builds", async () => {
    const releaseSync = vi.fn();
    const networkSync = vi.fn();
    const localSync = vi.fn();

    await runManualSync({
      ref: "v0.6.0",
      strict: true,
      releaseSourceDir: "/tmp/tuvis-source",
      releaseSync,
      networkSync,
      localSync,
    });

    expect(releaseSync).toHaveBeenCalledWith("v0.6.0", "/tmp/tuvis-source");
    expect(networkSync).not.toHaveBeenCalled();
    expect(localSync).not.toHaveBeenCalled();
  });
});

describe("GitHub blob API manual downloads", () => {
  it("keeps the pinned tree SHA for each manual file", () => {
    expect(manualEntriesFromTree({
      tree: [
        { type: "blob", path: "docs/user-manual/zh/01.md", sha: "blob-1", size: 12 },
        { type: "blob", path: "docs/user-manual/img/hero.png", sha: "blob-2", size: 34 },
        { type: "blob", path: "docs/other.md", sha: "blob-3", size: 56 },
      ],
    })).toEqual([
      { path: "zh/01.md", sha: "blob-1", size: 12 },
      { path: "img/hero.png", sha: "blob-2", size: 34 },
    ]);
  });

  it("builds GitHub API blob URLs and verifies raw binary data by Git blob SHA", async () => {
    expect(blobApiUrl("blob-1")).toBe("https://api.github.com/repos/jarvislee90s-dot/tuvis/git/blobs/blob-1");
    const bytes = Buffer.from([0, 1, 2]);
    const sha = "8352675d67aed6625ece79af41c27fdb4ee2e867";
    expect(gitBlobSha(bytes)).toBe(sha);
    expect(BLOB_TIMEOUT_MS).toBe(30000);
    expect(MANUAL_DOWNLOAD_CONCURRENCY).toBe(3);

    const fetchImpl = vi.fn(async (_url, { headers }) => {
      expect(headers.Accept).toBe("application/vnd.github.raw+json");
      return { ok: true, arrayBuffer: async () => bytes };
    });
    await expect(fetchBlob(sha, Date.now() + 30000, { attempts: 1, fetchImpl })).resolves.toEqual(bytes);
    await expect(fetchBlob("wrong-sha", Date.now() + 30000, { attempts: 1, fetchImpl })).rejects.toThrow(/blob SHA mismatch/);
  });
});

describe("manual sync time budget", () => {
  it("gives strict release downloads a longer budget and preserves explicit overrides", () => {
    expect(manualSyncBudget(false)).toBe(30000);
    expect(manualSyncBudget(true)).toBe(180000);
    expect(manualSyncBudget(true, 45000)).toBe(45000);
  });
});

describe("mapWithConcurrency", () => {
  it("bounds parallel requests and returns results in input order", async () => {
    let active = 0;
    let peak = 0;
    const values = await mapWithConcurrency([1, 2, 3, 4, 5], 2, async (value) => {
      active++;
      peak = Math.max(peak, active);
      await new Promise((resolve) => setTimeout(resolve, 5));
      active--;
      return value * 2;
    });

    expect(peak).toBe(2);
    expect(values).toEqual([2, 4, 6, 8, 10]);
  });
});

describe("syncFromReleaseCheckout", () => {
  function git(cwd, ...args) {
    return execFileSync("git", args, { cwd, encoding: "utf8", stdio: "pipe" }).trim();
  }

  it("copies a matching tagged manual tree and preserves the destination when checkout ref is wrong", () => {
    const root = mkdtempSync(path.join(tmpdir(), "tuvis-manual-tag-"));
    const repo = path.join(root, "tuvis");
    const manual = path.join(repo, "docs/user-manual");
    const destination = path.join(root, "manual-out");
    const slugs = manualSlugsFromSource(readFileSync(path.resolve("src/content/manual.ts"), "utf8"));
    for (const language of ["zh", "en"]) {
      mkdirSync(path.join(manual, language), { recursive: true });
      for (const slug of slugs) writeFileSync(path.join(manual, language, `${slug}.md`), `${language} ${slug}`);
    }
    mkdirSync(path.join(manual, "img"), { recursive: true });
    writeFileSync(path.join(manual, "img/hero.png"), "image bytes");
    writeFileSync(path.join(manual, "zh/01-overview.md"), "![hero](../img/hero.png)");
    mkdirSync(destination, { recursive: true });
    writeFileSync(path.join(destination, "old.md"), "keep until complete");
    git(repo, "init", "--initial-branch=main");
    git(repo, "config", "user.name", "Manual Test");
    git(repo, "config", "user.email", "manual-test@example.test");
    git(repo, "add", "docs/user-manual");
    git(repo, "commit", "-m", "manual v0.6.0");
    git(repo, "tag", "-a", "v0.6.0", "-m", "v0.6.0");

    try {
      syncFromReleaseCheckout("v0.6.0", repo, destination);
      expect(readFileSync(path.join(destination, "zh/01-overview.md"), "utf8")).toBe("![hero](../img/hero.png)");
      expect(readFileSync(path.join(destination, "en/13-faq.md"), "utf8")).toBe("en 13-faq");
      expect(readFileSync(path.join(destination, "img/hero.png"), "utf8")).toBe("image bytes");
      expect(existsSync(path.join(destination, "old.md"))).toBe(false);

      rmSync(path.join(manual, "en/13-faq.md"));
      expect(() => syncFromReleaseCheckout("v0.6.0", repo, destination)).toThrow(/missing required page: en\/13-faq\.md/);
      expect(readFileSync(path.join(destination, "en/13-faq.md"), "utf8")).toBe("en 13-faq");

      writeFileSync(path.join(manual, "en/13-faq.md"), "en 13-faq");
      rmSync(path.join(manual, "img/hero.png"));
      expect(() => syncFromReleaseCheckout("v0.6.0", repo, destination)).toThrow(/image is missing/);
      expect(readFileSync(path.join(destination, "img/hero.png"), "utf8")).toBe("image bytes");

      writeFileSync(path.join(manual, "img/hero.png"), "image bytes");
      writeFileSync(path.join(repo, "docs/user-manual/zh/new-main-content.md"), "new main content");
      git(repo, "add", "docs/user-manual");
      git(repo, "commit", "-m", "advance main");
      expect(() => syncFromReleaseCheckout("v0.6.0", repo, destination)).toThrow(/not checked out at v0.6.0/);
      expect(readFileSync(path.join(destination, "zh/01-overview.md"), "utf8")).toBe("![hero](../img/hero.png)");
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });
});
