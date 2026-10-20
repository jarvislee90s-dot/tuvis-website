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
    `(document.querySelector(".world-quest-card")?.innerText ?? "").includes(${JSON.stringify(text)})`,
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
      const el = document.querySelector(".world-actor svg[data-frame], .world-actor div[data-sprite-anim]");
      if (!el) return null;
      const left = parseFloat(el.style.left);
      const top = parseFloat(el.style.top);
      return {
        position: [(left / 100) * ${SCENE_SIZE[0]}, (top / 100) * ${SCENE_SIZE[1]}],
        frame: el.getAttribute("data-frame"),
        anim: el.getAttribute("data-sprite-anim"),
      };
    })()`,
  );
}

async function screenshot(send, name) {
  const { data } = await send("Page.captureScreenshot", { format: "png", fromSurface: true });
  const file = path.join(SHOT_DIR, name);
  writeFileSync(file, Buffer.from(data, "base64"));
  return file;
}

/**
 * Active pickup flows. Visible parts (sofa/bookshelf): the floating part sits
 * on the object, clicking it walks over and collects. Concealed part
 * (toolbox): nothing floats — walking to the toolbox opens the box, which
 * yields the module directly.
 */
async function collectModules(send, order) {
  const labels = { body: "Bug Buster 机身", sight: "瞄准模块", cell: "能源匣", emitter: "脉冲发射头" };
  const hotspots = { body: "window", sight: "toolbox", cell: "lounge", emitter: "rack" };
  const concealed = { body: false, sight: true, cell: false, emitter: false };
  for (const id of order) {
    if (concealed[id]) {
      const partVisible = await evaluate(send, `Boolean(document.querySelector('[data-pickup-part="${id}"]'))`);
      record(`pickup ${id}: concealed part not floating`, !partVisible, partVisible);
      await clickHotspot(send, hotspots[id]);
    } else {
      const partBefore = await evaluate(send, `Boolean(document.querySelector('[data-pickup-part="${id}"]'))`);
      record(`pickup ${id}: floating part visible`, partBefore, partBefore);
      const part = await centerOf(send, `[data-pickup-part="${id}"]`);
      await mouseClick(send, part.x, part.y);
      await waitForMoveStart(send);
      await waitForMoveEnd(send);
      await waitForDialog(send);
    }
    const dialogText = await evaluate(send, `document.querySelector('[role="dialog"]')?.innerText ?? ""`);
    record(
      `pickup ${id}: panel opens with part name`,
      dialogText.includes(labels[id]),
      dialogText.replace(/\s+/g, " ").slice(0, 60),
    );
    const quest = await readQuest(send);
    record(`pickup ${id}: stored`, Boolean(quest?.quest?.collected?.includes(id)), quest?.quest?.collected);
    const status = await evaluate(send, `document.querySelector(".world-quest-card")?.innerText ?? ""`);
    record(
      `pickup ${id}: quest bar updated`,
      status.includes(labels[id]) && (status.includes("已领取") || status.includes("已安装")),
      status.replace(/\s+/g, " ").slice(0, 80),
    );
    await closeDialog(send);
    const partAfter = await evaluate(send, `Boolean(document.querySelector('[data-pickup-part="${id}"]'))`);
    record(`pickup ${id}: floating part removed`, !partAfter, partAfter);
  }
}

/**
 * Clicking the hotspot area (not the floating part) must open the original
 * content panel WITHOUT collecting the module; the part stays floating.
 */
async function runContentWithoutPickup(send, url) {
  await clearStorageAndReload(send, url);
  const before = await readQuest(send);
  // The energy cell floats on the lower sofa; the upper lounge area must
  // still open the plain content panel without collecting it.
  const spot = await evaluate(
    send,
    `(() => {
      const r = document.querySelector('[data-hotspot="lounge"]').getBoundingClientRect();
      return { x: r.left + r.width / 2, y: r.top + r.height * 0.15 };
    })()`,
  );
  await mouseClick(send, spot.x, spot.y);
  await waitForDialog(send);
  const dialogText = await evaluate(send, `document.querySelector('[role="dialog"]')?.innerText ?? ""`);
  record("content click: overlay opens", dialogText.length > 0, dialogText.replace(/\s+/g, " ").slice(0, 50));
  const after = await readQuest(send);
  record("content click: nothing collected", !after?.quest?.collected?.includes("cell"), after?.quest?.collected);
  const partStill = await evaluate(send, `Boolean(document.querySelector('[data-pickup-part="cell"]'))`);
  record("content click: floating part stays", partStill, partStill);
  record("content click: quest state untouched", JSON.stringify(after) === JSON.stringify(before), null);
  await closeDialog(send);
}

async function repairAndOpenAssembly(send) {
  // The repair minigame was removed: with all three modules the workbench
  // opens the assembly grid directly.
  await clickHotspot(send, "workbench");
  const taskHeading = await evaluate(send, `document.querySelector('[role="dialog"]')?.innerText ?? ""`);
  record("workbench: assembly opens directly", taskHeading.includes("组装 Bug Buster"), taskHeading.replace(/\s+/g, " ").slice(0, 60));

  await waitFor(send, `Boolean(document.querySelector("[data-assembly-stage]"))`, { timeoutMs: 15_000 });
  await waitFor(send, `document.querySelectorAll(".world-assembly-piece").length === 3`, { timeoutMs: 15_000 });
  record(
    "workbench: assembly opens with three tray pieces and body cell",
    await evaluate(send, `document.querySelectorAll(".world-assembly-piece").length`) === 3,
    await evaluate(send, `document.querySelectorAll(".world-assembly-piece").length`),
  );
}

const INSTALLED_CELLS = `document.querySelectorAll(".world-assembly-cell.is-installed").length`;

async function waitForInstallCount(send, expected) {
  await waitFor(
    send,
    `(() => {
      const count = ${INSTALLED_CELLS};
      const reveal = Boolean(document.querySelector("[data-assembly-reveal]"));
      return count === ${expected} || (${expected} === 4 && reveal);
    })()`,
    { timeoutMs: 15_000 },
  );
}

async function installByClick(send, id, label, shotName) {
  const piece = await centerOf(send, `[aria-label="零件：${label}"]`);
  await mouseClick(send, piece.x, piece.y);
  await waitFor(
    send,
    `document.querySelector('.world-assembly-piece[aria-pressed="true"]')?.getAttribute("aria-label") === ${JSON.stringify(`零件：${label}`)}`,
  );

  const socket = await centerOf(send, `[data-assembly-socket="${id}"]`);
  const cellKey = await evaluate(
    send,
    `document.querySelector('[data-assembly-socket="${id}"]')?.closest("[data-assembly-cell]")?.getAttribute("data-assembly-cell") ?? null`,
  );
  const hit = await evaluate(
    send,
    `(() => {
      const el = document.elementFromPoint(${socket.x}, ${socket.y});
      const target = document.querySelector(${JSON.stringify(`[data-assembly-socket="${id}"]`)});
      return {
        hitSocket: Boolean(el && target && (el === target || target.contains(el))),
        disabled: target ? target.disabled : null,
        tag: el ? el.tagName : null,
        aria: el ? el.getAttribute("aria-label") : null,
      };
    })()`,
  );
  record(`assembly click ${id}: elementFromPoint hits its own cell`, hit.hitSocket && hit.disabled === false, hit);
  if (!hit.hitSocket) throw new Error(`Socket ${id} is covered: ${JSON.stringify(hit)}`);
  if (shotName) await screenshot(send, shotName);

  // Another module's cell must not accept this part: its hit button is disabled.
  const others = await evaluate(
    send,
    `Array.from(document.querySelectorAll("[data-assembly-socket]"))
      .filter((node) => node.getAttribute("data-assembly-socket") !== ${JSON.stringify(id)})
      .every((node) => node.disabled)`,
  );
  record(`assembly click ${id}: other cells reject selection`, others, others);

  const before = await evaluate(send, INSTALLED_CELLS);
  await mouseClick(send, socket.x, socket.y);
  try {
    await waitForInstallCount(send, before + 1);
  } catch (error) {
    const diagnostic = await evaluate(
      send,
      `({
        installedCells: ${INSTALLED_CELLS},
        selected: document.querySelector('.world-assembly-piece[aria-pressed="true"]')?.getAttribute("aria-label") ?? null,
        pieces: Array.from(document.querySelectorAll(".world-assembly-piece")).map((node) => node.getAttribute("aria-label")),
      })`,
    );
    throw new Error(`${error.message}; diagnostic=${JSON.stringify(diagnostic)}`);
  }
  // The filled cell must actually be green (socket disappears once installed,
  // so match the recorded grid cell instead).
  const cellGreen = await evaluate(
    send,
    `document.querySelector('[data-assembly-cell="${cellKey}"]')?.classList.contains("is-installed") ?? false`,
  );
  record(`assembly click ${id}: cell turns green`, cellGreen, { cellKey, cellGreen });
}

async function installByDrag(send, id, label, wrongCellKey) {
  const piece = await centerOf(send, `[aria-label="零件：${label}"]`);
  const socket = await centerOf(send, `[data-assembly-socket="${id}"]`);
  const before = await evaluate(send, INSTALLED_CELLS);

  if (wrongCellKey) {
    // Drop on an empty cell: no green, no consumption, part returns to tray.
    const wrong = await centerOf(send, `[data-assembly-cell="${wrongCellKey}"]`);
    await mouseDrag(send, piece, wrong);
    await waitAtLeast(send, 300);
    const stillThere = await evaluate(
      send,
      `Array.from(document.querySelectorAll(".world-assembly-piece")).some((node) => node.getAttribute("aria-label") === ${JSON.stringify(`零件：${label}`)})`,
    );
    const count = await evaluate(send, INSTALLED_CELLS);
    record(
      `assembly drag ${id}: wrong cell keeps part in tray`,
      stillThere && count === before,
      { stillThere, count, before },
    );
  }

  await mouseDrag(send, piece, socket);
  try {
    await waitForInstallCount(send, before + 1);
  } catch (error) {
    const diagnostic = await evaluate(
      send,
      `({ installedCells: ${INSTALLED_CELLS}, pieces: document.querySelectorAll(".world-assembly-piece").length })`,
    );
    throw new Error(`${error.message}; diagnostic=${JSON.stringify(diagnostic)}`);
  }
  record(`assembly drag ${id}: installed count`, true, before + 1);
}

async function finishAssemblyAndRack(send, shotName) {
  await waitFor(send, `document.body.innerText.includes("Bug Buster 组装完成")`);
  const assembled = await readQuest(send);
  record("assembly: all three installed", assembled?.quest?.installed?.length === 4, assembled?.quest?.installed);

  await clickButton(send, "返回工坊");
  await waitForDialogGone(send);
  // Closing the finished panel turns the quest card into the try-weapon prompt.
  await waitFor(send, `document.querySelector(".world-quest-card").innerText.includes("试试武器")`, { timeoutMs: 10_000 });
  record("assembly close: card prompts try weapon", true, "试试武器");

  // The rack has no dialog: arrival places the weapon and switches to the display pose.
  const rack = await centerOf(send, '.world-hotspot[data-hotspot="rack"]');
  await mouseClick(send, rack.x, rack.y);
  await waitFor(send, `Boolean(document.querySelector(".world-rack-display"))`, { timeoutMs: 30_000 });
  await waitForMoveEnd(send);
  // The rack display must sit on the rack furniture (right side), not collapse
  // into the stage corner — guards against lost positioning regression.
  const rackPos = await evaluate(send, `(() => {
    const st = document.querySelector(".world-stage").getBoundingClientRect();
    const el = document.querySelector("[data-workbench-display]");
    const rk = document.querySelector(".world-rack-display");
    const rel = (el2) => { const r = el2.getBoundingClientRect();
      return Math.round((r.left - st.left + r.width / 2) / st.width * 1536); };
    return { workbenchX: el ? rel(el) : null, rackX: rk ? rel(rk) : null };
  })()`);
  record(
    "displays anchored on furniture",
    rackPos.workbenchX > 250 && rackPos.workbenchX < 500 && rackPos.rackX > 1050,
    rackPos,
  );
  await waitForQuestAction(send, "试试武器");
  const questCard = await evaluate(send, `document.querySelector(".world-quest-card")?.innerText ?? ""`);
  record("rack: card still prompts try weapon", questCard.includes("试试武器"), questCard.replace(/\s+/g, " ").slice(0, 90));
  const pose = await readActorPosition(send);
  record("rack: display pose", pose?.frame === "display", pose?.frame);
  // Capture only after the panel is gone, the actor has arrived and the
  // completion copy is on screen — never the assembly dialog.
  await screenshot(send, shotName);
  const stored = await readQuest(send);
  record(
    "rack: persisted completion",
    stored?.schemaVersion === 1 && stored?.quest?.displayedOnRack === true && stored?.quest?.installed?.length === 4,
    stored,
  );
}

/**
 * Completed-state extras: the gun sits on the workbench desk, the floating
 * "试用 Bug Buster" hotspot plays the fire strip on arrival, and clicking the
 * desk shows the desktop-gun panel with its own try button.
 */
async function runTryBusterProbes(send) {
  const deskGun = await evaluate(send, `Boolean(document.querySelector("[data-workbench-display]"))`);
  record("workbench: desktop gun displayed", deskGun, deskGun);

  // Direct hotspot: click "试用 Bug Buster", walk, auto-play the fire strip.
  const tryButton = await centerOf(send, "[data-try-buster]");
  await mouseClick(send, tryButton.x, tryButton.y);
  await waitForMoveStart(send);
  // The fire strip plays on arrival: start listening during the walk so the
  // short one-shot window cannot slip past waitForMoveEnd.
  const fireSeen = waitFor(
    send,
    `Boolean(document.querySelector('.world-actor [data-sprite-anim="tuvis2d-fire-se"]'))`,
    { timeoutMs: 30_000 },
  ).then(() => true).catch(() => false);
  await waitForMoveEnd(send);
  if (!(await fireSeen)) throw new Error("fire strip never played after try-buster arrival");
  record("try buster: fire strip plays", true, "tuvis2d-fire-se");
  await waitFor(
    send,
    `(() => {
      const anim = document.querySelector(".world-actor div[data-sprite-anim]")?.getAttribute("data-sprite-anim");
      return Boolean(anim) && anim !== "tuvis2d-fire-se";
    })()`,
    { timeoutMs: 10_000 },
  );
  record("try buster: returns to idle", true);

  // Desk click: the desktop-gun panel with its own try button.
  const desk = await centerOf(send, '[data-hotspot="workbench"]');
  await mouseClick(send, desk.x, desk.y);
  await waitFor(send, `Boolean(document.querySelector("[data-workbench-gun-panel]"))`, { timeoutMs: 20_000 });
  record("workbench: desktop-gun panel opens", true, "data-workbench-gun-panel");
  const panelFire = waitFor(
    send,
    `Boolean(document.querySelector('.world-actor [data-sprite-anim="tuvis2d-fire-se"]'))`,
    { timeoutMs: 30_000 },
  ).then(() => true).catch(() => false);
  // Scope to the panel: the scene has its own identically-labelled button.
  const panelBtn = await evaluate(send, `(() => {
    const b = document.querySelector('[data-workbench-gun-panel] [data-try-buster-confirm]');
    if (!b) return null;
    const r = b.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2, disabled: b.disabled };
  })()`);
  if (!panelBtn || panelBtn.disabled) throw new Error(`panel try button missing: ${JSON.stringify(panelBtn)}`);
  await mouseClick(send, panelBtn.x, panelBtn.y);
  await waitForDialogGone(send);
  if (!(await panelFire)) throw new Error("fire strip never played from panel try button");
  record("workbench panel: try button plays fire", true, "tuvis2d-fire-se");
  await waitFor(send, `document.querySelector(".world-quest-card").innerText.includes("主线任务已完成")`, { timeoutMs: 10_000 });
  record("try weapon: card flips to completion", true, "主线任务已完成");
}

/** Clicking the character opens the emote menu; picking one plays the strip. */
async function runEmoteProbe(send) {
  const actor = await centerOf(send, "[data-actor-hit]");
  await mouseClick(send, actor.x, actor.y);
  await waitFor(send, `Boolean(document.querySelector(".world-emote-menu"))`, { timeoutMs: 5_000 });
  record("emote: menu opens on character click", true);
  const option = await centerOf(send, '.world-emote-menu button');
  await mouseClick(send, option.x, option.y);
  await waitFor(send, `!document.querySelector(".world-emote-menu")`, { timeoutMs: 5_000 });
  record("emote: menu closes after picking", true);
  const anim = await evaluate(
    send,
    `document.querySelector(".world-actor div[data-sprite-anim]")?.getAttribute("data-sprite-anim") ?? null`,
  );
  record("emote: an action strip plays", Boolean(anim), anim);
}

async function runMainChain(send, url) {
  await clearStorageAndReload(send, url);
  await waitForDialogGone(send);
  const initial = await screenshot(send, "workshop-zh-1280.png");
  record("workshop: initial screenshot", true, path.basename(initial));
  await collectModules(send, ["body", "sight", "cell", "emitter"]);
  await repairAndOpenAssembly(send);

  await installByClick(send, "sight", "瞄准模块", "assembly-selected.png");
  await installByClick(send, "cell", "能源匣");
  await installByClick(send, "emitter", "脉冲发射头");

  // Success sequence: converge + flash must end in the reveal step with the
  // finished gun, its description and the back button.
  await waitFor(send, `Boolean(document.querySelector("[data-assembly-reveal]"))`, { timeoutMs: 20_000 });
  const gridGone = await evaluate(send, `!document.querySelector("[data-assembly-grid]")`);
  record("assembly success: grid replaced by reveal", gridGone, gridGone);
  const revealText = await evaluate(send, `document.querySelector("[data-assembly-reveal]")?.innerText ?? ""`);
  record(
    "assembly success: name and description shown",
    revealText.includes("Bug 清除脉冲炮") && revealText.includes("Bug Buster"),
    revealText.replace(/\s+/g, " ").slice(0, 90),
  );
  const revealHasButton = await evaluate(
    send,
    `Array.from(document.querySelectorAll("[data-assembly-reveal] button")).some((node) => node.textContent.trim() === "返回工坊")`,
  );
  record("assembly success: back-to-workshop button", revealHasButton, revealHasButton);
  await screenshot(send, "assembly-complete.png");
  await finishAssemblyAndRack(send, "rack-complete.png");
}

async function runCancelProbe(send, url) {
  await clearStorageAndReload(send, url);
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
  const questBar = await evaluate(send, `document.querySelector(".world-quest-card")?.innerText ?? ""`);
  const moving = await evaluate(send, `Boolean(document.querySelector(".world-actor.is-moving"))`);
  record("cancel: no dialog after blur", dialogs === 0, dialogs);
  record("cancel: quest unchanged", JSON.stringify(after) === JSON.stringify(before), { before, after });
  record("cancel: actor stopped", !moving, moving);
  record("cancel: no collection recorded", !questBar.includes("已领取"), questBar.replace(/\s+/g, " ").slice(0, 80));
}

async function runDragChain(send, url) {
  await clearStorageAndReload(send, url);
  // Different collection order: any module order must work.
  await collectModules(send, ["cell", "emitter", "body", "sight"]);
  await repairAndOpenAssembly(send);
  await installByDrag(send, "cell", "能源匣", "0-0");
  await installByDrag(send, "sight", "瞄准模块");
  await installByDrag(send, "emitter", "脉冲发射头");
  await waitFor(send, `Boolean(document.querySelector("[data-assembly-reveal]"))`, { timeoutMs: 20_000 });
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
        const el = document.querySelector(".world-actor svg[data-frame], .world-actor div[data-sprite-anim]");
        if (!el) return false;
        const x = (parseFloat(el.style.left) / 100) * ${SCENE_SIZE[0]};
        const y = (parseFloat(el.style.top) / 100) * ${SCENE_SIZE[1]};
        // CSS serializes percentage positions to ~6 significant digits.
        return Math.hypot(x - ${point[0]}, y - ${point[1]}) < 3;
      })()`,
      { timeoutMs: 40_000 },
    );
  } catch (error) {
    const diagnostic = await evaluate(
      send,
      `(() => {
        const el = document.querySelector(".world-actor svg[data-frame], .world-actor div[data-sprite-anim]");
        return {
          position: el ? [(parseFloat(el.style.left) / 100) * ${SCENE_SIZE[0]}, (parseFloat(el.style.top) / 100) * ${SCENE_SIZE[1]}] : null,
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
  // The canvas is full content width, so both viewports render it equally wide.
  record("zoom: stage fills content width", at1280.rect.width === at1600.rect.width, {
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

    await runContentWithoutPickup(page.send, url);
    await runEmoteProbe(page.send);
    await runMainChain(page.send, url);
    await runCancelProbe(page.send, url);
    await runDragChain(page.send, url);
    await runTryBusterProbes(page.send);
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
