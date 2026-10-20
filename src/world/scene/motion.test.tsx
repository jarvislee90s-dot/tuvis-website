import { describe, expect, it } from "vitest";
import { render } from "@testing-library/react";
import { bundle, scene } from "../testFixtures";
import type { Point } from "../types";
import { advanceMotion, findPath, type MotionState } from "./navigation";
import { isSegmentClear } from "./geometry";
import { createRuntimeStore } from "./runtimeStore";
import { Sprite } from "./Sprite";

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
    expect(travelled).toBeLessThanOrEqual(19.01);
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
    store.getState().setOverlay({ kind: "help" });
    expect(store.getState().overlay).toEqual({ kind: "help" });
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
