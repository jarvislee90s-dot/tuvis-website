#!/usr/bin/env node
/**
 * Render the README hero shot from the site's own ProductShowcase components
 * (desktop board + phone), per language — the image in the main repo's
 * READMEs is literally this site's HTML, not a separate mockup.
 *
 * Prerequisite: `pnpm build` (the script serves dist/ through vite preview),
 * Chrome, and a free RENDER_CDP_PORT (default 9223).
 *
 * Usage: node scripts/render-product-shot.mjs [--out renders/product-shot]
 * Captures #product's two-column grid for /zh and /en at 2x DPR, waiting for
 * the whileInView reveal to settle before each shot.
 */
import { spawn, spawnSync } from "node:child_process";
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const repo = path.resolve(here, "..");
const args = process.argv.slice(2);
const option = (name, fallback) => {
  const index = args.indexOf(name);
  return index >= 0 && args[index + 1] ? args[index + 1] : fallback;
};
const outDir = path.resolve(repo, option("--out", "renders/product-shot"));
const httpPort = Number(process.env.RENDER_HTTP_PORT ?? 4188);
const langs = ["zh", "en"];

const chromeBin = process.env.CHROME_BIN ?? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const cdpPort = Number(process.env.RENDER_CDP_PORT ?? 9223);
process.env.CDP_PORT = String(cdpPort);
const { CDP, getJson, sleep, openPage, evaluate } = await import("./qa-cdp.mjs");

function ensureDist() {
  const probe = spawnSync("test", ["-f", path.join(repo, "dist/index.html")]);
  if (probe.status !== 0) throw new Error("dist/index.html missing — run `pnpm build` first");
}

async function startPreview() {
  // Invoke vite's JS entry directly — spawning `npx` stalls on registry checks.
  // --host 127.0.0.1 is required: default preview binds IPv6 localhost only,
  // which would strand both the readiness probe and Chrome on IPv4.
  const server = spawn(
    process.execPath,
    [
      path.join(repo, "node_modules/vite/bin/vite.js"),
      "preview",
      "--host", "127.0.0.1",
      "--port", String(httpPort),
      "--strictPort",
    ],
    { cwd: repo, stdio: "ignore" },
  );
  for (let attempt = 0; attempt < 50; attempt += 1) {
    try {
      const res = await fetch(`http://127.0.0.1:${httpPort}/`);
      if (res.ok) return server;
    } catch {
      // not listening yet
    }
    await sleep(200);
  }
  server.kill();
  throw new Error(`vite preview did not come up on port ${httpPort} within 10s`);
}

async function startChrome() {
  const chrome = spawn(
    chromeBin,
    [
      "--headless=new",
      `--remote-debugging-port=${cdpPort}`,
      `--user-data-dir=${path.join(repo, ".zcode", "render-profile-product")}`,
      "--window-size=1440,2600",
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
      throw new Error(`Chrome exited early with code ${chrome.exitCode}`);
    }
    try {
      const info = await getJson("/json/version");
      if (info?.webSocketDebuggerUrl) return { chrome, browserWsUrl: info.webSocketDebuggerUrl };
    } catch {
      // not listening yet
    }
    await sleep(200);
  }
  chrome.kill();
  throw new Error(`Chrome did not expose a debugging endpoint on port ${cdpPort} within 10s`);
}

async function shotLanguage(browser, lang) {
  const page = await openPage(browser, { width: 1440, height: 2600, deviceScaleFactor: 2 });
  try {
    await page.send("Page.navigate", { url: `http://127.0.0.1:${httpPort}/${lang}` });
    await evaluate(page.send, `new Promise((done) => {
      if (document.readyState === "complete") done(); else addEventListener("load", () => done(), { once: true });
    })`);
    // Bring the showcase into the viewport so whileInView fires, then wait
    // out the 0.5s reveal transition before measuring and capturing.
    await evaluate(page.send, `document.querySelector("#product").scrollIntoView({ block: "center" })`);
    await sleep(1200);
    // The README hero is the section's title + device grid only; keep the
    // duo embed (lazy iframe) out of the shot entirely.
    await evaluate(page.send, `(() => {
      const duo = document.querySelector("#product div.mt-14");
      if (duo) duo.style.display = "none";
    })()`);
    const rect = await evaluate(page.send, `(() => {
      const r = document.querySelector("#product").getBoundingClientRect();
      return { x: r.x, y: r.y + window.scrollY, width: r.width, height: r.height };
    })()`);
    const { data } = await page.send("Page.captureScreenshot", {
      format: "png",
      captureBeyondViewport: true,
      clip: { x: rect.x, y: rect.y, width: rect.width, height: rect.height, scale: 2 },
    });
    const file = path.join(outDir, `product-forms-${lang}.png`);
    writeFileSync(file, Buffer.from(data, "base64"));
    console.log(`✓ ${file}`);
  } finally {
    await page.close();
  }
}

async function main() {
  ensureDist();
  rmSync(outDir, { recursive: true, force: true });
  mkdirSync(outDir, { recursive: true });
  const server = await startPreview();
  const { chrome, browserWsUrl } = await startChrome();
  const browser = new CDP(browserWsUrl);
  try {
    await browser.connect();
    for (const lang of langs) await shotLanguage(browser, lang);
  } finally {
    browser.close();
    chrome.kill();
    // The profile dir is still being flushed right after kill(); wait for the
    // process to actually exit before removing it.
    await new Promise((resolve) => chrome.once("exit", resolve));
    server.kill();
    rmSync(path.join(repo, ".zcode", "render-profile-product"), { recursive: true, force: true });
  }
}

main().catch((error) => {
  console.error(`::error::${error.message}`);
  process.exitCode = 1;
});
