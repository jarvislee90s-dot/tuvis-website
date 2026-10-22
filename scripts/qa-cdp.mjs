/**
 * Read-only browser acceptance probes for the Tuvis World routes.
 *
 * Usage: node scripts/qa-cdp.mjs [baseUrl]
 *
 * Requires a Chromium/Chrome started with a debugging port, e.g.
 *   --remote-debugging-port=9222 --user-data-dir=/tmp/tuvis-qa-profile
 * The script only navigates and reads the DOM; it never clicks, types or
 * mutates storage. Interactive coverage lives in
 * scripts/qa-world-interactions.mjs.
 */
import { createRequire } from "node:module";
import { existsSync, readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import http from "node:http";

const here = path.dirname(fileURLToPath(import.meta.url));
const DEFAULT_BASE = "http://127.0.0.1:4173";
const CDP_HOST = process.env.CDP_HOST ?? "127.0.0.1";
const CDP_PORT = Number(process.env.CDP_PORT ?? 9222);

/**
 * pnpm keeps transitive packages under .pnpm. Prefer that copy (if present)
 * and fall back to the WebSocket global shipped with Node 22+.
 */
function resolveWebSocketImpl() {
  try {
    const require = createRequire(import.meta.url);
    const local = path.join(here, "../node_modules/ws");
    if (existsSync(local)) return require(local);
    const pnpmDir = path.join(here, "../node_modules/.pnpm");
    if (existsSync(pnpmDir)) {
      const dir = readdirSync(pnpmDir).find((entry) => entry.startsWith("ws@"));
      if (dir) return require(path.join(pnpmDir, dir, "node_modules/ws"));
    }
  } catch {
    // fall through to the global WebSocket
  }
  return null;
}

export function getJson(pathname) {
  return new Promise((resolve, reject) => {
    http
      .get({ host: CDP_HOST, port: CDP_PORT, path: pathname }, (res) => {
        let body = "";
        res.on("data", (chunk) => (body += chunk));
        res.on("end", () => {
          try {
            resolve(JSON.parse(body));
          } catch (error) {
            reject(error);
          }
        });
      })
      .on("error", reject);
  });
}

export const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/** Minimal CDP client over ws (package) or the Node 22 WebSocket global. */
export class CDP {
  constructor(wsUrl) {
    this.wsUrl = wsUrl;
    this.ws = null;
    this.impl = resolveWebSocketImpl();
    this.id = 0;
    this.pending = new Map();
    this.events = [];
  }

  connect() {
    return new Promise((resolve, reject) => {
      const onMessage = (raw) => {
        const message = JSON.parse(String(raw));
        if (message.id && this.pending.has(message.id)) {
          const { resolve: done, reject: fail } = this.pending.get(message.id);
          this.pending.delete(message.id);
          if (message.error) fail(new Error(JSON.stringify(message.error)));
          else done(message.result);
        } else if (message.method) {
          this.events.push(message);
        }
      };

      if (this.impl) {
        this.ws = new this.impl(this.wsUrl);
        this.ws.on("open", resolve);
        this.ws.on("error", reject);
        this.ws.on("message", (data) => onMessage(data.toString()));
        return;
      }

      if (typeof globalThis.WebSocket !== "function") {
        reject(new Error("No WebSocket implementation available (ws package or Node 22 global)."));
        return;
      }
      this.ws = new globalThis.WebSocket(this.wsUrl);
      this.ws.addEventListener("open", () => resolve());
      this.ws.addEventListener("error", () => reject(new Error("WebSocket error")));
      this.ws.addEventListener("message", (event) => onMessage(event.data));
    });
  }

  send(method, params = {}, sessionId) {
    const id = ++this.id;
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      this.ws.send(JSON.stringify({ id, method, params, sessionId }));
    });
  }

  close() {
    this.ws?.close();
  }
}

export async function evaluate(send, expression) {
  const result = await send("Runtime.evaluate", {
    expression,
    returnByValue: true,
    awaitPromise: true,
  });
  if (result.exceptionDetails) {
    const detail =
      result.exceptionDetails.exception?.description ?? result.exceptionDetails.text ?? "evaluate failed";
    throw new Error(detail);
  }
  return result.result.value;
}

/** Poll a page predicate instead of sleeping for a fixed duration. */
export async function waitFor(send, expression, { timeoutMs = 20_000, intervalMs = 100 } = {}) {
  const deadline = Date.now() + timeoutMs;
  let lastValue;
  while (Date.now() < deadline) {
    lastValue = await evaluate(send, expression);
    if (lastValue) return lastValue;
    await sleep(intervalMs);
  }
  throw new Error(`Timed out after ${timeoutMs}ms waiting for: ${expression} (last=${JSON.stringify(lastValue)})`);
}

export function collectExternalRequests(events, base) {
  const baseOrigin = new URL(base).origin;
  const urls = events
    .filter((event) => event.method === "Network.requestWillBeSent")
    .map((event) => event.params.request.url);
  return [...new Set(urls)].filter((url) => {
    try {
      const parsed = new URL(url);
      return (parsed.protocol === "http:" || parsed.protocol === "https:") && parsed.origin !== baseOrigin;
    } catch {
      return false;
    }
  });
}

export function collectFailures(events) {
  const failedRequests = [];
  const consoleErrors = [];
  for (const event of events) {
    if (event.method === "Network.loadingFailed") {
      failedRequests.push({
        type: event.params.type,
        error: event.params.errorText,
        canceled: Boolean(event.params.canceled),
      });
    }
    if (event.method === "Runtime.exceptionThrown") {
      const details = event.params.exceptionDetails;
      consoleErrors.push(details.exception?.description ?? details.text ?? "uncaught exception");
    }
    if (event.method === "Runtime.consoleAPICalled" && event.params.type === "error") {
      consoleErrors.push(
        event.params.args
          .map((arg) => arg.value ?? arg.description ?? arg.type)
          .join(" "),
      );
    }
    if (event.method === "Log.entryAdded" && event.params.entry.level === "error") {
      consoleErrors.push(event.params.entry.text);
    }
    if (event.method === "Console.messageAdded" && event.params.message.level === "error") {
      consoleErrors.push(event.params.message.text);
    }
  }
  return { failedRequests, consoleErrors };
}

export async function openPage(browser, { width, height, deviceScaleFactor = 1 }) {
  const { targetId } = await browser.send("Target.createTarget", { url: "about:blank" });
  const { sessionId } = await browser.send("Target.attachToTarget", { targetId, flatten: true });
  const send = (method, params) => browser.send(method, params, sessionId);
  await send("Page.enable");
  await send("Runtime.enable");
  await send("Network.enable");
  await send("Log.enable");
  await send("Console.enable").catch(() => undefined);
  await send("Emulation.setDeviceMetricsOverride", {
    width,
    height,
    deviceScaleFactor,
    mobile: false,
  });
  return {
    targetId,
    sessionId,
    send,
    async close() {
      await browser.send("Target.closeTarget", { targetId }).catch(() => undefined);
    },
  };
}

/**
 * Navigate and wait for the *new* document plus its app-level readiness.
 * The marker removes a race where the old document still looks "complete"
 * while the same-URL navigation is in flight.
 */
export async function navigateAndWait(page, url, readyExpression, timeoutMs = 25_000) {
  await evaluate(page.send, `window.__qaNavMarker = "pending"`).catch(() => undefined);
  await page.send("Page.navigate", { url });
  await waitFor(
    page.send,
    `typeof window.__qaNavMarker === "undefined" && document.readyState === "complete"`,
    { timeoutMs },
  );
  await waitFor(page.send, readyExpression, { timeoutMs });
}

export async function reloadAndWait(page, readyExpression, timeoutMs = 25_000) {
  await evaluate(page.send, `window.__qaNavMarker = "pending"`).catch(() => undefined);
  await page.send("Page.reload", { ignoreCache: true });
  await waitFor(
    page.send,
    `typeof window.__qaNavMarker === "undefined" && document.readyState === "complete"`,
    { timeoutMs },
  );
  await waitFor(page.send, readyExpression, { timeoutMs });
}

/** DOM probe shared by the four read-only routes. */
export const DOM_PROBE = `(() => {
  const q = (selector) => Array.from(document.querySelectorAll(selector));
  const text = document.body.innerText;
  const imageLoaded = (selector) => {
    const img = document.querySelector(selector);
    return img ? img.complete && img.naturalWidth > 0 : false;
  };
  const actor = document.querySelector(".world-actor");
  const actorGeometry = (() => {
    const sprite = document.querySelector(".world-actor div[data-sprite-anim], .world-actor svg[data-frame]");
    const shadow = document.querySelector(".world-actor-shadow");
    if (!sprite || !shadow) return null;
    const s = sprite.getBoundingClientRect();
    const d = shadow.getBoundingClientRect();
    return {
      dx: (s.left + s.width / 2) - (d.left + d.width / 2),
      spriteWidth: s.width,
    };
  })();
  return {
    title: document.title,
    lang: document.documentElement.lang,
    worldStage: q(".world-stage").length,
    stageBgLoaded: imageLoaded(".world-stage-bg"),
    actor: q(".world-actor").length,
    actorFrame: actor?.querySelector("[data-frame]")?.getAttribute("data-frame") ?? null,
    actorAnim: actor?.querySelector("[data-sprite-anim]")?.getAttribute("data-sprite-anim") ?? null,
    actorGeometry,
    pickupParts: q("[data-pickup-part]").map((node) => node.getAttribute("data-pickup-part")),
    hotspots: q(".world-hotspot[data-hotspot]").map((node) => ({
      id: node.getAttribute("data-hotspot"),
      label: node.getAttribute("aria-label"),
    })),
    assemblyPieces: q(".world-assembly-piece").length,
    assemblySockets: q(".world-assembly-socket").length,
    rackDisplay: q(".world-rack-display").length,
    heroCityLoaded: imageLoaded("img.world-hero-city"),
    heroCharacterLoaded: imageLoaded("img.world-hero-character"),
    sections: ["character", "equipment", "world", "stories", "workshop"].filter(
      (id) => document.getElementById(id),
    ).concat(q(".world-hero").length === 1 ? ["hero"] : []),
    equipmentCards: q(".world-equipment-card").length,
    storyCards: q(".world-story-card").length,
    workshopLinks: q('a[href*="/world/workshop"]').map((a) => a.getAttribute("href")),
    workshopLinkLabels: q('a[href*="/world/workshop"]').map((a) => a.textContent.trim()),
    heroTag: document.querySelector(".world-hero-tag")?.textContent.trim() ?? null,
    headings: q(".world-h2").map((node) => node.textContent.trim()),
    backLink: document.querySelector(".world-back-link")?.textContent.replace(/\\s+/g, " ").trim() ?? null,
    toolButtons: q(".world-workshop-tools button").map((node) => node.textContent.trim()),
    languageNote: q(".world-lang-note").map((node) => node.textContent.trim()),
    questCard: q(".world-quest-card").length,
    questCardText: q(".world-quest-card")[0]?.innerText.replace(/\\s+/g, " ").trim() ?? null,
    musicButton: q(".world-workshop-tools button").map((node) => node.textContent.trim())
      .find((t) => t === "Music: On" || t === "音乐：开") ?? null,
    kickers: q(".world-kicker").map((node) => node.textContent.trim()),
    viewIntroButtons: q(".world-story-card button").map((node) => node.textContent.trim()),
    workshopDesc: q(".world-workshop-grid .world-section-intro")[0]?.textContent.trim() ?? null,
    contentOverlay: q('[role="dialog"]').length,
    textHasWorldTitle: text.includes("兔维斯世界"),
  };
})()`;

export function checksForRoute(route, probe, failures, externalRequests = []) {
  const checks = [];
  const expect = (name, ok, detail) => checks.push({ name, ok: Boolean(ok), detail });
  expect("no failed requests", failures.failedRequests.filter((item) => !item.canceled).length === 0, failures.failedRequests);
  expect("no console errors", failures.consoleErrors.length === 0, failures.consoleErrors);
  expect("no external requests", externalRequests.length === 0, externalRequests);

  if (route.kind === "landing") {
    expect("hero city image loaded", probe.heroCityLoaded, probe.heroCityLoaded);
    expect("hero character image loaded", probe.heroCharacterLoaded, probe.heroCharacterLoaded);
    expect("six landing sections", probe.sections.length === 6, probe.sections);
    expect("four equipment cards", probe.equipmentCards === 4, probe.equipmentCards);
    expect("three story cards", probe.storyCards === 3, probe.storyCards);
    expect("two workshop links", probe.workshopLinks.length === 2, probe.workshopLinks);
    expect("world title present", probe.textHasWorldTitle, probe.textHasWorldTitle);
    if (route.lang === "en") {
      expect(
        "English section labels",
        ["W-02 · Meet Tuvis", "W-03 · Equipment Gallery", "W-04 · The World", "W-05 · Story Archive", "W-06 · Workshop Experience"].every(
          (label) => probe.kickers.includes(label),
        ),
        probe.kickers,
      );
      expect(
        "English hero CTA",
        probe.workshopLinkLabels.length === 2 &&
          probe.workshopLinkLabels.every((label) => label === "Enter Tuvis Workshop"),
        probe.workshopLinkLabels,
      );
      expect("English hero tag", probe.heroTag === "Circuitown · Invention Workshop", probe.heroTag);
      expect(
        "English section headings",
        ["Tuvis", "Tuvis's Four Tools", "Circuitown and the Invention Workshop", "Stories from the Workshop"].every(
          (label) => probe.headings.includes(label),
        ),
        probe.headings,
      );
      expect("English view-intro buttons", probe.viewIntroButtons.every((label) => label === "Story teaser"), probe.viewIntroButtons);
      expect("English workshop description", probe.workshopDesc?.startsWith("Click the floor"), probe.workshopDesc);
    } else {
      expect("Chinese section labels", probe.kickers.includes("W-02 · 认识兔维斯"), probe.kickers);
      expect("Chinese view-intro buttons", probe.viewIntroButtons.every((label) => label === "故事预告"), probe.viewIntroButtons);
    }
  } else {
    expect("workshop stage present", probe.worldStage === 1, probe.worldStage);
    expect("stage background loaded", probe.stageBgLoaded, probe.stageBgLoaded);
    expect("actor present", probe.actor === 1, probe.actor);
    expect("actor sprite animation present", Boolean(probe.actorAnim), probe.actorAnim);
    // A mirrored strip must not shift the sprite off its logical position:
    // the transformed sprite box stays centered over the ground shadow.
    expect(
      "actor sprite centered over shadow",
      probe.actorGeometry !== null && Math.abs(probe.actorGeometry.dx) < 8,
      probe.actorGeometry,
    );
    expect("twelve hotspots", probe.hotspots.length === 12, probe.hotspots.length);
    expect("quest objective card present", probe.questCard === 1, probe.questCard);
    if (route.lang === "en") {
      expect("English language note", probe.languageNote.length === 1, probe.languageNote);
      expect("English music button", probe.musicButton === "Music: On", probe.musicButton);
      expect("English back link", Boolean(probe.backLink?.includes("Back to Tuvis World")), probe.backLink);
      expect("English replay button", probe.toolButtons.includes("Replay story"), probe.toolButtons);
      // The quest card carries the (Chinese) world copy on both locales.
      expect(
        "English quest objective card",
        Boolean(probe.questCardText?.includes("让 Bug Buster 重新上线")) &&
          Boolean(probe.questCardText?.includes("点击地面移动")),
        { text: probe.questCardText },
      );
    } else {
      expect("no language note on zh", probe.languageNote.length === 0, probe.languageNote);
      expect("Chinese music button", probe.musicButton === "音乐：开", probe.musicButton);
      expect(
        "Chinese quest objective card",
        Boolean(probe.questCardText?.includes("点击地面移动")),
        { text: probe.questCardText },
      );
    }
  }
  return checks;
}

export function reportFailures(report) {
  const failures = [];
  for (const [name, route] of Object.entries(report.routes)) {
    if (route.error) {
      failures.push(`${name}: ${route.error}`);
      continue;
    }
    for (const check of route.checks) {
      if (!check.ok) failures.push(`${name}: ${check.name} -> ${JSON.stringify(check.detail)}`);
    }
  }
  return failures;
}

export async function runReadOnlyProbes(base = DEFAULT_BASE) {
  const browserInfo = await getJson("/json/version");
  const cdp = new CDP(browserInfo.webSocketDebuggerUrl);
  await cdp.connect();

  const routes = [
    { name: "zh/world", url: `${base}/zh/world`, lang: "zh", kind: "landing" },
    { name: "zh/world/workshop", url: `${base}/zh/world/workshop`, lang: "zh", kind: "workshop" },
    { name: "en/world", url: `${base}/en/world`, lang: "en", kind: "landing" },
    { name: "en/world/workshop", url: `${base}/en/world/workshop`, lang: "en", kind: "workshop" },
  ];

  const report = {
    browser: browserInfo.Browser,
    websocket: cdp.impl ? "ws package (.pnpm)" : "globalThis.WebSocket",
    base,
    routes: {},
  };

  for (const route of routes) {
    let page;
    try {
      page = await openPage(cdp, { width: 1280, height: 800, deviceScaleFactor: 1 });
      cdp.events.length = 0;
      const ready =
        route.kind === "workshop"
          ? `(() => { const img = document.querySelector(".world-stage-bg"); return Boolean(document.querySelector(".world-stage")) && Boolean(img) && img.complete && img.naturalWidth > 0; })()`
          : `(() => { const imgs = document.querySelectorAll("img.world-hero-city, img.world-hero-character"); return document.querySelectorAll(".world-equipment-card").length === 4 && imgs.length === 2 && Array.from(imgs).every((img) => img.complete && img.naturalWidth > 0); })()`;
      await navigateAndWait(page, route.url, ready);
      const probe = await evaluate(page.send, DOM_PROBE);
      const failures = collectFailures(cdp.events);
      const externalRequests = collectExternalRequests(cdp.events, base);
      report.routes[route.name] = {
        url: route.url,
        viewport: { width: 1280, height: 800, deviceScaleFactor: 1 },
        probe,
        failedRequests: failures.failedRequests,
        consoleErrors: failures.consoleErrors,
        externalRequests,
        checks: checksForRoute(route, probe, failures, externalRequests),
      };
    } catch (error) {
      report.routes[route.name] = { url: route.url, error: String(error.message ?? error) };
    } finally {
      await page?.close();
    }
  }

  cdp.close();
  const failures = reportFailures(report);
  return { report, failures };
}

async function main() {
  const base = process.argv[2] ?? DEFAULT_BASE;
  const { report, failures } = await runReadOnlyProbes(base);
  console.log(JSON.stringify(report, null, 2));
  if (failures.length > 0) {
    console.error(`\nQA FAILED (${failures.length})`);
    for (const failure of failures) console.error(`- ${failure}`);
    process.exit(1);
  }
  console.log(`\nQA PASS: ${Object.keys(report.routes).length} routes, ${report.browser}`);
}

const isDirectRun = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isDirectRun) {
  const hardTimeout = setTimeout(() => {
    console.error("QA TIMEOUT");
    process.exit(2);
  }, 120_000);
  hardTimeout.unref();

  main().catch((error) => {
    console.error("CDP FAILED:", error.message);
    process.exit(1);
  });
}
