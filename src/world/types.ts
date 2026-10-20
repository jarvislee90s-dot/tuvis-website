/**
 * Types mirroring tuvis-world/05_handoff/v1/{manifest,scene}.json and
 * content/world.zh.json. Validation of the raw JSON lives in
 * src/world/assets/loadWorldData.ts; these types describe validated data.
 */

export type Point = readonly [number, number];
export type Rect = readonly [number, number, number, number];
export type Direction = "nw" | "ne" | "sw" | "se";
export type ModuleId = "sight" | "cell" | "emitter";

export type ContentOverlay =
  | { kind: "equipment"; id?: string }
  | { kind: "world"; id?: string }
  | { kind: "stories"; id?: string }
  | { kind: "door"; id?: string }
  | { kind: "help" };

export type Overlay =
  | null
  | ContentOverlay
  | { kind: "task" | "repair" | "assembly" }
  | { kind: "pickup"; moduleId: ModuleId };

export type AssetDefinition = {
  path: string;
  width: number;
  height: number;
  alpha: boolean;
  sha256: string;
};

export type FrameDefinition = {
  asset: string;
  sourceRect: Rect;
  /** Normalized [0,1] anchor inside the cropped frame. */
  anchor: Point;
};

export type WorldManifest = {
  schemaVersion: number;
  packVersion: string;
  assets: Record<string, AssetDefinition>;
  frames: Record<string, FrameDefinition>;
  coreAssets: string[];
  contentPath: string;
  scenePath: string;
  notes?: string[];
};

export type SceneAction = {
  frame: string;
  seatPosition?: Point;
  seatAnchorSource?: Point;
  height: number;
  depth?: number;
};

export type HotspotKind =
  | "workbench"
  | "equipment"
  | "world"
  | "coffee"
  | "stories"
  | "rack"
  | "sit"
  | "door";

export type Hotspot = {
  id: string;
  label: string;
  rect: Rect;
  approach: Point;
  kind: HotspotKind;
  contentId?: string;
  moduleId?: ModuleId;
  /** The module is concealed (in a box): no floating part, arrival opens it. */
  pickupHidden?: boolean;
  nextSceneId?: string;
};

export type SceneProp = {
  id: string;
  frame: string;
  position: Point;
  width: number;
  depth: number;
};

export type AssemblyModule = {
  id: ModuleId;
  frame: string;
  rect: Rect;
  socket: Point;
  snapRadius: number;
};

/**
 * 3x3 grid layout of the assembly close-up. Cells hold [row, col]; only the
 * body and the three modules occupy cells, the rest stay empty.
 */
export type AssemblyGrid = {
  rows: number;
  cols: number;
  cells: Record<"body" | ModuleId, Point>;
};

export type SceneDefinition = {
  schemaVersion: number;
  id: string;
  size: Point;
  background: string;
  walkable: Point[];
  obstacles: Point[][];
  footRadius?: number;
  speed: number;
  spawn: Point;
  actorHeight: number;
  nav: {
    nodes: Record<string, Point>;
    edges: ReadonlyArray<readonly [string, string]>;
  };
  props: SceneProp[];
  hotspots: Hotspot[];
  actions: Record<string, SceneAction>;
  rackDisplay: { frame: string; rect: Rect };
  assembly: {
    size: Point;
    body: { frame: string; rect: Rect };
    modules: AssemblyModule[];
    complete: { frame: string; rect: Rect };
    grid: AssemblyGrid;
  };
  layoutNotes?: string[];
};

export type EquipmentEntry = {
  id: string;
  name: string;
  english: string;
  color: string;
  sourceRect: Rect;
  asset: string;
  description: string;
  analogy: string;
};

export type WorldEntry = {
  id: string;
  title: string;
  asset: string;
  text: string;
};

export type DoorEntry = {
  id: string;
  title: string;
  text: string;
};

export type StoryEntry = {
  id: string;
  title: string;
  asset: string;
  summary: string;
  status: string;
};

export type WorldContent = {
  schemaVersion: number;
  title: string;
  intro: string;
  heroAsset: string;
  cityAsset: string;
  workshopPreviewAsset: string;
  character: {
    name: string;
    subtitle: string;
    intro: string;
    tags: string[];
    features: Array<{ title: string; text: string }>;
  };
  equipment: EquipmentEntry[];
  world: WorldEntry[];
  doors: DoorEntry[];
  stories: StoryEntry[];
  quest: {
    title: string;
    modules: Array<{
      id: ModuleId;
      label: string;
      source: string;
      /** Optional pickup-panel detail; content pack is Chinese-only today. */
      english?: string;
      color?: string;
      description?: string;
      analogy?: string;
    }>;
    instructions: string[];
  };
  ui: {
    enter: string;
    back: string;
    help: string;
    helpLines: string[];
    assemblyHelp: string;
    outside: string;
    unreachable: string;
    repairNeeded: string;
    reset: string;
    resetConfirm: string;
    languageNote: string;
  };
};

export type WorldContentBundle = {
  manifest: WorldManifest;
  content: WorldContent;
};

export type WorldBundle = WorldContentBundle & { scene: SceneDefinition };
