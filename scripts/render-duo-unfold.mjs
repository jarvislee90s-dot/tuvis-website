#!/usr/bin/env node
/**
 * Offline frame-exact renderer for the iPhone Duo unfold study.
 *
 * Renders the PUBLISHED embed copy (public/duo/index.html) in ?video=1 mode
 * through headless Chrome + CDP, one PNG per 60 Hz frame, then assembles the
 * symmetric loop agreed for promo use:
 *
 *   4s unfold → 1.5s hold open → 4s fold → 1.5s hold closed   (11s, seamless)
 *
 * Per language (zh / en) it produces one 1920×1080 60fps H.264 master plus a
 * GitHub-sized 820px GIF derived from it. Progress is driven through the
 * page's own scrub input (same setVars path as a user drag), so frames are
 * deterministic — no real-time capture, no dropped frames.
 *
 * Usage: node scripts/render-duo-unfold.mjs [--out renders/duo-unfold] [--langs zh,en]
 *   CHROME_BIN       override the Chrome executable
 *   RENDER_CDP_PORT  override the debugging port (default 9223)
 *   --keep-frames    keep intermediate PNG frames (several GB) for re-encodes
 *
 * Requires ffmpeg on PATH. The GIF ladder (agreed 2026-10-24): target ≤9MB
 * (GitHub image proxy risk line) — try sierra2_4a dither, then bayer_scale=4,
 * then 20fps, then 720px width.
 */
import { spawn, spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const repo = path.resolve(here, "..");

const SOURCE_HTML = path.join(repo, "docs/design/duo-unfold-lab-frame-study.html");
const PUBLISHED_HTML = path.join(repo, "public/duo/index.html");
const FRAME_RATE = 60;
const UNFOLD_SECONDS = 4;
const HOLD_SECONDS = 1.5;
const GIF_WIDTH = 820;
const GIF_MAX_BYTES = 9 * 1024 * 1024;

const args = process.argv.slice(2);
const flag = (name) => args.includes(name);
const option = (name, fallback) => {
  const index = args.indexOf(name);
  return index >= 0 && args[index + 1] ? args[index + 1] : fallback;
};

const portrait = flag("--portrait");
const suffix = portrait ? "-portrait" : "";
const [VIEW_W, VIEW_H] = portrait ? [1080, 1920] : [1920, 1080];
const outDir = path.resolve(repo, option("--out", "renders/duo-unfold"));
const ALLOWED_LANGS = ["zh", "en"];
const langs = (option("--langs", "zh,en") ?? "zh,en").split(",").map((s) => s.trim()).filter(Boolean);
if (langs.some((lang) => !ALLOWED_LANGS.includes(lang))) {
  // The page falls back to zh for any unknown lang, which would silently
  // mislabel the render — fail fast instead.
  throw new Error(`unsupported --langs value; allowed: ${ALLOWED_LANGS.join(", ")}`);
}
const keepFrames = flag("--keep-frames");
const chromeBin = process.env.CHROME_BIN ?? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const cdpPort = Number(process.env.RENDER_CDP_PORT ?? 9223);

// qa-cdp.mjs pins its HTTP helpers to CDP_HOST/CDP_PORT at module load, so
// inject the render port before the dynamic import resolves the module.
process.env.CDP_PORT = String(cdpPort);
const { CDP, getJson, sleep, openPage, navigateAndWait, evaluate } = await import("./qa-cdp.mjs");

function ensureFFmpeg() {
  const probe = spawnSync("ffmpeg", ["-version"], { encoding: "utf8" });
  if (probe.status !== 0) throw new Error("ffmpeg not found on PATH — install it first (brew install ffmpeg)");
}

/** The published copy must be byte-identical to the design source, otherwise
 *  the video would not show what the site serves. */
function ensurePublishedCopyCurrent() {
  const source = readFileSync(SOURCE_HTML);
  const published = readFileSync(PUBLISHED_HTML);
  if (!source.equals(published)) {
    throw new Error(
      "public/duo/index.html is not a byte-identical copy of docs/design/duo-unfold-lab-frame-study.html — re-copy it before rendering",
    );
  }
}

async function startChrome() {
  const profile = mkdtempSync(path.join(os.tmpdir(), "duo-render-profile-"));
  const chrome = spawn(
    chromeBin,
    [
      "--headless=new",
      `--remote-debugging-port=${cdpPort}`,
      `--user-data-dir=${profile}`,
      `--window-size=${VIEW_W},${VIEW_H}`,
      "--hide-scrollbars",
      "--disable-gpu",
      "--no-first-run",
      "--no-default-browser-check",
    ],
    { stdio: "ignore" },
  );
  for (let attempt = 0; attempt < 50; attempt += 1) {
    if (chrome.exitCode !== null) {
      chrome.kill();
      rmSync(profile, { recursive: true, force: true });
      throw new Error(`Chrome exited early with code ${chrome.exitCode}`);
    }
    try {
      const info = await getJson("/json/version");
      if (info?.webSocketDebuggerUrl) return { chrome, profile, browserWsUrl: info.webSocketDebuggerUrl };
    } catch {
      // not listening yet
    }
    await sleep(200);
  }
  chrome.kill();
  rmSync(profile, { recursive: true, force: true });
  throw new Error(`Chrome did not expose a debugging endpoint on port ${cdpPort} within 10s`);
}

/** easeInOut must match the page's own easing exactly (scripts inline copy). */
const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

async function renderFrames(page, { framesDir, lang }) {
  const pageUrl = `file://${PUBLISHED_HTML}?video=1&lang=${lang}`;
  await navigateAndWait(
    page,
    pageUrl,
    `document.body.classList.contains("lab-video") && !!document.getElementById("scrubRange")`,
  );

  const legFrames = Math.round(UNFOLD_SECONDS * FRAME_RATE);
  let rendered = 0;  // Drive the page's own scrub control: the input handler runs setVars()
  // synchronously, so the screenshot that follows is exactly this progress.
  const captureTo = async (progress, file) => {
    await evaluate(page.send, `(() => {
      const range = document.getElementById("scrubRange");
      range.value = String(Math.round(${progress.toFixed(6)} * 1000));
      range.dispatchEvent(new Event("input", { bubbles: true }));
    })()`);
    const { data } = await page.send("Page.captureScreenshot", { format: "png", optimizeForSpeed: true });
    writeFileSync(file, Buffer.from(data, "base64"));
    rendered += 1;
  };
  const captureLeg = async (legDir, progressAt) => {
    for (let frame = 0; frame < legFrames; frame += 1) {
      await captureTo(
        progressAt(frame / FRAME_RATE / UNFOLD_SECONDS),
        path.join(framesDir, legDir, `${String(frame).padStart(4, "0")}.png`),
      );
    }
  };

  await captureLeg("open", (t) => easeInOut(Math.min(1, t)));
  await captureTo(1, path.join(framesDir, "hold-open.png"));
  await captureLeg("close", (t) => 1 - easeInOut(Math.min(1, t)));
  await captureTo(0, path.join(framesDir, "hold-closed.png"));

  const expected = legFrames * 2 + 2;
  if (rendered !== expected) throw new Error(`rendered ${rendered} frames, expected ${expected}`);
  return { legFrames, holdFrames: Math.round(HOLD_SECONDS * FRAME_RATE) };
}

function runFFmpeg(args, { label }) {
  const result = spawnSync("ffmpeg", ["-hide_banner", "-loglevel", "error", "-y", ...args], { encoding: "utf8" });
  if (result.status !== 0) throw new Error(`ffmpeg ${label} failed:\n${result.stderr.slice(-2000)}`);
}

function encodeVideo({ framesDir, outDir, lang }) {
  const encodeSegment = (inputPattern, isHold, name) => {
    const args = isHold
      ? ["-loop", "1", "-framerate", String(FRAME_RATE), "-i", inputPattern, "-t", String(HOLD_SECONDS)]
      : ["-framerate", String(FRAME_RATE), "-i", inputPattern];
    runFFmpeg(
      [...args, "-c:v", "libx264", "-preset", "slow", "-crf", "15", "-pix_fmt", "yuv420p", path.join(outDir, name.replace("${lang}", lang))],
      { label: `encode ${name}` },
    );
  };

  encodeSegment(path.join(framesDir, "open",  "%04d.png"), false, `${lang}-seg-open.mp4`);
  encodeSegment(path.join(framesDir, "hold-open.png"), true, `${lang}-seg-hold-open.mp4`);
  encodeSegment(path.join(framesDir, "close", "%04d.png"), false, `${lang}-seg-close.mp4`);
  encodeSegment(path.join(framesDir, "hold-closed.png"), true, `${lang}-seg-hold-closed.mp4`);

  const listFile = path.join(outDir, `${lang}-concat.txt`);
  writeFileSync(
    listFile,
    [
      `file '${lang}-seg-open.mp4'`,
      `file '${lang}-seg-hold-open.mp4'`,
      `file '${lang}-seg-close.mp4'`,
      `file '${lang}-seg-hold-closed.mp4'`,
    ].join("\n"),
  );
  runFFmpeg(
    ["-f", "concat", "-safe", "0", "-i", listFile, "-c", "copy", "-movflags", "+faststart", path.join(outDir, `duo-unfold-${lang}${suffix}.mp4`)],
    { label: "concat master" },
  );
  for (const name of [`${lang}-seg-open.mp4`, `${lang}-seg-hold-open.mp4`, `${lang}-seg-close.mp4`, `${lang}-seg-hold-closed.mp4`, `${lang}-concat.txt`]) {
    rmSync(path.join(outDir, name), { force: true });
  }
}

/** Encode the README GIF, stepping down the ladder until ≤9MB.
 *  Portrait frames carry ~2x the pixel area of landscape at equal width, so
 *  the portrait ladder targets narrower widths to clear the same cap. */
function encodeGif({ outDir, lang }) {
  const master = path.join(outDir, `duo-unfold-${lang}${suffix}.mp4`);
  const palette = path.join(outDir, `${lang}${suffix}-palette.png`);
  const widths = portrait ? [540, 540, 480, 420] : [GIF_WIDTH, GIF_WIDTH, GIF_WIDTH, 720];
  const rungs = [
    { name: `${lang}${suffix}-rung-base`, fps: 25, width: widths[0], dither: "dither=sierra2_4a" },
    { name: `${lang}${suffix}-rung-bayer`, fps: 25, width: widths[1], dither: "dither=bayer:bayer_scale=4" },
    { name: `${lang}${suffix}-rung-20fps`, fps: 20, width: widths[2], dither: "dither=bayer:bayer_scale=4" },
    { name: `${lang}${suffix}-rung-final`, fps: 20, width: widths[3], dither: "dither=bayer:bayer_scale=4" },
  ];
  for (const rung of rungs) {
    const scale = `scale=${rung.width}:-2:flags=lanczos`;
    runFFmpeg(
      ["-i", master, "-vf", `fps=${rung.fps},${scale},palettegen=stats_mode=diff`, palette],
      { label: `palette ${rung.name}` },
    );
    const gifPath = path.join(outDir, `${rung.name}.gif`);
    runFFmpeg(
      [
        "-i", master, "-i", palette,
        "-lavfi", `fps=${rung.fps},${scale} [x]; [x][1:v] paletteuse=${rung.dither}:diff_mode=rectangle`,
        "-loop", "0",
        gifPath,
      ],
      { label: `gif ${rung.name}` },
    );
    const size = readFileSync(gifPath).length;
    console.log(`  ${rung.name}: ${(size / 1024 / 1024).toFixed(2)} MB (fps ${rung.fps}, width ${rung.width})`);
    if (size <= GIF_MAX_BYTES) {
      // Ship a stable name regardless of which rung won, and drop every rung
      // artifact (each can approach the 9MB cap).
      const finalPath = path.join(outDir, `duo-unfold-${lang}${suffix}.gif`);
      writeFileSync(finalPath, readFileSync(gifPath));
      for (const rung of rungs) rmSync(path.join(outDir, `${rung.name}.gif`), { force: true });
      return { gifPath: finalPath, size, rung };
    }
  }
  throw new Error("GIF still over 9MB at the last ladder rung — inspect renders manually");
}

async function renderLanguage(browser, lang, outDir) {
  console.log(`[${lang}] rendering ${Math.round(UNFOLD_SECONDS * FRAME_RATE) * 2 + 2} unique frames @ ${FRAME_RATE}fps …`);
  const framesDir = path.join(outDir, `frames-${lang}${suffix}`);
  rmSync(framesDir, { recursive: true, force: true });
  for (const sub of ["open", "close"]) mkdirSync(path.join(framesDir, sub), { recursive: true });
  const page = await openPage(browser, { width: VIEW_W, height: VIEW_H, deviceScaleFactor: 1 });
  try {
    // prefers-reduced-motion kills the page's cosmetic transitions, keeping
    // every screenshot a pure function of the driven progress.
    await page.send("Emulation.setEmulatedMedia", {
      features: [{ name: "prefers-reduced-motion", value: "reduce" }],
    });
    await renderFrames(page, { framesDir, lang });
    console.log(`[${lang}] frames done, encoding video …`);
    encodeVideo({ framesDir, outDir, lang });
    console.log(`[${lang}] master video done, encoding GIF ladder …`);
    const gif = await encodeGif({ outDir, lang });
    console.log(`[${lang}] ✓ duo-unfold-${lang}.mp4 + ${path.basename(gif.gifPath)}`);
    return gif.gifPath;
  } finally {
    await page.close();
  }
}

async function main() {
  ensureFFmpeg();
  ensurePublishedCopyCurrent();
  mkdirSync(outDir, { recursive: true });
  const { chrome, profile, browserWsUrl } = await startChrome();
  const browser = new CDP(browserWsUrl);
  const gifPaths = {};
  try {
    await browser.connect();
    for (const lang of langs) {
      gifPaths[lang] = await renderLanguage(browser, lang, outDir);
    }
  } finally {
    browser.close();
    chrome.kill();
    // The profile dir is still being flushed right after kill(); wait for the
    // process to actually exit before removing it.
    await new Promise((resolve) => chrome.once("exit", resolve));
    if (!keepFrames) {
      for (const dir of readdirSync(outDir).filter((name) => name.startsWith("frames-"))) {
        rmSync(path.join(outDir, dir), { recursive: true, force: true });
      }
    }
    rmSync(profile, { recursive: true, force: true });
  }
  console.log("\nDone. Deliverables:");
  for (const lang of langs) {
    console.log(`  video : ${path.join(outDir, `duo-unfold-${lang}${suffix}.mp4`)}`);
    console.log(`  gif   : ${gifPaths[lang] ?? "(failed)"}`);
  }
}

main().catch((error) => {
  console.error(`::error::${error.message}`);
  process.exitCode = 1;
});
