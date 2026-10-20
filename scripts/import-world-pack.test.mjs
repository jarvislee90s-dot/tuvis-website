import { afterAll, describe, expect, it } from "vitest";
import { mkdtemp, mkdir, readFile, rm, stat, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { dirname, join, resolve } from "node:path";
import { tmpdir } from "node:os";
import { copyWorldPack } from "./import-world-pack.mjs";

const PACK = resolve("tuvis-world/05_handoff/v1");
const tempDirs = [];

async function makeTemp() {
  const dir = await mkdtemp(join(tmpdir(), "tuvis-world-import-"));
  tempDirs.push(dir);
  return dir;
}

afterAll(async () => {
  await Promise.all(tempDirs.map((dir) => rm(dir, { recursive: true, force: true })));
});

function sha256(buffer) {
  return createHash("sha256").update(buffer).digest("hex");
}

async function writeFixturePack(dir, { assetBytes, assetPath = "assets/scene/workshop-base.png", sha } = {}) {
  const bytes = assetBytes ?? Buffer.from("approved-pixels");
  const manifest = {
    schemaVersion: 1,
    packVersion: "test",
    assets: {
      room: {
        path: assetPath,
        width: 1,
        height: 1,
        alpha: false,
        sha256: sha ?? sha256(bytes),
      },
    },
    frames: {},
    coreAssets: ["room"],
    contentPath: "content/world.zh.json",
    scenePath: "scene.json",
  };
  await mkdir(join(dir, dirname(assetPath)), { recursive: true });
  await writeFile(join(dir, "manifest.json"), JSON.stringify(manifest));
  await writeFile(join(dir, "scene.json"), JSON.stringify({ schemaVersion: 1 }));
  await mkdir(join(dir, "content"), { recursive: true });
  await writeFile(join(dir, "content/world.zh.json"), JSON.stringify({ schemaVersion: 1 }));
  await writeFile(join(dir, assetPath), bytes);
  return manifest;
}

describe("copyWorldPack", () => {
  it("copies the approved pack with matching SHA-256 digests", async () => {
    const target = await makeTemp();
    const result = await copyWorldPack(PACK, target);
    expect(result.written).toHaveLength(28);

    const manifest = JSON.parse(await readFile(join(target, "manifest.json"), "utf8"));
    for (const asset of Object.values(manifest.assets)) {
      const copied = await readFile(join(target, asset.path));
      expect(sha256(copied)).toBe(asset.sha256);
    }
    for (const relative of [manifest.contentPath, manifest.scenePath]) {
      const copied = await readFile(join(target, relative));
      expect(sha256(copied)).toBe(sha256(await readFile(join(PACK, relative))));
    }
    const content = JSON.parse(await readFile(join(target, manifest.contentPath), "utf8"));
    const scene = JSON.parse(await readFile(join(target, manifest.scenePath), "utf8"));
    expect(content.schemaVersion).toBe(1);
    expect(scene.schemaVersion).toBe(1);
    expect(content.equipment).toHaveLength(4);
    expect(scene.hotspots).toHaveLength(12);
  });

  it("rejects a tampered asset and writes nothing", async () => {
    const source = await makeTemp();
    await writeFixturePack(source, {
      assetBytes: Buffer.from("tampered-pixels"),
      sha: sha256(Buffer.from("original-pixels")),
    });
    const target = await makeTemp();
    await expect(copyWorldPack(source, target)).rejects.toThrow(/checksum/i);
    await expect(stat(join(target, "manifest.json"))).rejects.toThrow();
  });

  it("rejects paths escaping the pack and never copies outside it", async () => {
    const source = await makeTemp();
    const outside = join(source, "..", "outside.png");
    await writeFile(outside, "outside");
    await writeFixturePack(source, { assetPath: "../outside.png" });
    const target = await makeTemp();
    await expect(copyWorldPack(source, target)).rejects.toThrow(/inside the pack|relative/i);
    await expect(stat(join(target, "manifest.json"))).rejects.toThrow();
    await expect(stat(join(target, "outside.png"))).rejects.toThrow();
    expect(await readFile(outside, "utf8")).toBe("approved-pixels");
    await rm(outside, { force: true });
  });
});
