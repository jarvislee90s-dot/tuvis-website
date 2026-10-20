import type {
  AssetDefinition,
  AssemblyGrid,
  AssemblyModule,
  EquipmentEntry,
  FrameDefinition,
  Hotspot,
  HotspotKind,
  ModuleId,
  Point,
  Rect,
  SceneAction,
  SceneDefinition,
  SceneProp,
  StoryEntry,
  WorldBundle,
  WorldContent,
  WorldContentBundle,
  WorldEntry,
  WorldManifest,
} from "../types";

const MODULE_IDS: readonly ModuleId[] = ["sight", "cell", "emitter", "body"];
const HOTSPOT_KINDS: readonly HotspotKind[] = [
  "workbench",
  "equipment",
  "world",
  "coffee",
  "stories",
  "rack",
  "sit",
  "door",
];

/** Join BASE_URL + world/v1/ + pack-relative path. */
export function assetUrl(path: string, base: string = import.meta.env.BASE_URL): string {
  const prefix = base.endsWith("/") ? base : `${base}/`;
  return `${prefix}world/v1/${path.replace(/^\/+/, "")}`;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function fail(message: string): never {
  throw new Error(`Invalid world data: ${message}`);
}

function requireRecord(value: unknown, path: string): Record<string, unknown> {
  if (!isRecord(value)) fail(`${path} must be an object`);
  return value;
}

function requireArray(value: unknown, path: string): unknown[] {
  if (!Array.isArray(value)) fail(`${path} must be an array`);
  return value;
}

function requireString(value: unknown, path: string): string {
  if (typeof value !== "string" || value.length === 0) fail(`${path} must be a non-empty string`);
  return value;
}

function requireBoolean(value: unknown, path: string): boolean {
  if (typeof value !== "boolean") fail(`${path} must be a boolean`);
  return value;
}

function requireNumber(value: unknown, path: string): number {
  if (typeof value !== "number" || !Number.isFinite(value)) fail(`${path} must be a finite number`);
  return value;
}

function requirePositive(value: unknown, path: string): number {
  const n = requireNumber(value, path);
  if (n <= 0) fail(`${path} must be positive`);
  return n;
}

function requirePoint(value: unknown, path: string): Point {
  const arr = requireArray(value, path);
  if (arr.length !== 2) fail(`${path} must have 2 coordinates`);
  return [requireNumber(arr[0], `${path}[0]`), requireNumber(arr[1], `${path}[1]`)];
}

function requireRect(value: unknown, path: string): Rect {
  const arr = requireArray(value, path);
  if (arr.length !== 4) fail(`${path} must have 4 values`);
  return [
    requireNumber(arr[0], `${path}[0]`),
    requireNumber(arr[1], `${path}[1]`),
    requirePositive(arr[2], `${path}[2]`),
    requirePositive(arr[3], `${path}[3]`),
  ];
}

function requireSafeRelativePath(value: unknown, path: string): string {
  const p = requireString(value, path);
  if (p.startsWith("/") || /^[a-zA-Z]:/.test(p) || p.split(/[\\/]/).includes("..")) {
    fail(`${path} must be a pack-relative path`);
  }
  return p;
}

function requireModuleId(value: unknown, path: string): ModuleId {
  if (typeof value !== "string" || !MODULE_IDS.includes(value as ModuleId)) {
    fail(`${path} must be one of ${MODULE_IDS.join(", ")}`);
  }
  return value as ModuleId;
}

function requireAssetRef(
  assets: Record<string, AssetDefinition>,
  value: unknown,
  path: string,
): string {
  const id = requireString(value, path);
  if (!assets[id]) fail(`${path} references unknown asset "${id}"`);
  return id;
}

function requireFrameRef(
  manifest: WorldManifest,
  value: unknown,
  path: string,
): string {
  const id = requireString(value, path);
  if (!manifest.frames[id]) fail(`${path} references unknown frame "${id}"`);
  return id;
}

function validateManifest(raw: unknown): WorldManifest {
  const doc = requireRecord(raw, "manifest");
  if (doc.schemaVersion !== 1) fail("manifest schemaVersion must be 1");
  const assetsRaw = requireRecord(doc.assets, "manifest.assets");
  const assets: Record<string, AssetDefinition> = {};
  for (const [id, value] of Object.entries(assetsRaw)) {
    const asset = requireRecord(value, `manifest.assets.${id}`);
    const path = requireSafeRelativePath(asset.path, `manifest.assets.${id}.path`);
    assets[id] = {
      path,
      width: requirePositive(asset.width, `manifest.assets.${id}.width`),
      height: requirePositive(asset.height, `manifest.assets.${id}.height`),
      alpha: requireBoolean(asset.alpha, `manifest.assets.${id}.alpha`),
      sha256: requireString(asset.sha256, `manifest.assets.${id}.sha256`),
    };
  }
  if (Object.keys(assets).length === 0) fail("manifest.assets must not be empty");

  const framesRaw = requireRecord(doc.frames, "manifest.frames");
  const frames: Record<string, FrameDefinition> = {};
  for (const [id, value] of Object.entries(framesRaw)) {
    const frame = requireRecord(value, `manifest.frames.${id}`);
    const asset = requireAssetRef(assets, frame.asset, `manifest.frames.${id}.asset`);
    const anchor = requirePoint(frame.anchor, `manifest.frames.${id}.anchor`);
    if (anchor[0] < 0 || anchor[0] > 1 || anchor[1] < 0 || anchor[1] > 1) {
      fail(`manifest.frames.${id}.anchor must be normalized`);
    }
    frames[id] = {
      asset,
      sourceRect: requireRect(frame.sourceRect, `manifest.frames.${id}.sourceRect`),
      anchor,
    };
  }

  const coreAssets = requireArray(doc.coreAssets, "manifest.coreAssets").map((id, i) =>
    requireAssetRef(assets, id, `manifest.coreAssets[${i}]`),
  );

  return {
    schemaVersion: 1,
    packVersion: requireString(doc.packVersion, "manifest.packVersion"),
    assets,
    frames,
    coreAssets,
    contentPath: requireSafeRelativePath(doc.contentPath, "manifest.contentPath"),
    scenePath: requireSafeRelativePath(doc.scenePath, "manifest.scenePath"),
    notes: Array.isArray(doc.notes)
      ? doc.notes.map((n, i) => requireString(n, `manifest.notes[${i}]`))
      : undefined,
  };
}

function validateEquipment(
  raw: unknown,
  index: number,
  assets: Record<string, AssetDefinition>,
): EquipmentEntry {
  const entry = requireRecord(raw, `content.equipment[${index}]`);
  return {
    id: requireString(entry.id, `content.equipment[${index}].id`),
    name: requireString(entry.name, `content.equipment[${index}].name`),
    english: requireString(entry.english, `content.equipment[${index}].english`),
    color: requireString(entry.color, `content.equipment[${index}].color`),
    sourceRect: requireRect(entry.sourceRect, `content.equipment[${index}].sourceRect`),
    asset: requireAssetRef(assets, entry.asset, `content.equipment[${index}].asset`),
    description: requireString(entry.description, `content.equipment[${index}].description`),
    analogy: requireString(entry.analogy, `content.equipment[${index}].analogy`),
  };
}

function validateWorldEntry(
  raw: unknown,
  index: number,
  assets: Record<string, AssetDefinition>,
): WorldEntry {
  const entry = requireRecord(raw, `content.world[${index}]`);
  return {
    id: requireString(entry.id, `content.world[${index}].id`),
    title: requireString(entry.title, `content.world[${index}].title`),
    asset: requireAssetRef(assets, entry.asset, `content.world[${index}].asset`),
    text: requireString(entry.text, `content.world[${index}].text`),
  };
}

function validateStory(
  raw: unknown,
  index: number,
  assets: Record<string, AssetDefinition>,
): StoryEntry {
  const entry = requireRecord(raw, `content.stories[${index}]`);
  return {
    id: requireString(entry.id, `content.stories[${index}].id`),
    title: requireString(entry.title, `content.stories[${index}].title`),
    asset: requireAssetRef(assets, entry.asset, `content.stories[${index}].asset`),
    summary: requireString(entry.summary, `content.stories[${index}].summary`),
    status: requireString(entry.status, `content.stories[${index}].status`),
  };
}

function validateContent(raw: unknown, manifest: WorldManifest): WorldContent {
  const doc = requireRecord(raw, "content");
  if (doc.schemaVersion !== 1) fail("content schemaVersion must be 1");
  const { assets } = manifest;
  const character = requireRecord(doc.character, "content.character");
  const quest = requireRecord(doc.quest, "content.quest");
  const ui = requireRecord(doc.ui, "content.ui");

  return {
    schemaVersion: 1,
    title: requireString(doc.title, "content.title"),
    intro: requireString(doc.intro, "content.intro"),
    heroAsset: requireAssetRef(assets, doc.heroAsset, "content.heroAsset"),
    cityAsset: requireAssetRef(assets, doc.cityAsset, "content.cityAsset"),
    workshopPreviewAsset: requireAssetRef(
      assets,
      doc.workshopPreviewAsset,
      "content.workshopPreviewAsset",
    ),
    character: {
      name: requireString(character.name, "content.character.name"),
      subtitle: requireString(character.subtitle, "content.character.subtitle"),
      intro: requireString(character.intro, "content.character.intro"),
      tags: requireArray(character.tags, "content.character.tags").map((t, i) =>
        requireString(t, `content.character.tags[${i}]`),
      ),
      features: requireArray(character.features, "content.character.features").map((f, i) => {
        const feature = requireRecord(f, `content.character.features[${i}]`);
        return {
          title: requireString(feature.title, `content.character.features[${i}].title`),
          text: requireString(feature.text, `content.character.features[${i}].text`),
        };
      }),
    },
    equipment: requireArray(doc.equipment, "content.equipment").map((e, i) =>
      validateEquipment(e, i, assets),
    ),
    world: requireArray(doc.world, "content.world").map((w, i) => validateWorldEntry(w, i, assets)),
    doors: requireArray(doc.doors, "content.doors").map((d, i) => {
      const door = requireRecord(d, `content.doors[${i}]`);
      return {
        id: requireString(door.id, `content.doors[${i}].id`),
        title: requireString(door.title, `content.doors[${i}].title`),
        text: requireString(door.text, `content.doors[${i}].text`),
      };
    }),
    stories: requireArray(doc.stories, "content.stories").map((s, i) =>
      validateStory(s, i, assets),
    ),
    quest: {
      title: requireString(quest.title, "content.quest.title"),
      modules: requireArray(quest.modules, "content.quest.modules").map((m, i) => {
        const module = requireRecord(m, `content.quest.modules[${i}]`);
        return {
          id: requireModuleId(module.id, `content.quest.modules[${i}].id`),
          label: requireString(module.label, `content.quest.modules[${i}].label`),
          source: requireString(module.source, `content.quest.modules[${i}].source`),
          english:
            module.english === undefined
              ? undefined
              : requireString(module.english, `content.quest.modules[${i}].english`),
          color:
            module.color === undefined
              ? undefined
              : requireString(module.color, `content.quest.modules[${i}].color`),
          description:
            module.description === undefined
              ? undefined
              : requireString(module.description, `content.quest.modules[${i}].description`),
          analogy:
            module.analogy === undefined
              ? undefined
              : requireString(module.analogy, `content.quest.modules[${i}].analogy`),
        };
      }),
      instructions: requireArray(quest.instructions, "content.quest.instructions").map((t, i) =>
        requireString(t, `content.quest.instructions[${i}]`),
      ),
    },
    ui: {
      enter: requireString(ui.enter, "content.ui.enter"),
      back: requireString(ui.back, "content.ui.back"),
      help: requireString(ui.help, "content.ui.help"),
      helpLines: requireArray(ui.helpLines, "content.ui.helpLines").map((l, i) =>
        requireString(l, `content.ui.helpLines[${i}]`),
      ),
      assemblyHelp: requireString(ui.assemblyHelp, "content.ui.assemblyHelp"),
      outside: requireString(ui.outside, "content.ui.outside"),
      unreachable: requireString(ui.unreachable, "content.ui.unreachable"),
      repairNeeded: requireString(ui.repairNeeded, "content.ui.repairNeeded"),
      reset: requireString(ui.reset, "content.ui.reset"),
      resetConfirm: requireString(ui.resetConfirm, "content.ui.resetConfirm"),
      languageNote: requireString(ui.languageNote, "content.ui.languageNote"),
    },
  };
}

function validateAction(raw: unknown, path: string, manifest: WorldManifest): SceneAction {
  const action = requireRecord(raw, path);
  return {
    frame: requireFrameRef(manifest, action.frame, `${path}.frame`),
    seatPosition:
      action.seatPosition === undefined
        ? undefined
        : requirePoint(action.seatPosition, `${path}.seatPosition`),
    seatAnchorSource:
      action.seatAnchorSource === undefined
        ? undefined
        : requirePoint(action.seatAnchorSource, `${path}.seatAnchorSource`),
    height: requirePositive(action.height, `${path}.height`),
    depth: action.depth === undefined ? undefined : requireNumber(action.depth, `${path}.depth`),
  };
}

function validateHotspot(
  raw: unknown,
  index: number,
  manifest: WorldManifest,
): Hotspot {
  const path = `scene.hotspots[${index}]`;
  const hotspot = requireRecord(raw, path);
  const kind = requireString(hotspot.kind, `${path}.kind`) as HotspotKind;
  if (!HOTSPOT_KINDS.includes(kind)) fail(`${path}.kind is unknown`);
  return {
    id: requireString(hotspot.id, `${path}.id`),
    label: requireString(hotspot.label, `${path}.label`),
    rect: requireRect(hotspot.rect, `${path}.rect`),
    approach: requirePoint(hotspot.approach, `${path}.approach`),
    kind,
    contentId:
      hotspot.contentId === undefined
        ? undefined
        : requireString(hotspot.contentId, `${path}.contentId`),
    moduleId:
      hotspot.moduleId === undefined
        ? undefined
        : requireModuleId(hotspot.moduleId, `${path}.moduleId`),
    pickupHidden:
      hotspot.pickupHidden === undefined
        ? undefined
        : requireBoolean(hotspot.pickupHidden, `${path}.pickupHidden`),
    pickupAnchor:
      hotspot.pickupAnchor === undefined
        ? undefined
        : requirePoint(hotspot.pickupAnchor, `${path}.pickupAnchor`),
    nextSceneId:
      hotspot.nextSceneId === undefined
        ? undefined
        : requireString(hotspot.nextSceneId, `${path}.nextSceneId`),
  };
}

function validateProp(raw: unknown, index: number, manifest: WorldManifest): SceneProp {
  const path = `scene.props[${index}]`;
  const prop = requireRecord(raw, path);
  return {
    id: requireString(prop.id, `${path}.id`),
    frame: requireFrameRef(manifest, prop.frame, `${path}.frame`),
    position: requirePoint(prop.position, `${path}.position`),
    width: requirePositive(prop.width, `${path}.width`),
    depth: requireNumber(prop.depth, `${path}.depth`),
  };
}

function validateAssemblyModule(
  raw: unknown,
  index: number,
  manifest: WorldManifest,
): AssemblyModule {
  const path = `scene.assembly.modules[${index}]`;
  const module = requireRecord(raw, path);
  return {
    id: requireModuleId(module.id, `${path}.id`),
    frame: requireFrameRef(manifest, module.frame, `${path}.frame`),
    rect: requireRect(module.rect, `${path}.rect`),
    socket: requirePoint(module.socket, `${path}.socket`),
    snapRadius: requirePositive(module.snapRadius, `${path}.snapRadius`),
  };
}

function validateAssemblyGrid(raw: unknown, moduleIds: readonly ModuleId[]): AssemblyGrid {
  const grid = requireRecord(raw, "scene.assembly.grid");
  const rows = requirePositive(grid.rows, "scene.assembly.grid.rows");
  const cols = requirePositive(grid.cols, "scene.assembly.grid.cols");
  const cellsRaw = requireRecord(grid.cells, "scene.assembly.grid.cells");
  const cells: Record<string, Point> = {};
  for (const [key, value] of Object.entries(cellsRaw)) {
    if (key !== "body" && !MODULE_IDS.includes(key as ModuleId)) {
      fail(`scene.assembly.grid.cells.${key} is not a body/module id`);
    }
    const cell = requirePoint(value, `scene.assembly.grid.cells.${key}`);
    if (cell[0] < 0 || cell[0] >= rows || cell[1] < 0 || cell[1] >= cols) {
      fail(`scene.assembly.grid.cells.${key} is outside the ${rows}x${cols} grid`);
    }
    cells[key] = cell;
  }
  // "body" is both a module and the pre-seated grid piece — dedupe.
  const required = [...new Set(["body", ...moduleIds])] as const;
  for (const key of required) {
    if (!cells[key]) fail(`scene.assembly.grid.cells is missing "${key}"`);
  }
  const seen = new Set<string>();
  for (const key of required) {
    const cellKey = `${cells[key][0]}-${cells[key][1]}`;
    if (seen.has(cellKey)) fail(`scene.assembly.grid cells overlap at ${cellKey}`);
    seen.add(cellKey);
  }
  return { rows, cols, cells: cells as AssemblyGrid["cells"] };
}

function validateScene(raw: unknown, manifest: WorldManifest): SceneDefinition {
  const doc = requireRecord(raw, "scene");
  if (doc.schemaVersion !== 1) fail("scene schemaVersion must be 1");
  const nav = requireRecord(doc.nav, "scene.nav");
  const nodesRaw = requireRecord(nav.nodes, "scene.nav.nodes");
  const nodes: Record<string, Point> = {};
  for (const [id, value] of Object.entries(nodesRaw)) {
    nodes[id] = requirePoint(value, `scene.nav.nodes.${id}`);
  }
  if (Object.keys(nodes).length === 0) fail("scene.nav.nodes must not be empty");
  const edges = requireArray(nav.edges, "scene.nav.edges").map((edge, i) => {
    const pair = requireArray(edge, `scene.nav.edges[${i}]`);
    if (pair.length !== 2) fail(`scene.nav.edges[${i}] must name two nodes`);
    const a = requireString(pair[0], `scene.nav.edges[${i}][0]`);
    const b = requireString(pair[1], `scene.nav.edges[${i}][1]`);
    if (!nodes[a]) fail(`scene.nav.edges[${i}] references unknown node "${a}"`);
    if (!nodes[b]) fail(`scene.nav.edges[${i}] references unknown node "${b}"`);
    return [a, b] as const;
  });

  const actionsRaw = requireRecord(doc.actions, "scene.actions");
  const actions: Record<string, SceneAction> = {};
  for (const [id, value] of Object.entries(actionsRaw)) {
    actions[id] = validateAction(value, `scene.actions.${id}`, manifest);
  }

  const hotspots = requireArray(doc.hotspots, "scene.hotspots").map((h, i) =>
    validateHotspot(h, i, manifest),
  );
  const hotspotIds = new Set<string>();
  for (const hotspot of hotspots) {
    if (hotspotIds.has(hotspot.id)) fail(`duplicate hotspot id "${hotspot.id}"`);
    hotspotIds.add(hotspot.id);
  }

  const rackDisplay = requireRecord(doc.rackDisplay, "scene.rackDisplay");
  const assembly = requireRecord(doc.assembly, "scene.assembly");
  const body = requireRecord(assembly.body, "scene.assembly.body");
  const complete = requireRecord(assembly.complete, "scene.assembly.complete");

  return {
    schemaVersion: 1,
    id: requireString(doc.id, "scene.id"),
    size: requirePoint(doc.size, "scene.size"),
    background: requireAssetRef(manifest.assets, doc.background, "scene.background"),
    walkable: requireArray(doc.walkable, "scene.walkable").map((p, i) =>
      requirePoint(p, `scene.walkable[${i}]`),
    ),
    obstacles: requireArray(doc.obstacles, "scene.obstacles").map((poly, i) => {
      const points = requireArray(poly, `scene.obstacles[${i}]`);
      if (points.length < 3) fail(`scene.obstacles[${i}] needs at least 3 points`);
      return points.map((p, j) => requirePoint(p, `scene.obstacles[${i}][${j}]`));
    }),
    footRadius: doc.footRadius === undefined ? undefined : requirePositive(doc.footRadius, "scene.footRadius"),
    speed: requirePositive(doc.speed, "scene.speed"),
    spawn: requirePoint(doc.spawn, "scene.spawn"),
    actorHeight: requirePositive(doc.actorHeight, "scene.actorHeight"),
    nav: { nodes, edges },
    props: requireArray(doc.props, "scene.props").map((p, i) => validateProp(p, i, manifest)),
    hotspots,
    actions,
    rackDisplay: {
      frame: requireFrameRef(manifest, rackDisplay.frame, "scene.rackDisplay.frame"),
      rect: requireRect(rackDisplay.rect, "scene.rackDisplay.rect"),
    },
    workbenchDisplay: (() => {
      const wb = requireRecord(doc.workbenchDisplay, "scene.workbenchDisplay");
      return {
        frame: requireFrameRef(manifest, wb.frame, "scene.workbenchDisplay.frame"),
        rect: requireRect(wb.rect, "scene.workbenchDisplay.rect"),
      };
    })(),
    trySpot: requirePoint(doc.trySpot, "scene.trySpot"),
    assembly: {
      size: requirePoint(assembly.size, "scene.assembly.size"),
      body: {
        frame: requireFrameRef(manifest, body.frame, "scene.assembly.body.frame"),
        rect: requireRect(body.rect, "scene.assembly.body.rect"),
      },
      modules: requireArray(assembly.modules, "scene.assembly.modules").map((m, i) =>
        validateAssemblyModule(m, i, manifest),
      ),
      complete: {
        frame: requireFrameRef(manifest, complete.frame, "scene.assembly.complete.frame"),
        rect: requireRect(complete.rect, "scene.assembly.complete.rect"),
      },
      grid: validateAssemblyGrid(assembly.grid, MODULE_IDS),
    },
    layoutNotes: Array.isArray(doc.layoutNotes)
      ? doc.layoutNotes.map((n, i) => requireString(n, `scene.layoutNotes[${i}]`))
      : undefined,
  };
}

async function fetchJson(fetcher: typeof fetch, url: string): Promise<unknown> {
  const response = await fetcher(url);
  if (!response.ok) throw new Error(`Failed to load ${url}: HTTP ${response.status}`);
  return response.json();
}

/** The landing page only requests manifest.json and the content JSON. */
export async function loadWorldContent(
  fetcher: typeof fetch = fetch,
): Promise<WorldContentBundle> {
  const manifest = validateManifest(await fetchJson(fetcher, assetUrl("manifest.json")));
  const content = validateContent(
    await fetchJson(fetcher, assetUrl(manifest.contentPath)),
    manifest,
  );
  return { manifest, content };
}

/** The workshop requests scene.json in addition to the landing data. */
export async function loadWorldData(
  fetcher: typeof fetch = fetch,
): Promise<WorldBundle> {
  const bundle = await loadWorldContent(fetcher);
  const scene = validateScene(
    await fetchJson(fetcher, assetUrl(bundle.manifest.scenePath)),
    bundle.manifest,
  );
  return { ...bundle, scene };
}

export type AssetLoader = (url: string) => Promise<void>;

export function loadImage(url: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve();
    image.onerror = () => reject(new Error(`Failed to load image: ${url}`));
    image.src = url;
  });
}

export async function preloadAssets(
  bundle: WorldBundle | WorldContentBundle,
  ids: string[],
  loader: AssetLoader = loadImage,
): Promise<void> {
  const urls = [...new Set(ids.map((id) => {
    const asset = bundle.manifest.assets[id];
    if (!asset) throw new Error(`Unknown asset: ${id}`);
    return assetUrl(asset.path);
  }))];
  await Promise.all(urls.map((url) => loader(url)));
}

export function preloadCoreAssets(
  bundle: WorldBundle,
  loader: AssetLoader = loadImage,
): Promise<void> {
  return preloadAssets(bundle, bundle.manifest.coreAssets, loader);
}
