import { afterEach, describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { bundle, scene } from "../testFixtures";
import type { Point } from "../types";
import { MODULE_IDS } from "../quest/quest";
import { advanceMotion, findPath, type MotionState } from "./navigation";
import { isSegmentClear } from "./geometry";
import { ACTION_DURATIONS } from "./petFrames";
import { createRuntimeStore, RuntimeStoreContext } from "./runtimeStore";
import { SceneView } from "./SceneView";
import { Sprite } from "./Sprite";

afterEach(() => {
  vi.useRealTimers();
});

describe("advanceMotion", () => {
  it("caps a huge frame gap at 100 ms of travel", () => {
    const start: Point = [950, 714];
    const path = findPath(start, [1190, 714], scene);
    expect(path).not.toBeNull();
    const motion: MotionState = {
      position: start,
      direction: "se",
      target: { token: 7, path: path! },
    };
    const result = advanceMotion(motion, 5000, scene);
    const travelled = Math.hypot(
      result.motion.position[0] - start[0],
      result.motion.position[1] - start[1],
    );
    // The walk speed is 228 px/s (scene.json): 100 ms of budget = 22.8 px.
    expect(travelled).toBeLessThanOrEqual(22.81);
    expect(result.arrived).toBeUndefined();
    expect(isSegmentClear(start, result.motion.position, scene)).toBe(true);
  });

  it("fires arrival exactly once on the final frame", () => {
    const start: Point = [790, 630];
    const end: Point = [794, 634];
    expect(isSegmentClear(start, end, scene)).toBe(true);
    const first = advanceMotion(
      { position: start, direction: "se", target: { token: 3, path: [start, end] } },
      100,
      scene,
    );
    expect(first.arrived).toEqual({ token: 3, hotspotId: undefined });
    expect(first.motion.position).toEqual(end);
    const second = advanceMotion(first.motion, 100, scene);
    expect(second.arrived).toBeUndefined();
  });

  // Back views have no idle animation, so arrivals settle front-facing.
  it("turns back-view walks front-facing on arrival", () => {
    expect(isSegmentClear([790, 630], [786, 626], scene)).toBe(true);
    const northWest = advanceMotion(
      {
        position: [790, 630],
        direction: "nw",
        target: { token: 1, path: [[790, 630], [786, 626]] },
      },
      100,
      scene,
    );
    expect(northWest.arrived?.token).toBe(1);
    expect(northWest.motion.direction).toBe("sw");
    expect(northWest.motion.target).toBeNull();

    expect(isSegmentClear([790, 630], [794, 626], scene)).toBe(true);
    const northEast = advanceMotion(
      {
        position: [790, 630],
        direction: "ne",
        target: { token: 2, path: [[790, 630], [794, 626]] },
      },
      100,
      scene,
    );
    expect(northEast.arrived?.token).toBe(2);
    expect(northEast.motion.direction).toBe("se");
  });

  it("cancels when a segment is no longer legal", () => {
    const start: Point = [950, 714];
    const result = advanceMotion(
      {
        position: start,
        direction: "se",
        target: { token: 1, path: [start, [1190, 714]] },
      },
      100,
      scene,
    );
    expect(result.motion.target).toBeNull();
    expect(result.motion.position).toEqual(start);
    expect(result.arrived).toBeUndefined();
  });

  it("walks a full legal route without ever crossing an obstacle", () => {
    const goal = scene.nav.nodes.lounge;
    const path = findPath(scene.spawn, goal, scene);
    expect(path).not.toBeNull();
    let motion: MotionState = {
      position: scene.spawn,
      direction: "se",
      target: { token: 9, path: path! },
    };
    let arrivals = 0;
    for (let i = 0; i < 400 && motion.target; i += 1) {
      const previous = motion.position;
      const step = advanceMotion(motion, 100, scene);
      expect(isSegmentClear(previous, step.motion.position, scene)).toBe(true);
      if (step.arrived) arrivals += 1;
      motion = step.motion;
    }
    expect(arrivals).toBe(1);
    expect(motion.target).toBeNull();
    expect(motion.position).toEqual(goal);
  });
});

describe("runtimeStore", () => {
  it("ignores the stale arrival token after a new destination", () => {
    const store = createRuntimeStore(scene);
    store.getState().requestMove(scene.nav.nodes.toolbox, "toolbox");
    const first = store.getState().motion.target?.token;
    expect(first).toBeDefined();
    store.getState().requestMove(scene.nav.nodes.window, "window");
    const second = store.getState().motion.target?.token;
    expect(second).toBeDefined();
    expect(second).not.toBe(first);

    store.getState().arrive(first!, "toolbox");
    expect(store.getState().pendingArrival).toBeNull();
    store.getState().arrive(second!, "window");
    expect(store.getState().pendingArrival).toEqual({ token: second, hotspotId: "window" });
  });

  it("stops movement when a panel opens", () => {
    const store = createRuntimeStore(scene);
    store.getState().requestMove(scene.nav.nodes.rack, "rack");
    expect(store.getState().motion.target).not.toBeNull();
    store.getState().setOverlay({ kind: "task" });
    expect(store.getState().overlay).toEqual({ kind: "task" });
    expect(store.getState().motion.target).toBeNull();
  });

  it("keeps position and reports unreachable targets", () => {
    const store = createRuntimeStore(scene);
    store.getState().requestMove([40, 40]);
    expect(store.getState().motion.position).toEqual(scene.spawn);
    expect(store.getState().motion.target).toBeNull();
    expect(store.getState().notice).toBe("unreachable");
  });

  it("ends a daily pose even when the new destination is unreachable", () => {
    const store = createRuntimeStore(scene);
    store.getState().setPose("sit");
    store.getState().requestMove([40, 40]);
    expect(store.getState().pose).toBe("se");
    expect(store.getState().notice).toBe("unreachable");
  });
});

function renderScene() {
  const store = createRuntimeStore(scene);
  const view = render(
    <RuntimeStoreContext.Provider value={store}>
      <SceneView bundle={bundle} />
    </RuntimeStoreContext.Provider>,
  );
  return { store, ...view };
}

function actorFrame(container: HTMLElement) {
  return container.querySelector(".world-actor svg[data-frame]") as SVGElement | null;
}

/** The animated strip div used while walking, idling or playing an action. */
function spriteOf(container: HTMLElement) {
  return container.querySelector(".world-actor [data-sprite-anim]") as HTMLElement | null;
}

function animName(container: HTMLElement) {
  return spriteOf(container)?.getAttribute("data-sprite-anim") ?? null;
}

/** Facing a direction without movement, so the idle strip is selected. */
function face(
  store: ReturnType<typeof createRuntimeStore>,
  direction: "sw" | "nw" | "ne" | "se",
) {
  act(() =>
    store.setState({
      motion: { position: scene.spawn, direction, target: null },
    }),
  );
}

describe("character presentation", () => {
  // Kills a renderer that always draws one standing frame or lets the foot
  // anchor move between direction frames.
  it("walks with a strip per direction and idles without moving the feet", () => {
    const { store, container } = renderScene();

    act(() => store.getState().requestMove(scene.nav.nodes.window));
    expect(store.getState().motion.direction).toBe("nw");
    expect(animName(container)).toBe("tuvis2d-walk-nw");
    expect(spriteOf(container)!.style.animation).toContain("world-sprite-frames");

    act(() => store.getState().requestMove(scene.nav.nodes.posters));
    expect(store.getState().motion.direction).toBe("ne");
    expect(animName(container)).toBe("tuvis2d-walk-ne");

    const { left, top } = spriteOf(container)!.style;
    face(store, "sw");
    expect(animName(container)).toBe("tuvis2d-idle-sw");
    expect(spriteOf(container)!.style.transform).not.toContain("scaleX(-1)");
    expect(spriteOf(container)!.style.animation).toContain("infinite");

    face(store, "se");
    expect(animName(container)).toBe("tuvis2d-idle-sw"); // SE mirrors the SW idle strip
    expect(spriteOf(container)!.style.transform).toContain("scaleX(-1)");

    face(store, "nw");
    expect(animName(container)).toBe("tuvis2d-walk-nw"); // back view holds walk frame 0
    expect(spriteOf(container)!.style.animation).toBe("");
    expect(spriteOf(container)!.style.backgroundPositionX).toBe("0%");

    // Feet stay planted across directions: each strip carries its measured
    // ground anchor (petFrames.ts), so the translate differs per direction.
    const ANCHOR_TRANSFORM = {
      sw: "translate(-47.80%, -94.20%)",
      se: "translate(-47.80%, -94.20%)", // mirrored idle-sw
      nw: "translate(-53.20%, -79.60%)", // back-view strips were swapped to match facing
      ne: "translate(-51.00%, -84.40%)",
    } as const;
    for (const direction of ["sw", "nw", "ne", "se"] as const) {
      face(store, direction);
      const sprite = spriteOf(container)!;
      expect(sprite.style.left).toBe(left);
      expect(sprite.style.top).toBe(top);
      expect(sprite.style.transform).toContain(ANCHOR_TRANSFORM[direction]);
    }
  });

  // Kills reusing the strip height for daily poses, or action heights while standing.
  it("uses the tall strip while standing and action heights for daily poses", () => {
    const { store, container } = renderScene();
    const heightFor = (height: number) => `${(height / scene.size[1]) * 100}%`;

    expect(animName(container)).toBe("tuvis2d-idle-sw");
    expect(spriteOf(container)!.style.height).toBe(heightFor(205)); // 2.5D strip height
    expect(actorFrame(container)).toBeNull();

    act(() => store.setState({ pose: "coffee" }));
    expect(actorFrame(container)).toHaveAttribute("data-frame", "coffee");
    expect(actorFrame(container)!.style.height).toBe(heightFor(scene.actions.coffee.height));
    expect(spriteOf(container)).toBeNull();

    act(() => store.setState({ pose: "display" }));
    expect(actorFrame(container)!.style.height).toBe(heightFor(scene.actions.display.height));

    act(() => store.setState({ pose: "sit" }));
    expect(actorFrame(container)).toHaveAttribute("data-frame", "sit");
    expect(actorFrame(container)!.style.height).toBe(heightFor(scene.actions.sit.height));

    act(() => store.setState({ pose: "nw" }));
    expect(actorFrame(container)).toBeNull();
    expect(spriteOf(container)!.style.height).toBe(heightFor(205));
  });

  // One-shot actions override walk and idle, then clear on their own schedule.
  it("overrides walk and idle with one-shot actions until they end", () => {
    vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"] });
    const { store, container } = renderScene();

    act(() => store.getState().requestMove(scene.nav.nodes.window));
    expect(animName(container)).toBe("tuvis2d-walk-nw");

    act(() => store.getState().triggerAction("jump"));
    expect(animName(container)).toBe("tuvis2d-jump-se");
    expect(spriteOf(container)!.style.animation).toContain("1 forwards");
    act(() => vi.advanceTimersByTime(ACTION_DURATIONS.jump));
    expect(animName(container)).toBe("tuvis2d-walk-nw"); // back to walking

    act(() => store.getState().cancelMovement());
    expect(animName(container)).toBe("tuvis2d-walk-nw"); // static idle facing nw
    expect(spriteOf(container)!.style.animation).toBe("");

    act(() => store.getState().triggerAction("pickup"));
    expect(animName(container)).toBe("tuvis2d-pickup-se");
    act(() => vi.advanceTimersByTime(ACTION_DURATIONS.pickup));
    expect(animName(container)).toBe("tuvis2d-walk-nw");
  });

  it("mirrors the SE action strip while facing SW", () => {
    const { store, container } = renderScene();
    face(store, "sw");
    act(() => store.getState().triggerAction("celebrate"));
    expect(animName(container)).toBe("tuvis2d-celebrate-se");
    expect(spriteOf(container)!.style.transform).toContain("scaleX(-1)");
  });

  // Clicking the character opens an emote menu on a dedicated hit layer; the
  // sprite itself stopped taking clicks.
  it("opens the emote menu from the actor hit layer and plays the chosen jump once", () => {
    const { store, container } = renderScene();
    const hit = container.querySelector("[data-actor-hit]") as HTMLElement;
    expect(hit).not.toBeNull();
    expect(hit.style.zIndex).toBe("1100");

    // The sprite no longer receives clicks of its own.
    fireEvent.click(spriteOf(container)!);
    expect(store.getState().action).toBeNull();
    expect(document.querySelector(".world-emote-menu")).toBeNull();

    fireEvent.click(hit);
    expect(document.querySelector(".world-emote-menu")).not.toBeNull();
    expect(screen.getByRole("button", { name: "跳一跳" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "庆祝一下" })).toBeInTheDocument();
    // The fire emote needs the assembled buster.
    expect(screen.queryByRole("button", { name: "试试武器" })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "跳一跳" }));
    expect(store.getState().action).toEqual({ kind: "jump", id: 1 });
    expect(animName(container)).toBe("tuvis2d-jump-se");
    expect(store.getState().motion.target).toBeNull();
    // Choosing an emote closes the menu.
    expect(document.querySelector(".world-emote-menu")).toBeNull();

    // While the jump is still playing, another click neither reopens nor retrigger.
    fireEvent.click(hit);
    expect(document.querySelector(".world-emote-menu")).toBeNull();
    expect(store.getState().action).toEqual({ kind: "jump", id: 1 });
  });

  it("closes the emote menu when the character starts walking", () => {
    const { store, container } = renderScene();
    fireEvent.click(container.querySelector("[data-actor-hit]")!);
    expect(document.querySelector(".world-emote-menu")).not.toBeNull();
    act(() => store.getState().requestMove(scene.nav.nodes.center));
    expect(document.querySelector(".world-emote-menu")).toBeNull();
  });

  it("offers the fire emote once assembled and loops it for two seconds", () => {
    vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"] });
    const { store, container } = renderScene();
    act(() => {
      for (const moduleId of MODULE_IDS) {
        store.getState().dispatchQuest({ type: "COLLECT", moduleId });
      }
      for (const moduleId of MODULE_IDS) {
        store.getState().dispatchQuest({ type: "INSTALL", moduleId });
      }
    });

    fireEvent.click(container.querySelector("[data-actor-hit]")!);
    fireEvent.click(screen.getByRole("button", { name: "试试武器" }));
    expect(store.getState().action).toEqual({ kind: "fire", id: 1 });
    expect(animName(container)).toBe("tuvis2d-fire-se");
    // The try-fire loops for its whole window instead of playing once.
    expect(spriteOf(container)!.style.animation).toContain("infinite");
    expect(ACTION_DURATIONS.fire).toBe(2000);
    // Firing from the emote menu also marks the weapon as tried.
    expect(store.getState().quest.weaponTried).toBe(true);
    act(() => vi.advanceTimersByTime(ACTION_DURATIONS.fire));
    expect(store.getState().action).toBeNull();
  });
});

describe("Sprite", () => {
  it("uses the supplied sourceRect and keeps the foot anchor fixed", () => {
    const { container, rerender } = render(
      <Sprite
        manifest={bundle.manifest}
        frameId="sw"
        position={[300, 400]}
        height={190}
        zIndex={400}
        stage={[1536, 1024]}
      />,
    );
    const svg = container.querySelector("svg")!;
    expect(svg.getAttribute("viewBox")).toBe("215 652 289 586");
    expect(svg.style.left).toBe("19.53125%");
    expect(svg.style.top).toBe("39.0625%");
    expect(svg.style.transform).toContain("translate(-69.896");
    expect(svg.style.zIndex).toBe("400");

    rerender(
      <Sprite
        manifest={bundle.manifest}
        frameId="nw"
        position={[300, 400]}
        height={190}
        zIndex={400}
        stage={[1536, 1024]}
      />,
    );
    const next = container.querySelector("svg")!;
    expect(next.getAttribute("viewBox")).toBe("224 4 297 648");
    expect(next.style.left).toBe("19.53125%");
    expect(next.style.top).toBe("39.0625%");
    expect(next.style.transform).toContain("translate(-40.067");
  });
});
