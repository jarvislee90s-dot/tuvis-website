/**
 * Interactive browser acceptance for the Tuvis World workshop.
 *
 * Usage: node scripts/qa-world-interactions.mjs [baseUrl]
 *
 * Prerequisites:
 *   - pnpm preview --host 127.0.0.1 --port 4173
 *   - Chrome/Chromium started with
 *       --remote-debugging-port=9222 --user-data-dir=/tmp/tuvis-qa-profile
 *
 * The driver polls for state changes (no fixed "sleep and hope"), sends real
 * mouse events through Input.dispatchMouseEvent, verifies hit-testing with
 * elementFromPoint, clears localStorage between scenarios, checks two
 * viewports and writes screenshots to docs/qa/screenshots/.
 */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  CDP,
  collectFailures,
  evaluate,
  getJson,
  navigateAndWait,
  openPage,
  reloadAndWait,
  sleep,
  waitFor,
} from "./qa-cdp.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const DEFAULT_BASE = "http://127.0.0.1:4173/tuvis-website";
const SCENE_SIZE = [1536, 1024];
const STORAGE_KEY = "tuvis-world-v1";
const SHOT_DIR = path.resolve(here, "../docs/qa/screenshots");
const TOTAL_TIMEOUT_MS = 300_000;
const SCENE = JSON.parse(
  readFileSync(path.resolve(here, "../public/world/v1/scene.json"), "utf8"),
);
const TOOLBOX_APPROACH = SCENE.hotspots.find((hotspot) => hotspot.id === "toolbox")?.approach;
/** Distance-based expected arrival with a 1.5x detour allowance for pathing. */
const EXPECTED_TOOLBOX_ARRIVAL_MS = TOOLBOX_APPROACH
  ? (Math.hypot(
      TOOLBOX_APPROACH[0] - SCENE.spawn[0],
      TOOLBOX_APPROACH[1] - SCENE.spawn[1],
    ) *
      1.5 *
      1000) /
    SCENE.speed
  : 4_000;

const READY_WORKSHOP = `(() => {
  const img = document.querySelector(".world-stage-bg");
  return Boolean(document.querySelector(".world-stage")) && Boolean(img) && img.complete && img.naturalWidth > 0;
})()`;
const READY_LANDING = `(() => {
  const imgs = document.querySelectorAll("img.world-hero-city, img.world-hero-character");
  return document.querySelectorAll(".world-equipment-card").length === 4 && imgs.length === 2 &&
    Array.from(imgs).every((img) => img.complete && img.naturalWidth > 0);
})()`;

const results = [];
function record(name, ok, detail) {
  const entry = { name, ok: Boolean(ok), detail };
  results.push(entry);
  console.log(`${entry.ok ? "PASS" : "FAIL"} ${name}${detail === undefined ? "" : ` — ${JSON.stringify(detail)}`}`);
  return entry.ok;
}

async function mouseClick(send, x, y) {
  await send("Input.dispatchMouseEvent", {
    type: "mousePressed",
    x,
    y,
    button: "left",
    buttons: 1,
    clickCount: 1,
  });
  await sleep(20);
  await send("Input.dispatchMouseEvent", {
    type: "mouseReleased",
    x,
    y,
    button: "left",
    buttons: 0,
    clickCount: 1,
  });
}

async function mouseDrag(send, from, to, steps = 8) {
  await send("Input.dispatchMouseEvent", {
    type: "mousePressed",
    x: from.x,
    y: from.y,
    button: "left",
    buttons: 1,
    clickCount: 1,
  });
  for (let step = 1; step <= steps; step += 1) {
    const x = from.x + ((to.x - from.x) * step) / steps;
    const y = from.y + ((to.y - from.y) * step) / steps;
    await send("Input.dispatchMouseEvent", {
      type: "mouseMoved",
      x,
      y,
      button: "left",
      buttons: 1,
    });
    await sleep(25);
  }
  await send("Input.dispatchMouseEvent", {
    type: "mouseReleased",
    x: to.x,
    y: to.y,
    button: "left",
    buttons: 0,
    clickCount: 1,
  });
}

async function centerOf(send, selector) {
  const rect = await evaluate(
    send,
    `(() => {
      const el = document.querySelector(${JSON.stringify(selector)});
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return { x: r.left + r.width / 2, y: r.top + r.height / 2, left: r.left, top: r.top, width: r.width, height: r.height };
    })()`,
  );
  if (!rect) throw new Error(`Element not found: ${selector}`);
  return rect;
}

async function buttonByText(send, text) {
  const rect = await evaluate(
    send,
    `(() => {
      const button = Array.from(document.querySelectorAll("button")).find((node) => node.textContent.trim() === ${JSON.stringify(text)});
      if (!button) return null;
      const r = button.getBoundingClientRect();
      return { x: r.left + r.width / 2, y: r.top + r.height / 2, disabled: button.disabled };
    })()`,
  );
  if (!rect) throw new Error(`Button not found: ${text}`);
  return rect;
}

async function clickSelector(send, selector) {
  const center = await centerOf(send, selector);
  await mouseClick(send, center.x, center.y);
  return center;
}

async function clickButton(send, text) {
  await waitFor(
    send,
    `(() => {
      const button = Array.from(document.querySelectorAll("button")).find((node) => node.textContent.trim() === ${JSON.stringify(text)});
      return Boolean(button && !button.disabled);
    })()`,
    { timeoutMs: 10_000 },
  );
  const center = await buttonByText(send, text);
  await mouseClick(send, center.x, center.y);
  return center;
}

const dialogCount = `document.querySelectorAll('[role="dialog"]').length`;

async function waitForDialog(send, timeoutMs = 30_000) {
  return waitFor(send, `document.querySelectorAll('[role="dialog"]').length === 1`, { timeoutMs });
}

async function waitForDialogGone(send, timeoutMs = 10_000) {
  return waitFor(send, `document.querySelectorAll('[role="dialog"]').length === 0`, { timeoutMs });
}

async function waitForMoveStart(send, timeoutMs = 5_000) {
  return waitFor(send, `Boolean(document.querySelector(".world-actor.is-moving"))`, { timeoutMs });
}

async function waitForMoveEnd(send, timeoutMs = 40_000) {
  return waitFor(send, `!document.querySelector(".world-actor.is-moving")`, { timeoutMs });
}

/** Poll in the page clock for at least `ms`; never a blind one-shot sleep. */
async function waitAtLeast(send, ms) {
  const startedAt = await evaluate(send, `Date.now()`);
  await waitFor(send, `Date.now() >= ${startedAt + Math.ceil(ms)}`, {
    timeoutMs: Math.ceil(ms) + 10_000,
    intervalMs: 100,
  });
}

async function waitForQuestAction(send, text, timeoutMs = 30_000) {
  return waitFor(
    send,
    `(document.querySelector(".world-questbar")?.innerText ?? "").includes(${JSON.stringify(text)})`,
    { timeoutMs },
  );
}

async function clickHotspot(send, id) {
  const center = await centerOf(send, `.world-hotspot[data-hotspot="${id}"]`);
  await mouseClick(send, center.x, center.y);
  await waitForDialog(send);
}

async function closeDialog(send) {
  await clickSelector(send, ".world-modal-close");
  await waitForDialogGone(send);
}

async function clearStorageAndReload(send, url) {
  await evaluate(send, `localStorage.clear()`);
  await navigateAndWait({ send }, url, READY_WORKSHOP);
}

async function readQuest(send) {
  const raw = await evaluate(send, `localStorage.getItem(${JSON.stringify(STORAGE_KEY)})`);
  if (!raw) return null;
  return JSON.parse(raw);
}

async function readActorPosition(send) {
  return evaluate(
    send,
    `(() => {
      const svg = document.querySelector(".world-actor svg[data-frame]");
      if (!svg) return null;
      const left = parseFloat(svg.style.left);
      const top = parseFloat(svg.style.top);
      return {
        position: [(left / 100) * ${SCENE_SIZE[0]}, (top / 100) * ${SCENE_SIZE[1]}],
        frame: svg.getAttribute("data-frame"),
      };
    })()`,
  );
}

async function dismissHelp(send) {
  const banner = await evaluate(send, `Boolean(document.querySelector(".world-help-banner"))`);
  if (!banner) return;
  await clickButton(send, "知道了");
  await waitFor(send, `!document.querySelector(".world-help-banner")`);
}

async function screenshot(send, name) {
  const { data } = await send("Page.captureScreenshot", { format: "png", fromSurface: true });
  const file = path.join(SHOT_DIR, name);
  writeFileSync(file, Buffer.from(data, "base64"));
  return file;
}

async function collectModules(send, order) {
  const labels = { sight: "瞄准模块", cell: "能源匣", emitter: "脉冲发射头" };
  const hotspots = { sight: "toolbox", cell: "posters", emitter: "window" };
  for (const id of order) {
    await clickHotspot(send, hotspots[id]);
    const dialogText = await evaluate(send, `document.querySelector('[role="dialog"]')?.innerText ?? ""`);
    record(`collect ${id}: overlay content`, dialogText.length > 0, dialogText.slice(0, 40));
    const quest = await readQuest(send);
    record(`collect ${id}: stored`, Boolean(quest?.quest?.collected?.includes(id)), quest?.quest?.collected);
    const status = await evaluate(send, `document.querySelector(".world-questbar")?.innerText ?? ""`);
    record(`collect ${id}: quest bar updated`, status.includes(labels[id]) && status.includes("已领取"), status.replace(/\s+/g, " ").slice(0, 80));
    await closeDialog(send);
  }
}

async function repairAndOpenAssembly(send) {
  await clickHotspot(send, "workbench");
  const repairHeading = await evaluate(send, `document.querySelector('[role="dialog"]')?.innerText ?? ""`);
  record("workbench: repair panel opens", repairHeading.includes("能源匣维修"), repairHeading.replace(/\s+/g, " ").slice(0, 60));

  await clickSelector(send, '[aria-label="松动接口"]');
  await clickButton(send, "执行检查");
  await waitFor(send, `document.body.innerText.includes("接口已复位，供能检查通过。")`);
  record("workbench: repair completes", true, "接口已复位，供能检查通过。");
  await screenshot(send, "workbench-repair.png");

  await clickButton(send, "进入组装");
  await waitFor(send, `Boolean(document.querySelector(".world-assembly-stage"))`, { timeoutMs: 15_000 });
  await waitFor(send, `document.querySelectorAll(".world-assembly-piece").length === 3`, { timeoutMs: 15_000 });
  record("workbench: assembly opens with three pieces", true, await evaluate(send, `document.querySelectorAll(".world-assembly-piece").length`));
}

async function installByClick(send, id, label, shotName) {
  const piece = await centerOf(send, `[aria-label="零件：${label}"]`);
  await mouseClick(send, piece.x, piece.y);
  await waitFor(
    send,
    `(() => {
      const pressed = document.querySelector('.world-assembly-piece[aria-pressed="true"]');
      return document.querySelector(".world-assembly-stage")?.classList.contains("has-selection") &&
        pressed?.getAttribute("aria-label") === ${JSON.stringify(`零件：${label}`)};
    })()`,
  );

  const socket = await centerOf(send, `[aria-label="插槽：${label}"]`);
  const hit = await evaluate(
    send,
    `(() => {
      const el = document.elementFromPoint(${socket.x}, ${socket.y});
      const target = document.querySelector(${JSON.stringify(`[aria-label="插槽：${label}"]`)});
      return {
        hitSocket: Boolean(el && target && (el === target || target.contains(el))),
        tag: el ? el.tagName : null,
        className: el ? (typeof el.className === "string" ? el.className : el.className?.baseVal ?? "") : null,
        aria: el ? el.getAttribute("aria-label") : null,
      };
    })()`,
  );
  record(`assembly click ${id}: elementFromPoint hits socket`, hit.hitSocket, hit);
  if (!hit.hitSocket) throw new Error(`Socket ${id} is covered: ${JSON.stringify(hit)}`);
  if (shotName) await screenshot(send, shotName);

  const before = await evaluate(send, `document.querySelectorAll(".world-assembly-installed").length`);
  await mouseClick(send, socket.x, socket.y);
  try {
    await waitFor(
      send,
      `(() => {
        const count = document.querySelectorAll(".world-assembly-installed").length;
        const complete = document.body.innerText.includes("Bug Buster 组装完成");
        return count === ${before + 1} || (${before} === 2 && complete);
      })()`,
    );
  } catch (error) {
    const diagnostic = await evaluate(
      send,
      `({
        notice: document.querySelector(".world-scene-notice")?.textContent ?? null,
        selected: document.querySelector('.world-assembly-piece[aria-pressed="true"]')?.getAttribute("aria-label") ?? null,
        installed: document.querySelectorAll(".world-assembly-installed").length,
        pieces: Array.from(document.querySelectorAll(".world-assembly-piece")).map((node) => node.getAttribute("aria-label")),
      })`,
    );
    throw new Error(`${error.message}; diagnostic=${JSON.stringify(diagnostic)}`);
  }
  record(`assembly click ${id}: installed count`, true, before + 1);
}

async function installByDrag(send, id, label) {
  const piece = await centerOf(send, `[aria-label="零件：${label}"]`);
  const socket = await centerOf(send, `[aria-label="插槽：${label}"]`);
  const before = await evaluate(send, `document.querySelectorAll(".world-assembly-installed").length`);
  await mouseDrag(send, piece, socket);
  await waitFor(
    send,
    `(() => {
      const count = document.querySelectorAll(".world-assembly-installed").length;
      const complete = document.body.innerText.includes("Bug Buster 组装完成");
      return count === ${before + 1} || (${before} === 2 && complete);
    })()`,
  );
  record(`assembly drag ${id}: installed count`, true, before + 1);
}

async function finishAssemblyAndRack(send, shotName) {
  await waitFor(send, `document.body.innerText.includes("Bug Buster 组装完成")`);
  const assembled = await readQuest(send);
  record("assembly: all three installed", assembled?.quest?.installed?.length === 3, assembled?.quest?.installed);

  await clickButton(send, "返回工坊");
  await waitForDialogGone(send);

  // The rack has no dialog: arrival places the weapon and switches to the display pose.
  const rack = await centerOf(send, '.world-hotspot[data-hotspot="rack"]');
  await mouseClick(send, rack.x, rack.y);
  await waitFor(send, `Boolean(document.querySelector(".world-rack-display"))`, { timeoutMs: 30_000 });
  await waitForMoveEnd(send);
  await waitForQuestAction(send, "主线完成");
  const questBar = await evaluate(send, `document.querySelector(".world-questbar")?.innerText ?? ""`);
  record("rack: quest completes", questBar.includes("主线完成"), questBar.replace(/\s+/g, " ").slice(0, 80));
  const pose = await readActorPosition(send);
  record("rack: display pose", pose?.frame === "display", pose?.frame);
  // Capture only after the panel is gone, the actor has arrived and the
  // completion copy is on screen — never the assembly dialog.
  await screenshot(send, shotName);
  const stored = await readQuest(send);
  record(
    "rack: persisted completion",
    stored?.schemaVersion === 1 && stored?.quest?.displayedOnRack === true && stored?.quest?.installed?.length === 3,
    stored,
  );
}

async function runMainChain(send, url) {
  await clearStorageAndReload(send, url);
  await waitForDialogGone(send);
  const initial = await screenshot(send, "workshop-zh-1280.png");
  record("workshop: initial screenshot", true, path.basename(initial));
  await dismissHelp(send);

  await collectModules(send, ["sight", "cell", "emitter"]);
  await repairAndOpenAssembly(send);

  await installByClick(send, "sight", "瞄准模块", "assembly-selected.png");
  await installByClick(send, "cell", "能源匣");
  await installByClick(send, "emitter", "脉冲发射头");
  await waitFor(
    send,
    `Array.from(document.querySelectorAll(".world-assembly-actions button")).some((node) => node.textContent.trim() === "返回工坊")`,
  );
  // The modal card is scrollable on an 800px viewport; bring the close action
  // into view so the completion screenshot includes the "返回工坊" button.
  await evaluate(
    send,
    `(() => {
      const button = Array.from(document.querySelectorAll(".world-assembly-actions button"))
        .find((node) => node.textContent.trim() === "返回工坊");
      button?.scrollIntoView({ block: "nearest" });
      return Boolean(button);
    })()`,
  );
  await screenshot(send, "assembly-complete.png");
  await finishAssemblyAndRack(send, "rack-complete.png");
}

async function runCancelProbe(send, url) {
  await clearStorageAndReload(send, url);
  await dismissHelp(send);
  const before = await readQuest(send);

  const box = await centerOf(send, '.world-hotspot[data-hotspot="toolbox"]');
  await mouseClick(send, box.x, box.y);
  // Movement starts immediately; drop focus before the actor can arrive.
  await waitForMoveStart(send);
  await evaluate(send, `window.dispatchEvent(new Event("blur"))`);
  // Poll for twice the detour-adjusted arrival time. A cancelled arrival must
  // stay cancelled for the whole window instead of being masked by a short sleep.
  await waitAtLeast(send, EXPECTED_TOOLBOX_ARRIVAL_MS * 2);

  const dialogs = await evaluate(send, dialogCount);
  const after = await readQuest(send);
  const questBar = await evaluate(send, `document.querySelector(".world-questbar")?.innerText ?? ""`);
  const moving = await evaluate(send, `Boolean(document.querySelector(".world-actor.is-moving"))`);
  record("cancel: no dialog after blur", dialogs === 0, dialogs);
  record("cancel: quest unchanged", JSON.stringify(after) === JSON.stringify(before), { before, after });
  record("cancel: actor stopped", !moving, moving);
  record("cancel: no collection recorded", !questBar.includes("已领取"), questBar.replace(/\s+/g, " ").slice(0, 80));
}

async function runDragChain(send, url) {
  await clearStorageAndReload(send, url);
  await dismissHelp(send);
  // Different collection order: any module order must work.
  await collectModules(send, ["cell", "emitter", "sight"]);
  await repairAndOpenAssembly(send);
  await installByDrag(send, "cell", "能源匣");
  await installByDrag(send, "sight", "瞄准模块");
  await installByDrag(send, "emitter", "脉冲发射头");
  await finishAssemblyAndRack(send, "workshop-drag-complete.png");
}

async function clickScenePoint(send, point) {
  const mapped = await evaluate(
    send,
    `(() => {
      const stage = document.querySelector(".world-stage");
      const r = stage.getBoundingClientRect();
      return {
        x: r.left + (${point[0]} / ${SCENE_SIZE[0]}) * r.width,
        y: r.top + (${point[1]} / ${SCENE_SIZE[1]}) * r.height,
        rect: { left: r.left, top: r.top, width: r.width, height: r.height },
      };
    })()`,
  );
  await mouseClick(send, mapped.x, mapped.y);
  await waitForMoveStart(send);
  try {
    await waitFor(
      send,
      `(() => {
        if (document.querySelector(".world-actor.is-moving")) return false;
        const svg = document.querySelector(".world-actor svg[data-frame]");
        if (!svg) return false;
        const x = (parseFloat(svg.style.left) / 100) * ${SCENE_SIZE[0]};
        const y = (parseFloat(svg.style.top) / 100) * ${SCENE_SIZE[1]};
        // CSS serializes percentage positions to ~6 significant digits.
        return Math.hypot(x - ${point[0]}, y - ${point[1]}) < 3;
      })()`,
      { timeoutMs: 40_000 },
    );
  } catch (error) {
    const diagnostic = await evaluate(
      send,
      `(() => {
        const svg = document.querySelector(".world-actor svg[data-frame]");
        return {
          position: svg ? [(parseFloat(svg.style.left) / 100) * ${SCENE_SIZE[0]}, (parseFloat(svg.style.top) / 100) * ${SCENE_SIZE[1]}] : null,
          moving: Boolean(document.querySelector(".world-actor.is-moving")),
          notice: document.querySelector(".world-scene-notice")?.textContent ?? null,
          dialog: document.querySelectorAll('[role="dialog"]').length,
          helpBanner: Boolean(document.querySelector(".world-help-banner")),
        };
      })()`,
    );
    throw new Error(`${error.message}; diagnostic=${JSON.stringify(diagnostic)}`);
  }
  return { position: (await readActorPosition(send)).position, rect: mapped.rect };
}

async function runZoomProbe(page, url) {
  const point = [650, 720];
  await page.send("Emulation.setDeviceMetricsOverride", {
    width: 1280,
    height: 800,
    deviceScaleFactor: 1,
    mobile: false,
  });
  await clearStorageAndReload(page.send, url);
  const at1280 = await clickScenePoint(page.send, point);
  record("zoom: movement at 1280", true, at1280.position.map((n) => Number(n.toFixed(2))));

  await page.send("Emulation.setDeviceMetricsOverride", {
    width: 1600,
    height: 900,
    deviceScaleFactor: 1,
    mobile: false,
  });
  await clearStorageAndReload(page.send, url);
  const at1600 = await clickScenePoint(page.send, point);
  const dx = Math.abs(at1280.position[0] - at1600.position[0]);
  const dy = Math.abs(at1280.position[1] - at1600.position[1]);
  record("zoom: stage rescaled", Math.abs(at1280.rect.width - at1600.rect.width) > 50, {
    width1280: at1280.rect.width,
    width1600: at1600.rect.width,
  });
  record("zoom: same scene point maps identically", dx < 2 && dy < 2, { dx, dy, at1280: at1280.position, at1600: at1600.position });
  await screenshot(page.send, "workshop-zh-1600.png");

  await page.send("Emulation.setDeviceMetricsOverride", {
    width: 1280,
    height: 800,
    deviceScaleFactor: 1,
    mobile: false,
  });
}

async function runDeepLinks(browser, base) {
  const routes = [
    { name: "zh/world", url: `${base}/zh/world`, ready: READY_LANDING, shot: "landing-zh-1280.png" },
    { name: "zh/world/workshop", url: `${base}/zh/world/workshop`, ready: READY_WORKSHOP },
    { name: "en/world", url: `${base}/en/world`, ready: READY_LANDING, shot: "landing-en-1280.png" },
    { name: "en/world/workshop", url: `${base}/en/world/workshop`, ready: READY_WORKSHOP },
  ];

  for (const route of routes) {
    const page = await openPage(browser, { width: 1280, height: 800, deviceScaleFactor: 1 });
    try {
      browser.events.length = 0;
      await navigateAndWait(page, route.url, route.ready);
      await evaluate(page.send, `localStorage.clear()`);
      const first = collectFailures(browser.events);
      if (route.shot) await screenshot(page.send, route.shot);

      browser.events.length = 0;
      await reloadAndWait(page, route.ready);
      const second = collectFailures(browser.events);

      const failures = [...first.failedRequests, ...second.failedRequests].filter((item) => !item.canceled);
      const errors = [...first.consoleErrors, ...second.consoleErrors];
      record(`deep link ${route.name}: direct load + reload`, failures.length === 0 && errors.length === 0, {
        failures,
        errors,
      });
    } finally {
      await page.close();
    }
  }
}

async function main() {
  mkdirSync(SHOT_DIR, { recursive: true });
  const browserInfo = await getJson("/json/version");
  const browser = new CDP(browserInfo.webSocketDebuggerUrl);
  await browser.connect();
  const base = process.argv[2] ?? DEFAULT_BASE;
  const url = `${base}/zh/world/workshop`;
  console.log(`Browser: ${browserInfo.Browser}`);
  console.log(`WebSocket: ${browser.impl ? "ws package (.pnpm)" : "globalThis.WebSocket"}`);
  console.log(`Base: ${base}`);

  const page = await openPage(browser, { width: 1280, height: 800, deviceScaleFactor: 1 });
  try {
    browser.events.length = 0;
    await navigateAndWait(page, url, READY_WORKSHOP);
    record("workshop: initial load", true, url);

    await runMainChain(page.send, url);
    await runCancelProbe(page.send, url);
    await runDragChain(page.send, url);
    await runZoomProbe(page, url);
    await runDeepLinks(browser, base);
  } finally {
    await page.close();
    browser.close();
  }

  const failed = results.filter((entry) => !entry.ok);
  console.log(`\nINTERACTION QA ${failed.length === 0 ? "PASS" : "FAILED"}: ${results.length - failed.length}/${results.length} probes`);
  if (failed.length > 0) {
    for (const entry of failed) console.error(`- ${entry.name}: ${JSON.stringify(entry.detail)}`);
    process.exit(1);
  }
  console.log(`Screenshots: ${SHOT_DIR}`);
}

const hardTimeout = setTimeout(() => {
  console.error("INTERACTION QA TIMEOUT");
  process.exit(2);
}, TOTAL_TIMEOUT_MS);
hardTimeout.unref();

main().catch((error) => {
  console.error("INTERACTION QA FAILED:", error.message);
  process.exit(1);
});
