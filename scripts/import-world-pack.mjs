#!/usr/bin/env node
/**
 * Copy the approved Tuvis World handoff pack into public/world/v1.
 * Every asset is path-checked and SHA-256-verified before anything is written.
 */
import { copyFile, mkdir, readFile, realpath } from "node:fs/promises";
import { createHash } from "node:crypto";
import { dirname, isAbsolute, join, relative, resolve } from "node:path";
import { pathToFileURL } from "node:url";

const DEFAULT_SOURCE = "tuvis-world/05_handoff/v1";
const DEFAULT_TARGET = "public/world/v1";

function fail(message) {
  throw new Error(`import-world-pack: ${message}`);
}

function assertSafeRelativePath(value, label) {
  if (typeof value !== "string" || value.length === 0) fail(`${label} must be a non-empty string`);
  if (isAbsolute(value) || /^[a-zA-Z]:/.test(value)) fail(`${label} must be relative: ${value}`);
  if (value.split(/[\\/]/).includes("..")) fail(`${label} must stay inside the pack: ${value}`);
  return value;
}

async function sha256File(file) {
  const buffer = await readFile(file);
  return createHash("sha256").update(buffer).digest("hex");
}

async function readJson(file, label) {
  let raw;
  try {
    raw = await readFile(file, "utf8");
  } catch (error) {
    fail(`cannot read ${label}: ${error.message}`);
  }
  try {
    return JSON.parse(raw);
  } catch (error) {
    fail(`${label} is not valid JSON: ${error.message}`);
  }
}

async function assertInside(root, file, label) {
  const resolvedRoot = await realpath(root);
  let resolvedFile;
  try {
    resolvedFile = await realpath(file);
  } catch (error) {
    fail(`${label} is missing: ${error.message}`);
  }
  const rel = relative(resolvedRoot, resolvedFile);
  if (rel === "" || rel.startsWith("..") || isAbsolute(rel)) {
    fail(`${label} resolves outside the pack: ${file}`);
  }
  return resolvedFile;
}

/**
 * Validate the whole pack, then copy assets/content/manifest/scene into
 * targetDir using the same relative layout as public/world/v1.
 */
export async function copyWorldPack(sourceDir, targetDir) {
  const source = resolve(sourceDir);
  const target = resolve(targetDir);
  const manifestPath = join(source, "manifest.json");
  const manifest = await readJson(manifestPath, "manifest.json");

  if (!manifest || typeof manifest !== "object" || Array.isArray(manifest)) fail("manifest must be an object");
  if (manifest.schemaVersion !== 1) fail(`manifest schemaVersion must be 1, got ${manifest.schemaVersion}`);
  if (!manifest.assets || typeof manifest.assets !== "object" || Array.isArray(manifest.assets)) {
    fail("manifest.assets must be an object");
  }
  const assetIds = Object.keys(manifest.assets);
  if (assetIds.length === 0) fail("manifest.assets must not be empty");

  const manifestRelative = assertSafeRelativePath(manifest.contentPath, "manifest.contentPath");
  const sceneRelative = assertSafeRelativePath(manifest.scenePath, "manifest.scenePath");

  const scene = await readJson(
    await assertInside(source, join(source, sceneRelative), "scene.json"),
    "scene.json",
  );
  const content = await readJson(
    await assertInside(source, join(source, manifestRelative), "content"),
    "content",
  );
  if (scene?.schemaVersion !== 1) fail("scene schemaVersion must be 1");
  if (content?.schemaVersion !== 1) fail("content schemaVersion must be 1");

  const copies = [
    { relative: "manifest.json", absolute: await assertInside(source, manifestPath, "manifest.json") },
    { relative: sceneRelative, absolute: await assertInside(source, join(source, sceneRelative), "scene.json") },
    {
      relative: manifestRelative,
      absolute: await assertInside(source, join(source, manifestRelative), "content"),
    },
  ];

  for (const id of assetIds) {
    const asset = manifest.assets[id];
    if (!asset || typeof asset !== "object") fail(`manifest.assets.${id} must be an object`);
    const relativePath = assertSafeRelativePath(asset.path, `manifest.assets.${id}.path`);
    if (typeof asset.sha256 !== "string" || !/^[0-9a-f]{64}$/i.test(asset.sha256)) {
      fail(`manifest.assets.${id}.sha256 must be a SHA-256 hex digest`);
    }
    const absolute = await assertInside(source, join(source, relativePath), `manifest.assets.${id}`);
    const digest = await sha256File(absolute);
    if (digest.toLowerCase() !== asset.sha256.toLowerCase()) {
      fail(`checksum mismatch for ${relativePath}: expected ${asset.sha256}, got ${digest}`);
    }
    copies.push({ relative: relativePath, absolute });
  }

  // All validation passed; only now touch the target directory.
  const written = [];
  for (const entry of copies) {
    const destination = join(target, entry.relative);
    await mkdir(dirname(destination), { recursive: true });
    await copyFile(entry.absolute, destination);
    written.push(entry.relative);
  }

  return { manifest, target, written };
}

const isMain =
  process.argv[1] !== undefined &&
  pathToFileURL(resolve(process.argv[1])).href === import.meta.url;

if (isMain) {
  const source = process.argv[2] ?? DEFAULT_SOURCE;
  const target = process.argv[3] ?? DEFAULT_TARGET;
  try {
    const result = await copyWorldPack(source, target);
    console.log(
      `import-world-pack: copied ${result.written.length} files to ${relative(process.cwd(), result.target)}`,
    );
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  }
}

export { DEFAULT_SOURCE, DEFAULT_TARGET };
